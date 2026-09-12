// Il superstite: movimento, urti, animazione.

import * as schermo from "../motore/schermo.js";
import * as comandi from "../motore/comandi.js";
import * as mappa from "../mondo/mappa.js";
import { cuoci, riflesso, telaio } from "../arte/sprite.js";
import * as arte from "../arte/sprite-personaggi.js";

const { TASSELLO } = schermo;

export const TIPO = "giocatore";

const VELOCITA = 52; // pixel al secondo
const VELOCITA_CORSA = 92;

// Il rettangolo d'urto è molto più piccolo dello sprite e sta ai piedi. In una
// vista dall'alto 3/4 il busto è disegnato "davanti" al terreno che occupa, non
// sopra: far collidere anche la testa darebbe la sensazione di un personaggio
// grasso il doppio di quello che si vede.
const LARGHEZZA_URTO = 10;
const ALTEZZA_URTO = 7;

// Un fotogramma di camminata ogni tot pixel percorsi, non ogni tot secondi:
// così l'animazione resta agganciata al passo anche quando si corre, invece di
// scivolare come su ghiaccio.
const PIXEL_PER_FOTOGRAMMA = 7;

// --- urti -----------------------------------------------------------------

function liberoIn(x, y) {
  const sinistra = x - LARGHEZZA_URTO / 2;
  const destra = x + LARGHEZZA_URTO / 2 - 0.001;
  const sopra = y - ALTEZZA_URTO;
  const sotto = y - 0.001;

  const txPrimo = Math.floor(sinistra / TASSELLO);
  const txUltimo = Math.floor(destra / TASSELLO);
  const tyPrimo = Math.floor(sopra / TASSELLO);
  const tyUltimo = Math.floor(sotto / TASSELLO);

  for (let ty = tyPrimo; ty <= tyUltimo; ty += 1) {
    for (let tx = txPrimo; tx <= txUltimo; tx += 1) {
      if (mappa.solidoIn(tx, ty)) return false;
    }
  }
  return true;
}

// I due assi si risolvono separatamente: è ciò che permette di scivolare lungo
// un muro invece di incollarcisi. Provando lo spostamento come un unico
// vettore, sfiorare un albero in diagonale fermerebbe del tutto.
function muovi(e, dx, dy) {
  if (dx !== 0 && liberoIn(e.px + dx, e.py)) e.px += dx;
  if (dy !== 0 && liberoIn(e.px, e.py + dy)) e.py += dy;
}

// --- aspetto --------------------------------------------------------------

// Dove sta la mano, in coordinate locali dello sprite 16x24. Una sola per
// direzione e non una per fotogramma: nello sprite del superstite il busto è
// identico in tutti e quattro i fotogrammi di una direzione — cambiano solo le
// gambe — quindi camminando la mano non si muove.
//
// "dietro" dice da che parte dell'ordine di disegno va l'oggetto: di spalle
// una torcia sta dietro al corpo, di fronte e di profilo davanti.
const MANO = {
  giu: { x: 11, y: 6, dietro: false },
  // Di spalle l'oggetto va spostato verso il bordo, non messo in mezzo alle
  // scapole: dietro al busto sparirebbe del tutto, e un oggetto che non si
  // vede è come non averlo disegnato.
  su: { x: 2, y: 6, dietro: true },
  lato: { x: 3, y: 6, dietro: false },
};

// Corpo e oggetto impugnato si compongono in una figura sola, cotta una volta
// e tenuta qui. Le combinazioni sono poche — tre direzioni per quattro
// fotogrammi per i pochi oggetti impugnabili — quindi a regime disegnare il
// superstite con l'ascia in mano costa esattamente quanto disegnarlo a mani
// nude: una drawImage.
//
// Comporre invece di sovrapporre al momento del disegno risolve due cose da
// sé: la profondità, che diventa solo l'ordine dei due disegni, e lo
// specchiamento, perché la direzione destra si ottiene riflettendo la figura
// già composta e non serve calcolare l'aggancio speculare.
const composti = new Map();

function figura(direzione, fotogramma, impugnato) {
  const chiave = `${direzione}|${fotogramma}|${impugnato?.nome ?? ""}`;
  const gia = composti.get(chiave);
  if (gia) return gia;

  const fotogrammi = direzione === "su" ? arte.SU : direzione === "giu" ? arte.GIU : arte.LATO;
  const corpo = cuoci(fotogrammi[fotogramma]);

  if (!impugnato) {
    composti.set(chiave, corpo);
    return corpo;
  }

  const attrezzo = cuoci(impugnato.righe);
  const mano = MANO[direzione];
  const ax = mano.x - Math.floor(attrezzo.width / 2);
  // Ogni oggetto dice da sé quanto in basso sta nel pugno: una torcia si
  // regge alta perché la fiamma deve stare sopra la testa, un'ascia bassa.
  const ay = mano.y + (impugnato.scartoY ?? 0);

  const { canvas, contesto } = telaio(corpo.width, corpo.height);
  if (mano.dietro) {
    contesto.drawImage(attrezzo, ax, ay);
    contesto.drawImage(corpo, 0, 0);
  } else {
    contesto.drawImage(corpo, 0, 0);
    contesto.drawImage(attrezzo, ax, ay);
  }

  composti.set(chiave, canvas);
  return canvas;
}

export function figureComposte() {
  return composti.size;
}

function aggiornaAspetto(e) {
  const fotogramma = Math.floor(e.passo) % 4;
  const direzione = e.guarda === "su" ? "su" : e.guarda === "giu" ? "giu" : "lato";
  const immagine = figura(direzione, fotogramma, e.impugnato ?? null);

  e.sprite = e.guarda === "destra" ? riflesso(immagine) : immagine;
  // Ancorato ai piedi, come gli oggetti della mappa: è quello che fa funzionare
  // l'ordinamento in profondità senza casi speciali.
  e.x = e.px - e.sprite.width / 2;
  e.y = e.py - e.sprite.height;
  e.base = e.py;

  // Dove sta davvero la mano nel mondo. Serve a far uscire la luce della
  // torcia dalla fiamma disegnata invece che da un punto generico sopra la
  // testa. A destra la figura è riflessa, quindi lo è anche la mano.
  const mano = MANO[direzione];
  const manoX = e.guarda === "destra" ? e.sprite.width - mano.x - 1 : mano.x;
  e.impugnatura = { x: e.x + manoX, y: e.y + mano.y + 2 };
}

// --- comportamento --------------------------------------------------------

export function aggiorna(e, passo) {
  const { x, y } = comandi.direzione();
  const velocita = comandi.attiva("corri") ? VELOCITA_CORSA : VELOCITA;

  if (x !== 0 || y !== 0) {
    // La direzione dello sguardo dà la precedenza all'orizzontale: in diagonale
    // il profilo si legge meglio della figura vista di fronte.
    if (x < 0) e.guarda = "sinistra";
    else if (x > 0) e.guarda = "destra";
    else if (y < 0) e.guarda = "su";
    else e.guarda = "giu";

    const primaX = e.px;
    const primaY = e.py;
    muovi(e, x * velocita * passo, y * velocita * passo);
    const percorso = Math.hypot(e.px - primaX, e.py - primaY);
    e.passo += percorso / PIXEL_PER_FOTOGRAMMA;
  } else {
    // Fermi si torna al fotogramma di riposo, non a uno qualsiasi del ciclo.
    e.passo = 0;
  }

  aggiornaAspetto(e);
}

// --- creazione ------------------------------------------------------------

export function crea(px, py) {
  const e = {
    tipo: TIPO,
    px,
    py,
    guarda: "giu",
    passo: 0,
    sprite: null,
    x: 0,
    y: 0,
    base: py,
    // Lo riempie chi orchestra, non il giocatore: sapere cosa c'è nello zaino
    // è una regola di gioco, e le entità stanno sotto le regole.
    impugnato: null,
    impugnatura: { x: px, y: py },
  };
  aggiornaAspetto(e);
  return e;
}

// Cerca un punto di partenza calpestabile a spirale attorno a quello chiesto.
// Il seme decide il terreno, quindi capita benissimo che il centro del mondo
// sia in mezzo a un lago: senza questo, certe valli comincerebbero annegati.
export function puntoDiPartenza(txCentro = 0, tyCentro = 0) {
  for (let raggio = 0; raggio < 120; raggio += 1) {
    for (let dy = -raggio; dy <= raggio; dy += 1) {
      for (let dx = -raggio; dx <= raggio; dx += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== raggio) continue;
        const tx = txCentro + dx;
        const ty = tyCentro + dy;
        if (!mappa.solidoIn(tx, ty)) {
          return { px: tx * TASSELLO + TASSELLO / 2, py: ty * TASSELLO + TASSELLO - 1 };
        }
      }
    }
  }
  return { px: 0, py: 0 };
}

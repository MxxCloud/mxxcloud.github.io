// Lo straniero (il superstite di Ultimo raccolto): movimento, urti, animazione.

import * as schermo from "../motore/schermo.js";
import * as comandi from "../motore/comandi.js";
import * as mappa from "../mondo/mappa.js";
import * as urti from "./urti.js";
import { cuoci, riflesso, telaio } from "../arte/sprite.js";
import * as arte from "../arte/sprite-personaggi.js";
import { CAVALIERE, MANO_IN_SELLA } from "../arte/sprite-cavallo.js";

const { TASSELLO } = schermo;

export const TIPO = "giocatore";

const VELOCITA = 52; // pixel al secondo
const VELOCITA_CORSA = 92;

// A cavallo (Per un pugno di semi W0.6). Il trotto è più della corsa a piedi
// e non costa fiato; il galoppo quasi il doppio, e nemmeno quello costa fiato
// allo straniero — lo paga il chiasso (vedi gioco.js). Il galoppo supera di
// due volte e mezzo chi ti insegue di notte: il cavallo è la prima cosa nel
// gioco che ti lascia attraversare la valle col buio.
export const TROTTO = 110;
export const GALOPPO = 165;
// Le zampe del cavallo hanno due pose e non quattro, e un passo di cavallo è
// lungo: un fotogramma ogni dodici pixel, e allo zoccolo il suono (vedi
// udito.js).
const PIXEL_PER_FOTOGRAMMA_IN_SELLA = 12;

// Quanto si va, a piedi o in sella, di corsa o no. Una funzione e non due
// righe dentro aggiorna() perché si possa controllare senza tastiera.
export function velocitaDi(e, corre) {
  const base = e.aCavallo ? (corre ? GALOPPO : TROTTO) : (corre ? VELOCITA_CORSA : VELOCITA);
  return base * (e.fattoreVelocita ?? 1);
}

// Un fotogramma di camminata ogni tot pixel percorsi, non ogni tot secondi:
// così l'animazione resta agganciata al passo anche quando si corre, invece di
// scivolare come su ghiaccio.
const PIXEL_PER_FOTOGRAMMA = 7;

// --- aspetto --------------------------------------------------------------

// Dove sta la mano, in coordinate locali dello sprite 16x24. Una sola per
// direzione e non una per fotogramma: nello sprite del superstite il busto è
// identico in tutti e quattro i fotogrammi di una direzione — cambiano solo le
// gambe — quindi camminando la mano non si muove.
//
// "dietro" dice da che parte dell'ordine di disegno va l'oggetto. In Ultimo
// raccolto di spalle una torcia stava dietro al corpo; con il poncho (W0.4)
// l'oggetto sta davanti in tutte e tre le direzioni, e il campo resta per il
// giorno in cui una figura più stretta lo vorrà di nuovo.
//
// Esportata per il collaudo che conta quanto di ogni attrezzo resta in vista:
// è così che si è visto che il poncho se li mangiava.
export const MANO = {
  giu: { x: 11, y: 6, dietro: false },
  // Di spalle l'oggetto va spostato verso il bordo, non messo in mezzo alle
  // scapole: dietro al busto sparirebbe del tutto, e un oggetto che non si
  // vede è come non averlo disegnato.
  //
  // Da Per un pugno di semi W0.4 si disegna anche sopra il corpo e non
  // dietro: il poncho arriva quasi al bordo dello sprite, e dietro al poncho
  // la torcia lasciava fuori mezza fiamma e l'ascia niente del tutto.
  // Sporgendo dal fianco si legge come tenuta di lato, che è quello che è.
  su: { x: 2, y: 6, dietro: false },
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

// In sella: il cavaliere è un disegno solo (vedi sprite-cavallo.js), che
// guarda a destra; l'attrezzo in mano si compone sopra come a piedi, alla mano
// del cavaliere. Una torcia a cavallo si vede e fa luce.
function figuraInSella(fotogramma, impugnato) {
  const chiave = `sella|${fotogramma}|${impugnato?.nome ?? ""}`;
  const gia = composti.get(chiave);
  if (gia) return gia;
  const corpo = cuoci(CAVALIERE[fotogramma]);
  if (!impugnato) {
    composti.set(chiave, corpo);
    return corpo;
  }
  const attrezzo = cuoci(impugnato.righe);
  const { canvas, contesto } = telaio(corpo.width, corpo.height);
  contesto.drawImage(corpo, 0, 0);
  contesto.drawImage(attrezzo, MANO_IN_SELLA.x - Math.floor(attrezzo.width / 2), MANO_IN_SELLA.y + (impugnato.scartoY ?? 0));
  composti.set(chiave, canvas);
  return canvas;
}

function aggiornaAspetto(e) {
  if (e.aCavallo) {
    const immagine = figuraInSella(Math.floor(e.passo) % 2, e.impugnato ?? null);
    const aSinistra = e.versoInSella === "sinistra";
    e.sprite = aSinistra ? riflesso(immagine) : immagine;
    e.x = e.px - e.sprite.width / 2;
    e.y = e.py - e.sprite.height;
    e.base = e.py;
    const manoX = aSinistra ? e.sprite.width - MANO_IN_SELLA.x - 1 : MANO_IN_SELLA.x;
    e.impugnatura = { x: e.x + manoX, y: e.y + MANO_IN_SELLA.y + 2 };
    return;
  }
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

  // Quanto si è in forze lo decidono le regole, non l'entità: sapere cos'è
  // la fame è roba di regole/, e le entità stanno sotto le regole. Chi
  // orchestra riempie questi due campi prima di aggiornare.
  const corre = comandi.attiva("corri") && e.puoCorrere !== false;
  const velocita = velocitaDi(e, corre);

  // A cavallo non si corre, si galoppa: "correndo" è la fatica di chi va a
  // piedi (vedi bisogni.js), "galoppa" è soltanto il chiasso.
  e.correndo = corre && (x !== 0 || y !== 0) && !e.aCavallo;
  e.galoppa = corre && (x !== 0 || y !== 0) && Boolean(e.aCavallo);
  e.inMovimento = x !== 0 || y !== 0;

  if (x !== 0 || y !== 0) {
    // La direzione dello sguardo dà la precedenza all'orizzontale: in diagonale
    // il profilo si legge meglio della figura vista di fronte.
    if (x < 0) e.guarda = "sinistra";
    else if (x > 0) e.guarda = "destra";
    else if (y < 0) e.guarda = "su";
    else e.guarda = "giu";
    // Un cavallo si disegna solo di profilo: andando su o giù resta girato
    // dall'ultima parte in cui si andava di lato.
    if (x !== 0) e.versoInSella = x < 0 ? "sinistra" : "destra";

    const percorso = urti.muovi(e, x * velocita * passo, y * velocita * passo);
    e.passo += percorso / (e.aCavallo ? PIXEL_PER_FOTOGRAMMA_IN_SELLA : PIXEL_PER_FOTOGRAMMA);
    // Contro un muro non si galoppa (W0.7): il fiato del cavallo cala per la
    // strada fatta, non per il tasto tenuto premuto.
    if (percorso < 0.01) e.galoppa = false;
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
    fattoreVelocita: 1,
    puoCorrere: true,
    correndo: false,
    inMovimento: false,
    // In sella (W0.6): lo decide chi orchestra, come il resto qui sopra.
    aCavallo: false,
    galoppa: false,
    versoInSella: "destra",
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

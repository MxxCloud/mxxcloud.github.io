// Il superstite: movimento, urti, animazione.

import * as schermo from "../motore/schermo.js";
import * as comandi from "../motore/comandi.js";
import * as mappa from "../mondo/mappa.js";
import * as urti from "./urti.js";
import { cuoci, riflesso, telaio } from "../arte/sprite.js";
import * as arte from "../arte/sprite-personaggi.js";
import { TAVOLOZZA } from "../arte/tavolozza.js";

const { TASSELLO } = schermo;

export const TIPO = "giocatore";

const VELOCITA = 52; // pixel al secondo
const VELOCITA_CORSA = 92;

// Un fotogramma di camminata ogni tot pixel percorsi, non ogni tot secondi:
// così l'animazione resta agganciata al passo anche quando si corre, invece di
// scivolare come su ghiaccio.
const PIXEL_PER_FOTOGRAMMA = 7;

// --- aspetto --------------------------------------------------------------

// Dove sta la mano a riposo, in coordinate locali dello sprite 16x24, una per
// direzione. Fino a M7.18.50 era anche l'unica: il busto era identico in tutti
// i fotogrammi e camminando la mano non si muoveva. Da M7.18.51 le braccia
// oscillano, e gli scarti per posa stanno in SPOSTA_MANO.
//
// "dietro" dice da che parte dell'ordine di disegno va l'oggetto: di spalle
// una torcia sta dietro al corpo, di fronte e di profilo davanti.
const MANO = {
  giu: { x: 11, y: 6, dietro: false },
  // Di spalle l'oggetto va spostato verso il bordo, non messo in mezzo alle
  // scapole: dietro al busto sparirebbe del tutto, e un oggetto che non si
  // vede è come non averlo disegnato.
  su: { x: 2, y: 6, dietro: true },
  // Da M7.18.51 di profilo il braccio sta in mezzo al busto, e la mano con lui.
  lato: { x: 5, y: 6, dietro: false },
};

// Da M7.18.51 la mano segue il braccio: nel cammino oscilla di un pixel o
// tre, nelle pose va dove la porta il disegno (sopra la testa nel colpo,
// verso terra da chinati). Sono scarti rispetto a MANO, uno per posa.
const SPOSTA_MANO = {
  giu: { passo1: [0, 1], passo3: [0, -1], fermo1: [0, 1], colpo0: [2, -12], colpo1: [0, 3], chino: [0, 4] },
  su: { passo1: [0, -1], passo3: [0, 1], fermo1: [0, 1], colpo0: [-2, -12], colpo1: [0, 3], chino: [0, 4] },
  lato: { passo1: [3, 0], passo3: [-2, 0], fermo1: [0, 1], colpo0: [7, -8], colpo1: [-3, 2], chino: [-1, 3] },
};

// Quanto durano i gesti, in secondi. Brevi: sono una conferma di quello che
// si è appena fatto, non un'attesa, e non rallentano niente — le regole non
// li vedono nemmeno.
export const DURATA_COLPO = 0.26;
export const DURATA_CHINO = 0.32;
const DURATA_MORSO = 0.14;
// Un respiro ogni due secondi circa, metà dentro e metà fuori.
const MEZZO_RESPIRO = 0.95;

// Quale gesto fa un'azione. Il colpo è di chi spacca, taglia, colpisce; il
// chinarsi di chi prende da terra o ci mette le mani.
const COLPI = new Set(["colpo", "combattuto", "macellazione", "macellato", "polloUcciso"]);
const CHINATI = new Set([
  "zappa", "semina", "innaffia", "interra", "spargi", "cenere", "preso", "frugato", "posa", "pavimenta",
  "uovaPrese", "pollinaPresa", "polloPreso", "riempi", "stendi", "ritira", "coltura",
]);
export function gestoDi(esito) {
  if (!esito) return null;
  // "raccolto" è sia l'ultimo colpo d'ascia che stacca il ciocco sia la mano
  // che coglie nell'orto: lo distingue la voce del colpo.
  if (COLPI.has(esito.tipo) || (esito.tipo === "raccolto" && esito.voce)) return "colpo";
  if (CHINATI.has(esito.tipo) || esito.tipo === "raccolto") return "chino";
  return null;
}
export function gesto(e, tipo) {
  if (tipo === "colpo") e.gesto = { tipo, resta: DURATA_COLPO };
  else if (tipo === "chino") e.gesto = { tipo, resta: DURATA_CHINO };
}
export function morso(e) {
  e.morso = DURATA_MORSO;
}

// La posa di adesso, dal gesto in corso, dal passo o dal respiro.
export function posaDi(e) {
  if (e.gesto && e.gesto.resta > 0) {
    if (e.gesto.tipo === "chino") return "chino";
    // Metà gesto col braccio su, metà giù.
    return e.gesto.resta > DURATA_COLPO / 2 ? "colpo0" : "colpo1";
  }
  if (e.passo > 0) return `passo${Math.floor(e.passo) % 4}`;
  return `fermo${Math.floor((e.fermo ?? 0) / MEZZO_RESPIRO) % 2}`;
}

function righeDi(direzione, posa) {
  const d = direzione === "su" ? "su" : direzione === "giu" ? "giu" : "lato";
  if (posa.startsWith("passo")) return (d === "su" ? arte.SU : d === "giu" ? arte.GIU : arte.LATO)[Number(posa[5])];
  if (posa === "chino") return arte.POSE[d].chino;
  return arte.POSE[d][posa.slice(0, 5)][Number(posa[5])];
}

// Il lampo del morso: la figura chiara, col contorno che resta.
const LAMPO = Object.fromEntries(Object.entries(TAVOLOZZA).map(([k, v]) => [k, k === "r" ? v : "#e9e1cf"]));

// Corpo e oggetto impugnato si compongono in una figura sola, cotta una volta
// e tenuta qui. Le combinazioni sono poche — tre direzioni per undici pose
// per i pochi oggetti impugnabili — quindi a regime disegnare il
// superstite con l'ascia in mano costa esattamente quanto disegnarlo a mani
// nude: una drawImage.
//
// Comporre invece di sovrapporre al momento del disegno risolve due cose da
// sé: la profondità, che diventa solo l'ordine dei due disegni, e lo
// specchiamento, perché la direzione destra si ottiene riflettendo la figura
// già composta e non serve calcolare l'aggancio speculare.
//
// Col braccio alzato l'attrezzo sporge sopra la testa: la figura allora è più
// alta di quanto serve (sopra), e resta ancorata ai piedi.
const composti = new Map();

function manoDi(direzione, posa) {
  const mano = MANO[direzione];
  const [dx, dy] = SPOSTA_MANO[direzione][posa] ?? [0, 0];
  return { x: mano.x + dx, y: mano.y + dy, dietro: mano.dietro };
}

function figura(direzione, posa, impugnato, lampo = false) {
  const chiave = `${direzione}|${posa}|${impugnato?.nome ?? ""}|${lampo ? 1 : 0}`;
  const gia = composti.get(chiave);
  if (gia) return gia;

  const corpo = cuoci(righeDi(direzione, posa), lampo ? LAMPO : undefined);

  if (!impugnato) {
    const figura = { immagine: corpo, sopra: 0 };
    composti.set(chiave, figura);
    return figura;
  }

  const attrezzo = cuoci(impugnato.righe);
  const mano = manoDi(direzione, posa);
  const ax = mano.x - Math.floor(attrezzo.width / 2);
  // Ogni oggetto dice da sé quanto in basso sta nel pugno: una torcia si
  // regge alta perché la fiamma deve stare sopra la testa, un'ascia bassa.
  const ay = mano.y + (impugnato.scartoY ?? 0);
  const sopra = Math.max(0, -ay);

  const { canvas, contesto } = telaio(corpo.width, corpo.height + sopra);
  if (mano.dietro) {
    contesto.drawImage(attrezzo, ax, ay + sopra);
    contesto.drawImage(corpo, 0, sopra);
  } else {
    contesto.drawImage(corpo, 0, sopra);
    contesto.drawImage(attrezzo, ax, ay + sopra);
  }

  const figura = { immagine: canvas, sopra };
  composti.set(chiave, figura);
  return figura;
}

export function figureComposte() {
  return composti.size;
}

function aggiornaAspetto(e) {
  const posa = posaDi(e);
  const direzione = e.guarda === "su" ? "su" : e.guarda === "giu" ? "giu" : "lato";
  const { immagine, sopra } = figura(direzione, posa, e.impugnato ?? null, (e.morso ?? 0) > 0);
  e.posa = posa;

  e.sprite = e.guarda === "destra" ? riflesso(immagine) : immagine;
  // Ancorato ai piedi, come gli oggetti della mappa: è quello che fa funzionare
  // l'ordinamento in profondità senza casi speciali. Il morso lo sposta di un
  // pixel all'indietro, solo nel disegno.
  const rinculo = (e.morso ?? 0) > 0 ? (e.guarda === "destra" ? -1 : e.guarda === "sinistra" ? 1 : 0) : 0;
  e.x = e.px - e.sprite.width / 2 + rinculo;
  e.y = e.py - e.sprite.height;
  e.base = e.py;

  // Dove sta davvero la mano nel mondo. Serve a far uscire la luce della
  // torcia dalla fiamma disegnata invece che da un punto generico sopra la
  // testa. A destra la figura è riflessa, quindi lo è anche la mano.
  const mano = manoDi(direzione, posa);
  const manoX = e.guarda === "destra" ? e.sprite.width - mano.x - 1 : mano.x;
  e.impugnatura = { x: e.x + manoX, y: e.y + sopra + mano.y + 2 };
}

// --- comportamento --------------------------------------------------------

export function aggiorna(e, passo) {
  const { x, y } = comandi.direzione();
  // I gesti e il respiro sono solo aspetto: contano il tempo, non toccano
  // né la posizione né le regole.
  if (e.gesto) {
    e.gesto.resta -= passo;
    if (e.gesto.resta <= 0) e.gesto = null;
  }
  if (e.morso > 0) e.morso = Math.max(0, e.morso - passo);

  // Quanto si è in forze lo decidono le regole, non l'entità: sapere cos'è
  // la fame è roba di regole/, e le entità stanno sotto le regole. Chi
  // orchestra riempie questi due campi prima di aggiornare.
  const corre = comandi.attiva("corri") && e.puoCorrere !== false;
  const velocita = (corre ? VELOCITA_CORSA : VELOCITA) * (e.fattoreVelocita ?? 1);

  e.correndo = corre && (x !== 0 || y !== 0);
  e.inMovimento = x !== 0 || y !== 0;

  if (x !== 0 || y !== 0) {
    // La direzione dello sguardo dà la precedenza all'orizzontale: in diagonale
    // il profilo si legge meglio della figura vista di fronte.
    if (x < 0) e.guarda = "sinistra";
    else if (x > 0) e.guarda = "destra";
    else if (y < 0) e.guarda = "su";
    else e.guarda = "giu";

    const percorso = urti.muovi(e, x * velocita * passo, y * velocita * passo);
    e.passo += percorso / PIXEL_PER_FOTOGRAMMA;
    e.fermo = 0;
  } else {
    // Fermi si torna al fotogramma di riposo, non a uno qualsiasi del ciclo.
    e.passo = 0;
    e.fermo = (e.fermo ?? 0) + passo;
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
    // Da M7.18.51: da quanto si sta fermi (il respiro), il gesto in corso e
    // il lampo del morso. Solo aspetto: non si salvano.
    fermo: 0,
    gesto: null,
    morso: 0,
    posa: "fermo0",
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

// Comandi: dai tasti alle azioni.
//
// Il gioco non chiede mai "è premuto W": chiede "si sta andando avanti". Fra le
// due cose c'è questo modulo, ed è l'unico punto da toccare il giorno che
// arriveranno i comandi su schermo per il telefono o la riconfigurazione dei
// tasti. Nessuna altra parte del gioco sa che esiste una tastiera.

export const AZIONI = [
  "su", "giu", "sinistra", "destra", "usa", "corri", "ricette", "minimappa",
  "consuma", "getta", "partita", "esporta", "importa", "spegni", "mappa",
  "suono", "indietro", "aiuto", "allontana", "avvicina",
];

// Otto caselle, otto tasti: la selezione con la rotellina o con Q/E costringe
// a scorrere, e con solo otto caselle scorrere è più lento che puntare.
export const CASELLE = 8;

const MAPPA = {
  KeyW: "su", ArrowUp: "su",
  KeyS: "giu", ArrowDown: "giu",
  KeyA: "sinistra", ArrowLeft: "sinistra",
  KeyD: "destra", ArrowRight: "destra",
  Space: "usa", Enter: "usa",
  ShiftLeft: "corri", ShiftRight: "corri",
  KeyC: "ricette",
  KeyM: "minimappa",
  // TAB faceva la stessa cosa di C, cioè niente di suo. Adesso apre la mappa
  // di quello che si è visto: è il tasto che in mezzo mondo apre una mappa, e
  // averlo come secondo nome delle ricette era sprecarlo.
  Tab: "mappa",
  KeyE: "consuma",
  KeyG: "getta",
  // "V" come volume. Non "S", che è già camminare all'indietro, e non "A",
  // che è già camminare a sinistra: le lettere delle direzioni non si toccano,
  // ed è la ragione per cui in questo elenco le cose si chiamano con la loro
  // seconda lettera più ovvia invece che con la prima.
  KeyV: "suono",
  // "P" come partita. Non "S", che è già camminare all'indietro.
  KeyP: "partita",
  // Valgono solo dentro la schermata della partita, che è modale e se li
  // prende tutti. "F" come file e "I" come importa: dicono la direzione, che
  // è l'unica cosa che si rischia di sbagliare fra le due.
  KeyF: "esporta",
  KeyI: "importa",
  // "X" come cancella, e anche lui solo dentro la schermata della partita.
  KeyX: "spegni",
  // Tornare al passo prima nella schermata iniziale. Esc è il tasto che in
  // ogni menu vuol dire "indietro", e il tasto di cancellazione è quello che
  // cerca chi ha la mano sulla parte destra della tastiera.
  Escape: "indietro", Backspace: "indietro",
  // "H" come help: la lista dei comandi, da M7.18.24. Era sparita con la
  // schermata iniziale, che aveva preso il posto di quella che li elencava.
  KeyH: "aiuto",
  // Lo zoom della mappa grande (M7.18.39): Q allontana ed E, che fuori dalla
  // mappa è "consuma", avvicina. Anche - e + per chi li cerca lì.
  KeyQ: "allontana", Minus: "allontana", NumpadSubtract: "allontana",
  Equal: "avvicina", NumpadAdd: "avvicina",
};

for (let i = 1; i <= CASELLE; i += 1) MAPPA[`Digit${i}`] = `casella${i}`;

const attive = new Set();
// Le azioni premute in questo passo e non ancora consumate. Servono perché
// "colpisci" e "tieni premuto per camminare" sono due cose diverse: senza
// distinguerle, tenere premuta la barra abbatterebbe un albero in un
// sessantesimo di secondo.
const appena = new Set();

export function attiva(azione) {
  return attive.has(azione);
}

export function appenaPremuto(azione) {
  return appena.has(azione);
}

// Da chiamare in fondo a ogni passo di aggiornamento: quello che è stato
// premuto vale per un passo solo.
export function finePasso() {
  appena.clear();
}

// Serve alla sospensione: perdendo il fuoco della finestra il keyup non arriva
// mai, e senza questo il superstite continuerebbe a camminare da solo contro
// un albero per tutto il tempo in cui si guarda un'altra applicazione.
export function rilasciaTutto() {
  attive.clear();
  appena.clear();
}

// Vettore di spostamento normalizzato. La normalizzazione non è un vezzo: in
// diagonale le due componenti valgono 1 ciascuna, e senza dividerle ci si
// muoverebbe del 41% più veloci andando di sbieco.
export function direzione() {
  let x = 0;
  let y = 0;
  if (attiva("sinistra")) x -= 1;
  if (attiva("destra")) x += 1;
  if (attiva("su")) y -= 1;
  if (attiva("giu")) y += 1;
  if (x !== 0 && y !== 0) {
    const diagonale = Math.SQRT1_2;
    x *= diagonale;
    y *= diagonale;
  }
  return { x, y };
}

// --- scrittura ------------------------------------------------------------

// Il gioco non ha campi di testo: l'interfaccia sta sul canvas, e un input del
// DOM in mezzo alla pixel art si vede come una cosa incollata sopra un'altra.
// Quando serve scrivere — e serve per una cosa sola, il codice di una partita
// da riprendere altrove — la tastiera smette di essere comandi e torna a
// essere lettere. Sta qui perché questo è l'unico modulo che sa che esiste
// una tastiera, e quella regola non si piega per un caso solo.
let scrittura = null;

export function stoScrivendo() {
  return scrittura !== null;
}

export function iniziaScrittura(lunghezzaMassima = 40) {
  scrittura = { testo: "", massimo: lunghezzaMassima, confermato: false, annullato: false };
}

export function fineScrittura() {
  const esito = scrittura;
  scrittura = null;
  return esito;
}

// Restituisce l'esito solo quando la scrittura è davvero finita — confermata
// o annullata — e in quel caso la chiude. Serve a chi guarda a ogni passo se
// è il momento di raccogliere quello che è stato scritto.
export function fineScritturaSeFinita() {
  if (!scrittura) return null;
  if (!scrittura.confermato && !scrittura.annullato) return null;
  return fineScrittura();
}

export function testoScritto() {
  return scrittura?.testo ?? "";
}

// Quello che si accetta mentre si scrive un codice: lettere, cifre e il
// trattino che separa i gruppi. Gli spazi no — un codice con uno spazio dentro
// è un codice sbagliato che sembra giusto.
const AMMESSI = /^[A-Za-z0-9-]$/;

function scrivi(evento) {
  if (evento.key === "Enter") {
    scrittura.confermato = true;
    return;
  }
  if (evento.key === "Escape") {
    scrittura.annullato = true;
    return;
  }
  if (evento.key === "Backspace") {
    scrittura.testo = scrittura.testo.slice(0, -1);
    return;
  }
  if (evento.key.length !== 1 || !AMMESSI.test(evento.key)) return;
  if (scrittura.testo.length >= scrittura.massimo) return;
  scrittura.testo += evento.key.toUpperCase();
}

export function collega() {
  addEventListener("keydown", (evento) => {
    // Mentre si scrive la tastiera è tutta della scrittura: se W valesse anche
    // come "vai avanti", scrivere un codice significherebbe camminare.
    if (scrittura) {
      evento.preventDefault();
      if (evento.repeat && evento.key !== "Backspace") return;
      scrivi(evento);
      return;
    }

    const azione = MAPPA[evento.code];
    if (!azione) return;
    // Le frecce e la barra spaziatrice farebbero scorrere la pagina, e la
    // barra premerebbe anche l'ultimo elemento che ha ricevuto un clic.
    evento.preventDefault();
    if (evento.repeat) return;
    attive.add(azione);
    appena.add(azione);
  });

  addEventListener("keyup", (evento) => {
    const azione = MAPPA[evento.code];
    if (azione) attive.delete(azione);
  });
}

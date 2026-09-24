// Quello che il giocatore ha cambiato nel mondo.
//
// Fino a qui la valle era solo calcolata: ogni tassello era una funzione pura
// delle sue coordinate. È una proprietà preziosa — niente da generare in
// anticipo, nessun confine — ma da sola rende il mondo immutabile, e un
// survival in cui l'albero che hai abbattuto ricresce appena giri lo sguardo
// non è un survival.
//
// Qui stanno le eccezioni: solo i tasselli che il giocatore ha toccato. Tutto
// il resto continua a venire dalla generazione. È anche ciò che renderà
// piccolo il salvataggio a M2 — si scrive questa mappa, non il mondo.

import { OGGETTO } from "./generazione.js";

const cambi = new Map();
let versione = 0;
export function revisione() { return versione; }

const chiave = (tx, ty) => `${tx},${ty}`;

export function di(tx, ty) {
  return cambi.get(chiave(tx, ty));
}

// Il pavimento sta sotto quello che c'è sul tassello, e sopravvive a tutto
// quello che ci passa sopra: un letto posato e smontato, un mucchio gettato e
// ripreso, un fuoco che si spegne. Chi riscrive un tassello da capo non lo sa,
// e non deve saperlo — sono quarantacinque posti diversi, e dimenticarsene in
// uno solo vorrebbe dire un pavimento che sparisce senza motivo. Quindi resta
// da sé, e lo toglie soltanto chi lo nomina: "pavimento: undefined".
function conIlPavimento(prima, cambio) {
  if (!Object.hasOwn(cambio, "pavimento")) {
    return prima?.pavimento === undefined ? cambio : { ...cambio, pavimento: prima.pavimento };
  }
  if (cambio.pavimento !== undefined) return cambio;
  const { pavimento, ...resto } = cambio;
  return resto;
}

export function imposta(tx, ty, cambio) {
  versione += 1;
  const k = chiave(tx, ty);
  cambi.set(k, conIlPavimento(cambi.get(k), cambio));
}

// Togliere un tassello fatto a mano vuol dire tornare alla generazione, ma il
// pavimento resta anche qui: sotto c'è una casella vuota, non un albero.
export function rimuovi(tx, ty) {
  versione += 1;
  const k = chiave(tx, ty);
  const pavimento = cambi.get(k)?.pavimento;
  if (pavimento === undefined) cambi.delete(k);
  else cambi.set(k, { oggetto: OGGETTO.NESSUNO, pavimento });
}

export function quanti() {
  return cambi.size;
}

// Per il salvataggio che arriverà: la forma è già quella giusta da scrivere su
// disco, coppie coordinate-cambiamento e nient'altro.
export function tutti() {
  return [...cambi.entries()].map(([k, v]) => {
    const [tx, ty] = k.split(",").map(Number);
    return { tx, ty, ...v };
  });
}

// Scorre i cambiamenti senza costruire niente. tutti() alloca un array nuovo a
// ogni chiamata, il che va benissimo per salvare una volta e malissimo per
// disegnare la minimappa sessanta volte al secondo.
export function perOgnuno(funzione) {
  for (const [k, v] of cambi) {
    const virgola = k.indexOf(",");
    funzione(Number(k.slice(0, virgola)), Number(k.slice(virgola + 1)), v);
  }
}

export function svuota() {
  versione += 1;
  cambi.clear();
}


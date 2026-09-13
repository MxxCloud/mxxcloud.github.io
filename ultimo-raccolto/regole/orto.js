// L'orto: la prima cosa che è tua.
//
// È la prima volta che il gioco chiede di tornare in un posto, che è la
// definizione minima di averne uno. Fino a qui si poteva andare in qualunque
// direzione senza perdere niente; da adesso lasciare l'orto senza acqua ha
// una conseguenza.
//
// Orto e fame si tengono a vicenda: senza la fame l'orto sarebbe decorazione,
// senza l'orto la fame sarebbe solo una tassa.

import { OGGETTO } from "../mondo/generazione.js";
import * as mappa from "../mondo/mappa.js";
import * as modifiche from "../mondo/modifiche.js";

// In ordine di crescita: ogni giorno innaffiato avanza di uno.
export const CRESCITA = [
  OGGETTO.SEMINATO,
  OGGETTO.GERMOGLIO,
  OGGETTO.CRESCIUTA,
  OGGETTO.MATURA,
];

export function eColtura(oggetto) {
  return CRESCITA.includes(oggetto);
}

export function eMatura(oggetto) {
  return oggetto === OGGETTO.MATURA;
}

export function siPuoInnaffiare(oggetto) {
  return oggetto === OGGETTO.TERRA_ZAPPATA || (eColtura(oggetto) && !eMatura(oggetto));
}

// I tasselli toccati si contano a mano invece di essere tenuti in un elenco
// a parte: le modifiche sono già l'elenco di tutto ciò che il giocatore ha
// cambiato, e un secondo elenco da tenere in sincronia sarebbe un secondo
// elenco da sbagliare.
function coltureBagnate() {
  const pronte = [];
  modifiche.perOgnuno((tx, ty, cambio) => {
    if (!cambio.bagnato) return;
    if (!eColtura(cambio.oggetto)) return;
    if (eMatura(cambio.oggetto)) return;
    pronte.push({ tx, ty, oggetto: cambio.oggetto });
  });
  return pronte;
}

// Da chiamare a ogni cambio di giorno. Chi è stato innaffiato avanza di uno
// stadio e si asciuga; chi no resta dov'è — non muore, perché appassire è
// roba della tappa del decadimento e qui punirebbe due volte.
//
// Si raccoglie prima e si modifica poi: cambiare le modifiche mentre le si
// sta scorrendo è il modo classico di perdersi metà dell'orto.
export function nuovoGiorno() {
  let cresciute = 0;
  for (const { tx, ty, oggetto } of coltureBagnate()) {
    const prossimo = CRESCITA[CRESCITA.indexOf(oggetto) + 1];
    if (prossimo === undefined) continue;
    mappa.cambiaTassello(tx, ty, { oggetto: prossimo });
    cresciute += 1;
  }

  // Anche la terra zappata e lasciata lì si asciuga: innaffiare in anticipo
  // non deve valere come innaffiare al momento giusto.
  const daAsciugare = [];
  modifiche.perOgnuno((tx, ty, cambio) => {
    if (cambio.bagnato) daAsciugare.push({ tx, ty, oggetto: cambio.oggetto });
  });
  for (const { tx, ty, oggetto } of daAsciugare) {
    mappa.cambiaTassello(tx, ty, { oggetto });
  }

  return cresciute;
}

export function innaffia(tx, ty, oggetto) {
  mappa.cambiaTassello(tx, ty, { oggetto, bagnato: true });
}

export function quante() {
  let n = 0;
  modifiche.perOgnuno((tx, ty, cambio) => {
    if (eColtura(cambio.oggetto)) n += 1;
  });
  return n;
}

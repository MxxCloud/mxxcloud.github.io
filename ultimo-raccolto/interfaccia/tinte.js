// Di che colore si disegna un terreno quando lo si guarda da lontano.
//
// Stava dentro minimappa.js, ed era giusto finché la minimappa era l'unica
// finestra che guardava la valle dall'alto. Adesso c'è anche la mappa grande,
// e due copie della stessa tabella di tinte sono due copie da tenere
// allineate: basterebbe aggiungere un terreno e ricordarsene in un posto solo
// per avere due finestre che raccontano valli diverse.
//
// I tasselli veri sono screziati e non hanno un colore unico, quindi si
// sceglie il più rappresentativo: a un pixel per tassello — o meno — conta
// solo che l'acqua si distingua dalla roccia a colpo d'occhio.

import { TERRENO } from "../mondo/generazione.js";
import { TAVOLOZZA } from "../arte/tavolozza.js";

const CHIAVI = {
  [TERRENO.ACQUA]: "1",
  [TERRENO.ACQUA_BASSA]: "3",
  [TERRENO.SABBIA]: "5",
  [TERRENO.ERBA]: "7",
  [TERRENO.STERPAGLIA]: "9",
  [TERRENO.ROCCIA]: "e",
  [TERRENO.TERRA]: "b",
};

function componenti(esadecimale) {
  const n = Number.parseInt(esadecimale.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

let tavolozza = TAVOLOZZA;
const COLORI = [];

function rifai() {
  for (const [id, chiave] of Object.entries(CHIAVI)) {
    COLORI[id] = componenti(tavolozza[chiave]);
  }
}

rifai();

// Restituisce se è cambiato qualcosa, così chi disegna sa se deve ridipingere
// invece di rifarlo a ogni fotogramma per sicurezza.
export function impostaTavolozza(nuova) {
  if (nuova === tavolozza) return false;
  tavolozza = nuova;
  rifai();
  return true;
}

// Un terreno sconosciuto prende il colore dell'erba invece di lasciare un
// pixel nero: un buco in mezzo alla mappa si legge come un guasto, una macchia
// d'erba di troppo no.
export function coloreDi(terreno) {
  return COLORI[terreno] ?? COLORI[TERRENO.ERBA];
}

// Casualità ripetibile: generatore seminato e rumore di valore.
//
// Nel gioco non esiste Math.random. Tutto ciò che sembra casuale — la forma
// della valle, dove cresce un albero, quale ciuffo d'erba è più chiaro — deve
// poter essere ricalcolato identico partendo dal solo seme del mondo. È quello
// che permetterà di salvare una partita memorizzando i settori modificati
// invece del mondo intero: il resto si rigenera uguale.
//
// Sono una sessantina di righe scritte a mano. Una libreria di rumore darebbe
// le stesse curve e romperebbe la regola che tiene in piedi questo sito: niente
// da installare, niente da compilare.

// --- semi e generatore ----------------------------------------------------

// Un seme leggibile ("valle-1") vale più di un numero: si scrive in un URL, si
// racconta a qualcuno, si riconosce in un salvataggio.
export function semeDaTesto(testo) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < testo.length; i += 1) {
    h ^= testo.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

// mulberry32: stato di 32 bit, un'addizione e tre mescolamenti. Non è
// crittografico e non deve esserlo — deve essere veloce e sempre uguale.
export function generatore(seme) {
  let stato = seme >>> 0;
  return function successivo() {
    stato = (stato + 0x6d2b79f5) >>> 0;
    let t = stato;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- impronta di una cella ------------------------------------------------

// Valore stabile per una coppia di coordinate: stessa cella, stesso numero,
// senza dover tenere in memoria nulla. È il mattone sia del rumore sia delle
// scelte per tassello (quale variante d'erba, se qui c'è un sasso).
export function impronta(x, y, seme) {
  let h = (seme ^ Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x2545f491) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0x27d4eb2f) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// --- rumore ---------------------------------------------------------------

// Interpolazione morbida: senza, i quadrati della griglia del rumore restano
// visibili come scacchiera nel terreno.
function morbida(t) {
  return t * t * (3 - 2 * t);
}

function mescola(a, b, t) {
  return a + (b - a) * t;
}

// Rumore di valore: quattro angoli interi interpolati. Più economico del
// rumore di Perlin e, a questa scala di tasselli, indistinguibile.
export function rumore(x, y, seme) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const tx = morbida(x - xi);
  const ty = morbida(y - yi);

  const alto = mescola(impronta(xi, yi, seme), impronta(xi + 1, yi, seme), tx);
  const basso = mescola(impronta(xi, yi + 1, seme), impronta(xi + 1, yi + 1, seme), tx);
  return mescola(alto, basso, ty);
}

// Somma di ottave: ogni ottava raddoppia il dettaglio e dimezza il peso. Poche
// ottave danno colline morbide, molte danno una costa frastagliata.
export function rumoreFrattale(x, y, seme, ottave = 4, persistenza = 0.5) {
  let somma = 0;
  let ampiezza = 1;
  let frequenza = 1;
  let totale = 0;

  for (let o = 0; o < ottave; o += 1) {
    // Ogni ottava usa un seme derivato, altrimenti le ottave sarebbero la
    // stessa figura sovrapposta a se stessa e i rilievi si allineerebbero.
    somma += rumore(x * frequenza, y * frequenza, (seme + o * 0x9e3779b9) >>> 0) * ampiezza;
    totale += ampiezza;
    ampiezza *= persistenza;
    frequenza *= 2;
  }

  return somma / totale;
}

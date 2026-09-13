// Lo zaino.
//
// Otto caselle e non di più. Il limite non è pigrizia: in un survival lo
// spazio è una delle poche cose che costringono a scegliere, e uno zaino
// infinito toglie di mezzo la domanda "cosa vale la pena portarsi".

import { CATALOGO } from "./oggetti.js";

export const CASELLE = 8;

// Una casella vuota è null e non un oggetto con quantità zero: così "la
// casella è libera" è una domanda sola invece di due.
const caselle = new Array(CASELLE).fill(null);

export function contenuto() {
  return caselle;
}

export function quante(cosa) {
  let somma = 0;
  for (const casella of caselle) if (casella?.cosa === cosa) somma += casella.quantita;
  return somma;
}

// Restituisce quante non ci sono entrate, perché chi raccoglie deve poter
// dire "zaino pieno" invece di far sparire la roba in silenzio.
export function aggiungi(cosa, quantita) {
  const pila = CATALOGO[cosa]?.pila ?? 1;
  let resto = quantita;

  // Prima si riempiono le pile già cominciate, poi si aprono caselle nuove:
  // il contrario sparpaglierebbe la stessa cosa su più caselle con lo zaino
  // quasi pieno, sprecando l'unica risorsa scarsa che c'è qui.
  for (const casella of caselle) {
    if (resto === 0) break;
    if (casella?.cosa !== cosa) continue;
    const spazio = pila - casella.quantita;
    const messe = Math.min(spazio, resto);
    casella.quantita += messe;
    resto -= messe;
  }

  for (let i = 0; i < CASELLE && resto > 0; i += 1) {
    if (caselle[i] !== null) continue;
    const messe = Math.min(pila, resto);
    caselle[i] = { cosa, quantita: messe };
    resto -= messe;
  }

  return resto;
}

export function togli(cosa, quantita) {
  if (quante(cosa) < quantita) return false;
  let resto = quantita;
  // Si svuotano prima le pile più piccole, così le caselle si liberano invece
  // di restare tutte a metà.
  const ordine = caselle
    .map((casella, i) => ({ casella, i }))
    .filter(({ casella }) => casella?.cosa === cosa)
    .sort((a, b) => a.casella.quantita - b.casella.quantita);

  for (const { casella, i } of ordine) {
    if (resto === 0) break;
    const tolte = Math.min(casella.quantita, resto);
    casella.quantita -= tolte;
    resto -= tolte;
    if (casella.quantita === 0) caselle[i] = null;
  }
  return true;
}

// Svuota una casella e restituisce cosa c'era. Serve a gettare: si getta una
// casella intera e non "una legna", perché a zaino pieno il problema è la
// casella occupata, e liberarla un'unità alla volta sarebbe quaranta volte lo
// stesso tasto per risolvere un problema che si vede a colpo d'occhio.
export function svuotaCasella(indice) {
  const casella = caselle[indice];
  if (!casella) return null;
  caselle[indice] = null;
  return { cosa: casella.cosa, quantita: casella.quantita };
}

export function pieno() {
  return caselle.every((casella) => casella !== null);
}

// Quanto ci starebbe, se si provasse ad aggiungere. Serve a chi deve decidere
// prima di agire — le ricette — invece di aggiungere e poi disfare.
export function spazioPer(cosa) {
  const pila = CATALOGO[cosa]?.pila ?? 1;
  let posto = 0;
  for (const casella of caselle) {
    if (casella === null) posto += pila;
    else if (casella.cosa === cosa) posto += pila - casella.quantita;
  }
  return posto;
}

export function svuota() {
  caselle.fill(null);
}

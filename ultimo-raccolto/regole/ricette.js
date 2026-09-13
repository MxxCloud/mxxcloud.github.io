// Cosa si può costruire.
//
// Poche ricette, e ognuna risponde a qualcosa. Il gioco a M1 ha un problema —
// fa buio — e torcia e falò sono le due risposte: una te la porti dietro,
// l'altra ti fa un posto. L'ascia risponde a un problema diverso ma vero: dà
// uno scopo alla pietra e fa in modo che il ciclo premi se stesso, perché si
// raccoglie per costruire l'attrezzo che rende più svelto il raccogliere.
//
// Aggiungere ricette che non rispondono a niente riempirebbe un menu senza
// cambiare una partita.

import * as inventario from "./inventario.js";

export const RICETTE = [
  {
    id: "ascia",
    produce: { cosa: "ascia", quante: 1 },
    costo: [
      { cosa: "pietra", quante: 2 },
      { cosa: "ramo", quante: 1 },
      { cosa: "fibra", quante: 2 },
    ],
  },
  {
    id: "torcia",
    produce: { cosa: "torcia", quante: 1 },
    costo: [
      { cosa: "ramo", quante: 1 },
      { cosa: "fibra", quante: 2 },
    ],
  },
  {
    id: "zappa",
    produce: { cosa: "zappa", quante: 1 },
    costo: [
      { cosa: "pietra", quante: 2 },
      { cosa: "ramo", quante: 1 },
      { cosa: "fibra", quante: 2 },
    ],
  },
  {
    id: "secchio",
    produce: { cosa: "secchio", quante: 1 },
    costo: [
      { cosa: "legna", quante: 3 },
      { cosa: "fibra", quante: 1 },
    ],
  },
  {
    id: "giaciglio",
    produce: { cosa: "giaciglio", quante: 1 },
    costo: [
      { cosa: "fibra", quante: 6 },
      { cosa: "legna", quante: 2 },
    ],
  },
  {
    id: "falo",
    produce: { cosa: "falo", quante: 1 },
    costo: [
      { cosa: "legna", quante: 3 },
      { cosa: "pietra", quante: 2 },
      { cosa: "fibra", quante: 2 },
    ],
  },
];

export function bastano(ricetta) {
  return ricetta.costo.every((voce) => inventario.quante(voce.cosa) >= voce.quante);
}

export function fai(ricetta) {
  if (!bastano(ricetta)) return false;
  // Prima si toglie e poi si aggiunge: l'ordine inverso potrebbe trovare lo
  // zaino pieno con i materiali ancora dentro, e allora non si saprebbe se
  // annullare o buttare via il risultato.
  for (const voce of ricetta.costo) inventario.togli(voce.cosa, voce.quante);
  const avanzate = inventario.aggiungi(ricetta.produce.cosa, ricetta.produce.quante);
  // Se lo zaino era pieno esattamente al pelo, i materiali hanno appena
  // liberato spazio: questo caso in pratica non capita, ma se capitasse si
  // rimetterebbe tutto a posto invece di far sparire il lavoro.
  if (avanzate > 0) {
    for (const voce of ricetta.costo) inventario.aggiungi(voce.cosa, voce.quante);
    return false;
  }
  return true;
}

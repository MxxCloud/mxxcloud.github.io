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
    id: "benda",
    produce: { cosa: "benda", quante: 1 },
    costo: [{ cosa: "fibra", quante: 3 }],
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

// Restituisce il motivo del rifiuto e non un no secco. I due modi di non
// poter costruire sono diversi e si risolvono in modi diversi — andare a
// raccogliere, o liberare una casella — e dirli entrambi "materiali
// insufficienti" mandava a cercare pietre chi aveva solo lo zaino pieno.
export function fai(ricetta) {
  if (!bastano(ricetta)) return { fatto: false, perche: "materiali" };

  // Lo spazio si guarda prima di toccare niente. I materiali che escono
  // possono liberare la casella che serve al risultato — è il caso di una
  // pila che si svuota del tutto — quindi non basta chiedere se lo zaino è
  // pieno adesso: bisogna chiederlo al netto di quello che sta per uscire.
  for (const voce of ricetta.costo) inventario.togli(voce.cosa, voce.quante);
  if (inventario.spazioPer(ricetta.produce.cosa) < ricetta.produce.quante) {
    for (const voce of ricetta.costo) inventario.aggiungi(voce.cosa, voce.quante);
    return { fatto: false, perche: "zaino" };
  }

  inventario.aggiungi(ricetta.produce.cosa, ricetta.produce.quante);
  return { fatto: true };
}

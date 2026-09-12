// Cosa si può costruire.
//
// Due sole ricette, e non per fretta: a M1 il gioco ha un problema solo — fa
// buio — e queste due sono le due risposte. La torcia è quella che ti porti
// dietro, il falò quello che ti fa un posto. Aggiungere ricette che non
// rispondono a niente riempirebbe un menu senza cambiare una partita.

import * as inventario from "./inventario.js";

export const RICETTE = [
  {
    id: "torcia",
    produce: { cosa: "torcia", quante: 1 },
    costo: [
      { cosa: "ramo", quante: 1 },
      { cosa: "fibra", quante: 2 },
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

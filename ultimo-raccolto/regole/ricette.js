// Cosa si può costruire, e dove.
//
// Poche ricette, e ognuna risponde a qualcosa. Il gioco a M1 ha un problema —
// fa buio — e torcia e falò sono le due risposte: una te la porti dietro,
// l'altra ti fa un posto. L'ascia risponde a un problema diverso ma vero: dà
// uno scopo alla pietra e fa in modo che il ciclo premi se stesso, perché si
// raccoglie per costruire l'attrezzo che rende più svelto il raccogliere.
//
// Aggiungere ricette che non rispondono a niente riempirebbe un menu senza
// cambiare una partita. Vale ancora, e adesso vale il doppio: il menu non ha
// più un tetto, quindi l'unica cosa che lo tiene corto è questa regola.
//
// IL BANCO. Fino a M7.3 si poteva costruire qualunque cosa ovunque: una cassa
// in mezzo a un bosco, di notte, lontano da tutto. In un gioco il cui pilastro
// è "il posto è tuo" l'accampamento non aveva un solo privilegio, ed era la
// cosa più strana della tappa che si chiama Costruzione.
//
// Adesso le ricette sono due elenchi. Quelle a mani nude si fanno dove capita
// e sono la sopravvivenza: la luce, il fuoco, il letto, la benda, l'acqua — e
// il banco stesso, che se avesse voluto un banco non si sarebbe potuto fare.
// Quelle al banco vogliono un posto, e sono tutto il resto.
//
// Non è un cancello messo per allungare la strada: è quello che rende la prima
// mezz'ora una decisione — dove lo metto — invece di una lista della spesa.

import * as inventario from "./inventario.js";
import { CATALOGO } from "./oggetti.js";

// L'ordine è quello in cui si incontrano: prima quello che si fa con le mani,
// poi quello che vuole un banco. Non si mescolano, perché la prima cosa da
// imparare guardando l'elenco è che sono due elenchi.
export const RICETTE = [
  // --- a mani nude, dove capita ------------------------------------------
  // Il banco per primo, e non per cortesia: è la ricetta che apre tutte le
  // altre, quindi è quella che si deve vedere per prima aprendo il pannello
  // il primo giorno. Sei pietre sono tre sassi spaccati, sei legne due
  // alberi: mezz'ora, ed è la mezz'ora che decide dov'è casa.
  {
    id: "banco",
    produce: { cosa: "banco", quante: 1 },
    costo: [
      { cosa: "legna", quante: 6 },
      { cosa: "pietra", quante: 6 },
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
    id: "falo",
    produce: { cosa: "falo", quante: 1 },
    costo: [
      { cosa: "legna", quante: 3 },
      { cosa: "pietra", quante: 2 },
      { cosa: "fibra", quante: 2 },
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
    id: "canna",
    produce: { cosa: "canna", quante: 1 },
    costo: [{ cosa: "ramo", quante: 3 }, { cosa: "fibra", quante: 4 }],
  },
  {
    id: "secchio",
    produce: { cosa: "secchio", quante: 1 },
    costo: [
      { cosa: "legna", quante: 3 },
      { cosa: "fibra", quante: 1 },
    ],
  },
  // La benda resta a mani nude e non è una svista: è la risposta a una ferita,
  // e una risposta che si può dare solo tornando a casa non è una risposta.
  {
    id: "benda",
    produce: { cosa: "benda", quante: 1 },
    costo: [{ cosa: "fibra", quante: 3 }],
  },

  // --- al banco -----------------------------------------------------------
  ...["ascia", "zappa", "lancia", "canna"].map(cosa => ({
    id: "ripara_" + cosa, ripara: cosa, banco: true,
    produce: { cosa, quante: 1 },
    costo: [{ cosa: "pietra", quante: 1 }, { cosa: "fibra", quante: 2 }],
  })),
  // Gli attrezzi passano di qui, ed è il cambiamento che si sente di più.
  // Prima l'ascia era la prima cosa che si faceva, in piedi in mezzo a un
  // prato; adesso è la seconda, e la prima è aver deciso dove stare.
  {
    id: "ascia",
    banco: true,
    produce: { cosa: "ascia", quante: 1 },
    costo: [
      { cosa: "pietra", quante: 2 },
      { cosa: "ramo", quante: 1 },
      { cosa: "fibra", quante: 2 },
    ],
  },
  {
    id: "zappa",
    banco: true,
    produce: { cosa: "zappa", quante: 1 },
    costo: [
      { cosa: "pietra", quante: 2 },
      { cosa: "ramo", quante: 1 },
      { cosa: "fibra", quante: 2 },
    ],
  },
  // La cassa è la ricetta più cara del gioco, e deve esserlo: è la prima cosa
  // che non serve a fare qualcosa ma a tenere qualcosa, cioè il primo pezzo
  // di un posto invece che di un corredo. Otto legne sono tre alberi.
  {
    id: "cassa",
    banco: true,
    produce: { cosa: "cassa", quante: 1 },
    costo: [
      { cosa: "legna", quante: 8 },
      { cosa: "fibra", quante: 3 },
    ],
  },
  // La lancia risponde a una cosa che il gioco aveva e non risolveva: da M6
  // combattere vuol dire scambiare colpi, perché la propria portata è venti e
  // il loro braccio ne arriva a tredici — cioè si è sempre dentro il loro
  // raggio mentre si sta dentro il proprio. Con la lancia non più.
  {
    id: "lancia",
    banco: true,
    produce: { cosa: "lancia", quante: 1 },
    costo: [
      { cosa: "pietra", quante: 3 },
      { cosa: "ramo", quante: 2 },
      { cosa: "fibra", quante: 3 },
    ],
  },
  // Il muro e la porta rispondono alla notte, che da M6 è pericolosa ovunque
  // allo stesso modo: in mezzo a un prato e in mezzo al proprio orto. Fino a
  // qui niente di quello che si costruiva cambiava quello che ti capitava.
  //
  // Tre pietre l'uno, e la pietra è l'unica cosa che non ricresce: un recinto
  // non si paga con una passeggiata, si paga smontando il paese. È il motivo
  // per cui le rovine sono piene di muri, e adesso quella pietra ha una
  // destinazione — la casa di chi non c'è più diventa la propria.
  {
    id: "muro",
    banco: true,
    produce: { cosa: "muro", quante: 1 },
    costo: [{ cosa: "pietra", quante: 3 }],
  },
  // La porta è di legna perché deve essere la parte che si rifà: quando gli
  // infetti sfondano qualcosa, sfondano quello che sta sul passaggio, e una
  // cosa che si rompe spesso non può costare la risorsa che non torna.
  {
    id: "porta",
    banco: true,
    produce: { cosa: "porta", quante: 1 },
    costo: [
      { cosa: "legna", quante: 6 },
      { cosa: "fibra", quante: 2 },
    ],
  },
  // La conserva risponde all'inverno, che da M7.1 ha un orologio addosso.
  // Seccare al fuoco dà il cibo che nutre, questa dà il cibo che aspetta: sei
  // bacche diventano due vasi che valgono meno di quelle sei e durano un anno
  // invece di tre giorni.
  {
    id: "conserva",
    banco: true,
    produce: { cosa: "conserva", quante: 2 },
    costo: [
      { cosa: "bacche", quante: 6 },
      { cosa: "fibra", quante: 2 },
    ],
  },
];

export function bastano(ricetta) {
  return (!ricetta.ripara || Boolean(inventario.daRiparare(ricetta.ripara))) && ricetta.costo.every((voce) => inventario.quante(voce.cosa) >= voce.quante);
}

// Restituisce il motivo del rifiuto e non un no secco. I due modi di non
// poter costruire sono diversi e si risolvono in modi diversi — andare a
// raccogliere, o liberare una casella — e dirli entrambi "materiali
// insufficienti" mandava a cercare pietre chi aveva solo lo zaino pieno.
export function fai(ricetta, alBanco = false) {
  // Il banco prima dei materiali: chi sta in mezzo a un bosco con tutto il
  // necessario deve sentirsi dire che gli manca il posto, non la roba.
  if (ricetta.banco && !alBanco) return { fatto: false, perche: "banco" };
  if (ricetta.ripara && !inventario.daRiparare(ricetta.ripara)) return { fatto: false, perche: "integro" };
  if (!bastano(ricetta)) return { fatto: false, perche: "materiali" };

  if (ricetta.ripara) {
    const attrezzo = inventario.daRiparare(ricetta.ripara);
    for (const voce of ricetta.costo) inventario.togli(voce.cosa, voce.quante);
    // Nessuna casella aggiuntiva: si ripara lo stesso oggetto, anche a zaino pieno.
    attrezzo.usi = CATALOGO[attrezzo.cosa].durata;
    return { fatto: true };
  }
  if (!inventario.trasforma(ricetta.costo, ricetta.produce)) {
    return { fatto: false, perche: "zaino" };
  }
  return { fatto: true };
}

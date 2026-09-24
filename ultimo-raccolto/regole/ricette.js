import * as bisogni from "./bisogni.js";
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
  // Sta al banco mentre il giaciglio di paglia si fa a mani nude, ed è la
  // stessa regola di sempre: a mani nude si fa quello che serve stanotte, al
  // banco quello che prepara una stagione. Tre pelli sono un orso, un bufalo,
  // o tre cervi: un paio di battute di caccia, non un pomeriggio.
  {
    // Quattro pelli sono due animali grossi, o un bufalo più un cervo: un paio
    // di battute di caccia. Il filo è la riga che dice "questa cosa è
    // cucita", ed è anche l'unica che impedisce di arrivare al banco con
    // quattro pelli e uscirne senza aver pensato. Al banco perché prepara una
    // stagione, e quello che prepara sta dove hai deciso che è casa.
    //
    // Filo e non fibra da M7.18.1: le pelli non si cuciono con la paglia, e la
    // pelliccia è la prima cosa che chiede all'orto di pensare all'inverno.
    id: "pelliccia",
    banco: true,
    produce: { cosa: "pelliccia", quante: 1 },
    costo: [
      { cosa: "pelle", quante: 4 },
      { cosa: "filo", quante: 3 },
    ],
  },
  // Il focolare. Al banco, e non per il gusto di mettere un cancello: è la
  // cosa che prepara una stagione intera, e quello che prepara una stagione si
  // fa dove hai deciso che è casa.
  //
  // Dieci pietre sono due muri di rovina abbattuti, ed è il costo che gli dà
  // senso: la pietra è l'unica risorsa dichiarata finita della valle, quindi
  // un focolare è la prima cosa che si paga davvero. Le quattro legne sono il
  // camino — i montanti e l'architrave che si vedono nel disegno — e non il
  // fuoco: quello si compra dopo, una legna alla volta, e il focolare arriva
  // freddo come arriva fredda la pietra.
  {
    id: "focolare",
    banco: true,
    produce: { cosa: "focolare", quante: 1 },
    costo: [
      { cosa: "pietra", quante: 10 },
      { cosa: "legna", quante: 4 },
    ],
  },
  // L'essiccatoio. Al banco, come tutto quello che prepara una stagione.
  //
  // Niente pietra: non è una cosa che si paga, è una cosa che si costruisce —
  // quattro legne per il telaio, due rami per le traverse, sei fili per le
  // corde a cui si appende. È il contrario esatto del focolare anche nel costo.
  //
  // Fili e non fibre da M7.18.2, ed è la prima ricetta che segue la regola dei
  // gradini. Al primo stanno le cose che si fanno con quello che si raccoglie
  // a mani nude dal primo minuto; al secondo quelle che vogliono un materiale
  // guadagnato con un attrezzo e con del tempo — il lino va zappato, seminato
  // e innaffiato. Quello che l'essiccatoio produce, il cibo che aspetta tre
  // stagioni, sta al secondo gradino, e allora ci sta anche lui: non si
  // costruisce il primo giorno, si sblocca col primo raccolto di lino.
  {
    id: "essiccatoio",
    banco: true,
    produce: { cosa: "essiccatoio", quante: 1 },
    costo: [
      { cosa: "legna", quante: 4 },
      { cosa: "ramo", quante: 2 },
      { cosa: "filo", quante: 6 },
    ],
  },
  {
    id: "giaciglio_pelli",
    banco: true,
    produce: { cosa: "giaciglio_pelli", quante: 1 },
    costo: [
      { cosa: "pelle", quante: 3 },
      { cosa: "filo", quante: 4 },
      { cosa: "legna", quante: 2 },
    ],
  },
  // La lenza è filo: con la fibra dei cespugli si lega una torcia, non si
  // tira fuori un pesce dall'acqua. È il motivo per cui la pesca arriva dopo
  // il primo lino, e non il primo giorno.
  {
    id: "canna",
    produce: { cosa: "canna", quante: 1 },
    costo: [{ cosa: "ramo", quante: 3 }, { cosa: "filo", quante: 4 }],
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
  //
  // Ma da M7.18.1 è di filo, ed è il legame più forte che il lino ha con il
  // resto del gioco: la benda è l'unica cura dell'infezione, quindi il campo
  // di lino è la farmacia. A mani nude si fa dove capita; il filo, invece, va
  // coltivato prima — o trovato già fatto nelle case, in forma di bende.
  {
    id: "benda",
    produce: { cosa: "benda", quante: 1 },
    costo: [{ cosa: "filo", quante: 3 }],
  },

  // --- al banco -----------------------------------------------------------
  // Gli attrezzi di pietra si rilegano con la fibra; la canna no, perché
  // quello che si consuma è la lenza, e una lenza si rifà di filo.
  ...["ascia", "zappa", "lancia", "canna"].map(cosa => ({
    id: "ripara_" + cosa, ripara: cosa, banco: true,
    produce: { cosa, quante: 1 },
    costo: [{ cosa: "pietra", quante: 1 }, { cosa: cosa === "canna" ? "filo" : "fibra", quante: 2 }],
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
  // Il pavimento: una legna per tassello, fatto a tre per volta. È il primo
  // passo da riparo a casa, e il letto ci si posa sopra.
  {
    id: "pavimento",
    banco: true,
    produce: { cosa: "pavimento", quante: 3 },
    costo: [{ cosa: "legna", quante: 3 }],
  },
  // Il letto: la cornice di legno, la paglia dentro, e il filo di lino per
  // cucire la fodera. Costa più di ogni altro letto, e rende quello che nessun
  // altro rende — si guarisce (vedi salute.js).
  {
    id: "letto",
    banco: true,
    produce: { cosa: "letto", quante: 1 },
    costo: [
      { cosa: "legna", quante: 10 },
      { cosa: "fibra", quante: 15 },
      { cosa: "filo", quante: 8 },
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
  // La conserva risponde all'inverno, che da M7.1 ha un orologio addosso:
  // quattro bacche diventano due vasi che durano un anno invece di tre giorni.
  // Erano sei fino a M7.18.3; con il filo nel costo il campo di lino è già il
  // prezzo vero, e sei bacche sopra erano una tassa in più.
  //
  // Da M7.18.3 è del secondo gradino, come l'essiccatoio: il vaso si chiude
  // col filo, non con la fibra, quindi non si fa il primo giorno. In cambio
  // ogni vaso sfama del tutto (vedi oggetti.js).
  {
    id: "conserva",
    banco: true,
    produce: { cosa: "conserva", quante: 2 },
    costo: [
      { cosa: "bacche", quante: 4 },
      { cosa: "filo", quante: 2 },
    ],
  },
  // Lo spaventapasseri, a mani nude: i rami per l'ossatura e la fibra per
  // farne un sacco. Da M7.18.22 quattro rami e dieci fibre invece di due e
  // quattro: costava così poco che se ne piantava uno per campo senza
  // pensarci, e la scelta con lo steccato non si poneva.
  {
    id: "spaventapasseri",
    produce: { cosa: "spaventapasseri", quante: 1 },
    costo: [
      { cosa: "ramo", quante: 4 },
      { cosa: "fibra", quante: 10 },
    ],
  },
  // Lo steccato e il cancello (M7.18.16), al banco. Lo spaventapasseri costa
  // quattro rami e copre un raggio di tre tasselli; il recinto costa legna per
  // ogni pezzo ma copre tutto quello che ci sta dentro, grande quanto lo si
  // fa — e più avanti terrà dentro gli animali. Due modi di proteggere lo
  // stesso campo, e la scelta fra i due è quanto è grande il campo.
  {
    id: "steccato",
    banco: true,
    produce: { cosa: "steccato", quante: 1 },
    // La fibra lega le traverse ai pali (M7.18.17): due legne e due rami
    // soltanto erano un recinto che si pagava con un albero e un cespuglio.
    costo: [
      { cosa: "legna", quante: 2 },
      { cosa: "ramo", quante: 2 },
      { cosa: "fibra", quante: 2 },
    ],
  },
  // Il cancello costa un po' di più: ha i cardini legati, e la fibra è quella.
  {
    id: "cancello",
    banco: true,
    produce: { cosa: "cancello", quante: 1 },
    costo: [
      { cosa: "legna", quante: 3 },
      { cosa: "ramo", quante: 2 },
      { cosa: "fibra", quante: 2 },
    ],
  },
  // Il pollaio (M7.18.18): riparo, mangiatoia e nido. Del secondo gradino,
  // come tutto quello che tiene in vita qualcosa per te: il filo di lino lega
  // il tetto.
  {
    id: "pollaio",
    banco: true,
    produce: { cosa: "pollaio", quante: 1 },
    costo: [
      { cosa: "legna", quante: 4 },
      { cosa: "fibra", quante: 4 },
      { cosa: "filo", quante: 2 },
    ],
  },
  // La zuppa è del secondo gradino senza bisogno di cambiarle il costo: vuole
  // un fuoco acceso, un secchio e due verdure dell'orto, cioè una zappa e dei
  // giorni di innaffiature. Niente di quello che chiede si raccoglie a mani
  // nude il primo giorno.
  //
  // La zuppa, ed è la prima ricetta che vuole un fuoco invece del banco: si
  // cuoce, non si costruisce. Due scodelle da una verdura, un cavolo e un
  // secchio d'acqua, e il secchio torna vuoto — un contenitore si svuota,
  // non si consuma, come quando si beve (vedi azioni.js). È la ragione per
  // tenere il cavolo accanto al focolare: da solo sfama poco, nella zuppa fa
  // di due verdure un pasto e mezzo.
  {
    id: "zuppa",
    fuoco: true,
    produce: { cosa: "zuppa", quante: 2 },
    rende: { cosa: "secchio", quante: 1 },
    costo: [
      { cosa: "rapa", quante: 1 },
      { cosa: "cavolo", quante: 1 },
      { cosa: "secchio_pieno", quante: 1 },
    ],
  },
  {
    id: "zuppa_patate",
    fuoco: true,
    produce: { cosa: "zuppa", quante: 2 },
    rende: { cosa: "secchio", quante: 1 },
    costo: [
      { cosa: "patata", quante: 1 },
      { cosa: "cavolo", quante: 1 },
      { cosa: "secchio_pieno", quante: 1 },
    ],
  },
];

// IL FILO VALE COME FIBRA, E NON IL CONTRARIO. Da M7.18.1 il lino non rende più
// fibra ma filo, e il motivo è che rendeva la stessa cosa dei cespugli: due
// strappi a mani nude valevano un campo innaffiato quattro volte, e nessuno
// coltiva quello che trova gratis lungo la strada. Adesso le ricette che
// cuciono — la benda, la lenza, le pelli — vogliono filo, e la fibra non basta.
//
// All'incontrario invece sì: il filo è fibra più fine, e un superstite che
// avanza dieci matasse non deve restare senza torcia perché i cespugli sono
// lontani. Così il lino non è mai un raccolto buttato, ma non si paga mai il
// filo con la paglia.
const VALE_ANCHE = { fibra: ["filo"] };

// Quanta roba conta per questa voce di costo: la cosa, più quello che la può
// sostituire. È quello che il pannello mostra accanto a "fibra", perché
// "0/2 FIBRA" con cinque fili nello zaino direbbe una bugia.
export function disponibili(cosa) {
  return (VALE_ANCHE[cosa] ?? []).reduce((somma, altra) => somma + inventario.quante(altra), inventario.quante(cosa));
}

// Il costo tradotto in quello che esce davvero dallo zaino, o null se non
// basta. Prima la cosa chiesta e poi i sostituti: chi ha fibra e filo paga in
// fibra, perché il filo è quello che la fibra non sa fare. Ed è anche quello
// che rende giusto il conto di una ricetta che volesse sia fibra sia filo:
// alla fibra va del filo solo per quello che la fibra non copre, cioè il
// minimo possibile, in qualunque ordine stiano le voci.
function spesa(costo) {
  const presi = new Map();
  const restano = (cosa) => inventario.quante(cosa) - (presi.get(cosa) ?? 0);
  const prendi = (cosa, quante) => presi.set(cosa, (presi.get(cosa) ?? 0) + quante);
  for (const voce of costo) {
    let manca = voce.quante;
    for (const cosa of [voce.cosa, ...(VALE_ANCHE[voce.cosa] ?? [])]) {
      const qui = Math.min(manca, Math.max(0, restano(cosa)));
      if (qui > 0) prendi(cosa, qui);
      manca -= qui;
    }
    if (manca > 0) return null;
  }
  return [...presi].map(([cosa, quante]) => ({ cosa, quante }));
}

export function bastano(ricetta) {
  return (!ricetta.ripara || Boolean(inventario.daRiparare(ricetta.ripara))) && spesa(ricetta.costo) !== null;
}

// Restituisce il motivo del rifiuto e non un no secco. I due modi di non
// poter costruire sono diversi e si risolvono in modi diversi — andare a
// raccogliere, o liberare una casella — e dirli entrambi "materiali
// insufficienti" mandava a cercare pietre chi aveva solo lo zaino pieno.
export function fai(ricetta, alBanco = false, alFuoco = false) {
  // Il banco prima dei materiali: chi sta in mezzo a un bosco con tutto il
  // necessario deve sentirsi dire che gli manca il posto, non la roba. E il
  // fuoco allo stesso modo.
  if (ricetta.banco && !alBanco) return { fatto: false, perche: "banco" };
  if (ricetta.fuoco && !alFuoco) return { fatto: false, perche: "fuoco" };
  if (ricetta.ripara && !inventario.daRiparare(ricetta.ripara)) {
    // Due no diversi, e vanno detti diversi: "non c'è niente da riparare" si
    // risolve aspettando di usarlo, "non si ripara più" si risolve rifacendolo.
    return { fatto: false, perche: inventario.troppoConsumato(ricetta.ripara) ? "consumato" : "integro" };
  }
  if (!bastano(ricetta)) return { fatto: false, perche: "materiali" };

  const costo = spesa(ricetta.costo);
  if (ricetta.ripara) {
    const attrezzo = inventario.daRiparare(ricetta.ripara);
    for (const voce of costo) inventario.togli(voce.cosa, voce.quante);
    // Nessuna casella aggiuntiva: si ripara lo stesso oggetto, anche a zaino
    // pieno. E non torna nuovo: ogni riparazione gli toglie un pezzo di quello
    // che reggeva (vedi inventario.js), finché non resta che rifarlo.
    inventario.ripara(attrezzo);
    bisogni.consuma("stanchezza", 0.02);
    return { fatto: true, massimo: inventario.massimoDi(attrezzo) };
  }
  if (!inventario.trasforma(costo, ricetta.rende ? [ricetta.produce, ricetta.rende] : ricetta.produce)) {
    return { fatto: false, perche: "zaino" };
  }
  bisogni.consuma("stanchezza", 0.02);
  return { fatto: true };
}

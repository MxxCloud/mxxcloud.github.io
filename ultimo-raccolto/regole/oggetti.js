// Le cose: cosa sono, cosa rendono, quanto costa staccarle dal mondo.

import { OGGETTO } from "../mondo/generazione.js";
import * as arte from "../arte/sprite-cose.js";
import * as impugnati from "../arte/sprite-impugnati.js";

// Gli identificatori sono testo e non numeri di proposito: finiranno nei
// salvataggi, e un salvataggio che dice "legna" sopravvive a un riordino del
// catalogo, mentre uno che dice 3 no.
export const CATALOGO = {
  legna: { nome: "Legna", icona: arte.LEGNA, pila: 40 },
  ramo: { nome: "Ramo", icona: arte.RAMO, pila: 40 },
  pietra: { nome: "Pietra", icona: arte.PIETRA, pila: 40 },
  fibra: { nome: "Fibra", icona: arte.FIBRA, pila: 60 },
  // L'unico cibo che esiste, il che rende i cespugli improvvisamente
  // preziosi. Fino a M3 non ce ne sarà altro: l'orto è la risposta a questa
  // scarsità, non un contorno.
  bacche: {
    nome: "Bacche",
    icona: arte.BACCHE,
    pila: 20,
    commestibile: { fame: 0.3 },
  },
  // La torcia serve in due modi, entrambi visibili: in mano illumina chi la
  // porta, piantata resta accesa dove l'hai lasciata.
  torcia: {
    nome: "Torcia",
    icona: arte.TORCIA,
    pila: 10,
    posa: OGGETTO.TORCIA_PIANTATA,
    impugnato: { nome: "torcia", righe: impugnati.TORCIA, scartoY: 2 },
    luce: { raggio: 46, intensita: 0.9 },
  },
  ascia: {
    nome: "Ascia",
    icona: arte.ASCIA,
    pila: 1,
    // Più in basso della torcia: appesa al pugno, non issata accanto
    // all'orecchio.
    impugnato: { nome: "ascia", righe: impugnati.ASCIA, scartoY: 5 },
  },
  giaciglio: {
    nome: "Giaciglio",
    icona: arte.GIACIGLIO,
    pila: 3,
    posa: OGGETTO.GIACIGLIO,
  },
  falo: { nome: "Falò", icona: arte.FALO, pila: 5, posa: OGGETTO.FALO_ACCESO },
};

// Cosa fa un attrezzo tenuto in mano. La regola del gioco è una sola —
// quello che impugni è quello che usi — e vale tanto per la torcia, che
// illumina, quanto per l'ascia, che abbatte in meno colpi.
export const ATTREZZI = {
  ascia: { colpi: { [OGGETTO.ALBERO]: 2 } },
};

// Quanti colpi servono davvero, tenuto conto di cosa si ha in mano. A mani
// nude restano quattro per un albero: l'attrezzo è una ricompensa, non un
// rattoppo a un numero sbagliato.
export function colpiNecessari(oggetto, cosaInMano) {
  const raccolta = RACCOLTA[oggetto];
  if (!raccolta) return 0;
  return ATTREZZI[cosaInMano]?.colpi?.[oggetto] ?? raccolta.colpi;
}

export function nomeDi(cosa) {
  return CATALOGO[cosa]?.nome ?? cosa;
}

// Quanti colpi serve dare e cosa ne esce. I colpi non sono una tassa: sono
// ciò che rende l'abbattere un albero una decisione invece di un riflesso —
// e più avanti, quando ci sarà qualcosa che ti sente, anche un rischio.
export const RACCOLTA = {
  [OGGETTO.ALBERO]: {
    verbo: "Abbatti",
    colpi: 4,
    // Chiavi della tavolozza e non colori scritti a mano: se un giorno la
    // chioma cambia tinta, cambiano anche le scheggie senza che nessuno se lo
    // debba ricordare.
    //
    // Sono volutamente più chiare dell'albero: legno vivo e foglia in luce.
    // Con i colori della chioma sparivano dentro la chioma, che è il modo più
    // sicuro di costruire un riscontro che non si vede.
    scheggie: ["w", "w", "k", "h"],
    resa: [
      { cosa: "legna", quante: 3 },
      { cosa: "ramo", quante: 1 },
    ],
  },
  [OGGETTO.SASSO]: {
    verbo: "Spacca",
    colpi: 2,
    scheggie: ["f", "s", "e"],
    resa: [{ cosa: "pietra", quante: 2 }],
  },
  [OGGETTO.CESPUGLIO]: {
    verbo: "Strappa",
    colpi: 1,
    scheggie: ["k", "a", "w"],
    resa: [
      { cosa: "fibra", quante: 2 },
      // Le bacche non escono sempre: un cespuglio su tre ne ha. Serve a dare
      // un motivo per strapparli tutti invece di quello più comodo.
      { cosa: "bacche", quante: 1, probabilita: 0.34 },
    ],
  },
  [OGGETTO.FALO_ACCESO]: {
    verbo: "Raccogli",
    colpi: 1,
    scheggie: ["u", "v", "g"],
    resa: [{ cosa: "falo", quante: 1 }],
  },
  [OGGETTO.TORCIA_PIANTATA]: {
    verbo: "Raccogli",
    colpi: 1,
    scheggie: ["u", "v"],
    resa: [{ cosa: "torcia", quante: 1 }],
  },
  // Di giorno si raccoglie, di notte ci si dorme: è azioni.js a decidere
  // quale dei due, in base all'ora. Un giaciglio che di notte si smonta
  // invece di accogliere sarebbe una trappola.
  [OGGETTO.GIACIGLIO]: {
    verbo: "Raccogli",
    colpi: 1,
    scheggie: ["9", "a", "h"],
    resa: [{ cosa: "giaciglio", quante: 1 }],
  },
  [OGGETTO.FALO_SPENTO]: {
    verbo: "Raccogli",
    colpi: 1,
    resa: [{ cosa: "falo", quante: 1 }],
  },
};

export function raccoltaDi(oggetto) {
  return RACCOLTA[oggetto];
}

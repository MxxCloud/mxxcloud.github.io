// Le cose: cosa sono, cosa rendono, quanto costa staccarle dal mondo.

import { OGGETTO } from "../mondo/generazione.js";
import * as arte from "../arte/sprite-cose.js";

// Gli identificatori sono testo e non numeri di proposito: finiranno nei
// salvataggi, e un salvataggio che dice "legna" sopravvive a un riordino del
// catalogo, mentre uno che dice 3 no.
export const CATALOGO = {
  legna: { nome: "Legna", icona: arte.LEGNA, pila: 40 },
  ramo: { nome: "Ramo", icona: arte.RAMO, pila: 40 },
  pietra: { nome: "Pietra", icona: arte.PIETRA, pila: 40 },
  fibra: { nome: "Fibra", icona: arte.FIBRA, pila: 60 },
  bacche: { nome: "Bacche", icona: arte.BACCHE, pila: 20 },
  torcia: { nome: "Torcia", icona: arte.TORCIA, pila: 10 },
  falo: { nome: "Falò", icona: arte.FALO, pila: 5, posa: OGGETTO.FALO_ACCESO },
};

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
    resa: [
      { cosa: "legna", quante: 3 },
      { cosa: "ramo", quante: 1 },
    ],
  },
  [OGGETTO.SASSO]: {
    verbo: "Spacca",
    colpi: 2,
    resa: [{ cosa: "pietra", quante: 2 }],
  },
  [OGGETTO.CESPUGLIO]: {
    verbo: "Strappa",
    colpi: 1,
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
    resa: [{ cosa: "falo", quante: 1 }],
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

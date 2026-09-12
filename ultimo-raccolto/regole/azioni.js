// Quello che il giocatore fa al mondo: raccogliere e posare.

import * as schermo from "../motore/schermo.js";
import * as mappa from "../mondo/mappa.js";
import * as modifiche from "../mondo/modifiche.js";
import * as inventario from "./inventario.js";
import { impronta } from "../motore/casuale.js";
import { OGGETTO } from "../mondo/generazione.js";
import { CATALOGO, raccoltaDi, colpiNecessari } from "./oggetti.js";

const { TASSELLO } = schermo;

const SCARTI = {
  su: [0, -1],
  giu: [0, 1],
  sinistra: [-1, 0],
  destra: [1, 0],
};

// Il tassello davanti ai piedi, non quello sotto: si agisce su ciò che si ha
// di fronte, che è anche l'unico modo di posare un falò senza restarci dentro.
export function bersaglio(eroe) {
  const [dx, dy] = SCARTI[eroe.guarda] ?? SCARTI.giu;
  const tx = Math.floor(eroe.px / TASSELLO) + dx;
  const ty = Math.floor(eroe.py / TASSELLO) + dy;
  return { tx, ty, oggetto: mappa.oggettoDi(tx, ty) };
}

// Cosa succederebbe premendo adesso il tasto. Serve all'interfaccia, che deve
// poterlo dire prima invece di lasciare indovinare.
export function azionePossibile(eroe, cosaInMano) {
  const b = bersaglio(eroe);
  const raccolta = raccoltaDi(b.oggetto);
  if (raccolta) {
    const dati = modifiche.di(b.tx, b.ty);
    const gia = dati?.colpi ?? 0;
    // Mai sotto uno: chi comincia a mani nude e passa all'ascia ha già dato
    // più colpi di quanti ne servano, e "restano 0" sarebbe una bugia.
    const restano = Math.max(1, colpiNecessari(b.oggetto, cosaInMano) - gia);
    return { tipo: "raccogli", verbo: raccolta.verbo, restano, bersaglio: b };
  }
  const posa = cosaInMano && CATALOGO[cosaInMano]?.posa;
  if (posa !== undefined && posa !== null && posabile(b)) {
    return { tipo: "posa", verbo: "Posa", cosa: cosaInMano, bersaglio: b };
  }
  return null;
}

function posabile(b) {
  if (b.oggetto !== OGGETTO.NESSUNO) return false;
  // Non si costruisce nell'acqua. Il resto del terreno va bene: la roccia è
  // sassosa, non è una parete.
  return !mappa.solidoIn(b.tx, b.ty);
}

// L'esito della raccolta è deciso dalle coordinate, non dal caso del momento:
// lo stesso cespuglio ha le bacche o non le ha, sempre. Oltre a rispettare la
// regola che qui Math.random non esiste, rende il mondo una cosa che si può
// imparare invece di una lotteria.
function resaDi(raccolta, tx, ty) {
  const seme = mappa.semeCorrente().valore;
  const ottenuto = [];
  raccolta.resa.forEach((voce, i) => {
    if (voce.probabilita !== undefined) {
      if (impronta(tx + i * 101, ty - i * 57, seme ^ 0x3c6ef372) > voce.probabilita) return;
    }
    ottenuto.push({ cosa: voce.cosa, quante: voce.quante });
  });
  return ottenuto;
}

// Restituisce un resoconto di cosa è successo, perché l'interfaccia deve
// poterlo dire al giocatore: un colpo che non ottiene niente e un colpo che
// abbatte un albero non possono sembrare lo stesso gesto.
export function agisci(eroe, cosaInMano) {
  const azione = azionePossibile(eroe, cosaInMano);
  if (!azione) return null;

  const { tx, ty } = azione.bersaglio;

  if (azione.tipo === "posa") {
    if (!inventario.togli(azione.cosa, 1)) return null;
    mappa.cambiaTassello(tx, ty, { oggetto: CATALOGO[azione.cosa].posa });
    return { tipo: "posa", tx, ty, cosa: azione.cosa };
  }

  const oggetto = azione.bersaglio.oggetto;
  const raccolta = raccoltaDi(oggetto);
  const precedente = modifiche.di(tx, ty) ?? {};
  const colpi = (precedente.colpi ?? 0) + 1;
  const necessari = colpiNecessari(oggetto, cosaInMano);

  if (colpi < necessari) {
    // Annota e basta: l'albero è ancora lo stesso albero, quindi il settore
    // non va ricotto — e se lo fosse, cancellerebbe il tremolio appena
    // cominciato.
    mappa.annotaTassello(tx, ty, { ...precedente, colpi });
    return { tipo: "colpo", tx, ty, scheggie: raccolta.scheggie, restano: necessari - colpi };
  }

  const ottenuto = resaDi(raccolta, tx, ty);
  const avanzate = [];
  for (const voce of ottenuto) {
    const resto = inventario.aggiungi(voce.cosa, voce.quante);
    if (resto > 0) avanzate.push({ cosa: voce.cosa, quante: resto });
  }

  // L'oggetto sparisce comunque, anche se lo zaino era pieno: è il prezzo di
  // non guardare prima. L'interfaccia lo dice chiaramente.
  mappa.cambiaTassello(tx, ty, { oggetto: OGGETTO.NESSUNO });
  return { tipo: "raccolto", tx, ty, scheggie: raccolta.scheggie, ottenuto, avanzate };
}

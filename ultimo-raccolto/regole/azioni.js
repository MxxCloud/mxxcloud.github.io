// Quello che il giocatore fa al mondo: raccogliere e posare.

import * as schermo from "../motore/schermo.js";
import * as mappa from "../mondo/mappa.js";
import * as modifiche from "../mondo/modifiche.js";
import * as inventario from "./inventario.js";
import { impronta } from "../motore/casuale.js";
import { OGGETTO, TERRENO } from "../mondo/generazione.js";
import * as tempo from "./tempo.js";
import * as bisogni from "./bisogni.js";
import { CATALOGO, ATTREZZI, raccoltaDi, colpiNecessari } from "./oggetti.js";
import * as orto from "./orto.js";

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
// Quanto ristora un sorso. Bastano un paio di volte al giorno, che è il
// ritmo giusto perché bere sia un gesto e non un lavoro.
const SORSO = 0.45;

export function azionePossibile(eroe, cosaInMano) {
  const b = bersaglio(eroe);

  // Di notte il giaciglio accoglie, di giorno si smonta. Un giaciglio che di
  // notte si smonta invece di accogliere sarebbe una trappola; e dormire di
  // giorno salterebbe la giornata invece della notte, che è il contrario di
  // quello che serve.
  if (b.oggetto === OGGETTO.GIACIGLIO && tempo.eNotte()) {
    return { tipo: "dormi", verbo: "Dormi", bersaglio: b };
  }

  const raccolta = raccoltaDi(b.oggetto);
  if (raccolta) {
    const dati = modifiche.di(b.tx, b.ty);
    const gia = dati?.colpi ?? 0;
    // Mai sotto uno: chi comincia a mani nude e passa all'ascia ha già dato
    // più colpi di quanti ne servano, e "restano 0" sarebbe una bugia.
    const restano = Math.max(1, colpiNecessari(b.oggetto, cosaInMano) - gia);
    return { tipo: "raccogli", verbo: raccolta.verbo, restano, bersaglio: b };
  }
  const terreno = mappa.terrenoDi(b.tx, b.ty);
  const acqua = terreno === TERRENO.ACQUA || terreno === TERRENO.ACQUA_BASSA;

  // Alla riva: con un secchio vuoto in mano si riempie, altrimenti si beve.
  // Decide quello che si ha in mano, come per tutto il resto — non il
  // contesto, che costringerebbe a indovinare.
  if (acqua && cosaInMano === "secchio") {
    return { tipo: "riempi", verbo: "Riempi i secchi", bersaglio: b };
  }
  if (acqua) {
    if (bisogni.livello("sete") < 1) {
      return { tipo: "bevi", verbo: "Bevi", bersaglio: b };
    }
    return null;
  }

  // La zappa non accorcia un lavoro: ne apre uno che senza di lei non
  // esiste.
  if (ATTREZZI[cosaInMano]?.zappa && b.oggetto === OGGETTO.NESSUNO && zappabile(terreno)) {
    return { tipo: "zappa", verbo: "Zappa", bersaglio: b };
  }

  if (cosaInMano === "semi" && b.oggetto === OGGETTO.TERRA_ZAPPATA) {
    return { tipo: "semina", verbo: "Semina", bersaglio: b };
  }

  if (cosaInMano === "secchio_pieno" && orto.siPuoInnaffiare(b.oggetto)) {
    const gia = modifiche.di(b.tx, b.ty)?.bagnato === true;
    if (!gia) return { tipo: "innaffia", verbo: "Innaffia", bersaglio: b };
    return null;
  }

  const posa = cosaInMano && CATALOGO[cosaInMano]?.posa;
  if (posa !== undefined && posa !== null && posabile(b)) {
    return { tipo: "posa", verbo: "Posa", cosa: cosaInMano, bersaglio: b };
  }
  return null;
}

// Si zappa dove cresce qualcosa di erbaceo, non sulla roccia né sulla
// sabbia: un orto ha bisogno di terra, e dirlo con i terreni invece che con
// un messaggio evita di spiegarlo.
function zappabile(terreno) {
  return terreno === TERRENO.ERBA || terreno === TERRENO.STERPAGLIA || terreno === TERRENO.TERRA;
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

// Usare quello che si ha in mano su di sé. Sta fuori da agisci() perché non
// ha un bersaglio: mangiare non ha un davanti, e infilarlo nella barra
// avrebbe voluto dire decidere se si mangia o si abbatte l'albero che si ha
// di fronte. Da M5 serve anche alle bende.
export function consuma(cosaInMano) {
  const effetto = cosaInMano && CATALOGO[cosaInMano]?.commestibile;
  if (!effetto) return null;
  if (!inventario.togli(cosaInMano, 1)) return null;

  const ristorato = {};
  for (const [quale, quanto] of Object.entries(effetto)) {
    ristorato[quale] = bisogni.ristora(quale, quanto);
  }
  return { tipo: "consumato", cosa: cosaInMano, ristorato };
}

// Restituisce un resoconto di cosa è successo, perché l'interfaccia deve
// poterlo dire al giocatore: un colpo che non ottiene niente e un colpo che
// abbatte un albero non possono sembrare lo stesso gesto.
export function agisci(eroe, cosaInMano) {
  const azione = azionePossibile(eroe, cosaInMano);
  if (!azione) return null;

  const { tx, ty } = azione.bersaglio;

  if (azione.tipo === "bevi") {
    bisogni.ristora("sete", SORSO);
    return { tipo: "bevi" };
  }

  if (azione.tipo === "riempi") {
    // Si riempiono tutti in una volta: andare avanti e indietro una volta per
    // secchio sarebbe una passeggiata obbligatoria, non una scelta.
    const quanti = inventario.quante("secchio");
    if (quanti === 0) return null;
    inventario.togli("secchio", quanti);
    inventario.aggiungi("secchio_pieno", quanti);
    return { tipo: "riempi", quanti };
  }

  if (azione.tipo === "zappa") {
    mappa.cambiaTassello(tx, ty, { oggetto: OGGETTO.TERRA_ZAPPATA });
    return { tipo: "zappa" };
  }

  if (azione.tipo === "semina") {
    if (!inventario.togli("semi", 1)) return null;
    mappa.cambiaTassello(tx, ty, { oggetto: OGGETTO.SEMINATO });
    return { tipo: "semina" };
  }

  if (azione.tipo === "innaffia") {
    if (!inventario.togli("secchio_pieno", 1)) return null;
    inventario.aggiungi("secchio", 1);
    orto.innaffia(tx, ty, azione.bersaglio.oggetto);
    return { tipo: "innaffia" };
  }

  if (azione.tipo === "dormi") {
    // Il tempo saltato si paga: si salta la notte, non il proprio
    // metabolismo. Senza questo, dormire sarebbe un tasto per far sparire i
    // problemi invece di una scelta fra riposare e restare svegli.
    const secondi = tempo.secondiFinoAlle(tempo.ALBA_PIENA);
    tempo.avanza(secondi);
    bisogni.passanoSecondi(secondi);
    bisogni.ristora("stanchezza", 1);
    return { tipo: "dormi", secondi };
  }

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

// L'orto: la prima cosa che è tua.
//
// È la prima volta che il gioco chiede di tornare in un posto, che è la
// definizione minima di averne uno. Fino a qui si poteva andare in qualunque
// direzione senza perdere niente; da adesso lasciare l'orto senza acqua ha
// una conseguenza.
//
// Orto e fame si tengono a vicenda: senza la fame l'orto sarebbe decorazione,
// senza l'orto la fame sarebbe solo una tassa. Con le stagioni si aggiunge il
// terzo lato: l'orto ha una finestra, e la finestra si chiude da sola.

import { OGGETTO } from "../mondo/generazione.js";
import * as mappa from "../mondo/mappa.js";
import * as modifiche from "../mondo/modifiche.js";
import * as tempo from "./tempo.js";
import * as stagioni from "./stagioni.js";

// In ordine di crescita: ogni giorno innaffiato avanza di uno.
export const CRESCITA = [
  OGGETTO.SEMINATO,
  OGGETTO.GERMOGLIO,
  OGGETTO.CRESCIUTA,
  OGGETTO.MATURA,
];

// Quanti giorni una coltura matura resta buona. Tre: è il tempo di accorgersi
// che è pronta e di tornare, ma non di dimenticarsene per una stagione. È la
// metà del pilastro che si riprende le cose applicata alla più piccola scala
// che esista — un campo maturo lasciato lì marcisce in piedi.
export const GIORNI_DI_MATURITA = 3;

export function eColtura(oggetto) {
  return CRESCITA.includes(oggetto);
}

export function eMatura(oggetto) {
  return oggetto === OGGETTO.MATURA;
}

export function eAppassita(oggetto) {
  return oggetto === OGGETTO.APPASSITA;
}

export function siPuoInnaffiare(oggetto) {
  return oggetto === OGGETTO.TERRA_ZAPPATA || (eColtura(oggetto) && !eMatura(oggetto));
}

// I tasselli toccati si contano a mano invece di essere tenuti in un elenco
// a parte: le modifiche sono già l'elenco di tutto ciò che il giocatore ha
// cambiato, e un secondo elenco da tenere in sincronia sarebbe un secondo
// elenco da sbagliare.
function coltureBagnate() {
  const pronte = [];
  modifiche.perOgnuno((tx, ty, cambio) => {
    if (!cambio.bagnato) return;
    if (!eColtura(cambio.oggetto)) return;
    if (eMatura(cambio.oggetto)) return;
    pronte.push({ tx, ty, oggetto: cambio.oggetto });
  });
  return pronte;
}

// Da chiamare a ogni cambio di giorno, e restituisce cosa è successo perché
// l'interfaccia deve poterlo dire: una coltura cresciuta e un campo morto
// nella notte non possono passare tutti e due in silenzio.
//
// Si raccoglie prima e si modifica poi: cambiare le modifiche mentre le si
// sta scorrendo è il modo classico di perdersi metà dell'orto.
export function nuovoGiorno() {
  const giorno = tempo.giornoCorrente();
  const siColtiva = stagioni.siColtiva();

  // D'inverno muore tutto quello che era piantato, maturo compreso: è la
  // scadenza, ed è la ragione per cui esiste una stagione buona. Si guarda
  // prima di far crescere, perché crescere e morire lo stesso giorno sarebbe
  // una crescita che nessuno ha visto.
  const appassite = [];
  const daDatare = [];
  modifiche.perOgnuno((tx, ty, cambio) => {
    if (!eColtura(cambio.oggetto)) return;
    if (!siColtiva) {
      appassite.push({ tx, ty });
      return;
    }
    if (!eMatura(cambio.oggetto)) return;
    // Un maturo non raccolto ha i giorni contati. Il momento in cui è maturato
    // è scritto sul tassello: è il solo dato in più che serve, e vive dove
    // vivono tutte le altre eccezioni al mondo calcolato.
    //
    // Senza data si assume maturato adesso e la si scrive. Non è un caso di
    // scuola: senza scriverla, il confronto darebbe zero ogni giorno e quella
    // coltura non marcirebbe mai — un "non succede niente" che nessuna prova
    // noterebbe.
    if (cambio.maturata === undefined) {
      daDatare.push({ tx, ty, cambio });
      return;
    }
    if (giorno - cambio.maturata >= GIORNI_DI_MATURITA) appassite.push({ tx, ty });
  });
  for (const { tx, ty, cambio } of daDatare) {
    modifiche.imposta(tx, ty, { ...cambio, maturata: giorno });
  }
  for (const { tx, ty } of appassite) {
    mappa.cambiaTassello(tx, ty, { oggetto: OGGETTO.APPASSITA });
  }

  let cresciute = 0;
  if (siColtiva) {
    for (const { tx, ty, oggetto } of coltureBagnate()) {
      const prossimo = CRESCITA[CRESCITA.indexOf(oggetto) + 1];
      if (prossimo === undefined) continue;
      // Chi arriva a maturo si porta dietro la data: da lì parte il conto dei
      // giorni buoni.
      const cambio = { oggetto: prossimo };
      if (eMatura(prossimo)) cambio.maturata = giorno;
      mappa.cambiaTassello(tx, ty, cambio);
      cresciute += 1;
    }
  }

  // Anche la terra zappata e lasciata lì si asciuga: innaffiare in anticipo
  // non deve valere come innaffiare al momento giusto.
  const daAsciugare = [];
  modifiche.perOgnuno((tx, ty, cambio) => {
    if (cambio.bagnato) daAsciugare.push({ tx, ty, cambio });
  });
  for (const { tx, ty, cambio } of daAsciugare) {
    const { bagnato, ...resto } = cambio;
    mappa.cambiaTassello(tx, ty, resto);
  }

  return { cresciute, appassite: appassite.length };
}

export function innaffia(tx, ty, oggetto) {
  mappa.cambiaTassello(tx, ty, { oggetto, bagnato: true });
}

export function quante() {
  let n = 0;
  modifiche.perOgnuno((tx, ty, cambio) => {
    if (eColtura(cambio.oggetto)) n += 1;
  });
  return n;
}

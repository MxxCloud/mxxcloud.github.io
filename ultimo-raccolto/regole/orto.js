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
import * as meteo from "./meteo.js";

// In ordine di crescita: ogni giorno innaffiato avanza di uno. Quattro stadi,
// quindi tre innaffiature dalla semina al raccolto.
//
// Il germoglio era stato tolto quando l'orto rendeva poco e un'innaffiatura
// saltata costava soltanto un giorno: allora il margine serviva a non perdere
// tutto per l'inverno. Da M7.16 l'orto costa di più per un'altra strada — si
// secca, e i semi si guadagnano — e il giorno in più torna a essere tempo che
// il campo ti chiede. La scadenza vera è l'autunno: chi semina il primo giorno
// raccoglie l'ultimo, chi semina il secondo lo lascia all'inverno.
export const CRESCITA = [
  OGGETTO.SEMINATO,
  OGGETTO.GERMOGLIO,
  OGGETTO.CRESCIUTA,
  OGGETTO.MATURA,
];

// Gli stadi che non fanno più parte della crescita ma possono ancora trovarsi
// in un salvataggio scritto prima, con lo stadio che ne prende il posto. Oggi
// non ce n'è nessuno — il germoglio che stava qui è tornato nella fila — ma la
// strada resta, perché la fila è già cambiata due volte.
const RITIRATI = {};

// Quanti giorni una coltura matura resta da mangiare, e quanti poi resta a
// seme prima di seccarsi. Due e due: il tempo di accorgersi che è pronta e di
// scegliere, non di dimenticarsene. Prima una matura marciva dopo tre giorni e
// basta; adesso nel mezzo c'è l'unico posto da cui vengono i semi, quindi
// lasciarla lì non è più solo una dimenticanza — può essere una decisione.
export const GIORNI_DI_MATURITA = 2;
export const GIORNI_A_SEME = 2;

// Quanta sete uccide. Un giorno senz'acqua ferma la pianta e le ingiallisce le
// foglie; il terzo di fila la secca. D'estate l'aria è arida e un giorno
// senz'acqua conta due, quindi basta il secondo: la stagione che asseta il
// superstite asseta anche il campo.
//
// Prima un'innaffiatura saltata costava un giorno e basta, quindi l'orto non
// chiedeva niente: si poteva seminare e tornare quando capitava. È la metà del
// pilastro che si riprende le cose, applicata a quella che le si dà da bere.
//
// E non due, che era la prima idea: con due, d'estate un giorno dimenticato
// seccava il campo intero, e l'orto diventava un obbligo di ogni cinque minuti
// invece di una cosa da curare. Misurato su sei tasselli e un anno di stagioni
// buone: saltando un giorno su quattro, con due si raccoglieva un settimo di
// quanto rende la cura perfetta, con tre la metà. Un giorno perso deve costare
// un giorno — che in una stagione di quattro è già molto — non tutto.
export const SETE_MORTALE = 3;

// Quanta sete fa patire il giorno dato a chi non beve.
function seteDi(giorno) {
  return meteo.evento(giorno) === "arido" ? 2 : 1;
}

// Una pianta assetata secca stanotte se nessuno la innaffia oggi? Serve a chi
// la guarda: "ha sete" e "stanotte è morta" chiedono due fretta diverse.
export function seccaStanotte(cambio, giorno = tempo.giornoCorrente()) {
  return (cambio?.secco ?? 0) + seteDi(giorno) >= SETE_MORTALE;
}

export function eColtura(oggetto) {
  return CRESCITA.includes(oggetto) || oggetto in RITIRATI || oggetto === OGGETTO.A_SEME;
}

// Lo stadio dopo, o niente se è l'ultimo. Passa dai ritirati, così una coltura
// di un salvataggio vecchio rientra nella catena nuova al primo giorno
// innaffiato.
function prossimoStadio(oggetto) {
  if (oggetto in RITIRATI) return RITIRATI[oggetto];
  return CRESCITA[CRESCITA.indexOf(oggetto) + 1];
}

export function eMatura(oggetto) {
  return oggetto === OGGETTO.MATURA;
}

export function eAppassita(oggetto) {
  return oggetto === OGGETTO.APPASSITA;
}

// Sta ancora crescendo, cioè beve? La matura e quella andata a seme hanno
// finito: il loro orologio è un altro.
function inCrescita(oggetto) {
  return eColtura(oggetto) && !eMatura(oggetto) && oggetto !== OGGETTO.A_SEME;
}

// Il seme nella terra asciutta aspetta, e non muore: è quello che fa un seme.
// La sete la patisce solo quello che è già spuntato.
function spuntata(oggetto) {
  return inCrescita(oggetto) && oggetto !== OGGETTO.SEMINATO;
}

export function siPuoInnaffiare(oggetto) {
  return oggetto === OGGETTO.TERRA_ZAPPATA || inCrescita(oggetto);
}

// Quello che l'acqua fa a un tassello, detto una volta sola per il secchio e
// per la pioggia: lo bagna, e toglie la sete — una pianta assetata e poi
// innaffiata ha rotto la fila dei giorni asciutti, e le foglie tornano verdi
// subito, che è anche la risposta al gesto che serve.
export function bagna(cambio) {
  const { secco, ...resto } = cambio;
  return { ...resto, bagnato: true };
}

// Da chiamare a ogni cambio di giorno, e restituisce cosa è successo perché
// l'interfaccia deve poterlo dire: una coltura cresciuta, una seccata e un
// campo morto nella notte non possono passare in silenzio.
//
// Si raccoglie prima e si modifica poi: cambiare le modifiche mentre le si
// sta scorrendo è il modo classico di perdersi metà dell'orto.
export function nuovoGiorno() {
  const giorno = tempo.giornoCorrente();
  const siColtiva = stagioni.siColtiva();
  // La sete è quella del giorno appena finito, non di quello che comincia.
  const sete = seteDi(giorno - 1);

  const appassite = [];
  const seccate = [];
  const aSeme = [];
  const assetate = [];
  const daCrescere = [];
  const daDatare = [];
  modifiche.perOgnuno((tx, ty, cambio) => {
    if (!eColtura(cambio.oggetto)) return;
    // D'inverno muore tutto quello che era piantato, maturo e a seme
    // compresi: è la scadenza, ed è la ragione per cui esiste una stagione
    // buona. Si guarda prima di far crescere, perché crescere e morire lo
    // stesso giorno sarebbe una crescita che nessuno ha visto.
    if (!siColtiva) {
      appassite.push({ tx, ty });
      return;
    }
    if (!inCrescita(cambio.oggetto)) {
      // Una matura ha i giorni contati, e anche quella a seme: il momento in
      // cui è maturata è scritto sul tassello, ed è il solo dato che serve a
      // tutte e due. Senza data si assume adesso e la si scrive — senza
      // scriverla il confronto darebbe zero ogni giorno e quella coltura non
      // cambierebbe mai, un "non succede niente" che nessuna prova noterebbe.
      if (cambio.maturata === undefined) {
        daDatare.push({ tx, ty, cambio });
        return;
      }
      const eta = giorno - cambio.maturata;
      if (cambio.oggetto === OGGETTO.A_SEME && eta >= GIORNI_DI_MATURITA + GIORNI_A_SEME) {
        appassite.push({ tx, ty });
      } else if (eMatura(cambio.oggetto) && eta >= GIORNI_DI_MATURITA) {
        aSeme.push({ tx, ty, cambio });
      }
      return;
    }
    if (cambio.bagnato) {
      daCrescere.push({ tx, ty, cambio });
      return;
    }
    if (!spuntata(cambio.oggetto)) return;
    const secco = (cambio.secco ?? 0) + sete;
    if (secco >= SETE_MORTALE) seccate.push({ tx, ty });
    else assetate.push({ tx, ty, cambio: { ...cambio, secco } });
  });

  for (const { tx, ty, cambio } of daDatare) {
    modifiche.imposta(tx, ty, { ...cambio, maturata: giorno });
  }
  for (const { tx, ty } of [...appassite, ...seccate]) {
    mappa.cambiaTassello(tx, ty, { oggetto: OGGETTO.APPASSITA });
  }
  for (const { tx, ty, cambio } of aSeme) {
    mappa.cambiaTassello(tx, ty, { ...cambio, oggetto: OGGETTO.A_SEME });
  }
  for (const { tx, ty, cambio } of assetate) {
    mappa.cambiaTassello(tx, ty, cambio);
  }

  let cresciute = 0;
  for (const { tx, ty, cambio } of daCrescere) {
    const prossimo = prossimoStadio(cambio.oggetto);
    if (prossimo === undefined) continue;
    // Crescere asciuga e toglie la sete, e chi arriva a maturo si porta
    // dietro la data: da lì parte il conto dei giorni buoni.
    const { bagnato, secco, ...resto } = cambio;
    const nuovo = { ...resto, oggetto: prossimo };
    if (eMatura(prossimo)) nuovo.maturata = giorno;
    mappa.cambiaTassello(tx, ty, nuovo);
    cresciute += 1;
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

  return {
    cresciute,
    appassite: appassite.length,
    seccate: seccate.length,
    assetate: assetate.length,
    aSeme: aSeme.length,
  };
}

export function innaffia(tx, ty, oggetto) {
  mappa.cambiaTassello(tx, ty, bagna({ ...(modifiche.di(tx, ty) ?? {}), oggetto }));
}

export function quante() {
  let n = 0;
  modifiche.perOgnuno((tx, ty, cambio) => {
    if (eColtura(cambio.oggetto)) n += 1;
  });
  return n;
}

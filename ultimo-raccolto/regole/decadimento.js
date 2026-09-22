// Quello che lasci non ti aspetta.
//
// L'orto ha già la sua scadenza, ma da solo direbbe che il mondo si riprende
// soltanto le piante. Qui ci sono le altre cose che il giocatore lascia dietro
// di sé e che smettono di funzionare da sole: i fuochi.
//
// Il falò acceso e la torcia piantata erano le due cose che rendevano un posto
// abitabile e restavano accese per sempre. Un accampamento che non chiede
// niente a nessuno non è un accampamento, è un monumento — e l'unica ragione
// per tornare in un posto dev'essere che il posto ne ha bisogno.
//
// E il cibo, che da questa tappa si guasta.
//
// Per sei tappe non si guastava da nessuna parte, e il commento che stava qui
// diceva perché: finché non ci sono contenitori in cui mettere le cose al
// sicuro, far marcire anche i mucchi toglie l'unico ripostiglio che esiste, e
// far marcire lo zaino mentre il terreno è una dispensa eterna insegna
// soltanto a usare il terreno come dispensa. Era un debito con una condizione
// scritta, e la condizione è la cassa.
//
// Adesso il cibo si guasta ovunque stia — zaino, mucchio, cassa — e la cassa
// lo rallenta invece di fermarlo. Il cadavere non fa eccezione: nuovoGiorno()
// non lo visita, quindi non marcisce sul posto casella per casella, ma ogni
// cosa che ne esce si porta dietro la data in cui è stata raccolta, e i giorni
// passati a cercare il corpo li ha contati l'orologio come dappertutto. Una
// prima versione di questa regola faceva del cadavere un posto in cui il tempo
// si ferma; era una gentilezza che non tornava con niente — qui la freschezza
// è una sola cosa, il giorno in cui hai preso quella roba, e non esiste
// contenitore che lo riscriva. Recuperare il proprio corpo è un viaggio con
// una scadenza: quello che c'era dentro può benissimo essere andato.

import { OGGETTO } from "../mondo/generazione.js";
import * as mappa from "../mondo/mappa.js";
import * as modifiche from "../mondo/modifiche.js";
import * as tempo from "./tempo.js";
import * as stagioni from "./stagioni.js";
import { CATALOGO } from "./oggetti.js";
import * as inventario from "./inventario.js";
import * as contenitori from "./contenitori.js";

// Quanto dura un fuoco, in giorni, e in cosa si trasforma quando finisce.
// Il falò lascia la cenere, che è un disegno che esiste dal primo giorno e non
// è mai stato prodotto da niente: era lì ad aspettare questa tappa. La torcia
// piantata non lascia niente, perché era un bastone.
//
// Il focolare non sta in questa tavola, e non è una dimenticanza: questi due
// bruciano quello di cui sono fatti, quindi la loro durata è una data più un
// numero di giorni. Il focolare invece brucia quello che ci metti dentro, e
// una cosa che ha fame non si racconta con una scadenza — si racconta con
// quanto le resta. Sta qui sotto, nella sezione sua.
const FUOCHI = {
  [OGGETTO.FALO_ACCESO]: { giorni: 2, diventa: OGGETTO.FALO_SPENTO },
  [OGGETTO.TORCIA_PIANTATA]: { giorni: 1, diventa: OGGETTO.NESSUNO },
};

export function eFuoco(oggetto) {
  return FUOCHI[oggetto] !== undefined;
}

// --- la legna del focolare -------------------------------------------------

// Quanta legna ci sta dentro, e quanta se ne brucia in un giorno.
//
// Il focolare nasce spento e vuoto: le dieci pietre comprano il camino, non il
// fuoco. Quello si compra ogni volta, una legna per volta, e questa è la
// differenza fra la pietra che resta e la legna che se ne va.
//
// Quattro è il pieno, e d'inverno se ne bruciano due al giorno invece di una:
// quattro giorni di autonomia contro due, cioè una stagione intera contro
// mezza. È la stessa frase di tutta la mappa di strada letta dall'altra parte —
// d'inverno il fuoco lo tieni acceso più forte, quindi la stagione in cui serve
// è anche quella che chiede di tornare a casa a metà.
//
// La stagione si legge all'alba, cioè quando si brucia: conta quella in cui ci
// si sveglia, non quella in cui si era caricato.
export const LEGNA_MASSIMA = 4;

export function legnaAlGiorno() {
  return stagioni.stagioneCorrente() === "inverno" ? 2 : 1;
}

// Quanta ne ha dentro adesso, da 0 (spento) a LEGNA_MASSIMA.
//
// Un focolare acceso senza il conto è un focolare acceso prima che la legna si
// contasse: si assume pieno, che è lo stesso riguardo che i fuochi hanno per
// chi li aveva accesi prima che i fuochi durassero. Punire una partita vecchia
// per un cambiamento del gioco è l'unica cosa che questo modulo non fa.
export function legnaNel(tx, ty) {
  const cambio = modifiche.di(tx, ty);
  if (cambio?.oggetto === OGGETTO.FOCOLARE_ACCESO) return cambio.legna ?? LEGNA_MASSIMA;
  if (cambio?.oggetto === OGGETTO.FOCOLARE_SPENTO) return 0;
  return null;
}

// --- il guasto ------------------------------------------------------------

// Quanti giorni dura una cosa dove sta adesso. Una cassa moltiplica, il resto
// del mondo no: è tutta la differenza fra un ripostiglio e un posto per terra.
export function vitaDi(cosa, inCassa = false) {
  const dura = CATALOGO[cosa]?.dura;
  if (dura === undefined) return undefined;
  return dura * (inCassa ? contenitori.RALLENTA : 1);
}

// Quanto è andata, da 0 (appena colta) a 1 (guasta). Serve all'interfaccia:
// una scadenza che non si vede è una trappola, e questo gioco le scadenze le
// annuncia — è la stessa ragione per cui l'autunno dice che l'inverno dà poco.
//
// Restituisce null per quello che non si guasta, così chi disegna ha una
// domanda sola da fare invece di due.
export function quantoEAndata(casella, inCassa = false) {
  if (!casella) return null;
  const vita = vitaDi(casella.cosa, inCassa);
  if (vita === undefined) return null;
  // Senza data si assume appena messa. È lo stesso riguardo che i fuochi hanno
  // per chi li aveva accesi prima che i fuochi durassero.
  const dal = casella.dal ?? tempo.giornoCorrente();
  return Math.min(1, Math.max(0, (tempo.giornoCorrente() - dal) / vita));
}

// L'avviso si conta in GIORNI e non in frazioni della vita, e ci è arrivato
// per prova: la prima stesura diceva "oltre sette decimi", e su una cosa che
// dura tre giorni non scattava mai. I giorni sono interi, quindi le bacche
// passano da due terzi — che è meno di sette decimi — direttamente a guaste.
// L'avviso esisteva senza succedere, che è il difetto che questo progetto
// insegue da sempre, e stava dentro la sua stessa correzione.
//
// Un giorno di preavviso e non due: deve arrivare quando c'è ancora tempo di
// farci qualcosa — mangiarlo, cuocerlo, metterlo in cassa — e con le scadenze
// corte che ha questo gioco due giorni prima vorrebbe dire quasi sempre.
const GIORNI_DI_AVVISO = 1;

export function staPerGuastarsi(casella, inCassa = false) {
  if (!casella) return false;
  const vita = vitaDi(casella.cosa, inCassa);
  if (vita === undefined) return false;
  const dal = casella.dal ?? tempo.giornoCorrente();
  return tempo.giornoCorrente() - dal >= vita - GIORNI_DI_AVVISO;
}

// Guasta quello che è ora di guastare, in una fila di caselle qualunque —
// lo zaino o una cassa. Restituisce quante unità sono andate perse.
function guastaLaFila(fila, inCassa, giorno) {
  let perse = 0;
  for (let i = 0; i < fila.length; i += 1) {
    const casella = fila[i];
    if (!casella) continue;
    const vita = vitaDi(casella.cosa, inCassa);
    if (vita === undefined) continue;
    // Senza data la si scrive e si aspetta domani: è il caso del cibo messo
    // via in un gioco in cui non si guastava, e farlo marcire al primo
    // risveglio sarebbe punire il giocatore per un cambiamento del gioco.
    if (casella.dal === undefined) {
      casella.dal = giorno;
      continue;
    }
    if (giorno - casella.dal < vita) continue;
    perse += casella.quantita;
    fila[i] = null;
  }
  return perse;
}

// Da chiamare a ogni cambio di giorno, come l'orto. Dice quanti fuochi si sono
// spenti e quanto cibo si è guastato: una cosa che succede mentre dormi e che
// nessuno racconta è un guasto, dal punto di vista di chi gioca.
export function nuovoGiorno() {
  const giorno = tempo.giornoCorrente();

  // Lo zaino per primo, che è l'unico posto che non sta nelle modifiche.
  let guaste = guastaLaFila(inventario.contenuto(), false, giorno);
  // Quante pile stanno per andare. Si conta dopo aver guastato, altrimenti
  // quello che è appena marcito verrebbe contato anche come "sta per".
  let inScadenza = inventario.contenuto().filter((c) => staPerGuastarsi(c, false)).length;

  // Si raccoglie scorrendo e si agisce dopo: perOgnuno scorre la mappa dei
  // cambiamenti, e cambiarla mentre la si scorre è il modo più corto per
  // saltarne metà.
  const spenti = [];
  const svuotati = [];
  const casse = [];
  modifiche.perOgnuno((tx, ty, cambio) => {
    const fuoco = FUOCHI[cambio.oggetto];
    if (fuoco) {
      // Senza data si assume acceso adesso e la si scrive: è il caso di un
      // fuoco che esisteva prima che i fuochi avessero una durata, e spegnerlo
      // subito sarebbe punire il giocatore per un cambiamento del gioco.
      const acceso = cambio.posata ?? giorno;
      if (giorno - acceso >= fuoco.giorni) spenti.push({ tx, ty, diventa: fuoco.diventa });
      else if (cambio.posata === undefined) modifiche.imposta(tx, ty, { ...cambio, posata: giorno });
      return;
    }

    // Il focolare mangia la sua legna, e quando finisce resta la pietra. Si
    // scrive il resto invece di spegnere e basta: il giocatore che torna a
    // casa vuole sapere quanto gli resta, non solo se è ancora acceso.
    if (cambio.oggetto === OGGETTO.FOCOLARE_ACCESO) {
      const resta = (cambio.legna ?? LEGNA_MASSIMA) - legnaAlGiorno();
      if (resta >= 1) modifiche.imposta(tx, ty, { ...cambio, legna: resta });
      else spenti.push({ tx, ty, diventa: OGGETTO.FOCOLARE_SPENTO });
      return;
    }

    if (cambio.oggetto === OGGETTO.CASSA) {
      casse.push({ tx, ty });
      return;
    }

    // Un mucchio è una casella sola per terra, e si guasta come le altre: il
    // terreno non è più una dispensa eterna, ed è esattamente il cambiamento
    // che la cassa rende sopportabile.
    if (cambio.oggetto !== OGGETTO.MUCCHIO) return;
    const fila = [{ cosa: cambio.cosa, quantita: cambio.quante, dal: cambio.dal }];
    const perse = guastaLaFila(fila, false, giorno);
    if (perse > 0) {
      guaste += perse;
      svuotati.push({ tx, ty });
    } else if (cambio.dal === undefined && fila[0].dal !== undefined) {
      modifiche.imposta(tx, ty, { ...cambio, dal: fila[0].dal });
    }
  });

  for (const { tx, ty } of casse) {
    const fila = contenitori.contenutoDi(tx, ty);
    const perse = guastaLaFila(fila, true, giorno);
    guaste += perse;
    inScadenza += fila.filter((c) => staPerGuastarsi(c, true)).length;
    // Si riscrive sempre e non solo quando qualcosa è andato: guastaLaFila
    // riempie anche le date mancanti, e perderle vorrebbe dire rifare quel
    // lavoro a ogni alba per sempre.
    contenitori.scrivi(tx, ty, fila);
  }

  for (const { tx, ty, diventa } of spenti) {
    mappa.cambiaTassello(tx, ty, { oggetto: diventa });
  }
  for (const { tx, ty } of svuotati) {
    mappa.cambiaTassello(tx, ty, { oggetto: OGGETTO.NESSUNO });
  }

  return { fuochi: spenti.length, guaste, inScadenza };
}

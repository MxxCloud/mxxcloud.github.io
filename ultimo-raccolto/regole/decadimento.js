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
// Non si tocca quello che sta per terra dentro un mucchio. Non per dimenticanza:
// finché non ci sono contenitori in cui mettere le cose al sicuro — e i
// contenitori sono della tappa della costruzione — far marcire anche quello
// sarebbe togliere l'unico ripostiglio che esiste.

import { OGGETTO } from "../mondo/generazione.js";
import * as mappa from "../mondo/mappa.js";
import * as modifiche from "../mondo/modifiche.js";
import * as tempo from "./tempo.js";

// Quanto dura un fuoco, in giorni, e in cosa si trasforma quando finisce.
// Il falò lascia la cenere, che è un disegno che esiste dal primo giorno e non
// è mai stato prodotto da niente: era lì ad aspettare questa tappa. La torcia
// piantata non lascia niente, perché era un bastone.
const FUOCHI = {
  [OGGETTO.FALO_ACCESO]: { giorni: 2, diventa: OGGETTO.FALO_SPENTO },
  [OGGETTO.TORCIA_PIANTATA]: { giorni: 1, diventa: OGGETTO.NESSUNO },
};

export function eFuoco(oggetto) {
  return FUOCHI[oggetto] !== undefined;
}

// Da chiamare a ogni cambio di giorno, come l'orto. Restituisce quanti fuochi
// si sono spenti: uno che si spegne mentre dormi e nessuno che te lo dice è un
// bug dal punto di vista di chi gioca.
export function nuovoGiorno() {
  const giorno = tempo.giornoCorrente();

  const spenti = [];
  modifiche.perOgnuno((tx, ty, cambio) => {
    const fuoco = FUOCHI[cambio.oggetto];
    if (!fuoco) return;
    // Senza data si assume acceso adesso e la si scrive: è il caso di un
    // fuoco che esisteva prima che i fuochi avessero una durata, e spegnerlo
    // subito sarebbe punire il giocatore per un cambiamento del gioco.
    const acceso = cambio.posata ?? giorno;
    if (giorno - acceso >= fuoco.giorni) spenti.push({ tx, ty, diventa: fuoco.diventa });
    else if (cambio.posata === undefined) modifiche.imposta(tx, ty, { ...cambio, posata: giorno });
  });

  for (const { tx, ty, diventa } of spenti) {
    mappa.cambiaTassello(tx, ty, { oggetto: diventa });
  }

  return spenti.length;
}

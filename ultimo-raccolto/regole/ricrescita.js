// Quello che hai preso torna, se gli dai tempo.
//
// È l'altra metà di decadimento.js, e insieme dicono il pilastro per intero:
// il mondo si riprende quello che è tuo, e si riprende anche quello che gli
// hai tolto. Fino a qui esisteva solo il primo verso — ogni albero, cespuglio
// e sasso raccolto era tolto per sempre, e la valle attorno alla fattoria si
// spogliava e basta. L'unica risposta era camminare più lontano, che da M6 è
// anche più pericoloso: il gioco spingeva fuori invece di dare un motivo per
// restare.
//
// FAR RICRESCERE È DIMENTICARE UNA MODIFICA. Questa è tutta l'idea, e viene
// da com'è fatto il mondo: la valle è una funzione pura delle coordinate e
// modifiche.js tiene solo le eccezioni. Togliendo l'eccezione "qui non c'è
// niente", il tassello torna da sé a essere il cespuglio che la generazione
// ci mette. Nessuno stato nuovo, nessun elenco da tenere in sincronia — e il
// salvataggio si accorcia invece di crescere per sempre, perché ogni cespuglio
// strappato smette di pesare i suoi quarantaquattro byte.

import { OGGETTO } from "../mondo/generazione.js";
import * as mappa from "../mondo/mappa.js";
import * as modifiche from "../mondo/modifiche.js";
import * as tempo from "./tempo.js";
import * as stagioni from "./stagioni.js";

// Quanto ci mette a tornare, in giorni, e a decidere è cosa c'era secondo la
// generazione — non cosa ha tolto il giocatore.
//
// Il sasso non è in questa tabella e non è una dimenticanza: la pietra è
// minerale, non ricresce, e una cava che si ricarica toglierebbe l'unica
// risorsa finita del gioco. Se un giorno servirà la pietra rinnovabile, sarà
// una miniera da scavare, non un sasso che rispunta.
const RITORNO = {
  [OGGETTO.CESPUGLIO]: stagioni.GIORNI_PER_STAGIONE,
  // Il bosco si riprende piano: tre stagioni su quattro, cioè quasi un anno.
  // Un albero che ricresce in una stagione non sarebbe un albero, e uno che
  // non ricresce mai farebbe del legno una risorsa da esaurire attorno a casa
  // propria — che è esattamente il difetto che questo file viene a togliere.
  [OGGETTO.ALBERO]: stagioni.GIORNI_PER_STAGIONE * 3,
};

// Una modifica è "un tassello svuotato e basta" solo se non porta altro.
// Chi ha innaffiato, colpito a metà o posato qualcosa ha scritto altri campi,
// e quella non è terra libera: è roba sua.
function soloSvuotato(cambio) {
  if (cambio.oggetto !== OGGETTO.NESSUNO) return false;
  for (const chiave of Object.keys(cambio)) {
    if (chiave !== "oggetto" && chiave !== "svuotata") return false;
  }
  return true;
}

// Da chiamare a ogni cambio di giorno, come l'orto e i fuochi. Restituisce
// quanti tasselli sono tornati: uno che ricresce mentre dormi e nessuno che
// te lo dice è un cambiamento che il giocatore attribuirebbe a un guasto.
export function nuovoGiorno() {
  const giorno = tempo.giornoCorrente();
  // D'inverno non torna niente, per la stessa ragione per cui l'orto non
  // cresce. Chi strappa in autunno rivede il cespuglio in primavera, ed è
  // anche ciò che rende l'inverno una stagione da attraversare con quello che
  // si ha invece che da rifornire strada facendo.
  const ricresce = stagioni.siColtiva();

  const daDatare = [];
  const daDimenticare = [];

  modifiche.perOgnuno((tx, ty, cambio) => {
    if (!soloSvuotato(cambio)) return;

    const generato = mappa.oggettoGenerato(tx, ty);

    // Qui la generazione non ci metteva niente: la modifica non dice nulla
    // che il mondo non dica già. È il caso di un mucchio posato e ripreso, e
    // si butta in qualunque stagione — non è una ricrescita, è pulizia, e
    // toglie peso al salvataggio senza cambiare un pixel.
    if (generato === OGGETTO.NESSUNO) {
      daDimenticare.push({ tx, ty });
      return;
    }

    const attesa = RITORNO[generato];
    if (attesa === undefined) return;
    if (!ricresce) return;

    // Senza data si assume svuotato adesso e la si scrive, come i fuochi e le
    // colture. Serve ai salvataggi scritti prima che la ricrescita esistesse:
    // senza, il confronto darebbe zero ogni giorno e quei tasselli non
    // tornerebbero mai — un "non succede niente" che nessuna prova noterebbe.
    if (cambio.svuotata === undefined) {
      daDatare.push({ tx, ty, cambio });
      return;
    }
    if (giorno - cambio.svuotata >= attesa) daDimenticare.push({ tx, ty });
  });

  for (const { tx, ty, cambio } of daDatare) {
    modifiche.imposta(tx, ty, { ...cambio, svuotata: giorno });
  }
  // cambiaTassello con null rimuove la modifica e butta il settore cotto, che
  // è esattamente quello che serve: il tassello si ridisegna con quello che la
  // generazione dice, cioè con il cespuglio tornato.
  let tornati = 0;
  for (const { tx, ty } of daDimenticare) {
    const generato = mappa.oggettoGenerato(tx, ty);
    mappa.cambiaTassello(tx, ty, null);
    if (generato !== OGGETTO.NESSUNO) tornati += 1;
  }

  return tornati;
}

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
import * as riparo from "./riparo.js";

// Quando torna: il primo giorno di quale stagione. Una volta l'anno e tutto
// insieme, non tanti giorni dopo il raccolto. La valle ha un calendario, e
// chi lo conosce sa quando conviene tornare a prendere: a primavera attorno a
// casa ci sono di nuovo i cespugli, d'estate di nuovo il bosco.
//
// Vuol dire anche che conta quando si prende. Un cespuglio strappato l'ultimo
// giorno d'inverno torna la mattina dopo; uno strappato il primo giorno di
// primavera aspetta un anno intero. Ed è la ragione per cui d'inverno non
// torna niente senza bisogno di una regola apposta: nessuna delle due date
// cade d'inverno.
//
// Il sasso non è in questa tabella e non è una dimenticanza: la pietra è
// minerale, non ricresce, e una cava che si ricarica toglierebbe l'unica
// risorsa finita del gioco. Se un giorno servirà la pietra rinnovabile, sarà
// una miniera da scavare, non un sasso che rispunta.
const RITORNO = {
  [OGGETTO.CESPUGLIO]: "primavera",
  // Il bosco dopo, quando la primavera ha finito: un albero che torna con i
  // cespugli sembrerebbe un cespuglio più alto.
  [OGGETTO.ALBERO]: "estate",
  // Le piante selvatiche (M7.18.30) con i cespugli: sono la fonte di semi che
  // la valle ridà, una volta l'anno.
  [OGGETTO.SPIGHE_SELVATICHE]: "primavera",
  [OGGETTO.LINO_SELVATICO]: "primavera",
  [OGGETTO.CAVOLO_SELVATICO]: "primavera",
  [OGGETTO.PATATA_SELVATICA]: "primavera",
  [OGGETTO.FAGIOLI_SELVATICI]: "primavera",
};

// La terra del campo senza niente di vivo sopra: quello che la pianta di un
// orto abbandonato si riprende in primavera.
const TERRA_NUDA = new Set([OGGETTO.NESSUNO, OGGETTO.TERRA_ZAPPATA, OGGETTO.APPASSITA]);

// Una modifica è "un tassello svuotato e basta" solo se non porta altro.
// Chi ha innaffiato, colpito a metà o posato qualcosa ha scritto altri campi,
// e quella non è terra libera: è roba sua. "svuotata" è la data del raccolto
// che si scriveva finché la ricrescita contava i giorni: i salvataggi di prima
// la portano ancora, e non fa del tassello qualcosa di diverso.
function soloSvuotato(cambio) {
  if (cambio.oggetto !== OGGETTO.NESSUNO) return false;
  for (const chiave of Object.keys(cambio)) {
    if (chiave !== "oggetto" && chiave !== "svuotata") return false;
  }
  return true;
}

// Dentro un posto chiuso non ricresce niente. Chi ha tirato su quattro muri
// attorno al punto in cui c'era un albero non deve ritrovarselo in mezzo alla
// stanza una mattina: la valle si riprende quello che le hai tolto, non la
// casa che ci hai costruito sopra.
//
// "Chiuso" è il posto murato di riparo.js: chiuso, e con almeno un muro o una
// porta fra le pareti. Una radura chiusa dagli alberi, o con dentro una cassa
// o un falò, è ancora bosco: diventa un posto quando qualcuno ci alza un muro.

// Da chiamare a ogni cambio di giorno, come l'orto e i fuochi. Restituisce
// quanti tasselli sono tornati: uno che ricresce mentre dormi e nessuno che
// te lo dice è un cambiamento che il giocatore attribuirebbe a un guasto.
export function nuovoGiorno() {
  const giorno = tempo.giornoCorrente();
  // La stagione che comincia oggi, o null: è l'unico giorno in cui torna
  // quello che le appartiene. Si chiama allo scoccare della mezzanotte, quindi
  // di oggi non si è ancora preso niente — tutto quello che c'è da far
  // tornare è stato tolto prima.
  const comincia = stagioni.giornoNellaStagione(giorno) === 1 ? stagioni.stagioneDi(giorno) : null;

  const daDimenticare = [];

  modifiche.perOgnuno((tx, ty, cambio) => {
    // Gli orti abbandonati tornano comunque (M7.18.34): sono la base da cui si
    // comincia a coltivare, e un tassello zappato, stanco o con una pianta
    // morta sopra non deve toglierne una per sempre. In primavera la pianta
    // dell'orto si riprende la terra nuda del campo; non quello che ci hai
    // costruito sopra, né una tua coltura che sta ancora crescendo.
    if (comincia === "primavera" && TERRA_NUDA.has(cambio.oggetto)
        && mappa.inselvatichitaNellOrto(tx, ty, mappa.oggettoGenerato(tx, ty))) {
      daDimenticare.push({ tx, ty });
      return;
    }

    if (!soloSvuotato(cambio)) return;

    const generato = mappa.oggettoGenerato(tx, ty);

    // Qui la generazione non ci metteva niente: la modifica non dice nulla
    // che il mondo non dica già. È il caso di un mucchio posato e ripreso, e
    // si butta in qualunque giorno — non è una ricrescita, è pulizia, e
    // toglie peso al salvataggio senza cambiare un pixel.
    if (generato === OGGETTO.NESSUNO) {
      daDimenticare.push({ tx, ty });
      return;
    }

    const ritorno = RITORNO[generato];
    if (ritorno === undefined || ritorno !== comincia) return;
    // Il giorno è uno solo anche per chi è al chiuso: se quella mattina la
    // casa c'è, si riprova l'anno dopo. Riaprirla d'autunno non fa spuntare un
    // cespuglio fuori stagione.
    if (riparo.murato(tx, ty)) return;
    daDimenticare.push({ tx, ty });
  });

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

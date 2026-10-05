// Il sonno non salta la notte (M7.18.63).
//
// Fino a qui dormire era il modo più sicuro di passare il buio: le ore
// passavano tutte insieme, gli infetti non si muovevano, e al risveglio era
// giorno. Bastava un giaciglio in mezzo al prato — anche nel selvatico — e la
// notte, la cosa che questo gioco ha da dire, si saltava. Adesso due regole.
//
// La prima: non ci si addormenta con qualcuno addosso. Chi ti insegue, chi ti
// vede da vicino, una bestia infuriata: il letto resta lì, ma il gesto è
// impedito e dice perché.
//
// La seconda: fuori da una stanza chiusa il sonno è leggero. Ogni notte ha un
// suo momento in cui qualcosa si avvicina, fra le undici e le quattro, e chi
// dorme all'aperto in quel momento si sveglia — più spesso più è lontano da
// casa. Nessuno ti morde mentre dormi: ti svegli al buio, con uno che arriva,
// e da lì decidi tu. Una regola che uccide chi non può reagire non insegna
// niente; una che lo sveglia gli lascia la scelta. E dopo quel momento, quella
// notte all'aperto non si dorme più: qualcosa là fuori si muove. Dentro una
// stanza chiusa sì — è la ragione per costruirne una.
//
// Non c'è niente da salvare. Il momento della notte è una funzione del seme e
// della notte, come la fase della luna, e chi ricarica la partita ritrova la
// stessa notte: non la si aggira provando di nuovo.
import { impronta } from "../motore/casuale.js";
import * as mappa from "../mondo/mappa.js";
import { vistaLibera } from "../mondo/ostacoli.js";
import { TASSELLO } from "../motore/schermo.js";
import * as entita from "../entita/entita.js";
import * as infetto from "../entita/infetto.js";
import * as tempo from "./tempo.js";
import * as luna from "./luna.js";
import * as fasce from "./fasce.js";
import * as riparo from "./riparo.js";
import * as fauna from "./fauna.js";

// Quanto spesso una notte all'aperto ti sveglia, per fascia di distanza (vedi
// fasce.js). Vicino a casa una notte su dieci: abbastanza da far desiderare
// quattro muri, non tanto da rendere il giaciglio dei primi giorni una
// trappola. Nel selvatico tre su quattro: lì si dorme fuori, ma non si dorme
// tranquilli.
export const PROBABILITA_RISVEGLIO = [0.1, 0.25, 0.5, 0.75];

// Fra le undici di sera e le quattro del mattino: il cuore della notte, quando
// fuori ce ne sono di più. Un risveglio alle sei e mezza sarebbe un'alba
// anticipata, non uno spavento.
const DALLE = 23;
const PER_ORE = 5;

// Quanto vicino è troppo vicino per chiudere gli occhi. Otto tasselli è una
// mezza schermata: uno che ti vede da lì ti è addosso in tre secondi. Per le
// bestie un po' di più, perché un orso infuriato corre più di un infetto.
const VICINO_INFETTO = 8 * TASSELLO;
const VICINO_BESTIA = 12 * TASSELLO;

// Le ore contate dall'inizio della partita: la sola misura in cui "le due di
// notte" e "le undici di ieri" stanno sulla stessa linea.
export function oreAssolute() {
  return (tempo.giornoCorrente() - 1) * 24 + tempo.oraCorrente();
}

// Il momento della notte e il suo tiro. "notte" è quella di luna.notteDi():
// comincia la sera di quel giorno e finisce alle sette del mattino dopo.
export function risveglioDellaNotte(notte) {
  const seme = mappa.semeCorrente().valore;
  return {
    ora: DALLE + impronta(notte, 1, seme ^ 0x5a4e0) * PER_ORE,
    tiro: impronta(notte, 2, seme ^ 0x5a4e0),
  };
}

// A che ora assoluta questa notte sveglia chi dorme su questo tassello, o null
// se non lo sveglia: dentro una stanza chiusa mai, fuori secondo la fascia.
export function svegliaAlle(tx, ty, notte = luna.notteDi()) {
  if (riparo.murato(tx, ty)) return null;
  const { ora, tiro } = risveglioDellaNotte(notte);
  if (tiro >= PROBABILITA_RISVEGLIO[fasce.diTassello(tx, ty)]) return null;
  return (notte - 1) * 24 + ora;
}

// Chi ti impedisce di chiudere gli occhi, o null. Un motivo e non un sì o no:
// il gesto impedito lo scrive sotto il letto.
export function minaccia(eroe) {
  for (const e of entita.tutte()) {
    if (e.tipo !== infetto.TIPO) continue;
    if (e.preda === eroe) return "non si dorme con un infetto addosso";
    if (Math.hypot(e.px - eroe.px, e.py - eroe.py) <= VICINO_INFETTO && vistaLibera(e, eroe)) {
      return "non si dorme con un infetto addosso";
    }
  }
  for (const a of fauna.tutte()) {
    if (a.vita > 0 && a.stato === "aggressivo" && Math.hypot(a.px - eroe.px, a.py - eroe.py) <= VICINO_BESTIA) {
      return "non si dorme con una bestia infuriata vicino";
    }
  }
  return null;
}

// Un millesimo di secondo di gioco, in ore. La simulazione arriva al momento
// del risveglio sommando passi, e può fermarsi un soffio prima: senza questo
// margine, appena svegliati il momento risultava non ancora passato e ci si
// poteva riaddormentare — per essere svegliati di nuovo un istante dopo.
export const MARGINE = 1e-6;

// Perché adesso non si può dormire su questo letto, o null.
export function impedimento(eroe, tx, ty) {
  const chi = minaccia(eroe);
  if (chi) return chi;
  const sveglia = svegliaAlle(tx, ty);
  if (sveglia !== null && oreAssolute() >= sveglia - MARGINE) return "stanotte qui fuori non si dorme";
  return null;
}

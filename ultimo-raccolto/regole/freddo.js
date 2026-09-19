// Il freddo.
//
// Fino a M4 l'inverno si vedeva e si sentiva solo nello stomaco: la valle
// cambiava colore e veniva fame prima. Era il minimo perché la stagione non
// fosse un fondale dipinto, e lo diceva il commento in stagioni.js —
// «la temperatura vera arriva con le ferite». Arriva adesso.
//
// La regola è una sola frase: d'inverno, di notte, lontano da una fiamma, si
// gela. Tre condizioni e nessuna scala di gradi, perché una temperatura
// continua vorrebbe un indicatore in più da guardare e direbbe al giocatore
// la stessa identica cosa che gli dicono già l'orologio e il calendario.
//
// Da M7.5 la frase ha una coda, e arriva dai muri: al chiuso il calore resta
// dentro. La regola non cambia — serve sempre una fiamma — cambia quanto
// lontano arriva, e quella è la differenza fra un fuoco e una casa.
//
// Quello che ne esce è che falò e torcia smettono di servire solo a vedere.
// Da M7.7 anche il corpo zuppo e la nevicata all'aperto richiedono calore,
// pure di giorno. Dormire non rende impermeabili: il giaciglio va protetto
// dalla pioggia e, nelle notti invernali, riscaldato.

import * as meteo from "./meteo.js";
import * as riparo from "./riparo.js";
import * as tempo from "./tempo.js";
import * as stagioni from "./stagioni.js";
import * as mappa from "../mondo/mappa.js";
import { OGGETTO } from "../mondo/generazione.js";
import { vistaLibera } from "../mondo/ostacoli.js";
import { CATALOGO } from "./oggetti.js";
import * as schermo from "../motore/schermo.js";

const { TASSELLO } = schermo;

// Quanto lontano da un fuoco si comincia a gelare. Tre tasselli, cioè
// quarantotto pixel: più o meno il cerchio di luce di un falò, che è anche il
// modo in cui il giocatore impara il raggio senza che nessuno glielo dica —
// si sta al caldo dove si vede.
const RAGGIO_FUOCO = 3;

// Si risponde a ogni fotogramma, senza tenere da parte niente. La prima
// versione teneva la risposta per un quarto di secondo per non rifare il giro
// dei quarantanove tasselli, poi il giro è stato misurato: due centesimi di
// millisecondo, cioè un ottocentesimo di fotogramma, e per tre stagioni su
// quattro nemmeno quello — le due righe qui sotto escludono tutto il resto
// dell'anno prima di guardare un solo tassello.
export function alFreddo(eroe, cosaInMano) {
  const notteInvernale = stagioni.stagioneCorrente() === "inverno" && tempo.eNotte();
  const nevicata = meteo.evento() === "neve" && !meteo.alRiparo(eroe);
  if (!notteInvernale && !nevicata && !meteo.zuppo()) return false;

  // La torcia in pugno scalda, come scalda il falò per terra. È la stessa
  // regola di sempre — quello che tieni in mano è quello che usi — e senza
  // di essa attraversare la valle di notte d'inverno sarebbe impossibile
  // invece che caro.
  if (cosaInMano && CATALOGO[cosaInMano]?.luce) return false;

  const tx = Math.floor(eroe.px / TASSELLO);
  const ty = Math.floor(eroe.py / TASSELLO);
  if (mappa.luceVicina(tx, ty, RAGGIO_FUOCO)) return false;

  // Al chiuso il calore resta dentro: un fuoco acceso in un punto qualsiasi
  // della stanza la scalda tutta, invece di fermarsi a tre tasselli.
  //
  // Non è "al chiuso non si gela": una capanna senza fuoco è una capanna
  // fredda, e regalare il tepore a chi ha alzato quattro muri toglierebbe al
  // falò il mestiere che ha da M1. Quello che cambia è la portata, ed è
  // esattamente la differenza fra stare vicino a un fuoco e stare in una
  // stanza con un fuoco dentro — cioè il motivo per cui si costruiscono le
  // stanze.
  riparo.aggiorna(0, tx, ty);
  const stanza = riparo.stanza();
  if (stanza && riparo.caldaDentro(stanza)) return false;

  return true;
}

// Il riposo richiede un falò acceso vicino al letto, non una torcia in mano.
// Lo stesso raggio di tre tasselli usato dal calore; le pareti separano i posti.
export function fuocoPerRiposo(letto) {
  const tx=Math.floor(letto.px/TASSELLO),ty=Math.floor(letto.py/TASSELLO);
  for(let y=ty-RAGGIO_FUOCO;y<=ty+RAGGIO_FUOCO;y++)for(let x=tx-RAGGIO_FUOCO;x<=tx+RAGGIO_FUOCO;x++) {
    if(mappa.oggettoDi(x,y)!==OGGETTO.FALO_ACCESO)continue;
    if(vistaLibera(letto,{px:(x+0.5)*TASSELLO,py:(y+0.5)*TASSELLO}))return true;
  }
  return false;
}

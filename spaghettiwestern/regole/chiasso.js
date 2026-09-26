// Quanto lontano si sente quello che stai facendo.
//
// Si chiama chiasso e non rumore perché rumore è già preso: motore/casuale.js
// esporta il rumore di valore da cui nasce tutta la valle, e due cose
// diversissime con lo stesso nome sono un errore che si scopre tardi.
//
// È un numero solo — un raggio in pixel — e questo è tutto il sistema. Non
// c'è propagazione, non ci sono muri che smorzano, non c'è direzione: c'è
// "quanto lontano ti si sente adesso". Serve a rendere le scelte leggibili
// senza spiegarle, perché il giocatore non deve imparare un modello acustico,
// deve imparare tre cose — fermo non ti sentono, correre chiama, spaccare
// legna chiama molto più forte.
//
// I muri arriveranno con la costruzione, ed è lì che questo numero diventerà
// una funzione di dov'è chi ascolta. Oggi non ci sono muri.

import * as schermo from "../motore/schermo.js";

// Camminare si sente da due tasselli, correre da sei. Lo schermo ne mostra
// ventiquattro, quindi correre allo scoperto chiama chi sta a un quarto di
// schermo: abbastanza da essere una scelta, non abbastanza da svegliare la
// valle.
const CAMMINO = 2 * schermo.TASSELLO;
const CORSA = 6 * schermo.TASSELLO;

// Un colpo d'ascia si sente da venti tasselli: lo schermo ne mostra
// ventiquattro, quindi quasi quanto si vede. È il gesto più rumoroso che
// esista ed è anche quello che il giocatore fa più spesso senza pensarci: è
// qui che la notte smette di essere una questione di luce.
//
// Il numero viene da una misura e non dal gusto. Gli infetti nascono fra i
// 260 e i 420 pixel (vedi infetti.js): a dieci tasselli — la prima versione,
// 160 pixel — un colpo d'ascia non arrivava a nessuno di loro mai, ed era un
// sistema che esisteva senza succedere; a sedici arrivava a 256 e i più
// vicini stavano a 277, cioè ancora niente, misurato. Venti fa 320, che
// prende i primi due o tre e non gli altri: spaccare legna di notte chiama
// chi hai intorno, non la valle intera.
const COLPO = 20 * schermo.TASSELLO;
const DURATA_SCOPPIO = 1.3;

let scoppio = 0;
let restaScoppio = 0;
let continuo = 0;

// Il fondo: quello che si emette semplicemente esistendo in un certo modo.
export function avanza(passo, { corre = false, siMuove = false } = {}) {
  if (corre) continuo = CORSA;
  else if (siMuove) continuo = CAMMINO;
  else continuo = 0;

  if (restaScoppio > 0) {
    restaScoppio -= passo;
    if (restaScoppio <= 0) scoppio = 0;
  }
}

// Un gesto forte e istantaneo. Si prende il più forte invece di sommare: due
// colpi d'ascia vicini non si sentono dal doppio della distanza.
export function fai(quanto = COLPO) {
  scoppio = Math.max(scoppio, quanto);
  restaScoppio = DURATA_SCOPPIO;
}

export function colpo() {
  fai(COLPO);
}

// Il raggio di adesso: il più largo fra quello che stai facendo e l'eco di
// quello che hai appena fatto. Lo scoppio si spegne linearmente, così
// allontanarsi dal posto in cui si è spaccato un albero funziona davvero.
export function raggio() {
  const eco = restaScoppio > 0 ? scoppio * (restaScoppio / DURATA_SCOPPIO) : 0;
  return Math.max(continuo, eco);
}

// Serve all'interfaccia e alla diagnostica: "quanto sto chiamando" in tre
// gradini, che è quello che si può dire a schermo senza un numero.
export function quanto() {
  const r = raggio();
  if (r <= 0) return "niente";
  if (r <= CAMMINO) return "poco";
  if (r <= CORSA) return "parecchio";
  return "molto";
}

export function reimposta() {
  scoppio = 0;
  restaScoppio = 0;
  continuo = 0;
}

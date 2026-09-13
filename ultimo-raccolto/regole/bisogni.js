// Fame, sete, stanchezza.
//
// Sono la prima metà «entropia» del pilastro: la prima cosa che il mondo si
// riprende è il tuo corpo. Servono soprattutto a rendere il tempo una risorsa
// — finché la fame non esiste, un giorno vale l'altro e non c'è motivo di
// fare qualcosa adesso invece che dopo.
//
// Non ci sono temperatura e morale: quelli vanno con le ferite più avanti,
// dove hanno senso insieme. Tre indicatori sono già il massimo che un
// giocatore tiene d'occhio mentre fa altro.

import * as stagioni from "./stagioni.js";

const GIORNO = 600; // secondi reali, come in tempo.js

// Ritmi diversi di proposito: tre barre che calano insieme sono una barra
// sola con tre disegni. La sete morde prima della fame, che è anche vero.
const CALO = {
  fame: 1 / (GIORNO * 1.8),
  sete: 1 / (GIORNO * 1.0),
  stanchezza: 1 / (GIORNO * 2.0),
};

// La stanchezza è l'unica che dipende da cosa fai e non solo dal tempo che
// passa. Correre la brucia in quattro minuti scarsi: è quello che trasforma
// la corsa da gratis a scelta.
const STANCHEZZA_CAMMINO = 1 / 1800;
const STANCHEZZA_CORSA = 1 / 300;

// Sotto questa soglia non si corre più. Non zero: restare senza fiato deve
// succedere prima di essere allo stremo, altrimenti la corsa si spegne senza
// preavviso.
const SOGLIA_CORSA = 0.08;

// Quanto pesa ogni bisogno ignorato. Tre a zero riducono a un quarto: si
// sente, ma si cammina ancora — a M5 questo diventerà danno, e allora la
// lentezza da sola non basterà più.
const PESO_VUOTO = 0.25;

export const ELENCO = ["fame", "sete", "stanchezza"];

const livelli = { fame: 1, sete: 1, stanchezza: 1 };
// Riusato invece di essere riallocato: avanza() gira sessanta volte al secondo.
const appenaVuoti = [];

export function livello(quale) {
  return livelli[quale];
}

export function tutti() {
  return livelli;
}

function limita(valore) {
  return Math.min(1, Math.max(0, valore));
}

// Restituisce quali bisogni si sono svuotati proprio adesso, perché
// l'interfaccia deve poterlo annunciare una volta sola e non a ogni
// fotogramma finché la barra resta a zero.
export function avanza(passo, { corre = false, siMuove = false } = {}) {
  appenaVuoti.length = 0;

  for (const quale of ELENCO) {
    const prima = livelli[quale];
    // D'inverno viene fame prima. È l'unico posto in cui il freddo esiste:
    // la temperatura vera arriva con le ferite, ma un inverno che si vede
    // soltanto sarebbe un fondale dipinto. Siccome d'inverno non si coltiva,
    // questo è ciò che fa del raccolto d'autunno una provvista invece di una
    // collezione.
    let calo = CALO[quale] * passo * (quale === "fame" ? stagioni.fattoreFame() : 1);
    if (quale === "stanchezza") {
      if (corre) calo += STANCHEZZA_CORSA * passo;
      else if (siMuove) calo += STANCHEZZA_CAMMINO * passo;
    }
    livelli[quale] = limita(prima - calo);
    if (prima > 0 && livelli[quale] <= 0) appenaVuoti.push(quale);
  }

  return appenaVuoti;
}

export function ristora(quale, quanto) {
  if (!(quale in livelli)) return 0;
  const prima = livelli[quale];
  livelli[quale] = limita(prima + quanto);
  return livelli[quale] - prima;
}

export function consuma(quale, quanto) {
  ristora(quale, -quanto);
}

// Il tempo saltato dormendo consuma fame e sete come se fosse passato
// davvero: si salta la notte, non il proprio metabolismo. È ciò che impedisce
// al sonno di essere un tasto per far sparire i problemi.
export function passanoSecondi(secondi) {
  livelli.fame = limita(livelli.fame - CALO.fame * secondi * stagioni.fattoreFame());
  livelli.sete = limita(livelli.sete - CALO.sete * secondi);
}

export function quantiVuoti() {
  let n = 0;
  for (const quale of ELENCO) if (livelli[quale] <= 0) n += 1;
  return n;
}

export function puoCorrere() {
  return livelli.stanchezza > SOGLIA_CORSA;
}

export function fattoreVelocita() {
  return Math.max(0.25, 1 - PESO_VUOTO * quantiVuoti());
}

export function reimposta() {
  for (const quale of ELENCO) livelli[quale] = 1;
}

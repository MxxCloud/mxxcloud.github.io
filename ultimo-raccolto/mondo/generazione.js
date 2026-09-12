// Generazione della valle.
//
// Il mondo non viene creato: viene calcolato. Ogni tassello è una funzione
// pura delle sue coordinate e del seme, quindi non esistono confini, non c'è
// nulla da generare in anticipo e camminare in una direzione qualsiasi non
// costa più che restare fermi.
//
// È anche ciò che rende il salvataggio piccolo, quando arriverà: basterà
// memorizzare i tasselli che il giocatore ha cambiato, perché tutti gli altri
// si riottengono da qui identici.

import { impronta, rumoreFrattale } from "../motore/casuale.js";

export const TERRENO = {
  ACQUA: 0,
  ACQUA_BASSA: 1,
  SABBIA: 2,
  ERBA: 3,
  STERPAGLIA: 4,
  ROCCIA: 5,
  TERRA: 6,
};

// Gli ultimi due non li genera nessuno: li posa il giocatore, e vivono nelle
// modifiche (vedi modifiche.js). Stanno qui lo stesso perché OGGETTO è il
// vocabolario di cosa può esserci su un tassello, non l'elenco di cosa sa
// produrre la generazione.
export const OGGETTO = {
  NESSUNO: 0,
  ALBERO: 1,
  SASSO: 2,
  CESPUGLIO: 3,
  FALO_ACCESO: 4,
  FALO_SPENTO: 5,
};

// Le soglie non sono state scelte a occhio: vengono dai percentili misurati
// sul rumore vero (vedi il commento sulle proporzioni qui sotto). Cambiare la
// scala o il numero di ottave sposta la distribuzione e obbliga a rimisurarle.
//
// Proporzioni attese: 8% acqua, 4% bassofondo, 4% riva, 76% praterie, 8%
// roccia. Delle praterie, il 40% è andato a seme. I percentili sono misurati su
// quattro semi diversi, non su uno solo: una valle fortunata non fa una regola.
const QUOTA_ACQUA = 0.3358;
const QUOTA_BASSOFONDO = 0.3602;
const QUOTA_RIVA = 0.3793;
const QUOTA_ROCCIA = 0.6885;
const UMIDITA_ERBA = 0.4583;

// Le scale sono in tasselli, e sono tarate sull'inquadratura: lo schermo ne
// mostra 24, quindi una collina larga 22 si attraversa in uno schermo scarso e
// il paesaggio cambia mentre si cammina. Scale molto più grandi davano regioni
// uniformi larghe il doppio della visuale, cioè un paesaggio che non cambia mai.
const SCALA_QUOTA = 22;
const SCALA_UMIDITA = 14;
const SCALA_BOSCO = 10;

// Semi derivati: usare lo stesso seme per strati diversi li farebbe coincidere,
// e i boschi crescerebbero esattamente sulle colline.
const scarto = (seme, n) => (seme + Math.imul(n, 0x9e3779b9)) >>> 0;

// Un disturbo a grana fine sommato alla quota prima di confrontarla con le
// soglie. Senza, i confini fra terreni seguono esattamente le curve di livello
// del rumore: linee lunghe e lisce che si leggono subito come generate. Con il
// disturbo il margine del bosco si sfrangia e la riva si sfrastaglia, che è
// come si comportano i margini veri.
//
// L'ampiezza è tarata sulla distanza fra le soglie (circa 0,02): abbastanza da
// spezzare il bordo, non tanto da sciogliere in coriandoli le fasce sottili
// della sabbia e del bassofondo.
const DISTURBO = 0.03;
const SCALA_DISTURBO = 4;

export function quotaIn(x, y, seme) {
  const base = rumoreFrattale(x / SCALA_QUOTA, y / SCALA_QUOTA, scarto(seme, 1), 5);
  const frangia = rumoreFrattale(x / SCALA_DISTURBO, y / SCALA_DISTURBO, scarto(seme, 7), 2) - 0.5;
  return base + frangia * DISTURBO;
}

export function terrenoIn(x, y, seme) {
  const quota = quotaIn(x, y, seme);
  if (quota < QUOTA_ACQUA) return TERRENO.ACQUA;
  if (quota < QUOTA_BASSOFONDO) return TERRENO.ACQUA_BASSA;
  if (quota < QUOTA_RIVA) return TERRENO.SABBIA;
  if (quota > QUOTA_ROCCIA) return TERRENO.ROCCIA;

  const umidita =
    rumoreFrattale(x / SCALA_UMIDITA, y / SCALA_UMIDITA, scarto(seme, 2), 3) +
    (rumoreFrattale(x / SCALA_DISTURBO, y / SCALA_DISTURBO, scarto(seme, 8), 2) - 0.5) * DISTURBO * 2;
  return umidita > UMIDITA_ERBA ? TERRENO.ERBA : TERRENO.STERPAGLIA;
}

export function oggettoIn(x, y, seme, terreno) {
  const sorte = impronta(x, y, scarto(seme, 3));

  if (terreno === TERRENO.ERBA) {
    // La densità degli alberi segue un rumore proprio: senza, gli alberi si
    // spargerebbero uniformi e non esisterebbero né boschi né radure — cioè
    // non esisterebbe nessun posto dove valga la pena andare.
    const bosco = rumoreFrattale(x / SCALA_BOSCO, y / SCALA_BOSCO, scarto(seme, 4), 3);
    const densita = Math.max(0, (bosco - 0.42) * 2.2);
    if (sorte < densita) return OGGETTO.ALBERO;
    if (sorte > 0.97) return OGGETTO.CESPUGLIO;
    return OGGETTO.NESSUNO;
  }

  if (terreno === TERRENO.STERPAGLIA) {
    if (sorte < 0.05) return OGGETTO.CESPUGLIO;
    if (sorte > 0.993) return OGGETTO.SASSO;
    return OGGETTO.NESSUNO;
  }

  if (terreno === TERRENO.ROCCIA && sorte < 0.08) return OGGETTO.SASSO;
  if (terreno === TERRENO.SABBIA && sorte > 0.99) return OGGETTO.SASSO;

  return OGGETTO.NESSUNO;
}

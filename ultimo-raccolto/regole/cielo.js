// Il cielo che si vede (M7.18.55).
//
// Non è una regola: il meteo che conta — pioggia, neve, arido, canicola — lo
// decide meteo.js, e qui non si tocca. Questo modulo lo legge e dice che
// aspetto ha la valle: quanta neve è posata per terra, se un giorno di
// pioggia è un temporale, quando c'è la foschia, e dove cadono i lampi. Sono
// tutte funzioni del giorno e dell'ora, come il meteo e la luna: stabili per
// valle, e niente va nel salvataggio.
import * as meteo from "./meteo.js";
import * as stagioni from "./stagioni.js";
import * as mappa from "../mondo/mappa.js";
import { impronta } from "../motore/casuale.js";

const fra = (v, a, b) => Math.min(1, Math.max(0, (v - a) / (b - a)));

// La neve posata, da 0 a 1. Nel giorno di neve si posa nelle prime otto ore;
// il giorno dopo, se non nevica ancora, si scioglie fra le sette e le
// diciannove. Da M7.18.58 può nevicare più giorni di fila: allora quella
// posata resta, e si scioglie il giorno dopo l'ultima nevicata.
export function neveAPosa(giorno, ore) {
  if (meteo.evento(giorno) === "neve") return meteo.evento(giorno - 1) === "neve" ? 1 : fra(ore, 0, 8);
  if (meteo.evento(giorno - 1) === "neve") return 1 - fra(ore, 7, 19);
  return 0;
}

// Il cielo coperto dei giorni di pioggia e di neve.
export function coperto(giorno) {
  const e = meteo.evento(giorno);
  return e === "pioggia" || e === "neve";
}

// Un giorno di pioggia su due è un temporale. Per le regole resta pioggia:
// bagna, spegne i fuochi e innaffia come sempre. Da M7.18.59 si tira insieme
// al giorno di pioggia (vedi meteo.js).
export function temporale(giorno) {
  return meteo.temporale(giorno);
}

// Il temporale tuona dal pomeriggio a sera.
export const TEMPORALE_DA = 14;
export const TEMPORALE_A = 23;
export function temporaleAdesso(giorno, ore) {
  return temporale(giorno) && ore >= TEMPORALE_DA && ore < TEMPORALE_A;
}

// I lampi, in secondi veri. Uno per ogni tratto di dodici secondi e mezzo,
// in un punto del tratto deciso dall'impronta: fra un lampo e l'altro passano
// da sette a diciotto secondi, mai a ritmo. Ogni lampo ha la sua vicinanza,
// che dice quanto illumina e quanto presto arriva il tuono.
const TRATTO = 12.5;
const DAL = 3.5, AL = 9;
export function lampoDi(secondi) {
  const k = Math.floor(secondi / TRATTO);
  const inizio = k * TRATTO + DAL + impronta(k, 1, 0x1a4b0) * (AL - DAL);
  const dt = secondi - inizio;
  const vicino = 0.4 + 0.6 * impronta(k, 2, 0x1a4b0);
  // Due battiti: il lampo, un istante di buio, un secondo lampo più debole.
  let forza = 0;
  if (dt >= 0 && dt < 0.08) forza = 1;
  else if (dt >= 0.08 && dt < 0.14) forza = 0.12;
  else if (dt >= 0.14 && dt < 0.26) forza = 0.55;
  return { numero: k, inizio, forza: forza * vicino, vicino, tuonoDopo: 0.4 + (1 - vicino) * 1.6 };
}

// La foschia all'alba, da 0 a 1: d'autunno ogni mattina, e in primavera e
// d'inverno la mattina dopo una pioggia. Mai d'estate e mai nei giorni di
// pioggia o di neve, che hanno già il cielo coperto.
export function foschia(giorno, ore) {
  if (coperto(giorno)) return 0;
  const stagione = stagioni.stagioneDi(giorno);
  if (stagione === "estate") return 0;
  if (stagione !== "autunno" && meteo.evento(giorno - 1) !== "pioggia") return 0;
  return Math.min(fra(ore, 4, 5), 1 - fra(ore, 8, 9.5));
}

// La luna (M7.18.54).
//
// Non è una regola che cambia cosa fanno gli altri: gli infetti escono e
// vedono come prima, perché quanti ne escono lo decide la luce del sole
// (tempo.luceAmbiente) e questa non la tocca. Cambia quanto vedi tu. Una notte
// di luna piena si attraversa senza torcia — e senza torcia non sei un faro —
// mentre una di luna nuova è più nera di come era la notte prima di lei, e la
// torcia torna l'unica risposta, col suo prezzo.
//
// Il ciclo dura sei giorni contro un anno di sedici: la piena scivola di anno
// in anno, e ogni tanto cade d'inverno. È scritta nel calendario come il
// meteo — la stessa valle ha le stesse lune — e si annuncia il giorno prima,
// come la pioggia: una regola che cambia la notte si deve poter vedere
// arrivare. Niente di tutto questo va nel salvataggio: si calcola dal giorno.
import * as tempo from "./tempo.js";
import * as meteo from "./meteo.js";
import * as mappa from "../mondo/mappa.js";
import { impronta } from "../motore/casuale.js";

export const CICLO = 6;

// Le sei facce, dalla nuova alla falce calante. La crescente è illuminata a
// destra, come la si vede da qui.
export const NOMI = ["nuova", "falce crescente", "gibbosa crescente", "piena", "gibbosa calante", "falce calante"];
export const NUOVA = 0;
export const PIENA = 3;

// Una notte comincia la sera di un giorno e finisce la mattina dopo: fino al
// giorno pieno (le sette) si è ancora nella notte del giorno prima. Da lì in
// poi "stanotte" è quella che arriva.
export function notteDi(giorno = tempo.giornoCorrente(), ore = tempo.oraCorrente()) {
  return ore < tempo.ALBA_PIENA ? giorno - 1 : giorno;
}

// La fase della notte che comincia la sera di questo giorno, da 0 a 5. Ogni
// valle ha il suo sfasamento, come il suo meteo.
export function fase(notte) {
  const scarto = Math.floor(impronta(0, 2, mappa.semeCorrente().valore ^ 0x1c0a) * CICLO);
  return (((notte - 1 + scarto) % CICLO) + CICLO) % CICLO;
}

// Quanto della faccia è illuminato, da 0 a 1: 0 · ¼ · ¾ · 1 · ¾ · ¼.
export function illuminata(f) {
  return Math.round(((1 - Math.cos((2 * Math.PI * f) / CICLO)) / 2) * 1000) / 1000;
}

// Col tempo brutto il cielo è coperto e la luna non si vede. È il meteo della
// sera in cui la notte comincia.
export function nascosta(notte) {
  const e = meteo.evento(notte);
  return e === "pioggia" || e === "neve";
}

function descrivi(notte) {
  const f = fase(notte);
  const coperta = nascosta(notte);
  return { notte, fase: f, nome: NOMI[f], nascosta: coperta, luce: coperta ? 0 : illuminata(f) };
}

// La notte di adesso, o quella che arriva stasera se è giorno.
export function stanotte() {
  return descrivi(notteDi());
}

// Quella dopo: serve all'annuncio del giorno prima.
export function domani() {
  return descrivi(notteDi() + 1);
}

// Quanta luna c'è in questo momento, da 0 a 1. Le nuvole si guardano sul
// giorno di calendario, perché è lì che piove: all'alba di un giorno di
// pioggia la luna è già sparita.
export function luceAdesso() {
  if (nascosta(tempo.giornoCorrente())) return 0;
  return stanotte().luce;
}

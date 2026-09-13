// L'orologio della valle.
//
// Un giorno dura dieci minuti veri. È una scelta di ritmo, non un dettaglio:
// più corto e la notte diventa un lampeggio fastidioso, più lungo e non fai in
// tempo a sentire la pressione del buio in una sessione breve. Stardew sta sui
// quattordici, Don't Starve sotto i nove.

const SECONDI_PER_GIORNO = 600;
const ORE_AL_SECONDO = 24 / SECONDI_PER_GIORNO;

// Si comincia alle sette del mattino: c'è una giornata intera davanti per
// capire come funziona il mondo prima che faccia buio.
const ORA_INIZIALE = 7;

// Alba e tramonto non sono istanti ma passaggi: due ore ciascuno, il tempo di
// accorgersi che sta cambiando e decidere se tornare al riparo.
const ALBA = 5;
const GIORNO_PIENO = 7;
const TRAMONTO = 19;
const NOTTE_PIENA = 21;

// Non si scende mai a zero. Un nero assoluto non è "notte", è "schermo
// spento": si perde l'orientamento e non si capisce più dove si sta andando.
const LUCE_NOTTURNA = 0.1;

let ore = ORA_INIZIALE;
let giorno = 1;

export function avanza(passo) {
  ore += passo * ORE_AL_SECONDO;
  while (ore >= 24) {
    ore -= 24;
    giorno += 1;
  }
}

export function oraCorrente() {
  return ore;
}

export function giornoCorrente() {
  return giorno;
}

export function orologio() {
  const h = Math.floor(ore);
  const m = Math.floor((ore - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function fra(valore, da, a) {
  return Math.min(1, Math.max(0, (valore - da) / (a - da)));
}

// Quanta luce c'è, da 0 a 1. La rampa è lineare perché a questa risoluzione
// una curva morbida non si distinguerebbe, e una lineare è prevedibile: si
// impara che alle sette è giorno fatto e alle nove di sera è buio pieno.
export function luceAmbiente() {
  if (ore >= GIORNO_PIENO && ore <= TRAMONTO) return 1;
  if (ore > TRAMONTO && ore < NOTTE_PIENA) {
    return LUCE_NOTTURNA + (1 - LUCE_NOTTURNA) * (1 - fra(ore, TRAMONTO, NOTTE_PIENA));
  }
  if (ore > ALBA && ore < GIORNO_PIENO) {
    return LUCE_NOTTURNA + (1 - LUCE_NOTTURNA) * fra(ore, ALBA, GIORNO_PIENO);
  }
  return LUCE_NOTTURNA;
}

export function eNotte() {
  return luceAmbiente() < 0.55;
}

// La tinta del buio cambia con l'ora: blu fredda nel cuore della notte,
// calda ai due passaggi. È quasi tutto l'effetto — un'oscurità grigia
// uguale a se stessa legge come un velo sullo schermo, non come un'ora
// del giorno.
const NOTTE = [14, 20, 44];
const PASSAGGIO = [58, 34, 26];

export function tintaOscurita() {
  const vicinanzaAlPassaggio = Math.max(
    1 - Math.abs(ore - (TRAMONTO + NOTTE_PIENA) / 2) / 2.5,
    1 - Math.abs(ore - (ALBA + GIORNO_PIENO) / 2) / 2.5
  );
  const q = Math.min(1, Math.max(0, vicinanzaAlPassaggio));
  const c = NOTTE.map((n, i) => Math.round(n + (PASSAGGIO[i] - n) * q));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}

// Quanti secondi reali mancano a un'ora del giorno. Serve a dormire: si
// dorme "fino all'alba", non "per otto ore".
export function secondiFinoAlle(bersaglio) {
  const mancanti = (bersaglio - ore + 24) % 24;
  return (mancanti === 0 ? 24 : mancanti) / ORE_AL_SECONDO / 24 * 24;
}

export const ALBA_PIENA = GIORNO_PIENO;

export function reimposta() {
  ore = ORA_INIZIALE;
  giorno = 1;
}

// Serve a cominciare la partita a un'ora scelta. Non è una comodità da
// sviluppo soltanto: aspettare quindici minuti reali per vedere come viene la
// notte è il modo migliore per non guardarla mai.
export function impostaOra(valore) {
  if (!Number.isFinite(valore)) return;
  ore = ((valore % 24) + 24) % 24;
}

// Lo stesso per il giorno, e per lo stesso motivo moltiplicato per otto: una
// stagione dura ottanta minuti veri, quindi vedere l'inverno aspettandolo
// significa non vederlo mai.
export function impostaGiorno(valore) {
  if (!Number.isFinite(valore) || valore < 1) return;
  giorno = Math.floor(valore);
}

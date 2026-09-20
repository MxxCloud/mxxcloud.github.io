// Ore della valle, non ore reali. Il contatore sopravvive a salva/carica.
import { SECONDI_PER_GIORNO } from "./tempo.js";

export const ORA = SECONDI_PER_GIORNO / 24;
export const DURATA_SVENIMENTO = 2 * ORA;
let esaurimento = 0;
let sonno = 0;

export function secondiDiSonno() { return sonno; }
export function istantanea() { return { esaurimento, sonno }; }
export function reimposta() { esaurimento = 0; sonno = 0; }
export function ripristina(stato) {
  esaurimento = stato?.esaurimento ?? 0;
  sonno = stato?.sonno ?? 0;
}
export function statoValido(stato) {
  return stato !== null && typeof stato === "object" && !Array.isArray(stato)
    && Number.isFinite(stato.esaurimento) && stato.esaurimento >= 0 && stato.esaurimento < ORA
    && Number.isFinite(stato.sonno) && stato.sonno >= 0 && stato.sonno <= DURATA_SVENIMENTO
    && (stato.sonno === 0 || stato.esaurimento === 0);
}

export function confine(esaurito, dorme) {
  if (sonno > 0) return sonno;
  if (!esaurito || dorme) esaurimento = 0;
  return esaurito && !dorme ? ORA - esaurimento : Infinity;
}

// Chiamato con lo stato all'inizio del passo: arrivare a zero alla fine
// non conta retroattivamente come aver passato tutto il passo allo stremo.
export function avanza(passo, { esaurito, dorme, vivo }) {
  if (!vivo) return false;
  if (sonno > 0) {
    sonno = Math.max(0, sonno - passo);
    if (sonno < 1e-9) { sonno = 0; return true; }
  } else if (esaurito && !dorme) {
    esaurimento += passo;
    if (esaurimento >= ORA - 1e-9) {
      esaurimento = 0;
      sonno = DURATA_SVENIMENTO;
    }
  } else esaurimento = 0;
  return false;
}

// Otto ore per riempire la barra. Il limite invernale non sottrae energia
// già posseduta: dormire poco dà poco, ma non stanca al posto di riposare.
export function recupero(prima, secondi, limite = 1) {
  return Math.max(0, Math.min(limite, prima + limite * secondi / (8 * ORA)) - prima);
}

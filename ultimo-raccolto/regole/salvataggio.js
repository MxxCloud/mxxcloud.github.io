// I salvataggi.
//
// Fino a qui la valle spariva chiudendo la scheda, e il README lo diceva
// chiaro: un posto che non sopravvive a una seduta è tuo solo per una seduta.
// L'orto, le stagioni e il decadimento valgono in proporzione a quanto a lungo
// puoi tenerli, quindi valevano poco.
//
// Quattro caselle: tre a mano e una scritta dall'alba di ogni giorno. L'alba
// perché è il momento in cui il mondo tira le somme — le colture crescono, i
// fuochi si spengono, la stagione cambia — e salvare subito dopo significa che
// una partita ripresa non ripete mai quel conto.
//
// Non si salva il mondo: si salva quello che il giocatore ha cambiato. Il
// resto è una funzione pura delle coordinate e del seme, e ricalcolarlo costa
// meno che scriverlo. È la stessa ragione per cui modifiche.js esiste, e il
// suo commento prometteva questo file fin dal primo giorno.

import * as tempo from "./tempo.js";
import * as bisogni from "./bisogni.js";
import * as salute from "./salute.js";
import * as inventario from "./inventario.js";
import * as stagioni from "./stagioni.js";
import * as mappa from "../mondo/mappa.js";
import * as modifiche from "../mondo/modifiche.js";
import * as esplorato from "./esplorato.js";
import * as fauna from "./fauna.js";
import * as meteo from "./meteo.js";
import { CATALOGO } from "./oggetti.js";
import { OGGETTO } from "../mondo/generazione.js";

// Cambiando la forma di quello che si scrive, questo numero sale e i
// salvataggi vecchi vengono rifiutati dicendolo, invece di essere caricati a
// metà: un caricamento che riesce per sbaglio è peggio di uno che fallisce.
const FORMATO = 1;

const PREFISSO = "ultimo-raccolto/";

export const MANUALI = ["1", "2", "3"];
export const ALBA = "alba";
export const CASELLE = [...MANUALI, ALBA];

export function eAutomatico(slot) {
  return slot === ALBA;
}

// --- il deposito ----------------------------------------------------------

// localStorage e non IndexedDB, al contrario delle altre applicazioni del
// sito: lì i dati sono tanti e crescono senza limite, qui un salvataggio è
// qualche decina di kilobyte e la scrittura deve avvenire dentro un
// fotogramma, senza promesse da aspettare.
//
// Ogni accesso può sollevare: finestra anonima, dati del sito bloccati, spazio
// finito. Si risponde sempre con un esito, mai con un'eccezione che
// attraversa il ciclo di gioco e lo ferma.
function deposito() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

const chiaveDi = (slot) => `${PREFISSO}${slot}`;

// --- scrivere -------------------------------------------------------------

// L'istantanea di una partita. L'eroe arriva da fuori perché è un'entità, e
// le entità stanno sotto le regole: questo modulo non sa chi le tiene.
export function istantanea(eroe, casellaScelta) {
  return {
    formato: FORMATO,
    // Quando, in tempo vero: serve solo a far scegliere fra due salvataggi.
    quando: Date.now(),
    seme: mappa.semeCorrente().nome,
    ore: tempo.oraCorrente(),
    giorno: tempo.giornoCorrente(),
    eroe: { px: eroe.px, py: eroe.py, guarda: eroe.guarda },
    casella: casellaScelta,
    bisogni: { ...bisogni.tutti() },
    // La salute sta accanto ai bisogni e non dentro: non è un quarto bisogno,
    // e infilarcela avrebbe voluto dire che bisogni.ripristina() se la
    // sarebbe trovata fra le mani senza sapere cosa farne.
    //
    // Il formato non sale: un salvataggio scritto prima di M5 non ha questo
    // campo e viene ripreso con la salute piena, che è la cosa giusta — chi
    // aveva salvato in un gioco dove non si moriva non deve svegliarsi ferito.
    salute: salute.livelloCorrente(),
    esposizioneFreddo: salute.secondiEsposto(),
    // L'infezione sì che si salva, al contrario della morte: è uno stato in
    // cui si vive, e chiudere la scheda non è una cura. Anche questo non alza
    // il formato — un salvataggio che non ce l'ha si riapre sano, che è la
    // cosa giusta perché è stato scritto in un gioco dove non esisteva.
    infezione: salute.eInfetto(),
    bagnato: meteo.livelloBagnato(),
    fauna: fauna.istantanea(),
    // Copie e non riferimenti: l'array dello zaino continua a vivere e a
    // cambiare mentre il salvataggio aspetta di essere scritto.
    inventario: inventario.contenuto().map((c) => (c ? { ...c } : null)),
    modifiche: structuredClone(modifiche.tutti()),
    // I settori visti, non il terreno che contengono: il terreno è una
    // funzione delle coordinate e si ricalcola uguale. È la stessa ragione per
    // cui qui sopra ci sono le modifiche e non il mondo.
    //
    // Anche questo non alza il formato: una partita scritta prima non ha il
    // campo e si riapre con la mappa da rifare, che è la cosa giusta — non si
    // può inventare dove sia stato qualcuno.
    esplorato: esplorato.tutti(),
  };
}

export function scrivi(slot, stato) {
  const d = deposito();
  if (!d) return { ok: false, perche: "questo browser non tiene i salvataggi" };
  try {
    d.setItem(chiaveDi(slot), JSON.stringify(stato));
    return { ok: true };
  } catch (errore) {
    // Il caso vero è lo spazio finito, e vale la pena distinguerlo: si risolve
    // cancellando una casella, non riprovando.
    const pieno = errore?.name === "QuotaExceededError";
    return { ok: false, perche: pieno ? "spazio esaurito" : "salvataggio non riuscito" };
  }
}

// --- leggere --------------------------------------------------------------

export function leggi(slot) {
  const d = deposito();
  if (!d) return null;
  try {
    const testo = d.getItem(chiaveDi(slot));
    if (!testo) return null;
    const stato = JSON.parse(testo);
    if (!valido(stato)) return null;
    return stato;
  } catch {
    // Un salvataggio illeggibile vale come assente. Non si cancella da solo:
    // un file rotto che sparisce toglie l'unica cosa che si potrebbe ancora
    // guardare per capire cos'è successo.
    return null;
  }
}

// Cosa mostrare nella schermata, senza caricare niente. Ogni casella dice
// sempre qualcosa: "vuota" è un'informazione utile quanto le altre.
export function elenco() {
  return CASELLE.map((slot) => {
    const stato = leggi(slot);
    if (!stato) return { slot, vuoto: true };
    return {
      slot,
      vuoto: false,
      giorno: stato.giorno,
      stagione: stagioni.stagioneDi(stato.giorno),
      seme: stato.seme,
      quando: stato.quando,
      quanteModifiche: stato.modifiche?.length ?? 0,
    };
  });
}

// --- il file --------------------------------------------------------------

// Un salvataggio è già un oggetto JSON, quindi il file è il salvataggio e
// basta: niente formato a parte da tenere allineato con quello vero, che
// sarebbe una seconda cosa da sbagliare a ogni modifica.
//
// Non compresso, al contrario di quello che andrà in rete: un file che si
// apre e si legge vale più dei centoventi kilobyte risparmiati, ed è la
// stessa scelta del backup di Budget futuro.
const oggetto = v => v !== null && typeof v === "object" && !Array.isArray(v);
const intero = v => Number.isSafeInteger(v);
const positivo = v => intero(v) && v >= 1;
const livelloValido = v => Number.isFinite(v) && v >= 0 && v <= 1;
const tipi = new Set(Object.values(OGGETTO));
const presente = (v, k, verifica) => v[k] === undefined || verifica(v[k]);
// Il tetto sceso dalle riparazioni si controlla come gli usi, e gli usi non
// possono superarlo: un salvataggio che dichiara più lena di quanta
// l'attrezzo ne possa avere è storto, e va rifiutato prima di toccare la
// partita — non dopo.
function usiValidi(c) {
  const durata = CATALOGO[c.cosa]?.durata ?? -1;
  if (!presente(c, "massimo", n => intero(n) && n >= 1 && n <= durata)) return false;
  const tetto = c.massimo ?? durata;
  return presente(c, "usi", n => intero(n) && n >= 0 && n <= tetto);
}
function casellaValida(c) {
  return c === null || (oggetto(c) && Object.hasOwn(CATALOGO, c.cosa) && positivo(c.quantita)
    && usiValidi(c) && c.quantita <= CATALOGO[c.cosa].pila && presente(c, "dal", positivo));
}
function filaValida(fila, massimo) {
  return Array.isArray(fila) && fila.length <= massimo && fila.every(casellaValida);
}
function modificaValida(v) {
  if (!oggetto(v) || !intero(v.tx) || !intero(v.ty)) return false;
  if (!presente(v, "oggetto", n => tipi.has(n))) return false;
  if (!presente(v, "giornoPesca", positivo) || !presente(v, "pescati", n => intero(n) && n >= 0 && n <= 2)) return false;
  if (!presente(v, "colpi", n => intero(n) && n >= 0)) return false;
  for (const k of ["posata", "maturata", "svuotata", "dal", "giorno"]) {
    if (!presente(v, k, positivo)) return false;
  }
  if (!presente(v, "bagnato", b => typeof b === "boolean")) return false;
  if (v.oggetto === OGGETTO.MUCCHIO && (!Object.hasOwn(CATALOGO, v.cosa) || !positivo(v.quante) || !usiValidi(v) || (v.usi !== undefined && v.quante !== 1))) return false;
  if (!presente(v, "contenuto", a => filaValida(a, 12))) return false;
  if (!presente(v, "roba", a => filaValida(a, inventario.CASELLE))) return false;
  return true;
}

// Tutto il controllo precede qualsiasi mutazione. I campi opzionali delle
// versioni precedenti restano opzionali, ma quelli presenti devono essere sani.
export function valido(stato) {
  if (!oggetto(stato) || stato.formato !== FORMATO || typeof stato.seme !== "string") return false;
  if (stato.seme.length > 1024 || !positivo(stato.giorno)) return false;
  if (!Number.isFinite(stato.ore) || stato.ore < 0 || stato.ore >= 24) return false;
  if (!oggetto(stato.eroe) || !Number.isFinite(stato.eroe.px) || !Number.isFinite(stato.eroe.py)) return false;
  if (Math.abs(stato.eroe.px) > Number.MAX_SAFE_INTEGER / 16 || Math.abs(stato.eroe.py) > Number.MAX_SAFE_INTEGER / 16) return false;
  if (!presente(stato.eroe, "guarda", v => ["su", "giu", "destra", "sinistra"].includes(v))) return false;
  if (!presente(stato, "casella", n => intero(n) && n >= 0 && n < inventario.CASELLE)) return false;
  if (!presente(stato, "esposizioneFreddo", n => Number.isFinite(n) && n >= 0 && n <= 30)) return false;
  if (!presente(stato, "fauna", fauna.statoValido)) return false;
  if (!presente(stato, "bagnato", livelloValido)) return false;
  if (!presente(stato, "salute", livelloValido) || !presente(stato, "infezione", v => typeof v === "boolean")) return false;
  if (!presente(stato, "bisogni", v => oggetto(v) && bisogni.ELENCO.every(k => presente(v, k, livelloValido)))) return false;
  if (!presente(stato, "inventario", v => filaValida(v, inventario.CASELLE))) return false;
  if (!presente(stato, "modifiche", v => Array.isArray(v) && v.length <= 100000 && v.every(modificaValida))) return false;
  if (!presente(stato, "esplorato", v => Array.isArray(v) && v.length <= 100000 && v.every(k => {
    if (typeof k !== "string" || !/^-?\d+,-?\d+$/.test(k)) return false;
    return k.split(",").every(n => intero(Number(n)));
  }))) return false;
  return true;
}

// Il nome dice a colpo d'occhio qual è il più avanti, che è la domanda vera
// quando in una cartella ce ne sono cinque.
export function nomeFile(stato) {
  const stagione = stagioni.stagioneDi(stato.giorno);
  return `ultimo-raccolto-${stato.seme}-giorno${stato.giorno}-${stagione}.json`;
}

export function cancella(slot) {
  const d = deposito();
  if (!d) return false;
  try {
    d.removeItem(chiaveDi(slot));
    return true;
  } catch {
    return false;
  }
}

// --- applicare ------------------------------------------------------------

// Rimette in piedi tutto quello che questo modulo sa raggiungere, e
// restituisce a chi orchestra i pezzi che non gli appartengono — l'eroe e la
// casella scelta.
//
// L'ordine conta: prima il seme, perché cambiarlo butta i settori cotti e
// rigenera il terreno; poi le modifiche, che sono le eccezioni a quel
// terreno; poi il resto, che non dipende da nessuno dei due.
export function applica(stato) {
  if (!valido(stato)) return null;
  // Preparata prima di toccare la partita, e senza riferimenti al file importato.
  try { stato = structuredClone(stato); } catch { return null; }

  if (stato.seme !== mappa.semeCorrente().nome) mappa.inizializza(stato.seme);

  modifiche.svuota();
  for (const voce of stato.modifiche ?? []) {
    const { tx, ty, ...cambio } = voce;
    if (!Number.isFinite(tx) || !Number.isFinite(ty)) continue;
    modifiche.imposta(tx, ty, cambio);
  }
  // I settori cotti portano addosso il mondo di prima, modifiche comprese.
  mappa.scordaSettori();

  tempo.impostaGiorno(stato.giorno);
  tempo.impostaOra(stato.ore);
  bisogni.ripristina(stato.bisogni);
  meteo.ripristina(stato.bagnato);
  salute.ripristina(stato.salute, stato.infezione === true, stato.esposizioneFreddo);
  inventario.ripristina(stato.inventario);
  fauna.ripristina(stato.fauna);
  esplorato.ripristina(stato.esplorato);

  return {
    eroe: stato.eroe,
    casella: Number.isInteger(stato.casella) ? stato.casella : 0,
    giorno: tempo.giornoCorrente(),
  };
}

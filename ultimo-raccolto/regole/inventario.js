// Lo zaino.
//
// Otto caselle e non di più. Il limite non è pigrizia: in un survival lo
// spazio è una delle poche cose che costringono a scegliere, e uno zaino
// infinito toglie di mezzo la domanda "cosa vale la pena portarsi".

import { CATALOGO } from "./oggetti.js";
import * as tempo from "./tempo.js";

export const CASELLE = 8;

// Una casella vuota è null e non un oggetto con quantità zero: così "la
// casella è libera" è una domanda sola invece di due.
const caselle = new Array(CASELLE).fill(null);

export function contenuto() {
  return caselle;
}

export function quante(cosa) {
  let somma = 0;
  for (const casella of caselle) if (casella?.cosa === cosa) somma += casella.quantita;
  return somma;
}

// --- impilare, dovunque ---------------------------------------------------

// Da qui in giù ci sono due funzioni che lavorano su una fila di caselle
// qualsiasi invece che sullo zaino. Non è astrazione preventiva: la cassa
// tiene le cose esattamente come le tiene lo zaino — stessa pila, stessa
// regola del riempire prima le pile cominciate — e ricopiare quelle
// venticinque righe in contenitori.js avrebbe voluto dire due posti in cui
// sistemare lo stesso difetto. Lo zaino è la fila che questo modulo possiede.

// Quando due pile della stessa cosa si uniscono, la data diventa la media
// pesata delle due. Tenere la più vecchia punirebbe chi aggiunge tre bacche
// fresche a una cesta che sta per andare; tenere la più nuova permetterebbe
// di ringiovanire un raccolto vecchio buttandoci sopra una bacca. La media è
// l'unica delle tre che si comporta come una cesta vera, e si dice in una
// riga.
//
// Si arrotonda per difetto, cioè verso il vecchio: fra due torti, quello che
// fa perdere del cibo è meno grave di quello che lo fa durare per sempre.
// Esportata perché serve anche ai mucchi per terra: due pile che si uniscono
// sul terreno devono comportarsi come due pile che si uniscono nello zaino o
// in una cassa. Tre regole diverse per la stessa cosa sarebbero tre posti in
// cui sistemare lo stesso difetto.
export function mescolaDate(dalA, quanteA, dalB, quanteB) {
  if (dalA === undefined) return dalB;
  if (dalB === undefined) return dalA;
  return Math.floor((dalA * quanteA + dalB * quanteB) / (quanteA + quanteB));
}

// Mette in una fila di caselle e restituisce quante non ci sono entrate. Chi
// raccoglie deve poter dire "zaino pieno" invece di far sparire la roba in
// silenzio.
export function mettiIn(fila, cosa, quantita, dal, usi, massimo) {
  const pila = CATALOGO[cosa]?.pila ?? 1;
  // Solo il cibo porta una data. Darla anche alla legna vorrebbe dire
  // scrivere nel salvataggio un numero per casella che non serve a nessuno.
  const deperibile = CATALOGO[cosa]?.dura !== undefined;
  const quando = deperibile ? (dal ?? tempo.giornoCorrente()) : undefined;
  let resto = quantita;

  // Prima si riempiono le pile già cominciate, poi si aprono caselle nuove:
  // il contrario sparpaglierebbe la stessa cosa su più caselle con lo zaino
  // quasi pieno, sprecando l'unica risorsa scarsa che c'è qui.
  for (const casella of fila) {
    if (resto === 0) break;
    if (casella?.cosa !== cosa) continue;
    const spazio = pila - casella.quantita;
    const messe = Math.min(spazio, resto);
    if (messe === 0) continue;
    if (deperibile) casella.dal = mescolaDate(casella.dal, casella.quantita, quando, messe);
    casella.quantita += messe;
    resto -= messe;
  }

  for (let i = 0; i < fila.length && resto > 0; i += 1) {
    if (fila[i]) continue;
    const messe = Math.min(pila, resto);
    fila[i] = deperibile ? { cosa, quantita: messe, dal: quando } : { cosa, quantita: messe };
    if (CATALOGO[cosa]?.durata) {
      // Il tetto si scrive solo se è sceso: un campo in più su ogni attrezzo
      // nuovo sarebbe un numero per casella che non dice niente, e questo
      // salvataggio è piccolo perché non scrive quello che si sa già.
      const tetto = Math.min(CATALOGO[cosa].durata, massimo ?? CATALOGO[cosa].durata);
      if (tetto < CATALOGO[cosa].durata) fila[i].massimo = tetto;
      fila[i].usi = Math.min(tetto, usi ?? tetto);
    }
    resto -= messe;
  }

  return resto;
}

// Quanto ci starebbe in una fila di caselle, se si provasse ad aggiungere.
export function spazioIn(fila, cosa) {
  const pila = CATALOGO[cosa]?.pila ?? 1;
  let posto = 0;
  for (const casella of fila) {
    if (!casella) posto += pila;
    else if (casella.cosa === cosa) posto += pila - casella.quantita;
  }
  return posto;
}

// --- lo zaino -------------------------------------------------------------

// "dal" arriva da fuori per un caso solo ma importante: quello che si tira
// fuori da una cassa deve conservare la sua età invece di tornare fresco,
// altrimenti una cassa sarebbe una macchina per ringiovanire il cibo.
export function aggiungi(cosa, quantita, dal, usi, massimo) {
  return mettiIn(caselle, cosa, quantita, dal, usi, massimo);
}

export function togli(cosa, quantita) {
  return togliDa(caselle, cosa, quantita);
}

export function togliDa(fila, cosa, quantita) {
  if (fila.reduce((n, c) => n + (c?.cosa === cosa ? c.quantita : 0), 0) < quantita) return false;
  let resto = quantita;
  // Si svuotano prima le pile più piccole, così le caselle si liberano invece
  // di restare tutte a metà.
  const ordine = fila
    .map((casella, i) => ({ casella, i }))
    .filter(({ casella }) => casella?.cosa === cosa)
    .sort((a, b) => a.casella.quantita - b.casella.quantita);

  for (const { casella, i } of ordine) {
    if (resto === 0) break;
    const tolte = Math.min(casella.quantita, resto);
    casella.quantita -= tolte;
    resto -= tolte;
    if (casella.quantita === 0) fila[i] = null;
  }
  return true;
}

// Svuota una casella e restituisce cosa c'era. Serve a gettare: si getta una
// casella intera e non "una legna", perché a zaino pieno il problema è la
// casella occupata, e liberarla un'unità alla volta sarebbe quaranta volte lo
// stesso tasto per risolvere un problema che si vede a colpo d'occhio.
export function svuotaCasella(indice) {
  const casella = caselle[indice];
  if (!casella) return null;
  caselle[indice] = null;
  return { ...casella };
}

export function pieno() {
  return caselle.every((casella) => casella !== null);
}

// Quanto ci starebbe, se si provasse ad aggiungere. Serve a chi deve decidere
// prima di agire — le ricette — invece di aggiungere e poi disfare.
export function spazioPer(cosa) {
  return spazioIn(caselle, cosa);
}

export function svuota() {
  caselle.fill(null);
}

// Rimette lo zaino com'era in un salvataggio. Si copia dentro l'array che
// esiste invece di sostituirlo: contenuto() restituisce quell'array, e chi lo
// ha già in mano continuerebbe a leggere quello vecchio.
export function ripristina(salvate) {
  svuota();
  if (!Array.isArray(salvate)) return;
  for (let i = 0; i < CASELLE && i < salvate.length; i += 1) {
    const c = salvate[i];
    // Una casella malformata diventa vuota invece di far saltare il
    // caricamento: un salvataggio storto deve costare una casella, non una
    // partita.
    if (!c || typeof c.cosa !== "string" || !(c.quantita > 0)) continue;
    caselle[i] = { cosa: c.cosa, quantita: Math.min(c.quantita, CATALOGO[c.cosa]?.pila ?? 1) };
    // La data manca nei salvataggi scritti prima che il cibo si guastasse, e
    // in quel caso non si inventa: la riempie il primo cambio di giorno con
    // "oggi", che è la stessa gentilezza che i fuochi hanno per i salvataggi
    // senza la data di accensione. Chi aveva messo via delle rape in un gioco
    // in cui non marcivano non deve ritrovarsele marce.
    if (typeof c.dal === "number") caselle[i].dal = c.dal;
    if (CATALOGO[c.cosa]?.durata) {
      const tetto = massimoDi(c);
      if (tetto < CATALOGO[c.cosa].durata) caselle[i].massimo = tetto;
      caselle[i].usi = usiRimasti(c);
    }
  }
}


// Valuta una trasformazione senza alterare le pile originali se fallisce.
export function trasforma(costi, prodotto) {
  const copia = caselle.map(c => c ? { ...c } : null);
  for (const voce of costi) if (!togliDa(copia, voce.cosa, voce.quante)) return false;
  if (spazioIn(copia, prodotto.cosa) < prodotto.quante) return false;
  mettiIn(copia, prodotto.cosa, prodotto.quante);
  for (let i = 0; i < CASELLE; i++) caselle[i] = copia[i];
  return true;
}

// --- l'usura ---------------------------------------------------------------

// Quanto una riparazione toglie alla durata massima, e sotto quale soglia non
// si ripara più. Sono frazioni della durata di partenza, così valgono per
// tutti e quattro gli attrezzi senza quattro numeri da tenere allineati.
//
// UN ATTREZZO RIPARATO NON TORNA NUOVO, ed è la differenza fra un promemoria e
// una regola. Con la riparazione piatta un'ascia era eterna: costava una
// pietra a ciclo, cioè il due per cento di quello che quell'ascia produceva, e
// la ricetta dell'ascia si usava una volta sola in tutta la partita. Adesso
// ogni riparazione le toglie un decimo della lena di quando era nuova, e sotto
// i due quinti non c'è più niente da raddrizzare: l'ascia va rifatta.
//
// Per l'ascia sono sei riparazioni — 60, 54, 48, 42, 36, 30, 24 — cioè
// duecentonovantaquattro colpi in tutto invece di infiniti. Resta un attrezzo
// che dura, ma smette di essere per sempre, che è quello che questo gioco
// dice di sé fin dalla prima riga del README: cura contro entropia.
const CALO = 0.1;
const MINIMO = 0.4;

const caloDi = (cosa) => Math.max(1, Math.round(CATALOGO[cosa].durata * CALO));
const minimoDi = (cosa) => Math.max(1, Math.round(CATALOGO[cosa].durata * MINIMO));

// La durata massima di questo esemplare: quella di catalogo finché non lo si
// ripara. Sta sulla casella come gli usi, perché due asce nello stesso zaino
// hanno due storie diverse.
export function massimoDi(casella) {
  const catalogo = CATALOGO[casella?.cosa]?.durata;
  if (!catalogo) return null;
  return Math.min(catalogo, casella.massimo ?? catalogo);
}

// La durata appartiene alla casella, non al tipo di attrezzo. I vecchi
// salvataggi senza contatore ripartono con attrezzi integri.
export function usiRimasti(casella) {
  const massimo = massimoDi(casella);
  return massimo === null ? null : Math.min(massimo, casella.usi ?? massimo);
}

export function attrezzo(cosa, indice) {
  const c = indice === undefined ? caselle.find(c => c?.cosa === cosa) : caselle[indice];
  return c?.cosa === cosa && CATALOGO[cosa]?.durata ? c : null;
}

export function usura(casella) {
  const usi = usiRimasti(casella);
  if (usi === null || usi <= 0) return null;
  casella.usi = usi - 1;
  if (casella.usi === 0) return { cosa: casella.cosa, rotto: true };
  // L'avviso arriva a un quinto di quello che questo esemplare regge adesso,
  // non di quello che reggeva da nuovo: un'ascia riparata cinque volte deve
  // avvisare quando è quasi finita lei, non quando lo sarebbe stata un'altra.
  if (casella.usi === Math.floor(massimoDi(casella) / 5))
    return { cosa: casella.cosa, rotto: false };
  return null;
}

// Si ripara finché resta lena da raddrizzare. Sotto il minimo si dice di no e
// non si toglie niente a nessuno: è il momento in cui l'attrezzo va rifatto.
export function riparabile(casella) {
  const massimo = massimoDi(casella);
  if (massimo === null) return false;
  return massimo - caloDi(casella.cosa) >= minimoDi(casella.cosa);
}

export function ripara(casella) {
  if (!riparabile(casella)) return false;
  casella.massimo = massimoDi(casella) - caloDi(casella.cosa);
  casella.usi = casella.massimo;
  return true;
}

// Una riparazione riguarda il più usurato di quel tipo; a parità il primo. Chi
// è sceso sotto il minimo non è "il più usurato": è fuori gioco, e sceglierlo
// vorrebbe dire non poter più riparare gli altri.
export function daRiparare(cosa) {
  return caselle.filter(c => c?.cosa === cosa && usiRimasti(c) < massimoDi(c) && riparabile(c))
    .sort((a, b) => usiRimasti(a) - usiRimasti(b))[0] ?? null;
}

// Ce n'è uno di quel tipo che è arrivato al capolinea? Serve a dire la
// differenza fra "non c'è niente da riparare" e "non si ripara più".
export function troppoConsumato(cosa) {
  return caselle.some(c => c?.cosa === cosa && !riparabile(c));
}

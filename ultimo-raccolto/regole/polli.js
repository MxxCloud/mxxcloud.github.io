// I polli (M7.18.18): la seconda tappa dell'allevamento, dopo lo steccato.
//
// Non stanno con la fauna, e non per pignoleria. Le bestie di fauna.js sono
// la prateria: nascono attorno a chi cammina, spariscono quando si allontana,
// e nessuna è tua. Un pollo allevato è l'opposto — resta dove l'hai messo,
// anche a cento settori di distanza, e si salva con la partita. Le due regole
// scritte in un modulo solo sarebbero state una lista di eccezioni.
//
// Il giro è questo:
// - attorno alle rovine vivono polli inselvatichiti, gli animali di chi se
//   n'è andato. Di giorno scappano; di notte dormono appollaiati e si
//   prendono a mani nude — di notte, cioè quando fuori ci sono gli infetti;
// - un pollo vivo nello zaino regge una notte sola: la seconda mezzanotte
//   muore, e resta la sua carne;
// - posato dentro un recinto è tuo, e ci resta finché il recinto tiene: con il
//   cancello aperto se ne va, e fuori dal recinto a mezzanotte torna
//   selvatico;
// - mangia ogni giorno dal pollaio: un seme, una bacca o un fagiolo a testa.
//   Un giorno senza è un giorno di fame, due di fila e muore;
// - d'inverno senza pollaio muore di freddo, e un pollaio ne ripara quattro.
//
// E da M7.18.19 quello che dà:
// - uno su quattro è un gallo. La gallina nutrita fa un uovo ogni due giorni,
//   non d'inverno, nel nido del pollaio;
// - con un gallo nel recinto le uova lasciate nel nido si covano: alla terza
//   notte un uovo è un pulcino, che in una stagione diventa gallo o gallina.
//   Ogni pulcino è un uovo non mangiato, come ogni seme è una rapa;
// - il pollaio raccoglie la pollina, che sull'orto vale la cenere.

import * as mappa from "../mondo/mappa.js";
import * as modifiche from "../mondo/modifiche.js";
import { OGGETTO, TERRENO } from "../mondo/generazione.js";
import { CELLA } from "../mondo/rovine.js";
import { vistaLibera } from "../mondo/ostacoli.js";
import * as urti from "../entita/urti.js";
import { impronta } from "../motore/casuale.js";
import * as tempo from "./tempo.js";
import * as stagioni from "./stagioni.js";
import * as riparo from "./riparo.js";
import * as inventario from "./inventario.js";
import { cuoci, riflesso } from "../arte/sprite.js";
import * as arte from "../arte/sprite-cose.js";

// Quanti polli selvatici al massimo attorno a chi cammina. Pochi: sono gli
// avanzi di un paese, non uno stormo.
export const MASSIMO_SELVATICI = 2;
// Ogni quanti secondi si prova a farne comparire uno.
const OGNI_QUANTO = 30;
// Più lontano di così un pollo selvatico si dimentica, come le bestie.
const DIMENTICA = 620;
// Quanto vicino ci si può avvicinare di giorno prima che scappi.
const PAURA = 64;
const VELOCITA_FUGA = 60;
const VELOCITA_PASSEGGIO = 10;

// Il pollaio: quanto mangime tiene e quanti polli ripara d'inverno.
export const MANGIME_MASSIMO = 12;
export const RIPARATI_PER_POLLAIO = 4;
// Quanti giorni di fame di fila uccidono.
export const GIORNI_DI_FAME = 2;
// Il nido e la cova: quante uova e quanta pollina tiene un pollaio, quante
// notti di cova fanno un pulcino, e quanti giorni ci mette a crescere.
export const UOVA_MASSIME = 6;
export const POLLINA_MASSIMA = 6;
export const NOTTI_DI_COVA = 3;
export const GIORNI_DA_PULCINO = 4;
// Ogni quanti giorni una gallina nutrita fa un uovo.
export const GIORNI_PER_UOVO = 2;
// Quanti selvatici su cento sono galli.
const GALLI = 0.25;
// Gli animali vivi che stanno nello zaino: la gallina e il gallo.
export const VIVI = new Set(["pollo", "gallo"]);
// Cosa mangia un pollo: i semi e quello che si raccoglie a mani nude. Il
// mangime fa concorrenza a te e all'orto, ed è questa la sua spesa.
export const MANGIMI = new Set(["semi", "semi_cavolo", "semi_lino", "bacche", "fagioli"]);

const polli = [];
let attesa = OGNI_QUANTO;
let sequenza = 0;

export const tutte = () => polli;

export function reimposta() {
  polli.length = 0;
  attesa = OGNI_QUANTO;
  sequenza = 0;
}

// "eta" è l'età di un pulcino in giorni, null per un adulto; "deposto" il
// giorno dell'ultimo uovo, null per chi non ne ha ancora fatti.
function crea(px, py, domestico, seme, gallo = false, eta = null) {
  return { px, py, domestico, seme: seme >>> 0, dx: 0, dy: 0, giro: 0,
    destra: true, passo: 0, fame: 0, gallo, eta, deposto: null };
}

export const pulcino = (p) => p.eta !== null && p.eta !== undefined;
const gallina = (p) => !p.gallo && !pulcino(p);

// Un generatore per pollo, come per le bestie: il passeggio non dipende dal
// fotogramma in cui lo si guarda.
function caso(p) {
  p.seme = (Math.imul(p.seme, 1664525) + 1013904223) >>> 0;
  return p.seme / 4294967296;
}

// --- dove vivono i selvatici ------------------------------------------------

const MACERIE = new Set([OGGETTO.MURO, OGGETTO.MURO_ROTTO]);

// Accanto a quello che resta di una casa: un muro, in piedi o crollato, a tre
// tasselli. È dove stavano i pollai di chi c'era.
function vicinoAlleRovine(tx, ty) {
  for (let dy = -3; dy <= 3; dy += 1) {
    for (let dx = -3; dx <= 3; dx += 1) {
      if (MACERIE.has(mappa.oggettoDi(tx + dx, ty + dy))) return true;
    }
  }
  return false;
}

function terraBuona(tx, ty) {
  const t = mappa.terrenoNaturaleDi(tx, ty);
  return [TERRENO.ERBA, TERRENO.STERPAGLIA, TERRENO.TERRA].includes(t)
    && mappa.oggettoDi(tx, ty) === OGGETTO.NESSUNO;
}

// Le case in rovina attorno a chi cammina: la sua cella e le otto vicine. I
// piccoli luoghi no — un carro o un pozzo non avevano un pollaio.
function rovineVicine(eroe) {
  const cx = Math.floor(eroe.px / 16 / CELLA);
  const cy = Math.floor(eroe.py / 16 / CELLA);
  const trovate = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const r = mappa.rovinaNellaCella(cx + dx, cy + dy);
      if (r && !r.luogo) trovate.push(r);
    }
  }
  return trovate;
}

// Un pollo nasce accanto a una rovina vera, e lontano abbastanza da non
// comparire sotto gli occhi: fuori dallo schermo, dentro la distanza a cui
// si dimenticano.
function nasce(eroe) {
  const rovine = rovineVicine(eroe);
  if (rovine.length === 0) return;
  const seme = mappa.semeCorrente().valore;
  const giro = ++sequenza;
  for (let i = 0; i < 24; i += 1) {
    const r = rovine[Math.floor(impronta(giro, i, seme ^ 0x9a11a) * rovine.length)];
    const tx = r.tx0 - 2 + Math.floor(impronta(i, giro, seme ^ 0x5e1f0) * (r.larghezza + 4));
    const ty = r.ty0 - 2 + Math.floor(impronta(giro + i, i, seme ^ 0x3c77d) * (r.altezza + 4));
    const px = (tx + 0.5) * 16;
    const py = (ty + 0.75) * 16;
    const distanza = Math.hypot(px - eroe.px, py - eroe.py);
    if (distanza < 200 || distanza > DIMENTICA - 40) continue;
    if (!terraBuona(tx, ty) || !vicinoAlleRovine(tx, ty) || !urti.liberoIn(px, py)) continue;
    // Mai dentro un recinto: quelli sono tuoi.
    if (riparo.recintato(tx, ty)) continue;
    if (polli.some(p => Math.hypot(p.px - px, p.py - py) < 48)) continue;
    const gallo = impronta(giro, i + 7, seme ^ 0x6a110) < GALLI;
    polli.push(crea(px, py, false, Math.floor(impronta(i, giro, seme) * 4294967296), gallo));
    return;
  }
}

// --- il passo ---------------------------------------------------------------

function muovi(p, dx, dy, distanza) {
  const n = Math.hypot(dx, dy);
  if (!n || distanza <= 0) return;
  if (Math.abs(dx) > 0.01) p.destra = dx > 0;
  const pezzi = Math.max(1, Math.ceil(distanza / 3));
  for (let i = 0; i < pezzi; i += 1) p.passo += urti.muovi(p, dx / n * distanza / pezzi, dy / n * distanza / pezzi) / 5;
}

export function aggiorna(passo, eroe) {
  if (!Number.isFinite(passo) || passo <= 0) return;
  for (let i = polli.length - 1; i >= 0; i -= 1) {
    const p = polli[i];
    if (!p.domestico && Math.hypot(p.px - eroe.px, p.py - eroe.py) > DIMENTICA) polli.splice(i, 1);
  }
  attesa -= passo;
  if (attesa <= 0) {
    attesa = OGNI_QUANTO;
    if (polli.filter(p => !p.domestico).length < MASSIMO_SELVATICI) nasce(eroe);
  }
  // Di notte dormono tutti, allevati e no: è l'unica cosa che hanno in
  // comune, ed è quella che rende i selvatici prendibili.
  if (tempo.eNotte()) return;
  for (const p of polli) {
    const dx = p.px - eroe.px;
    const dy = p.py - eroe.py;
    if (!p.domestico && Math.hypot(dx, dy) < PAURA && vistaLibera(p, eroe)) {
      muovi(p, dx || 0.01, dy, VELOCITA_FUGA * passo);
      continue;
    }
    p.giro -= passo;
    if (p.giro <= 0) {
      p.giro = 1.5 + caso(p) * 3;
      const angolo = caso(p) * Math.PI * 2;
      const fermo = caso(p) < 0.4;
      p.dx = fermo ? 0 : Math.cos(angolo);
      p.dy = fermo ? 0 : Math.sin(angolo);
    }
    muovi(p, p.dx, p.dy, VELOCITA_PASSEGGIO * passo);
  }
}

// --- i gesti ----------------------------------------------------------------

const DIREZIONI = { su: [0, -1], giu: [0, 1], sinistra: [-1, 0], destra: [1, 0] };

// Il pollo che si ha davanti, entro la portata di un braccio.
export function davanti(eroe, portata = 22) {
  const [dx, dy] = DIREZIONI[eroe.guarda] ?? DIREZIONI.giu;
  let trovato = null;
  let minima = Infinity;
  for (const p of polli) {
    const vx = p.px - eroe.px;
    const vy = p.py - eroe.py;
    const d = Math.hypot(vx, vy);
    if (d > portata || d >= minima || (d > 6 && vx * dx + vy * dy <= 0)) continue;
    trovato = p;
    minima = d;
  }
  return trovato;
}

// Perché non si prende, o null se si prende. Il selvatico di giorno scappa, e
// lo si dice invece di lasciar premere la barra a vuoto.
export function perche(p) {
  if (pulcino(p)) return "è un pulcino: lascialo crescere";
  if (!p.domestico && !tempo.eNotte()) return "di giorno scappa: prendilo di notte";
  if (inventario.spazioPer(p.gallo ? "gallo" : "pollo") < 1) return "zaino pieno";
  return null;
}

function togli(p) {
  const i = polli.indexOf(p);
  if (i >= 0) polli.splice(i, 1);
}

// Preso: finisce nello zaino con il giorno in cui è stato preso, che è quello
// che decide quando muore (vedi nuovoGiorno).
export function prendi(p) {
  if (!polli.includes(p) || perche(p)) return null;
  togli(p);
  inventario.aggiungi(p.gallo ? "gallo" : "pollo", 1, tempo.giornoCorrente());
  return { tipo: "polloPreso", gallo: p.gallo === true };
}

// Tirargli il collo con un'arma in mano: una carne cruda. Allevato o no.
export function uccidi(p) {
  if (!polli.includes(p) || pulcino(p)) return null;
  togli(p);
  const resto = inventario.aggiungi("carne_cruda", 1, tempo.giornoCorrente());
  return { tipo: "polloUcciso", nelloZaino: resto === 0 };
}

// Posato davanti ai piedi: dentro lo steccato è tuo — anche col cancello
// ancora aperto, che si chiude uscendo — fuori scappa. Il tassello deve
// essere libero per starci in piedi.
export function doveLiberare(tx, ty) {
  const px = (tx + 0.5) * 16;
  const py = (ty + 0.75) * 16;
  if (mappa.solidoIn(tx, ty) || !urti.liberoIn(px, py)) return null;
  return { px, py, nelRecinto: riparo.dentroLoSteccato(tx, ty) };
}

export function libera(tx, ty, indice) {
  const posto = doveLiberare(tx, ty);
  const casella = inventario.contenuto()[indice];
  if (!posto || !VIVI.has(casella?.cosa)) return null;
  inventario.svuotaCasella(indice);
  const seme = Math.floor(impronta(tx, ty, tempo.giornoCorrente()) * 4294967296);
  polli.push(crea(posto.px, posto.py, posto.nelRecinto, seme, casella.cosa === "gallo"));
  return { tipo: "polloLiberato", nelRecinto: posto.nelRecinto, gallo: casella.cosa === "gallo" };
}

// --- il pollaio ---------------------------------------------------------------

export function mangimeNel(tx, ty) {
  return modifiche.di(tx, ty)?.mangime ?? 0;
}

// Un seme, una bacca o un fagiolo per volta, come la legna nel focolare: il
// pollaio è il posto in cui si torna.
export function nutri(tx, ty) {
  if (mappa.oggettoDi(tx, ty) !== OGGETTO.POLLAIO) return false;
  const mangime = mangimeNel(tx, ty);
  if (mangime >= MANGIME_MASSIMO) return false;
  modifiche.imposta(tx, ty, { ...(modifiche.di(tx, ty) ?? {}), oggetto: OGGETTO.POLLAIO, mangime: mangime + 1 });
  return true;
}

export function uovaNel(tx, ty) {
  return modifiche.di(tx, ty)?.uova ?? 0;
}
export function pollinaNel(tx, ty) {
  return modifiche.di(tx, ty)?.pollina ?? 0;
}

// Riscrive i campi del pollaio: quelli a zero spariscono, come la legna.
function aggiornaPollaio(tx, ty, campi) {
  const dati = { ...(modifiche.di(tx, ty) ?? {}), oggetto: OGGETTO.POLLAIO, ...campi };
  for (const k of ["mangime", "uova", "cova", "pollina"]) if (!dati[k]) delete dati[k];
  modifiche.imposta(tx, ty, dati);
}

// Prendere le uova azzera la cova: quello che c'era sotto la chioccia è nello
// zaino adesso.
export function prendiUova(tx, ty) {
  const uova = uovaNel(tx, ty);
  if (uova === 0) return null;
  const resto = inventario.aggiungi("uovo", uova, tempo.giornoCorrente());
  if (resto === uova) return { tipo: "zainoPieno" };
  aggiornaPollaio(tx, ty, { uova: resto, cova: 0 });
  return { tipo: "uovaPrese", quante: uova - resto };
}

export function prendiPollina(tx, ty) {
  const pollina = pollinaNel(tx, ty);
  if (pollina === 0) return null;
  const resto = inventario.aggiungi("pollina", pollina);
  if (resto === pollina) return { tipo: "zainoPieno" };
  aggiornaPollaio(tx, ty, { pollina: resto });
  return { tipo: "pollinaPresa", quante: pollina - resto };
}

// Quanti polli allevati stanno nel recinto di questo pollaio.
export function nelRecintoDi(tx, ty) {
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const recinto = riparo.recintoDi(tx + dx, ty + dy);
    if (!recinto) continue;
    const dentro = new Set(recinto.tasselli.map(t => `${t.tx},${t.ty}`));
    return polli.filter(p => p.domestico && dentro.has(`${Math.floor(p.px / 16)},${Math.floor(p.py / 16)}`)).length;
  }
  return 0;
}

// --- la mezzanotte ------------------------------------------------------------

// Da chiamare a ogni cambio di giorno. Restituisce cosa è successo, perché
// ognuna di queste cose va detta al mattino: un pollo morto di fame senza che
// nessuno lo dica è un pollo sparito.
export function nuovoGiorno() {
  const giorno = tempo.giornoCorrente();
  const esito = { mortiNelloZaino: 0, avvisoZaino: 0, scappati: 0, affamati: 0, mortiDiFame: 0, mortiDiFreddo: 0,
    uova: 0, uovaPerse: 0, nati: 0, cresciuti: [] };
  const nascite = [];

  // Nello zaino un pollo regge una notte: preso ieri, a questa mezzanotte è
  // ancora vivo — e lo si avvisa — alla prossima no. Resta la carne.
  for (const casella of inventario.contenuto()) {
    if (!VIVI.has(casella?.cosa)) continue;
    const preso = casella.dal ?? giorno;
    if (giorno - preso >= 2) {
      casella.cosa = "carne_cruda";
      casella.dal = giorno;
      esito.mortiNelloZaino += casella.quantita;
    } else if (giorno - preso === 1) {
      esito.avvisoZaino += casella.quantita;
    }
  }

  // Chi è fuori da un recinto a mezzanotte non è più tuo.
  for (const p of polli) {
    if (p.domestico && !riparo.recintato(Math.floor(p.px / 16), Math.floor(p.py / 16))) {
      p.domestico = false;
      p.fame = 0;
      esito.scappati += 1;
    }
  }

  // Ogni recinto con i suoi polli e i suoi pollai.
  const inverno = stagioni.stagioneDi(giorno) === "inverno";
  const visti = new Set();
  const morti = new Set();
  for (const p of polli) {
    if (!p.domestico) continue;
    const k = `${Math.floor(p.px / 16)},${Math.floor(p.py / 16)}`;
    if (visti.has(k)) continue;
    const recinto = riparo.recintoDi(Math.floor(p.px / 16), Math.floor(p.py / 16));
    if (!recinto) continue;
    const dentro = new Set(recinto.tasselli.map(t => `${t.tx},${t.ty}`));
    for (const t of dentro) visti.add(t);
    const qui = polli.filter(q => q.domestico && dentro.has(`${Math.floor(q.px / 16)},${Math.floor(q.py / 16)}`));
    const pollai = recinto.pareti.filter(t => mappa.oggettoDi(t.tx, t.ty) === OGGETTO.POLLAIO);

    // Si mangia dal pollaio che ne ha di più, uno per pollo.
    const nutriti = new Set();
    for (const q of qui) {
      const pieno = pollai.filter(t => mangimeNel(t.tx, t.ty) > 0)
        .sort((a, b) => mangimeNel(b.tx, b.ty) - mangimeNel(a.tx, a.ty))[0];
      if (pieno) {
        const resta = mangimeNel(pieno.tx, pieno.ty) - 1;
        const { mangime, ...resto } = modifiche.di(pieno.tx, pieno.ty) ?? { oggetto: OGGETTO.POLLAIO };
        modifiche.imposta(pieno.tx, pieno.ty, resta > 0 ? { ...resto, mangime: resta } : resto);
        q.fame = 0;
        nutriti.add(q);
        continue;
      }
      q.fame += 1;
      if (q.fame >= GIORNI_DI_FAME) { morti.add(q); esito.mortiDiFame += 1; }
      else esito.affamati += 1;
    }

    // D'inverno il freddo: un pollaio ne ripara quattro, gli altri muoiono.
    if (inverno) {
      const vivi = qui.filter(q => !morti.has(q));
      const riparati = pollai.length * RIPARATI_PER_POLLAIO;
      for (const q of vivi.slice(riparati)) { morti.add(q); esito.mortiDiFreddo += 1; }
    }

    const vivi = qui.filter(q => !morti.has(q));

    // I pulcini crescono, e al quarto giorno sono gallo o gallina.
    for (const q of vivi) {
      if (!pulcino(q)) continue;
      q.eta += 1;
      if (q.eta >= GIORNI_DA_PULCINO) {
        q.eta = null;
        q.gallo = (q.seme & 1) === 1;
        esito.cresciuti.push(q.gallo ? "gallo" : "gallina");
      }
    }

    if (!inverno) {
      // Le uova: una gallina nutrita stanotte, ogni due giorni, nel nido meno
      // pieno. Senza pollaio, o col nido pieno, l'uovo è perso.
      for (const q of vivi) {
        if (!gallina(q) || !nutriti.has(q)) continue;
        if (q.deposto !== null && q.deposto !== undefined && giorno - q.deposto < GIORNI_PER_UOVO) continue;
        q.deposto = giorno;
        const nido = pollai.filter(t => uovaNel(t.tx, t.ty) < UOVA_MASSIME)
          .sort((a, b) => uovaNel(a.tx, a.ty) - uovaNel(b.tx, b.ty))[0];
        if (!nido) { esito.uovaPerse += 1; continue; }
        aggiornaPollaio(nido.tx, nido.ty, { uova: uovaNel(nido.tx, nido.ty) + 1 });
        esito.uova += 1;
      }
    }

    // La cova: con un gallo nel recinto le uova del nido si scaldano, e alla
    // terza notte una è un pulcino. D'inverno si ferma, e senza gallo non
    // comincia.
    const gallo = vivi.some(q => q.gallo && !pulcino(q));
    for (const t of pollai) {
      const dati = modifiche.di(t.tx, t.ty) ?? {};
      if (inverno || !gallo || !dati.uova) {
        if (dati.cova) aggiornaPollaio(t.tx, t.ty, { cova: 0 });
        continue;
      }
      const cova = (dati.cova ?? 0) + 1;
      if (cova < NOTTI_DI_COVA) { aggiornaPollaio(t.tx, t.ty, { cova }); continue; }
      aggiornaPollaio(t.tx, t.ty, { cova: 0, uova: dati.uova - 1 });
      const posto = recinto.tasselli.find(c => Math.abs(c.tx - t.tx) + Math.abs(c.ty - t.ty) <= 2
        && urti.liberoIn((c.tx + 0.5) * 16, (c.ty + 0.75) * 16)) ?? recinto.tasselli[0];
      nascite.push(crea((posto.tx + 0.5) * 16, (posto.ty + 0.75) * 16, true,
        Math.floor(impronta(t.tx, t.ty, giorno) * 4294967296), false, 0));
      esito.nati += 1;
    }

    // La pollina: un recinto con dei polli ne lascia una a notte nel pollaio
    // che ne ha meno.
    if (vivi.length > 0) {
      const dove = pollai.filter(t => pollinaNel(t.tx, t.ty) < POLLINA_MASSIMA)
        .sort((a, b) => pollinaNel(a.tx, a.ty) - pollinaNel(b.tx, b.ty))[0];
      if (dove) aggiornaPollaio(dove.tx, dove.ty, { pollina: pollinaNel(dove.tx, dove.ty) + 1 });
    }
  }
  for (const p of morti) togli(p);
  polli.push(...nascite);
  return esito;
}

// --- salvataggio ------------------------------------------------------------

const CAMPI = ["px", "py", "domestico", "seme", "dx", "dy", "giro", "destra", "passo", "fame", "gallo", "eta", "deposto"];

export function istantanea() {
  return { attesa, sequenza, polli: polli.map(p => Object.fromEntries(CAMPI.map(k => [k, p[k]]))) };
}

export function ripristina(dati) {
  reimposta();
  if (!dati) return;
  attesa = dati.attesa;
  sequenza = dati.sequenza;
  // I polli salvati prima di M7.18.19 non hanno i campi nuovi: sono galline
  // adulte che non hanno ancora fatto uova.
  for (const p of dati.polli) polli.push({ gallo: false, eta: null, deposto: null, ...p });
}

export function statoValido(dati) {
  const numero = (n, a, b) => Number.isFinite(n) && n >= a && n <= b;
  const intero = (n, a, b) => Number.isSafeInteger(n) && n >= a && n <= b;
  if (!dati || !numero(dati.attesa, 0, OGNI_QUANTO) || !intero(dati.sequenza, 0, Number.MAX_SAFE_INTEGER)
    || !Array.isArray(dati.polli) || dati.polli.length > 256) return false;
  return dati.polli.every(p => p && numero(p.px, -1e9, 1e9) && numero(p.py, -1e9, 1e9)
    && typeof p.domestico === "boolean" && intero(p.seme, 0, 4294967295)
    && numero(p.dx, -1, 1) && numero(p.dy, -1, 1) && numero(p.giro, -1, 5)
    && typeof p.destra === "boolean" && numero(p.passo, 0, 1e12)
    && intero(p.fame, 0, GIORNI_DI_FAME - 1)
    && (p.gallo === undefined || typeof p.gallo === "boolean")
    && (p.eta === undefined || p.eta === null || intero(p.eta, 0, GIORNI_DA_PULCINO - 1))
    && (p.deposto === undefined || p.deposto === null || intero(p.deposto, 1, Number.MAX_SAFE_INTEGER)));
}

// --- disegno ------------------------------------------------------------------

export function daDisegnare() {
  const notte = tempo.eNotte();
  return polli.map(p => {
    const passo = Math.floor(p.passo) % 2;
    let righe;
    if (pulcino(p)) righe = notte ? arte.PULCINO_DORME : arte.PULCINO[passo];
    else if (p.gallo) righe = notte
      ? (p.domestico ? arte.GALLO_DORME_SPRITE : arte.GALLO_SELVATICO_DORME)
      : (p.domestico ? arte.GALLO : arte.GALLO_SELVATICO)[passo];
    else righe = notte
      ? (p.domestico ? arte.POLLO_DORME : arte.POLLO_SELVATICO_DORME)
      : (p.domestico ? arte.POLLO : arte.POLLO_SELVATICO)[passo];
    const cotto = cuoci(righe);
    p.sprite = p.destra ? cotto : riflesso(cotto);
    p.x = p.px - p.sprite.width / 2;
    p.y = p.py - p.sprite.height;
    p.base = p.py;
    return p;
  });
}

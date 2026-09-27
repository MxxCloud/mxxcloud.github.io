// I cavalli (Per un pugno di semi W0.6): la prima regola western dopo la
// pistola, e quella che il recinto del ranch aspettava da W0.3.
//
// Non stanno con la fauna, per la stessa ragione dei polli: le bestie di
// fauna.js sono la prateria, nascono attorno a chi cammina e nessuna è tua;
// un cavallo preso resta dove l'hai lasciato e si salva con la partita.
//
// Il giro è questo:
// - con il lazo in mano, un cavallo selvatico a tiro si prende. Ti vede da
//   cento pixel e scappa appena sotto la tua corsa, quindi il lazo arriva
//   più lontano del braccio: lo si rincorre e lo si prende da dietro;
// - preso, è tuo e ti segue legato alla corda. Col lazo in mano lo si slega
//   e lo si lega di nuovo; a mani libere ci si sale sopra;
// - a cavallo si va al trotto, e col Maiusc al galoppo (vedi giocatore.js);
//   scendendo, il cavallo resta lì;
// - un cavallo lasciato slegato fuori da un recinto chiuso o da una stanza,
//   a mezzanotte, se lo prendono i banditi. È la regola dei polli detta col
//   western, e il recinto del ranch esiste per questo.
//
// E da W0.7 mangia e si stanca:
// - ogni mezzanotte vuole un pasto. Lo trova da sé nella mangiatoia del suo
//   recinto, o nel prato del recinto in primavera e d'estate, e al pascolo
//   anche alla corda o in sella, sempre in primavera e d'estate. Altrimenti
//   lo si imbocca: fieno (fibra) o biada (grano), uno al giorno, a mano;
// - un giorno senza e non galoppa; due di fila, rompe la corda e torna alla
//   prateria. Non muore, come il pollo: se ne va;
// - il galoppo gli toglie il fiato, e sfiancato va soltanto al trotto finché
//   non l'ha ripreso.
//
// E da W0.8 d'autunno e d'inverno vuole la stalla:
// - la stalla è una stanza murata, come una casa: il fienile del ranch con i
//   suoi tre buchi chiusi, o quattro mura alzate da te. Il recinto è aperto
//   al cielo, e resta il posto della primavera e dell'estate;
// - le notti d'autunno e d'inverno un cavallo che non sta in una stalla né
//   accanto a un fuoco prende freddo. Il freddo fa come la fame: una notte e
//   non galoppa, due di fila e se ne va. Non c'entra dove sei tu — in sella o
//   alla corda il freddo è lo stesso — e il fuoco che scalda è quello che
//   scalda lo straniero: un falò o un focolare a tre tasselli;
// - la mangiatoia si posa anche nella stalla, e i cavalli liberi nella stalla
//   mangiano da lì. Il prato no: la stalla ha il pavimento.

import * as mappa from "../mondo/mappa.js";
import { vistaLibera } from "../mondo/ostacoli.js";
import * as urti from "../entita/urti.js";
import { impronta } from "../motore/casuale.js";
import * as schermo from "../motore/schermo.js";
import * as riparo from "./riparo.js";
import * as fauna from "./fauna.js";
import * as stagioni from "./stagioni.js";
import * as tempo from "./tempo.js";
import { RAGGIO_FUOCO } from "./freddo.js";
import * as modifiche from "../mondo/modifiche.js";
import { OGGETTO, TERRENO } from "../mondo/generazione.js";
import { cuoci, riflesso } from "../arte/sprite.js";
import { SELLATO, COLLO } from "../arte/sprite-cavallo.js";

// Quanto arriva il lazo. Il cavallo ti vede da cento pixel e scappa a
// ottantotto al secondo, tu corri a novantadue: col braccio non lo si prende
// mai, e il lazo esiste per quei dodici pixel. Da cento a ottantotto, di
// corsa, sono tre secondi.
export const GITTATA_LAZO = 88;

// Quanti se ne possono avere. Non è un limite di gioco — è il tetto con cui si
// controlla un salvataggio, come per i polli — ed è largo: un recinto pieno.
export const MASSIMI = 12;

// Legato ti viene dietro a questa distanza, e non più vicino: uno sprite lungo
// due volte te, attaccato ai tuoi piedi, ti coprirebbe.
const SEGUE = 22;
// Più veloce di chi corre, così la corda non si tende mai quando si va dritti.
const VELOCITA_CONDOTTO = 110;
// Oltre questa distanza — un muro in mezzo, un cancello chiuso — la corda si
// scioglie e il cavallo resta dov'è, invece di trascinarsi incastrato.
const STRAPPO = 150;
// Libero, pascola: un passo ogni tanto, come i polli.
const VELOCITA_PASCOLO = 8;
// Quanto vicino si lascia stare a chi è a piedi, e agli altri cavalli.
const ADDOSSO = 14;
const FRA_LORO = 20;

// --- il fieno e il fiato (W0.7) ----------------------------------------------

// Cosa mangia: il fieno, che è la fibra dei cespugli e della sterpaglia, e la
// biada, che è il grano dell'orto. Una razione al giorno per cavallo, l'una
// o l'altra: il grano non vale di più, costa di più — è la scelta di chi ha
// un campo e non ha voglia di strappare cespugli.
export const FORAGGI = new Set(["fibra", "grano"]);
export const nomeDelForaggio = (cosa) => (cosa === "grano" ? "la biada" : "il fieno");
// Quante razioni tiene una mangiatoia: dodici giorni per un cavallo, sei per
// due. Come il mangime del pollaio.
export const RAZIONI_MASSIME = 12;
// Due giorni senza mangiare e se ne va; uno, e non galoppa.
export const GIORNI_DI_FAME = 2;
// Quanti tasselli di prato del recinto sfamano un cavallo in primavera e
// d'estate: il doppio di un pollo, e un cavallo mangia più di quattro polli
// — ma un pollo gratta la terra, e un cavallo bruca l'erba alta.
export const PRATO_PER_CAVALLO = 8;
// Il fiato: quindici secondi di galoppo lo finiscono, venticinque di trotto o
// di riposo lo ridanno. Sfiancato torna a galoppare quando ne ha di nuovo un
// terzo: senza quel margine, a fiato zero il galoppo si accenderebbe e
// spegnerebbe a ogni fotogramma.
const GALOPPO_PIENO = 15;
const RIPRESA = 25;
const FIATO_PER_RIPARTIRE = 0.3;

// --- la stalla (W0.8) -----------------------------------------------------------

// Due notti fredde di fila e se ne va; una, e non galoppa. Come la fame, e
// apposta: è la stessa regola detta da un'altra parte, e si impara una volta.
export const NOTTI_DI_FREDDO = 2;
// Le notti fredde per un cavallo. Lo straniero gela soltanto d'inverno, ma lui
// dorme vestito; un cavallo dorme in piedi sotto il cielo, e d'autunno la
// notte è già fredda e l'erba è già secca. È anche la stagione in cui c'è
// tempo per rimettere in piedi la stalla prima che arrivi la neve.
export const siGelaLaNotte = (stagione) => stagione === "autunno" || stagione === "inverno";

const cavalli = [];

export const tutte = () => cavalli;

export function reimposta() {
  cavalli.length = 0;
}

function crea(px, py, stato, seme, destra = true) {
  return { px, py, stato, destra, passo: 0, seme: seme >>> 0, giro: 0, dx: 0, dy: 0,
    fame: 0, fiato: 1, pasto: false, sfiancato: false, freddo: 0 };
}

// Un generatore per cavallo, conservato nel salvataggio, come per la fauna.
function caso(c) {
  c.seme = (Math.imul(c.seme, 1664525) + 1013904223) >>> 0;
  return c.seme / 4294967296;
}

export function montato() {
  return cavalli.find((c) => c.stato === "montato") ?? null;
}

export const affamato = (c) => c.fame > 0;
export const infreddolito = (c) => c.freddo > 0;

// Si galoppa se il cavallo sotto di te ha mangiato ieri, stanotte non ha
// preso freddo e ha fiato.
export function puoGaloppare() {
  const c = montato();
  return Boolean(c) && !affamato(c) && !infreddolito(c) && !c.sfiancato;
}

// --- dove si guarda ---------------------------------------------------------

const DIREZIONI = { su: [0, -1], giu: [0, 1], sinistra: [-1, 0], destra: [1, 0] };

function davantiA(eroe, x, y, portata) {
  const [dx, dy] = DIREZIONI[eroe.guarda] ?? DIREZIONI.giu;
  const vx = x - eroe.px;
  const vy = y - eroe.py;
  const d = Math.hypot(vx, vy);
  if (d > portata) return Infinity;
  if (d > 6 && vx * dx + vy * dy <= 0) return Infinity;
  return d;
}

// Il cavallo selvatico a tiro di lazo: vivo, davanti, entro la gittata e con
// la vista libera. Il più vicino, se sono due.
export function selvaticoATiro(eroe) {
  let trovato = null;
  let minima = Infinity;
  for (const e of fauna.tutte()) {
    if (e.specie !== "cavallo" || e.vita <= 0) continue;
    const d = davantiA(eroe, e.px, e.py, GITTATA_LAZO);
    if (d >= minima || !vistaLibera(eroe, e)) continue;
    trovato = e;
    minima = d;
  }
  return trovato;
}

// Il tuo cavallo davanti, a portata di mano. Quello su cui sei seduto no.
export function davanti(eroe, portata = 26) {
  let trovato = null;
  let minima = Infinity;
  for (const c of cavalli) {
    if (c.stato === "montato") continue;
    const d = davantiA(eroe, c.px, c.py, portata);
    if (d >= minima) continue;
    trovato = c;
    minima = d;
  }
  return trovato;
}

// --- i gesti ----------------------------------------------------------------

// Perché il lazo non si lancia, o null se si lancia.
export function percheNonLazo() {
  return cavalli.length >= MASSIMI ? "hai già tutti i cavalli che puoi tenere" : null;
}

// Preso: lascia la prateria vivo e diventa tuo, legato alla corda. Tiene il
// suo generatore e il verso in cui guardava.
export function prendi(selvatico) {
  if (percheNonLazo() || !fauna.togli(selvatico)) return null;
  cavalli.push(crea(selvatico.px, selvatico.py, "legato", selvatico.seme, selvatico.destra));
  return { tipo: "lazoPreso" };
}

function nelRecinto(c) {
  const tx = Math.floor(c.px / schermo.TASSELLO);
  const ty = Math.floor(c.py / schermo.TASSELLO);
  return riparo.dentroLoSteccato(tx, ty);
}

// In una stalla (W0.8): una stanza murata. La porta aperta non la apre, come
// per il freddo dello straniero; un muro crollato sì.
export function inStalla(c) {
  const tx = Math.floor(c.px / schermo.TASSELLO);
  const ty = Math.floor(c.py / schermo.TASSELLO);
  return riparo.murato(tx, ty);
}

// Al caldo per la notte: nella stalla, o a tre tasselli da un falò o da un
// focolare accesi. La torcia no, come per lo straniero (vedi freddo.js).
export function alCaldo(c) {
  const tx = Math.floor(c.px / schermo.TASSELLO);
  const ty = Math.floor(c.py / schermo.TASSELLO);
  return inStalla(c) || mappa.fuocoVicino(tx, ty, RAGGIO_FUOCO);
}

// Dove resta un cavallo lasciato: chi lo lascia deve sapere se stanotte è
// al sicuro, e da W0.8 se prenderà freddo. La notte che conta è quella che
// arriva, cioè la stagione di domani: l'ultimo giorno d'estate la mezzanotte
// è già d'autunno (vedi simulazione.js).
const lasciato = (c) => ({ nelRecinto: nelRecinto(c), inStalla: inStalla(c),
  alFreddo: siGelaLaNotte(stagioni.stagioneDi(tempo.giornoCorrente() + 1)) && !alCaldo(c) });

export function lega(c) {
  if (!cavalli.includes(c) || c.stato !== "libero") return null;
  c.stato = "legato";
  return { tipo: "cavalloLegato" };
}

export function slega(c) {
  if (!cavalli.includes(c) || c.stato !== "legato") return null;
  c.stato = "libero";
  return { tipo: "cavalloSlegato", ...lasciato(c) };
}

// In sella. Il cavallo viene sotto di te, non tu sopra di lui: sei tu quello
// che il gioco muove, e uno scatto della figura di due tasselli si leggerebbe
// come un difetto.
export function monta(c, eroe) {
  if (!cavalli.includes(c) || c.stato === "montato" || montato()) return null;
  c.stato = "montato";
  c.px = eroe.px;
  c.py = eroe.py;
  return { tipo: "aCavallo" };
}

// Giù di sella: il cavallo resta dove sei sceso, libero. Si scansa da solo
// di un passo al giro dopo (vedi sgomitano).
export function scendi(eroe) {
  const c = montato();
  if (!c) return null;
  c.stato = "libero";
  c.px = eroe.px;
  c.py = eroe.py;
  c.giro = 2;
  c.dx = 0;
  c.dy = 0;
  return { tipo: "scesoDaCavallo", ...lasciato(c) };
}

// Morendo si lascia andare tutto: il cavallo su cui eri e quelli alla corda
// restano dove sei caduto, liberi. Chi arriva dopo li può riprendere — se
// arriva prima di mezzanotte.
export function lasciaAndare(eroe) {
  for (const c of cavalli) {
    if (c.stato === "montato" && eroe) {
      c.px = eroe.px;
      c.py = eroe.py;
    }
    if (c.stato !== "libero") c.stato = "libero";
  }
}

// Imboccarlo: una razione di fieno o di biada vale il pasto di oggi, e ne
// basta una. Chi lo chiama ha già tolto la razione dallo zaino.
export function nutri(c) {
  if (!cavalli.includes(c) || c.pasto) return null;
  c.pasto = true;
  return { tipo: "cavalloNutrito", affamato: affamato(c) };
}

// --- la mangiatoia -------------------------------------------------------------

export function razioniNella(tx, ty) {
  return modifiche.di(tx, ty)?.razioni ?? 0;
}

// Una razione per volta, come la legna nel focolare.
export function riempi(tx, ty) {
  if (mappa.oggettoDi(tx, ty) !== OGGETTO.MANGIATOIA) return false;
  const razioni = razioniNella(tx, ty);
  if (razioni >= RAZIONI_MASSIME) return false;
  modifiche.imposta(tx, ty, { ...(modifiche.di(tx, ty) ?? {}), oggetto: OGGETTO.MANGIATOIA, razioni: razioni + 1 });
  return true;
}

function togliRazione(tx, ty) {
  const { razioni, ...resto } = modifiche.di(tx, ty) ?? { oggetto: OGGETTO.MANGIATOIA };
  const restano = (razioni ?? 0) - 1;
  modifiche.imposta(tx, ty, restano > 0 ? { ...resto, razioni: restano } : resto);
}

const tassello = (c) => ({ tx: Math.floor(c.px / schermo.TASSELLO), ty: Math.floor(c.py / schermo.TASSELLO) });

// Il posto in cui mangiano i cavalli liberi di questo tassello: il suo
// recinto, o da W0.8 la sua stalla. Tutti e due con i tasselli di dentro e le
// pareti, fra cui stanno le mangiatoie; la stalla senza prato.
function mangiatoiaDi(tx, ty) {
  const recinto = riparo.recintoDi(tx, ty);
  if (recinto) return { ...recinto, prato: true };
  if (!riparo.murato(tx, ty)) return null;
  const tasselli = riparo.stanzaDi(tx, ty);
  return { tasselli, pareti: riparo.pareti(tasselli), prato: false };
}

// Il recinto o la stalla di questa mangiatoia: quello di uno dei quattro
// tasselli accanto.
function recintoAccantoA(tx, ty) {
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const posto = mangiatoiaDi(tx + dx, ty + dy);
    if (posto) return posto;
  }
  return null;
}

// Il prato di un recinto: i tasselli liberi d'erba o di sterpaglia, come per
// i polli (vedi polli.js).
function pratoDi(recinto) {
  return recinto.tasselli.filter(({ tx, ty }) => {
    if (mappa.oggettoDi(tx, ty) !== OGGETTO.NESSUNO || mappa.pavimentoIn(tx, ty)) return false;
    const t = mappa.terrenoNaturaleDi(tx, ty);
    return t === TERRENO.ERBA || t === TERRENO.STERPAGLIA;
  }).length;
}

const siPascola = (stagione) => stagione === "primavera" || stagione === "estate";

function sfamaIlPrato(recinto, stagione) {
  return recinto.prato && siPascola(stagione) ? Math.floor(pratoDi(recinto) / PRATO_PER_CAVALLO) : 0;
}

function dentroIl(recinto) {
  const dentro = new Set(recinto.tasselli.map((t) => `${t.tx},${t.ty}`));
  return (c) => { const t = tassello(c); return dentro.has(`${t.tx},${t.ty}`); };
}

// Quello che serve a chi guarda la mangiatoia: quanti cavalli liberi stanno
// nel suo recinto o nella sua stalla, e quanti ne sfama il prato oggi.
export function recintoDellaMangiatoia(tx, ty, stagione = stagioni.stagioneCorrente()) {
  const recinto = recintoAccantoA(tx, ty);
  if (!recinto) return { cavalli: 0, prato: 0 };
  const dentro = dentroIl(recinto);
  return {
    cavalli: cavalli.filter((c) => c.stato === "libero" && dentro(c)).length,
    prato: sfamaIlPrato(recinto, stagione),
  };
}

// --- il passo ---------------------------------------------------------------

function muovi(c, dx, dy, distanza) {
  const n = Math.hypot(dx, dy);
  if (!n || distanza <= 0) return;
  if (Math.abs(dx) > 0.01) c.destra = dx > 0;
  const pezzi = Math.max(1, Math.ceil(distanza / 3));
  for (let i = 0; i < pezzi; i += 1) c.passo += urti.muovi(c, dx / n * distanza / pezzi, dy / n * distanza / pezzi) / 6;
}

// Restituisce quanti cavalli si sono slegati in questo giro, per dirlo.
export function aggiorna(passo, eroe) {
  const eventi = { slegati: 0, sfiancato: false };
  if (!Number.isFinite(passo) || passo <= 0 || !eroe) return eventi;
  for (const c of cavalli) {
    // Il fiato: cala solo al galoppo, e torna in ogni altro momento.
    if (c.stato === "montato" && eroe.galoppa) {
      c.fiato = Math.max(0, c.fiato - passo / GALOPPO_PIENO);
      if (c.fiato === 0 && !c.sfiancato) {
        c.sfiancato = true;
        eventi.sfiancato = true;
      }
    } else {
      c.fiato = Math.min(1, c.fiato + passo / RIPRESA);
      if (c.sfiancato && c.fiato >= FIATO_PER_RIPARTIRE) c.sfiancato = false;
    }
    if (c.stato === "montato") {
      // Sotto di te: la tua posizione, il tuo verso e il tuo passo, che è
      // quello che muove le zampe del disegno.
      c.px = eroe.px;
      c.py = eroe.py;
      c.destra = eroe.versoInSella !== "sinistra";
      c.passo = eroe.passo;
      continue;
    }
    const dx = eroe.px - c.px;
    const dy = eroe.py - c.py;
    const distanza = Math.hypot(dx, dy);
    if (c.stato === "legato") {
      if (distanza > STRAPPO) {
        c.stato = "libero";
        eventi.slegati += 1;
        continue;
      }
      if (distanza > SEGUE) muovi(c, dx, dy, Math.min(distanza - SEGUE, VELOCITA_CONDOTTO * passo));
      continue;
    }
    c.giro -= passo;
    if (c.giro <= 0) {
      c.giro = 2 + caso(c) * 4;
      const angolo = caso(c) * Math.PI * 2;
      const fermo = caso(c) < 0.5;
      c.dx = fermo ? 0 : Math.cos(angolo);
      c.dy = fermo ? 0 : Math.sin(angolo);
    }
    muovi(c, c.dx, c.dy, VELOCITA_PASCOLO * passo);
  }
  return eventi;
}

// Si scansano da chi va a piedi e fra loro, dopo che si sono mossi tutti. Si
// sposta sempre il cavallo e mai chi cammina, per la stessa ragione della
// fauna: il gioco non deve muovere chi sta tenendo premuto un tasto.
function scansa(a, b, minima, entrambi) {
  const distanza = Math.hypot(a.px - b.px, a.py - b.py);
  if (!(distanza < minima)) return;
  // Sovrapposti al pixel non c'è una direzione: se ne prende una dal posto.
  // La spinta però resta quella vera, cioè tutta la distanza minima: contare
  // la sovrapposizione come un pixel lasciava il cavallo appena sceso a
  // tredici pixel invece di quattordici.
  let ux = (a.px - b.px) / distanza;
  let uy = (a.py - b.py) / distanza;
  if (distanza < 0.001) {
    const angolo = impronta(Math.round(a.px), Math.round(a.py), a.seme) * Math.PI * 2;
    ux = Math.cos(angolo);
    uy = Math.sin(angolo);
  }
  const spinta = entrambi ? (minima - distanza) / 2 : minima - distanza;
  urti.muovi(a, ux * spinta, uy * spinta);
  if (entrambi) urti.muovi(b, -ux * spinta, -uy * spinta);
}

export function sgomitano(eroe) {
  const aTerra = cavalli.filter((c) => c.stato !== "montato");
  for (let i = 0; i < aTerra.length; i += 1) {
    for (let j = i + 1; j < aTerra.length; j += 1) scansa(aTerra[i], aTerra[j], FRA_LORO, true);
    if (eroe && !montato()) scansa(aTerra[i], eroe, ADDOSSO, false);
  }
}

// --- la mezzanotte ------------------------------------------------------------

// Al sicuro vuol dire dentro un recinto col cancello chiuso, o dentro una
// stanza murata con la porta chiusa. Con te — in sella o alla corda — è al
// sicuro ovunque: i banditi rubano i cavalli lasciati, non quelli cavalcati.
export function alSicuro(c) {
  if (c.stato !== "libero") return true;
  const tx = Math.floor(c.px / schermo.TASSELLO);
  const ty = Math.floor(c.py / schermo.TASSELLO);
  return riparo.recintato(tx, ty) || riparo.murato(tx, ty);
}

// Prima i banditi, poi la cena, poi il freddo (W0.8). Restituisce quanti ne
// hanno rubati, quanti hanno fame o freddo stamattina, e quanti se ne sono
// andati per la fame o per il freddo.
export function nuovoGiorno(stagione = stagioni.stagioneCorrente()) {
  const esito = { rubati: 0, affamati: 0, scappati: 0, infreddoliti: 0, scappatiDalFreddo: 0 };
  for (let i = cavalli.length - 1; i >= 0; i -= 1) {
    if (alSicuro(cavalli[i])) continue;
    cavalli.splice(i, 1);
    esito.rubati += 1;
  }

  // Chi ha mangiato: imboccato oggi; alla corda o in sella, al pascolo lungo
  // la strada se è la stagione; libero in un recinto, dal prato e poi dalla
  // mangiatoia — un recinto per volta, perché è lì che si divide il cibo. E
  // da W0.8 libero in una stalla, dalla sua mangiatoia.
  const sfamati = new Set(cavalli.filter((c) => c.pasto));
  if (siPascola(stagione)) {
    for (const c of cavalli) if (c.stato !== "libero") sfamati.add(c);
  }
  const visti = new Set();
  for (const c of cavalli) {
    if (c.stato !== "libero" || visti.has(c)) continue;
    const { tx, ty } = tassello(c);
    const recinto = mangiatoiaDi(tx, ty);
    if (!recinto) { visti.add(c); continue; }
    const dentro = dentroIl(recinto);
    const qui = cavalli.filter((k) => k.stato === "libero" && dentro(k));
    for (const k of qui) visti.add(k);
    const mangiatoie = recinto.pareti.filter((t) => mappa.oggettoDi(t.tx, t.ty) === OGGETTO.MANGIATOIA);
    let prato = sfamaIlPrato(recinto, stagione);
    for (const k of qui) {
      if (sfamati.has(k)) continue;
      if (prato > 0) {
        prato -= 1;
        sfamati.add(k);
        continue;
      }
      // Dalla mangiatoia più piena: con due mangiatoie si vuotano insieme.
      const piena = mangiatoie.filter((t) => razioniNella(t.tx, t.ty) > 0)
        .sort((a, b) => razioniNella(b.tx, b.ty) - razioniNella(a.tx, a.ty))[0];
      if (!piena) continue;
      togliRazione(piena.tx, piena.ty);
      sfamati.add(k);
    }
  }

  // Chi ha passato la notte al freddo: d'autunno e d'inverno, fuori dalla
  // stalla e lontano da un fuoco. Dove sta adesso, a mezzanotte, qualunque
  // cosa faccia — in sella il cavallo sta dove sei tu.
  const gelati = new Set(siGelaLaNotte(stagione) ? cavalli.filter((c) => !alCaldo(c)) : []);

  for (let i = cavalli.length - 1; i >= 0; i -= 1) {
    const c = cavalli[i];
    c.pasto = false;
    c.fame = sfamati.has(c) ? 0 : c.fame + 1;
    c.freddo = gelati.has(c) ? c.freddo + 1 : 0;
    // Se ne va, anche da sotto di te: rompe la corda o ti disarciona. Chi
    // orchestra deve accorgersene, perché la figura in sella sparisce. La
    // fame si dice per prima: di due ragioni, è quella che ha già un rimedio
    // in tasca.
    if (c.fame >= GIORNI_DI_FAME || c.freddo >= NOTTI_DI_FREDDO) {
      cavalli.splice(i, 1);
      if (c.fame >= GIORNI_DI_FAME) esito.scappati += 1;
      else esito.scappatiDalFreddo += 1;
      continue;
    }
    if (c.fame > 0) esito.affamati += 1;
    if (c.freddo > 0) esito.infreddoliti += 1;
  }
  return esito;
}

// --- salvataggio ------------------------------------------------------------

const CAMPI = ["px", "py", "stato", "destra", "passo", "seme", "giro", "dx", "dy", "fame", "fiato", "pasto", "sfiancato", "freddo"];
const STATI = ["libero", "legato", "montato"];

export function istantanea() {
  return { cavalli: cavalli.map((c) => Object.fromEntries(CAMPI.map((k) => [k, c[k]]))) };
}

export function ripristina(dati) {
  reimposta();
  if (!dati) return;
  // I cavalli salvati in W0.6 non sanno cos'è la fame: sazi e freschi. Quelli
  // di W0.7 non sanno cos'è il freddo: al caldo.
  for (const c of dati.cavalli) cavalli.push({ fame: 0, fiato: 1, pasto: false, sfiancato: false, freddo: 0, ...c });
}

export function statoValido(dati) {
  const numero = (n, a, b) => Number.isFinite(n) && n >= a && n <= b;
  if (!dati || !Array.isArray(dati.cavalli) || dati.cavalli.length > MASSIMI) return false;
  if (dati.cavalli.filter((c) => c?.stato === "montato").length > 1) return false;
  return dati.cavalli.every((c) => c && STATI.includes(c.stato)
    && numero(c.px, -1e9, 1e9) && numero(c.py, -1e9, 1e9)
    && typeof c.destra === "boolean" && numero(c.passo, 0, 1e12)
    && Number.isSafeInteger(c.seme) && c.seme >= 0 && c.seme <= 4294967295
    && numero(c.giro, -1, 6) && numero(c.dx, -1, 1) && numero(c.dy, -1, 1)
    && (c.fame === undefined || (Number.isSafeInteger(c.fame) && c.fame >= 0 && c.fame < GIORNI_DI_FAME))
    && (c.fiato === undefined || numero(c.fiato, 0, 1))
    && (c.pasto === undefined || typeof c.pasto === "boolean")
    && (c.sfiancato === undefined || typeof c.sfiancato === "boolean")
    && (c.freddo === undefined || (Number.isSafeInteger(c.freddo) && c.freddo >= 0 && c.freddo < NOTTI_DI_FREDDO)));
}

// --- disegno ------------------------------------------------------------------

// Quelli a terra; quello montato lo disegna chi lo cavalca (vedi
// giocatore.js). Il disegno guarda a destra, e a sinistra si riflette.
export function daDisegnare() {
  const disegnati = [];
  for (const c of cavalli) {
    if (c.stato === "montato") continue;
    const cotto = cuoci(SELLATO[Math.floor(c.passo) % 2]);
    c.sprite = c.destra ? cotto : riflesso(cotto);
    c.x = c.px - c.sprite.width / 2;
    c.y = c.py - c.sprite.height;
    c.base = c.py;
    c.collo = {
      x: c.x + (c.destra ? COLLO.x : c.sprite.width - COLLO.x - 1),
      y: c.y + COLLO.y,
    };
    disegnati.push(c);
  }
  return disegnati;
}

// Le corde da disegnare: dalla mano di chi conduce al collo di ogni cavallo
// legato. Da chiamare dopo daDisegnare(), che sa dov'è il collo.
export function corde() {
  return cavalli.filter((c) => c.stato === "legato" && c.collo).map((c) => c.collo);
}

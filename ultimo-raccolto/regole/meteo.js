// Ogni giorno d'autunno e di primavera ha una possibilità su quattro di
// essere di pioggia, e ogni giorno d'inverno una su quattro di essere di neve
// (M7.18.58). In media resta un giorno di maltempo per stagione, ma con
// stagioni asciutte (una su tre, circa) e giorni di maltempo di fila.
//
// DA M7.18.59 IL TEMPO SI TIRA DAVVERO, giorno per giorno. Prima era
// un'impronta del giorno e del seme: il meteo di tutta la partita era scritto
// nella valle dal primo momento. Adesso un giorno si estrae a caso la prima
// volta che qualcuno lo chiede — in pratica la vigilia, quando l'HUD chiede
// "domani" per l'annuncio — e da lì resta quello: si annota nel registro, e
// il registro va nel salvataggio. Così l'annuncio del giorno prima resta vero,
// ricaricare non cambia il tempo, e quello che guarda indietro (la neve
// posata ieri, i giorni asciutti dell'essiccatoio) trova quello che è
// successo davvero.
//
// L'estate è invece arida per tutti e quattro i giorni, e da M7.18.60 ogni
// giorno d'estate ha una possibilità su quattro di essere di canicola (prima
// era uno solo, dal secondo al quarto): vale come arido, e in più le piante
// non innaffiate quel giorno seccano la notte stessa (vedi orto.js). Si
// annuncia il giorno prima, come la pioggia. E metà dei giorni di pioggia sono temporali, tirati insieme a
// loro.
import * as tempo from "./tempo.js";
import * as stagioni from "./stagioni.js";
import * as mappa from "../mondo/mappa.js";
import * as modifiche from "../mondo/modifiche.js";
import { OGGETTO } from "../mondo/generazione.js";
import { TASSELLO } from "../motore/schermo.js";
import * as riparo from "./riparo.js";
import * as addosso from "./addosso.js";
import * as orto from "./orto.js";

// Il caso vero, come per gli orti di una partita nuova: crypto e non
// Math.random, che in questo gioco non esiste. I collaudi ne mettono uno
// seminato, per essere ripetibili.
function casoVero() {
  const numero = new Uint32Array(1);
  globalThis.crypto.getRandomValues(numero);
  return numero[0] / 4294967296;
}
let caso = casoVero;
export function impostaCaso(funzione = null) { caso = funzione ?? casoVero; }

// giorno -> { e: evento, t: temporale }
const registro = new Map();
export const EVENTI = ["sereno", "pioggia", "neve", "arido", "canicola"];
export const PROBABILITA_TEMPORALE = 0.5;

function tira(giorno) {
  const stagione = stagioni.stagioneDi(giorno);
  // D'estate non piove mai: il giorno è arido, e una volta su quattro è
  // canicola (M7.18.60), con la stessa probabilità della pioggia e della neve.
  if (stagione === "estate") {
    registro.set(giorno, { e: caso() < PROBABILITA_MALTEMPO ? "canicola" : "arido", t: false });
    return;
  }
  if (caso() >= PROBABILITA_MALTEMPO) { registro.set(giorno, { e: "sereno", t: false }); return; }
  if (stagione === "inverno") { registro.set(giorno, { e: "neve", t: false }); return; }
  registro.set(giorno, { e: "pioggia", t: caso() < PROBABILITA_TEMPORALE });
}

// Prima del primo giorno non c'è stato tempo: sereno, e non si scrive. La
// neve sul terreno e l'orto guardano "ieri", e il primo giorno
// ieri è il giorno 0: tirarlo e scriverlo metteva nel registro un giorno che
// registroValido rifiutava, e da M7.18.59 ogni partita salvata dal primo
// giorno in poi non si ricaricava più (corretto in M7.18.64).
export function evento(giorno = tempo.giornoCorrente()) {
  if (giorno < 1) return "sereno";
  if (!registro.has(giorno)) tira(giorno);
  return registro.get(giorno).e;
}

// Un giorno di pioggia che è un temporale: lo disegna il cielo, coi lampi.
export function temporale(giorno = tempo.giornoCorrente()) {
  return evento(giorno) === "pioggia" && Boolean(registro.get(giorno)?.t);
}

// Il registro per il salvataggio: [giorno, evento, temporale].
export function registroDelTempo() {
  return [...registro].map(([g, v]) => [g, v.e, v.t ? 1 : 0]);
}

export function registroValido(elenco) {
  return Array.isArray(elenco) && elenco.length <= 100000 && elenco.every((r) =>
    Array.isArray(r) && r.length === 3 && Number.isInteger(r[0]) && r[0] >= 0 && EVENTI.includes(r[1]) && (r[2] === 0 || r[2] === 1));
}

// Un salvataggio di prima non ce l'ha: i giorni si tirano quando servono.
export function ripristinaRegistro(elenco) {
  registro.clear();
  if (!registroValido(elenco)) return;
  // Il giorno 0 dei salvataggi scritti fra M7.18.59 e M7.18.63 si accetta
  // e si lascia cadere: non è mai esistito.
  for (const [g, e, t] of elenco) if (g >= 1) registro.set(g, { e, t: t === 1 });
}

// Il tempo di un giorno deciso a mano: per i collaudi e la diagnostica.
export function fissa(giorno, e, temporale = false) {
  if (!EVENTI.includes(e)) throw new Error("evento sconosciuto: " + e);
  registro.set(giorno, { e, t: e === "pioggia" && temporale });
}

// Una partita nuova: niente è ancora successo.
export function dimenticaIlTempo() {
  registro.clear();
}

// Una possibilità su quattro, per giorno, d'autunno, d'inverno e di primavera.
export const PROBABILITA_MALTEMPO = 0.25;

// Arido o canicola: la canicola è un giorno arido più cattivo, e tutto quello
// che guarda l'arido deve guardare anche lei.
export function arido(giorno = tempo.giornoCorrente()) {
  const e = evento(giorno);
  return e === "arido" || e === "canicola";
}

let bagnato = 0;
let revisione = -1, seme = null;
const coperture = new Map();
function aggiornaCoperture() {
  const r = modifiche.revisione(), s = mappa.semeCorrente().nome;
  if (r === revisione && s === seme && coperture.size < 4096) return;
  revisione = r; seme = s; coperture.clear();
}

// Per i tasselli calpestabili: la stanza chiusa rappresenta la copertura.
export function coperto(tx, ty) {
  aggiornaCoperture();
  const k = `${tx},${ty}`;
  if (coperture.has(k)) return coperture.get(k);
  const stanza = riparo.stanzaDi(tx, ty);
  if (stanza) for (const t of stanza) coperture.set(`${t.tx},${t.ty}`, true);
  else coperture.set(k, false);
  return stanza !== null;
}

// Sotto la chioma.
//
// Il riparo debole, e serviva perché quello forte — la stanza chiusa — sta
// sempre a casa, mentre la pioggia ti prende dove sei. Misurato: fermo
// all'aperto ci si bagnava in dieci secondi e si moriva in centouno, senza
// aver fatto niente di sbagliato, e l'unica risposta era una stanza costruita
// prima. Il bosco è la risposta che la valle ha già.
//
// Due alberi fra gli otto vicini e non uno: un albero solo in mezzo a un prato
// non è un riparo, una macchia sì. Misurato su un quadrato di 241 tasselli
// attorno alla fattoria — con due, il 16,6 per cento della valle calpestabile
// ripara, e la macchia più vicina a casa sta a tre tasselli. Con uno sarebbe
// stato il 28,7: quasi un terzo della valle è troppo, la pioggia smetterebbe
// di essere una cosa a cui si reagisce.
const VICINI_CHIOMA = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
const ALBERI_PER_CHIOMA = 2;

export function sottoLaChioma(tx, ty) {
  let alberi = 0;
  for (const [dx, dy] of VICINI_CHIOMA) {
    if (mappa.oggettoDi(tx + dx, ty + dy) !== OGGETTO.ALBERO) continue;
    alberi += 1;
    if (alberi >= ALBERI_PER_CHIOMA) return true;
  }
  return false;
}

// Dove la pioggia non arriva sul fuoco: è il predicato del fuoco, sia per
// spegnerlo sia per accenderlo — sotto un albero il falò si accende e non si
// spegne. Non è quello del bagnarsi, che sotto la chioma rallenta invece di
// fermarsi: una macchia non è un tetto.
//
// Un fuoco acceso è solido e non appartiene al pavimento, e il focolare lo è
// sempre: deve affacciare su una stanza — o stare sotto una chioma, che invece
// lo copre dove sta. Chiedere la stanza al suo tassello vorrebbe dire
// allagare partendo da dentro una parete, cioè sentirsi dire "all'aperto".
export function fuocoCoperto(tx, ty) {
  return sottoLaChioma(tx, ty) || [[1,0],[-1,0],[0,1],[0,-1]].some(([x,y]) => coperto(tx+x,ty+y));
}

let mondoRivisto = -1, giornoRivisto = -1, semeRivisto = null;
export function aggiornaMondo() {
  if (evento() !== "pioggia") return { innaffiate: 0, spenti: 0 };
  const r = modifiche.revisione(), giorno = tempo.giornoCorrente(), s = mappa.semeCorrente().nome;
  if (r === mondoRivisto && giorno === giornoRivisto && s === semeRivisto) return { innaffiate: 0, spenti: 0 };
  const cambi = [];
  let innaffiate = 0, spenti = 0;
  modifiche.perOgnuno((tx, ty, c) => {
    if (orto.siPuoInnaffiare(c.oggetto) && !c.bagnato && !coperto(tx,ty)) {
      cambi.push({tx,ty,c:orto.bagna(c)});innaffiate++;
    }
    // La pioggia spegne, e quello che c'era dentro se n'è andato in fumo: la
    // legna non si riprende, altrimenti accendere sotto l'acqua costerebbe
    // soltanto il fastidio di riaccendere. È il prezzo che rende una chioma o
    // un tetto una scelta invece di un dettaglio.
    if (c.oggetto === OGGETTO.FALO_ACCESO && !fuocoCoperto(tx,ty)) {
      const {legna, ...resto} = c;
      cambi.push({tx,ty,c:{...resto,oggetto:OGGETTO.FALO_SPENTO}});spenti++;
    }
  });
  for (const {tx,ty,c} of cambi) mappa.cambiaTassello(tx,ty,c);
  mondoRivisto = modifiche.revisione(); giornoRivisto = giorno; semeRivisto = s;
  return { innaffiate, spenti };
}

export function alRiparo(eroe) {
  return coperto(Math.floor(eroe.px/TASSELLO), Math.floor(eroe.py/TASSELLO));
}

// Quanto ripara la chioma: un quarto della pioggia addosso. Fradici in ottanta
// secondi invece che in venti, che è il tempo per accendere un fuoco e starci
// accanto — cioè il tempo per fare qualcosa invece di guardare una barra.
//
// Un quarto e non zero, e la differenza è tutta la regola: una macchia non è
// un tetto. Sotto gli alberi la pioggia rallenta, dentro una stanza si ferma,
// e resta un motivo per costruirsi una casa.
const CHIOMA = 0.25;

function ritmo(eroe) {
  if (!eroe) return 0;
  if (bagnato === 0 && evento() !== "pioggia") return 0;
  const tx=Math.floor(eroe.px/TASSELLO),ty=Math.floor(eroe.py/TASSELLO);
  const dentro=alRiparo(eroe);
  const alFuoco = mappa.fuocoVicino(tx,ty,3) || (dentro && riparo.caldaDentro(riparo.stanzaDi(tx,ty)));
  // Diciotto secondi invece di dieci per diventare zuppi: una decina di
  // tasselli, cioè la distanza da cui l'accampamento è ancora raggiungibile
  // quando cominci a bagnarti. Non toglie la pioggia dal gioco, dà il tempo di
  // reagirci. L'asciugatura invece non cambia: sarebbe un secondo premio per
  // un prezzo solo, e su una scala che il giocatore non può osservare.
  if (evento()==="pioggia" && !dentro) {
    const presa = (1/20) * (addosso.dati()?.pioggia ?? 1) * (sottoLaChioma(tx,ty) ? CHIOMA : 1);
    // Un fuoco acceso asciuga più in fretta di quanto la chioma lasci passare,
    // ed è il gesto che questa tappa vuole rendere possibile: sotto un albero
    // si accampa, si accende, ci si asciuga. All'aperto il conto lo si fa lo
    // stesso, ma lì un falò sotto la pioggia si spegne da solo.
    return alFuoco ? presa - 1/10 : presa;
  }
  if (alFuoco) return -1/10;
  return dentro ? -1/40 : -1/80;
}

// Quanto manca a una soglia che cambia le regole, perché la simulazione non ci
// passi sopra con un passo solo. Sono due: a metà la pelliccia smette di
// attutire, e a uno si è fradici — ed è da lì che il bagnato fa male.
const SOGLIE = [0.5, 1];

export function secondiAlCambio(eroe) {
  const r=ritmo(eroe);
  if (r===0) return Infinity;
  let minimo=Infinity;
  for (const soglia of SOGLIE) {
    if (r>0 && bagnato<soglia) minimo=Math.min(minimo,(soglia-bagnato)/r);
    if (r<0 && bagnato>=soglia) minimo=Math.min(minimo,Math.max(1e-8,(bagnato-soglia)/-r));
  }
  return minimo;
}

export function avanza(secondi, eroe) {
  if (!(secondi>0) || !Number.isFinite(secondi)) return;
  const r=ritmo(eroe);
  bagnato=Math.max(0,Math.min(1,bagnato+r*secondi));
  if (r<0 && Math.abs(bagnato-0.5)<1e-9) bagnato=0.5-1e-9;
  if (r>0 && Math.abs(bagnato-0.5)<1e-9) bagnato=0.5;
}

export function livelloBagnato() { return bagnato; }
export function zuppo() { return bagnato>=0.5; }

// Fradicio: la soglia da cui il bagnato comincia a far male. Zuppo non basta
// più, ed è la correzione che toglie la morte stupida — fra i dieci secondi in
// cui ci si bagna e i venti in cui si è fradici c'è il tempo di accorgersene e
// di andare da qualche parte.
export function fradicio() { return bagnato>=1; }
export function fattoreVelocita(eroe) { return evento()==="neve" && !alRiparo(eroe) ? 0.72 : 1; }
export function ripristina(valore=0) {
  bagnato=Number.isFinite(valore)?Math.max(0,Math.min(1,valore)):0;
  mondoRivisto=-1;giornoRivisto=-1;semeRivisto=null;revisione=-1;coperture.clear();
}
export function reimposta() { ripristina(); }

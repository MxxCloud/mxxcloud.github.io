// Un giorno di maltempo per stagione, stabile per valle e anno: ricaricare
// non cambia le previsioni. L'estate è invece arida per tutti e quattro i giorni.
import * as tempo from "./tempo.js";
import * as stagioni from "./stagioni.js";
import * as mappa from "../mondo/mappa.js";
import * as modifiche from "../mondo/modifiche.js";
import { OGGETTO } from "../mondo/generazione.js";
import { impronta } from "../motore/casuale.js";
import { TASSELLO } from "../motore/schermo.js";
import * as riparo from "./riparo.js";
import * as addosso from "./addosso.js";
import * as orto from "./orto.js";

export function evento(giorno = tempo.giornoCorrente()) {
  const stagione = stagioni.stagioneDi(giorno);
  if (stagione === "estate") return "arido";
  const durata = stagioni.GIORNI_PER_STAGIONE;
  const periodo = Math.floor((giorno-1)/durata);
  const scelto = 2 + Math.floor(impronta(periodo, 0, mappa.semeCorrente().valore ^ 0x71ae0) * (durata-2));
  if (stagioni.giornoNellaStagione(giorno) !== scelto) return "sereno";
  return stagione === "inverno" ? "neve" : "pioggia";
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

// Dove la pioggia non arriva addosso: la stanza chiusa, oppure la chioma. È il
// predicato del fuoco — sotto un albero il falò si accende e non si spegne —
// e non quello del bagnarsi, che sotto la chioma rallenta invece di fermarsi:
// una macchia non è un tetto.
export function riparatoDallaPioggia(tx, ty) {
  return coperto(tx, ty) || sottoLaChioma(tx, ty);
}

// Un falò è solido e non appartiene al pavimento: deve affacciare su una
// stanza — o stare sotto una chioma, che invece lo copre dove sta.
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

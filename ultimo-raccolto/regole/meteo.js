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

// Un falò è solido e non appartiene al pavimento: deve affacciare su una stanza.
export function fuocoCoperto(tx, ty) {
  return [[1,0],[-1,0],[0,1],[0,-1]].some(([x,y]) => coperto(tx+x,ty+y));
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
      cambi.push({tx,ty,c:{...c,bagnato:true}});innaffiate++;
    }
    if (c.oggetto === OGGETTO.FALO_ACCESO && !fuocoCoperto(tx,ty)) {
      cambi.push({tx,ty,c:{...c,oggetto:OGGETTO.FALO_SPENTO}});spenti++;
    }
  });
  for (const {tx,ty,c} of cambi) mappa.cambiaTassello(tx,ty,c);
  mondoRivisto = modifiche.revisione(); giornoRivisto = giorno; semeRivisto = s;
  return { innaffiate, spenti };
}

export function alRiparo(eroe) {
  return coperto(Math.floor(eroe.px/TASSELLO), Math.floor(eroe.py/TASSELLO));
}

function ritmo(eroe) {
  if (!eroe) return 0;
  if (bagnato === 0 && evento() !== "pioggia") return 0;
  const tx=Math.floor(eroe.px/TASSELLO),ty=Math.floor(eroe.py/TASSELLO);
  const dentro=alRiparo(eroe);
  if (evento()==="pioggia" && !dentro) return 1/20;
  if (mappa.luceVicina(tx,ty,3) || (dentro && riparo.caldaDentro(riparo.stanzaDi(tx,ty)))) return -1/10;
  return dentro ? -1/40 : -1/80;
}

export function secondiAlCambio(eroe) {
  const r=ritmo(eroe);
  if (r>0 && bagnato<0.5) return (0.5-bagnato)/r;
  if (r<0 && bagnato>=0.5) return Math.max(1e-8,(bagnato-0.5)/-r);
  return Infinity;
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
export function fattoreVelocita(eroe) { return evento()==="neve" && !alRiparo(eroe) ? 0.72 : 1; }
export function ripristina(valore=0) {
  bagnato=Number.isFinite(valore)?Math.max(0,Math.min(1,valore)):0;
  mondoRivisto=-1;giornoRivisto=-1;semeRivisto=null;revisione=-1;coperture.clear();
}
export function reimposta() { ripristina(); }

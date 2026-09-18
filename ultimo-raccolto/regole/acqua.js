// La stagione cambia il passaggio, non la generazione della valle.
import * as mappa from "../mondo/mappa.js";
import { TERRENO } from "../mondo/generazione.js";
import * as stagioni from "./stagioni.js";
import * as urti from "../entita/urti.js";
import { TASSELLO } from "../motore/schermo.js";

function acquatico(tx, ty) {
  const t = mappa.terrenoNaturaleDi(tx, ty);
  return t === TERRENO.ACQUA || t === TERRENO.ACQUA_BASSA;
}

function toccaAcqua(e) {
  for (const x of [e.px-urti.LARGHEZZA/2, e.px+urti.LARGHEZZA/2-0.001])
    for (const y of [e.py-urti.ALTEZZA, e.py-0.001])
      if (acquatico(Math.floor(x/TASSELLO),Math.floor(y/TASSELLO))) return true;
  return false;
}

function rivaVicino(tx, ty, limite) {
  // Anelli: la prima distanza utile vince. Ricerca limitata anche nei salvataggi anomali.
  for (let r=0;r<=limite;r++) {
    for (let y=-r;y<=r;y++) for (let x=-r;x<=r;x += Math.abs(y) === r ? 1 : Math.max(1,2*r)) {
      if (acquatico(tx+x,ty+y)) continue;
      const p = { px:(tx+x+0.5)*TASSELLO, py:(ty+y+0.75)*TASSELLO };
      if (urti.liberoIn(p.px,p.py)) return p;
    }
  }
  return null;
}

// Anche al caricamento: un salvataggio sul ghiaccio non deve intrappolare chi torna.
// Non si aggiunge una morte istantanea al cambio di stagione: il disgelo riporta a riva.
export function aggiorna(persone = []) {
  const gelo = stagioni.stagioneCorrente() === "inverno";
  const cambiato = mappa.impostaGelo(gelo);
  const riportati = [];
  if (!gelo) for (const e of persone) {
    if (!toccaAcqua(e) || urti.liberoIn(e.px,e.py)) continue;
    const tx=Math.floor(e.px/TASSELLO), ty=Math.floor(e.py/TASSELLO);
    const fattoria=mappa.laFattoria();
    const riva=rivaVicino(tx,ty,64) ?? rivaVicino(fattoria.tx,fattoria.ty,64);
    if (riva) { Object.assign(e,riva); e.inMovimento=false; riportati.push(e); }
  }
  return { cambiato, riportati };
}

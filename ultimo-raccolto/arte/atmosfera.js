// Precipitazioni leggere, senza immagini esterne e senza coprire la stanza.
//
// Da M7.18.55 anche il resto del cielo che si vede: la pioggia inclinata dal
// vento con gli schizzi e i cerchi sull'acqua, il cielo coperto, la neve che
// si posa per terra, la foschia dell'alba e il lampo. Quando e quanto lo dice
// regole/cielo.js; qui si disegna e basta. Tutto il nuovo si spegne col
// tasto L come gli altri effetti; gocce e fiocchi restano, come prima.
import { LARGHEZZA, ALTEZZA, TASSELLO, inquadratura } from "../motore/schermo.js";
import { impronta } from "../motore/casuale.js";
import { cuoci } from "./sprite.js";

const modulo = (n, m) => ((n % m) + m) % m;

// I tasselli dove non piove e non nevica: la stanza, con le sue pareti e gli
// arredi solidi che delimitano il pavimento coperto.
export function tasselliCoperti(stanza) {
  const coperti = new Set((stanza ?? []).map(t => `${t.tx},${t.ty}`));
  for (const t of stanza ?? []) for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])
    coperti.add(`${t.tx+dx},${t.ty+dy}`);
  return coperti;
}

// La neve scende inclinata di un pixel ogni quattro, sempre verso est: il
// vento non la sposta, perché un fiocco che cambia strada a ogni raffica si
// legge come tempesta.
export const PENDENZA_NEVE = 0.25;

// "aria" è il vento (effetti.vento): la pioggia si piega con lui. "eAcqua" e
// "effetti" servono agli schizzi e ai cerchi, che ci sono solo a effetti
// accesi.
export function disegna(p, evento, secondi, stanza = null, { aria = 0, eAcqua = null, effetti = false } = {}) {
  if (evento !== "pioggia" && evento !== "neve") return;
  const neve = evento === "neve", q = inquadratura();
  const coperti = tasselliCoperti(stanza);
  const coperto = (x, y) => coperti.has(`${Math.floor((x+q.sinistra)/TASSELLO)},${Math.floor((y+q.sopra)/TASSELLO)}`);
  p.save();
  p.fillStyle = neve ? "#e6eef1" : "#91b9cc";
  if (neve) {
    // Come la pioggia (M7.18.56.2), ma lenta: due piani, i fiocchi lontani
    // piccoli e tenui, i vicini più grandi e più svelti, e tutti scendono in
    // diagonale sempre dalla stessa parte. Prima il vento, che cambia a ogni
    // raffica, moltiplicava il tempo di gioco: i fiocchi scattavano a destra e
    // a sinistra e sembrava sempre bufera.
    for (const [n, alfa, velocita, sale, grande] of [[50, 0.55, 11, 31, 0], [40, 0.85, 19, 79, 3]]) {
      p.globalAlpha = alfa;
      for (let i = 0; i < n; i++) {
        const y = Math.floor(modulo(i*47 + sale + secondi*velocita - q.sopra, ALTEZZA));
        const x = Math.floor(modulo(i*sale + secondi*velocita*PENDENZA_NEVE - q.sinistra, LARGHEZZA));
        if (coperto(x, y)) continue;
        const lato = grande && i % grande === 0 ? 2 : 1;
        p.fillRect(x, y, lato, lato);
      }
    }
  } else {
    // Due piani: le gocce lontane corte e tenui, le vicine lunghe. Il vento
    // le inclina: un pixel di lato ogni tanti che scendono.
    const pendenza = Math.min(0.6, 0.15 + aria * 0.22);
    for (const [n, lunga, alfa, velocita, sale] of [[45, 3, 0.35, 90, 31], [40, 5, 0.6, 130, 79]]) {
      p.globalAlpha = alfa;
      for (let i = 0; i < n; i++) {
        const y = Math.floor(modulo(i*47 + sale + secondi*velocita - q.sopra, ALTEZZA));
        const x = Math.floor(modulo(i*sale + secondi*velocita*pendenza - q.sinistra, LARGHEZZA));
        if (coperto(x, y)) continue;
        for (let k = 0; k < lunga; k++) p.fillRect(x - Math.round(k * pendenza), y - k, 1, 1);
      }
    }
    if (effetti) {
      p.globalAlpha = 0.55;
      for (const s of schizzi(q, secondi, eAcqua)) {
        if (coperto(s.x - q.sinistra, s.y - q.sopra)) continue;
        const x = s.x - q.sinistra, y = s.y - q.sopra;
        p.fillRect(x, y, 1, 1);
        if (s.fase > 0.3) { p.fillRect(x - 1, y - 1, 1, 1); p.fillRect(x + 1, y - 1, 1, 1); }
      }
      p.fillStyle = "#b9d4de";
      for (const c of cerchi(q, secondi, eAcqua)) {
        const x = c.x - q.sinistra, y = c.y - q.sopra, r = c.raggio;
        p.globalAlpha = 0.5 * (1 - c.fase);
        p.fillRect(x - r, y, 1, 1); p.fillRect(x + r, y, 1, 1);
        p.fillRect(x, y - Math.ceil(r / 2), 1, 1); p.fillRect(x, y + Math.ceil(r / 2), 1, 1);
        if (r >= 3) { p.fillRect(x - r + 1, y - 1, 1, 1); p.fillRect(x + r - 1, y - 1, 1, 1); p.fillRect(x - r + 1, y + 1, 1, 1); p.fillRect(x + r - 1, y + 1, 1, 1); }
      }
    }
  }
  p.restore();
}

// Gli schizzi: una trentina in vista, ognuno dura un quinto di secondo, dove
// batte la pioggia e non sull'acqua (lì ci sono i cerchi). In coordinate del
// mondo.
export function schizzi(q, secondi, eAcqua = null) {
  const giro = Math.floor(secondi * 5), fase = secondi * 5 - giro;
  const trovati = [];
  for (let i = 0; i < 30; i++) {
    const x = q.sinistra + Math.floor(impronta(i, giro, 0x5c1) * (q.destra - q.sinistra));
    const y = q.sopra + Math.floor(impronta(giro, i, 0x5c2) * (q.sotto - q.sopra));
    if (eAcqua && eAcqua(Math.floor(x / TASSELLO), Math.floor(y / TASSELLO))) continue;
    trovati.push({ x, y, fase });
  }
  return trovati;
}

// I cerchi sull'acqua: ogni tassello d'acqua ha il suo giro di un secondo e
// mezzo, e in uno su dieci nasce un anello che si allarga e si spegne.
export function cerchi(q, secondi, eAcqua = null) {
  if (!eAcqua) return [];
  const trovati = [];
  for (let ty = Math.floor(q.sopra / TASSELLO); ty <= Math.floor((q.sotto - 1) / TASSELLO); ty++) {
    for (let tx = Math.floor(q.sinistra / TASSELLO); tx <= Math.floor((q.destra - 1) / TASSELLO); tx++) {
      const t = secondi / 1.5 + impronta(tx, ty, 0xc1c);
      const giro = Math.floor(t);
      if (impronta(tx, ty, giro) > 0.1) continue;
      if (!eAcqua(tx, ty)) continue;
      const fase = t - giro;
      trovati.push({
        x: tx * TASSELLO + 3 + Math.floor(impronta(tx, giro, 0xc1d) * 10),
        y: ty * TASSELLO + 3 + Math.floor(impronta(giro, ty, 0xc1e) * 10),
        raggio: 1 + Math.floor(fase * 4), fase,
      });
    }
  }
  return trovati;
}

// --- il cielo coperto -------------------------------------------------------

// Un velo grigio-azzurro leggero, di giorno: toglie un po' di sole ai colori
// senza fare notte.
export function disegnaCieloCoperto(p, forza) {
  if (forza <= 0) return;
  p.save();
  p.globalAlpha = 0.14 * forza;
  p.fillStyle = "#6f7c86";
  p.fillRect(0, 0, LARGHEZZA, ALTEZZA);
  p.restore();
}

// --- la neve posata -----------------------------------------------------------

// La neve non cade a macchie per tassello: si posa a chiazze che passano da un
// tassello all'altro. Un rumore liscio sul mondo (due ottave, a maglie di otto
// e di tre pixel) dice dove si posa prima; col crescere della neve la soglia
// sale e le chiazze si allargano e si uniscono. Anche piena non copre tutto:
// fra le chiazze resta l'erba, e il terreno si legge ancora.
const MAGLIA_NEVE = 8;
const COPRE_AL_MASSIMO = 0.52;
const liscio = (t) => t * t * (3 - 2 * t);
function rumore(x, y, maglia, sale) {
  const gx = Math.floor(x / maglia), gy = Math.floor(y / maglia);
  const fx = liscio(x / maglia - gx), fy = liscio(y / maglia - gy);
  const v = (i, j) => impronta(gx + i, gy + j, sale);
  return (v(0, 0) * (1 - fx) + v(1, 0) * fx) * (1 - fy) + (v(0, 1) * (1 - fx) + v(1, 1) * fx) * fy;
}
export function neveNelPunto(x, y) {
  return 0.72 * rumore(x, y, MAGLIA_NEVE, 0x5e1) + 0.28 * rumore(x, y, 3, 0x5e2);
}
export function innevato(x, y, quanta) {
  return quanta > 0 && neveNelPunto(x, y) < quanta * COPRE_AL_MASSIMO;
}

// Il disegno di un tassello con questa neve, fatto una volta e tenuto finché
// la neve non cambia gradino (sedici gradini dal nulla al pieno).
const GRADINI = 16;
let gradinoCotto = -1;
const tasselliCotti = new Map();
export function nevDelTassello(tx, ty, gradino) {
  if (gradino !== gradinoCotto) { tasselliCotti.clear(); gradinoCotto = gradino; }
  const chiave = `${tx},${ty}`;
  if (tasselliCotti.has(chiave)) return tasselliCotti.get(chiave);
  const quanta = gradino / GRADINI;
  const righe = [];
  let vuoto = true;
  for (let y = 0; y < TASSELLO; y++) {
    let r = "";
    for (let x = 0; x < TASSELLO; x++) {
      const wx = tx * TASSELLO + x, wy = ty * TASSELLO + y;
      if (!innevato(wx, wy, quanta)) { r += "."; continue; }
      vuoto = false;
      // Il bordo basso della chiazza ha un'ombra azzurrina.
      r += innevato(wx, wy + 1, quanta) ? "z" : "s";
    }
    righe.push(r);
  }
  const fatto = vuoto ? null : cuoci(righe);
  if (tasselliCotti.size > 2000) tasselliCotti.clear();
  tasselliCotti.set(chiave, fatto);
  return fatto;
}

// "copribile" dice se su quel tassello la neve si posa: erba, sterpaglia,
// terra, sabbia — non acqua, ghiaccio e roccia. "coperti" è la stanza.
export function disegnaNevePosata(p, quanta, copribile, coperti = new Set()) {
  if (quanta <= 0) return;
  const gradino = Math.max(1, Math.round(Math.min(1, quanta) * GRADINI));
  const q = inquadratura();
  for (let ty = Math.floor(q.sopra / TASSELLO); ty <= Math.floor((q.sotto - 1) / TASSELLO); ty++) {
    for (let tx = Math.floor(q.sinistra / TASSELLO); tx <= Math.floor((q.destra - 1) / TASSELLO); tx++) {
      if (coperti.has(`${tx},${ty}`) || !copribile(tx, ty)) continue;
      const img = nevDelTassello(tx, ty, gradino);
      if (img) p.drawImage(img, tx * TASSELLO - q.sinistra, ty * TASSELLO - q.sopra);
    }
  }
}

// --- la foschia ---------------------------------------------------------------

// Grandi fasce morbide, ferme rispetto al mondo e portate piano dal vento:
// camminando ci si passa dentro. Una per cella di 160×72 pixel del mondo.
const CELLA_X = 160, CELLA_Y = 72;
export function fasceDiFoschia(q, secondi, aria = 0.5) {
  const deriva = secondi * (2 + aria * 4);
  const fasce = [];
  for (let cy = Math.floor(q.sopra / CELLA_Y) - 1; cy <= Math.floor(q.sotto / CELLA_Y) + 1; cy++) {
    for (let cx = Math.floor((q.sinistra - deriva) / CELLA_X) - 1; cx <= Math.floor((q.destra - deriva) / CELLA_X) + 1; cx++) {
      fasce.push({
        x: (cx + impronta(cx, cy, 0xf05)) * CELLA_X + deriva,
        y: (cy + impronta(cy, cx, 0xf06)) * CELLA_Y,
        rx: 90 + impronta(cx, cy, 0xf07) * 70,
        ry: 18 + impronta(cx, cy, 0xf08) * 14,
        forza: 0.6 + 0.4 * impronta(cx, cy, 0xf09),
      });
    }
  }
  return fasce;
}

export function disegnaFoschia(p, secondi, quanta, aria = 0.5) {
  if (quanta <= 0) return;
  const q = inquadratura();
  p.save();
  for (const f of fasceDiFoschia(q, secondi, aria)) {
    const x = f.x - q.sinistra, y = f.y - q.sopra;
    if (x + f.rx < 0 || x - f.rx > LARGHEZZA || y + f.ry < 0 || y - f.ry > ALTEZZA) continue;
    p.setTransform(1, 0, 0, f.ry / f.rx, 0, y - y * f.ry / f.rx);
    const g = p.createRadialGradient(x, y, 0, x, y, f.rx);
    const a = 0.3 * quanta * f.forza;
    g.addColorStop(0, `rgb(214 220 222 / ${a})`);
    g.addColorStop(0.6, `rgb(214 220 222 / ${a * 0.55})`);
    g.addColorStop(1, "rgb(214 220 222 / 0)");
    p.fillStyle = g;
    p.fillRect(x - f.rx, y - f.rx, f.rx * 2, f.rx * 2);
  }
  p.restore();
}

// --- il lampo -----------------------------------------------------------------

// Sopra il buio, che nel frattempo si è ritirato (vedi disegnaBuio in
// gioco.js): un velo bianco leggero, perché il lampo illumina la valle e non
// la cancella.
export function disegnaLampo(p, forza) {
  if (forza <= 0) return;
  p.save();
  p.globalAlpha = Math.min(0.3, 0.22 * forza);
  p.fillStyle = "#eef2ff";
  p.fillRect(0, 0, LARGHEZZA, ALTEZZA);
  p.restore();
}

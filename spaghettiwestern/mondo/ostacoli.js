// Geometria condivisa da percezione e colpi. Anche i muri delle rovine
// contano; macerie e porte aperte lasciano passare vista e rumore.
import * as mappa from "./mappa.js";
import { OGGETTO } from "./generazione.js";
import { TASSELLO } from "../motore/schermo.js";

export function chiude(tx, ty) {
  const o = mappa.oggettoDi(tx, ty);
  return o === OGGETTO.MURO || o === OGGETTO.PORTA;
}

// Attraversamento della griglia, inclusi i due lati degli angoli esatti:
// non si vede né si colpisce attraverso una fessura diagonale di zero pixel.
export function paretiFra(a, b) {
  const ax = a.px / TASSELLO, ay = a.py / TASSELLO;
  const bx = b.px / TASSELLO, by = b.py / TASSELLO;
  if (![ax, ay, bx, by].every(Number.isFinite)) return Infinity;
  let x = Math.floor(ax), y = Math.floor(ay);
  const fineX = Math.floor(bx), fineY = Math.floor(by);
  const dx = bx - ax, dy = by - ay;
  const sx = Math.sign(dx), sy = Math.sign(dy);
  const passoX = dx === 0 ? Infinity : Math.abs(1 / dx);
  const passoY = dy === 0 ? Infinity : Math.abs(1 / dy);
  let prossimoX = dx === 0 ? Infinity : ((sx > 0 ? x + 1 : x) - ax) / dx;
  let prossimoY = dy === 0 ? Infinity : ((sy > 0 ? y + 1 : y) - ay) / dy;
  const contate = new Set();
  const conta = (tx, ty) => { if (chiude(tx, ty)) contate.add(`${tx},${ty}`); };
  conta(x, y);
  for (let i = 0; (x !== fineX || y !== fineY) && i < 2048; i++) {
    if (Math.abs(prossimoX - prossimoY) < 1e-10) {
      conta(x + sx, y); conta(x, y + sy);
      x += sx; y += sy; prossimoX += passoX; prossimoY += passoY;
    } else if (prossimoX < prossimoY) {
      x += sx; prossimoX += passoX;
    } else {
      y += sy; prossimoY += passoY;
    }
    conta(x, y);
  }
  return x === fineX && y === fineY ? contate.size : Infinity;
}

export function vistaLibera(a, b) { return paretiFra(a, b) === 0; }
export function fattoreSuono(a, b) { return Math.pow(0.35, paretiFra(a, b)); }

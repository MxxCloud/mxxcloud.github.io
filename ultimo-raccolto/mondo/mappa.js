// Mappa: catalogo dei tasselli, settori pre-disegnati, collisioni.
//
// Il mondo è infinito e calcolato (vedi generazione.js), ma ridisegnare 24x14
// tasselli pixel per pixel a ogni fotogramma sarebbe uno spreco: il terreno non
// cambia quasi mai. Quindi si lavora per settori di 16x16 tasselli, ognuno
// cotto una volta in un canvas da 256x256 e ridisegnato solo se qualcosa
// dentro di lui cambia. Ogni fotogramma copia i pochi settori inquadrati.

import * as schermo from "../motore/schermo.js";
import { impronta, semeDaTesto } from "../motore/casuale.js";
import { cuoci } from "../arte/sprite.js";
import * as terrenoArte from "../arte/sprite-terreno.js";
import * as oggettiArte from "../arte/sprite-oggetti.js";
import { TERRENO, OGGETTO, terrenoIn, oggettoIn } from "./generazione.js";

const { TASSELLO } = schermo;
export const SETTORE = 16;
const LATO_SETTORE = SETTORE * TASSELLO;

// --- cataloghi ------------------------------------------------------------

// L'acqua è l'unico terreno che ferma: la roccia è terreno sassoso, non parete.
// Quando arriveranno le pareti saranno oggetti, non tasselli di terreno.
const CATALOGO = {
  [TERRENO.ACQUA]: { varianti: terrenoArte.ACQUA, solido: true },
  [TERRENO.ACQUA_BASSA]: { varianti: terrenoArte.ACQUA_BASSA, solido: true },
  [TERRENO.SABBIA]: { varianti: terrenoArte.SABBIA, solido: false },
  [TERRENO.ERBA]: { varianti: terrenoArte.ERBA, solido: false },
  [TERRENO.STERPAGLIA]: { varianti: terrenoArte.STERPAGLIA, solido: false },
  [TERRENO.ROCCIA]: { varianti: terrenoArte.ROCCIA, solido: false },
  [TERRENO.TERRA]: { varianti: terrenoArte.TERRA, solido: false },
};

// Il cespuglio si attraversa: serve a sporcare la vista e a nascondere, non a
// bloccare. Alberi e sassi fermano, e fermano l'intero tassello — più preciso
// di così, a sedici pixel, il giocatore lo leggerebbe come un blocco casuale.
const CATALOGO_OGGETTI = {
  [OGGETTO.ALBERO]: { sprite: oggettiArte.ALBERO, solido: true },
  [OGGETTO.SASSO]: { sprite: oggettiArte.SASSO, solido: true },
  [OGGETTO.CESPUGLIO]: { sprite: oggettiArte.CESPUGLIO, solido: false },
};

// --- stato ----------------------------------------------------------------

let seme = 0;
let nomeSeme = "";
const settori = new Map();

export function inizializza(nome) {
  nomeSeme = nome;
  seme = semeDaTesto(nome);
  settori.clear();
}

export function semeCorrente() {
  return { nome: nomeSeme, valore: seme };
}

// --- interrogazione del mondo ---------------------------------------------

export function terrenoDi(tx, ty) {
  return terrenoIn(tx, ty, seme);
}

export function oggettoDi(tx, ty) {
  return oggettoIn(tx, ty, seme, terrenoIn(tx, ty, seme));
}

export function solidoIn(tx, ty) {
  const terreno = terrenoIn(tx, ty, seme);
  if (CATALOGO[terreno].solido) return true;
  const oggetto = oggettoIn(tx, ty, seme, terreno);
  return oggetto !== OGGETTO.NESSUNO && CATALOGO_OGGETTI[oggetto].solido;
}

// --- settori --------------------------------------------------------------

const chiave = (sx, sy) => `${sx},${sy}`;

function cuociSettore(sx, sy) {
  const canvas = document.createElement("canvas");
  canvas.width = LATO_SETTORE;
  canvas.height = LATO_SETTORE;
  const pennello = canvas.getContext("2d");
  pennello.imageSmoothingEnabled = false;

  const oggetti = [];

  for (let y = 0; y < SETTORE; y += 1) {
    for (let x = 0; x < SETTORE; x += 1) {
      const tx = sx * SETTORE + x;
      const ty = sy * SETTORE + y;
      const terreno = terrenoIn(tx, ty, seme);
      const varianti = CATALOGO[terreno].varianti;
      // La variante si sceglie con l'impronta del tassello: stabile fra una
      // ricottura e l'altra, altrimenti il prato cambierebbe disegno ogni
      // volta che il settore esce e rientra dalla memoria.
      const quale = Math.floor(impronta(tx, ty, seme ^ 0x5bf03635) * varianti.length) % varianti.length;
      pennello.drawImage(cuoci(varianti[quale]), x * TASSELLO, y * TASSELLO);

      const oggetto = oggettoIn(tx, ty, seme, terreno);
      if (oggetto !== OGGETTO.NESSUNO) {
        const sprite = cuoci(CATALOGO_OGGETTI[oggetto].sprite);
        oggetti.push({
          // Ancorato ai piedi: lo sprite è più alto del tassello e cresce
          // verso l'alto, com'è ovvio per un albero e per niente ovvio per il
          // disegno, che parte dall'angolo in alto a sinistra.
          x: tx * TASSELLO,
          y: (ty + 1) * TASSELLO - sprite.height,
          base: (ty + 1) * TASSELLO,
          sprite,
        });
      }
    }
  }

  return { canvas, oggetti };
}

function settore(sx, sy) {
  const k = chiave(sx, sy);
  let s = settori.get(k);
  if (!s) {
    s = cuociSettore(sx, sy);
    settori.set(k, s);
  }
  return s;
}

// I settori cotti sono un quarto di megabyte l'uno: camminando a lungo
// riempirebbero la memoria. Si buttano quelli lontani dall'inquadratura, e si
// ricuociono uguali se il giocatore torna indietro.
const RAGGIO_MEMORIA = 4;

function potaSettori(sxCentro, syCentro) {
  if (settori.size <= 48) return;
  for (const k of settori.keys()) {
    const [sx, sy] = k.split(",").map(Number);
    if (Math.abs(sx - sxCentro) > RAGGIO_MEMORIA || Math.abs(sy - syCentro) > RAGGIO_MEMORIA) {
      settori.delete(k);
    }
  }
}

// --- disegno --------------------------------------------------------------

// Riempito a ogni fotogramma ma allocato una volta sola: un array nuovo per
// fotogramma darebbe al raccoglitore di rifiuti sessanta oggetti al secondo da
// smaltire, e si vedrebbe come singhiozzo.
const oggettiInquadrati = [];

export function disegnaTerreno() {
  const q = schermo.inquadratura();
  const primo = Math.floor(q.sinistra / LATO_SETTORE);
  const ultimo = Math.floor((q.destra - 1) / LATO_SETTORE);
  const sopra = Math.floor(q.sopra / LATO_SETTORE);
  const sotto = Math.floor((q.sotto - 1) / LATO_SETTORE);

  oggettiInquadrati.length = 0;

  for (let sy = sopra; sy <= sotto; sy += 1) {
    for (let sx = primo; sx <= ultimo; sx += 1) {
      const s = settore(sx, sy);
      schermo.disegna(s.canvas, sx * LATO_SETTORE, sy * LATO_SETTORE);
      for (const oggetto of s.oggetti) {
        if (schermo.visibile(oggetto.x, oggetto.y, oggetto.sprite.width, oggetto.sprite.height)) {
          oggettiInquadrati.push(oggetto);
        }
      }
    }
  }

  potaSettori(Math.floor((primo + ultimo) / 2), Math.floor((sopra + sotto) / 2));
  return oggettiInquadrati;
}

export function settoriInMemoria() {
  return settori.size;
}

// Il superstite: movimento, urti, animazione.

import * as schermo from "../motore/schermo.js";
import * as comandi from "../motore/comandi.js";
import * as mappa from "../mondo/mappa.js";
import { cuoci, riflesso } from "../arte/sprite.js";
import * as arte from "../arte/sprite-personaggi.js";

const { TASSELLO } = schermo;

export const TIPO = "giocatore";

const VELOCITA = 52; // pixel al secondo
const VELOCITA_CORSA = 92;

// Il rettangolo d'urto è molto più piccolo dello sprite e sta ai piedi. In una
// vista dall'alto 3/4 il busto è disegnato "davanti" al terreno che occupa, non
// sopra: far collidere anche la testa darebbe la sensazione di un personaggio
// grasso il doppio di quello che si vede.
const LARGHEZZA_URTO = 10;
const ALTEZZA_URTO = 7;

// Un fotogramma di camminata ogni tot pixel percorsi, non ogni tot secondi:
// così l'animazione resta agganciata al passo anche quando si corre, invece di
// scivolare come su ghiaccio.
const PIXEL_PER_FOTOGRAMMA = 7;

// --- urti -----------------------------------------------------------------

function liberoIn(x, y) {
  const sinistra = x - LARGHEZZA_URTO / 2;
  const destra = x + LARGHEZZA_URTO / 2 - 0.001;
  const sopra = y - ALTEZZA_URTO;
  const sotto = y - 0.001;

  const txPrimo = Math.floor(sinistra / TASSELLO);
  const txUltimo = Math.floor(destra / TASSELLO);
  const tyPrimo = Math.floor(sopra / TASSELLO);
  const tyUltimo = Math.floor(sotto / TASSELLO);

  for (let ty = tyPrimo; ty <= tyUltimo; ty += 1) {
    for (let tx = txPrimo; tx <= txUltimo; tx += 1) {
      if (mappa.solidoIn(tx, ty)) return false;
    }
  }
  return true;
}

// I due assi si risolvono separatamente: è ciò che permette di scivolare lungo
// un muro invece di incollarcisi. Provando lo spostamento come un unico
// vettore, sfiorare un albero in diagonale fermerebbe del tutto.
function muovi(e, dx, dy) {
  if (dx !== 0 && liberoIn(e.px + dx, e.py)) e.px += dx;
  if (dy !== 0 && liberoIn(e.px, e.py + dy)) e.py += dy;
}

// --- aspetto --------------------------------------------------------------

function aggiornaAspetto(e) {
  const fotogramma = Math.floor(e.passo) % 4;
  const fotogrammi = e.guarda === "su" ? arte.SU : e.guarda === "giu" ? arte.GIU : arte.LATO;
  const immagine = cuoci(fotogrammi[fotogramma]);

  e.sprite = e.guarda === "destra" ? riflesso(immagine) : immagine;
  // Ancorato ai piedi, come gli oggetti della mappa: è quello che fa funzionare
  // l'ordinamento in profondità senza casi speciali.
  e.x = e.px - e.sprite.width / 2;
  e.y = e.py - e.sprite.height;
  e.base = e.py;
}

// --- comportamento --------------------------------------------------------

export function aggiorna(e, passo) {
  const { x, y } = comandi.direzione();
  const velocita = comandi.attiva("corri") ? VELOCITA_CORSA : VELOCITA;

  if (x !== 0 || y !== 0) {
    // La direzione dello sguardo dà la precedenza all'orizzontale: in diagonale
    // il profilo si legge meglio della figura vista di fronte.
    if (x < 0) e.guarda = "sinistra";
    else if (x > 0) e.guarda = "destra";
    else if (y < 0) e.guarda = "su";
    else e.guarda = "giu";

    const primaX = e.px;
    const primaY = e.py;
    muovi(e, x * velocita * passo, y * velocita * passo);
    const percorso = Math.hypot(e.px - primaX, e.py - primaY);
    e.passo += percorso / PIXEL_PER_FOTOGRAMMA;
  } else {
    // Fermi si torna al fotogramma di riposo, non a uno qualsiasi del ciclo.
    e.passo = 0;
  }

  aggiornaAspetto(e);
}

// --- creazione ------------------------------------------------------------

export function crea(px, py) {
  const e = { tipo: TIPO, px, py, guarda: "giu", passo: 0, sprite: null, x: 0, y: 0, base: py };
  aggiornaAspetto(e);
  return e;
}

// Cerca un punto di partenza calpestabile a spirale attorno a quello chiesto.
// Il seme decide il terreno, quindi capita benissimo che il centro del mondo
// sia in mezzo a un lago: senza questo, certe valli comincerebbero annegati.
export function puntoDiPartenza(txCentro = 0, tyCentro = 0) {
  for (let raggio = 0; raggio < 120; raggio += 1) {
    for (let dy = -raggio; dy <= raggio; dy += 1) {
      for (let dx = -raggio; dx <= raggio; dx += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== raggio) continue;
        const tx = txCentro + dx;
        const ty = tyCentro + dy;
        if (!mappa.solidoIn(tx, ty)) {
          return { px: tx * TASSELLO + TASSELLO / 2, py: ty * TASSELLO + TASSELLO - 1 };
        }
      }
    }
  }
  return { px: 0, py: 0 };
}

// Il cespuglio rotolante (W0.2).
//
// Non c'è western senza: una palla di sterpi secchi che attraversa la strada
// spinta dal vento, mentre due uomini si guardano e nessuno parla. Qui non
// guarda nessuno, ed è già metà della battuta.
//
// È solo decoro, e per costruzione: non urta niente, non si raccoglie, non si
// salva e non tocca il mondo. Nasce ogni tanto, di giorno, appena fuori da un
// lato dell'inquadratura, e rotola fino a uscire dall'altro. Vive nel mondo e
// non sullo schermo, così resta dov'è se ti muovi — e se gli corri dietro,
// ti scappa.

import * as schermo from "../motore/schermo.js";
import { generatore } from "../motore/casuale.js";
import { cuoci, ruotato } from "../arte/sprite.js";

// Paglia chiara su contorno di legno secco: sulla terra ocra del deserto
// una palla dei colori della terra spariva.
const PALLA = [
  "...h8w5h...",
  "..8.5h.8w..",
  ".w5h8.w5.8.",
  "h8.w5h8.w5h",
  "5.h8.5w.8h5",
  "8w5.h8.5w.8",
  "h.8w5.h8w5h",
  ".5h.8w5.h8.",
  "..w8h.5w8..",
  "...h5w8h...",
];

// Ogni quanto passa, in secondi veri: abbastanza di rado perché ogni volta
// sia un piccolo evento, abbastanza spesso perché si veda in una giornata.
const ATTESA = [40, 90];
const VELOCITA = [45, 70];
// Un quarto di giro ogni tanti secondi: così rotola invece di scivolare.
const GIRO = 0.12;

let caso = null;
let attesa = null;
let palla = null;

// Il generatore si può fissare (i collaudi lo fanno); altrimenti si semina
// una volta sola da crypto, perché in questo gioco Math.random non esiste.
export function inizializza(seme) {
  caso = generatore(seme >>> 0);
  attesa = ATTESA[0] + caso() * (ATTESA[1] - ATTESA[0]);
  palla = null;
}

function pronto() {
  if (caso) return;
  const numero = new Uint32Array(1);
  globalThis.crypto?.getRandomValues?.(numero);
  inizializza(numero[0]);
}

function tra([a, b]) {
  return a + caso() * (b - a);
}

// Fa partire una palla adesso, da un lato dell'inquadratura. Serve alla
// diagnostica, per vederla senza aspettare.
export function forza({ suolo } = {}) {
  pronto();
  const q = schermo.inquadratura();
  const verso = caso() < 0.5 ? 1 : -1;
  palla = {
    x: verso > 0 ? q.sinistra - 16 : q.destra + 6,
    suolo: suolo ?? q.sopra + (0.35 + caso() * 0.5) * (q.sotto - q.sopra),
    vx: verso * tra(VELOCITA),
    tempo: 0,
  };
  return palla;
}

// Un passo: il vento conta i secondi, e di notte non soffia.
export function aggiorna(passo, { giorno = true } = {}) {
  pronto();
  if (palla) {
    palla.tempo += passo;
    palla.x += palla.vx * passo;
    const q = schermo.inquadratura();
    const uscita = palla.vx > 0 ? palla.x > q.destra + 32 : palla.x < q.sinistra - 48;
    // Un tetto di tempo, per non lasciarla rotolare per sempre in una
    // pianura infinita se le si corre dietro.
    if (uscita || palla.tempo > 25) palla = null;
    return;
  }
  attesa -= passo;
  if (attesa > 0) return;
  attesa = tra(ATTESA);
  if (giorno) forza();
}

export function attiva() {
  return palla ? { ...palla } : null;
}

// Da mettere fra le cose in piedi, ordinata per i piedi come tutte le altre:
// così passa davanti a un cactus o dietro, secondo dov'è.
export function daDisegnare() {
  if (!palla) return null;
  const quarto = Math.floor(palla.tempo / GIRO) * Math.sign(palla.vx);
  const salto = Math.abs(Math.sin(palla.tempo * 6)) * 4;
  const sprite = ruotato(cuoci(PALLA), quarto);
  return { sprite, x: palla.x, y: palla.suolo - sprite.height - salto, base: palla.suolo };
}

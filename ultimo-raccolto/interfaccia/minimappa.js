// La minimappa, in basso a destra.
//
// Un pixel per tassello, sessantaquattro per lato: copre poco meno di tre
// schermate in larghezza. Abbastanza per capire dov'è il lago e da che parte
// finisce la roccia, troppo poco per essere una mappa del mondo — che
// toglierebbe il gusto di andare a vedere.
//
// Il vincolo che decide tutta la struttura è il costo: calcolare il terreno
// dei 4096 tasselli inquadrati costa quasi trenta millisecondi, cioè due
// fotogrammi. Rifarlo a ogni fotogramma è impensabile e rifarlo a ogni passo
// si sentirebbe come uno scatto. Quindi la griglia scorre: quando il
// giocatore cambia tassello si spostano i valori già noti e si calcola solo
// la striscia appena entrata, che è una riga — due centesimi di millisecondo.

import * as schermo from "../motore/schermo.js";
import * as mappa from "../mondo/mappa.js";
import * as modifiche from "../mondo/modifiche.js";
import { TERRENO, OGGETTO } from "../mondo/generazione.js";
import { TAVOLOZZA } from "../arte/tavolozza.js";
import { telaio } from "../arte/sprite.js";

const LATO = 64;
const MARGINE = 6;

// Una tinta sola per terreno. I tasselli veri sono screziati e non hanno un
// colore unico, quindi si sceglie il più rappresentativo: a un pixel per
// tassello conta solo che l'acqua si distingua dalla roccia a colpo d'occhio.
//
// D'inverno l'erba e la sterpaglia finiscono sulla stessa tinta — undici
// punti di distanza contro i quarantasette dell'estate — e la prateria si
// appiattisce. Non è un difetto da correggere scegliendo un'altra chiave:
// nessuna chiave le separa, perché d'inverno *sono* lo stesso colore anche
// nel mondo, e allontanarle qui vorrebbe dire una minimappa che racconta una
// valle diversa da quella che si attraversa. In cambio si distingue meglio
// quello per cui questa finestra esiste: l'erba e la roccia passano da
// trentotto punti a cinquantadue.
const CHIAVI_TERRENO = {
  [TERRENO.ACQUA]: "1",
  [TERRENO.ACQUA_BASSA]: "3",
  [TERRENO.SABBIA]: "5",
  [TERRENO.ERBA]: "7",
  [TERRENO.STERPAGLIA]: "9",
  [TERRENO.ROCCIA]: "e",
  [TERRENO.TERRA]: "b",
};

// Le cose che il giocatore ha posato sono l'unica parte della minimappa che
// vale più del paesaggio: sono i suoi punti di riferimento, non quelli del
// mondo.
const SEGNAPOSTI = {
  [OGGETTO.FALO_ACCESO]: "#f2d06b",
  [OGGETTO.TORCIA_PIANTATA]: "#e0913a",
  [OGGETTO.FALO_SPENTO]: "#7b756a",
};

const CORNICE = "#3a3f48";
const FONDO = "rgb(16 18 22 / 0.82)";
const EROE = "#ffffff";

function componenti(esadecimale) {
  const n = Number.parseInt(esadecimale.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Le chiavi restano le stesse, la tavolozza cambia. È lo stesso conto che
// vale per il mondo — la tavolozza è un parametro, non una costante — e qui
// costa ancora meno: la griglia tiene quale terreno c'è, non di che colore è,
// quindi una stagione nuova rifà sette tinte e ridipinge 4096 pixel invece di
// ricalcolare 4096 tasselli di rumore.
let tavolozza = TAVOLOZZA;
const COLORI = [];

function rifaiColori() {
  for (const [id, chiave] of Object.entries(CHIAVI_TERRENO)) {
    COLORI[id] = componenti(tavolozza[chiave]);
  }
}

rifaiColori();

// Gliela passa dall'alto chi conosce il calendario, come già succede per la
// mappa: qui non si sa cosa sia una stagione, si sa che ogni tanto arrivano
// colori nuovi.
export function impostaTavolozza(nuova) {
  if (nuova === tavolozza) return false;
  tavolozza = nuova;
  rifaiColori();
  // Solo se c'è già qualcosa da ridipingere. La griglia non si tocca: i
  // terreni sono dove erano, è cambiato il mese.
  if (centro) ridipingi();
  return true;
}

let griglia = null;
let scorta = null;
let dati = null;
let tela = null;
let pennelloTela = null;
let centro = null;
let ricostruite = 0;

function prepara() {
  if (griglia) return;
  griglia = new Int8Array(LATO * LATO);
  scorta = new Int8Array(LATO * LATO);
  const fatto = telaio(LATO, LATO);
  tela = fatto.canvas;
  pennelloTela = fatto.contesto;
  dati = pennelloTela.createImageData(LATO, LATO);
  // L'opacità non cambia mai: si scrive una volta sola invece che a ogni
  // ricostruzione.
  for (let i = 3; i < dati.data.length; i += 4) dati.data[i] = 255;
}

const mezzo = LATO >> 1;

// Sposta i valori già noti e calcola solo quelli entrati adesso. Si legge da
// una copia invece che dalla griglia stessa perché origine e destinazione si
// sovrappongono, e scrivendo in loco si trascinerebbero i valori appena
// sovrascritti.
function scorri(tx, ty) {
  const dx = tx - centro.tx;
  const dy = ty - centro.ty;
  scorta.set(griglia);

  for (let gy = 0; gy < LATO; gy += 1) {
    const sy = gy + dy;
    for (let gx = 0; gx < LATO; gx += 1) {
      const sx = gx + dx;
      const i = gy * LATO + gx;
      if (sx >= 0 && sx < LATO && sy >= 0 && sy < LATO) {
        griglia[i] = scorta[sy * LATO + sx];
      } else {
        griglia[i] = mappa.terrenoDi(tx - mezzo + gx, ty - mezzo + gy);
      }
    }
  }
}

function riempiTutto(tx, ty) {
  for (let gy = 0; gy < LATO; gy += 1) {
    for (let gx = 0; gx < LATO; gx += 1) {
      griglia[gy * LATO + gx] = mappa.terrenoDi(tx - mezzo + gx, ty - mezzo + gy);
    }
  }
}

function ridipingi() {
  const p = dati.data;
  for (let i = 0; i < griglia.length; i += 1) {
    const colore = COLORI[griglia[i]] ?? COLORI[TERRENO.ERBA];
    const j = i * 4;
    p[j] = colore[0];
    p[j + 1] = colore[1];
    p[j + 2] = colore[2];
  }
  pennelloTela.putImageData(dati, 0, 0);
  ricostruite += 1;
}

// Da chiamare quando il gioco aggiorna, non quando disegna: il terreno cambia
// solo se il giocatore si è spostato di un tassello.
export function aggiorna(eroe) {
  prepara();
  const tx = Math.floor(eroe.px / schermo.TASSELLO);
  const ty = Math.floor(eroe.py / schermo.TASSELLO);

  if (!centro) {
    riempiTutto(tx, ty);
  } else if (tx !== centro.tx || ty !== centro.ty) {
    // Uno spostamento più largo della minimappa non ha niente da riusare, e
    // lo scorrimento costerebbe più del ricalcolo.
    if (Math.abs(tx - centro.tx) >= LATO || Math.abs(ty - centro.ty) >= LATO) {
      riempiTutto(tx, ty);
    } else {
      scorri(tx, ty);
    }
  } else {
    return;
  }

  centro = { tx, ty };
  ridipingi();
}

export function disegna(pennello) {
  if (!tela || !centro) return;

  const x = schermo.LARGHEZZA - LATO - MARGINE;
  const y = schermo.ALTEZZA - LATO - MARGINE;

  pennello.fillStyle = FONDO;
  pennello.fillRect(x - 1, y - 1, LATO + 2, LATO + 2);
  pennello.drawImage(tela, x, y);

  // I punti di riferimento del giocatore, disegnati solo se cadono dentro la
  // finestra: il ciclo è sui cambiamenti, che sono pochi, non sui tasselli.
  modifiche.perOgnuno((tx, ty, cambio) => {
    const colore = SEGNAPOSTI[cambio.oggetto];
    if (!colore) return;
    const gx = tx - centro.tx + mezzo;
    const gy = ty - centro.ty + mezzo;
    if (gx < 0 || gx >= LATO || gy < 0 || gy >= LATO) return;
    pennello.fillStyle = colore;
    pennello.fillRect(x + gx, y + gy, 1, 1);
  });

  // Il superstite è sempre esattamente al centro, e si disegna per ultimo
  // perché nessun segnaposto deve poterlo coprire.
  pennello.fillStyle = "#11131a";
  pennello.fillRect(x + mezzo - 1, y + mezzo - 1, 3, 3);
  pennello.fillStyle = EROE;
  pennello.fillRect(x + mezzo, y + mezzo, 1, 1);

  pennello.strokeStyle = CORNICE;
  pennello.lineWidth = 1;
  pennello.strokeRect(x - 0.5, y - 0.5, LATO + 1, LATO + 1);
}

// Da chiamare quando il mondo sotto è cambiato sotto i piedi — un
// caricamento, un seme diverso. Senza, la griglia resterebbe quella di prima e
// scorrerebbe da lì: la minimappa mostrerebbe pezzi della partita precedente.
export function dimentica() {
  centro = null;
}

export function ricostruzioni() {
  return ricostruite;
}

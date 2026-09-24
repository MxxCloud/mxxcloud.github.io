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
import { OGGETTO, TERRENO } from "../mondo/generazione.js";
import * as tinte from "./tinte.js";
import { telaio } from "../arte/sprite.js";

const LATO = 64;
const MARGINE = 6;

// Le tinte del terreno vengono da tinte.js, che le divide con la mappa
// grande: erano scritte qui, e due finestre che guardano la stessa valle non
// possono avere due tabelle di colori da tenere allineate a mano.
//
// D'inverno l'erba e la sterpaglia finiscono sulla stessa tinta — undici punti
// di distanza contro i quarantasette dell'estate — e la prateria si
// appiattisce. Non è un difetto da correggere scegliendo un'altra chiave:
// nessuna chiave le separa, perché d'inverno *sono* lo stesso colore anche nel
// mondo, e allontanarle qui vorrebbe dire una minimappa che racconta una valle
// diversa da quella che si attraversa. In cambio si distingue meglio quello
// per cui questa finestra esiste: l'erba e la roccia passano da trentotto
// punti a cinquantadue.

// Le cose che il giocatore ha posato sono l'unica parte della minimappa che
// vale più del paesaggio: sono i suoi punti di riferimento, non quelli del
// mondo.
const SEGNAPOSTI = {
  [OGGETTO.FALO_ACCESO]: "#f2d06b",
  [OGGETTO.FOCOLARE_ACCESO]: "#f2d06b",
  [OGGETTO.FOCOLARE_SPENTO]: "#55534a",
  [OGGETTO.ESSICCATOIO]: "#56402a",
  [OGGETTO.ESSICCATOIO_CARICO]: "#a33b2a",
  [OGGETTO.ESSICCATOIO_PRONTO]: "#5a4430",
  [OGGETTO.TORCIA_PIANTATA]: "#e0913a",
  [OGGETTO.FALO_SPENTO]: "#7b756a",
  // Gli stessi colori della mappa grande, per le stesse cose. Il cadavere
  // resta fuori da qui — questa dice dove sei, non dove devi andare — ma la
  // cassa e il giaciglio ci stanno: sono roba tua che si cerca con gli occhi
  // mentre si cammina, non una destinazione da pianificare.
  [OGGETTO.CASSA]: "#c9b189",
  [OGGETTO.GIACIGLIO]: "#8fa8d8",
  [OGGETTO.LETTO]: "#8fa8d8",
};

const CORNICE = "#3a3f48";
const FONDO = "rgb(16 18 22 / 0.82)";
const EROE = "#ffffff";

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
    const colore = tinte.coloreDi(griglia[i]);
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

// Da chiamare quando le tinte sono cambiate sotto i piedi, cioè a un cambio
// di stagione. La griglia non si tocca: i terreni sono dove erano, è cambiato
// il mese — quindi una stagione nuova ridipinge 4096 pixel invece di
// ricalcolare 4096 tasselli di rumore.
export function ridipingiSeServe(gelo) {
  if (griglia && typeof gelo === "boolean") {
    for (let i = 0; i < griglia.length; i++) {
      if (gelo && griglia[i] === TERRENO.ACQUA_BASSA) griglia[i] = TERRENO.GHIACCIO;
      else if (!gelo && griglia[i] === TERRENO.GHIACCIO) griglia[i] = TERRENO.ACQUA_BASSA;
    }
  }
  if (centro) ridipingi();
}

export function ricostruzioni() {
  return ricostruite;
}


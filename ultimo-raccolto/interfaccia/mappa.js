// La mappa di quello che hai visto, a schermo intero.
//
// In un mondo infinito una "mappa del mondo" non esiste: qualunque cosa si
// disegni è un ritaglio. Questa disegna l'unico ritaglio che abbia un senso —
// i settori per cui sei passato (vedi regole/esplorato.js) — e lascia buio
// tutto il resto. Cresce esplorando, e questo è metà del suo scopo: rende
// l'andare a vedere una cosa che lascia un segno.
//
// IL COSTO DECIDE LA STRUTTURA, come per la minimappa. Calcolare il terreno di
// una schermata intera di mappa vuol dire decine di migliaia di valutazioni di
// rumore, cioè quasi mezzo secondo: impensabile alla pressione di un tasto.
// Quindi non si calcola niente quando si apre. Ogni settore viene disegnato
// una volta sola nell'atlante, nel momento in cui lo si scopre — sedici
// valutazioni, un'inezia dentro il fotogramma in cui si entra in un settore
// nuovo — e aprire la mappa è una drawImage.
//
// L'atlante tiene gli identificatori del terreno e non i colori. È la stessa
// scelta della minimappa e paga per la stessa ragione: al cambio di stagione
// si ridipingono dei pixel invece di ricalcolare del rumore.

import * as schermo from "../motore/schermo.js";
import * as mappa from "../mondo/mappa.js";
import * as modifiche from "../mondo/modifiche.js";
import * as esplorato from "../regole/esplorato.js";
import { OGGETTO, TERRENO } from "../mondo/generazione.js";
import * as tinte from "./tinte.js";
import * as testo from "../arte/testo.js";
import { telaio } from "../arte/sprite.js";

const { SETTORE } = mappa;

// Quanti pixel d'atlante per settore. Quattro: un pixel ogni quattro
// tasselli. Più fitto e una partita lunga darebbe un atlante da ingrandire
// mai e da rimpicciolire sempre; più rado e un lago di otto tasselli
// diventerebbe un pixel solo.
const PIXEL_PER_SETTORE = 4;
const TASSELLI_PER_PIXEL = SETTORE / PIXEL_PER_SETTORE;

// Margini della finestra a schermo. In basso resta più spazio perché lì ci va
// la riga dei tasti.
const MARGINE = 14;
const PIEDE = 12;

const FONDO = "rgb(8 9 12 / 0.92)";
const BORDO = "#3a3f48";
const CHIARO = "#e4e2d6";
const GRIGIO = "#8e8a7e";
const EROE = "#ffffff";

// Gli stessi colori della minimappa per le stesse cose: chi ha imparato che
// il puntino caldo è un falò non deve reimpararlo qui.
const SEGNAPOSTI = {
  [OGGETTO.FALO_ACCESO]: "#f2d06b",
  [OGGETTO.FOCOLARE_ACCESO]: "#f2d06b",
  [OGGETTO.FOCOLARE_SPENTO]: "#55534a",
  [OGGETTO.TORCIA_PIANTATA]: "#e0913a",
  [OGGETTO.FALO_SPENTO]: "#7b756a",
  // Il cadavere sulla minimappa non c'è, e qui sì: la minimappa dice dove sei,
  // questa dice dove devi andare. Recuperare il proprio corpo è un viaggio, e
  // un viaggio vuole una destinazione segnata.
  [OGGETTO.CADAVERE]: "#c0705f",
  // La cassa e il giaciglio, per la stessa ragione e con più diritto di tutti
  // gli altri. Si segnava il falò SPENTO e non il proprio ripostiglio: una
  // svista di quando le casse sono arrivate. Questa mappa dice dove devi
  // andare, e dove sta la tua roba è la destinazione per eccellenza — insieme
  // al posto in cui puoi dormire, che d'inverno vuol dire saltare il gelo.
  [OGGETTO.CASSA]: "#c9b189",
  [OGGETTO.GIACIGLIO]: "#8fa8d8",
};

// Le rovine hanno un segnaposto loro, e ci sono arrivate per prova.
//
// L'idea era che non servisse: il pavimento di una rovina è TERRENO.TERRA, che
// ha una tinta sua, quindi una casa si disegna da sé. Sulla minimappa è vero e
// si vede benissimo — un rettangolo scuro in mezzo al verde. Su questa no:
// qui un settore sta in pochi pixel, una casa di otto tasselli ne occupa tre,
// e tre pixel di terra battuta in mezzo alla sterpaglia sono tre pixel di
// sterpaglia. Fotografato prima di accorgersene.
//
// È anche l'unico segnaposto che non indica roba tua, ed è il motivo per cui
// questa mappa comincia a servire a qualcosa: fin qui segnava solo i posti in
// cui eri già stato con le tue mani.
const ROVINA = "#b9a48a";

// --- l'atlante ------------------------------------------------------------

// Cresce a scatti invece che a ogni settore nuovo: allargare vuol dire
// ricopiare l'immagine intera, e farlo per un pixel alla volta sarebbe una
// ricopiatura a ogni passo.
const RESPIRO = 8;

let tela = null;
let pennello = null;
let terreni = null; // Int8Array, un valore per pixel d'atlante
let sxMin = 0;
let syMin = 0;
let larghezzaSettori = 0;
let altezzaSettori = 0;
let ridipinture = 0;

function indice(px, py) {
  return py * (larghezzaSettori * PIXEL_PER_SETTORE) + px;
}

// Rifà l'atlante da zero sulle dimensioni chieste, portandosi dietro quello
// che c'era. Capita al primo settore e poi solo quando si esce dai bordi.
function ridimensiona(nuovoSxMin, nuovoSyMin, nuoveLarghezza, nuovaAltezza) {
  const vecchiTerreni = terreni;
  const vecchiaLarghezza = larghezzaSettori;
  const vecchioSxMin = sxMin;
  const vecchioSyMin = syMin;
  const vecchiaAltezza = altezzaSettori;

  sxMin = nuovoSxMin;
  syMin = nuovoSyMin;
  larghezzaSettori = nuoveLarghezza;
  altezzaSettori = nuovaAltezza;

  const larghezzaPixel = larghezzaSettori * PIXEL_PER_SETTORE;
  const altezzaPixel = altezzaSettori * PIXEL_PER_SETTORE;
  terreni = new Int8Array(larghezzaPixel * altezzaPixel).fill(-1);

  const fatto = telaio(larghezzaPixel, altezzaPixel);
  tela = fatto.canvas;
  pennello = fatto.contesto;

  if (!vecchiTerreni) return;
  // I valori vecchi si ricopiano invece di essere ricalcolati: sono già la
  // risposta giusta, e ricalcolarli sarebbe l'unica cosa cara qui dentro.
  for (let py = 0; py < vecchiaAltezza * PIXEL_PER_SETTORE; py += 1) {
    for (let px = 0; px < vecchiaLarghezza * PIXEL_PER_SETTORE; px += 1) {
      const valore = vecchiTerreni[py * (vecchiaLarghezza * PIXEL_PER_SETTORE) + px];
      if (valore < 0) continue;
      const nx = px + (vecchioSxMin - sxMin) * PIXEL_PER_SETTORE;
      const ny = py + (vecchioSyMin - syMin) * PIXEL_PER_SETTORE;
      terreni[indice(nx, ny)] = valore;
    }
  }
  ridipingi();
}

function faiStare(sx, sy) {
  if (!terreni) {
    ridimensiona(sx - RESPIRO, sy - RESPIRO, RESPIRO * 2 + 1, RESPIRO * 2 + 1);
    return;
  }
  if (sx >= sxMin && sy >= syMin && sx < sxMin + larghezzaSettori && sy < syMin + altezzaSettori) {
    return;
  }
  const nuovoSxMin = Math.min(sxMin, sx - RESPIRO);
  const nuovoSyMin = Math.min(syMin, sy - RESPIRO);
  const nuovoSxMax = Math.max(sxMin + larghezzaSettori - 1, sx + RESPIRO);
  const nuovoSyMax = Math.max(syMin + altezzaSettori - 1, sy + RESPIRO);
  ridimensiona(nuovoSxMin, nuovoSyMin, nuovoSxMax - nuovoSxMin + 1, nuovoSyMax - nuovoSyMin + 1);
}

// Sedici valutazioni di rumore, prese al centro di ogni gruppo di quattro
// tasselli per quattro: il centro e non l'angolo, perché un angolo cade sul
// confine fra due terreni e sceglie sempre lo stesso dei due.
function disegnaSettore(sx, sy) {
  faiStare(sx, sy);
  const px0 = (sx - sxMin) * PIXEL_PER_SETTORE;
  const py0 = (sy - syMin) * PIXEL_PER_SETTORE;

  for (let y = 0; y < PIXEL_PER_SETTORE; y += 1) {
    for (let x = 0; x < PIXEL_PER_SETTORE; x += 1) {
      const tx = sx * SETTORE + x * TASSELLI_PER_PIXEL + (TASSELLI_PER_PIXEL >> 1);
      const ty = sy * SETTORE + y * TASSELLI_PER_PIXEL + (TASSELLI_PER_PIXEL >> 1);
      const terreno = mappa.terrenoDi(tx, ty);
      terreni[indice(px0 + x, py0 + y)] = terreno;
      const [r, v, b] = tinte.coloreDi(terreno);
      pennello.fillStyle = `rgb(${r} ${v} ${b})`;
      pennello.fillRect(px0 + x, py0 + y, 1, 1);
    }
  }
}

// Dall'elenco degli identificatori ai pixel. Non tocca il rumore: serve al
// cambio di stagione, dove quello che cambia è il colore e non il terreno.
function ridipingi() {
  if (!terreni) return;
  const larghezzaPixel = larghezzaSettori * PIXEL_PER_SETTORE;
  for (let i = 0; i < terreni.length; i += 1) {
    const terreno = terreni[i];
    if (terreno < 0) continue;
    const [r, v, b] = tinte.coloreDi(terreno);
    pennello.fillStyle = `rgb(${r} ${v} ${b})`;
    pennello.fillRect(i % larghezzaPixel, Math.floor(i / larghezzaPixel), 1, 1);
  }
  ridipinture += 1;
}

export function ridipingiSeServe(gelo) {
  if (terreni && typeof gelo === "boolean") {
    for (let i = 0; i < terreni.length; i++) {
      if (gelo && terreni[i] === TERRENO.ACQUA_BASSA) terreni[i] = TERRENO.GHIACCIO;
      else if (!gelo && terreni[i] === TERRENO.GHIACCIO) terreni[i] = TERRENO.ACQUA_BASSA;
    }
  }
  ridipingi();
}

// I settori appena scoperti, come coppie sx,sy di seguito. È la strada
// normale: si dipinge quello che è comparso e nient'altro, quindi il costo non
// dipende da quanto si è già esplorato.
export function aggiungi(nuovi) {
  for (let i = 0; i < nuovi.length; i += 2) disegnaSettore(nuovi[i], nuovi[i + 1]);
}

// Ridisegna tutto quello che risulta esplorato. Serve solo al caricamento di
// una partita, dove l'atlante non esiste ancora e i settori arrivano tutti
// insieme da un file.
export function aggiorna() {
  esplorato.perOgnuno((sx, sy) => {
    if (!terreni) {
      disegnaSettore(sx, sy);
      return;
    }
    const px = (sx - sxMin) * PIXEL_PER_SETTORE;
    const py = (sy - syMin) * PIXEL_PER_SETTORE;
    const dentro =
      sx >= sxMin && sy >= syMin && sx < sxMin + larghezzaSettori && sy < syMin + altezzaSettori;
    if (dentro && terreni[indice(px, py)] >= 0) return;
    disegnaSettore(sx, sy);
  });
}

// Il mondo sotto è cambiato: un caricamento, un seme diverso. L'atlante di
// prima descrive un'altra valle.
export function dimentica() {
  tela = null;
  pennello = null;
  terreni = null;
  larghezzaSettori = 0;
  altezzaSettori = 0;
}

export function ridipinte() {
  return ridipinture;
}

// --- il disegno a schermo -------------------------------------------------

// Quanto della mappa si è davvero scoperto, in pixel d'atlante. Serve a
// incorniciare quello che c'è invece dell'atlante intero, che ha attorno il
// respiro lasciato per crescere.
function riquadroScoperto() {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  esplorato.perOgnuno((sx, sy) => {
    if (sx < minX) minX = sx;
    if (sy < minY) minY = sy;
    if (sx > maxX) maxX = sx;
    if (sy > maxY) maxY = sy;
  });
  if (minX === Infinity) return null;
  return {
    px: (minX - sxMin) * PIXEL_PER_SETTORE,
    py: (minY - syMin) * PIXEL_PER_SETTORE,
    larghezza: (maxX - minX + 1) * PIXEL_PER_SETTORE,
    altezza: (maxY - minY + 1) * PIXEL_PER_SETTORE,
  };
}

export function disegna(p, eroe) {
  p.fillStyle = FONDO;
  p.fillRect(0, 0, schermo.LARGHEZZA, schermo.ALTEZZA);

  const utileL = schermo.LARGHEZZA - MARGINE * 2;
  const utileA = schermo.ALTEZZA - MARGINE * 2 - PIEDE;

  const scoperto = tela && riquadroScoperto();
  if (!scoperto) {
    const vuoto = "NON HAI ANCORA VISTO NIENTE";
    testo.disegna(p, vuoto, Math.round((schermo.LARGHEZZA - testo.larghezza(vuoto)) / 2), 100, GRIGIO);
    return;
  }

  // Si ingrandisce a numeri interi finché ci sta, perché a numeri interi la
  // pixel art resta pixel art. Quando l'esplorato è più grande dello schermo
  // non c'è scelta e si rimpicciolisce con un fattore qualunque: qui è un
  // diagramma e non il mondo, e perdere una riga di pixel su una macchia di
  // bosco non si vede.
  const grezza = Math.min(utileL / scoperto.larghezza, utileA / scoperto.altezza);
  const scala = grezza >= 1 ? Math.floor(grezza) : grezza;

  const larghezzaVista = scoperto.larghezza * scala;
  const altezzaVista = scoperto.altezza * scala;
  const x0 = Math.round((schermo.LARGHEZZA - larghezzaVista) / 2);
  const y0 = Math.round((schermo.ALTEZZA - PIEDE - altezzaVista) / 2);

  p.imageSmoothingEnabled = false;
  p.drawImage(
    tela,
    scoperto.px, scoperto.py, scoperto.larghezza, scoperto.altezza,
    x0, y0, larghezzaVista, altezzaVista
  );

  // Dall'atlante allo schermo. Tutto quello che va sopra la mappa passa di
  // qui, così i segnaposti e il superstite non possono finire fuori posto
  // rispetto al terreno.
  const suSchermo = (tx, ty) => ({
    x: x0 + ((tx / TASSELLI_PER_PIXEL) - sxMin * PIXEL_PER_SETTORE - scoperto.px) * scala,
    y: y0 + ((ty / TASSELLI_PER_PIXEL) - syMin * PIXEL_PER_SETTORE - scoperto.py) * scala,
  });

  // I segnaposti hanno una misura fissa e non seguono la scala della mappa.
  // È il contrario di quello che si farebbe d'istinto, e viene da una prova
  // guardata: legati alla scala diventavano un pixel su una mappa da
  // trecentottanta settori, cioè sparivano proprio quando la mappa comincia a
  // servire. Un falò non è grande quanto quattro tasselli, è un posto — e un
  // posto o si vede o non c'è.
  const segnale = (x, y, colore, lato) => {
    const rx = Math.round(x) - (lato >> 1);
    const ry = Math.round(y) - (lato >> 1);
    // Il contorno scuro sotto: su un prato chiaro un puntino giallo si perde,
    // e con il bordo si stacca da qualunque terreno.
    p.fillStyle = "#11131a";
    p.fillRect(rx - 1, ry - 1, lato + 2, lato + 2);
    p.fillStyle = colore;
    p.fillRect(rx, ry, lato, lato);
  };

  // Le rovine dei settori visti. Si passa per le celle e non per i tasselli:
  // una cella è quattro settori per lato, quindi le celle da guardare sono un
  // sedicesimo dei settori esplorati — poche decine anche in una partita
  // lunga, e solo mentre la mappa è aperta.
  const celleViste = new Set();
  esplorato.perOgnuno((sx, sy) => {
    celleViste.add(`${Math.floor(sx * SETTORE / mappa.CELLA_ROVINE)},${Math.floor(sy * SETTORE / mappa.CELLA_ROVINE)}`);
  });
  for (const chiave of celleViste) {
    const [cx, cy] = chiave.split(",").map(Number);
    const rovina = mappa.rovinaNellaCella(cx, cy);
    if (!rovina) continue;
    const tx = rovina.tx0 + (rovina.larghezza >> 1);
    const ty = rovina.ty0 + (rovina.altezza >> 1);
    // Una cella è più grande di un settore: si può aver visto la cella senza
    // essere mai passati dove sta la casa, e segnare una cosa che non si è
    // vista è il contrario di quello che questa mappa fa.
    if (!esplorato.eVisto(Math.floor(tx / SETTORE), Math.floor(ty / SETTORE))) continue;
    const { x, y } = suSchermo(tx, ty);
    const colore = rovina.luogo === "pozzo" ? "#8fb8d8" : rovina.luogo ? "#c79a62" : ROVINA;
    segnale(x, y, colore, rovina.luogo ? 2 : 3);
  }

  modifiche.perOgnuno((tx, ty, cambio) => {
    const colore = SEGNAPOSTI[cambio.oggetto];
    if (!colore) return;
    if (!esplorato.eVisto(Math.floor(tx / SETTORE), Math.floor(ty / SETTORE))) return;
    const { x, y } = suSchermo(tx, ty);
    segnale(x, y, colore, 2);
  });

  // La fattoria: dove comincia la partita e dove ricomincia un superstite
  // nuovo. Vuoto invece che pieno, perché non è una cosa che hai posato — è
  // il posto da cui si riparte, e adesso è un posto per davvero. Fin qui
  // questo segno stava fisso su (0,0), che era la cosa più simile a casa che
  // il gioco avesse.
  const fattoria = mappa.laFattoria();
  const casa = suSchermo(fattoria?.tx ?? 0, fattoria?.ty ?? 0);
  const cx = Math.round(casa.x) - 2;
  const cy = Math.round(casa.y) - 2;
  p.fillStyle = "#11131a";
  p.fillRect(cx - 1, cy - 1, 7, 7);
  p.fillStyle = "#8fa8d8";
  p.fillRect(cx, cy, 5, 1);
  p.fillRect(cx, cy + 4, 5, 1);
  p.fillRect(cx, cy, 1, 5);
  p.fillRect(cx + 4, cy, 1, 5);

  // Il superstite per ultimo, perché nessun segnaposto deve poterlo coprire,
  // e più grande di tutti perché è l'unica cosa che si cerca sempre.
  const io = suSchermo(eroe.px / schermo.TASSELLO, eroe.py / schermo.TASSELLO);
  segnale(io.x, io.y, EROE, 3);

  p.strokeStyle = BORDO;
  p.lineWidth = 1;
  p.strokeRect(x0 - 0.5, y0 - 0.5, larghezzaVista + 1, altezzaVista + 1);

  const titolo = "QUELLO CHE HAI VISTO";
  testo.disegna(p, titolo, MARGINE, 5, CHIARO);
  const quanti = `${esplorato.quanti()} SETTORI`;
  testo.disegna(p, quanti, schermo.LARGHEZZA - MARGINE - testo.larghezza(quanti), 5, GRIGIO);
  const piede = "TAB CHIUDI   BLU POZZI   OCRA LUOGHI";
  testo.disegna(p, piede, Math.round((schermo.LARGHEZZA - testo.larghezza(piede)) / 2), schermo.ALTEZZA - 9, GRIGIO);
}


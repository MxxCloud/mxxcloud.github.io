// La mappa di quello che hai visto, a schermo intero.
//
// In un mondo infinito una "mappa del mondo" non esiste: qualunque cosa si
// disegni è un ritaglio. Questa disegna l'unico ritaglio che abbia un senso —
// i settori per cui sei passato (vedi regole/esplorato.js) — e lascia buio
// tutto il resto. Cresce esplorando, e questo è metà del suo scopo: rende
// l'andare a vedere una cosa che lascia un segno.
//
// Da M7.18.39 è una carta e non un ingrandimento di pixel. Prima stava nei
// 384x216 del gioco, un pixel ogni quattro tasselli con i colori del terreno
// vero, e si allargava con l'esplorato cambiando proporzioni ogni volta: una
// macchia che si leggeva male e che non restava mai uguale. Adesso:
//   - si disegna su un canvas suo, sopra quello del gioco, alla risoluzione
//     vera dello schermo, con i colori piatti di una carta e i segni vettoriali
//     con il loro nome;
//   - un tassello è un punto della carta, e i boschi e i muri delle case si
//     vedono;
//   - la scala è fissa (tre livelli di zoom, Q ed E), e ci si sposta con WASD
//     o le frecce; si apre centrata su di te, e la barra ti ritrova.
//
// IL COSTO DECIDE LA STRUTTURA, come per la minimappa. Ogni settore si
// calcola una volta sola, nel momento in cui lo si scopre — duecentocinquanta-
// sei tasselli, un quarto di millisecondo misurato — e resta in memoria come
// un'immagine di 16x16 punti. Aprire la mappa non calcola niente: incolla le
// immagini dei settori che stanno in vista.

import * as schermo from "../motore/schermo.js";
import * as comandi from "../motore/comandi.js";
import * as mappa from "../mondo/mappa.js";
import * as modifiche from "../mondo/modifiche.js";
import * as esplorato from "../regole/esplorato.js";
import { OGGETTO, TERRENO } from "../mondo/generazione.js";

const { SETTORE } = mappa;

// Due classi che il terreno non conosce: sulla carta il bosco non è erba e un
// muro non è pavimento. Stanno dopo gli identificatori del terreno.
const BOSCO = 20;
const MURO = 21;

// I colori della carta: piatti, uno per cosa, scelti perché si distinguano a
// colpo d'occhio. Non sono quelli del gioco, che sono screziati e vicini fra
// loro — l'erba e la sterpaglia, da lontano, erano lo stesso verde.
const CARTA = {
  [TERRENO.ACQUA]: "#2f5f8c",
  [TERRENO.ACQUA_BASSA]: "#5b95c2",
  [TERRENO.GHIACCIO]: "#cfe2ee",
  [TERRENO.SABBIA]: "#e3d29c",
  [TERRENO.ERBA]: "#86b56c",
  [TERRENO.STERPAGLIA]: "#bfb872",
  [TERRENO.ROCCIA]: "#9d9a92",
  [TERRENO.TERRA]: "#b08658",
  [BOSCO]: "#3f7a3c",
  [MURO]: "#4b3a2b",
};
// D'inverno la valle è sotto la neve anche sulla carta.
const CARTA_INVERNO = {
  ...CARTA,
  [TERRENO.SABBIA]: "#e7e0cb",
  [TERRENO.ERBA]: "#d3ddd6",
  [TERRENO.STERPAGLIA]: "#dcd8c6",
  [TERRENO.ROCCIA]: "#b7b5b0",
  [TERRENO.TERRA]: "#b9a58c",
  [BOSCO]: "#6f8f7c",
};

const FONDO = "#15171c";
const CHIARO = "#ece8dc";
const GRIGIO = "#a09b8e";
const CONTORNO = "#15171c";

// Quanti tasselli stanno nella larghezza della carta, per livello di zoom. Si
// conta in tasselli e non in pixel perché la carta abbia la stessa misura su
// ogni schermo: la finestra più grande la disegna più nitida, non più larga.
export const LIVELLI = [96, 192, 384];
const LIVELLO_INIZIALE = 1;
// Quanta carta si attraversa in un secondo tenendo premuto: metà della
// larghezza, e con Maiuscolo due volte e mezza tanto.
const VELOCITA = 0.5;
const CORSA = 2.5;

// I segni delle cose tue, come sulla minimappa: chi ha imparato che il giallo
// è un fuoco non deve reimpararlo qui.
const SEGNAPOSTI = {
  [OGGETTO.FALO_ACCESO]: "fuoco",
  [OGGETTO.FOCOLARE_ACCESO]: "fuoco",
  [OGGETTO.TORCIA_PIANTATA]: "fuoco",
  // Il cadavere: recuperare il proprio corpo è un viaggio, e un viaggio vuole
  // una destinazione segnata.
  [OGGETTO.CADAVERE]: "corpo",
  // La cassa e il letto: dove sta la tua roba e dove puoi dormire.
  [OGGETTO.CASSA]: "cassa",
  [OGGETTO.GIACIGLIO]: "letto",
  [OGGETTO.LETTO]: "letto",
};

// Le rovine e i luoghi hanno ognuno un segno suo. L'orto abbandonato è il più
// grande e il più acceso (da M7.18.31): è l'unico luogo a cui si torna ogni
// anno, per i semi.
const ORTO = "#8fd16a";
const POZZO = "#7fb6e0";
const LUOGO = "#d9a45f";
const ROVINA = "#c9b49a";
const FATTORIA = "#9db8ec";

// --- l'atlante dei settori ------------------------------------------------

// Un'immagine di 16x16 per settore visto, con accanto le classi da cui è
// fatta: al cambio di stagione si ridipingono i punti, senza ricalcolare il
// rumore.
const settori = new Map();
let inverno = false;
let ridipinture = 0;
let versione = 0;

function rgb(esadecimale) {
  const n = Number.parseInt(esadecimale.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function dipingi(voce) {
  const tavola = inverno ? CARTA_INVERNO : CARTA;
  const immagine = voce.pennello.createImageData(SETTORE, SETTORE);
  for (let i = 0; i < voce.classi.length; i += 1) {
    const [r, v, b] = rgb(tavola[voce.classi[i]] ?? tavola[TERRENO.ERBA]);
    immagine.data[i * 4] = r;
    immagine.data[i * 4 + 1] = v;
    immagine.data[i * 4 + 2] = b;
    immagine.data[i * 4 + 3] = 255;
  }
  voce.pennello.putImageData(immagine, 0, 0);
}

// Il mondo com'era generato, non com'è adesso: un albero abbattuto resta
// bosco sulla carta. È la regola di una carta vera, che dice com'era il posto
// quando qualcuno l'ha disegnata.
//
// Il bosco è una macchia e non un albero: un tassello è bosco se attorno, lui
// compreso, ci sono almeno tre alberi. Segnati uno per uno, gli alberi radi
// facevano un reticolo di righine che si leggeva come un disturbo.
const BOSCO_MINIMO = 3;

function disegnaSettore(sx, sy) {
  const chiave = `${sx},${sy}`;
  let voce = settori.get(chiave);
  if (!voce) {
    const tela = document.createElement("canvas");
    tela.width = SETTORE;
    tela.height = SETTORE;
    voce = { tela, pennello: tela.getContext("2d"), classi: new Int8Array(SETTORE * SETTORE) };
    settori.set(chiave, voce);
  }
  // Gli alberi con un tassello di bordo, per contare i vicini anche sul
  // confine del settore.
  const B = SETTORE + 2;
  const alberi = new Uint8Array(B * B);
  const oggetti = new Int16Array(B * B);
  for (let y = 0; y < B; y += 1) {
    for (let x = 0; x < B; x += 1) {
      const o = mappa.oggettoGenerato(sx * SETTORE + x - 1, sy * SETTORE + y - 1);
      oggetti[y * B + x] = o;
      alberi[y * B + x] = o === OGGETTO.ALBERO ? 1 : 0;
    }
  }
  for (let y = 0; y < SETTORE; y += 1) {
    for (let x = 0; x < SETTORE; x += 1) {
      const o = oggetti[(y + 1) * B + x + 1];
      let classe;
      if (o === OGGETTO.MURO || o === OGGETTO.MURO_ROTTO) classe = MURO;
      else {
        let vicini = 0;
        for (let dy = 0; dy < 3; dy += 1) for (let dx = 0; dx < 3; dx += 1) vicini += alberi[(y + dy) * B + x + dx];
        classe = vicini >= BOSCO_MINIMO ? BOSCO : mappa.terrenoDi(sx * SETTORE + x, sy * SETTORE + y);
      }
      voce.classi[y * SETTORE + x] = classe;
    }
  }
  gela(voce.classi);
  dipingi(voce);
  versione += 1;
}

// Il bassofondo gela d'inverno, sulla carta come nel mondo.
function gela(classi) {
  for (let i = 0; i < classi.length; i++) {
    if (inverno && classi[i] === TERRENO.ACQUA_BASSA) classi[i] = TERRENO.GHIACCIO;
    else if (!inverno && classi[i] === TERRENO.GHIACCIO) classi[i] = TERRENO.ACQUA_BASSA;
  }
}

// Al cambio di stagione: il bassofondo gela o si scioglie, e la neve copre
// l'erba. Si ridipinge tutto, senza toccare il rumore.
export function ridipingiSeServe(gelo) {
  if (typeof gelo === "boolean") inverno = gelo;
  for (const voce of settori.values()) {
    gela(voce.classi);
    dipingi(voce);
  }
  versione += 1;
  ridipinture += 1;
}

// I settori appena scoperti, come coppie sx,sy di seguito.
export function aggiungi(nuovi) {
  for (let i = 0; i < nuovi.length; i += 2) disegnaSettore(nuovi[i], nuovi[i + 1]);
}

// Tutto quello che risulta esplorato e non è ancora sulla carta. Serve al
// caricamento di una partita, dove i settori arrivano tutti insieme da un file.
export function aggiorna() {
  esplorato.perOgnuno((sx, sy) => {
    if (!settori.has(`${sx},${sy}`)) disegnaSettore(sx, sy);
  });
}

// Il mondo sotto è cambiato: un caricamento, un seme diverso.
export function dimentica() {
  settori.clear();
  versione += 1;
}

export function ridipinte() {
  return ridipinture;
}

// --- dove si guarda -------------------------------------------------------

// Il centro della carta in tasselli, e il livello di zoom. Fra un'apertura e
// l'altra resta solo lo zoom: la carta si riapre sempre su di te.
const vista = { x: 0, y: 0, livello: LIVELLO_INIZIALE };

export function apri(eroe) {
  vista.x = eroe.px / schermo.TASSELLO;
  vista.y = eroe.py / schermo.TASSELLO;
}

export function stato() {
  return { x: vista.x, y: vista.y, livello: vista.livello, tasselli: LIVELLI[vista.livello] };
}

// Il riquadro dell'esplorato, in tasselli: la carta non va oltre quello che
// hai visto, così non ci si perde nel buio.
function confini() {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  esplorato.perOgnuno((sx, sy) => {
    if (sx < minX) minX = sx;
    if (sy < minY) minY = sy;
    if (sx > maxX) maxX = sx;
    if (sy > maxY) maxY = sy;
  });
  if (minX === Infinity) return null;
  return { x0: minX * SETTORE, y0: minY * SETTORE, x1: (maxX + 1) * SETTORE, y1: (maxY + 1) * SETTORE };
}

// I tasti della carta, a ogni passo mentre è aperta. WASD e le frecce
// spostano, Maiuscolo corre, Q ed E cambiano lo zoom, la barra torna su di te.
export function naviga(passo, eroe) {
  if (comandi.appenaPremuto("allontana")) vista.livello = Math.min(LIVELLI.length - 1, vista.livello + 1);
  if (comandi.appenaPremuto("avvicina") || comandi.appenaPremuto("consuma")) {
    vista.livello = Math.max(0, vista.livello - 1);
  }
  if (comandi.appenaPremuto("usa") && eroe) apri(eroe);
  const { x, y } = comandi.direzione();
  const larghezza = LIVELLI[vista.livello];
  const veloce = comandi.attiva("corri") ? CORSA : 1;
  vista.x += x * larghezza * VELOCITA * veloce * passo;
  vista.y += y * larghezza * VELOCITA * veloce * passo;
}

// --- il canvas della carta ------------------------------------------------

// Un canvas suo, sopra quello del gioco e della stessa misura sullo schermo,
// ma con i pixel veri dello schermo: il gioco resta pixel art, la carta no.
let carta = null;

function preparaCarta() {
  if (carta) return carta;
  carta = document.createElement("canvas");
  carta.id = "carta";
  carta.setAttribute("aria-label", "La mappa di quello che hai visto");
  const scena = document.getElementById("scena") ?? document.body;
  scena.insertBefore(carta, document.getElementById("diagnostica"));
  return carta;
}

// Chiusa la mappa, la carta sparisce. Si chiama a ogni fotogramma in cui la
// mappa non c'è, ed è un confronto e basta.
export function nascondi() {
  if (carta && !carta.hidden) carta.hidden = true;
}

// --- i contorni -----------------------------------------------------------

// Il terreno si disegna a contorni e non a quadretti. Per ogni gruppo di
// quattro tasselli vicini si guarda quali sono di una certa classe e si
// riempie il pezzo di quadrato che le spetta, tagliando gli angoli a metà
// strada (i "marching squares"): i confini diventano linee con gli angoli
// smussati, e un albero da solo diventa un puntino invece di un quadretto.
//
// I vertici del quadrato: 0 alto sinistra, 1 alto destra, 2 basso destra,
// 3 basso sinistra; poi i punti a metà dei lati: 4 sopra, 5 destra, 6 sotto,
// 7 sinistra. Il numero del caso somma 8, 4, 2, 1 per i vertici dentro.
const PUNTI = [[0, 0], [1, 0], [1, 1], [0, 1], [0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]];
const PEZZI = [
  null, [7, 6, 3], [6, 5, 2], [7, 5, 2, 3], [4, 1, 5], [4, 1, 5, 6, 3, 7], [4, 1, 2, 6], [4, 1, 2, 3, 7],
  [0, 4, 7], [0, 4, 6, 3], [0, 4, 5, 2, 6, 7], [0, 4, 5, 2, 3], [0, 1, 5, 7], [0, 1, 5, 6, 3], [0, 1, 2, 6, 7], [0, 1, 2, 3],
];

// L'ordine in cui si stendono i colori: prima quello che sta sotto.
const STRATI = [TERRENO.STERPAGLIA, TERRENO.ROCCIA, TERRENO.SABBIA, TERRENO.ACQUA_BASSA, TERRENO.GHIACCIO,
  TERRENO.ACQUA, TERRENO.TERRA, BOSCO, MURO];

// La carta già disegnata, più grande della vista: spostandosi di poco si
// ritaglia da qui, e si ridisegna solo quando la vista ne esce o quando
// l'atlante cambia versione — un settore nuovo, una stagione nuova.
let cache = null;

function classeIn(tx, ty) {
  const sx = Math.floor(tx / SETTORE);
  const sy = Math.floor(ty / SETTORE);
  const voce = settori.get(`${sx},${sy}`);
  if (!voce) return -1;
  return voce.classi[(ty - sy * SETTORE) * SETTORE + (tx - sx * SETTORE)];
}

function costruisci(tx0, ty0, colonne, righe, perTassello, dpr) {
  // Le classi della regione, con un tassello in più attorno.
  const L = colonne + 2;
  const griglia = new Int8Array(L * (righe + 2));
  for (let y = 0; y < righe + 2; y += 1) {
    for (let x = 0; x < L; x += 1) griglia[y * L + x] = classeIn(tx0 - 1 + x, ty0 - 1 + y);
  }
  // Per ogni classe due tracciati: tutto quello che va riempito, e i soli
  // pezzi di bordo, che si ripassano. I quadrati pieni si uniscono in
  // strisce per riga: sono quasi tutta la carta. E i tracciati si scrivono
  // come testo, nella lingua dei tracciati SVG, e diventano un Path2D alla
  // fine in una volta sola: chiamare moveTo e lineTo per decine di migliaia
  // di pezzi costava due secondi, misurati, al primo disegno.
  const tracciati = new Map();
  const tracciato = (k) => {
    let t = tracciati.get(k);
    if (!t) tracciati.set(k, (t = { tutto: [], bordi: [] }));
    return t;
  };
  const lato = perTassello * dpr;
  const n = (v) => Math.round(v * 10) / 10;
  // Il centro del tassello (x, y) della griglia sta, in pixel della cache,
  // a (x - 0.5) * lato: la griglia comincia un tassello prima della regione.
  const pezzo = (t, caso, x, y) => {
    const indici = PEZZI[caso];
    const bx = (x - 0.5) * lato;
    const by = (y - 0.5) * lato;
    let d = "M" + n(bx + PUNTI[indici[0]][0] * lato) + " " + n(by + PUNTI[indici[0]][1] * lato);
    for (let i = 1; i < indici.length; i += 1) d += "L" + n(bx + PUNTI[indici[i]][0] * lato) + " " + n(by + PUNTI[indici[i]][1] * lato);
    d += "Z";
    t.tutto.push(d);
    t.bordi.push(d);
  };
  const striscia = (k, x0, x1, y) => {
    const sx = n((x0 - 0.5) * lato);
    const sy = n((y - 0.5) * lato);
    const ex = n((x1 - 0.5) * lato);
    const ey = n((y + 0.5) * lato);
    tracciato(k).tutto.push(`M${sx} ${sy}H${ex}V${ey}H${sx}Z`);
  };
  for (let y = 0; y < righe + 1; y += 1) {
    // Le strisce aperte: quella del visto e quella della classe.
    let vistoDa = -1;
    let classe = -2;
    let classeDa = -1;
    const chiudiClasse = (x) => {
      if (classeDa >= 0) striscia(classe, classeDa, x, y);
      classeDa = -1;
      classe = -2;
    };
    for (let x = 0; x < colonne + 1; x += 1) {
      const a = griglia[y * L + x];
      const b = griglia[y * L + x + 1];
      const c = griglia[(y + 1) * L + x + 1];
      const d = griglia[(y + 1) * L + x];
      // Il visto: sotto a tutto, con il colore dell'erba.
      const visto = (a >= 0 ? 8 : 0) | (b >= 0 ? 4 : 0) | (c >= 0 ? 2 : 0) | (d >= 0 ? 1 : 0);
      if (visto === 15) {
        if (vistoDa < 0) vistoDa = x;
      } else {
        if (vistoDa >= 0) striscia("visto", vistoDa, x, y);
        vistoDa = -1;
        if (visto) pezzo(tracciato("visto"), visto, x, y);
      }
      if (a === b && b === c && c === d && a >= 0 && a !== TERRENO.ERBA) {
        if (classe !== a) {
          chiudiClasse(x);
          classe = a;
          classeDa = x;
        }
        continue;
      }
      chiudiClasse(x);
      if (a === b && b === c && c === d) continue;
      for (const k of new Set([a, b, c, d])) {
        if (k < 0 || k === TERRENO.ERBA) continue;
        const caso = (a === k ? 8 : 0) | (b === k ? 4 : 0) | (c === k ? 2 : 0) | (d === k ? 1 : 0);
        pezzo(tracciato(k), caso, x, y);
      }
    }
    if (vistoDa >= 0) striscia("visto", vistoDa, colonne + 1, y);
    chiudiClasse(colonne + 1);
  }
  const tela = document.createElement("canvas");
  tela.width = Math.ceil(colonne * lato);
  tela.height = Math.ceil(righe * lato);
  const c = tela.getContext("2d");
  const tavola = inverno ? CARTA_INVERNO : CARTA;
  // Riempito e ripassato di un pixel dello stesso colore: fra due colori
  // vicini la sfumatura del bordo lascerebbe un filo del colore di sotto.
  const stendi = (t, colore) => {
    c.fillStyle = colore;
    c.strokeStyle = colore;
    c.lineWidth = Math.max(1, dpr * 0.8);
    c.fill(new Path2D(t.tutto.join("")));
    if (t.bordi.length) c.stroke(new Path2D(t.bordi.join("")));
  };
  if (tracciati.has("visto")) stendi(tracciati.get("visto"), tavola[TERRENO.ERBA]);
  for (const k of STRATI) if (tracciati.has(k)) stendi(tracciati.get(k), tavola[k]);
  return { tela, tx0, ty0, colonne, righe, perTassello, dpr, versione };
}

// --- il disegno -----------------------------------------------------------

// Il gioco sotto si limita a scurirsi; tutto il resto è sulla carta.
export function disegna(p, eroe) {
  p.fillStyle = FONDO;
  p.fillRect(0, 0, schermo.LARGHEZZA, schermo.ALTEZZA);
  if (typeof document === "undefined") return;

  const tela = preparaCarta();
  const riquadro = document.getElementById("quadro").getBoundingClientRect();
  const W = Math.round(riquadro.width);
  const H = Math.round(riquadro.height);
  const dpr = globalThis.devicePixelRatio || 1;
  if (tela.width !== Math.round(W * dpr) || tela.height !== Math.round(H * dpr)) {
    tela.width = Math.round(W * dpr);
    tela.height = Math.round(H * dpr);
  }
  tela.style.width = `${W}px`;
  tela.style.height = `${H}px`;
  tela.hidden = false;

  const c = tela.getContext("2d");
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  // L'unità: un pixel del gioco sullo schermo. Tutte le misure della carta
  // sono in questa unità, così la carta ha le stesse proporzioni ovunque.
  const u = W / schermo.LARGHEZZA;
  c.fillStyle = FONDO;
  c.fillRect(0, 0, W, H);

  const area = { x: 6 * u, y: 16 * u, w: W - 12 * u, h: H - 46 * u };
  titolo(c, u, W);

  if (esplorato.quanti() === 0) {
    scrivi(c, "NON HAI ANCORA VISTO NIENTE", W / 2, area.y + area.h / 2, 5 * u, GRIGIO, "center");
    legenda(c, u, W, H);
    return;
  }

  // Quanti pixel dello schermo per tassello, e il tassello in alto a sinistra.
  const perTassello = area.w / LIVELLI[vista.livello];
  tienDentro(area, perTassello);
  const sinistra = vista.x - area.w / 2 / perTassello;
  const sopra = vista.y - area.h / 2 / perTassello;
  const colonne = Math.ceil(area.w / perTassello) + 1;
  const righe = Math.ceil(area.h / perTassello) + 1;

  // La cache copre la vista con mezza vista di margine per lato.
  const fuori = !cache || cache.perTassello !== perTassello || cache.dpr !== dpr || cache.versione !== versione ||
    sinistra < cache.tx0 || sopra < cache.ty0 ||
    sinistra + colonne > cache.tx0 + cache.colonne || sopra + righe > cache.ty0 + cache.righe;
  if (fuori) {
    cache = costruisci(Math.floor(sinistra - colonne / 2), Math.floor(sopra - righe / 2), colonne * 2, righe * 2, perTassello, dpr);
  }

  c.save();
  c.beginPath();
  c.rect(area.x, area.y, area.w, area.h);
  c.clip();
  // Si ricopia a pixel interi dello schermo, così la carta resta nitida.
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.imageSmoothingEnabled = false;
  c.drawImage(cache.tela,
    Math.round((area.x + (cache.tx0 - sinistra) * perTassello) * dpr),
    Math.round((area.y + (cache.ty0 - sopra) * perTassello) * dpr));
  c.setTransform(dpr, 0, 0, dpr, 0, 0);

  const suCarta = (tx, ty) => ({
    x: area.x + (tx - sinistra) * perTassello,
    y: area.y + (ty - sopra) * perTassello,
  });
  const inVista = ({ x, y }) =>
    x > area.x - 40 * u && y > area.y - 20 * u && x < area.x + area.w + 40 * u && y < area.y + area.h + 20 * u;

  const nomi = [];
  luoghi(c, u, suCarta, inVista, nomi);

  modifiche.perOgnuno((tx, ty, cambio) => {
    const tipo = SEGNAPOSTI[cambio.oggetto];
    if (!tipo) return;
    if (!esplorato.eVisto(Math.floor(tx / SETTORE), Math.floor(ty / SETTORE))) return;
    const punto = suCarta(tx + 0.5, ty + 0.5);
    if (inVista(punto)) segno(c, tipo, punto.x, punto.y, u);
  });

  // La fattoria: dove comincia la partita e dove ricomincia un superstite.
  const fattoria = mappa.laFattoria();
  if (fattoria) {
    const punto = suCarta(fattoria.tx, fattoria.ty);
    if (inVista(punto)) {
      segno(c, "fattoria", punto.x, punto.y, u);
      nomi.push({ testo: "FATTORIA", x: punto.x, y: punto.y + 4.5 * u, colore: FATTORIA });
    }
  }

  // I nomi dopo i segni, così nessun segno copre una scritta; e solo da
  // vicino e a media distanza, perché da lontano si pesterebbero.
  if (vista.livello < 2) {
    for (const n of nomi) scrivi(c, n.testo, n.x, n.y, 3.3 * u, n.colore, "center", true);
  }

  // Tu per ultimo, e più grande di tutto: è l'unica cosa che si cerca sempre.
  const io = suCarta(eroe.px / schermo.TASSELLO, eroe.py / schermo.TASSELLO);
  freccia(c, io.x, io.y, eroe.guarda, u);
  c.restore();

  c.strokeStyle = "#3a3f48";
  c.lineWidth = Math.max(1, u / 2);
  c.strokeRect(area.x, area.y, area.w, area.h);

  // Se la carta si è spostata lontano da te, una freccia sul bordo dice da
  // che parte sei.
  if (io.x < area.x || io.y < area.y || io.x > area.x + area.w || io.y > area.y + area.h) {
    versoDiTe(c, io, area, u);
  }

  legenda(c, u, W, H);
}

// La vista non esce da quello che hai visto: se l'esplorato è più largo della
// carta ci si ferma al suo bordo, se è più stretto resta al centro.
function tienDentro(area, perTassello) {
  const c = confini();
  if (!c) return;
  const mezzaL = area.w / 2 / perTassello;
  const mezzaA = area.h / 2 / perTassello;
  const margine = SETTORE;
  const limita = (v, a, b, mezza) =>
    b - a + margine * 2 <= mezza * 2 ? (a + b) / 2 : Math.min(Math.max(v, a - margine + mezza), b + margine - mezza);
  vista.x = limita(vista.x, c.x0, c.x1, mezzaL);
  vista.y = limita(vista.y, c.y0, c.y1, mezzaA);
}

// Le rovine delle celle viste. Si passa per le celle e non per i tasselli: una
// cella è quattro settori per lato, quindi sono poche decine.
function luoghi(c, u, suCarta, inVista, nomi) {
  const celleViste = new Set();
  esplorato.perOgnuno((sx, sy) => {
    celleViste.add(`${Math.floor(sx * SETTORE / mappa.CELLA_ROVINE)},${Math.floor(sy * SETTORE / mappa.CELLA_ROVINE)}`);
  });
  for (const chiave of celleViste) {
    const [cx, cy] = chiave.split(",").map(Number);
    const trovata = mappa.rovinaNellaCella(cx, cy);
    if (!trovata) continue;
    // La fattoria porta con sé il suo orto (M7.18.36), che ha il segno suo;
    // lei ha il suo, disegnato a parte.
    for (const rovina of [trovata, trovata.annesso].filter(Boolean)) {
      if (rovina === trovata && trovata.annesso) continue;
      const tx = rovina.tx0 + rovina.larghezza / 2;
      const ty = rovina.ty0 + rovina.altezza / 2;
      // Una cella è più grande di un settore: si segna solo quello che si è
      // visto davvero.
      if (!esplorato.eVisto(Math.floor(tx / SETTORE), Math.floor(ty / SETTORE))) continue;
      const punto = suCarta(tx, ty);
      if (!inVista(punto)) continue;
      const tipo = rovina.luogo === "orto" ? "orto" : rovina.luogo === "pozzo" ? "pozzo" : rovina.luogo ? "luogo" : "rovina";
      segno(c, tipo, punto.x, punto.y, u);
      // Un orto visitato dice le sue piante (M7.18.40): due pallini accanto
      // al segno, a ogni zoom, e i nomi al posto di «orto abbandonato».
      const piante = tipo === "orto" && esplorato.ortoVisto(rovina) ? pianteDellOrto(rovina) : null;
      if (piante) {
        piante.forEach((pianta, i) => cerchio(c, punto.x + (4.6 + i * 3.8) * u, punto.y, 1.7 * u, PIANTE[pianta].colore));
        nomi.push({ testo: piante.map((pianta) => PIANTE[pianta].nome).join(" · "), x: punto.x, y: punto.y + 3.6 * u, colore: ORTO });
      } else if (rovina.nome) {
        const colore = tipo === "orto" ? ORTO : tipo === "pozzo" ? POZZO : LUOGO;
        nomi.push({ testo: rovina.nome.toUpperCase(), x: punto.x, y: punto.y + 3.6 * u, colore });
      }
    }
  }
}

// Le piante degli orti, con il loro colore sulla carta e il loro nome.
const PIANTE = {
  [OGGETTO.SPIGHE_SELVATICHE]: { colore: "#e8c547", nome: "GRANO" },
  [OGGETTO.LINO_SELVATICO]: { colore: "#8f9cf0", nome: "LINO" },
  [OGGETTO.PATATA_SELVATICA]: { colore: "#a0714a", nome: "PATATE" },
  [OGGETTO.FAGIOLI_SELVATICI]: { colore: "#e0584a", nome: "FAGIOLI" },
  [OGGETTO.CAVOLO_SELVATICO]: { colore: "#4fc0a8", nome: "CAVOLO" },
};

// Le due piante di un orto, prima fila e seconda: si leggono dal mondo sulla
// prima casella di ogni fila, quindi sono quelle del sorteggio di questa
// partita (M7.18.37), e per l'orto della fattoria fagioli e patate.
const FILE = [["s", "b"], ["u", "q"]];
export function pianteDellOrto(rovina) {
  const piante = FILE.map((segni) => {
    for (let y = 0; y < rovina.altezza; y += 1) {
      const x = [...rovina.pianta[y]].findIndex((segno) => segni.includes(segno));
      if (x >= 0) return mappa.oggettoGenerato(rovina.tx0 + x, rovina.ty0 + y);
    }
    return null;
  });
  return piante.every((pianta) => PIANTE[pianta]) ? piante : null;
}

// --- i segni --------------------------------------------------------------

function segno(c, tipo, x, y, u) {
  c.lineWidth = 0.8 * u;
  c.strokeStyle = CONTORNO;
  c.lineJoin = "round";
  if (tipo === "orto") {
    cerchio(c, x, y, 2.6 * u, ORTO);
    // Una foglia dentro: l'orto si riconosce anche senza i colori.
    c.fillStyle = "#2f6a1f";
    c.beginPath();
    c.moveTo(x - 1.3 * u, y + 1.3 * u);
    c.quadraticCurveTo(x - 1.3 * u, y - 1.3 * u, x + 1.3 * u, y - 1.3 * u);
    c.quadraticCurveTo(x + 1.3 * u, y + 1.3 * u, x - 1.3 * u, y + 1.3 * u);
    c.fill();
    return;
  }
  if (tipo === "pozzo") return cerchio(c, x, y, 2 * u, POZZO);
  if (tipo === "luogo") {
    c.beginPath();
    c.moveTo(x, y - 2.3 * u);
    c.lineTo(x + 2.3 * u, y);
    c.lineTo(x, y + 2.3 * u);
    c.lineTo(x - 2.3 * u, y);
    c.closePath();
    c.fillStyle = LUOGO;
    c.fill();
    c.stroke();
    return;
  }
  if (tipo === "rovina") return casetta(c, x, y, 1.8 * u, ROVINA);
  if (tipo === "fattoria") return casetta(c, x, y, 2.8 * u, FATTORIA);
  if (tipo === "fuoco") return cerchio(c, x, y, 1.5 * u, "#f2c14e");
  if (tipo === "cassa") return quadrato(c, x, y, 1.4 * u, "#d8bf8f");
  if (tipo === "letto") return quadrato(c, x, y, 1.4 * u, FATTORIA);
  if (tipo === "corpo") {
    c.lineWidth = 1.6 * u;
    croce(c, x, y, 1.8 * u);
    c.lineWidth = 0.8 * u;
    c.strokeStyle = "#e0705a";
    croce(c, x, y, 1.8 * u);
  }
}

function cerchio(c, x, y, r, colore) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = colore;
  c.fill();
  c.stroke();
}

function quadrato(c, x, y, r, colore) {
  c.fillStyle = colore;
  c.fillRect(x - r, y - r, r * 2, r * 2);
  c.strokeRect(x - r, y - r, r * 2, r * 2);
}

function casetta(c, x, y, r, colore) {
  c.beginPath();
  c.moveTo(x - r, y + r);
  c.lineTo(x - r, y - r * 0.2);
  c.lineTo(x, y - r * 1.1);
  c.lineTo(x + r, y - r * 0.2);
  c.lineTo(x + r, y + r);
  c.closePath();
  c.fillStyle = colore;
  c.fill();
  c.stroke();
}

function croce(c, x, y, r) {
  c.beginPath();
  c.moveTo(x - r, y - r);
  c.lineTo(x + r, y + r);
  c.moveTo(x + r, y - r);
  c.lineTo(x - r, y + r);
  c.stroke();
}

// Tu: una freccia bianca che punta dove guardi.
const ANGOLI = { destra: 0, giu: Math.PI / 2, sinistra: Math.PI, su: -Math.PI / 2 };

function freccia(c, x, y, guarda, u) {
  const r = 3.2 * u;
  c.save();
  c.translate(x, y);
  c.rotate(ANGOLI[guarda] ?? -Math.PI / 2);
  c.beginPath();
  c.moveTo(r, 0);
  c.lineTo(-r * 0.7, r * 0.75);
  c.lineTo(-r * 0.35, 0);
  c.lineTo(-r * 0.7, -r * 0.75);
  c.closePath();
  c.fillStyle = "#ffffff";
  c.strokeStyle = CONTORNO;
  c.lineWidth = u;
  c.lineJoin = "round";
  c.stroke();
  c.fill();
  c.restore();
}

function versoDiTe(c, io, area, u) {
  const cx = area.x + area.w / 2;
  const cy = area.y + area.h / 2;
  const a = Math.atan2(io.y - cy, io.x - cx);
  // Il punto del bordo in quella direzione, un po' dentro.
  const m = 5 * u;
  const k = Math.min(
    (area.w / 2 - m) / Math.max(Math.abs(Math.cos(a)), 1e-6),
    (area.h / 2 - m) / Math.max(Math.abs(Math.sin(a)), 1e-6),
  );
  c.save();
  c.translate(cx + Math.cos(a) * k, cy + Math.sin(a) * k);
  c.rotate(a);
  c.beginPath();
  c.moveTo(3 * u, 0);
  c.lineTo(-2 * u, 2.2 * u);
  c.lineTo(-2 * u, -2.2 * u);
  c.closePath();
  c.fillStyle = "#ffffff";
  c.strokeStyle = CONTORNO;
  c.lineWidth = u;
  c.stroke();
  c.fill();
  c.restore();
}

// --- le scritte -----------------------------------------------------------

const CARATTERE = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

function scrivi(c, testo, x, y, misura, colore, allineamento = "left", ombra = false) {
  c.font = `600 ${misura}px ${CARATTERE}`;
  c.textAlign = allineamento;
  c.textBaseline = "top";
  if (ombra) {
    c.lineWidth = misura * 0.3;
    c.strokeStyle = "rgb(12 13 16 / 0.85)";
    c.lineJoin = "round";
    c.strokeText(testo, x, y);
  }
  c.fillStyle = colore;
  c.fillText(testo, x, y);
}

function titolo(c, u, W) {
  scrivi(c, "QUELLO CHE HAI VISTO", 6 * u, 5 * u, 5 * u, CHIARO);
  const zoom = ["VICINO", "MEDIO", "LONTANO"][vista.livello];
  scrivi(c, `${esplorato.quanti()} SETTORI · ZOOM ${zoom}`, W - 6 * u, 5.8 * u, 3.6 * u, GRIGIO, "right");
}

// La legenda: VERDE ORTI, come diceva la riga dei tasti di prima, adesso con
// il segno accanto a ogni nome.
const VOCI_LEGENDA = [
  ["tu", "TU"], ["fattoria", "FATTORIA"], ["orto", "ORTO ABBANDONATO"], ["pozzo", "POZZO"],
  ["luogo", "ALTRI LUOGHI"], ["rovina", "CASA"], ["cassa", "CASSA"], ["letto", "LETTO"],
  ["fuoco", "FUOCO"], ["corpo", "IL TUO CORPO"],
];

function legenda(c, u, W, H) {
  const y = H - 26 * u;
  const misura = 3.2 * u;
  c.font = `600 ${misura}px ${CARATTERE}`;
  const passi = VOCI_LEGENDA.map(([, nome]) => 7 * u + c.measureText(nome).width + 5 * u);
  let x = (W - passi.reduce((a, b) => a + b, 0)) / 2;
  VOCI_LEGENDA.forEach(([tipo, nome], i) => {
    if (tipo === "tu") freccia(c, x + 3 * u, y + misura / 2, "destra", u * 0.8);
    else segno(c, tipo, x + 3 * u, y + misura / 2, u);
    scrivi(c, nome, x + 7 * u, y, misura, GRIGIO);
    x += passi[i];
  });
  // Sotto, i colori delle piante degli orti visitati.
  const yPiante = H - 19.5 * u;
  const vociPiante = Object.values(PIANTE);
  const passiPiante = vociPiante.map(({ nome }) => 5 * u + c.measureText(nome).width + 5 * u);
  let xp = (W - passiPiante.reduce((a, b) => a + b, 0)) / 2;
  c.lineWidth = 0.8 * u;
  c.strokeStyle = CONTORNO;
  vociPiante.forEach(({ colore, nome }, i) => {
    cerchio(c, xp + 2 * u, yPiante + misura / 2, 1.35 * u, colore);
    scrivi(c, nome, xp + 5 * u, yPiante, misura, GRIGIO);
    xp += passiPiante[i];
  });
  const tasti = "WASD / FRECCE  SPOSTA      MAIUSC  PIÙ VELOCE      Q / E  ZOOM      SPAZIO  TORNA A TE      TAB  CHIUDI";
  scrivi(c, tasti, W / 2, H - 12 * u, 3.2 * u, CHIARO, "center");
}

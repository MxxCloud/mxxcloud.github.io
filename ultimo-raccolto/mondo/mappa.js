// Mappa: catalogo dei tasselli, settori pre-disegnati, collisioni.
//
// Il mondo è infinito e calcolato (vedi generazione.js), ma ridisegnare 24x14
// tasselli pixel per pixel a ogni fotogramma sarebbe uno spreco: il terreno non
// cambia quasi mai. Quindi si lavora per settori di 16x16 tasselli, ognuno
// cotto una volta in un canvas da 256x256 e ridisegnato solo se qualcosa
// dentro di lui cambia. Ogni fotogramma copia i pochi settori inquadrati.

import * as schermo from "../motore/schermo.js";
import { impronta, semeDaTesto } from "../motore/casuale.js";
import { cuoci, mascherato, ruotato } from "../arte/sprite.js";
import * as terrenoArte from "../arte/sprite-terreno.js";
import * as oggettiArte from "../arte/sprite-oggetti.js";
import * as transizioniArte from "../arte/sprite-transizioni.js";
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

// --- transizioni ----------------------------------------------------------

// Chi invade chi. Senza un ordine, due tasselli affiancati si sfrangerebbero a
// vicenda e il confine tornerebbe a essere una linea, solo più sporca: il
// terreno più forte scavalca il bordo del più debole e mai il contrario.
//
// L'ordine si legge come natura. La vegetazione si riprende tutto, quindi
// l'erba sta in cima; la riva sfuma nell'acqua bassa e l'acqua bassa in quella
// profonda, quindi l'acqua sta in fondo.
const PRIORITA = {
  [TERRENO.ACQUA]: 0,
  [TERRENO.ACQUA_BASSA]: 1,
  [TERRENO.SABBIA]: 2,
  [TERRENO.ROCCIA]: 3,
  [TERRENO.TERRA]: 4,
  [TERRENO.STERPAGLIA]: 5,
  [TERRENO.ERBA]: 6,
};

// Nord, est, sud, ovest — in quest'ordine, che è anche l'ordine di rotazione.
// L'indice del lato è quindi direttamente il numero di quarti di giro da dare
// alla maschera, che esiste disegnata solo per il nord.
const LATI = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

// Le diagonali seguono lo stesso giro a partire da nord-ovest, così anche qui
// l'indice è il numero di quarti. I due lati adiacenti alla diagonale q sono
// q e (q + 3) % 4.
const DIAGONALI = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];

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

// Il settore si legge con un tassello di bordo per lato: per sfrangiare un
// tassello bisogna sapere cosa ha attorno, e i tasselli sul perimetro hanno
// vicini che appartengono al settore accanto. Senza il bordo la frangia si
// interromperebbe ogni sedici tasselli, disegnando la griglia dei settori.
const BORDO = 1;
const LATO_GRIGLIA = SETTORE + BORDO * 2;

// Una sola passata di terreni per settore invece di interrogarne nove per
// tassello: 324 valutazioni di rumore al posto di 2304.
function grigliaTerreni(sx, sy) {
  const griglia = new Int8Array(LATO_GRIGLIA * LATO_GRIGLIA);
  for (let y = 0; y < LATO_GRIGLIA; y += 1) {
    for (let x = 0; x < LATO_GRIGLIA; x += 1) {
      const tx = sx * SETTORE + x - BORDO;
      const ty = sy * SETTORE + y - BORDO;
      griglia[y * LATO_GRIGLIA + x] = terrenoIn(tx, ty, seme);
    }
  }
  return griglia;
}

// La variante si sceglie con l'impronta del tassello: stabile fra una
// ricottura e l'altra, altrimenti il prato cambierebbe disegno ogni volta che
// il settore esce e rientra dalla memoria. Serve sia al tassello di base sia a
// quello del vicino usato come sfrangiatura, perché la frangia deve sembrare
// un pezzo del vicino vero e non di un suo sosia.
function tasselloDi(tx, ty, terreno) {
  const varianti = CATALOGO[terreno].varianti;
  const quale = Math.floor(impronta(tx, ty, seme ^ 0x5bf03635) * varianti.length) % varianti.length;
  return cuoci(varianti[quale]);
}

// La maschera cambia da un tassello all'altro lungo lo stesso confine: con una
// sola frangia ripetuta, un bordo lungo si leggerebbe come una decalcomania.
function mascheraLato(tx, ty, quarti) {
  const forme = transizioniArte.LATO;
  const scelta = Math.floor(impronta(tx + quarti * 37, ty, seme ^ 0x2f1b3d77) * forme.length) % forme.length;
  return ruotato(cuoci(forme[scelta], transizioniArte.TAVOLOZZA_MASCHERA), quarti);
}

function mascheraAngolo(tx, ty, quarti) {
  const forme = transizioniArte.ANGOLO;
  const scelta = Math.floor(impronta(tx, ty + quarti * 37, seme ^ 0x7a5ce19b) * forme.length) % forme.length;
  return ruotato(cuoci(forme[scelta], transizioniArte.TAVOLOZZA_MASCHERA), quarti);
}

// Riusati a ogni tassello invece di essere riallocati: la cottura di un settore
// ne farebbe cinquecento oggetti usa e getta.
const viciniForti = new Set();
const perPrevalenza = [];

let tempoCottura = 0;
let settoriCotti = 0;
// Gli ultimi tempi, non solo la media: la media nasconde proprio la cosa che
// si sente, cioè quanto costa il singolo settore quando ci si cammina dentro.
const ultimiTempi = [];

function cuociSettore(sx, sy) {
  const inizio = performance.now();

  const canvas = document.createElement("canvas");
  canvas.width = LATO_SETTORE;
  canvas.height = LATO_SETTORE;
  const pennello = canvas.getContext("2d");
  pennello.imageSmoothingEnabled = false;

  const terreni = grigliaTerreni(sx, sy);
  const leggi = (x, y) => terreni[(y + BORDO) * LATO_GRIGLIA + (x + BORDO)];

  const oggetti = [];

  for (let y = 0; y < SETTORE; y += 1) {
    for (let x = 0; x < SETTORE; x += 1) {
      const tx = sx * SETTORE + x;
      const ty = sy * SETTORE + y;
      const terreno = leggi(x, y);

      pennello.drawImage(tasselloDi(tx, ty, terreno), x * TASSELLO, y * TASSELLO);
      sfrangia(pennello, leggi, x, y, tx, ty, terreno);

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

  const durata = performance.now() - inizio;
  tempoCottura += durata;
  settoriCotti += 1;
  ultimiTempi.push(durata);
  if (ultimiTempi.length > 12) ultimiTempi.shift();
  return { canvas, oggetti };
}

// Sovrappone al tassello appena disegnato le frange dei vicini più forti.
function sfrangia(pennello, leggi, x, y, tx, ty, terreno) {
  const mio = PRIORITA[terreno];

  viciniForti.clear();
  for (let q = 0; q < 4; q += 1) {
    const lato = leggi(x + LATI[q][0], y + LATI[q][1]);
    if (PRIORITA[lato] > mio) viciniForti.add(lato);
    const diagonale = leggi(x + DIAGONALI[q][0], y + DIAGONALI[q][1]);
    if (PRIORITA[diagonale] > mio) viciniForti.add(diagonale);
  }
  if (viciniForti.size === 0) return;

  // In ordine di prevalenza crescente, così quando due vicini diversi sono
  // entrambi più forti il più forte finisce sopra.
  perPrevalenza.length = 0;
  for (const vicino of viciniForti) perPrevalenza.push(vicino);
  perPrevalenza.sort((a, b) => PRIORITA[a] - PRIORITA[b]);

  const sinistra = x * TASSELLO;
  const alto = y * TASSELLO;

  for (const vicino of perPrevalenza) {
    for (let q = 0; q < 4; q += 1) {
      if (leggi(x + LATI[q][0], y + LATI[q][1]) !== vicino) continue;
      const tassello = tasselloDi(tx + LATI[q][0], ty + LATI[q][1], vicino);
      pennello.drawImage(mascherato(tassello, mascheraLato(tx, ty, q)), sinistra, alto);
    }

    for (let q = 0; q < 4; q += 1) {
      if (leggi(x + DIAGONALI[q][0], y + DIAGONALI[q][1]) !== vicino) continue;
      // L'angolo serve solo quando la diagonale tocca da sola. Se uno dei due
      // lati adiacenti è a sua volta più forte, la sua frangia copre già lo
      // spigolo, e aggiungere l'angolo raddoppierebbe lo spessore proprio lì.
      const adiacente = (q + 3) % 4;
      if (PRIORITA[leggi(x + LATI[q][0], y + LATI[q][1])] > mio) continue;
      if (PRIORITA[leggi(x + LATI[adiacente][0], y + LATI[adiacente][1])] > mio) continue;
      const tassello = tasselloDi(tx + DIAGONALI[q][0], ty + DIAGONALI[q][1], vicino);
      pennello.drawImage(mascherato(tassello, mascheraAngolo(tx, ty, q)), sinistra, alto);
    }
  }
}

// Misura di servizio: la cottura è l'unica cosa che avviene a scatti mentre si
// cammina, quindi è l'unica che può farsi sentire.
export function costoCottura() {
  return {
    settori: settoriCotti,
    medioMs: settoriCotti ? tempoCottura / settoriCotti : 0,
    ultimiMs: ultimiTempi.map((v) => +v.toFixed(2)),
  };
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
//
// La finestra di lavoro vera è una ventina di settori: al massimo sei
// inquadrati più l'anello che la precottura prepara attorno. Il raggio è più
// largo di così per non ributtare via un settore appena cucinato quando si
// cammina avanti e indietro sullo stesso confine.
const RAGGIO_MEMORIA = 3;
const SETTORI_MASSIMI = 30;

function potaSettori(sxCentro, syCentro) {
  if (settori.size <= SETTORI_MASSIMI) return;
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

// Cuoce in anticipo un settore appena fuori dall'inquadratura, al massimo uno
// per fotogramma.
//
// Da quando i tasselli si sfrangiano, cuocere un settore costa qualche
// millisecondo invece di una frazione. Non è molto, ma cadeva tutto nel
// fotogramma in cui si varca il confine di un settore — e in diagonale se ne
// varcano due insieme, che è abbastanza da far perdere un fotogramma proprio
// mentre ci si muove. Anticipando, quando ci si arriva è già pronto: il costo
// non sparisce, smette di essere uno scatto.
//
// Un settore per fotogramma e non tutti: cuocerne tre insieme ricrea lo
// stesso problema che si sta risolvendo.
export function precuociVicini() {
  const q = schermo.inquadratura();
  const primo = Math.floor(q.sinistra / LATO_SETTORE) - 1;
  const ultimo = Math.floor((q.destra - 1) / LATO_SETTORE) + 1;
  const sopra = Math.floor(q.sopra / LATO_SETTORE) - 1;
  const sotto = Math.floor((q.sotto - 1) / LATO_SETTORE) + 1;

  for (let sy = sopra; sy <= sotto; sy += 1) {
    for (let sx = primo; sx <= ultimo; sx += 1) {
      const k = chiave(sx, sy);
      if (settori.has(k)) continue;
      settori.set(k, cuociSettore(sx, sy));
      return true;
    }
  }
  return false;
}

export function settoriInMemoria() {
  return settori.size;
}

// Mappa: catalogo dei tasselli, settori pre-disegnati, collisioni.
//
// Il mondo è infinito e calcolato (vedi generazione.js), ma ridisegnare 24x14
// tasselli pixel per pixel a ogni fotogramma sarebbe uno spreco: il terreno non
// cambia quasi mai. Quindi si lavora per settori di 16x16 tasselli, ognuno
// cotto una volta in un canvas da 256x256 e ridisegnato solo se qualcosa
// dentro di lui cambia. Ogni fotogramma copia i pochi settori inquadrati.

import * as schermo from "../motore/schermo.js";
import { impronta, semeDaTesto } from "../motore/casuale.js";
import { cuoci, mascherato, ruotato, sovrapposto } from "../arte/sprite.js";
import * as terrenoArte from "../arte/sprite-terreno.js";
import * as oggettiArte from "../arte/sprite-oggetti.js";
import * as coseArte from "../arte/sprite-cose.js";
import * as ortoArte from "../arte/sprite-orto.js";
import * as transizioniArte from "../arte/sprite-transizioni.js";
import { TERRENO, OGGETTO, terrenoIn, oggettoIn, preparaRovine } from "./generazione.js";
import * as modifiche from "./modifiche.js";
import { TAVOLOZZA, TAVOLOZZA_BAGNATA } from "../arte/tavolozza.js";

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
  // "Fiorabile" dice soltanto che su questo terreno può crescere qualcosa di
  // piccolo. Quando — cioè in che stagione — non lo sa la mappa: glielo passa
  // dall'alto chi conosce il calendario.
  [TERRENO.ERBA]: { varianti: terrenoArte.ERBA, solido: false, fiorabile: true },
  [TERRENO.STERPAGLIA]: { varianti: terrenoArte.STERPAGLIA, solido: false, fiorabile: true },
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

  // Il falò acceso ferma: ci si cammina attorno, non dentro. Quello spento no
  // — è cenere, e restare bloccati da un mucchio di cenere sarebbe assurdo.
  [OGGETTO.FALO_ACCESO]: {
    fotogrammi: coseArte.FALO_ACCESO,
    solido: true,
    luce: { raggio: 64, intensita: 1 },
  },
  [OGGETTO.FALO_SPENTO]: { sprite: coseArte.FALO_SPENTO, solido: false },

  // Non ferma: ci si deve poter camminare sopra per sdraiarcisi, e comunque
  // un materasso per terra non è un ostacolo.
  [OGGETTO.GIACIGLIO]: { sprite: coseArte.GIACIGLIO_STESO, solido: false },

  // L'orto. Nessuno di questi ferma: ci si deve poter camminare in mezzo per
  // innaffiarlo. "Bagnabile" dice alla cottura di guardare se il tassello è
  // stato innaffiato e, in quel caso, di usare la tavolozza della terra
  // bagnata — stesso disegno, terreno più scuro.
  [OGGETTO.TERRA_ZAPPATA]: { sprite: ortoArte.TERRA_ZAPPATA, solido: false, bagnabile: true },
  [OGGETTO.SEMINATO]: { sprite: ortoArte.SEMINATO, solido: false, bagnabile: true },
  [OGGETTO.GERMOGLIO]: { sprite: ortoArte.GERMOGLIO, solido: false, bagnabile: true },
  [OGGETTO.CRESCIUTA]: { sprite: ortoArte.CRESCIUTA, solido: false, bagnabile: true },
  [OGGETTO.MATURA]: { sprite: ortoArte.MATURA, solido: false, bagnabile: true },

  // L'appassita non è bagnabile: innaffiare un morto non lo riporta indietro,
  // e lasciarla scurire come il resto dell'orto direbbe che si sta facendo
  // qualcosa di utile.
  [OGGETTO.APPASSITA]: { sprite: ortoArte.APPASSITA, solido: false },

  // Non ferma, e non potrebbe: un mucchio si raccoglie standoci davanti, ma
  // uno lasciato in mezzo a un passaggio stretto diventerebbe un muro che ti
  // sei costruito da solo.
  [OGGETTO.MUCCHIO]: { sprite: coseArte.MUCCHIO, solido: false, mucchio: true },

  // Il corpo del superstite di prima. Non ferma, e la ragione è la stessa del
  // mucchio ma più forte: si muore dove capita, e un cadavere caduto in un
  // passaggio stretto sarebbe un muro costruito dalla propria sfortuna.
  [OGGETTO.CADAVERE]: { sprite: coseArte.CADAVERE, solido: false },

  // I muri di chi c'era prima. Il muro ferma, le macerie no — ed è tutta la
  // differenza fra un ostacolo e una porta: si entra in una casa in rovina da
  // dove il muro è venuto giù.
  [OGGETTO.MURO]: { sprite: oggettiArte.MURO, solido: true },
  [OGGETTO.MURO_ROTTO]: { sprite: oggettiArte.MURO_ROTTO, solido: false },

  // Il banco ferma, come la cassa: sono le due cose che fanno di un prato un
  // posto, e un posto ha degli ingombri.
  [OGGETTO.BANCO]: { sprite: coseArte.BANCO, solido: true },

  // La cassa ferma, e deve: è un mobile. Camminarci dentro toglierebbe
  // l'unica cosa che la rende un posto invece di un oggetto — che sta lì,
  // ingombra, e bisogna girarci attorno per arrivare alla porta.
  [OGGETTO.CASSA]: { sprite: coseArte.CASSA, solido: true },

  // Una torcia piantata è luce fissa che costa molto meno di un falò, e non
  // ferma: è un bastone, ci si passa accanto.
  [OGGETTO.TORCIA_PIANTATA]: {
    fotogrammi: coseArte.TORCIA_PIANTATA,
    solido: false,
    luce: { raggio: 42, intensita: 0.85 },
  },
};

// Che disegno va sopra un mucchio. Lo registra dall'alto chi conosce il
// catalogo delle cose, perché qui sotto le regole non si importano mai: la
// mappa sa che su un tassello può esserci un mucchio, non che esiste una cosa
// che si chiama "legna".
let iconeMucchio = {};

export function registraIconeMucchio(icone) {
  iconeMucchio = icone;
}

// I disegni dei fiori da spargere sui terreni fiorabili, o niente. La mappa
// non sa cosa sia la primavera: sa che ogni tanto le viene detto di spargere
// questi, e ogni tanto di non spargere niente.
let fioritura = null;

export function impostaFioritura(fiori) {
  const nuova = fiori ?? null;
  if (nuova === fioritura) return false;
  fioritura = nuova;
  settori.clear();
  return true;
}

// Quanti tasselli fiorabili portano un fiore. Un quarto: più fitto sembra un
// giardino curato invece di una valle lasciata andare, più rado e la stagione
// non si vede attraversando lo schermo.
const QUOTA_FIORI = 0.25;

// Quanto in alto sta l'icona sul sacco: i due pixel di margine la centrano in
// larghezza, e la riga in meno la fa appoggiare invece che galleggiare.
const SCARTO_ICONA = [2, 1];

// Con che colori si cuoce il mondo adesso. Le stagioni sono una regola, e le
// regole non si importano da qui: la coppia arriva dall'alto e la mappa sa
// soltanto che esistono due tavolozze, una asciutta e una bagnata.
let tavolozzaMondo = TAVOLOZZA;
let tavolozzaMondoBagnata = TAVOLOZZA_BAGNATA;

export function impostaTavolozze(asciutta, bagnata) {
  if (asciutta === tavolozzaMondo && bagnata === tavolozzaMondoBagnata) return false;
  tavolozzaMondo = asciutta;
  tavolozzaMondoBagnata = bagnata;
  // Ogni settore cotto porta addosso i colori vecchi: si buttano tutti, e
  // vengono rifatti dalla stessa macchina che li fa la prima volta. È una
  // stangata in un fotogramma solo, e capita quattro volte in trentadue
  // giorni — misurata, non stimata: vedi costoCottura().
  settori.clear();
  return true;
}

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
  // Le rovine tengono una memoria per cella e un seme loro: cambiando valle va
  // buttata, altrimenti la valle nuova si troverebbe addosso le case della
  // vecchia.
  preparaRovine(seme);
}

// La rovina di una cella, per chi disegna la mappa grande. Il mondo la sa già
// — la maglia è in rovine.js — e passare di qui evita che l'interfaccia debba
// sapere che esiste un seme.
export { rovinaNellaCella, laFattoria } from "./generazione.js";
export { CELLA as CELLA_ROVINE } from "./rovine.js";

export function semeCorrente() {
  return { nome: nomeSeme, valore: seme };
}

// --- interrogazione del mondo ---------------------------------------------

export function terrenoDi(tx, ty) {
  return terrenoIn(tx, ty, seme);
}

// Le modifiche hanno sempre l'ultima parola sulla generazione: è il punto in
// cui il mondo smette di essere una funzione pura delle coordinate e comincia
// a ricordarsi di chi ci è passato.
export function oggettoDi(tx, ty) {
  const cambio = modifiche.di(tx, ty);
  if (cambio && cambio.oggetto !== undefined) return cambio.oggetto;
  return oggettoIn(tx, ty, seme, terrenoIn(tx, ty, seme));
}

// Cosa ci sarebbe su questo tassello se il giocatore non l'avesse mai
// toccato. È l'oggettoDi() senza l'ultima parola delle modifiche, e serve alla
// ricrescita: cosa può tornare lo decide la generazione, non cosa è stato
// tolto. Un tassello dove non c'era niente resta niente anche dopo averci
// posato e ripreso un mucchio.
export function oggettoGenerato(tx, ty) {
  return oggettoIn(tx, ty, seme, terrenoIn(tx, ty, seme));
}

// Annota qualcosa su un tassello senza toccare il disegno. Serve ai colpi
// intermedi: un albero a metà abbattimento è ancora lo stesso albero, e
// ricuocere duecentocinquantasei tasselli per aggiornare un contatore è
// spreco puro. Peggio: la ricottura ricrea gli oggetti da zero e cancella
// ogni stato temporaneo, quindi con l'invalidazione a ogni colpo l'albero
// colpito non potrebbe nemmeno tremare.
export function annotaTassello(tx, ty, cambio) {
  modifiche.imposta(tx, ty, cambio);
}

// Cambia un tassello e butta via il settore che lo conteneva, così alla
// prossima inquadratura viene ricotto con il mondo nuovo. Solo quel settore:
// un oggetto sta tutto dentro il suo tassello e non sfrangia i vicini.
export function cambiaTassello(tx, ty, cambio) {
  if (cambio === null) modifiche.rimuovi(tx, ty);
  else modifiche.imposta(tx, ty, cambio);
  settori.delete(chiave(Math.floor(tx / SETTORE), Math.floor(ty / SETTORE)));
}

// Butta via tutti i settori cotti. Serve a chi cambia il mondo in blocco —
// un caricamento — invece che un tassello per volta: cambiaTassello butta il
// settore giusto, ma rifarlo per mille modifiche vorrebbe dire buttarli tutti
// mille volte.
export function scordaSettori() {
  settori.clear();
}

// C'è qualcosa di acceso entro questo raggio di tasselli? Serve al freddo, e
// serve che sia una domanda sul mondo e non sull'inquadratura: lumiVisibili()
// risponderebbe quasi sempre uguale e ogni tanto no, perché dipende da dove
// sta la camera — cioè una regola di sopravvivenza decisa dal disegno.
export function luceVicina(tx, ty, raggio) {
  for (let dy = -raggio; dy <= raggio; dy += 1) {
    for (let dx = -raggio; dx <= raggio; dx += 1) {
      const oggetto = oggettoDi(tx + dx, ty + dy);
      if (oggetto !== OGGETTO.NESSUNO && CATALOGO_OGGETTI[oggetto].luce) return true;
    }
  }
  return false;
}

// C'è un banco da lavoro a portata di braccio?
//
// Si guarda il mondo e non l'inquadratura, per la stessa ragione per cui lo fa
// luceVicina: una regola di gioco decisa da dove sta la camera è una regola
// decisa dal disegno.
//
// Tre tasselli e non zero. "Davanti al banco" sarebbe stato più severo e più
// coerente con il fuoco, ma il fuoco si guarda mentre si cucina e il banco no:
// si gira per l'accampamento a raccogliere quello che serve, e doversi
// riallineare ogni volta sarebbe una tassa su un gesto che non ha niente da
// insegnare.
export function bancoVicino(tx, ty, raggio = 3) {
  for (let dy = -raggio; dy <= raggio; dy += 1) {
    for (let dx = -raggio; dx <= raggio; dx += 1) {
      if (oggettoDi(tx + dx, ty + dy) === OGGETTO.BANCO) return true;
    }
  }
  return false;
}

export function solidoIn(tx, ty) {
  const terreno = terrenoIn(tx, ty, seme);
  if (CATALOGO[terreno].solido) return true;
  const oggetto = oggettoDi(tx, ty);
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
  return cuoci(varianti[quale], tavolozzaMondo);
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
      fiorisci(pennello, tx, ty, terreno, x, y);

      const oggetto = oggettoDi(tx, ty);
      if (oggetto !== OGGETTO.NESSUNO) {
        const voce = CATALOGO_OGGETTI[oggetto];
        // Un tassello innaffiato si disegna con la terra scura: è la stessa
        // immagine cotta con un'altra tavolozza, non un secondo disegno.
        const bagnato = voce.bagnabile && modifiche.di(tx, ty)?.bagnato === true;
        const tavolozza = bagnato ? tavolozzaMondoBagnata : tavolozzaMondo;
        const fotogrammi = voce.fotogrammi
          ? voce.fotogrammi.map((f) => cuoci(f, tavolozza))
          : [cuoci(voce.sprite, tavolozza)];
        // Un mucchio è il sacco più l'icona di quello che contiene. Se
        // l'icona manca resta il sacco: un mucchio senza disegno si vede e si
        // raccoglie lo stesso, mentre un errore qui lo farebbe sparire.
        if (voce.mucchio) {
          const icona = iconeMucchio[modifiche.di(tx, ty)?.cosa];
          if (icona) fotogrammi[0] = sovrapposto(fotogrammi[0], cuoci(icona), ...SCARTO_ICONA);
        }
        const sprite = fotogrammi[0];
        oggetti.push({
          tipo: oggetto,
          tx,
          ty,
          fotogrammi,
          sprite,
          // Ancorato ai piedi: lo sprite è più alto del tassello e cresce
          // verso l'alto, com'è ovvio per un albero e per niente ovvio per il
          // disegno, che parte dall'angolo in alto a sinistra.
          x: tx * TASSELLO,
          y: (ty + 1) * TASSELLO - sprite.height,
          base: (ty + 1) * TASSELLO,
          // La luce esce dalla fiamma, non dal centro geometrico dello
          // sprite: qualche pixel più in alto dei piedi.
          luce: voce.luce
            ? { x: tx * TASSELLO + TASSELLO / 2, y: (ty + 1) * TASSELLO - 9, ...voce.luce }
            : null,
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

// Sparge un fiore sul tassello, se è di quelli che fioriscono e se le sue
// coordinate lo vogliono.
//
// Quale fiore e dove cade li decidono le coordinate, come tutto il resto del
// mondo: lo stesso tassello ha lo stesso fiore nello stesso punto, sempre.
// Serve a due cose insieme — il settore ricotto non cambia aspetto, e il prato
// non è un reticolo. Una prima versione metteva i fiori dentro i tasselli
// stessi, e cadevano tutti allo stesso punto dentro il loro tassello: si
// vedeva la griglia da sedici pixel a occhio nudo.
function fiorisci(pennello, tx, ty, terreno, x, y) {
  if (!fioritura || !CATALOGO[terreno].fiorabile) return;
  if (impronta(tx, ty, seme ^ 0x1d7f3ab5) >= QUOTA_FIORI) return;

  const quale = fioritura[
    Math.floor(impronta(tx + 13, ty - 29, seme ^ 0x6ad91c37) * fioritura.length) % fioritura.length
  ];
  const cotto = cuoci(quale, tavolozzaMondo);
  // Dentro il tassello, con un margine che tiene il fiore lontano dai bordi:
  // un fiore a cavallo di due tasselli si spezza, perché i settori si cuociono
  // uno per volta.
  const spazioX = TASSELLO - cotto.width - 2;
  const spazioY = TASSELLO - cotto.height - 2;
  const dx = 1 + Math.floor(impronta(tx - 7, ty + 41, seme ^ 0x2be4f019) * spazioX);
  const dy = 1 + Math.floor(impronta(tx + 61, ty + 5, seme ^ 0x51c0a7d3) * spazioY);
  pennello.drawImage(cotto, x * TASSELLO + dx, y * TASSELLO + dy);
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
const lumiInquadrati = [];

// Le luci accese dentro l'inquadratura, riempite insieme agli oggetti: chi
// disegna l'oscurità le ritrova già pronte senza ripercorrere i settori.
export function lumiVisibili() {
  return lumiInquadrati;
}

export function disegnaTerreno(fotogramma = 0) {
  const q = schermo.inquadratura();
  const primo = Math.floor(q.sinistra / LATO_SETTORE);
  const ultimo = Math.floor((q.destra - 1) / LATO_SETTORE);
  const sopra = Math.floor(q.sopra / LATO_SETTORE);
  const sotto = Math.floor((q.sotto - 1) / LATO_SETTORE);

  oggettiInquadrati.length = 0;
  lumiInquadrati.length = 0;

  for (let sy = sopra; sy <= sotto; sy += 1) {
    for (let sx = primo; sx <= ultimo; sx += 1) {
      const s = settore(sx, sy);
      schermo.disegna(s.canvas, sx * LATO_SETTORE, sy * LATO_SETTORE);
      for (const oggetto of s.oggetti) {
        if (!schermo.visibile(oggetto.x, oggetto.y, oggetto.sprite.width, oggetto.sprite.height)) continue;
        if (oggetto.fotogrammi.length > 1) {
          oggetto.sprite = oggetto.fotogrammi[fotogramma % oggetto.fotogrammi.length];
        }
        oggettiInquadrati.push(oggetto);
        if (oggetto.luce) lumiInquadrati.push(oggetto.luce);
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

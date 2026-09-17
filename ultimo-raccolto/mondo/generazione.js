// Generazione della valle.
//
// Il mondo non viene creato: viene calcolato. Ogni tassello è una funzione
// pura delle sue coordinate e del seme, quindi non esistono confini, non c'è
// nulla da generare in anticipo e camminare in una direzione qualsiasi non
// costa più che restare fermi.
//
// È anche ciò che rende il salvataggio piccolo, quando arriverà: basterà
// memorizzare i tasselli che il giocatore ha cambiato, perché tutti gli altri
// si riottengono da qui identici.

import { impronta, rumoreFrattale } from "../motore/casuale.js";
import * as rovine from "./rovine.js";

export const TERRENO = {
  ACQUA: 0,
  ACQUA_BASSA: 1,
  SABBIA: 2,
  ERBA: 3,
  STERPAGLIA: 4,
  ROCCIA: 5,
  TERRA: 6,
};

// Gli ultimi due non li genera nessuno: li posa il giocatore, e vivono nelle
// modifiche (vedi modifiche.js). Stanno qui lo stesso perché OGGETTO è il
// vocabolario di cosa può esserci su un tassello, non l'elenco di cosa sa
// produrre la generazione.
export const OGGETTO = {
  NESSUNO: 0,
  ALBERO: 1,
  SASSO: 2,
  CESPUGLIO: 3,
  FALO_ACCESO: 4,
  FALO_SPENTO: 5,
  TORCIA_PIANTATA: 6,
  GIACIGLIO: 7,
  TERRA_ZAPPATA: 8,
  SEMINATO: 9,
  GERMOGLIO: 10,
  CRESCIUTA: 11,
  MATURA: 12,
  // Un mucchio per terra: roba tolta dallo zaino, o avanzata da un raccolto
  // che non ci stava. Cosa contiene e quanto non sta qui ma nelle modifiche,
  // perché sarebbero centoventi identificatori invece di uno.
  MUCCHIO: 13,
  // Quello che resta di una coltura presa dall'inverno, o lasciata matura
  // troppo a lungo. Non è un quinto stadio: è la fine di quella strada.
  APPASSITA: 14,
  // Il superstite di prima, con addosso quello che portava. Come il mucchio,
  // quello che contiene sta nelle modifiche: qui c'è solo "su questo tassello
  // c'è un corpo".
  CADAVERE: 15,
  // La cassa. Come il mucchio e il cadavere, quello che contiene non sta qui
  // ma nelle modifiche: qui c'è solo "su questo tassello c'è una cassa".
  CASSA: 16,
  // Gli ultimi due invece li posa la generazione, ed è la prima volta: sono i
  // muri delle case di chi c'era prima. Fin qui il mondo generato era soltanto
  // natura — albero, sasso, cespuglio — e il gioco apriva dicendo "un paese
  // abbandonato da saccheggiare" mostrando una valle in cui non era mai
  // crollato niente.
  MURO: 17,
  MURO_ROTTO: 18,
  // Il banco da lavoro. Torna a essere una cosa che posa il giocatore, ed è
  // la prima che gli dà un privilegio: certe cose si fanno solo qui.
  BANCO: 19,
  // La porta, nei suoi due stati. Sono due oggetti e non un oggetto con una
  // bandierina per la ragione per cui i quattro stadi dell'orto sono quattro
  // oggetti: quello che sta su un tassello è un identificatore, e la cottura
  // dei settori guarda quello. Una porta che cambia disegno senza cambiare
  // identificatore sarebbe una porta che si apre e resta chiusa a vedersi.
  PORTA: 20,
  PORTA_APERTA: 21,
};

// Le soglie non sono state scelte a occhio: vengono dai percentili misurati
// sul rumore vero (vedi il commento sulle proporzioni qui sotto). Cambiare la
// scala o il numero di ottave sposta la distribuzione e obbliga a rimisurarle.
//
// Proporzioni attese: 8% acqua, 4% bassofondo, 4% riva, 76% praterie, 8%
// roccia. Delle praterie, il 40% è andato a seme. I percentili sono misurati su
// quattro semi diversi, non su uno solo: una valle fortunata non fa una regola.
const QUOTA_ACQUA = 0.3358;
const QUOTA_BASSOFONDO = 0.3602;
const QUOTA_RIVA = 0.3793;
const QUOTA_ROCCIA = 0.6885;
const UMIDITA_ERBA = 0.4583;

// Le scale sono in tasselli, e sono tarate sull'inquadratura: lo schermo ne
// mostra 24, quindi una collina larga 22 si attraversa in uno schermo scarso e
// il paesaggio cambia mentre si cammina. Scale molto più grandi davano regioni
// uniformi larghe il doppio della visuale, cioè un paesaggio che non cambia mai.
const SCALA_QUOTA = 22;
const SCALA_UMIDITA = 14;
const SCALA_BOSCO = 10;

// Semi derivati: usare lo stesso seme per strati diversi li farebbe coincidere,
// e i boschi crescerebbero esattamente sulle colline.
const scarto = (seme, n) => (seme + Math.imul(n, 0x9e3779b9)) >>> 0;

// Un disturbo a grana fine sommato alla quota prima di confrontarla con le
// soglie. Senza, i confini fra terreni seguono esattamente le curve di livello
// del rumore: linee lunghe e lisce che si leggono subito come generate. Con il
// disturbo il margine del bosco si sfrangia e la riva si sfrastaglia, che è
// come si comportano i margini veri.
//
// L'ampiezza è tarata sulla distanza fra le soglie (circa 0,02): abbastanza da
// spezzare il bordo, non tanto da sciogliere in coriandoli le fasce sottili
// della sabbia e del bassofondo.
const DISTURBO = 0.03;
const SCALA_DISTURBO = 4;

export function quotaIn(x, y, seme) {
  const base = rumoreFrattale(x / SCALA_QUOTA, y / SCALA_QUOTA, scarto(seme, 1), 5);
  const frangia = rumoreFrattale(x / SCALA_DISTURBO, y / SCALA_DISTURBO, scarto(seme, 7), 2) - 0.5;
  return base + frangia * DISTURBO;
}

// Il terreno che dice il rumore, senza sapere niente delle rovine.
//
// Esiste separato per una ragione che non è estetica: decidere se una cella
// può ospitare una casa vuol dire guardare il terreno sotto la pianta, e se
// quella domanda passasse da terrenoIn() — che le rovine le consulta — si
// chiamerebbero a vicenda per sempre. La ricorsione si spezza qui, e questo
// commento c'è perché è il tipo di trappola in cui si ricasca rileggendo.
function terrenoDelRumore(x, y, seme) {
  const quota = quotaIn(x, y, seme);
  if (quota < QUOTA_ACQUA) return TERRENO.ACQUA;
  if (quota < QUOTA_BASSOFONDO) return TERRENO.ACQUA_BASSA;
  if (quota < QUOTA_RIVA) return TERRENO.SABBIA;
  if (quota > QUOTA_ROCCIA) return TERRENO.ROCCIA;

  const umidita =
    rumoreFrattale(x / SCALA_UMIDITA, y / SCALA_UMIDITA, scarto(seme, 2), 3) +
    (rumoreFrattale(x / SCALA_DISTURBO, y / SCALA_DISTURBO, scarto(seme, 8), 2) - 0.5) * DISTURBO * 2;
  return umidita > UMIDITA_ERBA ? TERRENO.ERBA : TERRENO.STERPAGLIA;
}

// --- le rovine ------------------------------------------------------------

// Il seme con cui rispondere ad "adatto". Si tiene da parte invece di
// passarlo a ogni chiamata perché quella domanda attraversa tre file — qui,
// rovine.js e di nuovo qui — e trascinarselo dietro avrebbe voluto dire un
// parametro in più in ognuno, per un valore che durante una partita non cambia.
let semeDelleRovine = 0;

// Ci si costruisce dove non c'è acqua. La roccia va benissimo — ci si
// costruisce sopra da sempre — e così la sabbia: l'unica cosa che esclude una
// casa è starci dentro un lago.
function adatto(tx, ty) {
  const terreno = terrenoDelRumore(tx, ty, semeDelleRovine);
  return terreno !== TERRENO.ACQUA && terreno !== TERRENO.ACQUA_BASSA;
}

export function preparaRovine(seme) {
  semeDelleRovine = seme;
  rovine.inizializza(seme);
}

// Cosa c'è di costruito su questo tassello, o null. Il carattere della pianta
// arriva da rovine.js, che di muri e casse non sa niente: il vocabolario dei
// tasselli vive qui, e la traduzione va fatta dove vive.
const PAVIMENTO = TERRENO.TERRA;
const COSTRUITO = {
  "#": OGGETTO.MURO,
  "%": OGGETTO.MURO_ROTTO,
  ".": OGGETTO.NESSUNO,
  c: OGGETTO.CASSA,
  f: OGGETTO.FALO_SPENTO,
};

export function rovinaNellaCella(cx, cy) {
  return rovine.nellaCella(cx, cy, adatto);
}

// Dove comincia la partita: la fattoria, non l'origine delle coordinate.
export function laFattoria() {
  return rovine.laFattoria(adatto);
}

// Il pavimento delle rovine è TERRENO.TERRA, che esisteva da sempre — sprite,
// tinta, voce di catalogo, ed è persino zappabile — e non lo produceva
// nessuno. Era un terreno in attesa di un motivo, e questo è il motivo.
export function terrenoIn(x, y, seme) {
  if (rovine.tasselloDi(x, y, adatto) !== null) return PAVIMENTO;
  return terrenoDelRumore(x, y, seme);
}

export function oggettoIn(x, y, seme, terreno) {
  // Le rovine vengono prima di tutto: dentro una casa non cresce un albero, e
  // lasciando decidere prima alla natura ci sarebbe cresciuto — il pavimento è
  // TERRA, che non produce niente, ma un muro deve poter stare anche dove il
  // rumore avrebbe messo un bosco.
  const segno = rovine.tasselloDi(x, y, adatto);
  if (segno !== null) return COSTRUITO[segno] ?? OGGETTO.NESSUNO;

  const sorte = impronta(x, y, scarto(seme, 3));

  if (terreno === TERRENO.ERBA) {
    // La densità degli alberi segue un rumore proprio: senza, gli alberi si
    // spargerebbero uniformi e non esisterebbero né boschi né radure — cioè
    // non esisterebbe nessun posto dove valga la pena andare.
    const bosco = rumoreFrattale(x / SCALA_BOSCO, y / SCALA_BOSCO, scarto(seme, 4), 3);
    const densita = Math.max(0, (bosco - 0.42) * 2.2);
    if (sorte < densita) return OGGETTO.ALBERO;
    if (sorte > 0.97) return OGGETTO.CESPUGLIO;
    return OGGETTO.NESSUNO;
  }

  if (terreno === TERRENO.STERPAGLIA) {
    if (sorte < 0.05) return OGGETTO.CESPUGLIO;
    if (sorte > 0.993) return OGGETTO.SASSO;
    return OGGETTO.NESSUNO;
  }

  if (terreno === TERRENO.ROCCIA && sorte < 0.08) return OGGETTO.SASSO;
  if (terreno === TERRENO.SABBIA && sorte > 0.99) return OGGETTO.SASSO;

  return OGGETTO.NESSUNO;
}

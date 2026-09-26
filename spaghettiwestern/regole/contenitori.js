// Le casse: il primo posto tuo che non sia il terreno.
//
// Fino a qui il ripostiglio era la valle. Si gettava per terra e restava lì
// per sempre, perché non c'era altro: è il motivo per cui il cibo non si
// guastava da nessuna parte, e il README lo diceva chiaro — far marcire la
// roba mentre il terreno è una dispensa eterna insegna soltanto a usare il
// terreno come dispensa. La cassa è la metà mancante di quel patto.
//
// Una cassa tiene le cose esattamente come le tiene lo zaino, quindi non
// reimplementa l'impilamento: chiama mettiIn() e spazioIn() di inventario.js,
// che lavorano su una fila di caselle qualsiasi. Quello che c'è qui dentro è
// soltanto dove sta quella fila — dentro le modifiche del tassello, come la
// roba di un cadavere e il contenuto di un mucchio.

import { OGGETTO } from "../mondo/generazione.js";
import { impronta, generatore } from "../motore/casuale.js";
import * as mappa from "../mondo/mappa.js";
import * as modifiche from "../mondo/modifiche.js";
import { CATALOGO } from "./oggetti.js";
import * as inventario from "./inventario.js";

// Dodici caselle contro le otto dello zaino. Una cassa deve valere il viaggio
// — otto e otto avrebbe voluto dire svuotare lo zaino e non poterci mettere
// nient'altro — ma non tanto da rendere lo spazio una domanda risolta: tre
// file da quattro si guardano tutte insieme, e sono una stagione di scorte,
// non un magazzino.
export const CASELLE = 12;

// Quanto più lentamente si guasta quello che sta in una cassa.
//
// Rallenta e non ferma, ed è la decisione che regge tutta la tappa. Una cassa
// che ferma il tempo è una ghiacciaia: metti via il raccolto d'autunno e
// l'inverno smette di essere un problema, cioè si toglie la cosa che le
// stagioni erano venute a portare. Rallentando, la domanda resta la stessa e
// cambia solo di scala — le bacche passano da tre giorni a nove, che è quasi
// una stagione, e le bacche secche da dieci a un mese di gioco.
export const RALLENTA = 3;

function vuote() {
  return new Array(CASELLE).fill(null);
}

// --- quello che avevano lasciato dentro -----------------------------------

// Il bottino di una cassa che era già lì.
//
// Non sta scritto da nessuna parte finché nessuno la apre: è una funzione
// delle coordinate e del seme, come il terreno. **Una valle piena di rovine
// mai visitate pesa zero byte**, ed è la stessa proprietà per cui una partita
// con seicento settori esplorati pesa duemilaseicento byte di mappa. Al primo
// prelievo si scrive una modifica, e da lì in poi è una cassa come le altre.
//
// Roba che esiste già e niente di nuovo: questa tappa porta il posto, non
// un'economia. I pesi guardano a quanto costa fare una cosa da sé — una benda
// sono tre fibre, un'ascia è un viaggio — perché il senso di frugare una casa
// è trovarsi in mano qualcosa che non avevi voglia di costruire.
const BOTTINO = [
  { cosa: "pietra", da: 2, a: 6, peso: 3 },
  { cosa: "fibra", da: 2, a: 6, peso: 3 },
  { cosa: "legna", da: 2, a: 5, peso: 3 },
  { cosa: "semi", da: 2, a: 4, peso: 2 },
  // Da M7.17 le case sono il posto dove si trovano i semi che i cespugli non
  // danno: il cavolo e il lino erano dell'orto di qualcuno, non della valle.
  { cosa: "semi_cavolo", da: 2, a: 3, peso: 2 },
  { cosa: "semi_lino", da: 2, a: 3, peso: 2 },
  // E da M7.18.25 il grano, che chi teneva le galline teneva da parte.
  { cosa: "grano", da: 2, a: 4, peso: 2 },
  { cosa: "benda", da: 1, a: 2, peso: 2 },
  { cosa: "bacche_secche", da: 2, a: 5, peso: 2 },
  { cosa: "torcia", da: 1, a: 2, peso: 2 },
  { cosa: "secchio", da: 1, a: 1, peso: 1 },
  { cosa: "ascia", da: 1, a: 1, peso: 1 },
  { cosa: "zappa", da: 1, a: 1, peso: 1 },
];

// Quello che resta nelle casse della fattoria da cui si comincia.
//
// Materiali e basta: nessun attrezzo. Non è avarizia, è la sola cosa che
// regge il racconto e il gioco insieme. Chi se n'è andato di casa propria si è
// portato via l'ascia e la zappa — quello che resta è la roba che non valeva
// il viaggio — e dall'altra parte l'inizio di questo gioco è "raccogli
// abbastanza da farti un'ascia": trovarne una posata nel primo minuto lo
// toglierebbe di mezzo per sempre.
//
// I semi sì, e sono il regalo vero: davanti alla fattoria c'è il campo di
// qualcun altro, già terra battuta, e i semi lo rendono un campo tuo prima
// ancora di aver trovato una zappa.
//
// E le patate, che in una fattoria si tengono in cantina: sono la coltura che
// si ripianta dal raccolto, quindi chi le trova qui ha già il suo orto di
// scorta — se non se le mangia.
const BOTTINO_FATTORIA = [
  { cosa: "fibra", da: 2, a: 5, peso: 3 },
  { cosa: "legna", da: 2, a: 4, peso: 3 },
  { cosa: "semi", da: 2, a: 4, peso: 3 },
  { cosa: "patata", da: 2, a: 3, peso: 3 },
  { cosa: "pietra", da: 1, a: 3, peso: 2 },
  { cosa: "bacche_secche", da: 1, a: 3, peso: 1 },
];

// Scorte piccole e legate al posto, non altre casse ricche come quelle delle
// case. Nessuna carne fresca dimenticata da anni, attrezzi sempre già usati.
const BOTTINO_LUOGHI = {
  // I fagioli sono il cibo di chi viaggia — secchi, leggeri, durano — e si
  // trovano dove viaggiava qualcuno: nel carro e nell'accampamento.
  carro: [
    { cosa: "fibra", da: 2, a: 4, peso: 3 },
    { cosa: "legna", da: 1, a: 3, peso: 3 },
    { cosa: "fagioli", da: 2, a: 3, peso: 2 },
    { cosa: "benda", da: 1, a: 1, peso: 1 },
  ],
  pozzo: [
    { cosa: "secchio", da: 1, a: 1, peso: 2 },
    { cosa: "fibra", da: 2, a: 3, peso: 3 },
    { cosa: "pietra", da: 1, a: 2, peso: 1 },
  ],
  bruciato: [
    { cosa: "fibra", da: 1, a: 3, peso: 3 },
    { cosa: "benda", da: 1, a: 1, peso: 2 },
    { cosa: "fagioli", da: 1, a: 2, peso: 2 },
    { cosa: "conserva", da: 1, a: 1, peso: 1 },
  ],
  boscaioli: [
    { cosa: "legna", da: 2, a: 4, peso: 4 },
    { cosa: "ramo", da: 2, a: 3, peso: 3 },
    { cosa: "ascia", da: 1, a: 1, peso: 1 },
  ],
  // L'orto abbandonato ha i semi di chi lo coltivava: la rapa, e ogni tanto
  // un cavolo o qualche patata.
  orto: [
    { cosa: "semi", da: 2, a: 4, peso: 4 },
    { cosa: "semi_cavolo", da: 2, a: 3, peso: 2 },
    { cosa: "patata", da: 1, a: 2, peso: 2 },
    { cosa: "grano", da: 2, a: 3, peso: 2 },
    { cosa: "fibra", da: 2, a: 3, peso: 2 },
    { cosa: "zappa", da: 1, a: 1, peso: 1 },
  ],
};

// Quanto ne resta a un attrezzo lasciato lì da qualcun altro. Dal generatore
// della cassa e non da un tiro nuovo, come tutto il resto del bottino: la
// stessa cassa dà sempre la stessa ascia, con la stessa lena dentro.
function usiTrovati(cosa, caso) {
  const durata = CATALOGO[cosa]?.durata;
  if (durata === undefined) return undefined;
  return Math.max(1, Math.round(durata * (0.3 + caso() * 0.35)));
}

const pesoDi = (tavola) => tavola.reduce((somma, v) => somma + v.peso, 0);
const PESO_TOTALE = pesoDi(BOTTINO);

function pesca(caso, tavola, totale) {
  let tiro = caso() * totale;
  for (const voce of tavola) {
    tiro -= voce.peso;
    if (tiro <= 0) return voce;
  }
  return tavola[0];
}

// Questa cassa sta dentro la fattoria da cui si comincia?
function dellaFattoria(tx, ty) {
  const f = mappa.laFattoria();
  if (!f) return false;
  return tx >= f.tx0 && ty >= f.ty0 && tx < f.tx0 + f.larghezza && ty < f.ty0 + f.altezza;
}

// Da una a tre pile. Mai vuota: una casa attraversata per venire a trovare una
// cassa vuota insegna a non entrare più, e il viaggio deve pagare sempre
// qualcosa — poco, ma qualcosa.
const PILE = [1, 3];

function bottinoDi(tx, ty) {
  const fila = vuote();
  // Un generatore seminato sulle coordinate: la stessa cassa dà sempre lo
  // stesso bottino, e due casse vicine no. In questo gioco Math.random non
  // esiste, e qui la regola paga anche in pratica — riaprire una cassa che non
  // si è toccata non deve rimescolare quello che c'è dentro.
  const caso = generatore(Math.floor(impronta(tx, ty, 0xb07715) * 4294967296));
  const luogo = mappa.luogoIn(tx, ty);
  const tavolaLuogo = BOTTINO_LUOGHI[luogo?.luogo];
  const tavola = dellaFattoria(tx, ty) ? BOTTINO_FATTORIA : tavolaLuogo ?? BOTTINO;
  const totale = pesoDi(tavola);
  const quante = tavolaLuogo ? 1 + Math.floor(caso() * 2)
    : PILE[0] + Math.floor(caso() * (PILE[1] - PILE[0] + 1));
  // Mai due volte la stessa cosa. Non è pulizia: gli attrezzi si impilano a
  // uno, quindi due zappe sono due caselle occupate da due zappe — visto in
  // una prova, e una casa che contiene due zappe e nient'altro racconta un
  // sorteggio, non un posto in cui è vissuto qualcuno.
  const gia = new Set();
  for (let i = 0; i < quante; i += 1) {
    let voce = pesca(caso, tavola, totale);
    for (let prova = 0; prova < 4 && gia.has(voce.cosa); prova += 1) voce = pesca(caso, tavola, totale);
    if (gia.has(voce.cosa)) continue;
    gia.add(voce.cosa);
    const n = voce.da + Math.floor(caso() * (voce.a - voce.da + 1));
    // Si passa da mettiIn come tutto il resto: impila come lo zaino, e al cibo
    // mette la data di oggi — quello che trovi è quello che si è conservato
    // fin qui, non quello che è marcito mentre non guardavi.
    //
    // Gli attrezzi però no: quelli si trovano usati. Un'ascia nuova di zecca
    // in fondo a una cassa di casa d'altri è la cosa che sgonfia da sola la
    // tappa dell'usura — frugare renderebbe sempre più che riparare, e il
    // banco tornerebbe a servire una volta sola. Fra un terzo e due terzi di
    // quello che regge da nuova: serve ancora, e non ti risolve la stagione.
    inventario.mettiIn(fila, voce.cosa, n, undefined, usiTrovati(voce.cosa, caso));
  }
  return fila;
}

// Il contenuto di una cassa, sempre della lunghezza giusta.
//
// Si normalizza leggendo e non scrivendo, ed è la stessa scelta di
// inventario.ripristina(): un salvataggio storto, o scritto da una versione
// in cui la cassa aveva un'altra misura, deve costare una casella e non una
// partita.
export function contenutoDi(tx, ty) {
  const dati = modifiche.di(tx, ty);
  const fila = vuote();
  if (!Array.isArray(dati?.contenuto)) {
    // Nessuno ci ha ancora messo né tolto niente. Se la cassa c'era già prima
    // di noi, quello che contiene lo dice la generazione; se l'abbiamo posata
    // noi, è vuota perché l'abbiamo posata vuota.
    if (mappa.oggettoGenerato(tx, ty) === OGGETTO.CASSA) return bottinoDi(tx, ty);
    return fila;
  }
  for (let i = 0; i < CASELLE && i < dati.contenuto.length; i += 1) {
    const c = dati.contenuto[i];
    if (!c || typeof c.cosa !== "string" || !(c.quantita > 0)) continue;
    if (!CATALOGO[c.cosa]) continue;
    fila[i] = { cosa: c.cosa, quantita: Math.min(c.quantita, CATALOGO[c.cosa].pila ?? 1) };
    if (typeof c.dal === "number") fila[i].dal = c.dal;
    if (CATALOGO[c.cosa]?.durata) fila[i].usi = inventario.usiRimasti(c);
  }
  return fila;
}

// Si annota e non si cambia il tassello: una cassa con dentro altro è ancora
// la stessa cassa, quindi il settore non va ricotto. È la stessa ragione per
// cui i colpi su un albero si annotano — ricuocere duecentocinquantasei
// tasselli per aggiornare un numero è spreco.
export function scrivi(tx, ty, fila) {
  const dati = modifiche.di(tx, ty) ?? { oggetto: OGGETTO.CASSA };
  mappa.annotaTassello(tx, ty, { ...dati, contenuto: fila.map((c) => (c ? { ...c } : null)) });
}

// C'è ancora una cassa qui? La domanda la fa chi tiene aperta la schermata, e
// la fa a questo modulo invece che al mondo perché gioco.js non ha mai
// importato il vocabolario dei tasselli: parla al mondo attraverso mappa e
// azioni, e rompere quell'abitudine per un controllo difensivo sarebbe pagare
// caro una riga.
export function esiste(tx, ty) {
  return mappa.oggettoDi(tx, ty) === OGGETTO.CASSA;
}

export function eVuota(tx, ty) {
  return contenutoDi(tx, ty).every((c) => !c);
}

export function quante(tx, ty) {
  return contenutoDi(tx, ty).reduce((n, c) => n + (c ? 1 : 0), 0);
}

// --- spostare -------------------------------------------------------------

// Sposta una casella intera da una parte all'altra, e quello che non ci sta
// resta dov'era.
//
// Una casella intera e non un'unità alla volta, per la stessa ragione per cui
// si getta una casella intera: a spazio pieno il problema è la casella
// occupata, e risolverlo un pezzo per volta sarebbe quaranta pressioni dello
// stesso tasto per una cosa che si vede a colpo d'occhio.
//
// "dal" viaggia con la roba in tutti e due i versi. Senza, una cassa sarebbe
// una macchina per ringiovanire il cibo: dentro e fuori, e il raccolto
// tornerebbe fresco.
export function sposta(tx, ty, versoLaCassa, indice) {
  const fila = contenutoDi(tx, ty);

  if (versoLaCassa) {
    const casella = inventario.contenuto()[indice];
    if (!casella) return null;
    // Un pollo vivo in una cassa chiusa non è un posto dove tenerlo.
    if (casella.cosa === "pollo" || casella.cosa === "gallo") return { tipo: "vivo" };
    const resto = inventario.mettiIn(fila, casella.cosa, casella.quantita, casella.dal, casella.usi, casella.massimo);
    if (resto === casella.quantita) return { tipo: "pieno" };
    // Si toglie dallo zaino esattamente quello che è entrato, e il resto resta
    // dov'è: svuotare la casella e poi rimetterci l'avanzo la sposterebbe
    // altrove nello zaino, che è il genere di cosa che fa perdere di vista la
    // propria roba.
    casella.quantita = resto;
    if (resto === 0) inventario.svuotaCasella(indice);
    scrivi(tx, ty, fila);
    return { tipo: "spostato", verso: "cassa", cosa: casella.cosa };
  }

  const casella = fila[indice];
  if (!casella) return null;
  const resto = inventario.aggiungi(casella.cosa, casella.quantita, casella.dal, casella.usi, casella.massimo);
  if (resto === casella.quantita) return { tipo: "pieno" };
  if (resto === 0) fila[indice] = null;
  else casella.quantita = resto;
  scrivi(tx, ty, fila);
  return { tipo: "spostato", verso: "zaino", cosa: casella.cosa };
}

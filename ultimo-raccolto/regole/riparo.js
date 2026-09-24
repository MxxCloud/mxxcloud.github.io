// Essere dentro.
//
// Fino a M7.4 il gioco non sapeva rispondere alla domanda più semplice che si
// possa fare a una casa: ci sono dentro? Si potevano posare casse, banchi,
// falò e — da questa tappa — muri e porte, e nessuna di quelle cose formava
// mai uno spazio: erano oggetti su tasselli, e la notte ti trovava uguale
// dentro e fuori.
//
// La risposta è una sola operazione: si allaga a partire da dove sei, e si
// guarda se l'acqua esce. Se non esce entro un limite, sei dentro, e quello
// che l'allagamento ha toccato è la stanza.
//
// IL LIMITE NON È UNA RINUNCIA. Una stanza più larga di duecento tasselli non
// è una stanza: è un recinto, o è la valle. Il limite serve a due cose insieme
// — tiene il costo prevedibile (duecento tasselli nel caso peggiore, e quasi
// sempre molti meno, perché appena l'allagamento trova la campagna aperta
// esplode e si ferma) e dice che il tepore di un fuoco non attraversa un
// cortile. Un recinto per l'orto non è una casa, e non deve scaldare.
//
// Le pareti sono chiudeIn() e non solidoIn(), ed è una differenza che conta:
// l'acqua ferma i piedi ma non è una parete, quindi un isolotto non è una
// stanza e una capanna aperta sul lago non è chiusa. Le pareti sono roba che
// sta in piedi — muri, porte, casse, banchi, e sì, anche alberi e sassi: chi
// si accampa in un buco di roccia ha fatto lo stesso lavoro di chi ha alzato
// quattro muri, solo che l'ha trovato già fatto.
//
// La porta conta aperta o chiusa: aprirla non mette la casa all'aperto. Un
// muro crollato sì, perché lì la casa ha un buco.

import * as modifiche from "../mondo/modifiche.js";
import * as mappa from "../mondo/mappa.js";
import { OGGETTO } from "../mondo/generazione.js";

export const LIMITE = 200;

// I quattro vicini e non gli otto: si allaga come si cammina, e fra due muri
// messi in diagonale non ci passa nessuno.
const VICINI = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

// La stanza che contiene questo tassello, come elenco di tasselli, oppure null
// se di stanza non ce n'è una — cioè se si è all'aperto, o dentro un muro.
export function stanzaDi(tx, ty) {
  const { tasselli, chiusa } = allaga(tx, ty);
  return chiusa ? tasselli : null;
}

// L'allagamento vero e proprio: i tasselli toccati, e se l'acqua è rimasta
// dentro. Quando esce, i tasselli toccati sono tutti all'aperto, perché sono
// collegati al punto da cui è uscita: chi deve chiederlo per molti tasselli
// insieme può ricordarselo invece di riallagare (vedi ricrescita.js).
export function allaga(tx, ty) {
  if (mappa.chiudeIn(tx, ty)) return { tasselli: [], chiusa: false };

  const visti = new Set([`${tx},${ty}`]);
  const tasselli = [{ tx, ty }];
  // Una pila e non una coda: qui non serve l'ordine in cui si arriva, serve
  // sapere se si esce, e una pila costa uno shift in meno per tassello.
  const daVedere = [{ tx, ty }];

  while (daVedere.length > 0) {
    const qui = daVedere.pop();
    for (const [dx, dy] of VICINI) {
      const x = qui.tx + dx;
      const y = qui.ty + dy;
      const k = `${x},${y}`;
      if (visti.has(k)) continue;
      if (mappa.chiudeIn(x, y)) continue;
      // Uscita trovata: oltre il limite non è più una stanza, ed è inutile
      // continuare a contare la valle.
      if (tasselli.length >= LIMITE) return { tasselli, chiusa: false };
      visti.add(k);
      tasselli.push({ tx: x, ty: y });
      daVedere.push({ tx: x, ty: y });
    }
  }

  return { tasselli, chiusa: true };
}

// I tasselli che chiudono questa stanza, una volta ciascuno: quello che
// l'allagamento ha trovato attorno senza poterci entrare.
export function pareti(stanza) {
  const viste = new Set();
  const trovate = [];
  for (const { tx, ty } of stanza) {
    for (const [dx, dy] of VICINI) {
      const x = tx + dx;
      const y = ty + dy;
      const k = `${x},${y}`;
      if (viste.has(k) || !mappa.chiudeIn(x, y)) continue;
      viste.add(k);
      trovate.push({ tx: x, ty: y });
    }
  }
  return trovate;
}

// Un posto murato: chiuso, e con almeno un muro o una porta fra le pareti.
//
// È la domanda di chi non è una persona. Per il freddo anche alberi e sassi
// chiudono, ed è giusto: chi si accampa in un buco di roccia è riparato. Per
// quello che cresce no. Un albero tagliato in mezzo al bosco ha quattro alberi
// attorno, cioè una "stanza" di un tassello, e una radura chiusa dagli alberi
// è ancora bosco: sotto il cielo, con la luce. Diventa un posto chiuso quando
// qualcuno ci alza un muro.
//
// La chiedono la ricrescita (M7.18.6: in casa non torna il bosco) e l'orto
// (M7.18.14: al chiuso non cresce niente), e stava dentro la ricrescita finché
// era una sola a chiederla. Due copie della stessa regola sono due risposte
// che un giorno non coincidono.
const MURATURA = new Set([OGGETTO.MURO, OGGETTO.PORTA, OGGETTO.PORTA_APERTA]);

// Il verdetto si ricorda per tutti i tasselli che l'allagamento ha toccato,
// non solo per quello da cui è partito: sono nello stesso spazio, quindi hanno
// la stessa risposta. Vale finché il mondo non cambia — la revisione delle
// modifiche e il seme — ed è quello che la rende chiamabile a ogni
// fotogramma: davanti a un campo con la zappa in mano la domanda si fa
// sessanta volte al secondo. Senza, mille ricrescite nello stesso giorno erano
// mille allagamenti da duecento tasselli, cioè 190 millisecondi fermi a
// mezzanotte.
const verdetti = new Map();
let revisioneVerdetti = -1;
let semeVerdetti = null;

export function murato(tx, ty) {
  const r = modifiche.revisione();
  const s = mappa.semeCorrente().nome;
  if (r !== revisioneVerdetti || s !== semeVerdetti || verdetti.size > 8192) {
    verdetti.clear();
    revisioneVerdetti = r;
    semeVerdetti = s;
  }
  const noto = verdetti.get(`${tx},${ty}`);
  if (noto !== undefined) return noto;
  const { tasselli, chiusa } = allaga(tx, ty);
  const risposta = chiusa && pareti(tasselli).some(p => MURATURA.has(mappa.oggettoDi(p.tx, p.ty)));
  for (const t of tasselli) verdetti.set(`${t.tx},${t.ty}`, risposta);
  // Un tassello che è esso stesso una parete non entra nell'allagamento:
  // la risposta per lui si scrive a parte.
  if (tasselli.length === 0) verdetti.set(`${tx},${ty}`, risposta);
  return risposta;
}

// C'è un focolare acceso dentro questa stanza?
//
// È la seconda metà della regola del freddo, e la ragione per cui "al chiuso"
// non vuol dire "al caldo": una capanna senza fuoco è una capanna fredda, e
// regalare il tepore a chi ha alzato quattro muri toglierebbe al falò il
// mestiere che ha da M1. Quello che cambia è la portata — il calore resta
// dentro invece di finire a tre tasselli — ed è esattamente quello che fa una
// stanza vera.
//
// Il focolare e non qualunque fuoco. Fino a M7.18.9 bastava anche un falò, e
// allora il focolare scaldava come lui: dieci pietre e la regola delle quattro
// mura per quattro legna invece di due. Adesso il falò scalda tre tasselli
// dovunque stia, anche in casa, e la stanza intera è il mestiere del focolare.
//
// Un tassello di raggio e non zero, e la ragione è che il focolare acceso
// ferma: è solido, quindi non fa parte della stanza — l'allagamento gli gira
// attorno. Cercandolo solo sui tasselli calpestabili non lo si trovava mai, e
// una capanna col fuoco acceso dentro risultava fredda. Misurato, non
// immaginato.
//
// Un raggio solo basta e non sborda: il fuoco di qualcun altro, dall'altra
// parte della parete, sta a due tasselli dal pavimento di qua.
export function caldaDentro(stanza) {
  for (const { tx, ty } of stanza) {
    if (mappa.scaldaStanzaVicino(tx, ty, 1)) return true;
  }
  return false;
}

// --- lo stato di adesso ----------------------------------------------------

// La stanza in cui si sta, tenuta da parte fra un fotogramma e l'altro.
//
// La cache segue posizione, seme e revisione delle modifiche: porte e muri
// cambiano il riparo subito. Il controllo periodico resta una salvaguardia.
const RINFRESCO = 0.5;

let revisione = -1;
let seme = null;
let stanzaOra = null;
let doveEravamo = null;
let dallUltimoGiro = RINFRESCO;

export function reimposta() {
  revisione = -1;
  seme = null;
  stanzaOra = null;
  doveEravamo = null;
  dallUltimoGiro = RINFRESCO;
}

// Da chiamare una volta per passo, prima del freddo. Restituisce se lo stato è
// cambiato rispetto al passo prima, perché entrare al chiuso è una cosa che il
// gioco deve poter dire: chiudere l'ultimo varco non si vede.
export function aggiorna(passo, tx, ty) {
  dallUltimoGiro += passo;
  const spostato = doveEravamo === null || doveEravamo.tx !== tx || doveEravamo.ty !== ty;
  const nuovaRevisione = modifiche.revisione();
  const nuovoSeme = mappa.semeCorrente().nome;
  if (!spostato && revisione === nuovaRevisione && seme === nuovoSeme && dallUltimoGiro < RINFRESCO) return { cambiato: false };

  revisione = nuovaRevisione;
  seme = nuovoSeme;
  const prima = stanzaOra !== null;
  doveEravamo = { tx, ty };
  dallUltimoGiro = 0;
  stanzaOra = stanzaDi(tx, ty);
  return { cambiato: (stanzaOra !== null) !== prima };
}

export function alChiuso() {
  return stanzaOra !== null;
}

export function stanza() {
  return stanzaOra;
}


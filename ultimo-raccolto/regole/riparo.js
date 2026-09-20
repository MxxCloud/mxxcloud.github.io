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
// sta in piedi — muri, porte chiuse, casse, banchi, e sì, anche alberi e
// sassi: chi si accampa in un buco di roccia ha fatto lo stesso lavoro di chi
// ha alzato quattro muri, solo che l'ha trovato già fatto.

import * as modifiche from "../mondo/modifiche.js";
import * as mappa from "../mondo/mappa.js";

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
  if (mappa.chiudeIn(tx, ty)) return null;

  const visti = new Set([`${tx},${ty}`]);
  const stanza = [{ tx, ty }];
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
      if (stanza.length >= LIMITE) return null;
      visti.add(k);
      stanza.push({ tx: x, ty: y });
      daVedere.push({ tx: x, ty: y });
    }
  }

  return stanza;
}

// C'è una fiamma dentro questa stanza?
//
// È la seconda metà della regola del freddo, e la ragione per cui "al chiuso"
// non vuol dire "al caldo": una capanna senza fuoco è una capanna fredda, e
// regalare il tepore a chi ha alzato quattro muri toglierebbe al falò il
// mestiere che ha da M1. Quello che cambia è la portata — il calore resta
// dentro invece di finire a tre tasselli — ed è esattamente quello che fa una
// stanza vera.
// Un tassello di raggio e non zero, e la ragione è che il falò acceso ferma:
// è solido, quindi non fa parte della stanza — l'allagamento gli gira attorno.
// Cercandolo solo sui tasselli calpestabili non lo si trovava mai, e una
// capanna col fuoco acceso dentro risultava fredda. Misurato, non immaginato.
//
// Un raggio solo basta e non sborda: il fuoco di qualcun altro, dall'altra
// parte della parete, sta a due tasselli dal pavimento di qua.
export function caldaDentro(stanza) {
  for (const { tx, ty } of stanza) {
    if (mappa.fuocoVicino(tx, ty, 1)) return true;
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


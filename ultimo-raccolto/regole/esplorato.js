// Dove sei già stato.
//
// In un mondo infinito "la mappa intera" non esiste: qualunque cosa si
// disegni è un ritaglio. Quella che esiste è la mappa di quello che hai
// visto — e in questo gioco è anche l'unica che abbia senso, perché è la sola
// che sia tua. Il pilastro dice che il posto è tuo: il posto è esattamente
// questo elenco.
//
// La regola di cosa conta come "visto" non è nuova ed è deliberato: è quanto
// copre la minimappa, cioè trentadue tasselli attorno a te. Inventarne una
// seconda avrebbe voluto dire due nozioni di visibilità che si contraddicono,
// e il giocatore che si chiede perché un pezzo di valle che ha guardato in
// basso a destra non compare sulla mappa grande.
//
// Non si ricorda il terreno, si ricordano i settori: il terreno è una
// funzione delle coordinate e si ricalcola uguale, quindi memorizzarlo
// sarebbe scrivere su disco qualcosa che si sa già. È la stessa ragione per
// cui il salvataggio contiene le modifiche e non il mondo.

import * as schermo from "../motore/schermo.js";
import { SETTORE } from "../mondo/mappa.js";

const { TASSELLO } = schermo;

// Lo stesso mezzo lato della minimappa. Se un giorno la minimappa cambierà
// misura, questo numero la seguirà — sono la stessa promessa detta due volte.
const RAGGIO = 32;

const visti = new Set();
const chiave = (sx, sy) => `${sx},${sy}`;

// Gli ultimi settori marcati, per non rifare il giro quando non ci si è
// mossi abbastanza. Il conto è minuscolo — al massimo cinque settori per lato
// — ma gira sessanta volte al secondo, e la regola della casa è che quello
// che gira a ogni fotogramma non fa lavoro inutile.
let ultimoTx = null;
let ultimoTy = null;

// Quali settori sono comparsi in questo passo. Riusato invece di essere
// riallocato: segna() gira a ogni cambio di tassello.
const appenaVisti = [];

// Restituisce i settori nuovi e non il loro numero: chi disegna la mappa deve
// poter dipingere solo quelli. Contandoli soltanto, l'unica strada era
// riscorrere tutti i settori già visti per ritrovare i nuovi — misurato, 0,28
// ms con quattrocento settori, e cresce con la partita. Un costo che cresce
// con quanto hai giocato è il peggiore da lasciare in giro, perché non si
// vede finché non è tardi.
export function segna(eroe) {
  appenaVisti.length = 0;
  const tx = Math.floor(eroe.px / TASSELLO);
  const ty = Math.floor(eroe.py / TASSELLO);
  if (tx === ultimoTx && ty === ultimoTy) return appenaVisti;
  ultimoTx = tx;
  ultimoTy = ty;

  const primo = Math.floor((tx - RAGGIO) / SETTORE);
  const ultimo = Math.floor((tx + RAGGIO) / SETTORE);
  const sopra = Math.floor((ty - RAGGIO) / SETTORE);
  const sotto = Math.floor((ty + RAGGIO) / SETTORE);

  for (let sy = sopra; sy <= sotto; sy += 1) {
    for (let sx = primo; sx <= ultimo; sx += 1) {
      const k = chiave(sx, sy);
      if (visti.has(k)) continue;
      visti.add(k);
      appenaVisti.push(sx, sy);
    }
  }
  return appenaVisti;
}

export function eVisto(sx, sy) {
  return visti.has(chiave(sx, sy));
}

export function perOgnuno(funzione) {
  for (const k of visti) {
    const virgola = k.indexOf(",");
    funzione(Number(k.slice(0, virgola)), Number(k.slice(virgola + 1)));
  }
}

export function quanti() {
  return visti.size;
}

// Per il salvataggio: un elenco di coppie, che è già la forma giusta da
// scrivere. Un settore costa una decina di caratteri, quindi una partita che
// ha girato parecchio pesa qualche kilobyte — meno di quanto pesano le
// modifiche di mezza giornata di raccolta.
export function tutti() {
  return [...visti];
}

export function ripristina(elenco) {
  svuota();
  if (!Array.isArray(elenco)) return;
  for (const k of elenco) {
    // Una voce malformata si salta invece di far saltare il caricamento: un
    // salvataggio storto deve costare un pezzo di mappa, non una partita.
    if (typeof k === "string" && k.includes(",")) visti.add(k);
  }
}

export function svuota() {
  visti.clear();
  ultimoTx = null;
  ultimoTy = null;
}

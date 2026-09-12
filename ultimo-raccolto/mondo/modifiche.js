// Quello che il giocatore ha cambiato nel mondo.
//
// Fino a qui la valle era solo calcolata: ogni tassello era una funzione pura
// delle sue coordinate. È una proprietà preziosa — niente da generare in
// anticipo, nessun confine — ma da sola rende il mondo immutabile, e un
// survival in cui l'albero che hai abbattuto ricresce appena giri lo sguardo
// non è un survival.
//
// Qui stanno le eccezioni: solo i tasselli che il giocatore ha toccato. Tutto
// il resto continua a venire dalla generazione. È anche ciò che renderà
// piccolo il salvataggio a M2 — si scrive questa mappa, non il mondo.

const cambi = new Map();

const chiave = (tx, ty) => `${tx},${ty}`;

export function di(tx, ty) {
  return cambi.get(chiave(tx, ty));
}

export function imposta(tx, ty, cambio) {
  cambi.set(chiave(tx, ty), cambio);
}

export function rimuovi(tx, ty) {
  cambi.delete(chiave(tx, ty));
}

export function quanti() {
  return cambi.size;
}

// Per il salvataggio che arriverà: la forma è già quella giusta da scrivere su
// disco, coppie coordinate-cambiamento e nient'altro.
export function tutti() {
  return [...cambi.entries()].map(([k, v]) => {
    const [tx, ty] = k.split(",").map(Number);
    return { tx, ty, ...v };
  });
}

// Scorre i cambiamenti senza costruire niente. tutti() alloca un array nuovo a
// ogni chiamata, il che va benissimo per salvare una volta e malissimo per
// disegnare la minimappa sessanta volte al secondo.
export function perOgnuno(funzione) {
  for (const [k, v] of cambi) {
    const virgola = k.indexOf(",");
    funzione(Number(k.slice(0, virgola)), Number(k.slice(virgola + 1)), v);
  }
}

export function svuota() {
  cambi.clear();
}

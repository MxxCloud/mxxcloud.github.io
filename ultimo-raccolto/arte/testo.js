// Scrittura di testo sul canvas del gioco.
//
// I glifi sono sagome senza colore (vedi sprite-testo.js) e vengono cotti una
// volta per ogni colore richiesto. Le tavolozze si tengono in una mappa per
// colore, e non si ricreano a ogni chiamata: cuoci() mette in cache per
// identità della tavolozza, quindi una tavolozza nuova a ogni fotogramma
// vanificherebbe la cache e ridisegnerebbe ogni lettera pixel per pixel.

import { cuoci } from "./sprite.js";
import { GLIFI, ALTEZZA, SPAZIO } from "./sprite-testo.js";

export { ALTEZZA };

const tavolozzePerColore = new Map();

function tavolozzaDi(colore) {
  let tavolozza = tavolozzePerColore.get(colore);
  if (!tavolozza) {
    tavolozza = { ".": null, x: colore };
    tavolozzePerColore.set(colore, tavolozza);
  }
  return tavolozza;
}

// Le minuscole non esistono nel font: si scrive tutto in maiuscolo invece di
// disegnare un secondo alfabeto. A cinque pixel di altezza le minuscole con
// le aste sotto la linea di base sarebbero comunque illeggibili.
function glifoDi(carattere) {
  return GLIFI[carattere] ?? GLIFI[carattere.toUpperCase()] ?? GLIFI["?"];
}

export function larghezza(testo) {
  let somma = 0;
  for (const carattere of testo) somma += glifoDi(carattere)[0].length + SPAZIO;
  return Math.max(0, somma - SPAZIO);
}

export function disegna(pennello, testo, x, y, colore) {
  const tavolozza = tavolozzaDi(colore);
  let penna = Math.round(x);
  for (const carattere of testo) {
    const glifo = glifoDi(carattere);
    // Lo spazio non ha pixel accesi: cuocerlo e disegnarlo sarebbe lavoro per
    // niente, e a ogni fotogramma per ogni spazio di ogni scritta.
    if (carattere !== " ") pennello.drawImage(cuoci(glifo, tavolozza), penna, Math.round(y));
    penna += glifo[0].length + SPAZIO;
  }
  return penna - SPAZIO;
}

// Testo con un'ombra di un pixel: sopra il gioco il fondo può essere di
// qualsiasi colore, e una scritta chiara su erba chiara sparisce.
export function disegnaConOmbra(pennello, testo, x, y, colore, ombra = "#11131a") {
  disegna(pennello, testo, x + 1, y + 1, ombra);
  return disegna(pennello, testo, x, y, colore);
}

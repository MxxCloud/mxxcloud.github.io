// Registro delle entità.
//
// Un'entità è un oggetto semplice con un campo "tipo"; il comportamento sta in
// una funzione registrata per quel tipo. Niente sistema a componenti: le entità
// resteranno nell'ordine delle centinaia e i comportamenti distinti sono pochi,
// quindi un ECS aggiungerebbe indirezione senza restituire niente — e stonerebbe
// con il resto del sito, scritto a mano e senza impalcature.
//
// Le entità espongono la stessa forma degli oggetti della mappa — x, y, base,
// sprite — proprio perché chi disegna possa ordinarle insieme senza sapere chi
// è un albero e chi un superstite.

const entita = [];
const comportamenti = new Map();

export function registra(tipo, aggiorna) {
  comportamenti.set(tipo, aggiorna);
}

export function aggiungi(entitaNuova) {
  entita.push(entitaNuova);
  return entitaNuova;
}

export function svuota() {
  entita.length = 0;
}

export function tutte() {
  return entita;
}

export function aggiorna(passo) {
  for (const e of entita) {
    const comportamento = comportamenti.get(e.tipo);
    if (comportamento) comportamento(e, passo);
  }
}

// Allocato una volta sola: vedi la nota in mappa.js sul raccoglitore di rifiuti.
const disegnabili = [];

export function daDisegnare() {
  disegnabili.length = 0;
  for (const e of entita) {
    if (e.sprite) disegnabili.push(e);
  }
  return disegnabili;
}

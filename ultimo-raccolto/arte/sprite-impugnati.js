// Gli oggetti come si vedono in mano al superstite.
//
// Non sono le icone dello zaino rimpicciolite: un'icona è fatta per leggersi
// isolata dentro una casella, un oggetto impugnato per leggersi addosso a una
// figura alta ventiquattro pixel, dove ha a disposizione cinque o sei pixel in
// larghezza. Perciò sono disegni a parte, stretti e allungati: un manico che
// sporge oltre la sagoma si riconosce anche quando la testa dell'attrezzo è
// minuscola.
//
// Sono disegnati per la mano sinistra di chi guarda. La direzione destra si
// ottiene riflettendo l'intera figura già composta (vedi giocatore.js), quindi
// qui non serve una seconda versione.

export const TORCIA = [
  ".v.",
  "vuv",
  "vuv",
  ".u.",
  "ghg",
  "ghg",
  "ghg",
  "ghg",
  "ghg",
];

export const ASCIA = [
  ".eee.",
  "efffe",
  ".eehg",
  "...hg",
  "...hg",
  "...hg",
  "...hg",
  "...hg",
  "...hg",
];

// La lancia è più lunga di tutto il resto, e deve esserlo: è l'unica cosa che
// si tiene in mano il cui senso è la distanza. Un'asta di tre pixel per tredici
// sporge sopra la testa e sotto il pugno, e si riconosce da lontano per quello
// che è — qualcosa che arriva prima di te.
export const LANCIA = [
  ".s.",
  "sss",
  ".s.",
  ".h.",
  "ghg",
  "ghg",
  "ghg",
  "ghg",
  "ghg",
  "ghg",
  "ghg",
  "ghg",
  ".g.",
];

export const ZAPPA = [
  "eee..",
  "eee..",
  ".hg..",
  ".hg..",
  ".hg..",
  ".hg..",
  ".hg..",
  ".hg..",
  ".hg..",
];


export const CANNA = [
 "...hB","..h.B",".h..B",".h..B",".h..B",".h..B",
 ".h..B",".h..B",".h..v",".h...",".h...",".g...",
];

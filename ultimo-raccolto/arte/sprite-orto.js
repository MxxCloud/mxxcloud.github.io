// L'orto: terra lavorata e i quattro stadi di una coltura.
//
// Ogni stadio contiene anche il terreno, perché una coltura è terra lavorata
// più quello che ci cresce sopra: disegnarli separati vorrebbe dire due
// oggetti sullo stesso tassello, e un tassello ne regge uno.
//
// Le piantine stanno su tre file allineate ai solchi. Un orto si riconosce
// dal ritmo regolare molto prima che dalla forma della singola pianta — è
// quello che lo distingue da un cespuglio cresciuto per caso.

export const TERRA_ZAPPATA = [
  "bbbbbbbbbbbbbbbb",
  "bccbbccbbccbbccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
  "bccbbccbbccbbccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
  "bccbbccbbccbbccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
  "bccbbccbbccbbccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
  "bccbbccbbccbbccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
];

export const SEMINATO = [
  "bbbbbbbbbbbbbbbb",
  "bccbbccbbccbbccb",
  "bccbbccbbccbbccb",
  "bbgbbbbgbbbbgbbb",
  "bccbbccbbccbbccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
  "bccbbccbbccbbccb",
  "bcgbbccgbccbgccb",
  "bbbbbbbbbbbbbbbb",
  "bccbbccbbccbbccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
  "bcgbbccgbccbgccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
];

export const GERMOGLIO = [
  "bbbbbbbbbbbbbbbb",
  "bccbbccbbccbbccb",
  "bckbbcckbccbkccb",
  "bbkbbbbkbbbbkbbb",
  "bccbbccbbccbbccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
  "bckbbcckbccbkccb",
  "bckbbcckbccbkccb",
  "bbbbbbbbbbbbbbbb",
  "bccbbccbbccbbccb",
  "bccbbccbbccbbccb",
  "bbkbbbbkbbbbkbbb",
  "bckbbcckbccbkccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
];

export const CRESCIUTA = [
  "bbbbbbbbbbbbbbbb",
  "bckbbcckbccbkccb",
  "bkkkbckkkcckkkcb",
  "bbjbbbbjbbbbjbbb",
  "bccbbccbbccbbccb",
  "bccbbccbbccbbccb",
  "bbkbbbbkbbbbkbbb",
  "bkkkbckkkcckkkcb",
  "bcjbbccjbccbjccb",
  "bbbbbbbbbbbbbbbb",
  "bccbbccbbccbbccb",
  "bckbbcckbccbkccb",
  "bkkkbbkkkbbkkkbb",
  "bcjbbccjbccbjccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
];

export const MATURA = [
  "bbkbbbbkbbbbkbbb",
  "bkkkbckkkcckkkcb",
  "bcjbbccjbccbjccb",
  "b555bb555bb555bb",
  "bccbbccbbccbbccb",
  "bckbbcckbccbkccb",
  "bkkkbbkkkbbkkkbb",
  "bcjbbccjbccbjccb",
  "b555bc555cc555cb",
  "bbbbbbbbbbbbbbbb",
  "bckbbcckbccbkccb",
  "bkkkbckkkcckkkcb",
  "bbjbbbbjbbbbjbbb",
  "b555bc555cc555cb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
];


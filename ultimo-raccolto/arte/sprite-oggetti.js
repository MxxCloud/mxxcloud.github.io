// Oggetti che stanno sul terreno: alberi, sassi, cespugli.
//
// A differenza dei tasselli questi sono disegnati a mano, perché qui conta la
// sagoma: un albero si riconosce dalla silhouette molto prima che dal colore.
//
// Sono più alti di un tassello e vengono disegnati ancorati ai piedi, non in
// alto a sinistra: è ciò che fa passare il superstite davanti o dietro
// all'albero a seconda di dove ha i piedi (vedi l'ordinamento in mappa.js).

// Chioma larga, tronco stretto: la silhouette deve leggersi anche quando metà
// albero è coperta da un altro albero.
export const ALBERO = [
  "......iiii......",
  "....iijjjjii....",
  "...ijjjjjjjjji..",
  "..ijjjkkkjjjjji.",
  ".ijjjkkkkkjjjji.",
  ".ijjkkkkkkkjjji.",
  "ijjjkkkkkkkjjjji",
  "ijjkkkkkkkkkjjji",
  "ijjkkkkkkkkkjjji",
  "ijjjkkkkkkkjjjji",
  ".ijjjkkkkkjjjji.",
  ".iijjjkkkjjjjii.",
  "..iijjjjjjjjii..",
  "...iiijjjjiii...",
  ".....iiiiii.....",
  "......ghhg......",
  "......ghhg......",
  "......ghhg......",
  "......ghhg......",
  "......ghhg......",
  ".....gghhgg.....",
  "....gghhhhgg....",
  "...ggg....ggg...",
];

export const SASSO = [
  "......dddd......",
  "....ddeeeedd....",
  "...deeeffeeed...",
  "..deeffffffeed..",
  "..deeffffffeed..",
  ".ddeeeffffeeedd.",
  ".deeeeeeeeeeeed.",
  "..dddeeeeeeddd..",
  "....dddddddd....",
  "......dddd......",
];

// Il muro di una casa che non c'è più.
//
// Venti righe e non sedici: cresce sopra il tassello come l'albero, perché un
// muro alto quanto il terreno si legge come un pavimento. I quattro pixel in
// più sono il coronamento, ed è quello che dice "questo è in piedi".
//
// I corsi di pietra sono regolari e l'intonaco no: le chiazze di "c" sono
// l'intonaco caduto, e sono l'unica cosa che distingue un muro in rovina da
// un muro. Un muro pulito in una valle dopo il collasso è un muro che qualcuno
// sta ancora tenendo su.
export const MURO = [
  "ffffffffffffffff",
  "ffffffffffffffff",
  "eeeeeeeeeeeeeeee",
  "dddddddddddddddd",
  "eeeddeeeeeddeeee",
  "eeeddeecceeddeee",
  "eeeeeeecceeeeeee",
  "dddddddddddddddd",
  "eddeeeeeddeeeeee",
  "eddeeeeeddeeeeee",
  "eeeeeeeeeeeeeeee",
  "dddddddddddddddd",
  "eeeddeeeeeddeeee",
  "cceddeeeeeddeeee",
  "cceeeeeeeeeeeeee",
  "dddddddddddddddd",
  "eddeeeeeddeeeeee",
  "eddeeeeeddeeeeee",
  "eeeeeeeeeeeeeeee",
  "dddddddddddddddd",
];

// Quello che resta dove il muro è venuto giù. Basso e non solido: ci si passa
// sopra, ed è da qui che si entra.
//
// Si vede che era un muro — stesse pietre, stessi grigi — perché un mucchio di
// sassi generico direbbe soltanto "ostacolo", mentre qui l'informazione è
// "qui c'era un muro e adesso c'è un varco". È la differenza fra un sasso e
// una porta.
export const MURO_ROTTO = [
  "....dd....dd....",
  "...deed..deed...",
  "..deeeed.deeed..",
  ".deeccdeedeeeed.",
  "deeeeeedeeeeeeed",
  "deecceeeeeeeeeed",
  "ddeeeeeeeeeeeedd",
  ".dddddddddddddd.",
];

export const CESPUGLIO = [
  "................",
  "......jjjj......",
  "....jjkkkkjj....",
  "...jkkkkkkkkj...",
  "..jkkkkkkkkkkj..",
  ".jkkkkkkkkkkkkj.",
  ".jkkkkkkkkkkkkj.",
  "jjkkkkkkkkkkkkjj",
  "jjkkkkkkkkkkkkjj",
  ".jjkkkkkkkkkkjj.",
  "..ijjkkkkkkjji..",
  "....iijjjjii....",
];

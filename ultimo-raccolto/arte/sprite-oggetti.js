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

// Font 3x5 per l'interfaccia.
//
// A 384x216 pixel un font di sistema non si può usare: il browser lo
// disegnerebbe con l'antialiasing, e una scritta sfumata in mezzo alla pixel
// art si vede come una macchia. Serve un font disegnato a pixel, e a questa
// risoluzione tre pixel di larghezza sono il minimo in cui una lettera resta
// una lettera.
//
// I glifi sono sagome, come le maschere di transizione: il colore lo decide
// chi disegna (vedi testo.js), così la stessa "A" serve per una scritta chiara
// su fondo scuro e per il contrario.

export const TAVOLOZZA_TESTO = {
  ".": null,
  x: "#ffffff",
};

export const ALTEZZA = 5;
export const SPAZIO = 1;

export const GLIFI = {
  "0": ["xxx", "x.x", "x.x", "x.x", "xxx"],
  "1": [".x.", "xx.", ".x.", ".x.", "xxx"],
  "2": ["xxx", "..x", "xxx", "x..", "xxx"],
  "3": ["xxx", "..x", "xxx", "..x", "xxx"],
  "4": ["x.x", "x.x", "xxx", "..x", "..x"],
  "5": ["xxx", "x..", "xxx", "..x", "xxx"],
  "6": ["xxx", "x..", "xxx", "x.x", "xxx"],
  "7": ["xxx", "..x", "..x", "..x", "..x"],
  "8": ["xxx", "x.x", "xxx", "x.x", "xxx"],
  "9": ["xxx", "x.x", "xxx", "..x", "xxx"],

  A: ["xxx", "x.x", "xxx", "x.x", "x.x"],
  B: ["xx.", "x.x", "xx.", "x.x", "xx."],
  C: ["xxx", "x..", "x..", "x..", "xxx"],
  D: ["xx.", "x.x", "x.x", "x.x", "xx."],
  E: ["xxx", "x..", "xxx", "x..", "xxx"],
  F: ["xxx", "x..", "xxx", "x..", "x.."],
  G: ["xxx", "x..", "x.x", "x.x", "xxx"],
  H: ["x.x", "x.x", "xxx", "x.x", "x.x"],
  I: ["xxx", ".x.", ".x.", ".x.", "xxx"],
  J: ["..x", "..x", "..x", "x.x", "xxx"],
  K: ["x.x", "x.x", "xx.", "x.x", "x.x"],
  L: ["x..", "x..", "x..", "x..", "xxx"],
  M: ["x.x", "xxx", "xxx", "x.x", "x.x"],
  N: ["xx.", "x.x", "x.x", "x.x", "x.x"],
  O: ["xxx", "x.x", "x.x", "x.x", "xxx"],
  P: ["xxx", "x.x", "xxx", "x..", "x.."],
  Q: ["xxx", "x.x", "x.x", "xxx", "..x"],
  R: ["xxx", "x.x", "xx.", "x.x", "x.x"],
  S: ["xxx", "x..", "xxx", "..x", "xxx"],
  T: ["xxx", ".x.", ".x.", ".x.", ".x."],
  U: ["x.x", "x.x", "x.x", "x.x", "xxx"],
  V: ["x.x", "x.x", "x.x", "x.x", ".x."],
  W: ["x.x", "x.x", "xxx", "xxx", "x.x"],
  X: ["x.x", "x.x", ".x.", "x.x", "x.x"],
  Y: ["x.x", "x.x", ".x.", ".x.", ".x."],
  Z: ["xxx", "..x", ".x.", "x..", "xxx"],

  // Le lettere accentate esistono perché l'interfaccia è in italiano e
  // "PERCHE" senza accento è un errore, non una scorciatoia.
  À: ["x..", "xxx", "x.x", "xxx", "x.x"],
  È: ["..x", "xxx", "xxx", "x..", "xxx"],
  É: ["..x", "xxx", "xxx", "x..", "xxx"],
  Ì: ["x..", "xxx", ".x.", ".x.", "xxx"],
  Ò: [".x.", "xxx", "x.x", "x.x", "xxx"],
  Ù: ["x..", "x.x", "x.x", "x.x", "xxx"],

  " ": ["..", "..", "..", "..", ".."],
  ":": [".", "x", ".", "x", "."],
  ".": [".", ".", ".", ".", "x"],
  ",": [".", ".", ".", "x", "x"],
  "-": ["...", "...", "xxx", "...", "..."],
  "/": ["..x", "..x", ".x.", "x..", "x.."],
  "+": ["...", ".x.", "xxx", ".x.", "..."],
  "!": ["x", "x", "x", ".", "x"],
  // Un pixel solo, in alto. Mancava, e ogni "L'ORTO" o "C'È" finiva disegnato
  // con il punto interrogativo che testo.js mette al posto dei caratteri che
  // non conosce: in italiano è la punteggiatura più frequente che esista, e
  // per mesi le scritte l'hanno detto invece di mostrarla.
  "'": ["x", "x", ".", ".", "."],
  "?": ["xxx", "..x", ".xx", "...", ".x."],
  "(": [".x", "x.", "x.", "x.", ".x"],
  ")": ["x.", ".x", ".x", ".x", "x."],
  "×": ["...", "x.x", ".x.", "x.x", "..."],
};

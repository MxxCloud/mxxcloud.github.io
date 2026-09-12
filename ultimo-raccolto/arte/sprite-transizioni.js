// Maschere di transizione fra terreni.
//
// Una maschera è pura forma: "x" vuol dire "qui prendi il pixel del terreno
// vicino", "." vuol dire "lascia quello di sotto". Non sa nulla di colore, ed è
// tutto il motivo per cui ne bastano così poche — la stessa maschera vale per
// ogni coppia di terreni, invece di servirne una per combinazione.
//
// Qui dentro esistono solo il lato NORD e l'angolo NORD-OVEST. Gli altri sei
// orientamenti si ottengono ruotando (vedi ruotato() in sprite.js), come il
// superstite ha disegnato solo il profilo sinistro. Disegnare a mano è la
// risorsa più scarsa del progetto.
//
// Le varianti servono contro la ripetizione: lungo un confine lungo decine di
// tasselli, una sola frangia si leggerebbe come una decalcomania.

// Due sole voci: la maschera è una sagoma, e il bianco non si vede mai perché
// serve solo a ritagliare.
export const TAVOLOZZA_MASCHERA = {
  ".": null,
  x: "#ffffff",
};

export const LATO = [
  [
    "xxxxxxxxxxxxxxxx",
    "xxxxxxxxxxxxxxxx",
    "xxxxxxxxxxxxxxxx",
    "xxxxxxxxxxxxxxxx",
    "xxx..xxxxxxxx...",
    "x.....xxx..x....",
    "......x....x....",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],
  [
    "xxxxxxxxxxxxxxxx",
    "xxxxxxxxxxxxxxxx",
    "xxxxxxxxxxxxxxxx",
    "xxxxxxxxxxxxxxxx",
    "..xxxxxxx..xxxxx",
    "..xxxx.x......x.",
    "...x............",
    "...x............",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],
  [
    "xxxxxxxxxxxxxxxx",
    "xxxxxxxxxxxxxxxx",
    "xxxxxxxxxxxxxxxx",
    "xxxxxxxxxxxxxxxx",
    "xxxxxxx.xxxxxxxx",
    "x.xxx....xxxxxxx",
    "..........xx.xx.",
    "...........x....",
    "...........x....",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],
];

export const ANGOLO = [
  [
    "xxxx............",
    "xxxxx...........",
    "xxxxxx..........",
    "xxxxx...........",
    "xxx.............",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],
  [
    "xxxxx...........",
    "xxxx............",
    "xxxx............",
    "xxx.............",
    "xx..............",
    "x...............",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],
];

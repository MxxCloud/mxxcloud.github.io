// I fiori di primavera.
//
// Le altre tre stagioni si distinguono con la sola tavolozza: l'autunno vira
// al rame, l'inverno spegne tutto e imbianca. La primavera no — un verde
// leggermente più freddo dell'estate, a colpo d'occhio, è ancora l'estate.
// Serviva qualcosa che ci fosse e non ci fosse, non solo un colore diverso.
//
// Sono minuscoli di proposito. A sedici pixel per tassello un fiore grande
// diventa un cespuglio, e un prato di cespugli bianchi non è un prato: sono
// tre o quattro pixel, quanto basta perché l'occhio legga un puntino di luce
// in mezzo all'erba e capisca che è fiorita.
//
// Tre disegni e non uno: ripetere la stessa forma dappertutto la fa leggere
// come una decalcomania, che è la stessa ragione per cui i tasselli di terreno
// hanno più varianti. Il petalo è "z" e il centro è "6", il verde scuro della
// stagione in corso: così il fiore è attaccato all'erba invece di galleggiarci
// sopra.

// Quattro petali attorno a un cuore scuro: la margherita, che è la forma che
// si riconosce anche a tre pixel.
export const MARGHERITA = [
  ".z.",
  "z6z",
  ".z.",
];

// Un fiore su stelo, più alto che largo. Rompe la simmetria della margherita:
// un prato di sole margherite torna a essere una decalcomania più fitta.
export const STELO = [
  "zz.",
  "z6.",
  ".6.",
  ".6.",
];

// Un bocciolo, due pixel e basta. Serve a diradare: se tutti i fiori fossero
// leggibili come fiori, il prato sembrerebbe un giardino curato, e questa è
// una valle abbandonata da anni.
export const BOCCIOLO = [
  "zz",
  ".6",
];

export const FIORI = [MARGHERITA, STELO, BOCCIOLO];

// Le iconcine dei bisogni: forchetta, goccia, zeta.
//
// Sette pixel per lato, e sono sagome come i glifi del font: il colore lo
// decide chi disegna, perché una barra che vira dal verde al rosso deve
// portarsi dietro anche il suo simbolo.
//
// Simboli e non lettere perché a questa dimensione una forma si riconosce
// prima di un carattere — e perché "F" di fame e "S" di sete hanno la stessa
// probabilità di essere lette come "forza" e "salute".

export const FAME = [
  ".x.x.x.",
  ".x.x.x.",
  ".xxxxx.",
  "..xxx..",
  "...x...",
  "...x...",
  "...x...",
];

export const SETE = [
  "...x...",
  "..xxx..",
  ".xxxxx.",
  "xxxxxxx",
  "xxxxxxx",
  ".xxxxx.",
  "..xxx..",
];

export const STANCHEZZA = [
  "xxxxxx.",
  "....x..",
  "...x...",
  "..x....",
  ".x.....",
  "xxxxxx.",
  ".......",
];

// Il cuore della salute. Sta sopra le altre tre barre e non in mezzo: è la
// sola che, arrivando a zero, finisce la partita — le altre fanno male, questa
// conclude.
export const SALUTE = [
  ".xx.xx.",
  "xxxxxxx",
  "xxxxxxx",
  "xxxxxxx",
  ".xxxxx.",
  "..xxx..",
  "...x...",
];

// Il gelo. Non è una barra: compare accanto alla salute solo mentre si sta
// gelando, perché il freddo o c'è o non c'è — d'inverno, di notte, lontano da
// una fiamma. Un cristallo e non un termometro, che a sette pixel sarebbe una
// riga verticale indistinguibile da tutto il resto.
export const FREDDO = [
  "x..x..x",
  ".x.x.x.",
  "..xxx..",
  "xxxxxxx",
  "..xxx..",
  ".x.x.x.",
  "x..x..x",
];

// L'infezione: due archi di denti che si chiudono. Non una croce né una
// fiala, che dicono "medicina" cioè il rimedio, mentre qui va detto il
// problema — e il problema è che qualcosa ti ha morso.
export const INFEZIONE = [
  "xx...xx",
  ".x...x.",
  "..x.x..",
  "...x...",
  "..x.x..",
  ".x...x.",
  "xx...xx",
];

// Ti hanno visto. Un punto esclamativo e non un occhio: a sette pixel un
// occhio diventa un anello, mentre questo si legge senza impararlo.
//
// Compare e basta, senza dire quanti: il buio nasconde già abbastanza, e
// contarli a schermo toglierebbe la parte in cui ci si volta.
export const INSEGUITO = [
  "..xxx..",
  "..xxx..",
  "..xxx..",
  "..xxx..",
  "..xxx..",
  ".......",
  "..xxx..",
];

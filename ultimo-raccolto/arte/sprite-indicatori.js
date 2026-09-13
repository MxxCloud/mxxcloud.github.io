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

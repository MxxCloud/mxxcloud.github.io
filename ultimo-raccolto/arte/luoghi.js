// Piccole tracce di chi viveva nella valle. Separati da PIANTE: aggiungerli
// non cambia gli indici, le posizioni e il bottino delle vecchie case.
// v carro, o pozzo, t tronco bruciato/tagliato, g giaciglio, a orto appassito.
export const LUOGHI = [
  { id: "carro", nome: "Carro rovesciato", pianta: [
    "  .....  ",
    "...v.... ",
    " ..c.....",
    "  .......",
    "    ...  ",
  ] },
  { id: "pozzo", nome: "Pozzo dei viandanti", pianta: [
    " ..... ",
    "...%...",
    "..o....",
    ".....c.",
    " ..... ",
  ] },
  { id: "bruciato", nome: "Accampamento bruciato", pianta: [
    " .t.... ",
    "...%....",
    "..f...t.",
    "....c...",
    " .t.... ",
  ] },
  { id: "boscaioli", nome: "Sosta dei boscaioli", pianta: [
    "  ...... ",
    "..t..t.. ",
    "....c....",
    "..g...f..",
    " ....... ",
    "   ...   ",
  ] },
  { id: "orto", nome: "Orto abbandonato", pianta: [
    " %%...%% ",
    "..aa.aa..",
    "..aa.aa..",
    ".......c.",
    " %%...%% ",
  ] },
];

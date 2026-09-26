// Piccole tracce di chi viveva nella valle. Separati da PIANTE: aggiungerli
// non cambia gli indici, le posizioni e il bottino delle vecchie case.
// v carro, o pozzo, t tronco bruciato/tagliato, g giaciglio, a orto appassito,
// s e u orto inselvatichito, prima e seconda fila (M7.18.30 e M7.18.32: due
// varietà per orto, vedi generazione.js),
// p spaventapasseri rotto (M7.18.31: il segno che si vede da lontano).
export const LUOGHI = [
  { id: "carro", nome: "Diligenza rovesciata", pianta: [
    "  .....  ",
    "...v.... ",
    " ..c.....",
    "  .......",
    "    ...  ",
  ] },
  { id: "pozzo", nome: "Pozzo nel deserto", pianta: [
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
  { id: "boscaioli", nome: "Campo dei cercatori d'oro", pianta: [
    "  ...... ",
    "..t..t.. ",
    "....c....",
    "..g..zf..",
    " ....... ",
    "   ...   ",
  ] },
  { id: "orto", nome: "Orto dei coloni", pianta: [
    " %%.p.%% ",
    "..ss.ss..",
    "..uu.uu..",
    ".......c.",
    " %%...%% ",
  ] },
  // La frontiera (W0.3). Sad Hill, dal «Buono, il brutto, il cattivo»: un
  // cerchio di croci attorno a una tomba senza nome, e sotto la cassa.
  { id: "sadhill", nome: "Cimitero di Sad Hill", pianta: [
    "   x x x   ",
    " x       x ",
    "x    .    x",
    "    ...    ",
    "x  ..c..  x",
    "    ...    ",
    "x    .    x",
    " x       x ",
    "   x x x   ",
  ] },
  // Cattle Corner, da «C'era una volta il West»: la stazione in mezzo al
  // niente, i binari, la pensilina e la cisterna che gocciola mentre si
  // aspetta un treno che porta guai.
  { id: "stazione", nome: "Stazione di Cattle Corner", pianta: [
    "=============",
    "  .........  ",
    "  ....w..c.  ",
    "  .........  ",
  ] },
];

// L'orto della fattoria di partenza (M7.18.36): la pianta degli orti, con le
// due file già decise — "b" fagioli e "q" patate, sempre. È la prima cosa che
// si raccoglie, e il raccolto di fagioli e patate è anche il loro seme: il
// primo orto del giocatore nasce da qui.
const ORTO = LUOGHI.find((l) => l.id === "orto");
export const ORTO_DELLA_FATTORIA = ORTO.pianta.map((riga) => riga.replaceAll("s", "b").replaceAll("u", "q"));

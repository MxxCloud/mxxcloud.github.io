// Piccole tracce di chi viveva nella valle. Separati da PIANTE: aggiungerli
// non cambia gli indici, le posizioni e il bottino delle vecchie case.
// v carro, o pozzo, t tronco bruciato/tagliato, g giaciglio, a orto appassito,
// s e u orto inselvatichito, prima e seconda fila (M7.18.30 e M7.18.32: due
// varietà per orto, vedi generazione.js),
// p spaventapasseri rotto (M7.18.31: il segno che si vede da lontano).
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
    " %%.p.%% ",
    "..ss.ss..",
    "..uu.uu..",
    ".......c.",
    " %%...%% ",
  ] },
];

// L'orto della fattoria di partenza (M7.18.36): la pianta degli orti, con le
// due file già decise — "b" fagioli e "q" patate, sempre. È la prima cosa che
// si raccoglie, e il raccolto di fagioli e patate è anche il loro seme: il
// primo orto del giocatore nasce da qui.
const ORTO = LUOGHI.find((l) => l.id === "orto");
export const ORTO_DELLA_FATTORIA = ORTO.pianta.map((riga) => riga.replaceAll("s", "b").replaceAll("u", "q"));

// I luoghi unici (M7.18.56): uno per regione, a rotazione (vedi rovine.js).
// Non stanno in LUOGHI, e non per ordine: un indice nuovo lì cambierebbe il
// sorteggio di tutte le valli già generate. Ogni luogo unico ha qualcosa che
// non si trova altrove, e una frase sola, scritta da chi c'era.
//
// T torre, k parete di cava, "," pavimento di roccia (vedi generazione.js),
// % macerie, v carrello (il carro), c cassa.
export const UNICI = [
  { id: "torre", nome: "Torre di avvistamento",
    iscrizione: "«Da quassù si vedeva arrivare il fumo. Poi, loro.»",
    pianta: [
      "  %.%.%  ",
      " ....... ",
      "%.......%",
      "....T....",
      "%.......%",
      " ...c... ",
      "  %...%  ",
    ] },
  { id: "mulino", nome: "Mulino",
    iscrizione: "«Farina per chi resta.»",
    pianta: [
      "#########",
      "#.......#",
      "#..m....R",
      "#.....c.#",
      "#.......#",
      "###...###",
    ] },
  { id: "chiesa", nome: "Chiesa",
    iscrizione: "«Suonatela solo se potete correre.»",
    pianta: [
      "  #######  ",
      "  #..B..#  ",
      "###.....###",
      "#.........#",
      "#.........#",
      "#..c......#",
      "#.........#",
      "####...####",
    ] },
  { id: "cava", nome: "Cava di pietra",
    iscrizione: "«Qui si cavava la pietra per tutta la valle.»",
    pianta: [
      "  kkkkkkkkk  ",
      " kk,,,,,,,kk ",
      "kk,,,,,,,,,kk",
      "k,,,,v,,,,,,k",
      "k,,,,,,,,c,,k",
      "kk,,,,,,,,,kk",
      " kk,,,,,,,,, ",
      "  kkkk,,,,,  ",
    ] },
];

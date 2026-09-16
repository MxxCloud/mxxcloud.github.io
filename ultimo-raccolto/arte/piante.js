// Le piante delle rovine: un carattere per tassello.
//
// Sta in arte/ accanto agli sprite perché è la stessa idea applicata a una
// scala più grande. Uno sprite è un array di stringhe, un carattere per
// pixel; una pianta è un array di stringhe, un carattere per tassello. Si
// legge a occhio, si modifica in un editor di testo, e in git il diff dice
// quale muro è caduto.
//
// Non c'è un generatore di stanze e non ci sarà: una casa disegnata a mano è
// una casa, una casa generata è una pianta di casa. Ce ne vogliono poche e
// diverse, non infinite e uguali.
//
//   #  muro
//   %  muro crollato — ci si passa, ed è la porta che ha aperto il tempo
//   .  pavimento
//   c  una cassa, con dentro quello che non sono riusciti a portarsi via
//   f  il focolare, spento da un pezzo
//      (spazio) qui la pianta non arriva: resta la valle
//
// Le aperture non sono messe a caso. Ogni pianta ne ha almeno due su lati
// diversi: una sola vorrebbe dire che chi entra e trova un infetto dentro
// deve passargli accanto per uscire, e un posto che si visita una volta sola
// perché la seconda ti ammazza non è un posto, è una trappola.

// Il casolare: una stanza sola, il focolare su un lato, quello che restava
// nelle casse. È la casa più comune della valle, e la prima che si incontra.
export const CASOLARE = [
  "###%#######",
  "#.........#",
  "#.c.....f.#",
  "%.........#",
  "#.......c.#",
  "#.........%",
  "####%######",
];

// La stalla: più bassa, più larga, senza focolare. Ci tenevano le bestie e
// gli attrezzi, quindi una cassa sola ma spesso vale di più.
export const STALLA = [
  "#####%##",
  "#......#",
  "%..c...#",
  "#......%",
  "##%#####",
];

// Quello che resta di una casa a cui è venuto giù tutto. Più macerie che
// muri, niente tetto, e una cassa sotto il crollo: è la rovina che si vede da
// lontano e che promette meno delle altre, ma qualcosa c'è sempre.
export const CROLLO = [
  "%%#..%%",
  "#.....%",
  "%..c..#",
  "#.%..%%",
];

// L'elenco da cui si pesca. L'ordine conta soltanto perché l'impronta di una
// cella sceglie un indice: cambiarlo cambia tutte le valli già generate, ed è
// la stessa avvertenza delle soglie del terreno.
export const PIANTE = [CASOLARE, CASOLARE, STALLA, CROLLO];

export function misuraDi(pianta) {
  return { larghezza: pianta[0].length, altezza: pianta.length };
}

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

// La fattoria: una casa e una stalla attorno a un cortile, e davanti il campo.
//
// Non sta nell'elenco da cui si pesca, perché non si trova: c'è, ed è dove
// comincia la partita. È la prima riga del README — «una fattoria in rovina da
// rimettere in piedi» — e il pilastro reso concreto dal primo minuto: *il
// posto è tuo* comincia con un posto invece che con un prato.
//
// Il campo davanti è pavimento come il resto, cioè terra battuta, e questo
// basta: TERRENO.TERRA è zappabile da sempre. Chi arriva con dei semi può
// seminare senza aver prima trovato una zappa — il campo di qualcun altro è
// ancora un campo.
export const FATTORIA = [
  "###%####            ",
  "#......#.....#######",
  "#.c..f.#.....#.....#",
  "%......#.....%..c..#",
  "#....c.#.....#.....%",
  "####%###.....##%####",
  " .................. ",
  "  ................  ",
];

// Il paese. Sei case attorno a una strada, ed è l'unica pianta in cui una
// porta guarda un'altra porta.
//
// La strada è larga quattro tasselli e non due, e non per bellezza: di notte
// è l'unico posto di un paese in cui si vede arrivare qualcosa prima che sia
// addosso. Un vicolo fra sei case è un posto in cui si muore.
export const PAESE = [
  "###%####          ###%####",
  "#......#  ##%###  #......#",
  "#.c..f.#  #....#  #.c..f.#",
  "%......#  %..c.#  %......#",
  "#....c.#  #....#  #....c.#",
  "####%###  ###%##  ####%###",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "  ##%###   ###%######%### ",
  "  #....#   #......##....# ",
  "  %..c.#   #.c..f.#%..c.# ",
  "  #....#   %......##....# ",
  "  ###%##   #....c.####%## ",
  "           ####%###       ",
];

// L'elenco da cui si pesca. Le ripetizioni sono i pesi: il casolare è la casa
// comune della valle, il paese capita una volta su dieci — cioè una cella su
// quaranta, cioè poche volte in una partita, che è quanto deve capitare una
// cosa che vale il viaggio.
//
// L'ordine conta, e non solo per i pesi: l'impronta di una cella sceglie un
// indice, quindi cambiarlo cambia tutte le valli già generate. È la stessa
// avvertenza delle soglie del terreno.
export const PIANTE = [
  CASOLARE, CASOLARE, CASOLARE, CASOLARE,
  STALLA, STALLA, STALLA,
  CROLLO, CROLLO,
  PAESE,
];

export function misuraDi(pianta) {
  return { larghezza: pianta[0].length, altezza: pianta.length };
}

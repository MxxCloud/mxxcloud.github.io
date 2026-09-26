// Oggetti che stanno sul terreno: alberi, sassi, cespugli.
//
// A differenza dei tasselli questi sono disegnati a mano, perché qui conta la
// sagoma: un albero si riconosce dalla silhouette molto prima che dal colore.
//
// Sono più alti di un tassello e vengono disegnati ancorati ai piedi, non in
// alto a sinistra: è ciò che fa passare il superstite davanti o dietro
// all'albero a seconda di dove ha i piedi (vedi l'ordinamento in mappa.js).

// Chioma larga, tronco stretto: la silhouette deve leggersi anche quando metà
// albero è coperta da un altro albero.
export const ALBERO = [
  "......iiii......",
  "....iijjjjii....",
  "...ijjjjjjjjji..",
  "..ijjjkkkjjjjji.",
  ".ijjjkkkkkjjjji.",
  ".ijjkkkkkkkjjji.",
  "ijjjkkkkkkkjjjji",
  "ijjkkkkkkkkkjjji",
  "ijjkkkkkkkkkjjji",
  "ijjjkkkkkkkjjjji",
  ".ijjjkkkkkjjjji.",
  ".iijjjkkkjjjjii.",
  "..iijjjjjjjjii..",
  "...iiijjjjiii...",
  ".....iiiiii.....",
  "......ghhg......",
  "......ghhg......",
  "......ghhg......",
  "......ghhg......",
  "......ghhg......",
  ".....gghhgg.....",
  "....gghhhhgg....",
  "...ggg....ggg...",
];

export const SASSO = [
  "......dddd......",
  "....ddeeeedd....",
  "...deeeffeeed...",
  "..deeffffffeed..",
  "..deeffffffeed..",
  ".ddeeeffffeeedd.",
  ".deeeeeeeeeeeed.",
  "..dddeeeeeeddd..",
  "....dddddddd....",
  "......dddd......",
];

// Il muro di una casa che non c'è più.
//
// Venti righe e non sedici: cresce sopra il tassello come l'albero, perché un
// muro alto quanto il terreno si legge come un pavimento. I quattro pixel in
// più sono il coronamento, ed è quello che dice "questo è in piedi".
//
// I corsi di pietra sono regolari e l'intonaco no: le chiazze di "c" sono
// l'intonaco caduto, e sono l'unica cosa che distingue un muro in rovina da
// un muro. Un muro pulito in una valle dopo il collasso è un muro che qualcuno
// sta ancora tenendo su.
export const MURO = [
  "ffffffffffffffff",
  "ffffffffffffffff",
  "eeeeeeeeeeeeeeee",
  "dddddddddddddddd",
  "eeeddeeeeeddeeee",
  "eeeddeecceeddeee",
  "eeeeeeecceeeeeee",
  "dddddddddddddddd",
  "eddeeeeeddeeeeee",
  "eddeeeeeddeeeeee",
  "eeeeeeeeeeeeeeee",
  "dddddddddddddddd",
  "eeeddeeeeeddeeee",
  "cceddeeeeeddeeee",
  "cceeeeeeeeeeeeee",
  "dddddddddddddddd",
  "eddeeeeeddeeeeee",
  "eddeeeeeddeeeeee",
  "eeeeeeeeeeeeeeee",
  "dddddddddddddddd",
];

// Quello che resta dove il muro è venuto giù. Basso e non solido: ci si passa
// sopra, ed è da qui che si entra.
//
// Si vede che era un muro — stesse pietre, stessi grigi — perché un mucchio di
// sassi generico direbbe soltanto "ostacolo", mentre qui l'informazione è
// "qui c'era un muro e adesso c'è un varco". È la differenza fra un sasso e
// una porta.
export const MURO_ROTTO = [
  "....dd....dd....",
  "...deed..deed...",
  "..deeeed.deeed..",
  ".deeccdeedeeeed.",
  "deeeeeedeeeeeeed",
  "deecceeeeeeeeeed",
  "ddeeeeeeeeeeeedd",
  ".dddddddddddddd.",
];

// Le piante selvatiche (M7.18.30). Più basse e più rade del cespuglio, con i
// colori delle colture da cui vengono, perché si riconoscano da lontano: le
// spighe bionde, il lino coi fiori azzurri, il cavolo verde chiaro, la patata
// scura coi fiori bianchi.
export const SPIGHE_SELVATICHE = [
  "................",
  "...5.....5......",
  "..545...545..5..",
  "...5..5..5..545.",
  "...4.545.4...5..",
  "...4..5..4...4..",
  "..4...4...4..4..",
  "..4..4....4.4...",
  "...4.4...4..4...",
  "....44..4..4....",
  "....x44x4x4x....",
  "...xx.xxxx.xx...",
];

export const LINO_SELVATICO = [
  "................",
  "....C......C....",
  "...CyC....CyC...",
  "....y..C...y....",
  "....y.CyC..y..C.",
  "...y...y...y.CyC",
  "...y...y..y...y.",
  "....y..y..y..y..",
  "....y.y...y.y...",
  ".....yy..y.y....",
  "......yxxyy.....",
  ".....xx..xx.....",
];

export const CAVOLO_SELVATICO = [
  "................",
  "................",
  "................",
  "......E..E......",
  "....E.ExxE.E....",
  "...EEExEExEEE...",
  "..EExxEEEExxEE..",
  ".EEEEEExxEEEEEE.",
  "..EExEEEEEExEE..",
  "...xEEExxEEEx...",
  "....xxxxxxxx....",
  "................",
];

export const PATATA_SELVATICA = [
  "................",
  "................",
  ".....z....z.....",
  "....zvz..zvz....",
  "...xxzxxxxzxx...",
  "..xyxxxyxxxxyx..",
  ".xxxyxxxxyxxxxx.",
  ".xyxxxxyxxxxyxx.",
  "..xxxyxxxxyxxx..",
  "...xxxxxxxxxx...",
  "....xxxxxxxx....",
  "................",
];

// Lo spaventapasseri rotto dell'orto abbandonato (M7.18.31): storto, senza
// cappello, con la testa di paglia caduta di lato e gli stracci sbiaditi. È
// più alto di un tassello apposta: l'orto è piccolo e basso, e senza qualcosa
// che sporga sopra l'erba ci si passava accanto senza vederlo. Fa da faro.
// I fagioli inselvatichiti (M7.18.32): un paletto storto dell'orto di prima,
// con il fagiolo rampicante che ci si è arrampicato sopra e i baccelli.
export const FAGIOLI_SELVATICI = [
  "................",
  "................",
  ".......w........",
  "......yw.y......",
  ".....yywyy......",
  "......xwx.y.....",
  ".....y.wyyy.....",
  "....yyxw.x......",
  ".....x.wxy......",
  "....yy.wyyy.....",
  ".....xxwxx......",
  "......xwx.......",
];

export const SPAVENTAPASSERI_ROTTO = [
  "................",
  "...........55...",
  "..........5g5g5.",
  "..........55555.",
  "...........5g5..",
  "..........gh....",
  "..4.......gh....",
  "...44....gh..4..",
  ".....44..gh.44..",
  ".......44gh44...",
  "........9gh99...",
  ".......99gh.9...",
  ".......9gh99.9..",
  "......9.gh..9...",
  "........gh......",
  ".......gh.......",
  ".......gh.......",
  ".......gh.......",
  "......gh........",
  "......gh........",
  "......gh........",
  "......gh........",
  "......gh........",
  ".....dghd.......",
];

export const CESPUGLIO = [
  "................",
  "......jjjj......",
  "....jjkkkkjj....",
  "...jkkkkkkkkj...",
  "..jkkkkkkkkkkj..",
  ".jkkkkkkkkkkkkj.",
  ".jkkkkkkkkkkkkj.",
  "jjkkkkkkkkkkkkjj",
  "jjkkkkkkkkkkkkjj",
  ".jjkkkkkkkkkkjj.",
  "..ijjkkkkkkjji..",
  "....iijjjjii....",
];

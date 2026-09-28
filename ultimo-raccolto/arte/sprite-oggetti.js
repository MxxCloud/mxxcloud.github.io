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
// Gli alberi della valle (M7.18.47): tre forme — tonda, alta e a due lobi —
// scelte dall'impronta delle coordinate (vedi mondo/mappa.js), perché un
// bosco di alberi tutti uguali si legge come carta da parati. La chioma è a
// grappoli con la luce da sinistra in alto (Z), il verde pieno (k), l'ombra in
// basso a destra (j) e il contorno (i). Stessa misura, stesso tronco e stessa
// base per tutte e tre: urti, ombre e vento non se ne accorgono.
export const ALBERO_TONDO = [
  "......iiii......",
  "....iiZZkjii....",
  "...iZZZkkkjji...",
  "..iZZkkkjkkjji..",
  ".iZZkkkjjiZkjji.",
  ".iZkkkjjiZZkkji.",
  "iZZkkjjjiZkkkjji",
  "iZkkkjjjikkkjjji",
  "ikkkjjjiikkjjjji",
  "ijkkjjiiijjjjiji",
  ".ijjjiijjjjjjii.",
  ".iijjiijjjjjiii.",
  "..iiiiijjjjiii..",
  "...iiiiiiiiii...",
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

export const ALBERO_ALTO = [
  ".......ii.......",
  "......iZki......",
  ".....iZZkji.....",
  ".....iZkkji.....",
  "....iZZkkjji....",
  "....iZkkjjji....",
  "....ikkjiZji....",
  "...iZkjiZZkji...",
  "...iZkkiZkkji...",
  "...ikkjikkjjji..",
  "...ijkjjkjjjii..",
  "...iijjjjjjii...",
  "....iijjjjii....",
  ".....iiiiii.....",
  "......iiii......",
  "......ghhg......",
  "......ghhg......",
  "......ghhg......",
  "......ghhg......",
  "......ghhg......",
  ".....gghhgg.....",
  "....gghhhhgg....",
  "...ggg....ggg...",
];

export const ALBERO_A_LOBI = [
  ".........iiii...",
  "..iii...iZZkii..",
  ".iZZki.iZZkkkji.",
  "iZZkkjiiZkkkjji.",
  "iZkkkjjiZkkkjji.",
  "iZkkjjjikkkjjji.",
  "ikkjjjiikkjjjji.",
  ".ijjjiiZZkjjjii.",
  ".iijiiZZkkkjjji.",
  "..iiiiZkkkkjjji.",
  "...iiikkkjjjjii.",
  "...iijkjjjjiii..",
  "....iijjjjiii...",
  ".....iiiiiii....",
  "......iiiii.....",
  "......ghhg......",
  "......ghhg......",
  "......ghhg......",
  "......ghhg......",
  "......ghhg......",
  ".....gghhgg.....",
  "....gghhhhgg....",
  "...ggg....ggg...",
];

export const ALBERI = [ALBERO_TONDO, ALBERO_ALTO, ALBERO_A_LOBI];

// L'albero di sempre, per chi lo chiede per nome: è quello tondo.
export const ALBERO = ALBERO_TONDO;

// I sassi (M7.18.47, secondo passo): tre forme — tondo, piatto e a coppia —
// col contorno scuro della fessura (X), la luce in alto a sinistra (Y, f) e
// l'ombra in basso a destra (d). Stessa misura di prima.
export const SASSO_TONDO = [
  "................",
  "......XXXX......",
  "....XXYYffXX....",
  "...XYYfffeedX...",
  "..XYffffeeeddX..",
  "..XfffeeeeeddX..",
  ".XffeeeeeedddX..",
  ".XeeeeeeeddddX..",
  "..XXddddddddXX..",
  "....XXXXXXXX....",
];

export const SASSO_PIATTO = [
  "................",
  "................",
  "................",
  "................",
  "....XXXXXXX.....",
  "..XXYYffffeXX...",
  ".XYfffeeeeeedX..",
  "XffeeeeeeeeddX..",
  ".XXeeedddddddXX.",
  "...XXXXXXXXXXX..",
];

export const SASSO_A_COPPIA = [
  "................",
  "................",
  "...XXXX.........",
  "..XYYfeX........",
  ".XYffeedX.XXX...",
  ".XfeeeddXXYfeX..",
  ".XeeeddXXfffedX.",
  "..XdddXXfeeeedX.",
  "...XXXXXdddddX..",
  "........XXXXX...",
];

export const SASSI = [SASSO_TONDO, SASSO_PIATTO, SASSO_A_COPPIA];
export const SASSO = SASSO_TONDO;

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

// La pianta secca dell'orto abbandonato d'inverno (M7.18.33): steli marroni
// piegati, gli stessi per tutte le colture — sotto il gelo sono paglia.
export const PIANTA_SECCA = [
  "................",
  "................",
  "................",
  "......4...4.....",
  "...4..h..4......",
  "....h.h.h...4...",
  ".....hhh...h....",
  "..4..gh...h.....",
  "...h.g.h.hg.....",
  "....hg..hg......",
  ".....gghg.......",
  "....ggggg.......",
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

// I cespugli (M7.18.47, secondo passo): tre forme — tondo, largo e rado —
// con le stesse chiavi delle chiome degli alberi, quindi con la stessa luce
// (Z) e le stesse stagioni. Stessa misura di prima.
export const CESPUGLIO_TONDO = [
  "................",
  "......iiii......",
  "....iiZZkjii....",
  "...iZZkkkkjji...",
  "..iZkkkjkkkjji..",
  ".iZZkkjiZkkjjji.",
  ".iZkkjjiZkkjjji.",
  "iZkkkjjikkkjjjii",
  "ikkjjjiikjjjjjii",
  ".ijjjiijjjjjiii.",
  "..iiijjjjjiiii..",
  "....iiiiiiii....",
];

export const CESPUGLIO_LARGO = [
  "................",
  "................",
  "................",
  "................",
  "...iiii...iii...",
  "..iZZkjiiiZkji..",
  ".iZkkkjiZZkkjji.",
  "iZkkkjjiZkkkjjji",
  "ikkkjjjikkkjjjji",
  "ijkjjjiijkjjjjii",
  ".iijjiiijjjjjii.",
  "..iiiiiiiiiiii..",
];

export const CESPUGLIO_RADO = [
  "................",
  "................",
  ".......i........",
  "...i..iZi..i....",
  "..iZi.iki.iZi...",
  "..ikkiikjiikji..",
  ".iZkjiZkkjikkji.",
  ".ikkjjkkjjjkjji.",
  "iZkjjjkjjjjjjji.",
  "ikkjjjjjjjjjjii.",
  ".iijjjjjjjjjii..",
  "...iiiiiiiiii...",
];

export const CESPUGLI = [CESPUGLIO_TONDO, CESPUGLIO_LARGO, CESPUGLIO_RADO];
export const CESPUGLIO = CESPUGLIO_TONDO;

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
// Ventidue righe e non sedici: cresce sopra il tassello come l'albero, perché
// un muro alto quanto il terreno si legge come un pavimento.
//
// Da M7.18.67 ha l'altezza. Le prime sedici righe sono la cima, vista
// dall'alto: lastre larghe e chiare (f, Y) con i giunti morbidi (e). Le
// ultime sei sono la faccia a sud, vista di fronte: due corsi più scuri (e,
// d) con i giunti neri (X). Prima tutte e venti le righe erano faccia, e un
// muro che scendeva verso sud era una pila di facce: si leggeva come un
// pavimento di pietra, non come una parete.
//
// Non serve sapere chi c'è accanto. La faccia è alta sei pixel, quanto il
// muro sporge sopra il suo tassello: il muro subito a sud si disegna dopo e
// la sua cima copre esattamente la faccia di questo. In una parete che
// scende si vedono solo le cime, e la faccia resta all'ultimo muro in fondo.
// È la ragione per cui faccia e sporgenza devono restare uguali.
//
// Cinque varianti: le prime tre pulite, le ultime due da rovina, con una
// crepa e il muschio (le chiavi delle chiome, quindi vestito per stagione).
// Un muro costruito dal giocatore pesca solo fra le pulite (vedi formaDi in
// mondo/mappa.js).
export const MURO_1 = [
  "YffefffffeYfffff",
  "fffffffffeffffff",
  "fffffffffeffffff",
  "fffffffffefffefe",
  "eeeeeeeeeeeeeeee",
  "YffffffffeYYfffe",
  "fffffffffeffffff",
  "ffffeffffeffffff",
  "fffffffffeffffff",
  "ffffffffeeffffff",
  "eeeeeeeeeeeeeeee",
  "YfeYYYfYYYYeYYff",
  "ffeYYfffYfYefeff",
  "ffeYffffYYYeffff",
  "feeYfYeYffYeffff",
  "ffeYfYfYYffefffe",
  "eXeeXeeXeeeeeeee",
  "dXedXedXeeeeeeed",
  "XXXXXXXXXXXXXXXX",
  "eeeXeeeeXeeeeeee",
  "dddXddddXddddddd",
  "XXXXXXXXXXXXXXXX",
];

export const MURO_2 = [
  "YYYfeYYfffffffff",
  "YfYfefffffffffff",
  "Yfffefffffffffff",
  "efYfeffffffeffff",
  "fYYfefffffffffff",
  "eeeeeeeeeeeeeeee",
  "YeeYfffeYffeYfef",
  "ffeffffeYYfeffff",
  "ffeffffeYffeffff",
  "ffefffeefYfefffe",
  "eeeeeeeeeeeeeeee",
  "YfeYYffffffeYYff",
  "ffeffffefffefeff",
  "ffeffffffffeffff",
  "ffeffffffffeffff",
  "ffeffffffffefffe",
  "eeeeXeeeeeeXeeee",
  "edddXeeedddXdded",
  "XXXXXXXXXXXXXXXX",
  "eeXeeeeeXeeeXeee",
  "ddXdddddXdddXddd",
  "XXXXXXXXXXXXXXXX",
];

export const MURO_3 = [
  "YYffeYYfffeeYYff",
  "ffffeffffffeffff",
  "fffeeffffffeffff",
  "ffffeefffffeffff",
  "eeeeeeeeeeeeeeee",
  "YYfffffeYfeYfeYf",
  "fffffffeffeffeff",
  "fffffffeffeffeff",
  "fffffffeffeffeff",
  "ffffffeeffeefeff",
  "eeeeeeeeeeeeeeee",
  "YeefffffeYffeYYf",
  "ffffffffefffefff",
  "ffffffffefffefff",
  "ffffffffefffefff",
  "fffffffeeffeefff",
  "eeXeeeeeeeeeeXee",
  "edXdeeeeeeeedXee",
  "XXXXXXXXXXXXXXXX",
  "eXeeeeeeXeeeeeee",
  "dXddddddXddddddd",
  "XXXXXXXXXXXXXXXX",
];

export const MURO_4 = [
  "YYYYYYYfeYffffff",
  "ffYYfYYfdfffffff",
  "eYYYfYfdefffffff",
  "kkYfYYdYefffkkkf",
  "jjYYfeeYeffffjjf",
  "eeeeeeeeeeeeeeee",
  "YYffeYffffeYffff",
  "ffffeffeffeYffYY",
  "ffffefffffeYYfff",
  "ffffefffffefYYfe",
  "eeeeeeeeeeeeeeee",
  "YfeYYYffYffYfeYf",
  "ffeYYffffYYYYeff",
  "ffeffYYffYYffeff",
  "ffeYffYffYffYeff",
  "ffeYYYfYYffYeeff",
  "eXeeeekkeXeeeeee",
  "dXdeeejjdXeeeeee",
  "XXXXXXXXXXXXXXXX",
  "eeeeeeXeeeXeeeee",
  "ddddddXdddXddddd",
  "XXXXXXXXXXXXXXXX",
];

export const MURO_5 = [
  "YYfeYfffffffffff",
  "fffedfffffffffff",
  "fffefdfffffffffe",
  "fffeffdffffffffe",
  "eeeeedeeeeeeeeee",
  "YYfffffffeYfeYYf",
  "fffffffffeffefff",
  "fffffffffeffefff",
  "feeffkkkfeffefff",
  "ffffffjffeffefff",
  "eeeeeeeeeeeeeeee",
  "YYekkeYYffffffff",
  "YYejjeffffffffff",
  "YfefYeffffffffff",
  "YYeYYeffffffffff",
  "YYeYYefffffffeef",
  "eeeeeXkkkeeeeeee",
  "eeeedXjjjedeeeee",
  "XXXXXXXXXXXXXXXX",
  "eeeeeeXeeXeeeeee",
  "ddddddXddXdddddd",
  "XXXXXXXXXXXXXXXX",
];

export const MURI = [MURO_1, MURO_2, MURO_3, MURO_4, MURO_5];
export const MURI_PULITI = [MURO_1, MURO_2, MURO_3];
export const MURO = MURO_1;

// Quello che resta dove il muro è venuto giù. Basso e non solido: ci si passa
// sopra, ed è da qui che si entra.
//
// Si vede che era un muro — stesse pietre, stessi grigi — perché un mucchio di
// sassi generico direbbe soltanto "ostacolo", mentre qui l'informazione è
// "qui c'era un muro e adesso c'è un varco". È la differenza fra un sasso e
// una porta.
// Da M7.18.50 tre forme, con le pietre del muro nuovo: luce, ombra, giunti.
export const MURO_ROTTO_1 = [
  "....XX....XX....",
  "...XfYX..XYfX...",
  "..XYffeX.XfeeX..",
  ".XffeddXXfeeedX.",
  "XYfeeeeXYfeeeedX",
  "XfeeddeefeeddedX",
  "XXeeeeddeeeeeeXX",
  ".XXXXXXXXXXXXXX.",
];

export const MURO_ROTTO_2 = [
  "................",
  "................",
  "......XXX.......",
  "..XX.XYfeX..XX..",
  ".XYfXXfeedXXYfX.",
  "XfeedXeeddXfeedX",
  "XeeddeeeeeeeeddX",
  ".XXXXXXXXXXXXXX.",
];

export const MURO_ROTTO_3 = [
  "..XXXXX.........",
  ".XYfffeX........",
  ".XfeeeedX..XXX..",
  ".XeeeeddX.XYfeX.",
  "XXeeeddXXXfeeedX",
  "XYfeddXXYfeeeddX",
  "XfeeeeeeeeeeddXX",
  ".XXXXXXXXXXXXXX.",
];

export const MURI_ROTTI = [MURO_ROTTO_1, MURO_ROTTO_2, MURO_ROTTO_3];
export const MURO_ROTTO = MURO_ROTTO_1;

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

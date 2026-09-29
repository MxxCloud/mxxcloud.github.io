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

// Da M7.18.55 l'albero alto è un abete: sempreverde, a palchi, con le sue
// chiavi (0 il contorno, x il corpo, y la luce) che le stagioni non toccano.
// D'inverno è l'unico verde del bosco, ed è quello che tiene il paesaggio
// lontano dal grigio della pietra.
export const ALBERO_ALTO = [
  "......0xx0......",
  "......0xx0......",
  ".....0yxxx0.....",
  ".....0yxxx0.....",
  "....000xx000....",
  ".....0yxxx0.....",
  "....0yyxxxx0....",
  "...0yyyxxxxx0...",
  "...00yyxxxx00...",
  "...0yyyxxxxx0...",
  "..0yyyyxxxxxx0..",
  ".0000yyxxxx0000.",
  "..0yyyyxxxxxx0..",
  "00yyyyyxxxxxxx00",
  "0000000000000000",
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

// L'inverno (M7.18.55): il tondo e quello a lobi perdono le foglie e restano
// rami, aperti come era la chioma, con un filo di neve sopra; l'abete tiene
// gli aghi e prende la neve sui palchi. Stessa misura, stesso tronco, stessa
// base: urti, ombre e vento non se ne accorgono, e ogni albero resta della
// sua specie — cambia solo il vestito (vedi formaDi in mondo/mappa.js).
export const SPOGLIO_TONDO = [
  "............z...",
  "....g..g....g...",
  "..g..g.g..gg.g..",
  "..gz.gzg.zg.zg..",
  "...g..gg.g..g...",
  "...g..gg.g..g...",
  ".gggg.gg.g.g.g..",
  "....ggzhgzgg..g.",
  ".....gghhgg.....",
  "...gg.ghhg.gg...",
  "..g....hh....g..",
  ".......hh.......",
  ".......hh.......",
  ".......hh.......",
  ".......hh.......",
  "......ghhg......",
  "......ghhg......",
  "......ghhg......",
  "......ghhg......",
  "......ghhg......",
  ".....gghhgg.....",
  "....gghhhhgg....",
  "...ggg....ggg...",
];
export const ABETE_INNEVATO = [
  "......0zz0......",
  "......0zz0......",
  ".....0yxxx0.....",
  ".....0yxxx0.....",
  "....000xx000....",
  ".....0zzzO0.....",
  "....0yyxxxx0....",
  "...0yyyxxxxx0...",
  "...00yyxxxx00...",
  "...0zzzxxOOO0...",
  "..0yyyyxxxxxx0..",
  ".0000yyxxxx0000.",
  "..0zzzzzzOOOO0..",
  "00yyyyyxxxxxxx00",
  "0000000000000000",
  "......ghhg......",
  "......ghhg......",
  "......ghhg......",
  "......ghhg......",
  "......ghhg......",
  ".....gghhgg.....",
  "....gghhhhgg....",
  "...ggg....ggg...",
];
export const SPOGLIO_A_LOBI = [
  "..........g.....",
  "..........g.....",
  "....g...gz.gz.g.",
  ".g.zg....g.ggg..",
  "..gg.....ggg....",
  "...g......g.....",
  "...zg....zggz...",
  ".gggggz..g..gg..",
  ".....gg..g....g.",
  "......ghhggg....",
  ".......hh..gg...",
  ".....gghh....g..",
  "...gg..hh.......",
  ".......hh.......",
  ".......hh.......",
  "......ghhg......",
  "......ghhg......",
  "......ghhg......",
  "......ghhg......",
  "......ghhg......",
  ".....gghhgg.....",
  "....gghhhhgg....",
  "...ggg....ggg...",
];
export const ALBERI_INVERNO = [SPOGLIO_TONDO, ABETE_INNEVATO, SPOGLIO_A_LOBI];

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
// Da M7.18.50 il muro è in pietra vera: pietre irregolari su file sfalsate,
// ognuna con la luce in alto a sinistra (Y, f), l'ombra in basso a destra (d)
// e i giunti scuri (X), sotto un coronamento chiaro. Cinque varianti: le
// prime tre pulite, le ultime due da rovina, con una crepa e il muschio
// (le chiavi delle chiome, quindi vestito per stagione). Un muro costruito
// dal giocatore pesca solo fra le pulite (vedi formaDi in mondo/mappa.js).
export const MURO_1 = [
  "fffYffffYfffffff",
  "eeeeeeeeeedeeeed",
  "XXXXXXXXXXXXXXXX",
  "fffXYfXYffXYfffX",
  "eeeXeeXeeeXeeeeX",
  "eedXedXeedXeeedX",
  "XXXXXXXXXXXXXXXX",
  "YffffXYeeXYfXYff",
  "eeeeeXdddXeeXeee",
  "eeeedXdddXedXeed",
  "XXXXXXXXXXXXXXXX",
  "fffXYfXYfXYfffXY",
  "eeeXeeXeeXeeeeXe",
  "eedXedXedXeeedXe",
  "XXXXXXXXXXXXXXXX",
  "fXYffXYffXYffXYe",
  "eXeeeXeeeXeeeXdd",
  "dXeedXeedXeedXdd",
  "XXXXXXXXXXXXXXXX",
  "eeXYffXYffffXYff",
];

export const MURO_2 = [
  "YfffffYfffffYYff",
  "deeedeeedeeeeeee",
  "XXXXXXXXXXXXXXXX",
  "ffXYffffXYfXYfff",
  "eeXeeeeeXeeXeeee",
  "edXeeeedXedXeeed",
  "XXXXXXXXXXXXXXXX",
  "ffXYffXYfXYeeeeX",
  "eeXeeeXeeXdddddX",
  "edXeedXedXdddddX",
  "XXXXXXXXXXXXXXXX",
  "fffXYfXYfffXYffX",
  "eeeXeeXeeeeXeeeX",
  "eedXedXeeedXeedX",
  "XXXXXXXXXXXXXXXX",
  "YfXYeeeXYfffXYee",
  "eeXddddXeeeeXddd",
  "edXddddXeeedXddd",
  "XXXXXXXXXXXXXXXX",
  "YfffXYeeXYffffXY",
];

export const MURO_3 = [
  "fYYYffffffYYffff",
  "eeeeeeeeeeeeeeee",
  "XXXXXXXXXXXXXXXX",
  "eeeXYffffXYfXYff",
  "dddXeeeeeXeeXeee",
  "dddXeeeedXedXeee",
  "XXXXXXXXXXXXXXXX",
  "eeeeXYfXYfXYffff",
  "ddddXeeXeeXeeeee",
  "ddddXedXedXeeeed",
  "XXXXXXXXXXXXXXXX",
  "YffXYffffXYffXYf",
  "eeeXeeeeeXeeeXee",
  "eedXeeeedXeedXee",
  "XXXXXXXXXXXXXXXX",
  "ffXYfffXYeXYfffX",
  "eeXeeeeXddXeeeeX",
  "edXeeedXddXeeedX",
  "XXXXXXXXXXXXXXXX",
  "ffffXYffffXYeeXY",
];

export const MURO_4 = [
  "fkffYkkfffffYffY",
  "eeeeeeeeeeeeedee",
  "XXXXXXXXXXXXXXXX",
  "ffXYfXYffXYeXYff",
  "eeXeeXeeeXddXeee",
  "edXedXeedXddXeee",
  "XXXXXXXXXXXXXXXX",
  "ffffXYeXYeXYeeXY",
  "eeeeXddXddXXddXd",
  "eeedXddXddXdXdXd",
  "XXXkkkkXXXXXXXXX",
  "fffjjYjfXYfXYXff",
  "eeeeXeeeXeeXeeXe",
  "eeedXeedXedXeeed",
  "XXXXXXXXXXXXXXXX",
  "fXYffXYffXYkkkYf",
  "eXeeeXeeeXeejjee",
  "dXeekkkkdXeedXee",
  "XXXXjjjjXXXXXXXX",
  "fXYffXYfXYfffXYf",
];

export const MURO_5 = [
  "YYYYfffkYYffffYY",
  "eeeeeeeeeeeeeded",
  "XXXXXXXXXXXXXXXX",
  "XYeeeeXYffffXYee",
  "XdddddXeeeXeXddd",
  "XdddddXeeXedXddd",
  "XXXXXXXXXXXXXXXX",
  "YffXYfXYfXfXYeee",
  "eeeXeeXeXeeXdddd",
  "eedXedXeXedXdddd",
  "XXXXXXXXXXXXXXXX",
  "ffXkkfffXYfffXYf",
  "eeXjjeeeXeeeeXee",
  "edXeeeedXeeedXee",
  "XXkkkXXXXXXXXXXX",
  "YeejjYffffXYeeee",
  "ddddXeeeeeXddddd",
  "ddkkkeeeedXddddd",
  "XXjjjXXXXXXXXXXX",
  "YffXYfXYfXYfXYfX",
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

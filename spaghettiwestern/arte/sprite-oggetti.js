// Oggetti che stanno sul terreno: alberi, sassi, cespugli.
//
// A differenza dei tasselli questi sono disegnati a mano, perché qui conta la
// sagoma: un albero si riconosce dalla silhouette molto prima che dal colore.
//
// Sono più alti di un tassello e vengono disegnati ancorati ai piedi, non in
// alto a sinistra: è ciò che fa passare il superstite davanti o dietro
// all'albero a seconda di dove ha i piedi (vedi l'ordinamento in mappa.js).

// Gli alberi del deserto (W0.2). ALBERO resta un oggetto solo, con le sue
// regole — si abbatte, dà legna, ferma il passo — ma si disegna in due modi:
// il saguaro, il cactus a candelabro che è il western stesso, e il mesquite,
// l'alberello storto e spinoso delle pianure di confine. Quale dei due lo
// decide la posizione (vedi disegnoDellAlbero in mondo/mappa.js), quindi un
// albero è sempre lo stesso. «Legna di cactus» è un'ironia voluta.
//
// Il saguaro ha i suoi verdi (F, H, I) fuori dalle vesti delle stagioni: un
// cactus non ingiallisce in autunno. Il mesquite usa quelli delle chiome, e
// cambia colore con l'anno come prima faceva l'albero.
export const SAGUARO = [
  "......FHHF......",
  ".....FHIIHF.....",
  ".....FHIIHF.....",
  ".....FHIIHF.....",
  ".....FHIHHF.....",
  ".....FHIHHF..FF.",
  ".FF..FHIHHF.FHHF",
  "FHHF.FHIHHF.FHIF",
  "FHIF.FHIHHF.FHIF",
  "FHIF.FHIHHF.FHIF",
  "FHIHFFHIHHF.FHIF",
  "FHIHHHHIHHFFHIHF",
  ".FHHHHHIHHHHHHF.",
  "..FFFFHIHHFFFF..",
  ".....FHIHHF.....",
  ".....FHIHHF.....",
  ".....FHIHHF.....",
  ".....FHIHHF.....",
  ".....FHIHHF.....",
  ".....FHIHHF.....",
  ".....FHHHHF.....",
  "....44FFFF44....",
  "...4455555544...",
];

export const MESQUITE = [
  "................",
  "....iij..jii....",
  "..iijjjjijjkji..",
  ".ijjkkjjjjkkjji.",
  "ijjkkkkjjkkkkjji",
  "ijkkkkkjkkkkkkji",
  ".ijjkkjjjjkkjji.",
  "..iijji..ijjii..",
  "....iig..gii....",
  "......gh.g......",
  ".......hg.......",
  ".......hg.......",
  "......ghh.......",
  "......ghh.......",
  ".....gghhg......",
  "....gg..hgg.....",
];

// Il nome di prima resta, per chi chiede «un albero» senza sapere dove.
export const ALBERO = MESQUITE;

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
// Da W0.3 è adobe: intonaco chiaro di fango, i mattoni scuri dove è caduto,
// una trave in cima. Vale anche per i muri che costruisci tu.
export const MURO = [
  "hhhhhhhhhhhhhhhh",
  "gghgghgghgghgghg",
  "JJJJJJJJJJJJJJJJ",
  "JJJJJJJJJJJJKJJJ",
  "JJJKJJJJJJJJJJJJ",
  "JJJJJJJJJJKKJJJJ",
  "JJJJJJJJJJJJJJJJ",
  "JJKLLKJJJJJJJJJJ",
  "JKLLLLKJJJJJKJJJ",
  "JJKLLKJJJJJJJJJJ",
  "JJJJJJJJJJJJJJJJ",
  "JJJJJJJKJJJJJJJJ",
  "JJJJJJJJJJJKLLKJ",
  "KJJJJJJJJJKLLLLK",
  "JJJJJJJJJJJKLLKJ",
  "JJJKJJJJJJJJJJJJ",
  "KKJJJJJJJJJJJJKK",
  "KKKKKKKKKKKKKKKK",
  "LLKKLLKKKLLKKLLK",
  "LLLLLLLLLLLLLLLL",
];

// Quello che resta dove il muro è venuto giù. Basso e non solido: ci si passa
// sopra, ed è da qui che si entra.
//
// Si vede che era un muro — stesse pietre, stessi grigi — perché un mucchio di
// sassi generico direbbe soltanto "ostacolo", mentre qui l'informazione è
// "qui c'era un muro e adesso c'è un varco". È la differenza fra un sasso e
// una porta.
export const MURO_ROTTO = [
  "....LK....KL....",
  "...KJJK..KJJK...",
  "..KJJJJK.KJJJK..",
  ".KJJLLKJJKJJJJK.",
  "KJJJJJJKJJJJJJJK",
  "KJJLLJJJJJJKJJJK",
  "LLKKKKKKKKKKKKLL",
  ".LLLLLLLLLLLLLL.",
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

// Il cespuglio del deserto (W0.2): più basso e più ispido di quello della
// valle, rami a punta invece di una palla di foglie. Le bacche, dove ci sono,
// restano rosse: sono ancora uno dei due colori da trovare.
export const CESPUGLIO = [
  "................",
  "................",
  "....j..k..j.....",
  "..j.jk.j.kj.j...",
  "...jkjkjkjkj..j.",
  ".j.kjkkjkkjkjj..",
  "..jkkjkkkjkkjkj.",
  ".jjkkkjkjkkkjjj.",
  "jjkkjkkkkkjkkjjj",
  ".ijjkkjkkjkkjji.",
  "..iijjjjjjjjii..",
  "....iiiiiiii....",
];

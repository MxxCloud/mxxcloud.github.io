// Le cose che si raccolgono, si costruiscono e si portano nello zaino.
//
// Le icone sono 12x12: entrano in una casella dello zaino con un margine, e
// restano leggibili a occhio anche quando la scala dello schermo è 2x. Più
// piccole diventerebbero macchie colorate, più grandi non ci starebbero in
// otto sulla barra.

export const LEGNA = [
  "............",
  "............",
  ".rrrrrrrrrr.",
  ".rhhhhhhhhr.",
  ".rhgghgghhr.",
  ".rhhhhhhhhr.",
  ".rhgghgghhr.",
  ".rhhhhhhhhr.",
  ".rrrrrrrrrr.",
  "............",
  "............",
  "............",
];

export const RAMO = [
  "............",
  "..........gh",
  ".........hg.",
  "........hg..",
  "...h...hg...",
  "....hghg....",
  ".....hg.....",
  "....hg......",
  "...hg.......",
  "..hg........",
  "............",
  "............",
];

export const PIETRA = [
  "............",
  "............",
  "...dddd.....",
  "..deeeed....",
  ".deefffeed..",
  ".deffffeed..",
  ".deeffeeed..",
  "..deeeeed...",
  "...ddddd....",
  "............",
  "............",
  "............",
];

export const FIBRA = [
  "............",
  "...k..k.....",
  "..k.kk.k....",
  "..k.kk.k....",
  "...kkkk.....",
  "...jjjj.....",
  "..jjjjjj....",
  "...jjjj.....",
  "...9999.....",
  "....99......",
  "............",
  "............",
];

export const BACCHE = [
  "............",
  ".....j......",
  "....jkj.....",
  "...ttjtt....",
  "..tttjttt...",
  "..tttjttt...",
  "...tt.tt....",
  "............",
  "............",
  "............",
  "............",
  "............",
];

export const TORCIA = [
  "............",
  ".....v......",
  "....vuv.....",
  "....vuv.....",
  ".....u......",
  "....ghg.....",
  "....ghg.....",
  "....ghg.....",
  "....ghg.....",
  "....ghg.....",
  "............",
  "............",
];

export const FALO = [
  "............",
  ".....v......",
  "....vuv.....",
  "...vuuuv....",
  "...vuuuv....",
  "....vuv.....",
  "..g.....g...",
  "..hg...gh...",
  "...hg.gh....",
  "..ghhhhhg...",
  "...gggg.....",
  "............",
];

// Il falò posato per terra è un'altra cosa dall'icona nello zaino: più grande,
// ancorato ai piedi come gli alberi, e con la fiamma su due fotogrammi. Un
// fuoco fermo si legge come un disegno di un fuoco; basta pochissimo movimento
// perché si legga come un fuoco.
export const FALO_ACCESO = [
  [
    "................",
    ".......v........",
    "......vuv.......",
    ".....vuuuv......",
    ".....vuuuv......",
    "....vuuuuuv.....",
    ".....vuuuv......",
    "......vuv.......",
    "...g.......g....",
    "...hg.....gh....",
    "....hg...gh.....",
    "..ghhhhhhhhg....",
    "...ggggggg......",
    "................",
  ],
  [
    "................",
    "......v.........",
    "......vuv.......",
    ".....vuuv.......",
    "....vuuuuv......",
    "....vuuuuv......",
    ".....vuuuv......",
    "......vuv.......",
    "...g.......g....",
    "...hg.....gh....",
    "....hg...gh.....",
    "..ghhhhhhhhg....",
    "...ggggggg......",
    "................",
  ],
];

// Il falò spento resta lì a dire "qui c'era un accampamento": è il primo
// pezzo di mondo che il giocatore lascia dietro di sé.
export const FALO_SPENTO = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "...d.......d....",
  "...gd.....dg....",
  "....dg...gd.....",
  "..dggggggggd....",
  "...ddddddd......",
  "................",
];

export const ASCIA = [
  "............",
  "..eeee......",
  ".effffe.....",
  ".efffee.....",
  "..eeehg.....",
  "....hg......",
  "...hg.......",
  "..hg........",
  ".hg.........",
  ".g..........",
  "............",
  "............",
];

// La torcia piantata per terra: luce fissa che costa un quinto di un falò.
// Due fotogrammi, come il falò — un fuoco fermo si legge come il disegno di
// un fuoco.
export const TORCIA_PIANTATA = [
  [
    "................",
    "................",
    ".......v........",
    "......vuv.......",
    "......vuv.......",
    ".......u........",
    "......ghg.......",
    "......ghg.......",
    "......ghg.......",
    "......ghg.......",
    "......ghg.......",
    "......ghg.......",
    ".....ddgdd......",
    "......ddd.......",
    "................",
    "................",
  ],
  [
    "................",
    "................",
    "......v.........",
    "......vuv.......",
    ".......uv.......",
    ".......u........",
    "......ghg.......",
    "......ghg.......",
    "......ghg.......",
    "......ghg.......",
    "......ghg.......",
    "......ghg.......",
    ".....ddgdd......",
    "......ddd.......",
    "................",
    "................",
  ],
];

export const GIACIGLIO = [
  "............",
  "............",
  "..hhhhhhhh..",
  ".h99999999h.",
  ".h9aaaaaa9h.",
  ".h9aaaaaa9h.",
  ".h99999999h.",
  "..hhhhhhhh..",
  "............",
  "............",
  "............",
  "............",
];

// Il giaciglio steso per terra. Non è alto: si disegna quasi tutto dentro il
// suo tassello, al contrario di alberi e falò che crescono verso l'alto.
export const GIACIGLIO_STESO = [
  "................",
  "................",
  "..hhhhhhhhhhhh..",
  ".h999999999999h.",
  ".h9aaaaaaaaaa9h.",
  ".h9aaaaaaaaaa9h.",
  ".h9aaaaaaaaaa9h.",
  ".h9aaaaaaaaaa9h.",
  ".h999999999999h.",
  "..hhhhhhhhhhhh..",
];

export const ZAPPA = [
  "............",
  "..eeee......",
  "..eeee......",
  "...ehg......",
  "....hg......",
  "....hg......",
  ".....hg.....",
  ".....hg.....",
  "......hg....",
  "......hg....",
  "............",
  "............",
];

export const SECCHIO = [
  "............",
  "..ssssssss..",
  "..s......s..",
  "..s......s..",
  "..s......s..",
  "..s......s..",
  "..s......s..",
  "...s....s...",
  "...ssssss...",
  "............",
  "............",
  "............",
];

// Pieno e vuoto sono due oggetti distinti invece di un secchio con un livello
// dentro: lo zaino tiene coppie cosa-quantità e non stati, e due icone
// diverse si distinguono a colpo d'occhio meglio di un numero.
export const SECCHIO_PIENO = [
  "............",
  "..ssssssss..",
  "..s333333s..",
  "..s322223s..",
  "..s222222s..",
  "..s222222s..",
  "..s222222s..",
  "...s2222s...",
  "...ssssss...",
  "............",
  "............",
  "............",
];

export const SEMI = [
  "............",
  "............",
  "...bb..bb...",
  "..baab.baab.",
  "..baab.baab.",
  "...bb..bb...",
  "....bb......",
  "...baab.....",
  "...baab.....",
  "....bb......",
  "............",
  "............",
];

export const RAPA = [
  "............",
  "....k.k.....",
  "...kkkkk....",
  "....kkk.....",
  "...55555....",
  "..5555555...",
  "..5555555...",
  "...55555....",
  "....555.....",
  ".....5......",
  "............",
  "............",
];

// Il sacco su cui si posa quello che si toglie dallo zaino. È 16x16, cioè un
// tassello intero, perché sta per terra e non in una casella: sopra ci va
// l'icona della cosa contenuta, così un mucchio si riconosce da lontano per
// quello che è invece che per il fatto di essere un mucchio.
export const MUCCHIO = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "....gggggggg....",
  "..gghhhhhhhhgg..",
  ".ghhhhhhhhhhhhg.",
  ".ghhhhhhhhhhhhg.",
  "..gghhhhhhhhgg..",
  "....gggggggg....",
];

// Il corpo del superstite di prima, steso. Sedici per dieci, cioè un tassello
// in larghezza e poco più di mezzo in altezza: è quanto occupa una persona
// distesa, e l'altezza bassa è metà del disegno — tutto il resto della valle
// sta in piedi, e una figura orizzontale si legge come "caduta" prima ancora
// che si distingua cosa sia.
//
// Il viso usa l'ombra della pelle e non la luce: è l'unico posto del gioco in
// cui la pelle è più scura del normale, e a questa dimensione il pallore è
// l'unico modo di dire "morto" invece di "sdraiato".
export const CADAVERE = [
  "................",
  "................",
  "................",
  "....rrrr........",
  "...rqqqqrrrrr...",
  "..rqlmmlqoooor..",
  "..rqllllqooonnnr",
  "...rqqqqrrrnnnnr",
  "....rrrr...rrrrr",
  "................",
];

// La benda: una fascia di tela arrotolata. Bianco sporco e non bianco pulito
// — è fibra strappata e bollita, non garza da farmacia — e con un capo che
// pende, perché un rotolo perfetto a dodici pixel si legge come una moneta.
//
// La macchia scura al centro è il rotolo visto di taglio: senza, la fascia
// era un rettangolo chiaro identico a mezza dozzina di altre cose.
// La cassa: il primo posto tuo in cui mettere le cose.
//
// Il coperchio più chiaro del corpo, e in mezzo una piastra di metallo. Il
// metallo è l'unico dettaglio che non serve a dire "legno": serve a dire che
// si apre, perché una cassa chiusa e un blocco di legno hanno la stessa
// sagoma e la differenza sta tutta lì.
export const CASSA = [
  "................",
  "................",
  "................",
  "...wwwwwwwwww...",
  "..wccccccccccw..",
  "..wcwwwwwwwwcw..",
  "..wccccccccccw..",
  "..wwwwwwwwwwww..",
  "..whhhhhhhhhhw..",
  "..whhhhsshhhhw..",
  "..whhhhsshhhhw..",
  "..whhhhhhhhhhw..",
  "..wwwwwwwwwwww..",
  "...gggggggggg...",
];

// La stessa cosa in dodici pixel, per la casella dello zaino.
export const CASSA_ICONA = [
  "............",
  "............",
  "..wwwwwwww..",
  ".wccccccccw.",
  ".wcwwwwwwcw.",
  ".wccccccccw.",
  ".wwwwwwwwww.",
  ".whhhhhhhhw.",
  ".whhhsshhhw.",
  ".whhhhhhhhw.",
  ".wwwwwwwwww.",
  "............",
];

export const BENDA = [
  "............",
  "............",
  "..zzzzzzz...",
  ".zzAAAAAzz..",
  ".zzAzzzAzz..",
  ".zzAzzzAzz..",
  ".zzAAAAAzz..",
  "..zzzzzzz...",
  "....zz......",
  "...zz.......",
  "............",
  "............",
];

// La rapa arrostita. Non è la rapa con un'altra tinta: è infilzata su uno
// spiedo, e la differenza sta nella sagoma prima che nel colore.
//
// Il motivo è pratico e si vede solo in una casella da diciotto pixel: rapa e
// rapa arrostita finiscono quasi sempre in due caselle adiacenti dello zaino,
// e due tondi dello stesso disegno in tinte diverse a quella dimensione sono
// la stessa cosa vista due volte. Lo spiedo si riconosce prima del colore.
export const RAPA_ARROSTITA = [
  "..........gh",
  ".........hg.",
  "........hg..",
  "...cccccg...",
  "..cc44ccc...",
  "..cc44ccc...",
  "...ccccc....",
  "..hg.cc.....",
  ".hg.........",
  "g...........",
  "............",
  "............",
];

// Le bacche secche, sparse su un pezzo di tela invece che attaccate al ramo.
// Stessa ragione della rapa: quello che cambia è dove stanno, non di che
// colore sono. Il rosso è spento — sono passate dal fuoco — e sono più
// piccole, perché seccando si raggrinziscono.
export const BACCHE_SECCHE = [
  "............",
  "............",
  ".zzzzzzzzzz.",
  ".z.A..A...z.",
  ".zA.A...A.z.",
  ".z...A.A..z.",
  ".zA..A...Az.",
  ".z..A...A.z.",
  ".zzzzzzzzzz.",
  "............",
  "............",
  "............",
];

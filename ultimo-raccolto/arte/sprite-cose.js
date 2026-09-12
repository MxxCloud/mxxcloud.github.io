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

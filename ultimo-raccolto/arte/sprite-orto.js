// L'orto: terra lavorata e i quattro stadi di una coltura.
//
// Ogni stadio contiene anche il terreno, perché una coltura è terra lavorata
// più quello che ci cresce sopra: disegnarli separati vorrebbe dire due
// oggetti sullo stesso tassello, e un tassello ne regge uno.
//
// Le piantine stanno su tre file allineate ai solchi. Un orto si riconosce
// dal ritmo regolare molto prima che dalla forma della singola pianta — è
// quello che lo distingue da un cespuglio cresciuto per caso.

export const TERRA_ZAPPATA = [
  "bbbbbbbbbbbbbbbb",
  "bccbbccbbccbbccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
  "bccbbccbbccbbccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
  "bccbbccbbccbbccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
  "bccbbccbbccbbccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
  "bccbbccbbccbbccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
];

export const SEMINATO = [
  "bbbbbbbbbbbbbbbb",
  "bccbbccbbccbbccb",
  "bccbbccbbccbbccb",
  "bbgbbbbgbbbbgbbb",
  "bccbbccbbccbbccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
  "bccbbccbbccbbccb",
  "bcgbbccgbccbgccb",
  "bbbbbbbbbbbbbbbb",
  "bccbbccbbccbbccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
  "bcgbbccgbccbgccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
];

export const GERMOGLIO = [
  "bbbbbbbbbbbbbbbb",
  "bccbbccbbccbbccb",
  "bcybbccybccbyccb",
  "bbybbbbybbbbybbb",
  "bccbbccbbccbbccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
  "bcybbccybccbyccb",
  "bcybbccybccbyccb",
  "bbbbbbbbbbbbbbbb",
  "bccbbccbbccbbccb",
  "bccbbccbbccbbccb",
  "bbybbbbybbbbybbb",
  "bcybbccybccbyccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
];

export const CRESCIUTA = [
  "bbbbbbbbbbbbbbbb",
  "bcybbccybccbyccb",
  "byyybcyyyccyyycb",
  "bbxbbbbxbbbbxbbb",
  "bccbbccbbccbbccb",
  "bccbbccbbccbbccb",
  "bbybbbbybbbbybbb",
  "byyybcyyyccyyycb",
  "bcxbbccxbccbxccb",
  "bbbbbbbbbbbbbbbb",
  "bccbbccbbccbbccb",
  "bcybbccybccbyccb",
  "byyybbyyybbyyybb",
  "bcxbbccxbccbxccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
];

export const MATURA = [
  "bbybbbbybbbbybbb",
  "byyybcyyyccyyycb",
  "bcxbbccxbccbxccb",
  "b555bb555bb555bb",
  "bccbbccbbccbbccb",
  "bcybbccybccbyccb",
  "byyybbyyybbyyybb",
  "bcxbbccxbccbxccb",
  "b555bc555cc555cb",
  "bbbbbbbbbbbbbbbb",
  "bcybbccybccbyccb",
  "byyybcyyyccyyycb",
  "bbxbbbbxbbbbxbbb",
  "b555bc555cc555cb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
];


// La matura lasciata lì che è andata a seme: la rapa è parente del cavolo, e
// fiorisce gialla su uno stelo alto. Si legge da lontano come l'unico
// stadio col giallo, ed è quello che serve — è l'unico da cui escono semi, e
// dopo due giorni si secca.
export const A_SEME = [
  "bbvbbbbvbbbbvbbb",
  "bvxvbcvxvccvxvcb",
  "bcxbbccxbccbxccb",
  "bbxbbbbxbbbbxbbb",
  "bcxbbccxbccbxccb",
  "bvybbcvybccvyccb",
  "bvxvbbvxvbbvxvbb",
  "bcxbbccxbccbxccb",
  "bcxbbccxbccbxccb",
  "bbybbbbybbbbybbb",
  "bvxvbcvxvccvxvcb",
  "bcxbbccxbccbxccb",
  "bbxbbbbxbbbbxbbb",
  "bcybbccybccbyccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
];

// Quello che resta di una coltura che nessuno ha raccolto in tempo, o che
// l'inverno ha preso. Stessi solchi, stesso passo delle piantine vive: si
// riconosce che era un orto, ed è il punto — un campo morto deve somigliare a
// quello che c'era prima, altrimenti è solo un altro tassello.
export const APPASSITA = [
  "bbbbbbbbbbbbbbbb",
  "bccbbccbbccbbccb",
  "bchgbcchgccbhgcb",
  "bggbbbggbbbggbbb",
  "bccbbccbbccbbccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
  "bchgbcchgccbhgcb",
  "bggbbcggbccggccb",
  "bbbbbbbbbbbbbbbb",
  "bccbbccbbccbbccb",
  "bccbbccbbccbbccb",
  "bbhgbbbhgbbbhgbb",
  "bggbbcggbccggccb",
  "bccbbccbbccbbccb",
  "bbbbbbbbbbbbbbbb",
];

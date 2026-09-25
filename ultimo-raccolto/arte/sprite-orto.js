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

// --- le altre colture (M7.17) ----------------------------------------------
//
// Le rape qui sopra sono disegnate a mano; le altre nascono da un
// motivo di tre pixel di lato ripetuto sui nove posti dei solchi — tre file
// per tre — che è il ritmo che fa riconoscere un orto (vedi l'inizio del
// file). Scritte così, due piantine della stessa coltura sono per forza
// uguali, e una coltura intera è una dozzina di righe invece di sessanta.
//
// Il motivo si posa sulla terra zappata; "." lascia la terra com'è. Uno alto
// quattro righe sale di una sopra il suo posto, come le rape mature.
const POSTI = [1, 6, 11];

function campo(motivo) {
  const righe = TERRA_ZAPPATA.map((r) => r.split(""));
  const su = motivo.length > 3 ? 1 : 0;
  for (const y0 of POSTI) {
    for (const x0 of POSTI) {
      motivo.forEach((riga, j) => {
        [...riga].forEach((pixel, i) => {
          if (pixel !== ".") righe[y0 - su + j][x0 + i] = pixel;
        });
      });
    }
  }
  return righe.map((r) => r.join(""));
}

// Per ogni coltura, un disegno per stadio. Il seminato è lo stesso per tutte:
// un seme nella terra è un seme, e cosa diventerà lo si vede dal germoglio.
// Quello a seme c'è solo per chi ci va: il cavolo fiorisce giallo come la
// rapa, che è sua parente, e il lino fa le sue capsule dorate.
const ALTRE = {
  // La patata: un cespuglio scuro e fitto, che fiorisce bianco quando è
  // pronta — il raccolto sta sotto, e sopra si vede solo il fiore.
  patata: {
    GERMOGLIO: [
      "x.x",
      ".x.",
      ".x.",
    ],
    CRESCIUTA: [
      "xyx",
      "yxy",
      ".x.",
    ],
    MATURA: [
      "z.z",
      "xzx",
      "yxy",
      ".x.",
    ],
  },
  // I fagioli salgono su un paletto: il legno è quello che li distingue da
  // lontano, e i baccelli pendono lungo il paletto quando sono pronti. Il
  // legno chiaro e non quello scuro, che sulla terra zappata spariva.
  fagioli: {
    GERMOGLIO: [
      "y.y",
      ".x.",
      ".x.",
    ],
    CRESCIUTA: [
      ".wy",
      "yw.",
      ".w.",
    ],
    MATURA: [
      "ywy",
      "xwx",
      "ywx",
      ".w.",
    ],
  },
  // Il cavolo: una rosetta che si chiude in una palla chiara.
  cavolo: {
    GERMOGLIO: [
      ".E.",
      "ExE",
      "...",
    ],
    CRESCIUTA: [
      "E.E",
      "ExE",
      ".x.",
    ],
    MATURA: [
      "EEE",
      "EEE",
      "xEx",
    ],
    A_SEME: [
      "v.v",
      "vxv",
      ".x.",
      "EEE",
    ],
  },
  // Il lino: steli sottili, fiori azzurri, e alla fine le capsule dorate con
  // dentro i semi.
  lino: {
    GERMOGLIO: [
      ".y.",
      ".y.",
      "...",
    ],
    CRESCIUTA: [
      "y.y",
      ".y.",
      ".y.",
    ],
    MATURA: [
      "C.C",
      "yCy",
      ".y.",
      ".y.",
    ],
    A_SEME: [
      "5.5",
      "y5y",
      ".y.",
      ".y.",
    ],
  },
  // Il grano (M7.18.25): fili d'erba fitti, poi steli alti, e alla fine le
  // spighe dorate che si piegano. Da lontano un campo biondo.
  grano: {
    GERMOGLIO: [
      "y.y",
      ".y.",
      "...",
    ],
    CRESCIUTA: [
      "yxy",
      "yxy",
      ".x.",
    ],
    MATURA: [
      "5.5",
      "454",
      "4.4",
      ".4.",
    ],
  },
};

const RAPA = { SEMINATO, GERMOGLIO, CRESCIUTA, MATURA, A_SEME };

// Cotti una volta sola, al caricamento: la cottura mette in cache per
// identità del disegno, e un disegno rifatto a ogni settore sarebbe ogni
// volta un disegno nuovo.
const DISEGNI = { rapa: RAPA };
for (const [coltura, motivi] of Object.entries(ALTRE)) {
  DISEGNI[coltura] = { SEMINATO };
  for (const [stadio, motivo] of Object.entries(motivi)) DISEGNI[coltura][stadio] = campo(motivo);
}

// Il disegno di questo stadio per questa coltura, per nome di stadio
// ("GERMOGLIO", "MATURA"...). Senza coltura, o per uno stadio che la coltura
// non ha, è quello della rapa: un campo di un salvataggio vecchio non ha la
// coltura scritta, ed era un campo di rape.
export function disegnoDi(coltura, stadio) {
  return DISEGNI[coltura]?.[stadio] ?? RAPA[stadio];
}

// Per i collaudi: tutti i disegni, per controllarne forma e colori.
export function tuttiIDisegni() {
  return Object.entries(DISEGNI).flatMap(([coltura, stadi]) =>
    Object.entries(stadi).map(([stadio, righe]) => ({ coltura, stadio, righe })));
}

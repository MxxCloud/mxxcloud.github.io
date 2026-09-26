// Tavolozza condivisa di Ultimo raccolto.
//
// Ogni colore ha una chiave di un solo carattere perché gli sprite sono scritti
// come righe di testo (vedi sprite.js): un carattere per pixel tiene una riga di
// sprite larga quanto lo sprite stesso, e in git il diff mostra a occhio quali
// righe di pixel sono cambiate.
//
// La tinta generale è desaturata e tendente al caldo: è una valle di fine
// estate lasciata andare, non un prato da cartolina. I colori saturi restano
// riservati a ciò che il giocatore deve notare — non ce n'è ancora nessuno, e
// quando arriverà avrà una chiave dedicata invece di rubarne una al paesaggio.

export const TAVOLOZZA = {
  ".": null, // trasparente

  // Acqua, dalla buca alla riva.
  "1": "#1d3a4a",
  "2": "#27556a",
  "3": "#4a8090",

  // Ghiaccio distinto dall'acqua profonda anche nella tavolozza invernale.
  //
  // "G" e non "A", e la lettera è una correzione: per tutta la vita del gioco
  // questa voce si chiamava A, e più in basso c'è un secondo A che è il sangue
  // degli infetti. In un oggetto letterale vince l'ultimo, quindi il ghiaccio
  // non è mai stato azzurro — gli stagni gelati si sono disegnati color sangue
  // per ogni inverno giocato finora, e rileggendo non si vedeva perché le due
  // voci stanno a settanta righe di distanza.
  //
  // Un collaudo adesso pretende che qui dentro non ci siano due chiavi uguali:
  // è il genere di errore che non si trova leggendo e che una prova trova in
  // un millesimo di secondo.
  G: "#abcdd7",
  B: "#d9e8e8",
  C: "#7498ab",

  // Sabbia e ghiaia della riva.
  "4": "#a8905f",
  "5": "#c9b189",

  // Erba viva.
  "6": "#2f4a26",
  "7": "#3f5f2d",
  "8": "#557a38",

  // Sterpaglia: erba andata a seme, il colore dell'incuria. Sta vicina
  // all'erba di proposito — è lo stesso prato più avanti nell'abbandono, non
  // un altro clima. Tinte più gialle facevano leggere un campo di grano.
  "9": "#6b6b3a",
  a: "#83804a",

  // Terra battuta e zolle.
  b: "#5a4430",
  c: "#75583c",

  // Roccia, grigio-bruna e non grigio-azzurra: la pietra fredda in una valle
  // calda di fine estate si legge come cemento.
  d: "#3b3a35",
  e: "#55534a",
  f: "#6e6b5f",

  // Legno: tronchi, assi, recinti.
  g: "#3b2a1c",
  h: "#56402a",

  // Chiome degli alberi.
  i: "#24401f",
  j: "#355a26",
  k: "#48742f",

  // Pelle.
  l: "#a06e4e",
  m: "#c98f68",

  // Vestiti del superstite: tessuto smorto, niente eroi.
  n: "#3a3f52",
  o: "#4e566e",
  p: "#6b7490",

  q: "#33261c", // capelli

  // Il contorno non è nero pieno: sul fondo scuro del sito il nero puro
  // scaverebbe un buco, mentre questo grigio-blu resta un bordo.
  r: "#16181c",

  s: "#8b93a1", // metallo

  // Le uniche tinte sature della tavolozza, e non per vezzo: il paesaggio è
  // tutto smorto, quindi il rosso di una bacca e il giallo di una fiamma sono
  // le sole cose che l'occhio trova da solo. Vanno spese con parsimonia — se
  // si colorasse di arancione anche un cespuglio, smetterebbero di funzionare.
  // Il legno vivo sotto la corteccia. Esiste per le scheggie: quelle di
  // colore uguale all'albero da cui escono sono invisibili contro l'albero
  // stesso, e una scheggia che non si vede non dice niente a nessuno.
  w: "#8a6a45",

  // I petali dei fiori di primavera. Bianco panna e non giallo o rosa: il
  // giallo finirebbe addosso alla sterpaglia, e il rosa vicino alle bacche,
  // che sono uno dei due colori che il giocatore deve trovare da solo. Questo
  // bianco freddo non assomiglia a niente di già usato tranne la sabbia, che
  // però sta sulla riva e non in mezzo al prato.
  z: "#d9dcc9",

  // Il verde dell'orto, e non quello delle chiome: sono due verdi uguali con
  // due chiavi diverse di proposito. Le chiome cambiano con la stagione, le
  // piantine no — a quale stadio è una coltura è l'informazione su cui il
  // giocatore agisce, e leggerla non può dipendere dal mese. È lo stesso
  // motivo per cui la terra innaffiata è più scura: nell'orto il colore
  // risponde a una domanda, non descrive la luce.
  x: "#355a26",
  y: "#48742f",
  // Il verde del cavolo, più chiaro e più freddo dei due qui sopra: una testa
  // di cavolo è una palla di foglie cerose, e a sedici pixel si riconosce dal
  // colore prima che dalla forma. Come loro non cambia con la stagione, ed è
  // il cavolo, fra tutte, quello che si guarda d'inverno.
  E: "#8aa57a",

  // Il sangue degli infetti. Scuro e smorto, non il rosso delle bacche: le
  // bacche sono uno dei due colori che il giocatore deve trovare da solo, e
  // uno spruzzo di sangue acceso ogni volta che si colpisce qualcosa li
  // renderebbe un colore qualunque. Questo è sangue vecchio, che è anche
  // quello che ci si aspetta da un corpo che cammina da mesi.
  A: "#5e2a24",

  // Il pesce secco, e le strisce di pesce appese all'essiccatoio: un blu
  // sbiadito verso il grigio. Il pesce crudo è "3", l'azzurro dell'acqua bassa
  // da cui viene; seccando perde l'acqua e resta questo — lo stesso salto che
  // la carne fa da "t" ad "A", detto nell'altra metà della tavolozza.
  D: "#5f7480",

  t: "#a33b2a", // bacche
  u: "#e0913a", // fiamma
  v: "#f2d06b", // fiamma, cuore
};

// La stessa tavolozza con la terra bagnata. Serve all'orto: guardando un campo
// si deve capire quali solchi sono stati innaffiati e quali no, e la risposta
// è il colore del terreno — che è come funziona anche fuori dal gioco.
//
// Cotta come tavolozza a parte invece che con sprite doppi: lo stesso disegno
// con due tavolozze è tutto ciò che serve, ed è il motivo per cui la tavolozza
// è un parametro della cottura fin dal primo giorno.
// Scurisce anche il legno, che nell'orto è il colore dei semi appena sparsi:
// alla tinta asciutta i semi finirebbero esattamente sul bruno della terra
// bagnata, e un solco seminato e innaffiato — cioè il caso normale —
// sembrerebbe vuoto.
export const TAVOLOZZA_BAGNATA = {
  ...TAVOLOZZA,
  b: "#3b2c1e",
  c: "#4e3a26",
  g: "#221a11",
};

// Le foglie di una pianta che ha passato un giorno senz'acqua. Non è una
// tavolozza intera ma una correzione, da stendere sopra quella che c'è — la
// asciutta o la bagnata, di qualunque stagione — perché una pianta assetata e
// poi innaffiata ha la terra scura e le foglie ancora gialle fino a domani.
// Tocca soltanto i verdi dell'orto, che le stagioni non toccano mai: la
// sete deve leggersi uguale in ogni mese, come lo stadio.
export const FOGLIE_ASSETATE = {
  x: "#6b6a2e",
  y: "#94904a",
  E: "#a8a46a",
};

// La terra stanca e quella sfinita (vedi orto.js): la stessa correzione della
// sete, stesa sulla terra asciutta. Più chiara e più grigia a ogni punto che
// perde, come la terra vera che non tiene più niente — e sulla terra bagnata
// non si stende, perché il bagnato è la risposta a una domanda più urgente.
// La terra grassa non ha un colore suo: più scura si confonderebbe proprio
// con quella bagnata, e lo dice il tasto quando si semina.
export const TERRA_STANCA = {
  b: "#66513d",
  c: "#836a50",
};
export const TERRA_SFINITA = {
  b: "#706656",
  c: "#8c8170",
};

// --- gli infetti ----------------------------------------------------------

// Gli infetti non hanno disegni propri: sono il superstite cotto con questa.
// Non è pigrizia ed è la cosa che dice di loro più di qualunque sprite nuovo
// — la stessa sagoma, la stessa andatura, gli stessi vestiti, svuotati. Erano
// come te, e il giocatore lo capisce senza che nessuno glielo scriva.
//
// È anche la stessa scelta che dà le stagioni: la tavolozza è un parametro
// della cottura, quindi un nemico intero costa sei righe invece di dodici
// fotogrammi da disegnare a mano.
//
// Si toccano solo le sei chiavi che i personaggi usano davvero — contate, non
// indovinate: contorno, capelli, pelle, due vesti e le scarpe.
export const TAVOLOZZA_INFETTO = {
  ...TAVOLOZZA,
  // Più scuro del contorno normale: di notte un infetto deve leggersi come un
  // buco nel paesaggio prima ancora che se ne distingua la faccia.
  r: "#0b0c0f",
  q: "#2a2a26",
  // La pelle è l'unica cosa che si riconosce a colpo d'occhio a sedici pixel,
  // quindi è dove sta tutto il lavoro: un grigio-verde che non assomiglia a
  // nessuna pelle e nemmeno all'erba, che è l'altra cosa verde in giro.
  m: "#8f9a7e",
  n: "#2f3330",
  o: "#454b44",
  g: "#241f1a",
};

// --- le stagioni ----------------------------------------------------------

// Quattro valli invece di una, e nemmeno un disegno in più: cambiano soltanto
// le chiavi del verde. È il pagamento di una scelta fatta il primo giorno —
// la tavolozza è un parametro della cottura, non una costante dentro sprite.js
// — e il conto torna adesso, che l'autunno costa dodici righe invece di un
// secondo atlante di tasselli.
//
// Si toccano solo erba, sterpaglia e chiome. Terra, roccia, acqua e legno
// restano: una valle che cambia colore tutta insieme si legge come un filtro
// applicato allo schermo, non come una stagione. Quello che cambia davvero
// fuori dalla finestra è ciò che è vivo.
const VESTI = {
  // La tavolozza base è già di fine estate: l'estate non veste niente. Averla
  // come voce vuota invece che come caso speciale tiene una strada sola.
  estate: {},

  // L'autunno vira al rame. La sterpaglia cambia poco — era già secca — e
  // questo è giusto: in autunno l'erba raggiunge la sterpaglia, non il
  // contrario.
  autunno: {
    "6": "#4a3b23",
    "7": "#63502c",
    "8": "#8a6430",
    "9": "#7a6f35",
    a: "#968447",
    i: "#4a3218",
    j: "#7a5320",
    k: "#a8762c",
  },

  // L'inverno non è bianco. Una valle coperta di neve vorrebbe tasselli nuovi
  // e un mondo dove il terreno non si legge più; questo è il gelo secco che
  // toglie il colore alle cose senza nasconderle — l'erba spenta, le chiome
  // ridotte a rami. Si riconosce a colpo d'occhio e resta leggibile.
  inverno: {
    // Più chiara della roccia e appena virata al freddo. La prima versione
    // era grigio-verde e finiva sulla stessa tinta della roccia: un campo e
    // una pietraia indistinguibili sono peggio di una stagione che non si
    // vede, perché tolgono la lettura del terreno invece di un colore.
    "6": "#56605c",
    "7": "#68746e",
    "8": "#7d8a83",
    "9": "#6f7466",
    a: "#888c7c",
    i: "#2e2a22",
    j: "#463d2f",
    k: "#5c5040",
  },

  // La primavera è l'unica più viva della base: verdi più freddi e più chiari,
  // il contrario del giallo di fine estate. Da sola però non bastava: due
  // verdi leggermente diversi a colpo d'occhio sono la stessa stagione, ed è
  // il motivo per cui la primavera fiorisce (vedi sprite-fiori.js).
  primavera: {
    "6": "#2b4f28",
    "7": "#3c6b31",
    "8": "#56913f",
    "9": "#6f7c3e",
    a: "#8a9455",
    i: "#26471f",
    j: "#3a6b28",
    k: "#55913a",
  },
};

// Cotte una volta sola e tenute per sempre. L'identità dell'oggetto conta:
// cuoci() mette in cache per identità della tavolozza, quindi ricostruirne una
// a ogni cambio di stagione butterebbe via ogni sprite già cotto e lo
// rifarebbe pixel per pixel.
const PER_STAGIONE = {};
const PER_STAGIONE_BAGNATA = {};

for (const [stagione, veste] of Object.entries(VESTI)) {
  PER_STAGIONE[stagione] = { ...TAVOLOZZA, ...veste };
  PER_STAGIONE_BAGNATA[stagione] = { ...TAVOLOZZA_BAGNATA, ...veste };
}

export function tavolozzaDi(stagione) {
  return PER_STAGIONE[stagione] ?? TAVOLOZZA;
}

export function tavolozzaBagnataDi(stagione) {
  return PER_STAGIONE_BAGNATA[stagione] ?? TAVOLOZZA_BAGNATA;
}


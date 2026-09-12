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
};

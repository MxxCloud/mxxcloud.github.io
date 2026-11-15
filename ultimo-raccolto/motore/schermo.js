// Schermo: risoluzione interna fissa, scalatura a numero intero, camera.
//
// Tutto il gioco disegna in uno spazio di 384x216 pixel e non sa nulla di
// quanto sia grande la finestra. È la scelta che rende la pixel art possibile:
// un pixel del gioco resta un quadrato, sempre, e non c'è nessun punto del
// codice in cui qualcuno debba chiedersi a che risoluzione sta girando.

export const LARGHEZZA = 384;
export const ALTEZZA = 216;
export const TASSELLO = 16;

// La camera è in pixel di mondo, in virgola mobile. Viene arrotondata solo al
// momento di disegnare: tenerla intera renderebbe il movimento a scatti, non
// arrotondarla affatto farebbe tremolare i bordi dei tasselli.
export const camera = { x: 0, y: 0 };

let canvas = null;
let contesto = null;
let scala = 1;

// --- avvio e ridimensionamento --------------------------------------------

export function prepara(elemento) {
  canvas = elemento;
  canvas.width = LARGHEZZA;
  canvas.height = ALTEZZA;
  contesto = canvas.getContext("2d", { alpha: false });
  contesto.imageSmoothingEnabled = false;
  ridimensiona();
  addEventListener("resize", ridimensiona);
  return contesto;
}

// La scala resta un numero intero anche quando questo lascia due bande nere:
// una scala frazionaria distribuisce l'arrotondamento in modo disuguale e
// alcune righe di pixel finiscono più spesse delle altre. Si preferisce lo
// spazio vuoto attorno a un'immagine sporca.
//
// Intero in pixel dello schermo, non in pixel CSS (M7.18.65). Su uno schermo
// ad alta densità un pixel CSS sono due o tre pixel veri, e contare in pixel
// CSS voleva dire fermarsi a un ingrandimento più piccolo del necessario: una
// finestra di 1440x900 a densità 2 si fermava a 3, cioè a sei pixel veri per
// pixel di gioco, quando sette ci stavano ed erano altrettanto puliti. La
// pulizia dipende da quanti pixel veri fa un pixel di gioco, ed è quello il
// numero che deve restare intero.
//
// Restituisce i pixel veri per pixel di gioco. Pura, perché è l'unica parte
// di questo modulo che si può collaudare senza una finestra.
export function scalaPer(larghezza, altezza, densita = 1) {
  const d = Number.isFinite(densita) && densita > 0 ? densita : 1;
  const orizzontale = larghezza * d / LARGHEZZA;
  const verticale = altezza * d / ALTEZZA;
  // Il millesimo regge le densità frazionarie: 1536 pixel CSS a 1,25 sono
  // 1920 pixel veri, e non devono diventare 4,9999 volte 384.
  return Math.max(1, Math.floor(Math.min(orizzontale, verticale) + 1e-3));
}

let densitaSeguita = null;

export function ridimensiona() {
  const densita = globalThis.devicePixelRatio || 1;
  const veri = scalaPer(innerWidth, innerHeight, densita);
  scala = veri / densita;
  canvas.style.width = `${LARGHEZZA * scala}px`;
  canvas.style.height = `${ALTEZZA * scala}px`;
  seguiLaDensita(densita);
}

// Spostare la finestra su un altro schermo cambia la densità senza cambiare
// la misura della finestra, quindi "resize" non arriva. La domanda al browser
// vale per una densità sola: quando cambia, si rifà per quella nuova.
function seguiLaDensita(densita) {
  if (densita === densitaSeguita || typeof matchMedia !== "function") return;
  densitaSeguita = densita;
  matchMedia(`(resolution: ${densita}dppx)`).addEventListener("change", ridimensiona, { once: true });
}

// In pixel CSS per pixel di gioco: su uno schermo ad alta densità può non
// essere intera, ed è giusto così — interi sono i pixel veri.
export function scalaCorrente() {
  return scala;
}

export function pennello() {
  return contesto;
}

// --- camera ---------------------------------------------------------------

export function centraSu(x, y) {
  camera.x = x - LARGHEZZA / 2;
  camera.y = y - ALTEZZA / 2;
}

// Gli estremi dell'inquadratura in pixel di mondo: serve a chi disegna per
// saltare tutto ciò che sta fuori invece di affidarsi al ritaglio del canvas.
export function inquadratura() {
  const sinistra = Math.floor(camera.x);
  const sopra = Math.floor(camera.y);
  return { sinistra, sopra, destra: sinistra + LARGHEZZA, sotto: sopra + ALTEZZA };
}

export function visibile(x, y, larghezza, altezza) {
  const q = inquadratura();
  return x + larghezza > q.sinistra && x < q.destra && y + altezza > q.sopra && y < q.sotto;
}

// --- disegno --------------------------------------------------------------

export function pulisci(colore) {
  contesto.fillStyle = colore;
  contesto.fillRect(0, 0, LARGHEZZA, ALTEZZA);
}

// Coordinate di mondo. L'arrotondamento avviene qui e in nessun altro posto,
// così non esiste il caso in cui due cose adiacenti vengano arrotondate in
// versi diversi e si apra una fessura di un pixel fra loro.
export function disegna(immagine, x, y) {
  contesto.drawImage(immagine, Math.round(x - camera.x), Math.round(y - camera.y));
}

export function disegnaRitaglio(immagine, sx, sy, sl, sa, x, y) {
  contesto.drawImage(immagine, sx, sy, sl, sa, Math.round(x - camera.x), Math.round(y - camera.y), sl, sa);
}

// Coordinate di schermo, per l'interfaccia: non si muove con la camera.
export function disegnaFisso(immagine, x, y) {
  contesto.drawImage(immagine, Math.round(x), Math.round(y));
}

// Cottura degli sprite: da righe di testo a immagini pronte da disegnare.
//
// Uno sprite nasce come array di stringhe — una per riga di pixel, un carattere
// per pixel — ed è l'unica forma in cui viene scritto a mano. Qui viene tradotto
// una volta sola in un canvas fuori schermo, perché disegnare pixel per pixel a
// ogni fotogramma costerebbe quanto tutto il resto del gioco messo insieme:
// dopo la cottura il disegno è una drawImage e basta.
//
// La tavolozza è un parametro e non una costante interna. Serve a una cosa sola
// ma importante: lo stesso sprite cotto con tavolozze diverse dà le varianti
// stagionali senza ridisegnare nulla.

import { TAVOLOZZA } from "./tavolozza.js";

// --- decodifica -----------------------------------------------------------

function componenti(esadecimale) {
  const n = Number.parseInt(esadecimale.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Separata dalla cottura per poter essere verificata senza un canvas, e perché
// è qui che si scoprono gli errori di battitura negli sprite scritti a mano.
export function decodifica(righe, tavolozza = TAVOLOZZA) {
  if (!Array.isArray(righe) || righe.length === 0) {
    throw new Error("sprite vuoto");
  }

  const altezza = righe.length;
  const larghezza = righe[0].length;
  const pixel = new Uint8ClampedArray(larghezza * altezza * 4);

  for (let y = 0; y < altezza; y += 1) {
    const riga = righe[y];
    if (riga.length !== larghezza) {
      throw new Error(`riga ${y} larga ${riga.length} invece di ${larghezza}`);
    }
    for (let x = 0; x < larghezza; x += 1) {
      const chiave = riga[x];
      if (!(chiave in tavolozza)) {
        throw new Error(`carattere "${chiave}" assente dalla tavolozza (${x},${y})`);
      }
      const colore = tavolozza[chiave];
      if (colore === null) continue; // trasparente: i byte restano a zero
      const [r, v, b] = componenti(colore);
      const i = (y * larghezza + x) * 4;
      pixel[i] = r;
      pixel[i + 1] = v;
      pixel[i + 2] = b;
      pixel[i + 3] = 255;
    }
  }

  return { larghezza, altezza, pixel };
}

// --- cottura --------------------------------------------------------------

export function telaio(larghezza, altezza) {
  const canvas = document.createElement("canvas");
  canvas.width = larghezza;
  canvas.height = altezza;
  const contesto = canvas.getContext("2d");
  // Senza questo il ridimensionamento degli sprite sfoca i bordi, che è
  // esattamente ciò che distingue la pixel art dal resto.
  contesto.imageSmoothingEnabled = false;
  return { canvas, contesto };
}

// Le immagini cotte si tengono per identità dell'array di righe e per
// tavolozza: due tavolozze diverse sullo stesso sprite sono due immagini, e
// nessuna delle due va rifatta.
const cotti = new WeakMap();

export function cuoci(righe, tavolozza = TAVOLOZZA) {
  let perTavolozza = cotti.get(righe);
  if (!perTavolozza) {
    perTavolozza = new WeakMap();
    cotti.set(righe, perTavolozza);
  }
  const gia = perTavolozza.get(tavolozza);
  if (gia) return gia;

  const { larghezza, altezza, pixel } = decodifica(righe, tavolozza);
  const { canvas, contesto } = telaio(larghezza, altezza);
  contesto.putImageData(new ImageData(pixel, larghezza, altezza), 0, 0);
  perTavolozza.set(tavolozza, canvas);
  return canvas;
}

// Le direzioni laterali si disegnano una volta sola e si riflettono. Disegnare
// a mano è la risorsa più scarsa del progetto: dimezzarla qui vale più di
// qualche byte di memoria.
const riflessi = new WeakMap();

export function riflesso(immagine) {
  const gia = riflessi.get(immagine);
  if (gia) return gia;

  const { canvas, contesto } = telaio(immagine.width, immagine.height);
  contesto.translate(immagine.width, 0);
  contesto.scale(-1, 1);
  contesto.drawImage(immagine, 0, 0);
  riflessi.set(immagine, canvas);
  return canvas;
}

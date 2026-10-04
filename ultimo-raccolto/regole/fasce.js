// Le fasce di distanza (M7.18.61): la distanza conta.
//
// Fino a qui il mondo era uguale ovunque. Una casa a trenta schermate dalla
// fattoria valeva quella accanto, e la notte era la stessa notte: andare
// lontano costava il viaggio e non pagava niente. Adesso attorno alla
// fattoria ci sono quattro fasce, e più ci si allontana più rendono le casse
// e più è affollato il buio. Il viaggio diventa una scommessa che si fa
// sapendo cosa si rischia: ogni volta che si passa un confine il gioco dice
// il nome della fascia e le sue regole, e la mappa li disegna.
//
// È una funzione pura delle coordinate, come il terreno: niente nel
// salvataggio, niente da migrare. Si misura dal centro della fattoria e non
// dall'origine, perché "lontano" vuol dire lontano da casa; una valle senza
// fattoria misura dall'origine, che è comunque dove si comincia.
//
// Euclidea e non a regioni: i confini sono cerchi, e un cerchio sulla mappa
// si legge come "tanto lontano da casa" in ogni direzione. Le soglie sono a
// passo d'uomo — a piedi si fanno poco più di tre tasselli al secondo e un
// giorno dura cinque minuti: i dintorni sono un minuto da casa, le terre
// lontane una giornata fra andata e ritorno, il selvatico è dove si dorme
// fuori.
import * as mappa from "../mondo/mappa.js";
import * as schermo from "../motore/schermo.js";

// L'avviso va a capo dove c'è "\n": una riga sola delle terre lontane
// passerebbe sotto le scritte del tempo, in alto a destra.
export const FASCE = [
  { nome: "I dintorni", fino: 200, colore: "#9ec97e",
    avviso: "casa è vicina: casse e notti come le conosci" },
  { nome: "La valle", fino: 450, colore: "#c9b189",
    avviso: "casse un po' più piene, notti un po' più affollate" },
  { nome: "Le terre lontane", fino: 750, colore: "#e0a050",
    avviso: "casse ricche, attrezzi meno consumati\ndi notte più infetti, più duri, e più orsi" },
  { nome: "Il selvatico", fino: Infinity, colore: "#d0705a",
    avviso: "il bottino migliore, e il doppio degli infetti\nche escono già al tramonto" },
];

// Di quanto bisogna essere entrati in una fascia perché l'annuncio la dia
// per cambiata. Senza, chi cammina lungo il confine riceverebbe un cartello
// a ogni passo. Vale solo per l'annuncio: le regole guardano la fascia vera.
export const ISTERESI = 8;

let centroDi = null;

// Il centro da cui si misura, tenuto per seme: la fattoria non si sposta, e
// chiederla a ogni fotogramma vorrebbe dire risolverne la cella ogni volta
// che la memoria delle celle si svuota.
export function centro() {
  const seme = mappa.semeCorrente().valore;
  if (centroDi?.seme !== seme) {
    const f = mappa.laFattoria();
    centroDi = { seme, tx: f ? f.tx : 0, ty: f ? f.ty : 0 };
  }
  return centroDi;
}

export function distanzaDi(tx, ty) {
  const c = centro();
  return Math.hypot(tx - c.tx, ty - c.ty);
}

function diDistanza(d) {
  let i = 0;
  while (d >= FASCE[i].fino) i += 1;
  return i;
}

export function diTassello(tx, ty) {
  return diDistanza(distanzaDi(tx, ty));
}

export function diPixel(px, py) {
  return diTassello(Math.floor(px / schermo.TASSELLO), Math.floor(py / schermo.TASSELLO));
}

// La fascia da annunciare dopo un passo, sapendo quella di prima: cambia solo
// quando si è entrati nella nuova di almeno ISTERESI tasselli.
export function dopoIlPasso(tx, ty, prima) {
  const d = distanzaDi(tx, ty);
  const ora = diDistanza(d);
  if (prima === null || prima === undefined || ora === prima) return ora;
  // Il confine appena passato: finché non lo si è lasciato indietro di
  // ISTERESI tasselli si resta nella fascia di qua.
  if (ora > prima && d < FASCE[ora - 1].fino + ISTERESI) return ora - 1;
  if (ora < prima && d > FASCE[ora].fino - ISTERESI) return ora + 1;
  return ora;
}

// Il cavallo dello straniero (Per un pugno di semi W0.6): sellato e cavalcato.
//
// Non ci sono disegni nuovi da capo, e non per pigrizia: il cavallo è quello
// della prateria (vedi sprite-fauna.js) e lo straniero è quello di sempre
// (vedi sprite-personaggi.js). Qui si mettono uno sopra l'altro, come righe
// di testo, e il risultato si cuoce come ogni altro sprite. Un ritocco al
// cavallo o al poncho arriva da sé anche in sella.
//
// Tutto guarda a destra, come il cavallo della fauna; la sinistra è il
// riflesso, come per ogni figura di profilo del gioco.

import { ANIMALI } from "./sprite-fauna.js";
import { LATO } from "./sprite-personaggi.js";

// Uno strato sopra una base: i punti dello strato coprono, quelli vuoti
// lasciano vedere sotto. Resta testo, quindi resta leggibile e confrontabile.
function sopra(base, strato, ox, oy) {
  return base.map((riga, y) => {
    const s = strato[y - oy];
    if (!s) return riga;
    return [...riga].map((c, x) => {
      const k = s[x - ox];
      return k && k !== "." ? k : c;
    }).join("");
  });
}

// La sella e la coperta. La sella è cuoio, la coperta a scacchi rossi e
// bianchi è quella dei vaqueros, ed è quello che distingue a colpo d'occhio
// un cavallo tuo da uno della prateria: gli stessi pixel, con sopra qualcosa
// che qualcuno ci ha messo.
const SELLA = [
  "..........hh......h.............",
  "..........hwwwwwwwhh............",
  ".......zezezezezezez............",
  ".......ezezezezezeze............",
  ".......zezezezezezez............",
];
const RIGA_DELLA_SELLA = 6;
export const SELLATO = ANIMALI.cavallo.map((f) => sopra(f, SELLA, 0, RIGA_DELLA_SELLA));

// Lo straniero in sella: il busto di profilo, girato a destra, seduto a metà
// groppa, e una gamba col suo stivale e la staffa che scende sul fianco. Il
// cavallo parte cinque righe più in basso del cappello, e così il poncho
// ricade sul dorso invece di finirci davanti.
export const CAVALLO_DA = 5;
const BUSTO = LATO[0].slice(0, 17).map((riga) => [...riga].reverse().join(""));
const BUSTO_DA = 6;
const GAMBA = ["rnnr", "rnnr", "rnnr", "rggr", "rggs", "rrr."];
export const CAVALIERE = SELLATO.map((f) => {
  let tela = Array.from({ length: CAVALLO_DA + f.length }, () => ".".repeat(f[0].length));
  tela = sopra(tela, f, 0, CAVALLO_DA);
  tela = sopra(tela, BUSTO, BUSTO_DA, 0);
  return sopra(tela, GAMBA, 14, 15);
});

// Dove sta la mano del cavaliere, per l'attrezzo in pugno e per la luce di
// una torcia: la stessa mano dello straniero a piedi (vedi MANO in
// giocatore.js), riflessa perché qui si guarda a destra, e spostata dove sta
// il busto.
export const MANO_IN_SELLA = { x: BUSTO_DA + 15 - 3, y: 6 };

// Il collo del cavallo, dove si lega la corda quando lo si conduce.
export const COLLO = { x: 23, y: 8 };

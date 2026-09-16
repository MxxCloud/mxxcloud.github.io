// Quello che c'era prima: dove stanno le rovine, e cosa c'è su un tassello.
//
// Il problema da risolvere è questo. Il mondo è una funzione pura delle
// coordinate e non si pregenera niente — è la proprietà che dà una valle
// infinita e salvataggi piccoli. Ma una casa occupa settanta tasselli, e un
// tassello deve poter sapere da solo se gli tocca un muro **senza guardarsi
// intorno**, perché guardarsi intorno vorrebbe dire che ogni tassello ne
// interroga altri cento.
//
// LA MAGLIA. Il mondo si divide in celle di 64 tasselli per lato. Tre impronte
// della cella decidono tutto: se c'è una rovina, quale pianta, e dove sta
// dentro la cella. Una pianta si posa sempre INTERAMENTE dentro la sua cella,
// e da questo discende tutto il resto: un tassello interroga la propria cella
// e nessun'altra, e la domanda resta una sottrazione e due confronti.
//
// IL COSTO DECIDE LA STRUTTURA, come per i settori cotti in mappa.js. Una casa
// non va nell'acqua, quindi risolvere una cella vuol dire guardare il terreno
// sotto tutta la pianta: un centinaio di tasselli, cioè un migliaio di
// valutazioni di rumore. Farlo a ogni tassello del mondo raddoppierebbe il
// prezzo della generazione. Quindi una cella si risolve una volta e si tiene.
//
// Questo modulo non sa cosa siano un muro o una cassa: restituisce il
// carattere della pianta e lascia tradurre a generazione.js, che è il posto in
// cui vive il vocabolario dei tasselli. Non è pudore, è la ragione per cui non
// c'è un ciclo fra i due file.

import { impronta } from "../motore/casuale.js";
import { PIANTE, misuraDi } from "../arte/piante.js";

export const CELLA = 64;

// Quante celle hanno una rovina. Misurato e non scelto, come le soglie del
// terreno, e con lo stesso metodo: contate su 3600 celle per seme, su quattro
// semi diversi — una valle fortunata non fa una regola.
//
// Questa è la quota PRIMA del terreno. Una cella che capita su un lago non
// produce niente, quindi la quota vera è più bassa, e la differenza è grossa:
// 42 qui diventano **25,9 per cento di celle abitate** sui quattro semi
// (25,2 / 25,8 / 25,9 / 26,7 — la dispersione è quella che ci si aspetta).
//
// Il numero che conta però non è quello: è che da un punto qualunque la rovina
// più vicina sta in media a **58-62 tasselli, cioè due schermate e mezza**.
// Era il bersaglio — abbastanza da trovarne camminando, abbastanza da non
// inciamparci — e ci si arriva senza doverlo aggiustare.
const QUOTA = 0.42;

// Quanto la pianta sta lontana dal bordo della cella. Serve a due cose: che
// una rovina non esca mai dalla sua cella — da cui dipende tutto — e che due
// rovine di celle vicine non si tocchino mai, che altrimenti sembrerebbero un
// paese costruito male invece di due case lontane.
const MARGINE = 6;

// Semi derivati, uno per domanda. Usare lo stesso per "c'è una rovina" e "dove
// sta" le farebbe coincidere: le celle fortunate avrebbero tutte la casa nello
// stesso angolo.
const scarto = (seme, n) => (seme + Math.imul(n, 0x9e3779b9)) >>> 0;

// --- la memoria delle celle -----------------------------------------------

let semeCorrente = 0;
const risolte = new Map();

// Quattro celle bastano a coprire quello che si ha attorno; il tetto è largo
// perché tornare indietro sui propri passi non deve ricalcolare niente. Oltre,
// si butta tutto invece di scegliere cosa: ricostruire le quattro che servono
// costa una frazione di fotogramma, e una potatura per distanza sarebbe più
// codice di quanto valga il risparmio.
const CELLE_TENUTE = 64;

export function inizializza(seme) {
  semeCorrente = seme;
  risolte.clear();
}

export function quanteInMemoria() {
  return risolte.size;
}

// --- risolvere una cella --------------------------------------------------

function risolvi(cx, cy, adatto) {
  if (impronta(cx, cy, scarto(semeCorrente, 11)) >= QUOTA) return null;

  const quale = Math.floor(impronta(cx, cy, scarto(semeCorrente, 12)) * PIANTE.length);
  const pianta = PIANTE[Math.min(quale, PIANTE.length - 1)];
  const { larghezza, altezza } = misuraDi(pianta);

  const spazioX = CELLA - larghezza - MARGINE * 2;
  const spazioY = CELLA - altezza - MARGINE * 2;
  // Una pianta più grande della cella sarebbe un errore di dato, non di
  // mondo: meglio nessuna rovina che una che sborda e rompe l'unica proprietà
  // su cui tutto questo file è costruito.
  if (spazioX < 0 || spazioY < 0) return null;

  const tx0 = cx * CELLA + MARGINE + Math.floor(impronta(cx, cy, scarto(semeCorrente, 13)) * (spazioX + 1));
  const ty0 = cy * CELLA + MARGINE + Math.floor(impronta(cx, cy, scarto(semeCorrente, 14)) * (spazioY + 1));

  // Il terreno deve reggere sotto TUTTA la pianta, e con un tassello di
  // margine attorno. Controllare solo gli angoli lasciava case con un lago in
  // mezzo alla stanza: il rumore è frastagliato a questa scala, e quattro
  // punti non dicono niente di quello che c'è fra loro.
  for (let dy = -1; dy <= altezza; dy += 1) {
    for (let dx = -1; dx <= larghezza; dx += 1) {
      if (!adatto(tx0 + dx, ty0 + dy)) return null;
    }
  }

  return { tx0, ty0, pianta, larghezza, altezza };
}

// La rovina di una cella, o null. "adatto" arriva da fuori — da
// generazione.js, che è l'unico a sapere cosa sia l'acqua — e questo è ciò che
// tiene le dipendenze in una direzione sola.
export function nellaCella(cx, cy, adatto) {
  const chiave = `${cx},${cy}`;
  if (risolte.has(chiave)) return risolte.get(chiave);
  if (risolte.size > CELLE_TENUTE) risolte.clear();
  const rovina = risolvi(cx, cy, adatto);
  risolte.set(chiave, rovina);
  return rovina;
}

// --- la domanda che conta -------------------------------------------------

// Il carattere della pianta su questo tassello, o null se qui la valle resta
// la valle. È la funzione che chiama tutto il mondo, una volta per tassello.
export function tasselloDi(tx, ty, adatto) {
  // Math.floor e non una divisione intera: alle coordinate negative
  // l'arrotondamento verso lo zero metterebbe due celle diverse a cavallo
  // dell'origine, e il mondo è infinito in tutte e quattro le direzioni.
  const rovina = nellaCella(Math.floor(tx / CELLA), Math.floor(ty / CELLA), adatto);
  if (!rovina) return null;

  const dx = tx - rovina.tx0;
  const dy = ty - rovina.ty0;
  if (dx < 0 || dy < 0 || dx >= rovina.larghezza || dy >= rovina.altezza) return null;

  const segno = rovina.pianta[dy][dx];
  return segno === " " ? null : segno;
}

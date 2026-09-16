// Le voci: i suoni come dato.
//
// Sta in arte/ insieme agli sprite, e per la stessa ragione. Uno sprite è un
// array di stringhe perché si legge a occhio, si modifica in un editor di
// testo e in git il diff mostra quali righe di pixel sono cambiate. Una voce è
// una manciata di numeri per lo stesso motivo: il diff di un .wav non dice
// niente, il diff di questo file dice "il tonfo è diventato più grave e più
// corto".
//
// Una voce ha sempre la stessa forma, e motore/suono.js sa leggerla:
//
//   onda     "rumore", oppure una forma d'onda: "sinusoide", "quadra",
//            "triangolo", "dente"
//   da, a    l'altezza all'inizio e alla fine, per le onde con un'altezza
//   attacco  quanto ci mette ad arrivare a volume, in secondi
//   coda     quanto ci mette a spegnersi
//   filtro   { tipo, taglio, a, risonanza } — per il rumore è qui che sta
//            l'altezza, perché il rumore bianco non ne ha una da spostare
//   volume   quanto pesa rispetto alle altre
//
// Quasi tutto qui dentro è rumore filtrato e non oscillatori, e non è una
// scorciatoia: un tonfo, uno schiocco, un passo e uno strappo sono rumore nel
// mondo, non note. Gli oscillatori restano per le poche cose che un'altezza ce
// l'hanno davvero — il verso di chi ti insegue, le conferme dell'interfaccia,
// la morte.

// --- i colpi --------------------------------------------------------------

// Il debito dichiarato in gioco.js diceva già cosa serve, e la frase era
// questa: «un tonfo sordo per il legno, uno schiocco secco per la pietra».
//
// Un materiale è tre numeri — quanto è grave, quanto è duro, quanto risuona —
// e da quelli escono sia il colpo sia il crollo. È lo stesso conto che rende
// economiche le stagioni: la tavolozza è un parametro della cottura e non una
// costante, quindi lo stesso disegno dà l'estate e l'inverno. Qui la materia è
// un parametro della voce, quindi la stessa voce dà il legno e la pietra.
//
// Scriverle a mano una per una sarebbe stato otto blocchi di numeri quasi
// uguali in cui cambiare il carattere del colpo vuol dire ricordarsi di
// toccarli tutti e otto.
const MATERIA = {
  // Sordo, e con una coda: mezzo albero si muove.
  legno: { taglio: 1150, fondo: 250, risonanza: 1.4, coda: 0.16, volume: 0.5, tipo: "passabasso" },
  // Secco e acuto, e finito prima di accorgersene.
  pietra: { taglio: 2700, fondo: 1500, risonanza: 5, coda: 0.06, volume: 0.42, tipo: "passabanda" },
  // Uno strappo va al contrario di un tonfo: sale invece di scendere, perché
  // quello che si sente è la fibra che si scuce, non la massa che si sposta.
  erba: { taglio: 1300, fondo: 2700, risonanza: 0.8, coda: 0.13, volume: 0.32, tipo: "passaalto" },
  // Raccogliere un fuoco acceso è l'unico colpo che spegne qualcosa.
  fuoco: { taglio: 1900, fondo: 850, risonanza: 2.2, coda: 0.11, volume: 0.34, tipo: "passabanda" },
};

// Il colpo che stacca non è il colpo che segna, e il gioco lo dice già con gli
// occhi: l'ultimo sparge ventisei scheggie invece di dodici e le manda più
// lontano (vedi gioco.js). Questo è lo stesso racconto per le orecchie —
// più grave, più lungo, più forte — ed è la differenza fra «l'hai preso» e
// «è venuto giù».
const CROLLO = { grave: 0.42, lungo: 3.2, forte: 1.3 };

export function colpoDi(materia, finale = false) {
  const m = MATERIA[materia] ?? MATERIA.legno;
  if (!finale) {
    return {
      onda: "rumore",
      attacco: 0.002,
      coda: m.coda,
      filtro: { tipo: m.tipo, taglio: m.taglio, a: m.fondo, risonanza: m.risonanza },
      volume: m.volume,
    };
  }
  return {
    onda: "rumore",
    attacco: 0.004,
    coda: m.coda * CROLLO.lungo,
    filtro: {
      tipo: m.tipo,
      taglio: m.taglio * CROLLO.grave,
      // Uno strappo sale, e il suo finale deve salire di più invece di
      // scendere di più: il segno della scivolata è quello del materiale, non
      // una costante. Senza questa riga il cespuglio strappato faceva il
      // tonfo di un albero.
      a: m.fondo * (m.fondo > m.taglio ? 1 / CROLLO.grave : CROLLO.grave),
      risonanza: m.risonanza,
    },
    volume: m.volume * CROLLO.forte,
  };
}

// --- i passi --------------------------------------------------------------

// Piano, molto piano. Un passo è la voce che si sente più spesso di tutte —
// migliaia in una partita — ed è la prima che stanca se pesa. Deve stare sotto
// la soglia di quello che si nota, e farsi notare solo quando smette.
export const PASSO = {
  onda: "rumore",
  attacco: 0.002,
  coda: 0.06,
  filtro: { tipo: "passabasso", taglio: 640, a: 180, risonanza: 1 },
  volume: 0.12,
};

// Il loro è lo stesso gesto con un altro corpo: più sordo, più lento a
// spegnersi, senza la parte in alto. Sono il superstite con un'altra
// tavolozza anche qui — stessa voce, altri numeri.
//
// Più forte del proprio passo di quasi tre volte, e non perché pesino di più:
// il proprio si sente a volume pieno perché si è dentro le proprie scarpe,
// il loro arriva attenuato dalla distanza, e la distanza che conta è quella a
// cui nascono. Sotto questo numero, a 280 pixel non restava niente.
export const PASSO_INFETTO = {
  onda: "rumore",
  attacco: 0.003,
  coda: 0.1,
  filtro: { tipo: "passabasso", taglio: 400, a: 110, risonanza: 1.3 },
  volume: 0.34,
};

// Il verso di chi ti ha visto. È l'unica voce del gioco che ha un'altezza
// vera, ed è apposta: tutto il resto della notte è rumore, quindi una cosa
// intonata in mezzo si stacca dal fondo senza doverla alzare di volume.
//
// Raddoppia l'esclamativo invece di sostituirlo: l'esclamativo dice «ti ha
// visto», questo dice anche «da che parte». È quello che l'esclamativo non
// poteva dire.
export const RESPIRO = {
  onda: "dente",
  da: 84,
  a: 58,
  attacco: 0.06,
  coda: 0.55,
  filtro: { tipo: "passabasso", taglio: 460, a: 200, risonanza: 3.5 },
  volume: 0.3,
};

// --- lo scontro -----------------------------------------------------------

// Il morso. Il lampo rosso di gioco.js aveva bisogno di questo da sempre:
// bagnato, corto, e più forte di qualunque altra cosa nel gioco tranne la
// morte.
export const MORSO = {
  onda: "rumore",
  attacco: 0.001,
  coda: 0.2,
  filtro: { tipo: "passabanda", taglio: 950, a: 240, risonanza: 2.5 },
  volume: 0.75,
};

// Colpire un infetto non suona come colpire un albero, e il gioco già lo dice
// con gli occhi: esce sangue invece di scheggie.
export const COLPO_A_SEGNO = {
  onda: "rumore",
  attacco: 0.002,
  coda: 0.13,
  filtro: { tipo: "passabasso", taglio: 760, a: 170, risonanza: 1.8 },
  volume: 0.46,
};

export const CADUTO = {
  onda: "rumore",
  attacco: 0.004,
  coda: 0.42,
  filtro: { tipo: "passabasso", taglio: 520, a: 80, risonanza: 1.4 },
  volume: 0.52,
};

// --- il fuoco -------------------------------------------------------------

// Uno scoppiettio solo. Il crepitio non è una voce che dura: è questa, ripetuta
// a intervalli irregolari da regole/udito.js — come una fiamma, che non fa un
// suono continuo ma tanti piccoli suoni ravvicinati.
export const CREPITIO = {
  onda: "rumore",
  attacco: 0.001,
  coda: 0.05,
  filtro: { tipo: "passabanda", taglio: 2500, a: 1300, risonanza: 8 },
  // Sotto il passo del giocatore una volta attenuato, e apposta: è l'unica
  // voce che suona di continuo finché si sta all'accampamento, e una cosa che
  // non smette mai deve stare sotto a tutte quelle che cominciano.
  volume: 0.38,
};

// --- i gesti --------------------------------------------------------------

export const ZAPPA = {
  onda: "rumore",
  attacco: 0.003,
  coda: 0.22,
  filtro: { tipo: "passabasso", taglio: 820, a: 190, risonanza: 1.1 },
  volume: 0.4,
};

export const SEMINA = {
  onda: "rumore",
  attacco: 0.002,
  coda: 0.09,
  filtro: { tipo: "passaalto", taglio: 2200, a: 3400, risonanza: 0.7 },
  volume: 0.22,
};

export const ACQUA = {
  onda: "rumore",
  attacco: 0.02,
  coda: 0.45,
  filtro: { tipo: "passabanda", taglio: 1500, a: 900, risonanza: 1.6 },
  volume: 0.3,
};

export const SORSO = {
  onda: "sinusoide",
  da: 340,
  a: 150,
  attacco: 0.01,
  coda: 0.14,
  filtro: { tipo: "passabasso", taglio: 900, risonanza: 2 },
  volume: 0.3,
};

export const MANGIA = {
  onda: "rumore",
  attacco: 0.004,
  coda: 0.15,
  filtro: { tipo: "passabasso", taglio: 1000, a: 420, risonanza: 1.3 },
  volume: 0.3,
};

// La benda. Non è un gesto allegro: è quello che si fa quando le cose sono
// andate male, quindi niente conferma squillante.
export const BENDA = {
  onda: "rumore",
  attacco: 0.01,
  coda: 0.3,
  filtro: { tipo: "passaalto", taglio: 1600, a: 2600, risonanza: 0.6 },
  volume: 0.22,
};

// Il coperchio di una cassa. Legno grosso contro legno grosso: più basso e
// più lungo del posare una cosa per terra, perché quello che si sente è un
// mobile, non un oggetto.
export const COPERCHIO = {
  onda: "rumore",
  attacco: 0.003,
  coda: 0.19,
  filtro: { tipo: "passabasso", taglio: 520, a: 150, risonanza: 1.6 },
  volume: 0.34,
};

export const POSA = {
  onda: "rumore",
  attacco: 0.002,
  coda: 0.1,
  filtro: { tipo: "passabasso", taglio: 700, a: 260, risonanza: 1.2 },
  volume: 0.3,
};

// --- l'interfaccia --------------------------------------------------------

// Qui si sta leggeri. L'interfaccia di questo gioco è deliberatamente
// silenziosa — sta sul canvas, non ha finestre, non chiede conferme — e
// riempirla di versi la trasformerebbe in un'altra cosa. Tre voci, piane, e
// nessuna che duri più di un cinquantesimo di secondo oltre il necessario.

// Scegliere una casella dello zaino. Non si chiama CASELLA perché "casella"
// in questo gioco è già la casella dello zaino e la casella di salvataggio:
// il terzo significato sarebbe quello che li rende tutti e tre ambigui.
export const SCELTA = {
  onda: "quadra",
  da: 880,
  a: 880,
  attacco: 0.001,
  coda: 0.025,
  filtro: { tipo: "passabasso", taglio: 2600, risonanza: 0.8 },
  volume: 0.07,
};

export const FATTO = {
  onda: "triangolo",
  da: 520,
  a: 784,
  attacco: 0.005,
  coda: 0.18,
  filtro: { tipo: "passabasso", taglio: 3000, risonanza: 0.8 },
  volume: 0.22,
};

export const NEGATO = {
  onda: "quadra",
  da: 210,
  a: 150,
  attacco: 0.004,
  coda: 0.13,
  filtro: { tipo: "passabasso", taglio: 1200, risonanza: 1 },
  volume: 0.16,
};

export const PRESO = {
  onda: "triangolo",
  da: 660,
  a: 660,
  attacco: 0.003,
  coda: 0.08,
  filtro: { tipo: "passabasso", taglio: 3200, risonanza: 0.8 },
  volume: 0.14,
};

// --- il corpo -------------------------------------------------------------

// Si comincia a gelare. Sottile e alta, e appena percettibile: la barra e il
// cristallo azzurro dicono già tutto, questa serve solo a far alzare gli occhi
// a chi stava guardando i piedi.
export const GELO = {
  onda: "sinusoide",
  da: 2100,
  a: 2900,
  attacco: 0.15,
  coda: 0.7,
  filtro: { tipo: "passaalto", taglio: 1800, risonanza: 0.7 },
  volume: 0.07,
};

// La morte. Lunga, grave, e l'unica voce del gioco che si prende più di un
// secondo: è anche l'unico momento in cui non c'è altro da ascoltare, perché
// il mondo si ferma dietro la schermata.
export const MORTE = {
  onda: "dente",
  da: 150,
  a: 38,
  attacco: 0.02,
  coda: 1.7,
  filtro: { tipo: "passabasso", taglio: 620, a: 110, risonanza: 2.5 },
  volume: 0.5,
};

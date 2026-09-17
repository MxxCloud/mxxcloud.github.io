// L'infetto: vaga, ti sente, ti raggiunge, ti colpisce.
//
// Non ha disegni propri. È il superstite cotto con un'altra tavolozza, ed è
// la cosa che dice di lui più di qualunque sprite nuovo: stessa sagoma,
// stessa andatura, stessi vestiti, svuotati. Era come te. Costa sei chiavi di
// colore invece di dodici fotogrammi disegnati a mano, e la ragione per cui
// si può fare è la stessa che dà le stagioni — la tavolozza è un parametro
// della cottura.
//
// Qui dentro non si sa cosa sia la paura, il rumore o il danno: sono regole,
// e le entità stanno sotto le regole. Questo modulo riceve due campi riempiti
// dall'alto — chi inseguire e dove andare a guardare — e in cambio alza una
// bandierina quando il colpo va a segno. Chi la raccoglie decide quanto
// costa.

import * as urti from "./urti.js";
import { cuoci, riflesso } from "../arte/sprite.js";
import * as arte from "../arte/sprite-personaggi.js";
import { TAVOLOZZA_INFETTO } from "../arte/tavolozza.js";
import { generatore } from "../motore/casuale.js";

export const TIPO = "infetto";

// Più lento del superstite che cammina non andrebbe bene — non sarebbe mai un
// problema — e più veloce di quello che corre nemmeno: non ci sarebbe scampo,
// e un inseguimento senza scampo è una punizione, non una scelta. In mezzo
// invece la fuga funziona ma costa, perché correre consuma stanchezza e sotto
// una soglia non si corre più. Quella barra esiste da M2 e comincia a contare
// davvero adesso.
//
// Cammino 52, corsa 92 (vedi giocatore.js): 62 sta appena sopra il primo.
const VELOCITA_VAGA = 22;
const VELOCITA_INSEGUE = 62;

// A che distanza arriva il braccio, e ogni quanto. Poco più del riquadro
// d'urto: deve colpire chi è addosso, non chi passa a un tassello.
const PORTATA = 13;
const RICARICA = 1.1;

// Quanti colpi regge. Con l'ascia sono due, a mani nude cinque — e cinque, al
// ritmo con cui colpisce lui, vuol dire prenderne tre o quattro. È il numero
// che rende l'ascia un'arma invece di un attrezzo più veloce.
export const VITA = 5;

// Ogni quanto cambia idea mentre vaga. Non troppo spesso: uno che cambia
// direzione ogni mezzo secondo sembra una mosca, non una persona rotta.
const DURATA_GIRO = [1.8, 4.5];

// Il proprio generatore, seminato. Gli infetti non fanno parte del mondo
// riproducibile — non stanno nelle modifiche e non si salvano — ma in questo
// gioco Math.random non esiste, e tenere una sorgente sola evita che un
// giorno l'abitudine sbagliata venga copiata da qui dove invece conta.
const caso = generatore(0x9a1f00d);

// --- aspetto --------------------------------------------------------------

// Tre direzioni per quattro fotogrammi: dodici immagini in tutto, cotte la
// prima volta che servono e poi tenute. Niente oggetto in pugno, quindi
// niente composizione — un infetto non impugna niente, ed è anche il motivo
// per cui si distingue da lontano da un altro superstite.
const cotti = new Map();

function figura(direzione, fotogramma) {
  const chiave = `${direzione}|${fotogramma}`;
  const gia = cotti.get(chiave);
  if (gia) return gia;

  const fotogrammi = direzione === "su" ? arte.SU : direzione === "giu" ? arte.GIU : arte.LATO;
  const immagine = cuoci(fotogrammi[fotogramma], TAVOLOZZA_INFETTO);
  cotti.set(chiave, immagine);
  return immagine;
}

export function figureCotte() {
  return cotti.size;
}

function aggiornaAspetto(e) {
  const fotogramma = Math.floor(e.passo) % 4;
  const direzione = e.guarda === "su" ? "su" : e.guarda === "giu" ? "giu" : "lato";
  const immagine = figura(direzione, fotogramma);

  e.sprite = e.guarda === "destra" ? riflesso(immagine) : immagine;
  e.x = e.px - e.sprite.width / 2;
  e.y = e.py - e.sprite.height;
  e.base = e.py;
}

// --- comportamento --------------------------------------------------------

function guardaVerso(e, dx, dy) {
  if (dx === 0 && dy === 0) return;
  // Come per il superstite: in diagonale il profilo si legge meglio della
  // figura di fronte, quindi l'orizzontale ha la precedenza.
  if (Math.abs(dx) > Math.abs(dy)) e.guarda = dx < 0 ? "sinistra" : "destra";
  else e.guarda = dy < 0 ? "su" : "giu";
}

function vagabonda(e, passo) {
  e.giro -= passo;
  if (e.giro <= 0) {
    e.giro = DURATA_GIRO[0] + caso() * (DURATA_GIRO[1] - DURATA_GIRO[0]);
    // Un giro su tre sta fermo. Un branco che si muove sempre sembra una
    // pattuglia; uno che ogni tanto si pianta sembra gente che non sa più
    // cosa stava facendo.
    if (caso() < 0.33) {
      e.direzione = { x: 0, y: 0 };
    } else {
      const angolo = caso() * Math.PI * 2;
      e.direzione = { x: Math.cos(angolo), y: Math.sin(angolo) };
    }
  }

  const { x, y } = e.direzione;
  if (x === 0 && y === 0) {
    e.passo = 0;
    return;
  }
  guardaVerso(e, x, y);
  const percorso = urti.muovi(e, x * VELOCITA_VAGA * passo, y * VELOCITA_VAGA * passo);
  e.passo += percorso / 7;
  // Incastrato contro un albero: invece di spingere per secondi, si cambia
  // idea subito. È il rimedio più corto al difetto più visibile di chi vaga.
  if (percorso < 0.1) e.giro = 0;
}

// Restituisce la distanza dal bersaglio. Il "fermati a" esiste perché senza
// di esso arrivavano addosso davvero — misurato: distanza 1 — e due sprite
// perfettamente sovrapposti sono illeggibili proprio nel momento in cui
// bisogna decidere se scappare o rispondere. A un braccio di distanza si
// vedono entrambi, e si vede chi sta colpendo chi.
function insegue(e, passo, bx, by, fermatiA = 0) {
  const dx = bx - e.px;
  const dy = by - e.py;
  const distanza = Math.hypot(dx, dy);
  if (distanza < 0.001) return distanza;

  guardaVerso(e, dx, dy);
  if (distanza <= fermatiA) {
    // Fermo ma non immobile: resta sul fotogramma di riposo, come il
    // superstite quando non si muove.
    e.passo = 0;
    return distanza;
  }
  const percorso = urti.muovi(
    e,
    (dx / distanza) * VELOCITA_INSEGUE * passo,
    (dy / distanza) * VELOCITA_INSEGUE * passo
  );
  e.passo += percorso / 7;
  // Ha spinto e non si è mosso: davanti c'è qualcosa. Chi vaga, in questo
  // caso, cambia idea (vedi vagabonda); chi insegue no — ed è tutta la
  // differenza fra un muro e un albero in mezzo a un prato.
  e.bloccato = percorso < 0.1;
  return distanza;
}

export function aggiorna(e, passo) {
  e.ricarica -= passo;
  // La bandierina vale un passo solo: chi la raccoglie gira una volta per
  // fotogramma, e lasciarla alzata vorrebbe dire un morso che conta due volte.
  e.colpo = false;
  e.sfonda = false;
  e.bloccato = false;
  if (e.sussulto > 0) e.sussulto -= passo;

  if (e.preda) {
    const distanza = insegue(e, passo, e.preda.px, e.preda.py, PORTATA - 2);
    if (distanza <= PORTATA && e.ricarica <= 0) {
      e.ricarica = RICARICA;
      e.colpo = true;
    } else if (e.bloccato && e.ricarica <= 0) {
      // Fermo contro qualcosa mentre insegue: mena lì, con lo stesso ritmo con
      // cui morderebbe. Non è un'idea nuova — è lo stesso braccio — ed è la
      // ragione per cui un muro è una spesa e non una soluzione.
      e.ricarica = RICARICA;
      e.sfonda = true;
    }
  } else if (e.richiamo) {
    const distanza = insegue(e, passo, e.richiamo.x, e.richiamo.y);
    // Arrivato dove aveva sentito, non trova niente e riprende a girare.
    if (distanza < 10) e.richiamo = null;
  } else {
    vagabonda(e, passo);
  }

  aggiornaAspetto(e);
}

// --- creazione ------------------------------------------------------------

export function crea(px, py) {
  const e = {
    tipo: TIPO,
    px,
    py,
    guarda: "giu",
    passo: 0,
    sprite: null,
    x: 0,
    y: 0,
    base: py,
    vita: VITA,
    // Riempiti dall'alto, come impugnato per il superstite: chi inseguire e
    // dove andare a guardare sono decisioni che richiedono di sapere cos'è la
    // vista e cos'è il rumore, e quelle sono regole.
    preda: null,
    richiamo: null,
    // Letto dall'alto: il colpo è andato a segno, decidete voi quanto costa.
    colpo: false,
    // L'altra bandierina, uguale alla prima: sta spingendo contro qualcosa
    // che non cede, e mena lì. Cosa ci sia davvero su quel tassello lo sa la
    // regola, non lui — un infetto non sa cos'è un muro, sa solo che non
    // passa.
    sfonda: false,
    bloccato: false,
    ricarica: 0,
    // Quanto gli resta da tremare dopo averle prese. Serve al disegno, che è
    // l'unico modo che ha il giocatore di sapere di averlo colpito davvero.
    sussulto: 0,
    giro: 0,
    direzione: { x: 0, y: 0 },
  };
  aggiornaAspetto(e);
  return e;
}

// L'infetto: vaga, ti sente, ti raggiunge, ti colpisce.
//
// Da Per un pugno di semi W0.4 si vede e si sente come un bandito, e
// nell'interfaccia lo è; qui dentro si chiama ancora infetto, come le regole
// che lo muovono, che sono rimaste quelle di Ultimo raccolto.
//
// Non ha disegni propri. È lo straniero cotto con un'altra tavolozza, ed è
// la cosa che dice di lui più di qualunque sprite nuovo: stessa sagoma,
// stessa andatura, stesso cappello e stesso poncho, e un fazzoletto sulla
// faccia. Potevi essere tu. Costa qualche chiave di colore invece di dodici
// fotogrammi disegnati a mano, e la ragione per cui si può fare è la stessa
// che dà le stagioni — la tavolozza è un parametro della cottura.
//
// Qui dentro non si sa cosa sia la paura, il rumore o il danno: sono regole,
// e le entità stanno sotto le regole. Questo modulo riceve due campi riempiti
// dall'alto — chi inseguire e dove andare a guardare — e in cambio alza una
// bandierina quando il colpo va a segno. Chi la raccoglie decide quanto
// costa.

import * as urti from "./urti.js";
import { cuoci, riflesso, telaio } from "../arte/sprite.js";
import * as arte from "../arte/sprite-personaggi.js";
import { PISTOLA, PISTOLA_DI_FRONTE } from "../arte/sprite-impugnati.js";
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

// La pistola (Per un pugno di semi W0.5): di notte si spara, e non sei tu.
//
// Un bandito che ti vede, e che ti ha abbastanza lontano da non doverti
// venire addosso, si ferma e ti prende la mira. La mira è una cosa che si
// vede e si sente — la pistola esce dalla sagoma e il cane scatta — e dura
// abbastanza da poterci fare qualcosa: MIRA secondi in tutto. Per quasi tutto
// quel tempo la canna ti segue; nell'ultimo tratto, col dito sul grilletto,
// non più, e il colpo parte verso il punto in cui eri. Chi è rimasto lì lo
// prende, chi si è scansato di lato di un passo no.
//
// È tutta la regola, ed è voluta così: di notte stare fermi allo scoperto è
// quello che costa, e il rimedio è quello che il gioco chiede già — muoversi,
// o mettersi dietro un muro, che la vista e le pallottole non passano.
//
// Qui dentro non si sa cosa sia il danno: l'entità alza una bandierina con
// da dove parte il colpo e verso dove va, e chi la raccoglie decide se ha
// preso qualcuno (vedi raccogliGliSpari in regole/infetti.js).
//
// Fra trenta pixel e la gittata. Più vicino di così non si mira: si mena,
// come prima. Più lontano non si mira nemmeno, e comunque senza una luce
// in mano un bandito ti vede a meno di sessanta.
export const GITTATA = 120;
const TROPPO_VICINO = 30;
const MIRA = 0.9;
const DITO_SUL_GRILLETTO = 0.3;
// Fra un colpo e l'altro: armare, ricaricare, riprendere fiato. Un intervallo
// e non un numero, perché cinque banditi che sparano insieme a tempo sono un
// plotone, non una banda.
const RICARICA_SPARO = [3.5, 6];
// Da quando ti vede a quando comincia a mirare: anche la prima volta c'è un
// momento, e senza, cinque che ti scoprono insieme sparerebbero insieme.
const PRIMA_MIRA = [0.4, 1.6];
// Quanto resta la pistola in pugno dopo lo sparo: abbastanza da vedere chi è
// stato.
const IN_PUGNO_DOPO = 0.35;

// Il proprio generatore, seminato. Gli infetti non fanno parte del mondo
// riproducibile — non stanno nelle modifiche e non si salvano — ma in questo
// gioco Math.random non esiste, e tenere una sorgente sola evita che un
// giorno l'abitudine sbagliata venga copiata da qui dove invece conta.
const caso = generatore(0x9a1f00d);

// --- aspetto --------------------------------------------------------------

// Tre direzioni per quattro fotogrammi, e da W0.5 due volte: a mani vuote e
// con la pistola. Ventiquattro immagini al massimo, cotte la prima volta che
// servono e poi tenute. In Ultimo raccolto un infetto non impugnava niente,
// ed era il motivo per cui si distingueva da lontano da un altro superstite;
// adesso la pistola in pugno si vede solo quando mira, ed è l'avviso.
const cotti = new Map();

// Dove sta la pistola, in coordinate dello sprite 16x24: l'angolo in alto a
// sinistra del disegno e la bocca della canna. Non è la mano degli attrezzi
// dello straniero (vedi MANO in giocatore.js): quella è un braccio lungo il
// fianco, questa è un braccio teso all'altezza del petto. Di profilo la
// canna parte dalla colonna zero, e così sporge di due pixel oltre il
// poncho: è quello che si deve vedere.
export const PUGNO = {
  giu: { x: 10, y: 11, bocca: { x: 11, y: 12 } },
  su: { x: 1, y: 11, bocca: { x: 2, y: 12 } },
  lato: { x: 0, y: 11, bocca: { x: 0, y: 11 } },
};

function figura(direzione, fotogramma, armato) {
  const chiave = `${direzione}|${fotogramma}|${armato ? "pistola" : ""}`;
  const gia = cotti.get(chiave);
  if (gia) return gia;

  const fotogrammi = direzione === "su" ? arte.SU : direzione === "giu" ? arte.GIU : arte.LATO;
  const corpo = cuoci(fotogrammi[fotogramma], TAVOLOZZA_INFETTO);
  if (!armato) {
    cotti.set(chiave, corpo);
    return corpo;
  }

  // Composta una volta sola, come lo straniero con l'ascia: la pistola sta
  // sempre davanti al corpo, anche di spalle, per la stessa ragione del
  // poncho (vedi giocatore.js).
  const pistola = cuoci(direzione === "lato" ? PISTOLA : PISTOLA_DI_FRONTE);
  const pugno = PUGNO[direzione];
  const { canvas, contesto } = telaio(corpo.width, corpo.height);
  contesto.drawImage(corpo, 0, 0);
  contesto.drawImage(pistola, pugno.x, pugno.y);
  cotti.set(chiave, canvas);
  return canvas;
}

export function figureCotte() {
  return cotti.size;
}

function aggiornaAspetto(e) {
  const fotogramma = Math.floor(e.passo) % 4;
  const direzione = e.guarda === "su" ? "su" : e.guarda === "giu" ? "giu" : "lato";
  const armato = Boolean(e.mira) || e.inPugno > 0;
  const immagine = figura(direzione, fotogramma, armato);

  e.sprite = e.guarda === "destra" ? riflesso(immagine) : immagine;
  e.x = e.px - e.sprite.width / 2;
  e.y = e.py - e.sprite.height;
  e.base = e.py;

  // La bocca della canna nel mondo, riflessa a destra come la figura. Serve
  // a far partire la vampa e la traccia del colpo da dove si vede la pistola.
  const bocca = PUGNO[direzione].bocca;
  const boccaX = e.guarda === "destra" ? e.sprite.width - bocca.x - 1 : bocca.x;
  e.bocca = { x: e.x + boccaX, y: e.y + bocca.y };
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
  const percorso = urti.muovi(e, x * VELOCITA_VAGA * (e.fattoreMeteo ?? 1) * passo, y * VELOCITA_VAGA * (e.fattoreMeteo ?? 1) * passo);
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
    (dx / distanza) * VELOCITA_INSEGUE * (e.fattoreMeteo ?? 1) * passo,
    (dy / distanza) * VELOCITA_INSEGUE * (e.fattoreMeteo ?? 1) * passo
  );
  e.passo += percorso / 7;
  // Ha spinto e non si è mosso: davanti c'è qualcosa. Chi vaga, in questo
  // caso, cambia idea (vedi vagabonda); chi insegue no — ed è tutta la
  // differenza fra un muro e un albero in mezzo a un prato.
  e.bloccato = percorso < 0.1;
  return distanza;
}

function fra(intervallo) {
  return intervallo[0] + caso() * (intervallo[1] - intervallo[0]);
}

// Il giro della mira: fermo, girato verso di te, la canna che ti segue finché
// il dito non è sul grilletto. Restituisce vero finché sta mirando, cioè
// finché questo giro non deve fare altro.
function prendeLaMira(e, passo) {
  const dx = e.preda.px - e.px;
  const dy = e.preda.py - e.py;
  const distanza = Math.hypot(dx, dy);

  if (!e.mira) {
    if (e.ricaricaSparo > 0 || distanza < TROPPO_VICINO || distanza > GITTATA) return false;
    e.mira = { resta: MIRA, bersaglio: { x: e.preda.px, y: e.preda.py } };
    e.miraAppena = true;
  } else if (distanza < TROPPO_VICINO) {
    // Gli sei arrivato addosso: la pistola torna giù e si mena, come prima.
    e.mira = null;
    return false;
  }

  e.passo = 0;
  e.mira.resta -= passo;
  if (e.mira.resta > DITO_SUL_GRILLETTO) e.mira.bersaglio = { x: e.preda.px, y: e.preda.py };
  guardaVerso(e, e.mira.bersaglio.x - e.px, e.mira.bersaglio.y - e.py);

  if (e.mira.resta <= 0) {
    // La bocca è quella dell'ultimo aspetto, che è fermo e girato da questa
    // parte da tutto il tempo della mira: è esattamente dove si vede.
    e.sparo = { da: { ...e.bocca }, piedi: { x: e.px, y: e.py }, a: { ...e.mira.bersaglio } };
    e.mira = null;
    e.ricaricaSparo = fra(RICARICA_SPARO);
    e.inPugno = IN_PUGNO_DOPO;
  }
  return true;
}

export function aggiorna(e, passo) {
  e.ricarica -= passo;
  e.ricaricaSparo -= passo;
  if (e.inPugno > 0) e.inPugno -= passo;
  // La bandierina vale un passo solo: chi la raccoglie gira una volta per
  // fotogramma, e lasciarla alzata vorrebbe dire un morso che conta due volte.
  // Vale anche per lo sparo e per il primo istante della mira, che è quando
  // il cane scatta.
  e.colpo = false;
  e.sfonda = false;
  e.bloccato = false;
  e.sparo = null;
  e.miraAppena = false;
  if (e.sussulto > 0) e.sussulto -= passo;

  // Ti ha appena visto: prima di mirare passa un momento.
  if (e.preda && !e.avevaPreda) e.ricaricaSparo = Math.max(e.ricaricaSparo, fra(PRIMA_MIRA));
  e.avevaPreda = Boolean(e.preda);
  // Chi ti perde di vista abbassa la pistola: non si spara a un muro.
  if (!e.preda) e.mira = null;

  if (e.preda && prendeLaMira(e, passo)) {
    aggiornaAspetto(e);
    return;
  }

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
    else if (e.bloccato && e.ricarica <= 0) { e.ricarica = RICARICA; e.sfonda = true; }
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
    // La pistola (W0.5). "mira" è il colpo che sta preparando, con quanto
    // gli manca e il punto verso cui punta; "sparo" la bandierina del colpo
    // partito, come "colpo" per il braccio. "miraAppena" dice il primo
    // istante della mira, che è quando si sente il cane.
    mira: null,
    sparo: null,
    miraAppena: false,
    ricaricaSparo: 0,
    inPugno: 0,
    avevaPreda: false,
    bocca: { x: px, y: py },
    // Quanto gli resta da tremare dopo averle prese. Serve al disegno, che è
    // l'unico modo che ha il giocatore di sapere di averlo colpito davvero.
    sussulto: 0,
    giro: 0,
    direzione: { x: 0, y: 0 },
  };
  aggiornaAspetto(e);
  return e;
}


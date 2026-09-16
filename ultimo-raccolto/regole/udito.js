// Cosa ti arriva all'orecchio.
//
// È il gemello di chiasso.js e il nome lo dice: chiasso è quanto lontano ti si
// sente, udito è quanto lontano senti. Erano una cosa sola a metà — il gioco
// misurava da sempre il rumore che emetti e non te ne faceva sentire niente,
// e quello che emettono gli altri non esisteva affatto.
//
// La conseguenza era la notte. Gli infetti nascono fra 260 e 420 pixel e la
// vista arriva a 58, o 150 con una fiamma in pugno (vedi infetti.js): per
// centinaia di pixel uno si avvicinava nel buio senza un solo segnale, e
// l'unico avviso arrivava quando aveva già visto te — l'esclamativo. Questo
// modulo è la metà che mancava: adesso lo si sente arrivare prima.
//
// Sta in regole/ e non in motore/ perché sentire è una regola. Un'entità non
// sa cos'è la paura, il rumore o il danno, e non sa nemmeno di fare rumore
// camminando: alza il piede, e chi guarda da qui decide cosa se ne sente.
//
// Qui dentro stanno solo i suoni CONTINUI — quello che il mondo emette da sé,
// passo dopo passo. I gesti del giocatore sono eventi e restano dove
// succedono, in gioco.js, dove hanno già il loro sito e il loro messaggio.

import * as entita from "../entita/entita.js";
import * as infetto from "../entita/infetto.js";
import * as mappa from "../mondo/mappa.js";
import * as schermo from "../motore/schermo.js";
import * as suono from "../motore/suono.js";
import { generatore } from "../motore/casuale.js";
import { PASSO, PASSO_INFETTO, RESPIRO, CREPITIO } from "../arte/voci.js";

// Da quanto lontano si sente camminare qualcuno. Il numero viene dalla
// geometria degli infetti e non dal gusto: nascono a 260 pixel come minimo,
// quindi un orecchio che arrivasse a 200 non ne sentirebbe mai nascere uno e
// sarebbe un sistema che esiste senza succedere — lo stesso errore che
// chiasso.js racconta di aver fatto con i dieci tasselli. A 300 il più vicino
// si sente appena nascere, e da lì cresce mentre si avvicina: è quello il
// racconto.
const PORTATA_PASSI = 300;

// Il verso porta più lontano dei piedi, ed è giusto: è il segnale forte, e
// vale la pena che arrivi da oltre lo schermo.
const PORTATA_RESPIRO = 380;

// Il fuoco si sente da tredici tasselli, cioè poco più di mezzo schermo. È
// quanto basta a ritrovare l'accampamento al buio senza che diventi un faro
// acustico che copre tutto il resto.
const PORTATA_FUOCO = 210;

// Ogni quanto ringhia chi ti sta inseguendo. Non spesso: un verso ogni due
// secondi è un allarme, uno ogni quattro è una presenza — e la differenza è
// se dopo un minuto lo si sente ancora o si è già smesso di ascoltare.
const RESPIRO_OGNI = [2.6, 5.4];

// Ogni quanto scoppietta una fiamma. Corto e irregolare, perché un fuoco non
// fa un suono continuo: ne fa tanti piccoli e ravvicinati, e la regolarità è
// l'unica cosa che lo farebbe sembrare un motore.
const CREPITIO_OGNI = [0.18, 0.7];

const caso = generatore(0x0cd1f0);

function fra(intervallo) {
  return intervallo[0] + caso() * (intervallo[1] - intervallo[0]);
}

// --- la memoria di chi cammina --------------------------------------------

// Una WeakMap e non due campi sulle entità, ed è la stessa divisione di
// sempre: l'infetto riceve dall'alto chi inseguire e dove guardare, che sono
// decisioni; "a che punto è del passo per chi ascolta" non è una decisione
// sua, è contabilità di questo modulo. E poiché è debole, un infetto che
// sparisce all'alba si porta via il suo ricordo senza che nessuno debba
// ripulire niente.
const ricordi = new WeakMap();

function ricordoDi(e) {
  let r = ricordi.get(e);
  if (!r) {
    r = { fotogramma: -1, respiro: fra(RESPIRO_OGNI) };
    ricordi.set(e, r);
  }
  return r;
}

// --- dove sta quello che senti --------------------------------------------

// Volume e panoramica di una sorgente, o null se è troppo lontana per contare.
//
// L'attenuazione non è quadratica, ed è una correzione fatta misurando.
//
// Quadratica è la fisica, e la prima stesura ci si era avvicinata con 1,6.
// Contando le voci emesse è venuto fuori che a 290 pixel non ne partiva
// nessuna: il volume cadeva sotto la soglia dell'udibile e la voce veniva
// lasciata cadere. Cioè il tratto per cui tutto questo modulo esiste — loro
// nascono fra 260 e 420 — era esattamente il tratto silenzioso, e "lo senti
// arrivare prima di vederlo" era falso di un centinaio di pixel.
//
// Con 1,1 la curva resta più piena in fondo: a 290 pixel si sente appena, a
// 260 è un fruscio, a 150 è qualcosa che si sta avvicinando. Ed è vicino a
// come funziona l'orecchio davvero, che le distanze le sente in rapporti e
// non in differenze — la stessa ragione per cui le scivolate d'altezza in
// suono.js sono esponenziali.
function dove(eroe, px, py, portata) {
  const dx = px - eroe.px;
  const dy = py - eroe.py;
  const distanza = Math.hypot(dx, dy);
  if (distanza >= portata) return null;

  const vicinanza = 1 - distanza / portata;
  return {
    volume: vicinanza ** 1.1,
    // Mezza larghezza di schermo per arrivare a un orecchio solo: a bordo
    // inquadratura il suono è già tutto da una parte, che è dove si guarda
    // quando si sente qualcosa di lato.
    //
    // Fermo a 0,9 e non a 1: un suono esattamente in un orecchio e per niente
    // nell'altro non succede nella vita, e in cuffia si sente come un difetto
    // invece che come una direzione.
    panoramica: Math.max(-0.9, Math.min(0.9, dx / (schermo.LARGHEZZA / 2))),
  };
}

// --- i passi --------------------------------------------------------------

// Il passo suona quando il piede tocca, e a dire quando tocca è il disegno.
//
// entita/giocatore.js avanza il contatore del passo di un fotogramma ogni sette
// pixel percorsi — non ogni tot secondi — proprio perché l'animazione non
// scivoli quando si corre. Agganciandosi a quel contatore invece che a un
// timer si ottengono tre cose in una riga: correre accelera i passi da sé,
// rallentare per fame li rallenta da sé, e il suono cade esattamente sul
// fotogramma in cui la gamba si posa.
//
// Un ciclo di quattro fotogrammi ha due appoggi, lo 0 e il 2 — l'1 e il 3 sono
// le falcate, con una gamba per aria (si vedono in sprite-personaggi.js). Due
// appoggi ogni ventotto pixel, cioè un passo ogni quattordici.
function passi(e, voce, sistemazione) {
  const r = ricordoDi(e);

  if (e.passo <= 0) {
    // Fermo. Si azzera a meno uno e non a zero, così ripartendo il primo
    // appoggio suona subito invece di aspettare mezzo ciclo: il silenzio fra
    // "premo avanti" e "sento il primo passo" si nota, ed è lungo quanto un
    // dubbio.
    r.fotogramma = -1;
    return;
  }

  const fotogramma = Math.floor(e.passo) % 4;
  if (fotogramma === r.fotogramma) return;
  r.fotogramma = fotogramma;
  if (fotogramma !== 0 && fotogramma !== 2) return;

  suono.suona(voce, sistemazione);
}

// --- il giro --------------------------------------------------------------

export function avanza(passo, eroe) {
  // Muti si esce subito. Non è micro-ottimizzazione: questo giro scorre tutte
  // le entità e tutte le luci a sessanta fotogrammi al secondo, e farlo per
  // buttare via il risultato sarebbe lavoro puro.
  if (suono.muto()) return;

  // I propri passi non si attenuano e non si spostano: si è dentro le proprie
  // scarpe. Sono anche l'unica voce che dice al giocatore quello che
  // chiasso.js sta già misurando — che correre chiama più del camminare — e
  // glielo dice con la cadenza invece che con un numero.
  passi(eroe, PASSO, { volume: eroe.correndo ? 1.6 : 1, tono: 0.95 + caso() * 0.12 });

  for (const e of entita.tutte()) {
    if (e.tipo !== infetto.TIPO) continue;

    const vicino = dove(eroe, e.px, e.py, PORTATA_PASSI);
    if (vicino) {
      passi(e, PASSO_INFETTO, { ...vicino, tono: 0.85 + caso() * 0.3 });
    } else {
      // Fuori portata il ricordo va tenuto aggiornato lo stesso, altrimenti
      // uno che rientra nel raggio a metà falcata sparerebbe un passo fuori
      // tempo — e sarebbe proprio il passo che conta, il primo che senti.
      ricordoDi(e).fotogramma = Math.floor(Math.max(0, e.passo)) % 4;
    }

    const r = ricordoDi(e);
    if (!e.preda) {
      // Chi non ti sta inseguendo non ringhia, e il conto riparte: così il
      // primo verso arriva quando ti vede, non un istante dopo per caso.
      r.respiro = fra(RESPIRO_OGNI);
      continue;
    }
    r.respiro -= passo;
    if (r.respiro > 0) continue;
    r.respiro = fra(RESPIRO_OGNI);
    const sentito = dove(eroe, e.px, e.py, PORTATA_RESPIRO);
    if (sentito) suono.suona(RESPIRO, { ...sentito, tono: 0.88 + caso() * 0.28 });
  }

  fuochi(passo, eroe);
}

// --- il fuoco -------------------------------------------------------------

// Un conto alla rovescia per fiamma. La chiave è la posizione, che per una
// cosa piantata in un tassello è stabile quanto un identificatore.
const scoppietti = new Map();

// Le fiamme si chiedono a lumiVisibili(), che è la lista di quelle inquadrate,
// e mappa.js mette in guardia proprio da questo: dipende da dove sta la
// camera, quindi una regola di sopravvivenza che la usasse sarebbe decisa dal
// disegno. Il freddo infatti non la usa — usa luceVicina(), che è una domanda
// sul mondo.
//
// Qui si accetta, e la differenza è che questa non è una regola: nessuno vive
// o muore per un crepitio. La camera sta addosso a chi ascolta, quindi
// "inquadrato" e "vicino" coincidono quasi sempre. Il quasi è il limite vero e
// conviene scriverlo: lo schermo è più largo che alto, quindi un falò appena
// sopra il bordo tace mentre uno alla stessa distanza di lato si sente. Si
// aggiusta il giorno che i fuochi posati avranno un elenco loro — e lo vorrà
// la costruzione, che di cose posate ne porta molte altre.

function fuochi(passo, eroe) {
  const lumi = mappa.lumiVisibili();
  if (lumi.length === 0) {
    if (scoppietti.size > 0) scoppietti.clear();
    return;
  }

  for (const luce of lumi) {
    const chiave = `${luce.x},${luce.y}`;
    let resta = scoppietti.get(chiave);
    if (resta === undefined) resta = fra(CREPITIO_OGNI);
    resta -= passo;

    if (resta <= 0) {
      // Una fiamma grande scoppietta più spesso e più forte di una piccola:
      // un falò e una torcia si distinguono a orecchio senza che questo
      // modulo sappia che esistono un falò e una torcia. Il raggio e
      // l'intensità li dichiara già il catalogo per la luce, e servono
      // identici qui.
      resta = fra(CREPITIO_OGNI) / (luce.intensita ?? 1);
      const vicino = dove(eroe, luce.x, luce.y, PORTATA_FUOCO);
      if (vicino) {
        suono.suona(CREPITIO, {
          volume: vicino.volume * (luce.intensita ?? 1) * 0.5,
          panoramica: vicino.panoramica,
          tono: 0.75 + caso() * 0.6,
        });
      }
    }
    scoppietti.set(chiave, resta);
  }

  // Le fiamme che non sono più in lista se ne vanno con il loro conto. Senza,
  // una partita lunga lascerebbe qui una chiave per ogni falò mai inquadrato.
  if (scoppietti.size > lumi.length) {
    const vive = new Set(lumi.map((l) => `${l.x},${l.y}`));
    for (const chiave of scoppietti.keys()) {
      if (!vive.has(chiave)) scoppietti.delete(chiave);
    }
  }
}

// Si riparte da capo con un superstite nuovo o con una partita caricata: i
// conti aperti non valgono più, e un crepitio in arrivo da un falò che nel
// mondo nuovo non c'è sarebbe un suono senza causa.
export function reimposta() {
  scoppietti.clear();
}

// Gli infetti: quanti sono, da dove arrivano, cosa notano, quanto costano.
//
// L'entità sa camminare e colpire (vedi entita/infetto.js). Tutto il resto —
// il buio che li fa uscire, la vista, l'udito, il morso e l'infezione — è
// regola, e sta qui.
//
// Non stanno nel mondo e non stanno nel salvataggio. Il mondo è una funzione
// pura delle coordinate e le modifiche sono le eccezioni che il giocatore ha
// fatto: un infetto non è né l'una né l'altra cosa, è quello che c'è là fuori
// stanotte. Quindi non si contano, si incontrano — e ucciderne uno non ne
// toglie uno dal totale, come spegnere un temporale non toglie pioggia
// all'inverno. È una scelta, e ha un prezzo: combattere non è una strategia
// per ripulire la valle, è quello che si fa quando non si può più scappare.

import * as entita from "../entita/entita.js";
import * as infetto from "../entita/infetto.js";
import * as urti from "../entita/urti.js";
import { generatore } from "../motore/casuale.js";
import * as tempo from "./tempo.js";
import * as chiasso from "./chiasso.js";
import * as salute from "./salute.js";

// Quanti al massimo, nel cuore della notte. Cinque è tarato su una cosa sola:
// devono bastare a rendere una traversata notturna una decisione, e non a
// rendere impossibile uscire. Con più di così l'unica strategia diventa non
// uscire mai, e una regola che toglie il gioco invece di complicarlo è una
// regola sbagliata.
const MASSIMI = 5;

// Escono col buio e basta. Non c'è un secondo concetto — tane, orde, un
// contatore di giorni — perché la frase da consegnare è una: di notte è
// pericoloso. La luce ambientale va da 0,1 (notte piena) a 1 (giorno pieno),
// e questa la ribalta: sopra questa soglia non ne esce nessuno.
const LUCE_SICURA = 0.62;

// Appaiono fuori dall'inquadratura e spariscono molto più in là. Mezza
// diagonale dello schermo è circa 220 pixel: sotto quella soglia uno
// comparirebbe davanti agli occhi, ed è il genere di cosa che si legge come
// un difetto anche quando è una regola.
const VICINO_MINIMO = 260;
const LONTANO_MASSIMO = 420;
const DIMENTICA_OLTRE = 620;

// A che distanza ti vedono. Al buio poco: sono occhi rotti, e il giocatore
// deve poter attraversare la notte stando zitto. Con una fiamma in mano è
// un'altra cosa — una torcia nel buio è un faro, e questo è il prezzo
// dell'unica cosa che d'inverno tiene caldo mentre si cammina.
const VISTA = 58;
const VISTA_CON_LUCE = 150;

// Una volta che ti ha addosso non si dimentica subito. Senza questo, bastava
// uscire di un pixel dal raggio per farlo tornare a vagare, e l'inseguimento
// diventava un lampeggio invece di una fuga.
const MEMORIA = 4;

// Quanto toglie un morso, e quanto spesso attacca (la ricarica sta
// nell'entità). Dodici centesimi: otto morsi uccidono, cioè si può sbagliare
// un incontro e scapparne vivi, ma non due.
const MORSO = 0.12;

// Uno su tre lascia qualcosa dentro. Non uno su uno: l'infezione è la cosa
// che costringe a tornare a casa, e se arrivasse a ogni graffio si
// smetterebbe di distinguerla dal danno.
const RISCHIO_INFEZIONE = 0.34;

const caso = generatore(0x1f3c7d);

let noti = 0;
let appenaVisto = false;

// --- popolazione ----------------------------------------------------------

function quantiVolerne() {
  const luce = tempo.luceAmbiente();
  if (luce >= LUCE_SICURA) return 0;
  // Da zero al massimo scendendo dalla soglia alla notte piena. Lineare come
  // la curva della luce, per lo stesso motivo: a questa scala una curva
  // morbida non si distingue e una lineare si impara.
  const quota = (LUCE_SICURA - luce) / (LUCE_SICURA - 0.1);
  return Math.round(MASSIMI * Math.min(1, Math.max(0, quota)));
}

export function quanti() {
  let n = 0;
  for (const e of entita.tutte()) if (e.tipo === infetto.TIPO) n += 1;
  return n;
}

function faiNascere(eroe) {
  // Trenta tentativi e poi si lascia perdere fino al prossimo giro: cercare
  // un posto libero all'infinito dentro un lago bloccherebbe la pagina.
  for (let prova = 0; prova < 30; prova += 1) {
    const angolo = caso() * Math.PI * 2;
    const distanza = VICINO_MINIMO + caso() * (LONTANO_MASSIMO - VICINO_MINIMO);
    const px = eroe.px + Math.cos(angolo) * distanza;
    const py = eroe.py + Math.sin(angolo) * distanza;
    if (!urti.liberoIn(px, py)) continue;
    entita.aggiungi(infetto.crea(px, py));
    return true;
  }
  return false;
}

// Spariscono lontano dagli occhi, e col giorno. Mai in vista: uno che si
// dissolve davanti si legge come un guasto, e la regola vera — di giorno se
// ne vanno — la si capisce lo stesso perché all'alba non ce ne sono più.
function faiSparire(eroe, troppi) {
  const entitaVive = entita.tutte();
  let tolti = 0;
  for (let i = entitaVive.length - 1; i >= 0 && tolti < troppi; i -= 1) {
    const e = entitaVive[i];
    if (e.tipo !== infetto.TIPO) continue;
    const distanza = Math.hypot(e.px - eroe.px, e.py - eroe.py);
    if (distanza < VICINO_MINIMO) continue;
    entitaVive.splice(i, 1);
    tolti += 1;
  }
  // Quelli finiti troppo lontano se ne vanno comunque: senza, camminando in
  // linea retta se ne trascinerebbe dietro una coda infinita.
  for (let i = entitaVive.length - 1; i >= 0; i -= 1) {
    const e = entitaVive[i];
    if (e.tipo !== infetto.TIPO) continue;
    if (Math.hypot(e.px - eroe.px, e.py - eroe.py) > DIMENTICA_OLTRE) {
      entitaVive.splice(i, 1);
    }
  }
}

// --- percezione -----------------------------------------------------------

function percepisci(e, passo, eroe, raggioChiasso, conLuce) {
  const distanza = Math.hypot(e.px - eroe.px, e.py - eroe.py);
  const vista = conLuce ? VISTA_CON_LUCE : VISTA;

  if (distanza <= vista || distanza <= raggioChiasso) {
    const prima = e.preda !== null;
    e.preda = eroe;
    e.memoria = MEMORIA;
    e.richiamo = null;
    if (!prima) appenaVisto = true;
    return;
  }

  if (e.preda) {
    e.memoria -= passo;
    if (e.memoria > 0) return;
    // Perde di vista ma non dimentica il posto: va a controllare lì. È la
    // differenza fra scrollarseli di dosso girando un angolo e scrollarseli
    // di dosso andandosene davvero.
    e.preda = null;
    e.richiamo = { x: eroe.px, y: eroe.py };
  }
}

// --- il giro --------------------------------------------------------------

// Da chiamare prima di entita.aggiorna(): decide chi insegue cosa. Il morso
// invece si raccoglie dopo, perché è l'entità a deciderlo muovendosi.
export function decidi(passo, eroe, { luceInMano = false } = {}) {
  appenaVisto = false;

  const voluti = quantiVolerne();
  const adesso = quanti();
  if (adesso < voluti) faiNascere(eroe);
  else if (adesso > voluti) faiSparire(eroe, adesso - voluti);

  const raggioChiasso = chiasso.raggio();
  for (const e of entita.tutte()) {
    if (e.tipo !== infetto.TIPO) continue;
    percepisci(e, passo, eroe, raggioChiasso, luceInMano);
  }

  noti = 0;
  for (const e of entita.tutte()) if (e.tipo === infetto.TIPO && e.preda) noti += 1;
  return { appenaVisto };
}

// Quanto vicini si tollerano fra loro. Non si urtano come urtano gli alberi —
// sarebbe una folla che si incastra in un imbuto — ma si scansano quel tanto
// che basta a restare due sagome invece di una.
//
// Serve per una ragione che si vede e basta: senza, tre che inseguono
// arrivavano tutti nello stesso punto e si sovrapponevano al pixel. Misurato:
// due a distanza 10 e 11 dal superstite, cioè uno sopra l'altro. In un gioco
// in cui la decisione è "quanti ne ho addosso", saperne contare uno solo
// quando sono tre è la peggiore informazione possibile.
const DISTANZA_FRA_LORO = 13;

// Da chiamare dopo entita.aggiorna(), quando si sono già mossi tutti.
export function sgomitano() {
  const loro = [];
  for (const e of entita.tutte()) if (e.tipo === infetto.TIPO) loro.push(e);

  for (let i = 0; i < loro.length; i += 1) {
    for (let j = i + 1; j < loro.length; j += 1) {
      const a = loro[i];
      const b = loro[j];
      let dx = b.px - a.px;
      let dy = b.py - a.py;
      let distanza = Math.hypot(dx, dy);
      if (distanza >= DISTANZA_FRA_LORO) continue;

      // Perfettamente sovrapposti non c'è una direzione in cui separarli, e
      // dividere per zero li spedirebbe a coordinate non numeriche. Se ne
      // inventa una: da quale parte si scansino non conta, conta che lo
      // facciano.
      if (distanza < 0.001) {
        const angolo = caso() * Math.PI * 2;
        dx = Math.cos(angolo);
        dy = Math.sin(angolo);
        distanza = 1;
      }

      const spinta = (DISTANZA_FRA_LORO - distanza) / 2;
      const ux = (dx / distanza) * spinta;
      const uy = (dy / distanza) * spinta;
      // Passando da urti.muovi() e non scrivendo le coordinate a mano: uno
      // scansato dentro un albero sarebbe un infetto che attraversa i muri
      // mentre il superstite non può.
      urti.muovi(a, -ux, -uy);
      urti.muovi(b, ux, uy);
    }
  }
}

// Da chiamare dopo entita.aggiorna(): i morsi andati a segno diventano
// ferite. Restituisce quanti ne sono arrivati, perché l'interfaccia deve
// poter far lampeggiare lo schermo una volta per morso e non per fotogramma.
export function raccogliIMorsi() {
  let morsi = 0;
  let infettato = false;
  for (const e of entita.tutte()) {
    if (e.tipo !== infetto.TIPO || !e.colpo) continue;
    morsi += 1;
    salute.ferita(MORSO, "infetti");
    // Il tiro si fa a morso avvenuto e non a incontro avvenuto: è il morso a
    // infettare, non la paura.
    if (!salute.eInfetto() && caso() < RISCHIO_INFEZIONE) {
      salute.infettati();
      infettato = true;
    }
  }
  return { morsi, infettato };
}

// Quanti ti stanno addosso adesso. Serve all'interfaccia: sapere di essere
// inseguiti è un'informazione che il buio nasconde, e nasconderla del tutto
// sarebbe ingiusto invece che teso.
export function inseguono() {
  return noti;
}

// --- combattimento --------------------------------------------------------

// A che distanza arriva il braccio del superstite. Un po' più lunga di quella
// dell'infetto: chi impugna qualcosa deve poter colpire per primo, altrimenti
// avere un'ascia non cambierebbe niente rispetto ad averla lasciata a casa.
const PORTATA_NOSTRA = 20;

const SCARTI = {
  su: [0, -1],
  giu: [0, 1],
  sinistra: [-1, 0],
  destra: [1, 0],
};

// Il più vicino davanti ai piedi. "Davanti" è un mezzo piano e non un
// tassello: gli infetti si muovono di frazioni di pixel e non stanno mai
// comodamente dentro una casella, quindi chiedere "che c'è sul tassello
// davanti" avrebbe mancato il bersaglio quasi sempre.
// "portata" arriva da fuori: da quanto lontano si colpisce lo decide quello
// che si ha in mano, e cosa si ha in mano è roba di regole/oggetti.js. Questo
// modulo sa solo che un numero c'è.
export function quelloDavanti(eroe, portata = PORTATA_NOSTRA) {
  const [dx, dy] = SCARTI[eroe.guarda] ?? SCARTI.giu;
  let migliore = null;
  let minima = Infinity;

  for (const e of entita.tutte()) {
    if (e.tipo !== infetto.TIPO) continue;
    const vx = e.px - eroe.px;
    const vy = e.py - eroe.py;
    const distanza = Math.hypot(vx, vy);
    if (distanza > portata || distanza >= minima) continue;
    // Deve stare dalla parte in cui si guarda. Il prodotto scalare con la
    // direzione dello sguardo è positivo solo in quel mezzo piano — e per chi
    // è praticamente addosso si lascia perdere il controllo, perché a due
    // pixel di distanza "davanti" non vuol dire più niente.
    if (distanza > 6 && vx * dx + vy * dy <= 0) continue;
    migliore = e;
    minima = distanza;
  }
  return migliore;
}

// Restituisce se è caduto, perché chi chiama deve poterlo raccontare in modo
// diverso: un colpo che va a segno e uno che finisce il lavoro non sono lo
// stesso gesto.
export function colpisci(e, danno) {
  e.vita -= danno;
  e.sussulto = 0.18;
  // Non serve dirgli di voltarsi: chi lo colpisce gli è a venti pixel, cioè
  // ben dentro il raggio della vista, e al passo dopo percepisci() glielo
  // mette addosso da sé. Scriverlo qui sarebbe la stessa regola in due posti.
  if (e.vita > 0) return { caduto: false };

  const tutte = entita.tutte();
  const dove = tutte.indexOf(e);
  if (dove >= 0) tutte.splice(dove, 1);
  return { caduto: true };
}

export function svuota() {
  const tutte = entita.tutte();
  for (let i = tutte.length - 1; i >= 0; i -= 1) {
    if (tutte[i].tipo === infetto.TIPO) tutte.splice(i, 1);
  }
  noti = 0;
}

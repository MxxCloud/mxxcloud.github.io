// Il sintetizzatore: da una voce a un suono.
//
// Sta in motore/ e non in arte/ per la stessa ragione per cui ci sta
// schermo.js: è il dispositivo d'uscita. Possiede l'AudioContext come
// schermo.js possiede il canvas, e non sa niente del gioco — chi lo chiama
// gli passa una voce, e la voce è un dato che vive in arte/voci.js.
//
// Si chiama suono e non audio perché le parole di questo progetto sono
// italiane, e non rumore perché rumore è già preso due volte: da
// motore/casuale.js, che ne esporta il generatore, e da regole/chiasso.js, che
// misura quanto lontano ti si sente. Chiasso è quanto emetti, suono è quanto
// esce dalle casse: sono due cose diverse e devono avere due nomi.
//
// NIENTE FILE AUDIO, e non è purismo. Un pacchetto di suoni sarebbe il primo
// asset binario che questo gioco scarica oltre a due icone, andrebbe elencato
// in sw.js file per file e precaricato per giocare in treno. Ma soprattutto:
// uno sprite qui è un array di stringhe perché in git il diff deve dire cosa
// è cambiato, e il diff di un .wav non dice niente. Il diff di una voce dice
// "il tonfo è diventato più grave e più corto".
//
// Ed è lo stesso conto che rende economiche le stagioni: una voce è
// parametrica, quindi lo stesso tonfo con un'altra altezza e un altro filtro è
// legno invece che pietra — come lo stesso sprite cotto con un'altra tavolozza
// è inverno invece che estate.

import { generatore } from "./casuale.js";

// --- il contesto ----------------------------------------------------------

let contesto = null;
let principale = null;
// Il rumore bianco, cotto una volta sola: generarlo a ogni colpo costerebbe
// quarantamila numeri per un suono che dura un sesto di secondo. È la stessa
// idea di arte/sprite.js, che cuoce gli sprite invece di ridisegnarli.
let rumoreBianco = null;
// Quante voci stanno suonando adesso. Non è diagnostica: è il tetto.
let vive = 0;
// Quante ne sono partite da quando il gioco è acceso. Questa invece è
// diagnostica pura, e serve a una cosa che senza di lei non si può fare:
// verificare il suono da fuori. Le voci durano decimi di secondo, quindi
// guardare quante ne stanno suonando adesso vuol dire quasi sempre guardare
// zero — un contatore che sale è l'unico modo che ha una prova automatica di
// sapere che qualcosa è stato emesso, non avendo orecchie.
let avviate = 0;
// Vero quando il browser non ha WebAudio, o quando crearlo è fallito. Da lì in
// poi il modulo è muto e non ci riprova: un gioco che non suona si gioca, un
// gioco che solleva un'eccezione per fotogramma no.
let spento = false;

// Oltre questo numero di voci insieme si lascia cadere quella nuova. Cinque
// infetti che camminano, un falò che crepita e un colpo d'ascia stanno
// larghi dentro dodici; il tetto serve al caso patologico, non al caso normale.
const VOCI_MASSIME = 12;

// Tre gradini e non un cursore. Un cursore vorrebbe una schermata delle
// impostazioni, che questo gioco non ha, per regolare una cosa che si regola
// già dal sistema operativo: qui serve poter abbassare in fretta senza
// spegnere, e spegnere del tutto.
export const LIVELLI = ["muto", "piano", "forte"];
const GUADAGNO = { muto: 0, piano: 0.3, forte: 0.85 };

const CHIAVE = "spaghettiwestern/volume";

let livello = leggiLivello();

function leggiLivello() {
  try {
    const salvato = globalThis.localStorage?.getItem(CHIAVE);
    return LIVELLI.includes(salvato) ? salvato : "forte";
  } catch {
    // Archivio negato dal browser: si parte acceso e non si ricorda. È
    // esattamente quello che fa regole/sincronia.js nello stesso caso.
    return "forte";
  }
}

// Il volume sta in localStorage e non nel salvataggio, ed è una distinzione
// che conta: un salvataggio viaggia fra computer — col file, con la rete — e
// il volume appartiene alle casse di questo computer, non alla valle. Chi
// riprende la partita sul portatile non vuole ritrovarsi il muto che aveva
// messo in ufficio. Il precedente è regole/sincronia.js, che tiene qui il
// codice per la stessa ragione.
function scriviLivello() {
  try {
    globalThis.localStorage?.setItem(CHIAVE, livello);
  } catch {
    // Niente: non poter ricordare il volume non è un guasto da raccontare.
  }
}

function creaRumore() {
  // Due secondi: abbastanza da non sentire il punto in cui ricomincia quando
  // lo si suona in ciclo per il crepitio del fuoco.
  const durata = 2;
  const campioni = Math.floor(contesto.sampleRate * durata);
  const deposito = contesto.createBuffer(1, campioni, contesto.sampleRate);
  const dati = deposito.getChannelData(0);
  // Seminato, non Math.random: in questo gioco non esiste (vedi casuale.js), e
  // qui la regola paga anche in pratica — lo stesso rumore a ogni avvio vuol
  // dire che un tonfo registrato oggi è identico a quello di domani, quindi
  // tarare una voce a orecchio è ripetibile.
  const caso = generatore(0x5ea50f);
  for (let i = 0; i < campioni; i += 1) dati[i] = caso() * 2 - 1;
  return deposito;
}

function accendi() {
  if (contesto || spento) return contesto;
  const Contesto = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!Contesto) {
    spento = true;
    return null;
  }
  try {
    contesto = new Contesto();
    principale = contesto.createGain();
    principale.gain.value = GUADAGNO[livello];
    principale.connect(contesto.destination);
    rumoreBianco = creaRumore();
  } catch {
    spento = true;
    contesto = null;
  }
  return contesto;
}

// --- il gesto -------------------------------------------------------------

// Un browser non fa partire l'audio finché chi guarda non ha toccato qualcosa,
// ed è una regola giusta: nessuno vuole una scheda che comincia a suonare da
// sola. Di solito la si paga con un cartello "clicca per attivare l'audio".
//
// Qui non serve, e la ragione è che il gesto c'è già: la schermata di apertura
// si chiude al primo tasto (vedi gioco.js), quindi il tasto che comincia la
// partita è anche il gesto che accende il suono.
//
// Va però chiamata da dentro il gestore del tasto, e non un fotogramma dopo.
// Chrome e Firefox non se ne curano — tengono l'attivazione dell'utente come
// uno stato appiccicoso — ma WebKit vuole la resume() nello stesso compito del
// gesto, quindi gioco.js la chiama da un ascoltatore suo che scatta una volta
// sola. Chiamarla due volte non costa niente: accendere un contesto già acceso
// esce subito.
export function sblocca() {
  const c = accendi();
  if (c && c.state === "suspended") c.resume().catch(() => {});
}

// Fuori dallo schermo si tace. Senza, una scheda in secondo piano continua a
// crepitare in sottofondo mentre si lavora — e il ciclo di gioco nemmeno gira,
// quindi sarebbe l'ultimo fotogramma tenuto in ostaggio.
export function sospendi() {
  if (contesto && contesto.state === "running") contesto.suspend().catch(() => {});
}

export function riprendi() {
  if (contesto && contesto.state === "suspended") contesto.resume().catch(() => {});
}

// --- il volume ------------------------------------------------------------

export function livelloCorrente() {
  return livello;
}

export function cambiaLivello() {
  livello = LIVELLI[(LIVELLI.indexOf(livello) + 1) % LIVELLI.length];
  scriviLivello();
  if (principale && contesto) {
    // Una rampa brevissima invece di un salto: cambiare guadagno di colpo su
    // una voce che sta suonando si sente come uno schiocco.
    principale.gain.setTargetAtTime(GUADAGNO[livello], contesto.currentTime, 0.01);
  }
  // Passando per "muto" il contesto resta acceso: riaccendere è immediato, e
  // chiuderlo vorrebbe dire un altro gesto dell'utente per tornare indietro.
  if (livello !== "muto") sblocca();
  return livello;
}

export function muto() {
  return livello === "muto";
}

// --- suonare --------------------------------------------------------------

const ONDE = {
  sinusoide: "sine",
  quadra: "square",
  triangolo: "triangle",
  dente: "sawtooth",
};

const FILTRI = {
  passabasso: "lowpass",
  passaalto: "highpass",
  passabanda: "bandpass",
};

function sorgente(voce, ora, tono) {
  if (voce.onda === "rumore") {
    const s = contesto.createBufferSource();
    s.buffer = rumoreBianco;
    s.loop = true;
    // Il rumore bianco non ha un'altezza da spostare, quindi il tono muove la
    // velocità di lettura: non si sente come un'altezza, si sente come una
    // grana più fine o più grossa, ed è quanto basta per non far sembrare due
    // colpi vicini lo stesso campione ripetuto.
    s.playbackRate.value = tono;
    // Un punto d'attacco diverso a ogni colpo, per la stessa ragione.
    s.start(ora, (tono * 7919) % 2);
    return s;
  }
  const s = contesto.createOscillator();
  // Le onde hanno un nome italiano come i filtri, e per la stessa ragione:
  // arte/voci.js è un file che si scrive e si legge, non un'interfaccia verso
  // il browser. La traduzione sta qui, che è il solo posto che il browser lo
  // conosce.
  s.type = ONDE[voce.onda] ?? "sine";
  s.frequency.setValueAtTime(voce.da * tono, ora);
  if (voce.a && voce.a !== voce.da) {
    // Esponenziale e non lineare: l'orecchio sente le altezze in rapporti, non
    // in differenze, quindi una scivolata lineare da 190 a 70 sembra fermarsi
    // a metà strada e poi precipitare.
    s.frequency.exponentialRampToValueAtTime(Math.max(1, voce.a * tono), ora + voce.coda);
  }
  s.start(ora);
  return s;
}

// L'altezza di una voce vuol dire due cose a seconda dell'onda, ed è voluto
// che sia un concetto solo: per un oscillatore è la frequenza, per il rumore è
// il taglio del filtro. Sono la stessa cosa all'orecchio — quanto è grave —
// e tenerle separate avrebbe voluto dire due campi che non si usano mai
// insieme.
function filtro(voce, ora, tono) {
  if (!voce.filtro) return null;
  const f = contesto.createBiquadFilter();
  f.type = FILTRI[voce.filtro.tipo] ?? "lowpass";
  f.Q.value = voce.filtro.risonanza ?? 1;
  const taglio = voce.filtro.taglio * tono;
  f.frequency.setValueAtTime(taglio, ora);
  if (voce.filtro.a) {
    f.frequency.exponentialRampToValueAtTime(
      Math.max(20, voce.filtro.a * tono),
      ora + voce.coda
    );
  }
  return f;
}

// Suona una voce. "tono" moltiplica l'altezza, "volume" il guadagno,
// "panoramica" va da -1 (tutto a sinistra) a +1 (tutto a destra).
//
// Restituisce true se la voce è partita davvero: serve alla diagnostica e alla
// prova automatica, che senza orecchie hanno bisogno di sapere che qualcosa è
// successo.
export function suona(voce, { volume = 1, tono = 1, panoramica = 0 } = {}) {
  if (spento || !voce || livello === "muto") return false;
  if (!contesto) return false;
  // Un contesto sospeso accetterebbe i nodi e li suonerebbe tutti insieme al
  // risveglio. Meglio non crearli affatto.
  if (contesto.state !== "running") return false;
  if (vive >= VOCI_MASSIME) return false;

  const guadagno = (voce.volume ?? 1) * volume;
  // Sotto questa soglia la voce costa quattro nodi per una cosa che non si
  // sente. Bassa apposta: la sorgente più numerosa e più piana è proprio
  // quella che conta di più — un infetto che nasce a 300 pixel — e una soglia
  // generosa la taglierebbe via insieme al lavoro sprecato. Vale per il
  // silenzio vero, non per il piano.
  if (guadagno <= 0.0022) return false;

  const ora = contesto.currentTime;
  const fine = ora + (voce.attacco ?? 0.005) + voce.coda;

  const busta = contesto.createGain();
  busta.gain.setValueAtTime(0.0001, ora);
  busta.gain.linearRampToValueAtTime(guadagno, ora + (voce.attacco ?? 0.005));
  // Esponenziale perché è così che si spegne un suono vero; non arriva mai a
  // zero, quindi si ferma la sorgente invece di aspettare che lo faccia.
  busta.gain.exponentialRampToValueAtTime(0.0001, fine);

  const s = sorgente(voce, ora, tono);
  const f = filtro(voce, ora, tono);
  if (f) s.connect(f).connect(busta);
  else s.connect(busta);

  let coda = busta;
  if (panoramica !== 0 && contesto.createStereoPanner) {
    const p = contesto.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, panoramica));
    busta.connect(p);
    coda = p;
  }
  coda.connect(principale);

  vive += 1;
  avviate += 1;
  s.stop(fine);
  s.onended = () => {
    vive -= 1;
    // Scollegare non è pulizia formale: un nodo che resta attaccato al
    // principale è memoria che non torna, e qui di voci ne partono migliaia in
    // una partita.
    try {
      coda.disconnect();
      busta.disconnect();
      if (f) f.disconnect();
      s.disconnect();
    } catch {
      // Già scollegato: va bene così.
    }
  };
  return true;
}

// --- diagnostica ----------------------------------------------------------

export function stato() {
  return {
    livello,
    contesto: spento ? "assente" : (contesto?.state ?? "non avviato"),
    vive,
    avviate,
  };
}

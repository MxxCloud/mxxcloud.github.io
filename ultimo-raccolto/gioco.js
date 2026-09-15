// Ultimo raccolto — avvio e orchestrazione.
//
// Questo modulo possiede il DOM e mette in comunicazione le parti; la logica
// di gioco vive altrove. È la stessa divisione che regge le altre
// applicazioni del sito: un modulo che sa di interfaccia e moduli che non ne
// sanno nulla.

import * as schermo from "./motore/schermo.js";
import * as ciclo from "./motore/ciclo.js";
import * as comandi from "./motore/comandi.js";
import * as oscurita from "./motore/oscurita.js";
import * as scheggie from "./motore/scheggie.js";
import * as mappa from "./mondo/mappa.js";
import * as modifiche from "./mondo/modifiche.js";
import * as entita from "./entita/entita.js";
import * as giocatore from "./entita/giocatore.js";
import * as tempo from "./regole/tempo.js";
import * as bisogni from "./regole/bisogni.js";
import * as salute from "./regole/salute.js";
import * as freddo from "./regole/freddo.js";
import * as orto from "./regole/orto.js";
import * as stagioni from "./regole/stagioni.js";
import * as decadimento from "./regole/decadimento.js";
import * as salvataggio from "./regole/salvataggio.js";
import * as sincronia from "./regole/sincronia.js";
import { tavolozzaDi, tavolozzaBagnataDi } from "./arte/tavolozza.js";
import { FIORI } from "./arte/sprite-fiori.js";
import * as inventario from "./regole/inventario.js";
import * as azioni from "./regole/azioni.js";
import { RICETTE, fai } from "./regole/ricette.js";
import { nomeDi, CATALOGO } from "./regole/oggetti.js";
import * as hud from "./interfaccia/hud.js";
import * as minimappa from "./interfaccia/minimappa.js";

const { TASSELLO } = schermo;

// La versione si vede nella schermata di apertura e nella diagnostica. Serve
// a rispondere alla domanda "sto giocando l'ultima versione?", che senza un
// numero a schermo non ha risposta: una copia vecchia rimasta nella cache del
// browser è identica a un aggiornamento mai pubblicato.
const VERSIONE = "M5";

// --- elementi -------------------------------------------------------------

const quadro = document.getElementById("quadro");
const diagnostica = document.getElementById("diagnostica");

// --- stato ----------------------------------------------------------------

const parametri = new URLSearchParams(location.search);
// Il seme sta nell'indirizzo: una valle che piace si condivide copiando l'URL,
// e la stessa valle si riapre identica domani.
const SEME = parametri.get("seme") || "valle-1";

let eroe = null;
let casellaScelta = 0;
let ricetteAperte = false;
let ricettaScelta = 0;
let azioneCorrente = null;
let messaggio = null;
let aperturaVisibile = true;
let minimappaVisibile = true;
let ultimoGiorno = 1;
let partitaAperta = false;
let slotScelto = 0;
const MODI_PARTITA = ["carica", "salva", "rete"];
let modoPartita = "salva";
// Cosa c'è in rete, chiesto quando si entra nel modo rete: "attesa" mentre la
// risposta non è arrivata, null se non si raggiunge, altrimenti quello che
// c'è. Il disegno è sincrono e la rete no, quindi il disegno legge questa.
let nuvola = "attesa";
let scrittaInCorso = null;
// L'ultimo giorno di cui si è già scritta l'alba. Senza, ogni fotogramma dopo
// le sette riscriverebbe il salvataggio automatico.
let albaScritta = 0;
// La causa della morte, o null da vivi. È lo stato più esclusivo del gioco:
// finché c'è, il mondo non avanza e nessun altro tasto risponde.
let mortoDi = null;
// Dove è rimasto il corpo, o null se non c'è stato posto. Serve alla
// schermata della morte, che deve dire se c'è qualcosa da andare a
// riprendere: è l'unica differenza fra un lutto e una spedizione.
let corpo = null;
// Se si sta gelando adesso. Calcolato una volta per passo e riusato dal
// disegno: la regola non si interroga due volte per fotogramma.
let gelando = false;

const lumi = [];

// Quanto e per quanto trema ciò che si colpisce. Due pixel per meno di un
// quinto di secondo: di più sembrerebbe un terremoto, di meno non si vedrebbe.
const DURATA_TREMOLIO = 0.18;
const AMPIEZZA_TREMOLIO = 2;
// Uno solo, perché si colpisce una cosa per volta.
let colpito = null;

function cosaInMano() {
  return inventario.contenuto()[casellaScelta]?.cosa ?? null;
}

function annuncia(testo, colore) {
  messaggio = { testo: testo.toUpperCase(), colore, vita: 1 };
}

// --- la morte -------------------------------------------------------------

// Il mondo non avanza quando c'è una schermata davanti. La morte è una di
// quelle, ed è la ragione per cui questa domanda è diventata una funzione
// invece di restare tre condizioni ricopiate in tre punti: la quarta sarebbe
// stata la prima a essere dimenticata da qualche parte.
function mondoFermo() {
  return ricetteAperte || aperturaVisibile || partitaAperta || mortoDi !== null;
}

// Si cade. Il corpo resta dove sei caduto con tutto quello che portavi, e la
// valle non cambia di una virgola: è l'altra metà del patto scritta nel
// README dal primo giorno, e senza di essa morire sarebbe la fine della
// partita invece della fine di un superstite.
function muori(causa) {
  mortoDi = causa;
  corpo = azioni.lasciaIlCadavere(eroe, tempo.giornoCorrente());
  // Niente messaggio di passaggio: ce n'è una schermata intera che lo dice, e
  // un messaggio che svanisce dietro di essa sarebbe rumore.
  messaggio = null;
  ricetteAperte = false;
  partitaAperta = false;
}

// Un superstite nuovo nella stessa valle. Non si ricomincia: l'orologio, il
// calendario, l'orto e tutto quello che hai costruito continuano da dove
// erano. Quello che riparte è il corpo — pieno, a mani vuote, e al punto di
// partenza, che è lontano da dove sei morto quanto ti eri allontanato.
function nuovoSuperstite() {
  salute.reimposta();
  bisogni.reimposta();
  gelando = false;

  entita.svuota();
  const partenza = giocatore.puntoDiPartenza(0, 0);
  eroe = entita.aggiungi(giocatore.crea(partenza.px, partenza.py));
  schermo.centraSu(eroe.px, eroe.py);

  casellaScelta = 0;
  colpito = null;
  lumi.length = 0;
  minimappa.dimentica();
  minimappa.aggiorna(eroe);

  // Letto prima di azzerarlo: il messaggio che serve è diverso a seconda che
  // ci sia o no qualcosa da andare a riprendere.
  const cera = corpo !== null;
  mortoDi = null;
  corpo = null;
  annuncia(cera ? "riprenditi quello che era tuo" : "un nuovo superstite", "#9ec97e");
}

// --- le stagioni ----------------------------------------------------------

// Quale stagione sta indossando la valle adesso. Serve a fare il lavoro una
// volta sola: rivestirla significa buttare via tutti i settori cotti, e farlo
// a ogni fotogramma sarebbe un modo creativo di non disegnare mai niente.
let stagioneVestita = null;

// Scritte a mano invece che composte: in italiano l'articolo e il participio
// cambiano con il genere, e una regola che li indovini costerebbe più di
// quattro righe scritte giuste.
const ARRIVO = {
  estate: "è arrivata l'estate",
  autunno: "è arrivato l'autunno",
  inverno: "è arrivato l'inverno",
  primavera: "è arrivata la primavera",
};

// Restituisce la stagione appena arrivata, o null se non è cambiato niente:
// chi chiama deve poter dire "l'inverno ha preso l'orto" invece di due
// messaggi che si coprono a vicenda.
function vestiLaValle() {
  const stagione = stagioni.stagioneCorrente();
  if (stagione === stagioneVestita) return null;
  const prima = stagioneVestita;
  stagioneVestita = stagione;
  mappa.impostaTavolozze(tavolozzaDi(stagione), tavolozzaBagnataDi(stagione));
  // Anche la minimappa: è la stessa valle vista da più in alto, e una valle
  // che d'inverno è grigia in mezzo allo schermo e verde nell'angolo in basso
  // a destra si legge come un riquadro dimenticato acceso.
  minimappa.impostaTavolozza(tavolozzaDi(stagione));
  // I fiori sono l'altra metà della primavera: due verdi leggermente diversi
  // non bastavano a distinguerla dall'estate.
  mappa.impostaFioritura(stagioni.fiorisce(stagione) ? FIORI : null);
  // Al primo giro non si annuncia niente: "è arrivata l'estate" appena aperto
  // il gioco è rumore, perché non è arrivato niente — si è cominciato lì.
  return prima === null ? null : stagione;
}

// --- la partita: salvare e caricare ---------------------------------------

// L'unico pezzo di DOM che serve al gioco oltre al canvas: un ingresso per i
// file, nascosto, aperto dal tasto. Sta qui perché questo è il modulo che
// possiede il DOM — le regole non sanno nemmeno che esista una pagina.
const ingressoFile = document.createElement("input");
ingressoFile.type = "file";
ingressoFile.accept = "application/json,.json";
ingressoFile.hidden = true;
document.body.appendChild(ingressoFile);

function scarica(testo, nomeFile) {
  const indirizzo = URL.createObjectURL(new Blob([testo], { type: "application/json" }));
  const collegamento = document.createElement("a");
  collegamento.href = indirizzo;
  collegamento.download = nomeFile;
  collegamento.click();
  URL.revokeObjectURL(indirizzo);
}

// Si esporta la partita in corso e non una casella: il file è il modo di
// portarsi la valle su un altro computer, e quello che si vuole portare è
// dove si è arrivati adesso.
function esportaSuFile() {
  const stato = salvataggio.istantanea(eroe, casellaScelta);
  try {
    scarica(JSON.stringify(stato, null, 1), salvataggio.nomeFile(stato));
  } catch {
    annuncia("esportazione non riuscita", "#c0705f");
    return;
  }
  annuncia("partita esportata", "#9ec97e");
}

function importaDaFile() {
  ingressoFile.value = "";
  ingressoFile.click();
}

// L'attesa del file è l'unica cosa asincrona del gioco, e sta fuori dal ciclo
// apposta: il ciclo gira a sessanta fotogrammi al secondo e non può fermarsi
// ad aspettare che qualcuno scelga un file.
ingressoFile.addEventListener("change", async () => {
  const file = ingressoFile.files?.[0];
  if (!file) return;

  let stato = null;
  try {
    stato = JSON.parse(await file.text());
  } catch {
    annuncia("il file non è leggibile", "#c0705f");
    return;
  }
  if (!salvataggio.valido(stato)) {
    annuncia("non è un salvataggio di questa versione", "#c0705f");
    return;
  }

  const ripreso = salvataggio.applica(stato);
  if (!ripreso) {
    annuncia("salvataggio illeggibile", "#c0705f");
    return;
  }
  riprendi(ripreso);
  annuncia("partita importata dal file", "#9ec97e");
});

// --- la rete --------------------------------------------------------------

// Ogni salvataggio sale, automatico o a mano che sia. Non si aspetta la
// risposta: il ciclo di gioco non si ferma per la rete, e se la salita
// fallisce il salvataggio locale è già scritto — il danno è che la copia in
// rete resta indietro di un salvataggio, non che si perda qualcosa.
// Vero quando in rete c'è una partita che questo computer non ha mai visto.
// Finché è così le salite automatiche non ci provano nemmeno: ripetere lo
// stesso rifiuto a ogni alba sarebbe rumore, e il posto dove si risolve è il
// pannello della rete.
let conflitto = false;

function fallaSalire(stato) {
  if (!sincronia.codiceAttivo() || !sincronia.configurata()) return;
  if (conflitto) return;
  sincronia.manda(stato).then((esito) => {
    if (esito.ok) return;
    if (esito.conflitto) {
      conflitto = true;
      annuncia("in rete c'è un'altra partita: apri P", "#c0705f");
      return;
    }
    annuncia(`in rete non è salita: ${esito.perche}`, "#c0705f");
  });
}

// Cosa c'è in rete, chiesto una volta sola quando serve mostrarlo. Il
// risultato arriva dopo, e il disegno nel frattempo dice "controllo".
function guardaLaRete() {
  nuvola = "attesa";
  if (!sincronia.codiceAttivo() || !sincronia.configurata()) {
    nuvola = null;
    return;
  }
  sincronia.sbircia().then((esito) => {
    nuvola = esito.ok ? esito : null;
  });
}

function accendiLaRete(codice) {
  if (!sincronia.attiva(codice)) {
    annuncia("non si riesce a ricordare il codice", "#c0705f");
    return;
  }
  guardaLaRete();
  conflitto = false;
  annuncia("sincronia accesa", "#9ec97e");
  // La partita in corso sale subito: senza, il codice esisterebbe ma in rete
  // non ci sarebbe niente finché non capita un salvataggio, e sull'altro
  // computer si troverebbe il vuoto.
  fallaSalire(salvataggio.istantanea(eroe, casellaScelta));
}

function riprendiDallaRete() {
  annuncia("scarico dalla rete...", "#8fa8d8");
  sincronia.prendi().then((esito) => {
    if (!esito.ok) {
      annuncia(esito.perche, "#c0705f");
      return;
    }
    const ripreso = salvataggio.applica(esito.stato);
    if (!ripreso) {
      annuncia("la partita in rete è illeggibile", "#c0705f");
      return;
    }
    riprendi(ripreso);
    // Riprendere è il modo legittimo di prendersi il turno: da qui in poi
    // questo computer ha visto quello che c'è in rete e può riscriverlo.
    conflitto = false;
    annuncia("partita ripresa dalla rete", "#9ec97e");
  });
}

// La via d'uscita dal conflitto quando si vuole tenere quella di qui. Sta
// dietro un tasto suo e non capita mai da sola: è l'unico gesto del gioco che
// cancella davvero qualcosa che sta altrove.
function sovrascriviLaRete() {
  annuncia("mando su comunque...", "#8fa8d8");
  sincronia.manda(salvataggio.istantanea(eroe, casellaScelta), true).then((esito) => {
    if (!esito.ok) {
      annuncia(esito.perche, "#c0705f");
      return;
    }
    conflitto = false;
    guardaLaRete();
    annuncia("la rete ora ha questa partita", "#9ec97e");
  });
}

function caselleDiSalvataggio() {
  return salvataggio.elenco().map((voce) => ({
    ...voce,
    automatico: salvataggio.eAutomatico(voce.slot),
  }));
}

function salvaIn(voce) {
  if (voce.automatico) {
    annuncia("questa casella la scrive l'alba", "#c0705f");
    return;
  }
  const stato = salvataggio.istantanea(eroe, casellaScelta);
  const esito = salvataggio.scrivi(voce.slot, stato);
  if (!esito.ok) {
    annuncia(esito.perche, "#c0705f");
    return;
  }
  fallaSalire(stato);
  // Si chiude da sola: salvare è un gesto che finisce lì, e lasciare aperta la
  // schermata costringerebbe a un tasto in più per tornare a giocare.
  partitaAperta = false;
  annuncia("partita salvata", "#9ec97e");
}

function caricaDa(voce) {
  if (voce.vuoto) {
    annuncia("questa casella è vuota", "#c0705f");
    return;
  }
  const ripreso = salvataggio.applica(salvataggio.leggi(voce.slot));
  if (!ripreso) {
    annuncia("salvataggio illeggibile", "#c0705f");
    return;
  }
  riprendi(ripreso);
  annuncia("partita ripresa", "#9ec97e");
}

// Quello che va rimesso a posto qui e non nelle regole: l'entità dell'eroe, la
// camera, la minimappa, i conti del ciclo. Lo stesso pezzo serve a una casella
// e a un file, e scritto due volte sarebbe la seconda a restare indietro.
function riprendi(ripreso) {
  // L'eroe si rifà invece di essere spostato: un'entità caricata deve tornare
  // allo stato che avrebbe appena creata — niente passo a metà, niente
  // direzione ereditata dalla partita di prima.
  entita.svuota();
  eroe = entita.aggiungi(giocatore.crea(ripreso.eroe.px, ripreso.eroe.py));
  eroe.guarda = ripreso.eroe.guarda ?? "giu";
  schermo.centraSu(eroe.px, eroe.py);

  casellaScelta = ripreso.casella;
  ultimoGiorno = ripreso.giorno;
  // L'alba di oggi conta come già scritta se è già passata: riprendere non
  // deve sovrascrivere la casella automatica con la partita appena ripresa.
  albaScritta = tempo.oraCorrente() >= tempo.ALBA_PIENA ? ripreso.giorno : ripreso.giorno - 1;
  colpito = null;
  lumi.length = 0;

  // La valle si rimette la stagione giusta senza annunciare un arrivo: non è
  // arrivato niente, si è ripreso da lì.
  // Un salvataggio si scrive da vivi, quindi riprendere significa sempre
  // essere in piedi.
  mortoDi = null;
  corpo = null;
  gelando = false;

  stagioneVestita = null;
  vestiLaValle();
  minimappa.dimentica();
  minimappa.aggiorna(eroe);

  partitaAperta = false;
}

// I tasti del pannello della rete. Ogni ramo finisce con un ritorno perché
// due azioni nello stesso fotogramma qui vorrebbero dire accendere e spegnere
// la sincronia in un sessantesimo di secondo.
function leggiRete() {
  if (!sincronia.configurata()) return;

  const codice = sincronia.codiceAttivo();

  if (comandi.appenaPremuto("importa") && !codice) {
    // Da qui in poi la tastiera scrive invece di comandare, finché non si
    // conferma o si annulla.
    comandi.iniziaScrittura(24);
    scrittaInCorso = "";
    return;
  }

  if (comandi.appenaPremuto("spegni") && codice) {
    sincronia.spegni();
    nuvola = null;
    conflitto = false;
    annuncia("sincronia spenta", "#c9b189");
    return;
  }

  if (comandi.appenaPremuto("esporta") && codice) {
    sovrascriviLaRete();
    return;
  }

  if (!comandi.appenaPremuto("usa")) return;

  if (codice) riprendiDallaRete();
  else accendiLaRete(sincronia.codiceNuovo());
}

// La scrittura vive fuori dal giro dei comandi: mentre è attiva la tastiera è
// tutta sua, e qui si guarda solo se è finita.
function leggiScrittura() {
  scrittaInCorso = comandi.testoScritto();
  const stato = comandi.fineScritturaSeFinita();
  if (!stato) return;

  scrittaInCorso = null;
  if (stato.annullato) return;

  const codice = sincronia.normalizza(stato.testo);
  if (!codice) {
    annuncia("codice non valido", "#c0705f");
    return;
  }
  // Accendere con un codice altrui non manda su la partita di qui: sarebbe il
  // modo più veloce di cancellare quella che si voleva riprendere. Si guarda
  // cosa c'è e si decide.
  if (!sincronia.attiva(codice)) {
    annuncia("non si riesce a ricordare il codice", "#c0705f");
    return;
  }
  guardaLaRete();
  // Chi scrive un codice altrui non ha ancora visto niente: finché non
  // riprende, questo computer non deve mandare su niente.
  conflitto = true;
  annuncia("codice scritto: ora riprendi", "#9ec97e");
}

function leggiPartita() {
  const voci = caselleDiSalvataggio();

  if (comandi.stoScrivendo() || scrittaInCorso !== null) {
    leggiScrittura();
    return;
  }

  for (let i = 0; i < voci.length; i += 1) {
    if (comandi.appenaPremuto(`casella${i + 1}`)) slotScelto = i;
  }
  // Destra e sinistra dentro un menu vogliono già dire "cambia colonna": non
  // serve un tasto nuovo per cambiare modo.
  if (comandi.appenaPremuto("sinistra") || comandi.appenaPremuto("destra")) {
    const passo = comandi.appenaPremuto("destra") ? 1 : -1;
    const quale = MODI_PARTITA.indexOf(modoPartita);
    modoPartita = MODI_PARTITA[(quale + passo + MODI_PARTITA.length) % MODI_PARTITA.length];
    if (modoPartita === "rete") guardaLaRete();
  }

  if (modoPartita === "rete") {
    leggiRete();
    return;
  }

  // Il file non guarda le caselle: si esporta la partita in corso e si importa
  // dentro la partita in corso. Una casella è un posto dove tornare, un file è
  // il modo di portarsi la valle altrove.
  if (comandi.appenaPremuto("esporta")) {
    esportaSuFile();
    return;
  }
  if (comandi.appenaPremuto("importa")) {
    importaDaFile();
    return;
  }

  if (!comandi.appenaPremuto("usa")) return;
  const voce = voci[slotScelto];
  if (!voce) return;
  if (modoPartita === "salva") salvaIn(voce);
  else caricaDa(voce);
}

// --- comandi --------------------------------------------------------------

function leggiComandi() {
  // La morte viene prima di tutto il resto, apertura compresa: è l'unica
  // schermata che non si toglie con un tasto qualsiasi. Si legge cos'è
  // successo, e poi si decide di continuare.
  if (mortoDi !== null) {
    if (comandi.appenaPremuto("usa")) nuovoSuperstite();
    return;
  }

  if (aperturaVisibile) {
    // Il primo tasto chiude la schermata e basta: se valesse anche come
    // comando, chi preme la barra per toglierla di mezzo darebbe una zappata
    // a caso senza capire perché.
    for (const azione of comandi.AZIONI) {
      if (comandi.appenaPremuto(azione)) { aperturaVisibile = false; return; }
    }
    for (let i = 0; i < comandi.CASELLE; i += 1) {
      if (comandi.appenaPremuto(`casella${i + 1}`)) { aperturaVisibile = false; return; }
    }
    return;
  }

  // La schermata della partita prende tutti i comandi finché è aperta. Un
  // tasto che vale in due posti alla volta è un tasto che salva quando volevi
  // camminare.
  if (comandi.appenaPremuto("partita")) {
    partitaAperta = !partitaAperta;
    slotScelto = 0;
    ricetteAperte = false;
    // Chiudendo si lascia perdere anche una scrittura a metà: uscire dalla
    // schermata con la tastiera ancora in modo scrittura vorrebbe dire un
    // gioco che non risponde più ai comandi.
    if (!partitaAperta) {
      comandi.fineScrittura();
      scrittaInCorso = null;
    } else if (modoPartita === "rete") {
      guardaLaRete();
    }
    return;
  }
  if (partitaAperta) {
    leggiPartita();
    return;
  }

  for (let i = 0; i < comandi.CASELLE; i += 1) {
    if (comandi.appenaPremuto(`casella${i + 1}`)) {
      if (ricetteAperte && i < RICETTE.length) ricettaScelta = i;
      else casellaScelta = i;
    }
  }

  if (comandi.appenaPremuto("minimappa")) minimappaVisibile = !minimappaVisibile;

  if (comandi.appenaPremuto("consuma")) {
    const esito = azioni.consuma(cosaInMano());
    if (esito) annuncia(`mangi: ${nomeDi(esito.cosa)}`, "#9ec97e");
  }

  if (comandi.appenaPremuto("getta")) {
    const esito = azioni.getta(eroe, casellaScelta);
    if (esito?.tipo === "gettato") {
      annuncia(`posato per terra: ${esito.quante} ${nomeDi(esito.cosa)}`, "#c9b189");
    } else if (esito?.tipo === "nonCePosto") {
      annuncia("davanti non c'è posto", "#c0705f");
    }
  }

  if (comandi.appenaPremuto("ricette")) {
    ricetteAperte = !ricetteAperte;
    ricettaScelta = 0;
  }

  if (!comandi.appenaPremuto("usa")) return;

  if (ricetteAperte) {
    const ricetta = RICETTE[ricettaScelta];
    const esito = fai(ricetta);
    if (esito.fatto) annuncia(`fatto: ${nomeDi(ricetta.produce.cosa)}`, "#9ec97e");
    else if (esito.perche === "zaino") annuncia("zaino pieno: getta qualcosa con G", "#c0705f");
    else annuncia("materiali insufficienti", "#c0705f");
    return;
  }

  const esito = azioni.agisci(eroe, cosaInMano());
  if (!esito) return;

  if (esito.tipo === "colpo" || esito.tipo === "raccolto") {
    // DEBITO: qui va il suono del colpo, quando esisterà il comparto audio
    // (M6). Provando il gioco, tremolio e scheggie sono stati giudicati
    // sufficienti per ora — ma come ripiego dichiarato, non come soluzione:
    // il suono resta ciò che manca davvero al gesto. Un tonfo sordo per il
    // legno, uno schiocco secco per la pietra.
    colpito = { tx: esito.tx, ty: esito.ty, resta: DURATA_TREMOLIO };
    if (esito.scheggie) {
      // Il colpo che stacca ne sparge di più e più lontano: è la differenza
      // fra "l'hai preso" e "è venuto giù".
      const finale = esito.tipo === "raccolto";
      scheggie.sparge(
        esito.tx * TASSELLO + TASSELLO / 2,
        esito.ty * TASSELLO + TASSELLO / 2,
        finale ? 26 : 12,
        esito.scheggie,
        finale ? 1.5 : 1
      );
    }
  }

  if (esito.tipo === "bevi") annuncia("bevi", "#8fb8d8");
  if (esito.tipo === "riempi") annuncia(`riempiti ${esito.quanti} secchi`, "#8fb8d8");
  if (esito.tipo === "zappa") annuncia("terra zappata", "#9ec97e");
  if (esito.tipo === "semina") annuncia("seminato", "#9ec97e");
  if (esito.tipo === "innaffia") annuncia("innaffiato", "#8fb8d8");
  if (esito.tipo === "dormi") annuncia(`hai dormito fino all'alba`, "#9ec97e");

  if (esito.tipo === "frugato") {
    if (esito.presi.length === 0) annuncia("non aveva niente addosso", "#c9b189");
    else {
      const elenco = esito.presi.map((v) => `+${v.quante} ${nomeDi(v.cosa)}`).join("  ");
      annuncia(esito.resta > 0 ? `${elenco}, il resto è ancora lì` : elenco, "#9ec97e");
    }
  }

  if (esito.tipo === "preso") {
    const quanto = `+${esito.quante} ${nomeDi(esito.cosa)}`;
    annuncia(esito.resta > 0 ? `${quanto}, ne restano ${esito.resta}` : quanto, "#9ec97e");
  } else if (esito.tipo === "zainoPieno") {
    annuncia("zaino pieno: getta qualcosa con G", "#c0705f");
  } else if (esito.tipo === "raccolto") {
    const elenco = esito.ottenuto.map((v) => `+${v.quante} ${nomeDi(v.cosa)}`).join("  ");
    if (esito.perse.length > 0) annuncia("zaino pieno, perso qualcosa", "#c0705f");
    else if (esito.avanzate.length > 0) annuncia("zaino pieno: il resto è per terra", "#c9b189");
    else if (elenco) annuncia(elenco, "#9ec97e");
  } else if (esito.tipo === "posa") {
    annuncia(`posato: ${nomeDi(esito.cosa)}`, "#9ec97e");
  }
}

// --- ciclo ----------------------------------------------------------------

function aggiorna(passo) {
  // Il tempo non scorre mentre si sceglie cosa costruire: un menu che ti fa
  // arrivare la notte addosso mentre lo leggi è una punizione, non una sfida.
  if (!mondoFermo()) {
    tempo.avanza(passo);
    // Quello che si ha in mano lo decide lo zaino, non l'entità: le entità
    // stanno sotto le regole e non devono sapere cos'è un inventario. Lo
    // stesso vale per la forma fisica: quanto si è in forze è una regola.
    eroe.impugnato = CATALOGO[cosaInMano()]?.impugnato ?? null;
    eroe.fattoreVelocita = bisogni.fattoreVelocita();
    eroe.puoCorrere = bisogni.puoCorrere();
    entita.aggiorna(passo);

    // Dopo il movimento, perché il consumo dipende da cosa si è appena fatto.
    for (const vuoto of bisogni.avanza(passo, { corre: eroe.correndo, siMuove: eroe.inMovimento })) {
      annuncia(AVVISI_BISOGNI[vuoto], "#c0705f");
    }

    // La salute viene dopo i bisogni, e non è un caso: raccoglie le
    // conseguenze di quello che è appena successo sopra di lei. Il freddo si
    // chiede una volta per passo e la risposta la riusa anche il disegno: non
    // per costo — è un ottocentesimo di fotogramma — ma perché la barra e il
    // danno devono raccontare lo stesso momento.
    const primaGelava = gelando;
    gelando = freddo.alFreddo(eroe, cosaInMano());
    if (gelando && !primaGelava) annuncia("stai gelando: serve una fiamma", "#8fa8d8");

    salute.avanza(passo, { vuoti: bisogni.vuoti(), alFreddo: gelando });
    scheggie.aggiorna(passo);
    // Si tiene aggiornata anche da spenta: scorrerla costa due centesimi di
    // millisecondo, ricostruirla da zero quasi trenta. Meglio pagare sempre
    // il poco che pagare il molto ogni volta che la si riaccende.
    minimappa.aggiorna(eroe);

    if (colpito) {
      colpito.resta -= passo;
      if (colpito.resta <= 0) colpito = null;
    }
  }

  // Un controllo solo, e fuori dal giro del mondo. La salute può arrivare a
  // zero in tre modi — un passo di gioco, una notte dormita, un'assenza — e
  // ognuno dei tre sta in un posto diverso: chiedere qui "sei morto?" invece
  // di far rispondere a ognuno era l'unico modo di non lasciarne fuori uno.
  // Il terzo, il sonno, era già sfuggito una volta scrivendolo.
  if (salute.eMorto() && mortoDi === null) muori(salute.causaDellaMorte());

  leggiComandi();
  azioneCorrente = mondoFermo() ? null : azioni.azionePossibile(eroe, cosaInMano());

  if (messaggio) {
    messaggio.vita -= passo / 2.2;
    if (messaggio.vita <= 0) messaggio = null;
  }

  // L'orto cresce al cambio di giorno, non a ogni fotogramma: una coltura
  // matura in giorni, e contarli è l'unico modo perché aspettare significhi
  // qualcosa. È un ciclo e non un confronto perché una notte dormita può far
  // passare un giorno intero in un colpo solo.
  let cresciute = 0;
  let appassite = 0;
  let spenti = 0;
  while (ultimoGiorno < tempo.giornoCorrente()) {
    ultimoGiorno += 1;
    const orti = orto.nuovoGiorno();
    cresciute += orti.cresciute;
    appassite += orti.appassite;
    spenti += decadimento.nuovoGiorno();
  }

  const arrivata = vestiLaValle();

  // Un messaggio solo: durano un paio di secondi, e tre in fila vorrebbero
  // dire vederne uno — l'ultimo, che non è detto sia il più importante.
  // L'ordine è quello di gravità, e la stagione che si porta via il campo si
  // dice in una frase sola invece che in due che si coprono.
  if (appassite > 0 && arrivata) annuncia(`${arrivata}: l'orto è morto`, "#c0705f");
  else if (appassite > 0) annuncia(`l'orto è marcito: ${appassite}`, "#c0705f");
  else if (arrivata) annuncia(ARRIVO[arrivata], "#c9b189");
  else if (spenti > 0) annuncia("il fuoco si è spento", "#c0705f");
  else if (cresciute > 0) annuncia("l'orto è cresciuto", "#9ec97e");

  // Il salvataggio dell'alba, e proprio qui: dopo che il giorno ha fatto i
  // suoi conti — l'orto cresciuto, i fuochi spenti, la stagione girata — così
  // una partita ripresa non li rifà e non li salta.
  if (tempo.giornoCorrente() > albaScritta && tempo.oraCorrente() >= tempo.ALBA_PIENA) {
    albaScritta = tempo.giornoCorrente();
    const istantanea = salvataggio.istantanea(eroe, casellaScelta);
    const esito = salvataggio.scrivi(salvataggio.ALBA, istantanea);
    fallaSalire(istantanea);
    // Il fallimento si dice sempre, la riuscita solo se non copre altro: il
    // campo morto stanotte conta più della conferma di una cosa che doveva
    // funzionare, e nella schermata della partita l'ora della casella si vede.
    if (!esito.ok) annuncia(esito.perche, "#c0705f");
    else if (!messaggio) annuncia("salvato all'alba", "#8fa8d8");
  }

  mappa.precuociVicini();

  // La camera insegue con un ritardo: seguire di colpo rende ogni cambio di
  // direzione uno strattone. Il fattore è tarato per recuperare quasi tutto in
  // un decimo di secondo — abbastanza da ammorbidire, troppo poco da notare.
  const inseguimento = 1 - Math.exp(-12 * passo);
  const bersaglioX = eroe.px - schermo.LARGHEZZA / 2;
  const bersaglioY = eroe.py - schermo.ALTEZZA / 2;
  schermo.camera.x += (bersaglioX - schermo.camera.x) * inseguimento;
  schermo.camera.y += (bersaglioY - schermo.camera.y) * inseguimento;

  comandi.finePasso();
}

// Una sola lista per tutto ciò che sta in piedi sul terreno, riusata a ogni
// fotogramma. Alberi ed entità finiscono qui insieme proprio perché l'ordine di
// disegno dipende solo da dove ha i piedi ciascuno, non da cosa è.
const inPiedi = [];

function disegna() {
  schermo.pulisci("#0d0f12");

  // Due fotogrammi al secondo per le fiamme: di più le farebbe sfarfallare,
  // di meno le farebbe sembrare rotte.
  const fotogramma = Math.floor(performance.now() / 500);
  const oggetti = mappa.disegnaTerreno(fotogramma);

  inPiedi.length = 0;
  for (const o of oggetti) inPiedi.push(o);
  for (const e of entita.daDisegnare()) {
    if (schermo.visibile(e.x, e.y, e.sprite.width, e.sprite.height)) inPiedi.push(e);
  }
  // Chi ha i piedi più in basso è più vicino a chi guarda, quindi va disegnato
  // per ultimo. È tutta la profondità che serve a una vista dall'alto 3/4.
  inPiedi.sort((a, b) => a.base - b.base);

  for (const cosa of inPiedi) schermo.disegna(cosa.sprite, cosa.x + tremolioDi(cosa), cosa.y);

  // Prima del buio, così di notte anche le scheggie si spengono con tutto il
  // resto invece di brillare sopra l'oscurità come scintille.
  scheggie.disegna();
  disegnaBuio();
  disegnaInterfaccia();

  if (!diagnostica.hidden) aggiornaDiagnostica();
}

// Lo scarto orizzontale di ciò che è stato appena colpito. Oscilla in fretta
// e si spegne: è la stessa figura che fa una corda pizzicata.
function tremolioDi(cosa) {
  if (!colpito || cosa.tx !== colpito.tx || cosa.ty !== colpito.ty) return 0;
  const quanto = colpito.resta / DURATA_TREMOLIO;
  return Math.round(Math.sin(colpito.resta * 90) * AMPIEZZA_TREMOLIO * quanto);
}

function disegnaBuio() {
  lumi.length = 0;
  for (const luce of mappa.lumiVisibili()) lumi.push(luce);
  // La luce esce dalla fiamma disegnata in mano, non da un punto generico
  // sopra la testa: ora che la torcia si vede, la luce deve venire da lì.
  const luceInMano = CATALOGO[cosaInMano()]?.luce;
  if (luceInMano) {
    lumi.push({ x: eroe.impugnatura.x, y: eroe.impugnatura.y, ...luceInMano });
  }
  oscurita.disegna(schermo.pennello(), tempo.luceAmbiente(), tempo.tintaOscurita(), lumi);
}

function disegnaInterfaccia() {
  const p = schermo.pennello();
  hud.disegnaBisogni(p, { salute: salute.livelloCorrente(), alFreddo: gelando });
  hud.disegnaOrologio(p, {
    giorno: tempo.giornoCorrente(),
    orologio: tempo.orologio(),
    eNotte: tempo.eNotte(),
    stagione: stagioni.stagioneCorrente(),
    giornoNellaStagione: stagioni.giornoNellaStagione(),
    giorniPerStagione: stagioni.GIORNI_PER_STAGIONE,
  });
  hud.disegnaAzione(p, azioneCorrente);
  const barra = hud.disegnaZaino(p, casellaScelta);
  hud.disegnaPromemoria(p, barra, cosaInMano());
  hud.disegnaMessaggio(p, messaggio);
  if (minimappaVisibile && !aperturaVisibile) minimappa.disegna(p);
  if (ricetteAperte) hud.disegnaRicette(p, ricettaScelta);
  if (partitaAperta) {
    hud.disegnaPartita(p, {
      voci: caselleDiSalvataggio(),
      modo: modoPartita,
      scelta: slotScelto,
      rete: {
        configurata: sincronia.configurata(),
        codice: sincronia.codiceAttivo(),
        nuvola,
        conflitto,
        scrittura: scrittaInCorso,
      },
    });
  }
  if (aperturaVisibile) hud.disegnaApertura(p, VERSIONE);
  // Ultima di tutte: copre anche lo zaino e la minimappa, che a quel punto non
  // sono più cose su cui si possa agire.
  if (mortoDi !== null) {
    hud.disegnaMorte(p, {
      causa: salute.CAUSE[mortoDi] ?? "",
      giorno: tempo.giornoCorrente(),
      stagione: stagioni.stagioneCorrente(),
      corpo,
    });
  }
}

// --- diagnostica ----------------------------------------------------------

const NOMI_TERRENO = ["acqua", "bassofondo", "sabbia", "erba", "sterpaglia", "roccia", "terra"];

// Detto una volta sola, quando la barra tocca il fondo: ripeterlo a ogni
// fotogramma sarebbe una sirena, non un avviso.
const AVVISI_BISOGNI = {
  fame: "hai fame",
  sete: "hai sete",
  stanchezza: "sei allo stremo",
};

function aggiornaDiagnostica() {
  const tx = Math.floor(eroe.px / TASSELLO);
  const ty = Math.floor(eroe.py / TASSELLO);
  diagnostica.textContent = [
    `fps      ${ciclo.fpsCorrenti()}  peggiore ${(ciclo.peggiorFotogramma() * 1000).toFixed(1)} ms`,
    `scala    ${schermo.scalaCorrente()}x  (${schermo.LARGHEZZA}x${schermo.ALTEZZA})`,
    `versione ${VERSIONE}`,
    `seme     ${SEME}`,
    `tassello ${tx}, ${ty}`,
    `terreno  ${NOMI_TERRENO[mappa.terrenoDi(tx, ty)]}`,
    `bisogni  ${bisogni.ELENCO.map((n) => n[0] + " " + bisogni.livello(n).toFixed(2)).join("  ")}  velocità ${bisogni.fattoreVelocita().toFixed(2)}`,
    `salute   ${salute.livelloCorrente().toFixed(3)}  freddo ${gelando ? "sì" : "no"}  ${mortoDi ? `morto ${mortoDi}` : "vivo"}`,
    `ora      ${tempo.orologio()}  giorno ${tempo.giornoCorrente()}  luce ${tempo.luceAmbiente().toFixed(2)}`,
    `settori  ${mappa.settoriInMemoria()}  in piedi ${inPiedi.length}  lumi ${lumi.length}`,
    `scheggie ${scheggie.vive()}  figure ${giocatore.figureComposte()}`,
    `minimappa ${minimappaVisibile ? "accesa" : "spenta"}  ricostruzioni ${minimappa.ricostruzioni()}`,
    `modifiche ${modifiche.quanti()}  colture ${orto.quante()}`,
  ].join("\n");
}

// Si accende con F3, oppure con "?diagnostica" nell'indirizzo: la seconda via
// esiste perché la verifica automatica apre la pagina e fotografa, e non ha
// modo di premere un tasto.
if (parametri.has("diagnostica")) diagnostica.hidden = false;

addEventListener("keydown", (evento) => {
  if (evento.key === "F3") {
    evento.preventDefault();
    diagnostica.hidden = !diagnostica.hidden;
  }
});

// --- avvio ----------------------------------------------------------------

schermo.prepara(quadro);
comandi.collega();
mappa.inizializza(SEME);

// I mucchi per terra si disegnano con l'icona di quello che contengono, ma la
// mappa non conosce il catalogo delle cose — le dipendenze vanno in un verso
// solo. Il collegamento si fa qui, che è il punto in cui è lecito conoscere
// entrambi i lati.
mappa.registraIconeMucchio(
  Object.fromEntries(Object.entries(CATALOGO).map(([id, voce]) => [id, voce.icona]))
);

// "?ora=22" comincia di notte, "?giorno=20" comincia d'inverno. Il seme, l'ora
// e il giorno nell'indirizzo rendono una situazione riproducibile: la stessa
// valle nello stesso momento dell'anno, ogni volta.
if (parametri.has("ora")) tempo.impostaOra(Number(parametri.get("ora")));
if (parametri.has("giorno")) tempo.impostaGiorno(Number(parametri.get("giorno")));
// Il conto dei giorni parte da dove parte la partita, altrimenti cominciando
// dal giorno venti il ciclo del cambio giorno girerebbe diciannove volte
// facendo appassire un orto che non è mai esistito.
ultimoGiorno = tempo.giornoCorrente();
// L'alba di oggi conta come già passata se lo è: cominciando alle sette in
// punto non si deve scrivere un salvataggio automatico prima ancora di aver
// mosso un passo.
albaScritta = tempo.oraCorrente() >= tempo.ALBA_PIENA
  ? tempo.giornoCorrente()
  : tempo.giornoCorrente() - 1;

// Dopo il giorno e non prima: la valle si veste della stagione in cui si
// comincia, non di quella del primo giorno per poi cambiarsi al primo
// fotogramma annunciando un arrivo che non c'è stato.
vestiLaValle();

entita.registra(giocatore.TIPO, giocatore.aggiorna);
const partenza = giocatore.puntoDiPartenza(0, 0);
eroe = entita.aggiungi(giocatore.crea(partenza.px, partenza.py));
schermo.centraSu(eroe.px, eroe.py);

// Il mondo non aspetta chi guarda un'altra scheda. Il browser smette di
// chiamare il gioco — quello non si può impedire — ma il tempo passato si
// recupera al ritorno, ed è lo stesso meccanismo del dormire: l'orologio
// avanza, i bisogni calano, e il ciclo del cambio giorno fa crescere l'orto,
// spegnere i fuochi e girare le stagioni al fotogramma dopo.
//
// Oltre il tetto il conto si ferma. Non è una gentilezza: recuperare mille
// giorni vorrebbe dire mille giri del ciclo del giorno, cioè una pagina
// bloccata per secondi, e a quel punto non cambierebbe più niente comunque —
// l'orto è morto da un pezzo e i bisogni sono a zero da un pezzo.
const ASSENZA_MASSIMA = 4 * 60 * 60; // quattro ore vere, cioè quarantotto giorni

// Senza questo si riparte con i tasti ancora premuti: chi cambia applicazione
// lascia il suo keyup dall'altra parte.
ciclo.collegaSospensione(() => comandi.rilasciaTutto());

// Il tempo che il ciclo non ha potuto simulare passo per passo. Arriva in
// blocco al primo fotogramma dopo un'assenza, e qui diventa mondo: l'orologio
// avanza, i bisogni calano, e il ciclo del cambio giorno fa crescere l'orto,
// spegnere i fuochi e girare le stagioni al fotogramma dopo.
function recuperaIlTempoPerso(secondiSaltati) {
  if (mondoFermo()) return;
  const secondi = Math.min(secondiSaltati, ASSENZA_MASSIMA);
  if (secondi < 1) return;

  tempo.avanza(secondi);
  bisogni.passanoSecondi(secondi, { stanca: true });
  // Si può tornare e trovarsi morti, ed è giusto così: "il mondo non aspetta"
  // è una frase che vale anche per il corpo. Il freddo no — di quelle ore
  // nessuno sa quante fossero d'inverno e di notte, e inventarlo sarebbe
  // peggio che lasciarlo fuori.
  salute.passanoSecondi(secondi, { vuoti: bisogni.vuoti() });

  // Si dice quanto è passato, perché tornare e trovare l'orto morto senza
  // sapere perché è la differenza fra una regola e un guasto. In giorni se
  // sono giorni, in ore se sono ore: "sei stato via 0 giorni" non è una
  // risposta.
  //
  // Sotto un'ora di gioco non si dice niente. Un intoppo di mezzo secondo
  // arriva qui come tutto il resto, e annunciarlo sarebbe rumore che insegna a
  // non leggere i messaggi.
  const ore = secondi / tempo.SECONDI_PER_GIORNO * 24;
  if (ore >= 24) {
    const giorni = Math.floor(ore / 24);
    annuncia(`sei stato via ${giorni} giorn${giorni === 1 ? "o" : "i"}`, "#c9b189");
  } else if (ore >= 1) {
    const tonde = Math.round(ore);
    annuncia(`sei stato via ${tonde} or${tonde === 1 ? "a" : "e"}`, "#c9b189");
  }
}
ciclo.avvia({ aggiorna, disegna, salto: recuperaIlTempoPerso });

// Il gioco si installa e funziona senza rete. Si registra dopo l'avvio e non
// prima: il service worker non serve a far partire la partita, e metterlo
// sulla strada del primo fotogramma la ritarderebbe senza motivo.
if ("serviceWorker" in navigator) {
  addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Senza funzionamento offline si gioca lo stesso: non è un errore da
      // mostrare a chi sta giocando.
    });
  });
}

// Segnale per la verifica automatica: senza, uno screenshot non distingue
// "il gioco non è partito" da "il gioco è partito ed è tutto nero".
document.documentElement.dataset.avviato = "si";

// Maniglia per il collaudo, solo con la diagnostica accesa: permette di
// leggere da fuori lo stato del gioco, che è l'unico modo di verificare
// movimento, urti e raccolta senza un paio d'occhi davanti allo schermo.
if (parametri.has("diagnostica")) {
  globalThis.ultimoRaccolto = {
    eroe: () => eroe,
    mappa,
    modifiche,
    schermo,
    ciclo,
    tempo,
    inventario,
    azioni,
    scheggie,
    giocatore,
    scegliCasella: (i) => { casellaScelta = i; },
    chiudiApertura: () => { aperturaVisibile = false; },
    tremolio: () => (colpito ? { ...colpito } : null),
    messaggio: () => (messaggio ? messaggio.testo : null),
    minimappa,
    minimappaAccesa: () => minimappaVisibile,
    bisogni,
    salute,
    freddo,
    eMorto: () => mortoDi,
    nuovoSuperstite,
    orto,
    stagioni,
    decadimento,
    ciclo,
    salvataggio,
    sincronia,
    comandi,
    apriPartita: (modo) => { partitaAperta = true; modoPartita = modo ?? "salva"; slotScelto = 0; },
    partitaAperta: () => partitaAperta,
  };
}

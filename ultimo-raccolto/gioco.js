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
import * as suono from "./motore/suono.js";
import { impronta } from "./motore/casuale.js";
import * as mappa from "./mondo/mappa.js";
import * as modifiche from "./mondo/modifiche.js";
import * as entita from "./entita/entita.js";
import * as giocatore from "./entita/giocatore.js";
import * as infetto from "./entita/infetto.js";
import * as urti from "./entita/urti.js";
import * as tempo from "./regole/tempo.js";
import * as riposo from "./regole/riposo.js";
import * as bisogni from "./regole/bisogni.js";
import * as salute from "./regole/salute.js";
import * as freddo from "./regole/freddo.js";
import * as fiamma from "./regole/fiamma.js";
import * as addosso from "./regole/addosso.js";
import * as fauna from "./regole/fauna.js";
import * as polli from "./regole/polli.js";
import * as infetti from "./regole/infetti.js";
import * as riparo from "./regole/riparo.js";
import * as chiasso from "./regole/chiasso.js";
import * as udito from "./regole/udito.js";
import * as contenitori from "./regole/contenitori.js";
import * as orto from "./regole/orto.js";
import * as stagioni from "./regole/stagioni.js";
import * as salvataggio from "./regole/salvataggio.js";
import * as simulazione from "./regole/simulazione.js";
// Questi due non li usa il ciclo di gioco — se ne occupa simulazione.js — ma
// li espone la maniglia del collaudo in fondo al file. Sono rimasti elencati
// lì senza essere importati da M7.5.1 in poi, e il risultato era che aprire il
// gioco con ?diagnostica lanciava un ReferenceError e la maniglia non nasceva:
// il gioco si vedeva bene e nessuna prova dai tasti veri poteva più girare.
import * as decadimento from "./regole/decadimento.js";
import * as ricrescita from "./regole/ricrescita.js";
import * as pesca from "./regole/pesca.js";
import * as acqua from "./regole/acqua.js";
import * as meteo from "./regole/meteo.js";
import * as atmosfera from "./arte/atmosfera.js";
import * as sincronia from "./regole/sincronia.js";
import { tavolozzaDi, tavolozzaBagnataDi } from "./arte/tavolozza.js";
import { FIORI } from "./arte/sprite-fiori.js";
// Le voci una per una e non tutto il modulo: qui dentro "voci" è già la
// lista delle caselle di salvataggio, e due significati per la stessa parola
// nello stesso file sono l'errore che si scopre tardi.
import {
  colpoDi, MORSO, COLPO_A_SEGNO, CADUTO, ZAPPA, SEMINA, ACQUA, SORSO, MANGIA,
  BENDA, POSA, SCELTA, FATTO, NEGATO, PRESO, GELO, MORTE, COPERCHIO, ROTTURA,
} from "./arte/voci.js";
import * as inventario from "./regole/inventario.js";
import * as azioni from "./regole/azioni.js";
import { RICETTE, fai } from "./regole/ricette.js";
import { nomeDi, CATALOGO } from "./regole/oggetti.js";
import * as hud from "./interfaccia/hud.js";
import * as minimappa from "./interfaccia/minimappa.js";
import * as mappaGrande from "./interfaccia/mappa.js";
import * as tinte from "./interfaccia/tinte.js";
import * as esplorato from "./regole/esplorato.js";

const { TASSELLO } = schermo;

// La versione si vede nella schermata di apertura e nella diagnostica. Serve
// a rispondere alla domanda "sto giocando l'ultima versione?", che senza un
// numero a schermo non ha risposta: una copia vecchia rimasta nella cache del
// browser è identica a un aggiornamento mai pubblicato.
const VERSIONE = "M7.18.20";

// Il numero però sta in questo file soltanto, e da solo non bastava: in
// M7.15.7 lo schermo diceva la versione nuova mentre mondo/mappa.js arrivava
// ancora dalla cache, vecchio. Da allora index.html chiede ogni modulo con
// "?v=" e la versione, così una pagina nuova non può mescolare file vecchi.
//
// Resta un caso, e si riconosce da qui: una pagina vecchia che ha avuto
// questo file nuovo. Allora i due numeri non coincidono, e lo schermo lo dice
// invece di mostrare una versione che il resto dei moduli non è detto abbia.
const VERSIONE_PAGINA = new URL(import.meta.url).searchParams.get("v");
const VERSIONE_MOSTRATA = VERSIONE_PAGINA !== null && VERSIONE_PAGINA !== VERSIONE
  ? `${VERSIONE} INCOMPLETA, RICARICA FRA POCO`
  : VERSIONE;

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
// Se c'è un banco a portata, chiesto una volta all'apertura del pannello e non
// a ogni fotogramma. Si può: con il pannello aperto il mondo è fermo e il
// superstite non si muove, quindi la risposta non può cambiare mentre lo si
// guarda — e chiederla a ogni fotogramma vorrebbe dire quarantanove tasselli
// di mondo generati sessanta volte al secondo per sapere una cosa sola.
let alBanco = false;
// Lo stesso per il fuoco, che da M7.17 serve alla zuppa.
let alFuoco = false;
let azioneCorrente = null;
let smontaggioCorrente = null;
let messaggio = null;
let avvisoRisveglio = null;
let luogoAttuale = null;
// La schermata iniziale, o null quando si gioca. Sono tre passi di uno stesso
// ingresso: "titolo" sceglie fra partita nuova e partita salvata, "stagione" e
// "giorno" scelgono da che punto dell'anno comincia quella nuova.
let iniziale = "titolo";
// La riga accesa della schermata iniziale in cui si è. Una sola, perché si
// guarda una schermata alla volta; la stagione scelta invece si ricorda,
// così tornando indietro dal giorno si ritrova quella di prima.
let rigaIniziale = 0;
let stagioneIniziale = 0;
// Il pannello delle partite aperto dal titolo e non da una partita in corso.
// Non è lo stesso pannello: dal titolo non c'è niente da salvare, e mandare in
// rete o su file una partita che non è ancora cominciata vorrebbe dire
// sovrascrivere quella vera con una valle vuota.
let caricaDalTitolo = false;
let minimappaVisibile = true;
// La mappa grande è modale come le ricette e la partita: il mondo non avanza
// mentre la si guarda. Un mondo che tira avanti dietro una schermata a tutto
// campo sarebbe una notte che ti arriva addosso mentre cerchi la strada.
let mappaAperta = false;
// La cassa davanti a cui si sta, o null. Il tassello e non il contenuto: il
// contenuto vive nelle modifiche, e tenerne qui una copia vorrebbe dire due
// verità che si allontanano.
let cassaAperta = null;
// Un cursore solo per venti caselle, dodici di cassa e otto di zaino. Per chi
// guarda sono una griglia sola di quattro per cinque, e lo sono anche qui: la
// riga è l'indice diviso quattro, e la terza riga è il confine.
let cassaScelta = 0;

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
// Che freddo si sta prendendo adesso — "gelo", "bagnato" o niente. Calcolato
// una volta per passo e riusato dal disegno: la regola non si interroga due
// volte per fotogramma. Era un sì/no finché i freddi erano uno solo.
let gelando = null;
// Quanto resta del lampo rosso di un morso preso. Sta qui e non nelle regole
// perché è puro racconto: la ferita l'ha già applicata chi mordeva.
let lampoDanno = 0;
const DURATA_LAMPO = 0.45;

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

// Chiudere la schermata iniziale accende anche il suono.
//
// Un browser non fa partire l'audio finché chi guarda non ha toccato niente, e
// di solito quella regola si paga con un cartello "clicca per attivare
// l'audio". Qui il gesto c'era già — la partita comincia con un tasto — quindi
// il tasto che la comincia è anche il gesto che accende le casse, e di
// cartelli non ne serve nessuno.
//
// Questa chiamata però non basta da sola, e sotto, accanto al tasto della
// diagnostica, c'è il perché: qui siamo dentro un fotogramma, non dentro il
// gestore del tasto. Resta perché è il posto in cui la decisione si legge —
// "il suono comincia quando comincia la partita" — ed è innocua: accendere un
// contesto già acceso non fa niente.
function chiudiLIniziale() {
  iniziale = null;
  caricaDalTitolo = false;
  suono.sblocca();
}

// Il giorno da cui si comincia, messo subito e non alla conferma: mentre si
// scorre fra le stagioni la valle dietro il menu si veste di quella accesa, e
// si vede la neve prima di scegliere l'inverno. Il mondo è fermo, quindi
// cambiare giorno qui non attraversa nessuna mezzanotte: è lo stesso salto di
// "?giorno=" nell'indirizzo, fatto dopo invece che prima.
function provaIlGiorno(giorno) {
  tempo.impostaGiorno(giorno);
  // L'alba di oggi conta come già passata se lo è, per la stessa ragione
  // dell'avvio: nessun salvataggio automatico prima di aver mosso un passo.
  albaScritta = tempo.oraCorrente() >= tempo.ALBA_PIENA ? giorno : giorno - 1;
  vestiLaValle();
}

// Una partita nuova, dal giorno scelto. La valle, il superstite e lo zaino
// sono già quelli di una partita nuova — la pagina si apre così — quindi
// cominciarla vuol dire soltanto fissare il giorno e togliere il menu.
function avviaNuovaPartita(giorno) {
  provaIlGiorno(giorno);
  chiudiLIniziale();
}

// --- la morte -------------------------------------------------------------

// Il mondo non avanza quando c'è una schermata davanti. La morte è una di
// quelle, ed è la ragione per cui questa domanda è diventata una funzione
// invece di restare tre condizioni ricopiate in tre punti: la quarta sarebbe
// stata la prima a essere dimenticata da qualche parte.
function mondoFermo() {
  return ricetteAperte || iniziale !== null || partitaAperta || mappaAperta
    || cassaAperta !== null || mortoDi !== null;
}

// Si cade. Il corpo resta dove sei caduto con tutto quello che portavi, e la
// valle non cambia di una virgola: è l'altra metà del patto scritta nel
// README dal primo giorno, e senza di essa morire sarebbe la fine della
// partita invece della fine di un superstite.
function muori(causa) {
  mortoDi = causa;
  suono.suona(MORTE);
  corpo = azioni.lasciaIlCadavere(eroe, tempo.giornoCorrente());
  // Niente messaggio di passaggio: ce n'è una schermata intera che lo dice, e
  // un messaggio che svanisce dietro di essa sarebbe rumore.
  messaggio = null;
  ricetteAperte = false;
  partitaAperta = false;
  // La cassa si chiude senza far rumore: il coperchio è un gesto, e morire non
  // è un gesto.
  cassaAperta = null;
}

// Dove comincia un superstite: dentro la fattoria.
//
// Fin qui era "il primo tassello calpestabile a spirale attorno all'origine",
// che è una definizione onesta di un posto che non esiste. Adesso un posto
// c'è, e il punto di partenza è quello — il cortile, che è terra battuta e
// libera. La spirale resta perché serve lo stesso: dice di non svegliarsi
// dentro un muro.
//
// Se in questa valle non c'è stato posto per una fattoria — il terreno decide,
// e un'origine in mezzo a un lago capita — si torna a com'era. Meglio
// cominciare in un prato che non cominciare.
function doveSiComincia() {
  const fattoria = mappa.laFattoria();
  return giocatore.puntoDiPartenza(fattoria?.tx ?? 0, fattoria?.ty ?? 0);
}

// Un superstite nuovo nella stessa valle. Non si ricomincia: l'orologio, il
// calendario, l'orto e tutto quello che hai costruito continuano da dove
// erano. Quello che riparte è il corpo — pieno, a mani vuote, e al punto di
// partenza, che è lontano da dove sei morto quanto ti eri allontanato.
function nuovoSuperstite() {
  salute.reimposta();
  meteo.reimposta();
  bisogni.reimposta();
  chiasso.reimposta();
  udito.reimposta();
  gelando = null;
  lampoDanno = 0;

  // Prima di svuotare le entità, così il conto di chi inseguiva torna a zero
  // insieme a loro: senza, l'esclamativo resterebbe acceso per un fotogramma
  // addosso a un superstite che non esisteva ancora.
  infetti.svuota();
  fiamma.reimposta();
  addosso.reimposta();
  // Anche il riparo: la stanza in cui si stava non è la stanza in cui ci si
  // risveglia, e tenersela vorrebbe dire un superstite nuovo che non gela in
  // mezzo a un prato.
  riparo.reimposta();
  luogoAttuale = null;
  entita.svuota();
  const partenza = doveSiComincia();
  eroe = entita.aggiungi(giocatore.crea(partenza.px, partenza.py));
  schermo.centraSu(eroe.px, eroe.py);

  casellaScelta = 0;
  cassaAperta = null;
  cassaScelta = 0;
  colpito = null;
  lumi.length = 0;
  minimappa.dimentica();
  minimappa.aggiorna(eroe);

  // Letto prima di azzerarlo: il messaggio che serve è diverso a seconda che
  // ci sia o no qualcosa da andare a riprendere.
  const cera = corpo !== null;
  mortoDi = null;
  corpo = null;
  mappaAperta = false;
  // La mappa non si perde morendo: è quello che ha visto il superstite di
  // prima, ma è anche l'unica cosa che il nuovo ha per ritrovarne il corpo.
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
  // L'autunno è l'unica stagione che annuncia anche la prossima, e non è un
  // vezzo: da questa tappa l'inverno non dà quasi niente, e una scadenza che
  // non si annuncia è una trappola. È la stessa lezione del suggerimento
  // impedito — si dice prima, non dopo aver premuto il tasto.
  autunno: "è arrivato l'autunno: d'inverno la valle dà poco",
  inverno: "è arrivato l'inverno",
  primavera: "è arrivata la primavera",
};

// Restituisce la stagione appena arrivata, o null se non è cambiato niente:
// chi chiama deve poter dire "l'inverno ha preso l'orto" invece di due
// messaggi che si coprono a vicenda.
function vestiLaValle() {
  const acquaCambiata = acqua.aggiorna([...entita.tutte(), ...fauna.tutte(), ...polli.tutte()]);
  if (acquaCambiata.riportati.includes(eroe)) {
    pesca.interrompi();
    annuncia("il disgelo ti riporta a riva", "#8fb8d8");
  }
  const stagione = stagioni.stagioneCorrente();
  if (stagione === stagioneVestita) return null;
  const prima = stagioneVestita;
  stagioneVestita = stagione;
  mappa.impostaTavolozze(tavolozzaDi(stagione), tavolozzaBagnataDi(stagione));
  // Anche le finestre che guardano la valle dall'alto: è la stessa valle, e
  // una valle grigia in mezzo allo schermo e verde nell'angolo in basso a
  // destra si legge come un riquadro dimenticato acceso. Le tinte stanno in
  // un posto solo e le due finestre si ridipingono da sé.
  if (tinte.impostaTavolozza(tavolozzaDi(stagione))) {
    minimappa.ridipingiSeServe(stagione === "inverno");
    mappaGrande.ridipingiSeServe(stagione === "inverno");
  }
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
  pesca.interrompi();
  // L'eroe si rifà invece di essere spostato: un'entità caricata deve tornare
  // allo stato che avrebbe appena creata — niente passo a metà, niente
  // direzione ereditata dalla partita di prima.
  infetti.svuota();
  fiamma.reimposta();
  // E il riparo, per la stessa ragione: la stanza in cui si stava non è quella
  // della partita che si sta aprendo, e tenersela vorrebbe dire un caricamento
  // che per mezzo secondo non gela in mezzo alla neve.
  riparo.reimposta();
  luogoAttuale = null;
  entita.svuota();
  eroe = entita.aggiungi(giocatore.crea(ripreso.eroe.px, ripreso.eroe.py));
  eroe.guarda = ripreso.eroe.guarda ?? "giu";
  schermo.centraSu(eroe.px, eroe.py);

  casellaScelta = ripreso.casella;
  simulazione.resoconto();
  // L'alba di oggi conta come già scritta se è già passata: riprendere non
  // deve sovrascrivere la casella automatica con la partita appena ripresa.
  albaScritta = tempo.oraCorrente() >= tempo.ALBA_PIENA ? ripreso.giorno : ripreso.giorno - 1;
  colpito = null;
  lumi.length = 0;

  // La valle si rimette la stagione giusta senza annunciare un arrivo: non è
  // arrivato niente, si è ripreso da lì.
  // Un salvataggio si scrive da vivi, quindi riprendere significa sempre
  // essere in piedi. Gli infetti se ne sono andati con entita.svuota(): non
  // stanno nel salvataggio, quindi quelli di prima non c'entrano niente con
  // la notte in cui si riprende, e ne arriveranno di nuovi se è buio.
  mortoDi = null;
  corpo = null;
  gelando = null;
  lampoDanno = 0;
  chiasso.reimposta();

  stagioneVestita = null;
  vestiLaValle();
  minimappa.dimentica();
  minimappa.aggiorna(eroe);
  // L'atlante di prima descrive un'altra valle. Si rifà da quello che il
  // salvataggio dice di aver visto: qualche centinaio di settori, sedici
  // valutazioni l'uno, e capita una volta per caricamento.
  mappaGrande.dimentica();
  mappaGrande.aggiorna();

  partitaAperta = false;
  mappaAperta = false;
  // Riprendere dal titolo comincia la partita: da una casella, da un file o
  // dalla rete che sia, e anche quando la risposta arriva dopo.
  if (iniziale !== null) chiudiLIniziale();
}

// Quello che dal titolo non si può fare: non c'è ancora una partita, e le tre
// cose qui sotto la manderebbero da qualche parte. Detto invece di tacere,
// perché un tasto che non risponde sembra un tasto rotto.
function nienteDaMandare() {
  annuncia("prima comincia o carica una partita", "#c9b189");
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
    if (caricaDalTitolo) nienteDaMandare();
    else sovrascriviLaRete();
    return;
  }

  if (!comandi.appenaPremuto("usa")) return;

  if (codice) riprendiDallaRete();
  else if (caricaDalTitolo) nienteDaMandare();
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

// Dal titolo si carica e basta: salvare una partita che non è cominciata
// vorrebbe dire riempire una casella con una valle vuota.
function modiDellaPartita() {
  return caricaDalTitolo ? ["carica", "rete"] : MODI_PARTITA;
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
    const modi = modiDellaPartita();
    const quale = modi.indexOf(modoPartita);
    modoPartita = modi[(quale + passo + modi.length) % modi.length];
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
    if (caricaDalTitolo) nienteDaMandare();
    else esportaSuFile();
    return;
  }
  if (comandi.appenaPremuto("importa")) {
    importaDaFile();
    return;
  }

  if (!comandi.appenaPremuto("usa")) return;
  const voce = voci[slotScelto];
  if (!voce) return;
  if (modoPartita === "salva" && !caricaDalTitolo) salvaIn(voce);
  else caricaDa(voce);
}

// --- le ricette -----------------------------------------------------------

function bancoQui() {
  return mappa.bancoVicino(Math.floor(eroe.px / TASSELLO), Math.floor(eroe.py / TASSELLO));
}

// Un fuoco acceso a due passi: la zuppa si cuoce accanto al fuoco, non
// davanti, come il banco — si gira per l'accampamento con la pentola, non ci
// si inchioda davanti alle braci.
function fuocoQui() {
  return mappa.fuocoVicino(Math.floor(eroe.px / TASSELLO), Math.floor(eroe.py / TASSELLO), 2);
}

// Le frecce e non più i tasti da 1 a 8.
//
// Le cifre sceglievano la ricetta, e con otto ricette il menu era pieno: la
// nona sarebbe stata irraggiungibile. Non era una scelta di misura, era un
// tetto — e toglierlo vuol dire un cursore, che è poi quello che la cassa fa
// già dalla sua schermata. Un pannello, un modo di muoversi dentro.
function leggiLeRicette() {
  const prima = ricettaScelta;
  if (comandi.appenaPremuto("su")) ricettaScelta = Math.max(0, ricettaScelta - 1);
  if (comandi.appenaPremuto("giu")) ricettaScelta = Math.min(RICETTE.length - 1, ricettaScelta + 1);
  if (ricettaScelta !== prima) suono.suona(SCELTA);

  if (!comandi.appenaPremuto("usa")) return;

  const ricetta = RICETTE[ricettaScelta];
  const esito = fai(ricetta, alBanco, alFuoco);
  suono.suona(esito.fatto ? FATTO : NEGATO);
  if (esito.fatto) {
    // Riparando si dice anche quanto regge adesso: una riparazione che non
    // torna al numero di prima va detta, altrimenti sembra un errore del
    // gioco la prima volta che si guarda la barra.
    const quanto = ricetta.ripara ? ` (tiene ${esito.massimo})` : "";
    annuncia(`${ricetta.ripara ? "riparato" : "fatto"}: ${nomeDi(ricetta.produce.cosa)}${quanto}`, "#9ec97e");
  }
  else if (esito.perche === "banco") annuncia("questo vuole un banco da lavoro", "#c9b189");
  else if (esito.perche === "fuoco") annuncia("questo vuole un fuoco acceso vicino", "#c9b189");
  else if (esito.perche === "integro") annuncia("nessun attrezzo da riparare di questo tipo", "#c9b189");
  else if (esito.perche === "consumato") annuncia("troppo consumato: va rifatto", "#c0705f");
  else if (esito.perche === "zaino") annuncia("zaino pieno: getta qualcosa con G", "#c0705f");
  else annuncia("materiali insufficienti", "#c0705f");
}

// --- la cassa -------------------------------------------------------------

function chiudiLaCassa() {
  suono.suona(COPERCHIO, { tono: 1.15 });
  cassaAperta = null;
  cassaScelta = 0;
}

// Il cursore si muove su una griglia di quattro per cinque, e il confine fra
// cassa e zaino non è un salto: è la riga dopo. Due griglie separate avrebbero
// voluto dire un tasto per passare dall'una all'altra, cioè una cosa in più da
// imparare per un gesto che le frecce già sanno fare.
//
// Si ferma ai bordi invece di girare intorno. In un menu di quattro voci
// girare fa comodo; qui, con due parti che hanno significati opposti, uscire
// da sopra e ricomparire nello zaino farebbe spostare la roba dalla parte
// sbagliata.
const COLONNE_CASSA = 4;

function muoviIlCursore() {
  const righe = hud.CASSA_TOTALI / COLONNE_CASSA;
  let riga = Math.floor(cassaScelta / COLONNE_CASSA);
  let colonna = cassaScelta % COLONNE_CASSA;
  const prima = cassaScelta;

  if (comandi.appenaPremuto("sinistra")) colonna = Math.max(0, colonna - 1);
  if (comandi.appenaPremuto("destra")) colonna = Math.min(COLONNE_CASSA - 1, colonna + 1);
  if (comandi.appenaPremuto("su")) riga = Math.max(0, riga - 1);
  if (comandi.appenaPremuto("giu")) riga = Math.min(righe - 1, riga + 1);

  cassaScelta = riga * COLONNE_CASSA + colonna;
  if (cassaScelta !== prima) suono.suona(SCELTA);
}

function leggiLaCassa() {
  // Si chiude con lo stesso tasto che apre le costruzioni. Non è un caso
  // libero: "C" in questo gioco vuol già dire "apri e chiudi il pannello", e
  // dargli anche questo pannello è una regola in meno invece di un tasto in
  // più.
  if (comandi.appenaPremuto("ricette")) {
    chiudiLaCassa();
    return;
  }

  const { tx, ty } = cassaAperta;
  // La cassa può sparire da sotto i piedi in un modo solo — si muore con la
  // schermata aperta — ma basta quello per doverlo chiedere.
  if (!contenitori.esiste(tx, ty)) {
    cassaAperta = null;
    return;
  }

  muoviIlCursore();

  if (comandi.appenaPremuto("spegni")) {
    const esito = azioni.smonta(tx, ty);
    if (esito?.tipo === "smontata") {
      suono.suona(COPERCHIO, { tono: 0.85 });
      cassaAperta = null;
      cassaScelta = 0;
      annuncia("cassa smontata", "#9ec97e");
    } else if (esito?.tipo === "nonEVuota") {
      suono.suona(NEGATO);
      annuncia("prima svuotala", "#c9b189");
    } else if (esito?.tipo === "zainoPieno") {
      suono.suona(NEGATO);
      annuncia("zaino pieno: getta qualcosa con G", "#c0705f");
    }
    return;
  }

  if (!comandi.appenaPremuto("usa")) return;

  const versoLaCassa = cassaScelta >= contenitori.CASELLE;
  const indice = versoLaCassa ? cassaScelta - contenitori.CASELLE : cassaScelta;
  const esito = contenitori.sposta(tx, ty, versoLaCassa, indice);
  if (!esito) return;
  if (esito.tipo === "vivo") {
    suono.suona(NEGATO);
    annuncia("un pollo vivo non sta in una cassa", "#c0705f");
    return;
  }
  if (esito.tipo === "pieno") {
    suono.suona(NEGATO);
    annuncia(versoLaCassa ? "la cassa è piena" : "zaino pieno", "#c0705f");
    return;
  }
  suono.suona(versoLaCassa ? POSA : PRESO);
}

// --- la schermata iniziale -------------------------------------------------

// Le voci del titolo, nell'ordine in cui si leggono.
const VOCI_TITOLO = ["nuova", "carica"];

// Su e giù scelgono, la barra o invio confermano, Esc torna indietro. È lo
// stesso modo di muoversi del pannello delle ricette: un menu solo da
// imparare.
function scorri(quante) {
  const prima = rigaIniziale;
  if (comandi.appenaPremuto("su")) rigaIniziale = Math.max(0, rigaIniziale - 1);
  if (comandi.appenaPremuto("giu")) rigaIniziale = Math.min(quante - 1, rigaIniziale + 1);
  if (rigaIniziale !== prima) suono.suona(SCELTA);
  return rigaIniziale !== prima;
}

// Il giorno dell'anno di una stagione e di un giorno dentro di essa: l'estate
// comincia il giorno uno, e ogni stagione dura GIORNI_PER_STAGIONE giorni.
function giornoDellAnno(stagione, giorno) {
  return stagione * stagioni.GIORNI_PER_STAGIONE + giorno + 1;
}

function leggiLIniziale() {
  // Il pannello delle partite aperto dal titolo si chiude come si chiude
  // sempre, con P, oppure con Esc; e chiuso si torna al titolo.
  if (partitaAperta) {
    if (!comandi.stoScrivendo() && scrittaInCorso === null
      && (comandi.appenaPremuto("partita") || comandi.appenaPremuto("indietro"))) {
      partitaAperta = false;
      caricaDalTitolo = false;
      return;
    }
    leggiPartita();
    return;
  }

  if (iniziale === "titolo") {
    scorri(VOCI_TITOLO.length);
    if (!comandi.appenaPremuto("usa")) return;
    suono.sblocca();
    if (VOCI_TITOLO[rigaIniziale] === "carica") {
      partitaAperta = true;
      caricaDalTitolo = true;
      modoPartita = "carica";
      slotScelto = 0;
      return;
    }
    // Si parte dalla stagione in cui la valle è adesso — l'estate, o quella
    // chiesta con "?giorno=" nell'indirizzo — così chi preme la barra due
    // volte di fila comincia da dove avrebbe cominciato comunque.
    iniziale = "stagione";
    rigaIniziale = stagioni.STAGIONI.indexOf(stagioni.stagioneCorrente());
    return;
  }

  if (iniziale === "stagione") {
    if (comandi.appenaPremuto("indietro")) {
      iniziale = "titolo";
      rigaIniziale = 0;
      return;
    }
    if (scorri(stagioni.STAGIONI.length)) provaIlGiorno(giornoDellAnno(rigaIniziale, 0));
    if (!comandi.appenaPremuto("usa")) return;
    stagioneIniziale = rigaIniziale;
    iniziale = "giorno";
    rigaIniziale = stagioni.stagioneCorrente() === stagioni.STAGIONI[stagioneIniziale]
      ? stagioni.giornoNellaStagione() - 1
      : 0;
    provaIlGiorno(giornoDellAnno(stagioneIniziale, rigaIniziale));
    return;
  }

  // Il giorno dentro la stagione scelta.
  if (comandi.appenaPremuto("indietro")) {
    iniziale = "stagione";
    rigaIniziale = stagioneIniziale;
    return;
  }
  if (scorri(stagioni.GIORNI_PER_STAGIONE)) provaIlGiorno(giornoDellAnno(stagioneIniziale, rigaIniziale));
  if (comandi.appenaPremuto("usa")) avviaNuovaPartita(giornoDellAnno(stagioneIniziale, rigaIniziale));
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

  // La schermata iniziale prende tutti i comandi: nessuno dei suoi tasti deve
  // valere anche come gesto nel mondo, altrimenti la barra che conferma
  // "avvia" darebbe anche una zappata a caso.
  if (iniziale !== null) {
    leggiLIniziale();
    return;
  }

  // La cassa prende tutti i comandi finché è aperta, e sta prima della
  // partita per questo: modale vuol dire modale, e aprire il salvataggio sopra
  // una cassa sarebbe due schermate una sull'altra.
  if (cassaAperta) {
    leggiLaCassa();
    return;
  }

  // Le ricette, come la cassa, prendono tutti i comandi finché sono aperte.
  // Da quando si scelgono con le frecce non potrebbe essere altrimenti: le
  // frecce sono anche il camminare, e un pannello che lascia passare il
  // movimento è un pannello che fa camminare mentre si sceglie.
  if (comandi.appenaPremuto("ricette")) {
    ricetteAperte = !ricetteAperte;
    ricettaScelta = 0;
    if (ricetteAperte) { alBanco = bancoQui(); alFuoco = fuocoQui(); }
    return;
  }

  if (ricetteAperte) {
    leggiLeRicette();
    return;
  }

  // La schermata della partita prende tutti i comandi finché è aperta. Un
  // tasto che vale in due posti alla volta è un tasto che salva quando volevi
  // camminare.
  if (comandi.appenaPremuto("partita")) {
    partitaAperta = !partitaAperta;
    slotScelto = 0;
    ricetteAperte = false;
    mappaAperta = false;
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
      suono.suona(SCELTA);
      casellaScelta = i;
    }
  }

  if (comandi.appenaPremuto("minimappa")) minimappaVisibile = !minimappaVisibile;

  // Il volume gira fra muto, piano e forte. Si dice a schermo perché muto e
  // piano, con niente che stia suonando in quel momento, sono indistinguibili
  // — e un tasto che sembra non fare niente si preme due volte.
  if (comandi.appenaPremuto("suono")) {
    const adesso = suono.cambiaLivello();
    suono.suona(SCELTA);
    annuncia(`suono: ${adesso}`, "#8fa8d8");
  }

  if (comandi.appenaPremuto("mappa")) {
    mappaAperta = !mappaAperta;
    ricetteAperte = false;
    return;
  }
  // Aperta, si prende tutti i tasti: non c'è niente da fare guardando una
  // mappa, e lasciar passare la barra vorrebbe dire dare una zappata al buio.
  if (mappaAperta) return;

  if (comandi.appenaPremuto("consuma")) {
    // A mani vuote "E" spoglia. È il solo significato che quel tasto non
    // aveva ancora, e non ne serve uno nuovo da imparare: quello che hai
    // addosso non sta in nessuna casella, quindi non c'è modo di puntarlo.
    const esito = cosaInMano() ? azioni.consuma(cosaInMano(), casellaScelta) : azioni.spogliati();
    if (esito?.tipo === "consumato") {
      // Bere e mangiare sono lo stesso tasto ma non lo stesso gesto, e a
      // deciderlo è cosa è stato ristorato invece di un elenco di cose da
      // bere da tenere aggiornato altrove.
      const beve = (esito.ristorato?.sete ?? 0) > 0;
      suono.suona(beve ? SORSO : MANGIA);
      annuncia(beve ? "bevi" : `mangi: ${nomeDi(esito.cosa)}`, beve ? "#8fb8d8" : "#9ec97e");
    }
    else if (esito?.tipo === "medicato") {
      suono.suona(BENDA);
      annuncia(esito.curata ? "fasciato: l'infezione è passata" : "ti sei fasciato", "#9ec97e");
    } else if (esito?.tipo === "indossato") {
      suono.suona(POSA);
      annuncia(esito.tolto ? `hai cambiato: ${nomeDi(esito.cosa)}` : `indossi: ${nomeDi(esito.cosa)}`, "#9ec97e");
    } else if (esito?.tipo === "tolto") {
      suono.suona(POSA);
      annuncia(`ti sei tolto: ${nomeDi(esito.cosa)}`, "#c9b189");
    } else if (esito?.tipo === "zainoPieno") {
      suono.suona(NEGATO);
      annuncia("zaino pieno: getta qualcosa con G", "#c0705f");
    } else if (esito?.tipo === "nonServe") {
      suono.suona(NEGATO);
      annuncia("non ne hai bisogno adesso", "#c9b189");
    }
  }

  if (comandi.appenaPremuto("getta")) {
    const esito = azioni.getta(eroe, casellaScelta);
    if (esito?.tipo === "gettato") {
      suono.suona(POSA);
      annuncia(`posato per terra: ${esito.quante} ${nomeDi(esito.cosa)}`, "#c9b189");
    } else if (esito?.tipo === "polloLiberato") {
      suono.suona(POSA);
      annuncia(esito.nelRecinto ? "il pollo è nel recinto" : "il pollo scappa", esito.nelRecinto ? "#9ec97e" : "#c9b189");
    } else if (esito?.tipo === "nonCePosto") {
      suono.suona(NEGATO);
      annuncia("davanti non c'è posto", "#c0705f");
    }
  }

  // X smonta quello che hai davanti e che hai costruito tu; Spazio lo usa. È
  // un tasto solo per una regola sola, e il promemoria accanto allo zaino dice
  // di volta in volta cosa toglierebbe.
  if (comandi.appenaPremuto("spegni")) {
    const esito = azioni.smontaDavanti(eroe);
    if (esito?.tipo === "smontato") {
      suono.suona(POSA, { tono: esito.cosa === "porta" ? 0.85 : 1 });
      // "Smontato: cassa" e non "cassa smontata": è la stessa forma di
      // "posato:" e di "fatto:", e per di più non deve accordarsi con niente —
      // una porta smontato sarebbe italiano sbagliato scritto dal gioco.
      annuncia(esito.frase ?? `${esito.detto}: ${nomeDi(esito.cosa)}`, "#9ec97e");
    } else if (esito?.tipo === "impedito") {
      suono.suona(NEGATO);
      annuncia(esito.messaggio, "#c0705f");
    }
  }

  if (!comandi.appenaPremuto("usa")) return;

  const esito = azioni.agisci(eroe, cosaInMano(), casellaScelta);
  if (!esito) return;

  if (esito.tipo === "colpo" || esito.tipo === "raccolto") {
    const finale = esito.tipo === "raccolto";
    // Qui c'era il debito più vecchio del gioco: tremolio e scheggie erano un
    // ripiego dichiarato, e quello che mancava al gesto era il suono. La frase
    // scritta allora diceva già cosa serviva — un tonfo sordo per il legno,
    // uno schiocco secco per la pietra — ed è quella che arte/voci.js ha messo
    // in numeri.
    //
    // L'altezza cambia di poco da un tassello all'altro, e non a caso:
    // l'impronta delle coordinate è la stessa funzione da cui nasce tutta la
    // valle (vedi motore/casuale.js). Lo stesso albero suona sempre uguale,
    // due alberi vicini no, e Math.random non compare nemmeno qui.
    const tono = 0.9 + impronta(esito.tx, esito.ty, 0x5c01f0) * 0.22;
    suono.suona(colpoDi(esito.voce, finale), { tono });
    colpito = { tx: esito.tx, ty: esito.ty, resta: DURATA_TREMOLIO };
    // Spaccare si sente da mezzo schermo. È il gesto che il giocatore fa più
    // spesso senza pensarci, ed è qui che di notte smette di essere gratis.
    chiasso.colpo();
    if (esito.scheggie) {
      // Il colpo che stacca ne sparge di più e più lontano: è la differenza
      // fra "l'hai preso" e "è venuto giù". Adesso la stessa differenza la
      // dice anche la voce, che per l'ultimo colpo è più grave e più lunga.
      scheggie.sparge(
        esito.tx * TASSELLO + TASSELLO / 2,
        esito.ty * TASSELLO + TASSELLO / 2,
        finale ? 26 : 12,
        esito.scheggie,
        finale ? 1.5 : 1
      );
    }
  }

  // A ogni gesto la sua voce. Il messaggio dice cosa è successo, il suono dice
  // che è successo: il primo si legge, il secondo si sente senza guardare — ed
  // è la differenza fra zappare guardando i piedi e zappare guardando il buio
  // attorno, che di notte è quello che si vorrebbe fare.
  if (esito.tipo === "pesca") { suono.suona(ACQUA); annuncia("lenza in acqua: resta fermo", "#8fb8d8"); }
  if (esito.tipo === "pescaInterrotta") annuncia("lenza ritirata", "#c9b189");
  if (esito.tipo === "bevi") { suono.suona(SORSO); annuncia("bevi", "#8fb8d8"); }
  if (esito.tipo === "riempi") { suono.suona(ACQUA); annuncia(`riempiti ${esito.quanti} secchi`, "#8fb8d8"); }
  if (esito.tipo === "zappa") { suono.suona(ZAPPA); annuncia("terra zappata", "#9ec97e"); }
  if (esito.tipo === "semina") { suono.suona(SEMINA); annuncia("seminato", "#9ec97e"); }
  if (esito.tipo === "innaffia") { suono.suona(ACQUA); annuncia("innaffiato", "#8fb8d8"); }
  if (esito.tipo === "interra") { suono.suona(ZAPPA); annuncia("interrata: la terra è più grassa", "#9ec97e"); }
  if (esito.tipo === "spargi") { suono.suona(SEMINA); annuncia(`${esito.cosa ?? "cenere"} sparsa: la terra è più grassa`, "#9ec97e"); }
  if (esito.tipo === "cenere") { suono.suona(PRESO); annuncia(`+${esito.quante} cenere`, "#c9b189"); }
  // Dormire non ha voce, ed è l'unico gesto che non ne ha: fra il tasto e il
  // risveglio passano ore di gioco, e un suono attaccato a quel momento
  // racconterebbe il tasto invece della notte.
  if (esito.tipo === "dormi" && esito.sveglio) {
    avvisoRisveglio = esito.messaggio ?? `dormito ${(esito.secondi / riposo.ORA).toFixed(1)} ore: +${Math.round(esito.recuperata * 100)}% stamina`;
  }

  // Il focolare che si carica è una cosa che si sente: è il gesto per cui si
  // torna a casa, e senza una riga sarebbe l'unica azione muta del gioco.
  //
  // La prima legna accende, le altre tre allungano, e il messaggio è lo stesso
  // per tutte e quattro: quello che conta saperlo è quanto ne ha dentro adesso.
  if (esito.tipo === "carica") {
    suono.suona(FATTO);
    annuncia(`${esito.fuoco}: ${esito.legna}/${esito.massimo} legna`, "#e0913a");
  }
  // Guardare è l'unica azione che non cambia niente, e serve a questo: la
  // fiamma è uguale con una legna e con quattro, quindi il conto va chiesto.
  // I polli e il pollaio (M7.18.18).
  if (esito.tipo === "polloPreso") {
    suono.suona(PRESO);
    annuncia(`preso: ${esito.gallo ? "un gallo" : "un pollo"} vivo regge una notte nello zaino`, "#9ec97e");
  }
  if (esito.tipo === "uovaPrese") {
    suono.suona(PRESO);
    annuncia(`+${esito.quante} ${esito.quante === 1 ? "uovo" : "uova"}`, "#9ec97e");
  }
  if (esito.tipo === "pollinaPresa") {
    suono.suona(PRESO);
    annuncia(`+${esito.quante} pollina: spargila sull'orto`, "#9ec97e");
  }
  if (esito.tipo === "zainoPieno") {
    suono.suona(NEGATO);
    annuncia("zaino pieno: getta qualcosa con G", "#c0705f");
  }
  if (esito.tipo === "polloUcciso") {
    suono.suona(PRESO);
    annuncia(esito.nelloZaino ? "+1 carne cruda" : "zaino pieno: la carne è persa", esito.nelloZaino ? "#9ec97e" : "#c0705f");
  }
  if (esito.tipo === "polloLiberato") {
    suono.suona(POSA);
    const chi = esito.gallo ? "il gallo" : "il pollo";
    annuncia(esito.nelRecinto ? `${chi} è nel recinto` : `${chi} scappa`, esito.nelRecinto ? "#9ec97e" : "#c9b189");
  }
  if (esito.tipo === "nutrito") {
    suono.suona(POSA);
    annuncia(`pollaio: ${esito.mangime}/${esito.massimo} mangime`, "#9ec97e");
  }
  if (esito.tipo === "pollaioGuardato") {
    suono.suona(SCELTA);
    const quanti = esito.polli === 1 ? "1 pollo" : `${esito.polli} polli`;
    const pollina = esito.pollina > 0 ? `, ${esito.pollina} pollina` : "";
    annuncia(`pollaio: ${esito.mangime}/${esito.massimo} mangime, ${quanti}${pollina}`, esito.mangime > 0 ? "#c9b189" : "#c0705f");
  }
  if (esito.tipo === "guardato") {
    suono.suona(SCELTA);
    annuncia(esito.legna > 0
      ? `${esito.fuoco}: ${esito.legna}/${esito.massimo} legna`
      : `${esito.fuoco} spento: caricalo con la legna`, esito.legna > 0 ? "#e0913a" : "#c9b189");
  }
  // I due gesti dell'essiccatoio. Il secondo dice quante carni secche sono
  // uscite, perché è il numero che si stava aspettando per tre giorni.
  // Le parole al plurale arrivano da azioni.js insieme al gesto: "3 carni" e
  // "3 pesci" non si costruiscono da un identificatore senza scrivere prima o
  // poi "3 pesci secche".
  // Quanti ne ha appesi in tutto e non solo quanti ne sono entrati adesso: il
  // telaio si carica a file, e quello che si vuole sapere dopo il gesto è a
  // che punto è il telaio.
  if (esito.tipo === "stendi") { suono.suona(FATTO); annuncia(`a seccare: ${esito.appesi} ${esito.tanti}`, "#c9b189"); }
  if (esito.tipo === "ritira") { suono.suona(FATTO); annuncia(`ritirato: ${esito.dette}`, "#c9b189"); }
  if (esito.tipo === "cotto") { suono.suona(FATTO); annuncia(`sul fuoco: ${nomeDi(esito.diventa)}`, "#e0913a"); }

  if (esito.tipo === "porta") {
    // La stessa voce del coperchio, più grave: è un'anta di legno che gira,
    // ed è parente di una cassa che si apre più di quanto sia parente di
    // qualunque altro rumore che il gioco sappia già fare.
    suono.suona(COPERCHIO, { tono: esito.aperta ? 0.7 : 0.6 });
  }

  if (esito.tipo === "aperta") {
    suono.suona(COPERCHIO);
    cassaAperta = { tx: esito.tx, ty: esito.ty };
    cassaScelta = 0;
  }

  if (esito.tipo === "combattuto") {
    // Il sangue esce sempre, e in quantità diversa: un colpo che va a segno e
    // uno che finisce il lavoro non devono sembrare lo stesso gesto. È la
    // stessa regola delle scheggie sugli alberi.
    scheggie.sparge(esito.px, esito.py - 10, esito.caduto ? 24 : 9, ["A", "A", "n"], esito.caduto ? 1.5 : 0.9);
    suono.suona(COLPO_A_SEGNO);
    if (esito.caduto) {
      suono.suona(CADUTO);
      annuncia(esito.specie ? "animale abbattuto: macella con l'ascia" : "è caduto", "#9ec97e");
    }
  }

  if (esito.tipo === "frugato") {
    if (esito.presi.length === 0) annuncia("non aveva niente addosso", "#c9b189");
    else {
      suono.suona(PRESO);
      const elenco = esito.presi.map((v) => `+${v.quante} ${nomeDi(v.cosa)}`).join("  ");
      annuncia(esito.resta > 0 ? `${elenco}, il resto è ancora lì` : elenco, "#9ec97e");
    }
  }

  if (esito.tipo === "preso") {
    suono.suona(PRESO);
    const quanto = `+${esito.quante} ${nomeDi(esito.cosa)}`;
    annuncia(esito.resta > 0 ? `${quanto}, ne restano ${esito.resta}` : quanto, "#9ec97e");
  } else if (esito.tipo === "zainoPieno") {
    suono.suona(NEGATO);
    annuncia("zaino pieno: getta qualcosa con G", "#c0705f");
  } else if (esito.tipo === "raccolto") {
    const elenco = esito.ottenuto.map((v) => `+${v.quante} ${nomeDi(v.cosa)}`).join("  ");
    if (esito.perse.length > 0) annuncia("zaino pieno, perso qualcosa", "#c0705f");
    else if (esito.avanzate.length > 0) annuncia("zaino pieno: il resto è per terra", "#c9b189");
    else if (elenco) annuncia(elenco, "#9ec97e");
  } else if (esito.tipo === "posa" || esito.tipo === "pavimenta") {
    suono.suona(POSA);
    annuncia(`posato: ${nomeDi(esito.cosa)}`, "#9ec97e");
  }
  if (esito.tipo === "macellazione") {
    suono.suona(COLPO_A_SEGNO); annuncia("macellazione: ancora " + esito.restano + " colpi", "#c9b189");
    chiasso.colpo();
  }
  if (esito.tipo === "macellato") {
    suono.suona(PRESO);
    const elenco = esito.presi.map(v => "+" + v.quante + " " + nomeDi(v.cosa)).join("  ");
    annuncia(elenco + (esito.resta ? " - il resto e sulla carcassa" : ""), "#9ec97e");
    if (esito.lavorato) chiasso.colpo();
  }
  avvisaUsura(esito.usura);
}

function avvisaUsura(usura) {
  if (!usura) return;
  // Il messaggio dice cosa è successo, il suono dice che è successo: è la
  // regola di tutto il gioco, e qui conta il doppio — un attrezzo si rompe nel
  // mezzo di un gesto, cioè mentre si sta guardando altro.
  if (usura.rotto) suono.suona(ROTTURA);
  annuncia(
    usura.rotto
      ? `${nomeDi(usura.cosa)}: rotto, vale come le mani nude`
      : `${nomeDi(usura.cosa)}: quasi rotto, ripara al banco`,
    "#c0705f"
  );
}

// --- ciclo ----------------------------------------------------------------

function completaSvenimento() {
  const rimasto = riposo.secondiDiSonno();
  if (rimasto <= 0 || salute.eMorto()) return false;
  pesca.interrompi();
  simulazione.avanza(rimasto, { eroe, alFreddo: () => freddo.tipo(eroe) });
  return true;
}

function aggiorna(passo) {
  let haDormito = false;
  const staminaIniziale = bisogni.livello("stanchezza");
  if (mondoFermo()) pesca.interrompi();
  // Il tempo non scorre mentre si sceglie cosa costruire: un menu che ti fa
  // arrivare la notte addosso mentre lo leggi è una punizione, non una sfida.
  if (!mondoFermo()) {
    haDormito = completaSvenimento();

    // Quello che si ha in mano lo decide lo zaino, non l'entità: le entità
    // stanno sotto le regole e non devono sapere cos'è un inventario. Lo
    // stesso vale per la forma fisica: quanto si è in forze è una regola.
    eroe.impugnato = CATALOGO[cosaInMano()]?.impugnato ?? null;
    eroe.fattoreVelocita = bisogni.fattoreVelocita() * meteo.fattoreVelocita(eroe);
    eroe.puoCorrere = bisogni.puoCorrere();
    for (const e of entita.tutte()) if (e.tipo === "infetto") e.fattoreMeteo = meteo.fattoreVelocita(e);
    entita.aggiorna(passo);

    // Il riparo prima del freddo, perché il freddo lo interroga: al chiuso il
    // calore resta dentro. Chiudere l'ultimo varco non si vede, quindi lo dice
    // il gioco — è la stessa ragione per cui dice "stai gelando" invece di
    // lasciarlo scoprire dalla barra della salute.
    const riparoCambiato = riparo.aggiorna(
      passo,
      Math.floor(eroe.px / TASSELLO),
      Math.floor(eroe.py / TASSELLO)
    );
    if (riparoCambiato.cambiato) {
      annuncia(riparo.alChiuso() ? "sei al chiuso" : "sei allo scoperto", "#c9b189");
    }

    for (const fine of fiamma.avanza(passo, cosaInMano(), casellaScelta)) {
      suono.suona(POSA);
      annuncia(fine.ancora ? `${nomeDi(fine.cosa)} consumata: ne accendi un'altra`
        : `${nomeDi(fine.cosa)} si è spenta`, "#c9b189");
    }

    const primaGelava = gelando;
    const primaVuoti = new Set(bisogni.vuoti());
    simulazione.avanza(passo, {
      eroe,
      corre: eroe.correndo, siMuove: eroe.inMovimento,
      alFreddo: () => freddo.tipo(eroe),
    });
    haDormito = completaSvenimento() || haDormito;
    for (const vuoto of bisogni.vuoti()) {
      if (vuoto !== "stanchezza" && !primaVuoti.has(vuoto)) annuncia(AVVISI_BISOGNI[vuoto], "#c0705f");
    }
    gelando = freddo.tipo(eroe);
    if (gelando && gelando !== primaGelava) {
      suono.suona(GELO);
      // "Una fiamma" era vero finché bastava la torcia. Adesso scaldano solo
      // il fuoco per terra e la stanza con un focolare, e un messaggio che
      // dice una cosa che non funziona più è peggio di nessun messaggio.
      //
      // E i due freddi si dicono diversi, perché si risolvono diversi: dal
      // gelo ci si ripara col fuoco, dal bagnato ci si asciuga — che è sempre
      // un fuoco, ma prima bisogna smettere di prendere acqua.
      annuncia(
        gelando === "bagnato" ? "sei fradicio: asciugati" : "stai gelando: serve un fuoco",
        "#8fa8d8"
      );
    }

    // Il chiasso dopo il movimento, perché dipende da come ci si è appena
    // mossi; le decisioni degli infetti dopo il chiasso, perché lo ascoltano.
    // Il morso invece si raccoglie dopo che si sono mossi loro: è l'unico
    // momento in cui si sa se il braccio è arrivato.
    chiasso.avanza(passo, { corre: eroe.correndo, siMuove: eroe.inMovimento });
    const visto = infetti.decidi(passo, eroe, {
      luceInMano: Boolean(CATALOGO[cosaInMano()]?.luce),
    });
    const selvatici = fauna.aggiorna(passo, eroe);
    if (selvatici.allerta) annuncia(selvatici.allerta, "#c9b189");
    if (selvatici.attacchi > 0) { lampoDanno = DURATA_LAMPO; suono.suona(MORSO); }
    infetti.sgomitano();
    // Anche le bestie, e dopo di loro: si sono mosse tutte, adesso si guarda
    // chi è finito dentro chi.
    fauna.sgomitano(eroe);
    polli.aggiorna(passo, eroe);
    const morsi = infetti.raccogliIMorsi(eroe);
    if (morsi.morsi > 0) {
      lampoDanno = DURATA_LAMPO;
      suono.suona(MORSO);
    }
    // Quello che non arriva addosso a te arriva addosso a quello che hai messo
    // in mezzo. Si raccoglie qui, accanto ai morsi, perché è la stessa cosa:
    // un braccio che ha trovato qualcosa.
    for (const colpo of infetti.raccogliGliSfondamenti()) {
      const tono = 0.9 + impronta(colpo.tx, colpo.ty, 0x5c01f0) * 0.22;
      suono.suona(colpoDi("pietra", colpo.ceduto), { tono });
      colpito = { tx: colpo.tx, ty: colpo.ty, resta: DURATA_TREMOLIO };
      scheggie.sparge(
        colpo.tx * TASSELLO + TASSELLO / 2,
        colpo.ty * TASSELLO + TASSELLO / 2,
        colpo.ceduto ? 26 : 12,
        colpo.scheggie,
        colpo.ceduto ? 1.5 : 1
      );
      if (colpo.ceduto) annuncia("hanno sfondato", "#c0705f");
    }

    if (morsi.infettato) annuncia("la ferita è sporca", "#9d7fb0");
    else if (visto.appenaVisto && morsi.morsi === 0) annuncia("qualcosa ti ha visto", "#c0705f");

    // L'udito dopo che tutti si sono mossi, perché quello che si sente dipende
    // da dove sono adesso. È l'altra metà di chiasso.js — quello misura quanto
    // lontano ti si sente, questo cosa ti arriva — e sta qui, dentro il giro
    // del mondo fermo, per una ragione che conta: il tempo saltato (una scheda
    // in secondo piano, una notte dormita) non passa da qui, quindi tornare
    // dopo mezz'ora non spara mezz'ora di passi in un fotogramma.
    const pescato = pesca.aggiorna(passo, eroe, cosaInMano(), casellaScelta);
    if (pescato?.tipo === "pescato") { suono.suona(FATTO); annuncia("preso un pesce: arrostiscilo al fuoco", "#9ec97e"); }
    if (pescato?.usura) avvisaUsura(pescato.usura);
    if (pescato?.tipo === "pescaInterrotta") annuncia(pescato.motivo, "#c9b189");
    udito.avanza(passo, eroe);

    scheggie.aggiorna(passo);
    // Si tiene aggiornata anche da spenta: scorrerla costa due centesimi di
    // millisecondo, ricostruirla da zero quasi trenta. Meglio pagare sempre
    // il poco che pagare il molto ogni volta che la si riaccende.
    minimappa.aggiorna(eroe);

    // Dove si è passati resta segnato. Il disegno del settore nuovo si fa
    // subito, nel fotogramma in cui lo si scopre — sedici valutazioni di
    // rumore — così premere TAB non calcola niente.
    const scoperti = esplorato.segna(eroe);
    if (scoperti.length > 0) mappaGrande.aggiungi(scoperti);
    const luogo = mappa.luogoIn(Math.floor(eroe.px / TASSELLO), Math.floor(eroe.py / TASSELLO), 3);
    const chiaveLuogo = luogo ? `${luogo.tx0},${luogo.ty0}` : null;
    if (chiaveLuogo && chiaveLuogo !== luogoAttuale) annuncia(luogo.nome, "#c9b189");
    luogoAttuale = chiaveLuogo;

    if (colpito) {
      colpito.resta -= passo;
      if (colpito.resta <= 0) colpito = null;
    }
    if (lampoDanno > 0) lampoDanno -= passo;
  }

  // Un controllo solo, e fuori dal giro del mondo. La salute può arrivare a
  // zero in tre modi — un passo di gioco, una notte dormita, un'assenza — e
  // ognuno dei tre sta in un posto diverso: chiedere qui "sei morto?" invece
  // di far rispondere a ognuno era l'unico modo di non lasciarne fuori uno.
  // Il terzo, il sonno, era già sfuggito una volta scrivendolo.
  if (salute.eMorto() && mortoDi === null) muori(salute.causaDellaMorte());

  if (!haDormito) leggiComandi();
  azioneCorrente = mondoFermo() ? null : azioni.azionePossibile(eroe, cosaInMano(), casellaScelta);
  // Quello che farebbe la X, chiesto dove si chiede quello che farebbe la
  // barra: sono due tasti che guardano lo stesso tassello, e tenerli in due
  // momenti diversi del fotogramma vorrebbe dire due risposte diverse.
  smontaggioCorrente = mondoFermo() ? null : azioni.smontaggioPossibile(eroe);

  if (messaggio) {
    messaggio.vita -= passo / 2.2;
    if (messaggio.vita <= 0) messaggio = null;
  }

  const { uovaDeposte, pulciniNati, pulciniCresciuti, polliNelloZaino, polloDomani, polliScappati, polliAffamati, polliDiFame, polliDiFreddo,
    cresciute, appassite, seccate, alBuio, alChiuso, assetate, aSeme, mangiate, spentiLegna, spentiPioggia, torceFinite, guaste, inScadenza, tornati, risvegliForzati } = simulazione.resoconto();

  const arrivata = vestiLaValle();

  // Un messaggio solo: durano un paio di secondi, e tre in fila vorrebbero
  // dire vederne uno — l'ultimo, che non è detto sia il più importante.
  // L'ordine è quello di gravità, e la stagione che si porta via il campo si
  // dice in una frase sola invece che in due che si coprono.
  // I polli per primi: un animale morto è la notizia più grave del mattino, e
  // ognuna ha il suo rimedio — il pollaio, il mangime, il recinto.
  if (polliDiFreddo > 0) annuncia(`il freddo si è portato via dei polli: ${polliDiFreddo}`, "#c0705f");
  else if (polliDiFame > 0) annuncia(`dei polli sono morti di fame: ${polliDiFame}`, "#c0705f");
  else if (polliNelloZaino > 0) annuncia("il pollo nello zaino è morto", "#c0705f");
  else if (polliScappati > 0) annuncia(`dei polli sono scappati: ${polliScappati}`, "#c0705f");
  else if (appassite > 0 && arrivata) annuncia(`${arrivata}: l'orto è morto`, "#c0705f");
  // La sete prima del marcire: è l'unica delle due che si poteva evitare
  // stamattina con un secchio, e sapere quale delle due è stata insegna cosa
  // fare domani.
  else if (seccate > 0) annuncia(`l'orto è seccato: ${seccate}`, "#c0705f");
  // Il buio accanto alla sete: si poteva evitare anche questo, e il rimedio —
  // un muro smontato — è la notizia. Prima quello morto, poi l'avviso a chi
  // ha ancora un giorno.
  else if (alBuio > 0) annuncia(`al chiuso l'orto è morto: ${alBuio}`, "#c0705f");
  else if (alChiuso > 0) annuncia(`al chiuso l'orto non cresce: ${alChiuso}`, "#c9b189");
  // Le bestie dopo la sete e prima del marcire, per la stessa ragione: si
  // poteva evitare, e sapere come — uno spaventapasseri — è la notizia.
  else if (mangiate > 0) annuncia(`le bestie hanno mangiato l'orto: ${mangiate}`, "#c0705f");
  else if (appassite > 0) annuncia(`l'orto è marcito: ${appassite}`, "#c0705f");
  else if (arrivata) annuncia(ARRIVO[arrivata], "#c9b189");
  // Il cibo guasto viene prima del fuoco spento, e non è un ordine a caso: un
  // fuoco che si spegne si riaccende, del cibo andato non torna niente. Fra
  // due notizie che si coprono a vicenda vince quella su cui non si può più
  // fare nulla.
  else if (guaste > 0) annuncia(`si è guastato del cibo: ${guaste}`, "#c0705f");
  // Il fuoco spento si dice con la sua causa, perché ognuna ha il suo rimedio:
  // la legna si porta, dalla pioggia ci si ripara, la torcia si rifà. Detto
  // con la stessa frase, un focolare rimasto senza legna la mezzanotte in cui
  // comincia a piovere sembrava spento dall'acqua anche fra quattro mura.
  //
  // La legna prima della pioggia: è il fuoco di casa, quello a cui si torna,
  // e se succedono tutte e due nella stessa notte è la notizia che serve.
  else if (spentiLegna > 0) annuncia("il fuoco ha finito la legna", "#c0705f");
  else if (spentiPioggia > 0) annuncia("la pioggia ha spento il fuoco", "#c0705f");
  else if (torceFinite > 0) annuncia("la torcia si è consumata", "#c0705f");
  // L'avviso prima del fatto, e dopo tutte le notizie di cose già successe:
  // è l'unico messaggio del giorno che parla di domani, e chi ha appena perso
  // un campo non ha bisogno di sapere anche che le bacche sono vecchie.
  //
  // Le piante assetate vengono prima del cibo in scadenza: tutte e due
  // parlano di domani, ma il cibo si mangia oggi e la pianta no — senza un
  // secchio stanotte è morta.
  // Gli avvisi dei polli: parlano di stanotte, come la sete.
  else if (polliAffamati > 0) annuncia(`i polli hanno fame: ${polliAffamati}`, "#c9b189");
  else if (polloDomani > 0) annuncia("il pollo nello zaino non passa un'altra notte", "#c9b189");
  else if (assetate > 0) annuncia(`l'orto ha sete: ${assetate}`, "#c9b189");
  else if (inScadenza > 0) annuncia("del cibo sta per guastarsi", "#c9b189");
  else if (aSeme > 0) annuncia(`l'orto è andato a seme: ${aSeme}`, "#c9b189");
  else if (cresciute > 0) annuncia("l'orto è cresciuto", "#9ec97e");
  // Le buone notizie del pollaio, dopo quelle dell'orto.
  else if (pulciniNati > 0) annuncia(pulciniNati === 1 ? "è nato un pulcino" : `sono nati dei pulcini: ${pulciniNati}`, "#9ec97e");
  else if (pulciniCresciuti.length > 0) annuncia(`un pulcino è cresciuto: ${pulciniCresciuti[0]}`, "#9ec97e");
  else if (uovaDeposte > 0) annuncia(`nel pollaio ci sono uova: +${uovaDeposte}`, "#9ec97e");
  // Ultima di tutte, perché è l'unica buona notizia che non riguarda una cosa
  // che il giocatore ha fatto: la valle si è rimessa a posto da sola.
  else if (tornati > 0) annuncia(`la valle è ricresciuta: ${tornati}`, "#7fae63");

  // Il messaggio del riposo freddo non deve essere coperto dalla cronaca della notte.
  if (staminaIniziale > 0 && bisogni.livello("stanchezza") === 0 && !salute.eMorto()) {
    annuncia(AVVISI_BISOGNI.stanchezza, "#c0705f");
  }
  if (risvegliForzati > 0 && !salute.eMorto()) avvisoRisveglio = "Sei svenuto: hai dormito 2 ore sul posto (+25% stamina)";
  if (avvisoRisveglio) { annuncia(avvisoRisveglio, "#c9b189"); avvisoRisveglio = null; }

  // Il salvataggio dell'alba, e proprio qui: dopo che il giorno ha fatto i
  // suoi conti — l'orto cresciuto, i fuochi spenti, la stagione girata — così
  // una partita ripresa non li rifà e non li salta.
  //
  // Mai dalla schermata iniziale: lì la partita non è ancora cominciata, e
  // scriverla vorrebbe dire mettere una valle vuota nella casella dell'alba —
  // e in rete — al posto di quella che si stava per caricare. Il collaudo di
  // M7.18.5 l'ha visto succedere scorrendo le stagioni.
  if (iniziale === null && !salute.eMorto() && tempo.giornoCorrente() > albaScritta && tempo.oraCorrente() >= tempo.ALBA_PIENA) {
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
  for (const e of [...entita.daDisegnare(), ...fauna.daDisegnare(), ...polli.daDisegnare()]) {
    if (schermo.visibile(e.x, e.y, e.sprite.width, e.sprite.height)) inPiedi.push(e);
  }
  // Chi ha i piedi più in basso è più vicino a chi guarda, quindi va disegnato
  // per ultimo. È tutta la profondità che serve a una vista dall'alto 3/4.
  inPiedi.sort((a, b) => a.base - b.base);

  for (const cosa of inPiedi) schermo.disegna(cosa.sprite, cosa.x + tremolioDi(cosa), cosa.y);

  const lenza = pesca.stato();
  if (lenza) {
    const p = schermo.pennello(), q = schermo.inquadratura();
    const x = Math.round((lenza.tx + 0.5) * TASSELLO - q.sinistra);
    const y = Math.round((lenza.ty + 0.5) * TASSELLO - q.sopra + Math.sin(lenza.trascorsi * 3));
    p.save(); p.lineWidth = 1; p.strokeStyle = "#d9e8e8";
    p.beginPath(); p.moveTo(Math.round(eroe.px-q.sinistra),Math.round(eroe.py-q.sopra-12));
    p.lineTo(x,y); p.stroke();
    p.fillStyle = "#e0913a"; p.fillRect(x-1,y-2,2,3);
    p.fillStyle = "#d9e8e8"; p.fillRect(x-1,y+1,2,1); p.restore();
  }

  // Prima del buio, così di notte anche le scheggie si spengono con tutto il
  // resto invece di brillare sopra l'oscurità come scintille.
  scheggie.disegna();
  atmosfera.disegna(schermo.pennello(), meteo.evento(), tempo.giornoCorrente()*tempo.SECONDI_PER_GIORNO + tempo.oraCorrente()/24*tempo.SECONDI_PER_GIORNO, riparo.stanza());
  disegnaBuio();
  // Dopo il buio e prima dell'interfaccia: il lampo è una cosa che succede
  // nel mondo, non un cartello sul vetro, quindi la notte non lo spegne ma i
  // pannelli gli stanno sopra.
  hud.disegnaDanno(schermo.pennello(), lampoDanno / DURATA_LAMPO);
  disegnaInterfaccia();

  if (!diagnostica.hidden) aggiornaDiagnostica();
}

// Lo scarto orizzontale di ciò che è stato appena colpito. Oscilla in fretta
// e si spegne: è la stessa figura che fa una corda pizzicata.
//
// Due sorgenti, perché adesso ci sono due cose che si possono colpire. Le
// cose del mondo stanno su un tassello e il tremolio le trova per coordinate;
// chi cammina non sta su nessun tassello e se lo porta addosso. Stessa
// oscillazione per entrambi: un colpo deve sentirsi uguale qualunque cosa
// abbia preso.
function tremolioDi(cosa) {
  if (cosa.sussulto > 0) {
    const quanto = cosa.sussulto / 0.18;
    return Math.round(Math.sin(cosa.sussulto * 90) * AMPIEZZA_TREMOLIO * quanto);
  }
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

// Quello che il pannello delle partite deve sapere per disegnarsi. Sta in una
// funzione perché lo si apre da due posti — dal gioco e dal titolo — e i due
// elenchi scritti a mano sarebbero il primo a restare indietro.
function datiDellaPartita() {
  return {
    voci: caselleDiSalvataggio(),
    modo: modoPartita,
    scelta: slotScelto,
    dalTitolo: caricaDalTitolo,
    rete: {
      configurata: sincronia.configurata(),
      codice: sincronia.codiceAttivo(),
      nuvola,
      conflitto,
      scrittura: scrittaInCorso,
      dalTitolo: caricaDalTitolo,
    },
  };
}

function disegnaInterfaccia() {
  const p = schermo.pennello();

  // La mappa prende lo schermo per sé e nient'altro viene disegnato. Le altre
  // schermate si sovrappongono al gioco perché quello che coprono resta utile
  // — l'orologio mentre si sceglie una ricetta dice se conviene ancora uscire
  // — ma qui no: sotto una mappa si legge una mappa, e barre e zaino
  // diventerebbero righe che si intravedono attraverso la carta.
  if (mappaAperta) {
    mappaGrande.disegna(p, eroe);
    return;
  }

  // Lo stesso vale per la schermata iniziale: le barre piene e lo zaino vuoto
  // di una partita che non è cominciata non dicono niente. Sopra ci stanno
  // solo il pannello delle partite, se lo si è aperto per caricare, e i
  // messaggi, che dicono cosa è andato storto caricando.
  if (iniziale !== null) {
    hud.disegnaIniziale(p, {
      schermata: iniziale,
      riga: rigaIniziale,
      stagione: stagioni.STAGIONI[stagioneIniziale],
      versione: VERSIONE_MOSTRATA,
    });
    if (partitaAperta) hud.disegnaPartita(p, datiDellaPartita());
    hud.disegnaMessaggio(p, messaggio);
    return;
  }

  hud.disegnaBisogni(p, {
    salute: salute.livelloCorrente(),
    alFreddo: Boolean(gelando),
    infetto: salute.eInfetto(),
    inseguito: infetti.inseguono() > 0 || fauna.tutte().some(e => e.stato === "aggressivo"),
  });
  hud.disegnaOrologio(p, {
    giorno: tempo.giornoCorrente(),
    orologio: tempo.orologio(),
    eNotte: tempo.eNotte(),
    stagione: stagioni.stagioneCorrente(),
    giornoNellaStagione: stagioni.giornoNellaStagione(),
    giorniPerStagione: stagioni.GIORNI_PER_STAGIONE,
  });
  // Il moltiplicatore è quello del gelo: il bagnato non ha gradini e resta a
  // uno, e mostrargli la scala di un'altra regola sarebbe un numero che mente.
  const scalaFreddo = gelando === "gelo"
    ? salute.moltiplicatoreFreddo(Boolean(addosso.dati()?.gradiniFermi) && !meteo.zuppo())
    : gelando ? 1 : 0;
  hud.disegnaMeteo(p, { evento: meteo.evento(), domani: meteo.evento(tempo.giornoCorrente()+1), bagnato: meteo.livelloBagnato(), freddo: scalaFreddo });
  hud.disegnaAzione(p, azioneCorrente);
  const lenza = pesca.stato();
  if (lenza) {
    // Una barra sopra lo zaino mostra l'attesa senza aggiungere comandi.
    const x = Math.floor(schermo.LARGHEZZA/2)-36, y = schermo.ALTEZZA-60;
    p.fillStyle = "#1d3a4a"; p.fillRect(x,y,72,4);
    p.fillStyle = "#abcdd7"; p.fillRect(x,y,Math.floor(72*lenza.trascorsi/pesca.ATTESA),4);
  }
  const barra = hud.disegnaZaino(p, casellaScelta);
  // Il promemoria dice "C COSTRUIRE", e con la cassa aperta "C" chiude: un
  // cartello che indica la porta sbagliata è peggio di nessun cartello.
  if (!cassaAperta) {
    hud.disegnaPromemoria(p, barra, cosaInMano(), casellaScelta, smontaggioCorrente);
  }
  hud.disegnaMessaggio(p, messaggio);
  if (minimappaVisibile) minimappa.disegna(p);
  if (ricetteAperte) hud.disegnaRicette(p, { scelta: ricettaScelta, alBanco, alFuoco });
  if (cassaAperta) {
    hud.disegnaCassa(p, {
      contenuto: contenitori.contenutoDi(cassaAperta.tx, cassaAperta.ty),
      scelta: cassaScelta,
    });
  }
  if (partitaAperta) hud.disegnaPartita(p, datiDellaPartita());
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
  stanchezza: "sei allo stremo: riposa, fra un'ora svieni",
};

function aggiornaDiagnostica() {
  const tx = Math.floor(eroe.px / TASSELLO);
  const ty = Math.floor(eroe.py / TASSELLO);
  diagnostica.textContent = [
    `fps      ${ciclo.fpsCorrenti()}  peggiore ${(ciclo.peggiorFotogramma() * 1000).toFixed(1)} ms`,
    `scala    ${schermo.scalaCorrente()}x  (${schermo.LARGHEZZA}x${schermo.ALTEZZA})`,
    `versione ${VERSIONE_MOSTRATA}`,
    `seme     ${SEME}`,
    `tassello ${tx}, ${ty}`,
    `terreno  ${NOMI_TERRENO[mappa.terrenoDi(tx, ty)]}`,
    `bisogni  ${bisogni.ELENCO.map((n) => n[0] + " " + bisogni.livello(n).toFixed(2)).join("  ")}  velocità ${bisogni.fattoreVelocita().toFixed(2)}`,
    `salute   ${salute.livelloCorrente().toFixed(3)}  freddo ${gelando ?? "no"}  ${salute.eInfetto() ? "infetto" : "sano"}  ${mortoDi ? `morto ${mortoDi}` : "vivo"}`,
    `infetti  ${infetti.quanti()}  inseguono ${infetti.inseguono()}  chiasso ${chiasso.quanto()} (${Math.round(chiasso.raggio())}px)`,
    `ora      ${tempo.orologio()}  giorno ${tempo.giornoCorrente()}  luce ${tempo.luceAmbiente().toFixed(2)}`,
    `settori  ${mappa.settoriInMemoria()}  in piedi ${inPiedi.length}  lumi ${lumi.length}`,
    `scheggie ${scheggie.vive()}  figure ${giocatore.figureComposte()}`,
    `suono    ${suono.stato().livello}  contesto ${suono.stato().contesto}  voci ${suono.stato().vive}  emesse ${suono.stato().avviate}`,
    `minimappa ${minimappaVisibile ? "accesa" : "spenta"}  ricostruzioni ${minimappa.ricostruzioni()}`,
    `esplorato ${esplorato.quanti()} settori  atlante ridipinto ${mappaGrande.ridipinte()} volte`,
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

// Lo sblocco dell'audio, dentro il gesto vero.
//
// Chiuderlo dalla schermata d'apertura sembrava bastare, e su Chrome e Firefox
// basta: tengono l'attivazione dell'utente come uno stato appiccicoso, quindi
// una "resume()" chiamata più tardi va bene lo stesso. Ma quella chiamata non
// avviene dentro il gestore del tasto — comandi.js annota l'azione e finisce,
// e il gioco la legge un fotogramma dopo, dentro requestAnimationFrame — e
// WebKit è più severo: vuole la resume() nello stesso compito del gesto.
// Su Safari, e soprattutto su iPhone, il gioco sarebbe rimasto muto.
//
// Quindi lo sblocco sta anche qui, che è l'unico punto in cui si è davvero
// dentro il gesto. Sta in gioco.js e non in comandi.js perché questo è il
// modulo che possiede il DOM, e perché comandi.js è l'unico che sa cos'è una
// tastiera: non deve diventare anche l'unico che sa cos'è l'audio.
//
// "once" perché serve una volta sola, e pointerdown insieme a keydown perché
// il giorno che ci saranno i comandi su schermo il primo gesto sarà un dito.
for (const gesto of ["keydown", "pointerdown"]) {
  addEventListener(gesto, () => suono.sblocca(), { once: true, passive: true });
}

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
entita.registra(infetto.TIPO, infetto.aggiorna);
const partenza = doveSiComincia();
eroe = entita.aggiungi(giocatore.crea(partenza.px, partenza.py));
schermo.centraSu(eroe.px, eroe.py);

// Il mondo non aspetta chi guarda un'altra scheda. Il browser smette di
// chiamare il gioco — quello non si può impedire — ma il tempo passato si
// recupera al ritorno, ed è lo stesso meccanismo del dormire: l'orologio
// avanza, i bisogni calano, e il ciclo del cambio giorno fa crescere l'orto,
// spegnere i fuochi e girare le stagioni a ogni mezzanotte attraversata.
//
// Oltre il tetto il conto si ferma. Non è una gentilezza: recuperare mille
// giorni vorrebbe dire mille giri del ciclo del giorno, cioè una pagina
// bloccata per secondi, e a quel punto non cambierebbe più niente comunque —
// l'orto è morto da un pezzo e i bisogni sono a zero da un pezzo.
const ASSENZA_MASSIMA = 4 * 60 * 60; // quattro ore vere, cioè quarantotto giorni

// Senza questo si riparte con i tasti ancora premuti: chi cambia applicazione
// lascia il suo keyup dall'altra parte. E senza la seconda metà, una scheda in
// secondo piano continuerebbe a crepitare in sottofondo mentre si lavora.
ciclo.collegaSospensione(
  () => {
    pesca.interrompi();
    comandi.rilasciaTutto();
    suono.sospendi();
  },
  () => suono.riprendi()
);

// Il tempo che il ciclo non ha potuto simulare passo per passo. Arriva in
// blocco al primo fotogramma dopo un'assenza, e qui diventa mondo: l'orologio
// avanza, i bisogni calano, e il ciclo del cambio giorno fa crescere l'orto,
// spegnere i fuochi e girare le stagioni a ogni mezzanotte attraversata.
function recuperaIlTempoPerso(secondiSaltati) {
  pesca.interrompi();
  if (mondoFermo()) return;
  const secondi = simulazione.avanza(Math.min(secondiSaltati, ASSENZA_MASSIMA), {
    eroe,
    alFreddo: () => freddo.tipo(eroe),
  });

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
    urti,
    scegliCasella: (i) => { casellaScelta = i; },
    // Per il collaudo "chiudere l'apertura" vuol dire cominciare subito una
    // partita nuova dal giorno in cui la pagina si è aperta — quello di
    // "?giorno=", se c'è — senza passare dai menu.
    chiudiApertura: () => { avviaNuovaPartita(tempo.giornoCorrente()); },
    schermataIniziale: () => iniziale,
    tremolio: () => (colpito ? { ...colpito } : null),
    messaggio: () => (messaggio ? messaggio.testo : null),
    minimappa,
    mappaGrande,
    esplorato,
    minimappaAccesa: () => minimappaVisibile,
    mappaAperta: () => mappaAperta,
    bisogni,
    salute,
    freddo,
    // Il meteo mancava, e serve: la pioggia è l'unica regola che si può solo
    // aspettare, quindi è quella che dai tasti veri si prova peggio senza una
    // maniglia per guardarla mentre succede.
    meteo,
    infetti,
    fauna,
    polli,
    addosso,
    infetto,
    chiasso,
    suono,
    udito,
    contenitori,
    riparo,
    cassaAperta: () => (cassaAperta ? { ...cassaAperta } : null),
    ricetteAperte: () => ricetteAperte,
    ricettaScelta: () => ricettaScelta,
    alBanco: () => alBanco,
    cursoreCassa: () => cassaScelta,
    entita,
    eMorto: () => mortoDi,
    nuovoSuperstite,
    orto,
    stagioni,
    decadimento,
    ricrescita,
    ciclo,
    salvataggio,
    sincronia,
    comandi,
    apriPartita: (modo) => { partitaAperta = true; modoPartita = modo ?? "salva"; slotScelto = 0; },
    partitaAperta: () => partitaAperta,
  };
}

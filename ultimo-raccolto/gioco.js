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
import * as orto from "./regole/orto.js";
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
const VERSIONE = "M3.1";

// --- elementi -------------------------------------------------------------

const quadro = document.getElementById("quadro");
const avvisoSospensione = document.getElementById("sospensione");
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

// --- comandi --------------------------------------------------------------

function leggiComandi() {
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
  if (!ricetteAperte && !aperturaVisibile) {
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

  leggiComandi();
  azioneCorrente = ricetteAperte || aperturaVisibile ? null : azioni.azionePossibile(eroe, cosaInMano());

  if (messaggio) {
    messaggio.vita -= passo / 2.2;
    if (messaggio.vita <= 0) messaggio = null;
  }

  // L'orto cresce al cambio di giorno, non a ogni fotogramma: una coltura
  // matura in giorni, e contarli è l'unico modo perché aspettare significhi
  // qualcosa. È un ciclo e non un confronto perché una notte dormita può far
  // passare un giorno intero in un colpo solo.
  while (ultimoGiorno < tempo.giornoCorrente()) {
    const cresciute = orto.nuovoGiorno();
    ultimoGiorno += 1;
    if (cresciute > 0) annuncia("l'orto è cresciuto", "#9ec97e");
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
  hud.disegnaBisogni(p);
  hud.disegnaOrologio(p, tempo.giornoCorrente(), tempo.orologio(), tempo.eNotte());
  hud.disegnaAzione(p, azioneCorrente);
  const barra = hud.disegnaZaino(p, casellaScelta);
  hud.disegnaPromemoria(p, barra, cosaInMano());
  hud.disegnaMessaggio(p, messaggio);
  if (minimappaVisibile && !aperturaVisibile) minimappa.disegna(p);
  if (ricetteAperte) hud.disegnaRicette(p, ricettaScelta);
  if (aperturaVisibile) hud.disegnaApertura(p, VERSIONE);
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

// "?ora=22" comincia di notte. Il seme e l'ora nell'indirizzo rendono una
// situazione riproducibile: la stessa valle alla stessa ora, ogni volta.
if (parametri.has("ora")) tempo.impostaOra(Number(parametri.get("ora")));

entita.registra(giocatore.TIPO, giocatore.aggiorna);
const partenza = giocatore.puntoDiPartenza(0, 0);
eroe = entita.aggiungi(giocatore.crea(partenza.px, partenza.py));
schermo.centraSu(eroe.px, eroe.py);

ciclo.collegaSospensione((sospeso) => {
  avvisoSospensione.hidden = !sospeso;
  // Senza questo, tornando dalla pausa si riparte con i tasti ancora premuti.
  if (sospeso) comandi.rilasciaTutto();
});
ciclo.avvia({ aggiorna, disegna });

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
    orto,
  };
}

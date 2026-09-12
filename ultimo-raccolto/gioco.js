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
import * as mappa from "./mondo/mappa.js";
import * as modifiche from "./mondo/modifiche.js";
import * as entita from "./entita/entita.js";
import * as giocatore from "./entita/giocatore.js";
import * as tempo from "./regole/tempo.js";
import * as inventario from "./regole/inventario.js";
import * as azioni from "./regole/azioni.js";
import { RICETTE, fai } from "./regole/ricette.js";
import { nomeDi } from "./regole/oggetti.js";
import * as hud from "./interfaccia/hud.js";

const { TASSELLO } = schermo;

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

// La torcia in mano illumina. È l'unica cosa che l'oggetto selezionato fa di
// suo, ed è voluto che sia leggibile così: prendi la torcia, ci vedi.
const LUCE_TORCIA = { raggio: 46, intensita: 0.9 };
const lumi = [];

function cosaInMano() {
  return inventario.contenuto()[casellaScelta]?.cosa ?? null;
}

function annuncia(testo, colore) {
  messaggio = { testo: testo.toUpperCase(), colore, vita: 1 };
}

// --- comandi --------------------------------------------------------------

function leggiComandi() {
  for (let i = 0; i < comandi.CASELLE; i += 1) {
    if (comandi.appenaPremuto(`casella${i + 1}`)) {
      if (ricetteAperte && i < RICETTE.length) ricettaScelta = i;
      else casellaScelta = i;
    }
  }

  if (comandi.appenaPremuto("ricette")) {
    ricetteAperte = !ricetteAperte;
    ricettaScelta = 0;
  }

  if (!comandi.appenaPremuto("usa")) return;

  if (ricetteAperte) {
    const ricetta = RICETTE[ricettaScelta];
    if (fai(ricetta)) annuncia(`fatto: ${nomeDi(ricetta.produce.cosa)}`, "#9ec97e");
    else annuncia("materiali insufficienti", "#c0705f");
    return;
  }

  const esito = azioni.agisci(eroe, cosaInMano());
  if (!esito) return;

  if (esito.tipo === "raccolto") {
    const elenco = esito.ottenuto.map((v) => `+${v.quante} ${nomeDi(v.cosa)}`).join("  ");
    if (esito.avanzate.length > 0) annuncia("zaino pieno, perso qualcosa", "#c0705f");
    else if (elenco) annuncia(elenco, "#9ec97e");
  } else if (esito.tipo === "posa") {
    annuncia(`posato: ${nomeDi(esito.cosa)}`, "#9ec97e");
  }
}

// --- ciclo ----------------------------------------------------------------

function aggiorna(passo) {
  // Il tempo non scorre mentre si sceglie cosa costruire: un menu che ti fa
  // arrivare la notte addosso mentre lo leggi è una punizione, non una sfida.
  if (!ricetteAperte) {
    tempo.avanza(passo);
    entita.aggiorna(passo);
  }

  leggiComandi();
  azioneCorrente = ricetteAperte ? null : azioni.azionePossibile(eroe, cosaInMano());

  if (messaggio) {
    messaggio.vita -= passo / 2.2;
    if (messaggio.vita <= 0) messaggio = null;
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

  for (const cosa of inPiedi) schermo.disegna(cosa.sprite, cosa.x, cosa.y);

  disegnaBuio();
  disegnaInterfaccia();

  if (!diagnostica.hidden) aggiornaDiagnostica();
}

function disegnaBuio() {
  lumi.length = 0;
  for (const luce of mappa.lumiVisibili()) lumi.push(luce);
  if (cosaInMano() === "torcia") {
    lumi.push({ x: eroe.px, y: eroe.py - 10, ...LUCE_TORCIA });
  }
  oscurita.disegna(schermo.pennello(), tempo.luceAmbiente(), tempo.tintaOscurita(), lumi);
}

function disegnaInterfaccia() {
  const p = schermo.pennello();
  hud.disegnaOrologio(p, tempo.giornoCorrente(), tempo.orologio(), tempo.eNotte());
  hud.disegnaAzione(p, azioneCorrente);
  hud.disegnaZaino(p, casellaScelta);
  hud.disegnaMessaggio(p, messaggio);
  if (ricetteAperte) hud.disegnaRicette(p, ricettaScelta);
}

// --- diagnostica ----------------------------------------------------------

const NOMI_TERRENO = ["acqua", "bassofondo", "sabbia", "erba", "sterpaglia", "roccia", "terra"];

function aggiornaDiagnostica() {
  const tx = Math.floor(eroe.px / TASSELLO);
  const ty = Math.floor(eroe.py / TASSELLO);
  diagnostica.textContent = [
    `fps      ${ciclo.fpsCorrenti()}  peggiore ${(ciclo.peggiorFotogramma() * 1000).toFixed(1)} ms`,
    `scala    ${schermo.scalaCorrente()}x  (${schermo.LARGHEZZA}x${schermo.ALTEZZA})`,
    `seme     ${SEME}`,
    `tassello ${tx}, ${ty}`,
    `terreno  ${NOMI_TERRENO[mappa.terrenoDi(tx, ty)]}`,
    `ora      ${tempo.orologio()}  giorno ${tempo.giornoCorrente()}  luce ${tempo.luceAmbiente().toFixed(2)}`,
    `settori  ${mappa.settoriInMemoria()}  in piedi ${inPiedi.length}  lumi ${lumi.length}`,
    `modifiche ${modifiche.quanti()}`,
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
    scegliCasella: (i) => { casellaScelta = i; },
  };
}

// Ultimo raccolto — avvio e orchestrazione.
//
// Questo modulo possiede il DOM e mette in comunicazione le parti; la logica di
// gioco vive altrove. È la stessa divisione che regge le altre applicazioni del
// sito: un modulo che sa di interfaccia e moduli che non ne sanno nulla.

import * as schermo from "./motore/schermo.js";
import * as ciclo from "./motore/ciclo.js";
import * as comandi from "./motore/comandi.js";
import * as mappa from "./mondo/mappa.js";
import * as entita from "./entita/entita.js";
import * as giocatore from "./entita/giocatore.js";

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

// --- ciclo ----------------------------------------------------------------

function aggiorna(passo) {
  entita.aggiorna(passo);
  // Prepara il terreno appena fuori dall'inquadratura mentre c'è tempo, così
  // varcare il confine di un settore non costa niente nel momento sbagliato.
  mappa.precuociVicini();
  // La camera insegue con un ritardo: seguire di colpo rende ogni cambio di
  // direzione uno strattone. Il fattore è tarato per recuperare quasi tutto in
  // un decimo di secondo — abbastanza da ammorbidire, troppo poco da notare.
  const inseguimento = 1 - Math.exp(-12 * passo);
  const bersaglioX = eroe.px - schermo.LARGHEZZA / 2;
  const bersaglioY = eroe.py - schermo.ALTEZZA / 2;
  schermo.camera.x += (bersaglioX - schermo.camera.x) * inseguimento;
  schermo.camera.y += (bersaglioY - schermo.camera.y) * inseguimento;
}

// Una sola lista per tutto ciò che sta in piedi sul terreno, riusata a ogni
// fotogramma. Alberi ed entità finiscono qui insieme proprio perché l'ordine di
// disegno dipende solo da dove ha i piedi ciascuno, non da cosa è.
const inPiedi = [];

function disegna() {
  schermo.pulisci("#0d0f12");

  const oggetti = mappa.disegnaTerreno();

  inPiedi.length = 0;
  for (const o of oggetti) inPiedi.push(o);
  for (const e of entita.daDisegnare()) {
    if (schermo.visibile(e.x, e.y, e.sprite.width, e.sprite.height)) inPiedi.push(e);
  }
  // Chi ha i piedi più in basso è più vicino a chi guarda, quindi va disegnato
  // per ultimo. È tutta la profondità che serve a una vista dall'alto 3/4.
  inPiedi.sort((a, b) => a.base - b.base);

  for (const cosa of inPiedi) schermo.disegna(cosa.sprite, cosa.x, cosa.y);

  if (!diagnostica.hidden) aggiornaDiagnostica();
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
    `guarda   ${eroe.guarda}`,
    `settori  ${mappa.settoriInMemoria()}  in piedi ${inPiedi.length}`,
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

// Segnale per la verifica automatica: senza, uno screenshot non distingue
// "il gioco non è partito" da "il gioco è partito ed è tutto nero".
document.documentElement.dataset.avviato = "si";

// Maniglia per il collaudo, solo con la diagnostica accesa: permette di leggere
// da fuori dove si trova il superstite e cosa ha sotto i piedi, che è l'unico
// modo di verificare movimento e urti senza un paio d'occhi davanti allo schermo.
if (parametri.has("diagnostica")) {
  globalThis.ultimoRaccolto = { eroe: () => eroe, mappa, schermo, ciclo };
}

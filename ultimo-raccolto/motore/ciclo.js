// Ciclo di gioco a passo fisso.
//
// Aggiornare a passo fisso e disegnare quando capita è ciò che rende la
// simulazione ripetibile: la fisica non cambia comportamento perché il computer
// è più lento, e una collisione non viene saltata perché un fotogramma è durato
// il doppio.
//
// Non c'è interpolazione fra i due passi, ed è voluto. La camera arrotonda le
// posizioni al pixel intero (vedi schermo.js), quindi interpolare non darebbe
// un movimento più fluido: darebbe posizioni che arrotondano avanti e indietro
// allo stesso pixel, cioè tremolio.

export const PASSO = 1 / 60;

// Oltre questo numero di passi recuperati in un colpo solo si preferisce
// perdere tempo di gioco. Tornando da una scheda rimasta in secondo piano
// l'accumulo vale minuti: ricorrerli tutti bloccherebbe la pagina, e nel
// frattempo il giocatore attraverserebbe i muri a velocità di calcolo.
const PASSI_MASSIMI = 5;

let attivo = false;
let sospeso = false;
let accumulo = 0;
let precedente = 0;

let fotogrammi = 0;
let finestraFps = 0;
let fps = 0;
// Il fotogramma più lento dell'ultima finestra. Gli fps medi non servono a
// trovare gli scatti: sessanta di media stanno benissimo anche con un
// fotogramma da trenta millisecondi in mezzo, che però si sente.
let peggiore = 0;
let peggioreInCorso = 0;

export function fpsCorrenti() {
  return fps;
}

export function peggiorFotogramma() {
  return peggiore;
}

export function inPausa() {
  return sospeso;
}

export function avvia({ aggiorna, disegna }) {
  attivo = true;
  precedente = performance.now();

  function giro(ora) {
    if (!attivo) return;
    requestAnimationFrame(giro);

    const delta = (ora - precedente) / 1000;
    precedente = ora;

    // Da fermi non si accumula nulla: è ciò che evita la corsa di recupero al
    // ritorno dalla pausa, senza dover azzerare niente a mano.
    if (sospeso) return;

    accumulo += delta;
    let passi = 0;
    while (accumulo >= PASSO && passi < PASSI_MASSIMI) {
      aggiorna(PASSO);
      accumulo -= PASSO;
      passi += 1;
    }
    if (passi === PASSI_MASSIMI) accumulo = 0;

    disegna();

    fotogrammi += 1;
    finestraFps += delta;
    peggioreInCorso = Math.max(peggioreInCorso, delta);
    if (finestraFps >= 0.5) {
      fps = Math.round(fotogrammi / finestraFps);
      peggiore = peggioreInCorso;
      fotogrammi = 0;
      finestraFps = 0;
      peggioreInCorso = 0;
    }
  }

  requestAnimationFrame(giro);
}

export function ferma() {
  attivo = false;
}

// Una scheda in secondo piano non riceve requestAnimationFrame, ma perdere il
// fuoco della finestra sì: senza questo, chi passa a un'altra applicazione
// continua a camminare perché il tasto è rimasto premuto e non tornerà mai il
// suo keyup.
export function collegaSospensione(allaSospensione) {
  const cambia = (valore) => {
    if (sospeso === valore) return;
    sospeso = valore;
    accumulo = 0;
    precedente = performance.now();
    if (allaSospensione) allaSospensione(valore);
  };

  addEventListener("blur", () => cambia(true));
  addEventListener("focus", () => cambia(false));
  document.addEventListener("visibilitychange", () => cambia(document.hidden));
}

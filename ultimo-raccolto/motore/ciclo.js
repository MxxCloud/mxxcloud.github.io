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
// perdere tempo di simulazione. Il tempo di gioco non si perde lo stesso:
// rientrando dallo schermo l'assenza si recupera in blocco (vedi
// collegaSospensione), che è un'altra strada e molto più economica.
const PASSI_MASSIMI = 5;

let attivo = false;
// Fuori dallo schermo, non in pausa: il ciclo non gira perché il browser non
// lo chiama, non perché il gioco abbia deciso di fermarsi.
let fuori = false;
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

// "salto" riceve il tempo reale che il ciclo non è riuscito a simulare passo
// per passo. Capita tornando da una scheda in secondo piano, da un computer
// che era sospeso, o dopo un intoppo lungo: chi orchestra decide cosa farne.
export function avvia({ aggiorna, disegna, salto }) {
  attivo = true;
  precedente = performance.now();

  function giro(ora) {
    if (!attivo) return;
    requestAnimationFrame(giro);

    const delta = (ora - precedente) / 1000;
    precedente = ora;

    accumulo += delta;
    let passi = 0;
    while (accumulo >= PASSO && passi < PASSI_MASSIMI) {
      aggiorna(PASSO);
      accumulo -= PASSO;
      passi += 1;
    }

    // Il tempo avanzato non si butta più: si consegna a chi sa farne qualcosa
    // in blocco. È il tempo passato mentre il gioco non veniva chiamato, e
    // buttarlo era quello che metteva il mondo in pausa.
    //
    // Misurarlo qui e non sul fuoco della finestra è la differenza fra un
    // conto giusto e un conto doppio: una finestra visibile ma senza fuoco
    // continua a ricevere fotogrammi, quindi quel tempo è già stato simulato
    // e sommarlo di nuovo farebbe correre l'orologio al doppio.
    if (passi === PASSI_MASSIMI && accumulo > 0) {
      const saltato = accumulo;
      accumulo = 0;
      if (salto) salto(saltato);
    }

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

// Uscire dallo schermo serve a una cosa sola: rilasciare i tasti. Senza, chi
// passa a un'altra applicazione continua a camminare perché il tasto è
// rimasto premuto e il suo keyup non arriverà mai.
//
// Il tempo passato fuori non si misura qui. Una scheda in secondo piano non
// riceve requestAnimationFrame — il browser smette di chiamare il gioco e non
// c'è codice che possa obbligarlo — ma quel tempo riappare da solo come un
// salto enorme nel primo fotogramma al ritorno, ed è lì che viene raccolto
// (vedi "salto" in avvia). Misurarlo da qui conterebbe due volte tutte le
// volte che la finestra perde il fuoco senza sparire.
export function collegaSospensione(allUscita) {
  const esci = () => {
    if (fuori) return;
    fuori = true;
    if (allUscita) allUscita();
  };

  const rientra = () => {
    fuori = false;
  };

  addEventListener("blur", esci);
  addEventListener("focus", rientra);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) esci();
    else rientra();
  });
}

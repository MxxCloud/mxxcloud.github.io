// Comandi: dai tasti alle azioni.
//
// Il gioco non chiede mai "è premuto W": chiede "si sta andando avanti". Fra le
// due cose c'è questo modulo, ed è l'unico punto da toccare il giorno che
// arriveranno i comandi su schermo per il telefono o la riconfigurazione dei
// tasti. Nessuna altra parte del gioco sa che esiste una tastiera.

export const AZIONI = ["su", "giu", "sinistra", "destra", "usa", "corri", "ricette", "minimappa"];

// Otto caselle, otto tasti: la selezione con la rotellina o con Q/E costringe
// a scorrere, e con solo otto caselle scorrere è più lento che puntare.
export const CASELLE = 8;

const MAPPA = {
  KeyW: "su", ArrowUp: "su",
  KeyS: "giu", ArrowDown: "giu",
  KeyA: "sinistra", ArrowLeft: "sinistra",
  KeyD: "destra", ArrowRight: "destra",
  Space: "usa", Enter: "usa",
  ShiftLeft: "corri", ShiftRight: "corri",
  KeyC: "ricette", Tab: "ricette",
  KeyM: "minimappa",
};

for (let i = 1; i <= CASELLE; i += 1) MAPPA[`Digit${i}`] = `casella${i}`;

const attive = new Set();
// Le azioni premute in questo passo e non ancora consumate. Servono perché
// "colpisci" e "tieni premuto per camminare" sono due cose diverse: senza
// distinguerle, tenere premuta la barra abbatterebbe un albero in un
// sessantesimo di secondo.
const appena = new Set();

export function attiva(azione) {
  return attive.has(azione);
}

export function appenaPremuto(azione) {
  return appena.has(azione);
}

// Da chiamare in fondo a ogni passo di aggiornamento: quello che è stato
// premuto vale per un passo solo.
export function finePasso() {
  appena.clear();
}

// Serve alla sospensione: perdendo il fuoco della finestra il keyup non arriva
// mai, e senza questo il superstite continuerebbe a camminare da solo contro
// un albero per tutto il tempo in cui si guarda un'altra applicazione.
export function rilasciaTutto() {
  attive.clear();
  appena.clear();
}

// Vettore di spostamento normalizzato. La normalizzazione non è un vezzo: in
// diagonale le due componenti valgono 1 ciascuna, e senza dividerle ci si
// muoverebbe del 41% più veloci andando di sbieco.
export function direzione() {
  let x = 0;
  let y = 0;
  if (attiva("sinistra")) x -= 1;
  if (attiva("destra")) x += 1;
  if (attiva("su")) y -= 1;
  if (attiva("giu")) y += 1;
  if (x !== 0 && y !== 0) {
    const diagonale = Math.SQRT1_2;
    x *= diagonale;
    y *= diagonale;
  }
  return { x, y };
}

export function collega() {
  addEventListener("keydown", (evento) => {
    const azione = MAPPA[evento.code];
    if (!azione) return;
    // Le frecce e la barra spaziatrice farebbero scorrere la pagina, e la
    // barra premerebbe anche l'ultimo elemento che ha ricevuto un clic.
    evento.preventDefault();
    if (evento.repeat) return;
    attive.add(azione);
    appena.add(azione);
  });

  addEventListener("keyup", (evento) => {
    const azione = MAPPA[evento.code];
    if (azione) attive.delete(azione);
  });
}

// Gli urti: il riquadro di chi cammina, e il modo di spostarlo.
//
// Stava dentro giocatore.js, ed era giusto finché il superstite era l'unica
// cosa che camminava. Adesso non lo è più, e la scelta era fra ricopiare
// venticinque righe in infetto.js o metterle dove le vedono entrambi. Una
// copia di un calcolo di urti è il tipo di copia che si scopre il giorno in
// cui il giocatore attraversa un albero e il mostro no.

import * as schermo from "../motore/schermo.js";
import * as mappa from "../mondo/mappa.js";

const { TASSELLO } = schermo;

// Molto più piccolo dello sprite e ai piedi. In una vista dall'alto 3/4 il
// busto è disegnato "davanti" al terreno che occupa, non sopra: far collidere
// anche la testa darebbe la sensazione di un personaggio grasso il doppio di
// quello che si vede.
//
// Uno solo per tutti, e non per comodità: gli infetti usano gli sprite del
// superstite, quindi hanno esattamente il suo ingombro. Il giorno in cui
// qualcosa avrà una taglia diversa, questi due numeri diventeranno un
// parametro.
export const LARGHEZZA = 10;
export const ALTEZZA = 7;

export function liberoIn(x, y) {
  const sinistra = x - LARGHEZZA / 2;
  const destra = x + LARGHEZZA / 2 - 0.001;
  const sopra = y - ALTEZZA;
  const sotto = y - 0.001;

  const txPrimo = Math.floor(sinistra / TASSELLO);
  const txUltimo = Math.floor(destra / TASSELLO);
  const tyPrimo = Math.floor(sopra / TASSELLO);
  const tyUltimo = Math.floor(sotto / TASSELLO);

  for (let ty = tyPrimo; ty <= tyUltimo; ty += 1) {
    for (let tx = txPrimo; tx <= txUltimo; tx += 1) {
      if (mappa.solidoIn(tx, ty)) return false;
    }
  }
  return true;
}

// I due assi si risolvono separatamente: è ciò che permette di scivolare lungo
// un muro invece di incollarcisi. Provando lo spostamento come un unico
// vettore, sfiorare un albero in diagonale fermerebbe del tutto.
//
// Restituisce quanto ci si è spostati davvero, che non è sempre quello che si
// era chiesto: serve a chi insegue per accorgersi di essere incastrato, e al
// superstite per agganciare l'animazione ai pixel percorsi invece che al
// tempo.
export function muovi(e, dx, dy) {
  const primaX = e.px;
  const primaY = e.py;
  if (dx !== 0 && liberoIn(e.px + dx, e.py)) e.px += dx;
  if (dy !== 0 && liberoIn(e.px, e.py + dy)) e.py += dy;
  return Math.hypot(e.px - primaX, e.py - primaY);
}

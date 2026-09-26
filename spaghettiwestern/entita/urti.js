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

  // Chi è finito dentro qualcosa può uscirne, e attraversa quello che vuole
  // finché non è fuori.
  //
  // Non è un permesso generico: si arriva qui solo quando lo spostamento è
  // stato respinto su tutti e due gli assi E il posto in cui si sta è esso
  // stesso occupato — cioè quando il mondo si è chiuso addosso a qualcuno,
  // non quando qualcuno cammina contro un albero. Camminare contro un albero
  // lascia liberoIn(px, py) vero e questo ramo non si apre nemmeno.
  //
  // Il mondo si chiude addosso in più di un modo, ed è per questo che la rete
  // sta qui invece che accanto a una delle cause: si posa un falò troppo
  // vicino (e c'è anche una spinta apposta, più sotto), ma un albero può
  // anche ricrescere dove stai, e un salvataggio può essere ripreso in un
  // mondo che nel frattempo è cambiato. Restare incastrati per sempre non è
  // una regola dura: è una partita finita senza che nessuno l'abbia decisa,
  // ed è la stessa ragione per cui il cadavere non marcisce.
  if (e.px === primaX && e.py === primaY && (dx !== 0 || dy !== 0) && !liberoIn(e.px, e.py)) {
    e.px += dx;
    e.py += dy;
  }

  return Math.hypot(e.px - primaX, e.py - primaY);
}

// Toglie di mezzo chi è rimasto sotto una cosa appena comparsa, spingendolo
// indietro lungo la direzione da cui la cosa è arrivata.
//
// Serve al posare. Il tassello su cui si posa è quello davanti al PUNTO dei
// piedi, ma il riquadro d'urto è largo dieci e alto sette: quando i piedi
// stanno vicini al bordo del tassello, il riquadro sborda in quello davanti —
// verso l'alto fino a sette pixel, di fianco fino a cinque — e un oggetto
// solido posato lì nasce addosso a chi l'ha posato.
//
// Si spinge invece di rifiutare, e la differenza si sente. Rifiutare avrebbe
// voluto dire dire di no in un caso su tre andando a sinistra e quasi in uno
// su due andando in su, cioè rendere il posare una cosa che a volte funziona.
// Spingere costa al massimo sette pixel — meno di mezzo tassello, quanto un
// passo — e si legge per quello che è: la cosa che hai messo giù occupa
// spazio.
export function spingiFuori(e, dx, dy) {
  if (liberoIn(e.px, e.py)) return 0;
  for (let quanto = 1; quanto <= TASSELLO; quanto += 1) {
    const px = e.px - dx * quanto;
    const py = e.py - dy * quanto;
    if (!liberoIn(px, py)) continue;
    e.px = px;
    e.py = py;
    return quanto;
  }
  // Non c'è posto nemmeno a un tassello di distanza: si lascia com'è, e a
  // tirarlo fuori ci pensa muovi() al primo passo. Meglio una spinta mancata
  // che una spinta dentro qualcos'altro.
  return 0;
}

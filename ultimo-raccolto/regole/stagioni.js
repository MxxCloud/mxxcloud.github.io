// Le stagioni.
//
// Finché il tempo era solo giorno e notte, un giorno valeva l'altro: i bisogni
// davano una ragione per fare qualcosa adesso, ma nessuna per farlo *questo*
// mese invece del prossimo. La stagione è la scadenza che mancava — una cosa
// che arriva che tu sia pronto o no, ed è metà del pilastro: il mondo si
// riprende quello che è tuo anche solo passando.
//
// Quattro giorni ciascuna, cioè venti minuti veri con il giorno da cinque.
// Una stagione entra in una pausa caffè, e l'anno intero in un'ora e venti:
// è quello che serve adesso, con mezzo gioco ancora da costruire e le regole
// che chiedono giorni per mostrarsi sbagliate.
//
// Il conto però si è stretto: una coltura innaffiata ogni giorno matura in
// quattro, quindi in una stagione buona ci sta un raccolto solo, e appena.
// Con otto ce ne stavano due. È una scelta da rivedere quando il gioco
// smetterà di essere un cantiere — l'orto vuole una stagione in cui si possa
// sbagliare un giorno senza perdere il raccolto.
import * as tempo from "./tempo.js";

export const GIORNI_PER_STAGIONE = 4;

// L'ordine è quello dell'anno, e l'indice conta: da esso si ricava la
// stagione dal giorno con una divisione sola.
export const STAGIONI = ["estate", "autunno", "inverno", "primavera"];

// Si comincia di fine estate, che è la valle descritta dalla tavolozza fin dal
// primo giorno. Non è un dettaglio di colore: significa che la prima cosa che
// il giocatore vede arrivare è l'autunno, cioè la stagione buona, e subito
// dopo l'inverno. Il gioco insegna l'orto proprio mentre gli mostra la
// scadenza per usarlo.
export function stagioneDi(giorno) {
  return STAGIONI[Math.floor((giorno - 1) / GIORNI_PER_STAGIONE) % STAGIONI.length];
}

export function stagioneCorrente() {
  return stagioneDi(tempo.giornoCorrente());
}

// Che giorno è dentro la stagione, da 1 a GIORNI_PER_STAGIONE. Serve
// all'interfaccia: "inverno" da solo non dice se conviene seminare ancora.
export function giornoNellaStagione(giorno = tempo.giornoCorrente()) {
  return ((giorno - 1) % GIORNI_PER_STAGIONE) + 1;
}

export function giorniAllaProssima(giorno = tempo.giornoCorrente()) {
  return GIORNI_PER_STAGIONE - giornoNellaStagione(giorno) + 1;
}

// L'inverno è l'unica stagione in cui non si coltiva. Una regola sola invece
// di una finestra per ogni coltura: con una coltura sola sarebbero due modi di
// dire la stessa cosa, e quello con più parole si impara peggio. Quando ci
// saranno il grano e le zucche, ognuno avrà la sua finestra e questa funzione
// prenderà anche la coltura.
export function siColtiva(stagione = stagioneCorrente()) {
  return stagione !== "inverno";
}

// L'unica stagione che fiorisce. Sta qui e non nella tavolozza perché è una
// regola del calendario, non una tinta: la mappa riceve i disegni da spargere
// o non li riceve, e non sa perché.
export function fiorisce(stagione = stagioneCorrente()) {
  return stagione === "primavera";
}

// Quanto più in fretta viene fame. Il freddo non ha ancora un sistema suo — la
// temperatura arriva con le ferite — ma un inverno che si vede soltanto è un
// fondale. Questo è il minimo perché si senta: d'inverno si mangia di più, e
// siccome d'inverno non si coltiva, si mangia quello che si è messo da parte.
const FAME = { estate: 1, autunno: 1, inverno: 1.6, primavera: 1 };

export function fattoreFame(stagione = stagioneCorrente()) {
  return FAME[stagione] ?? 1;
}

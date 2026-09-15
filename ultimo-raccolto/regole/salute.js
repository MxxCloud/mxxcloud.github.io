// La salute, e la morte.
//
// Non è un quarto bisogno, ed è la cosa più importante da capire di questo
// file: non cala da sola. Sta sotto agli altri tre e raccoglie le
// conseguenze di quello che succede sopra — un bisogno a zero fa danno, il
// freddo fa danno, e quando non manca niente il corpo si rimette piano.
//
// Fino a qui un bisogno ignorato toglieva un quarto della velocità, e basta.
// Era la cosa giusta finché non c'era niente da perdere: prima dell'orto e
// delle stagioni morire non sarebbe costato niente. Adesso costa, ed è il
// momento in cui il pilastro smette di essere una promessa — il mondo si
// riprende anche te.
//
// Quello che la morte *non* porta via sta scritto nel README fin dal primo
// giorno: muore il superstite, non la valle. Il campo, i falò, le modifiche
// restano dov'erano, e il cadavere con tutto quello che portavi addosso resta
// dove sei caduto. Riprenderselo è un viaggio, non un tasto.

import * as tempo from "./tempo.js";

const GIORNO = tempo.SECONDI_PER_GIORNO;

// Due giorni per bisogno vuoto. È il numero che decide quanto è severo il
// gioco, e questo è il taglio indulgente: un bisogno a zero dà tutto il tempo
// di accorgersene e di rimediare, tre insieme uccidono in sedici ore di
// gioco. Chi muore di fame ha ignorato una barra rossa e un messaggio per due
// giorni interi.
const DANNO_VUOTO = 1 / (GIORNO * 2);

// Il freddo morde quasi tre volte più in fretta, e non per cattiveria: agisce
// solo di notte e solo d'inverno, cioè per meno di metà di una stagione su
// quattro. Con il ritmo dei bisogni non si sarebbe sentito mai. Così invece
// una notte d'inverno passata all'aperto senza fuoco costa più di metà della
// salute, e due di fila uccidono — che è esattamente la ragione per cui
// esistono il falò e il giaciglio.
const DANNO_FREDDO = 1 / (GIORNO * 0.75);

// Tre giorni per tornare pieni. Più lenta del danno di proposito: se
// guarisse in fretta, arrivare a un passo dalla morte sarebbe un
// inconveniente da risolvere mangiando una rapa. Così invece uno sbaglio si
// porta dietro per giorni, e in quei giorni si è fragili.
const CURA = 1 / (GIORNO * 3);

// L'infezione. Più lenta di un bisogno vuoto e senza scadenza: da sola non
// uccide in fretta, ma non smette, e finché c'è non si guarisce di niente
// altro. È questo a farne una cosa diversa dal danno — un morso si riposa,
// un'infezione si cura o si peggiora, e l'unico modo di curarla è una benda.
//
// Quattro giorni per uccidere da salute piena. È il tempo per tornare a casa,
// fare il punto e fasciarsi: abbastanza da non essere una condanna, troppo
// poco per farci finta di niente fino alla primavera.
const DANNO_INFEZIONE = 1 / (GIORNO * 4);

// Come si racconta la morte. La causa non è un dettaglio di colore: senza,
// una schermata di morte dice "sei morto" e lascia al giocatore il compito di
// indovinare cosa avrebbe dovuto fare diversamente.
export const CAUSE = {
  fame: "di fame",
  sete: "di sete",
  stanchezza: "di sfinimento",
  freddo: "di freddo",
  infetti: "sbranato",
  infezione: "d'infezione",
};

let livello = 1;
let morto = false;
let causa = null;
let infezione = false;

// Quanto danno ha fatto ciascuna causa da quando questo superstite è vivo.
// Serve a nominare la morte onestamente: chi aveva fame da due giorni e sete
// da dieci secondi è morto di fame, anche se l'ultimo colpo l'ha dato la
// sete. Nominare l'ultima causa sarebbe più facile da scrivere e più facile
// da sbagliare.
const danni = { fame: 0, sete: 0, stanchezza: 0, freddo: 0, infetti: 0, infezione: 0 };

export function livelloCorrente() {
  return livello;
}

export function eMorto() {
  return morto;
}

export function causaDellaMorte() {
  return causa;
}

export function eInfetto() {
  return infezione;
}

function limita(valore) {
  return Math.min(1, Math.max(0, valore));
}

// Chi ha fatto più danno. Chiamata una volta sola, quando si muore.
function peggiore() {
  let quale = null;
  let quanto = 0;
  for (const [nome, valore] of Object.entries(danni)) {
    if (valore > quanto) {
      quanto = valore;
      quale = nome;
    }
  }
  return quale;
}

// Toglie salute e tiene il conto di chi l'ha tolta. Tutto il danno passa di
// qui, perché il conto delle cause è la cosa che si dimentica di aggiornare
// aggiungendo una fonte nuova.
function ferisci(quale, quanto) {
  if (quanto <= 0) return;
  danni[quale] += quanto;
  livello = limita(livello - quanto);
}

// Un colpo secco, e non un consumo: un morso toglie di colpo quello che la
// fame toglie in mezza giornata. Sta fuori da avanza() perché non ha un
// ritmo — capita, e chi lo infligge sa quando.
//
// L'infezione si prende da qui in poi (vedi infettati()), ma non si decide
// qui: chi morde sa se ha lasciato qualcosa dentro, questo modulo sa solo
// tenerne il conto.
export function ferita(quanto, causaDelColpo = "infetti") {
  if (morto) return false;
  ferisci(causaDelColpo, quanto);
  return controllaLaMorte() !== null;
}

export function infettati() {
  if (morto) return false;
  infezione = true;
  return true;
}

// Restituisce quanto è stato tolto, così chi cura può dire se serviva.
export function curati() {
  const cera = infezione;
  infezione = false;
  return cera;
}

// Un posto solo in cui si muore, chiamato da tutte le strade che tolgono
// salute. Era già la lezione di M5 — la salute arriva a zero in più modi e
// ognuno sta altrove — e adesso i modi sono cinque invece di tre.
function controllaLaMorte() {
  if (morto || livello > 0) return null;
  morto = true;
  causa = peggiore();
  return causa;
}

// Restituisce la causa della morte se si è appena morti, altrimenti null:
// l'interfaccia deve poterlo annunciare una volta sola, come per i bisogni
// che si svuotano.
export function avanza(passo, { vuoti = [], alFreddo = false } = {}) {
  if (morto) return null;

  for (const quale of vuoti) ferisci(quale, DANNO_VUOTO * passo);
  if (alFreddo) ferisci("freddo", DANNO_FREDDO * passo);
  if (infezione) ferisci("infezione", DANNO_INFEZIONE * passo);

  // Si guarisce solo quando non manca niente, non si gela e non si è
  // infetti. Non è una cura a metà: o il corpo ha tutto quello che gli serve,
  // o sta pagando. Ed è il motivo per cui l'infezione va curata e non
  // aspettata — finché c'è, niente si rimargina.
  if (vuoti.length === 0 && !alFreddo && !infezione) {
    livello = limita(livello + CURA * passo);
  }

  return controllaLaMorte();
}

// Il tempo saltato fa danno come se fosse passato davvero, per la stessa
// ragione per cui lo fa ai bisogni: dormire salta la notte e non il proprio
// metabolismo, ed essere stati via non mette il mondo in pausa.
//
// I bisogni vuoti sono quelli di adesso, cioè di quando si torna, e non
// quelli dell'intero intervallo: durante l'assenza nessuno li ha misurati.
// È un'approssimazione, e sbaglia dalla parte giusta — un bisogno svuotatosi
// a metà dell'assenza fa danno per tutta l'assenza solo se è ancora vuoto al
// ritorno, cioè solo se nel frattempo non è stato risolto, cosa che da
// assenti non può essere successa.
export function passanoSecondi(secondi, { vuoti = [] } = {}) {
  return avanza(secondi, { vuoti, alFreddo: false });
}

export function ristora(quanto) {
  if (morto) return 0;
  const prima = livello;
  livello = limita(livello + quanto);
  return livello - prima;
}

// Un superstite nuovo nella stessa valle: salute piena, nessun conto aperto.
// Non è tempo.reimposta(): il mondo non ricomincia, ricomincia il corpo.
export function reimposta() {
  livello = 1;
  morto = false;
  causa = null;
  infezione = false;
  for (const quale of Object.keys(danni)) danni[quale] = 0;
}

// Da un salvataggio. Quello che manca o non è un numero torna pieno, come per
// i bisogni: è la scelta indulgente delle due, e adesso che si muore la
// differenza fra le due è che un file storto ucciderebbe.
//
// Non si salva né la morte né il conto delle cause, e non per dimenticanza:
// un salvataggio si scrive all'alba o quando lo chiedi, cioè da vivi, e una
// partita ripresa comincia da un superstite in piedi.
export function ripristina(salvata, infetta = false) {
  reimposta();
  if (Number.isFinite(salvata)) livello = limita(salvata);
  // L'infezione sì che si salva, al contrario della morte: è uno stato in cui
  // si vive, e riprendere una partita guariti per il fatto di averla chiusa
  // sarebbe il modo più comodo di curarsi che esista.
  infezione = infetta === true;
}

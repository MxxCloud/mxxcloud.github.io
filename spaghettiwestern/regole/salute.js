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

// Danno di base. L'esposizione continua lo moltiplica per 2 dopo 15 secondi
// e per 3 dopo 30: il calore interrompe l'accumulo, il sonno no.
const DANNO_FREDDO = 1 / (GIORNO * 0.75);

// Quanto morde il freddo che viene soltanto dall'essere fradici. Metà, e senza
// gradini (vedi freddo.js): sotto l'acqua si passa da novanta secondi di vita
// a quattrocentocinquanta, cioè più di quanto duri una giornata intera di
// pioggia — non si muore restando sotto un acquazzone, ci si arriva a sera
// conciati. È la differenza fra una regola che punisce e
// una che uccide: il gelo d'inverno resta quello di prima, perché quello lo
// scegli, mentre la pioggia ti capita addosso dove sei.
const FREDDO_MITE = 0.5;

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

// Il letto. Dormendoci si guarisce tre volte più in fretta — un giorno invece
// di tre — e un'infezione non toglie salute finché si dorme: non la cura, per
// quello resta la benda, ma chi torna a casa morso non peggiora nel sonno.
// È la cosa che nessun altro posto dà, ed è per questo che il letto vuole il
// pavimento: la terra battuta è umida, fredda e piena di quello che fa
// ammalare, e il pavimento è la differenza fra un riparo e una casa.
const CURA_NEL_LETTO = 3;

// Come si racconta la morte. La causa non è un dettaglio di colore: senza,
// una schermata di morte dice "sei morto" e lascia al giocatore il compito di
// indovinare cosa avrebbe dovuto fare diversamente.
export const CAUSE = {
  fame: "di fame",
  sete: "di sete",
  stanchezza: "di sfinimento",
  freddo: "di freddo",
  infetti: "sbranato",
  animali: "ucciso da un animale",
  infezione: "d'infezione",
};

let livello = 1;
let morto = false;
let causa = null;
let infezione = false;
let esposizioneFreddo = 0;

// Quanto danno ha fatto ciascuna causa da quando questo superstite è vivo.
// Serve a nominare la morte onestamente: chi aveva fame da due giorni e sete
// da dieci secondi è morto di fame, anche se l'ultimo colpo l'ha dato la
// sete. Nominare l'ultima causa sarebbe più facile da scrivere e più facile
// da sbagliare.
const danni = { fame: 0, sete: 0, stanchezza: 0, freddo: 0, infetti: 0, animali: 0, infezione: 0 };

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
// Integrale del danno: ogni tratto paga solo il proprio moltiplicatore,
// anche se una chiamata attraversa entrambe le soglie.
// Con "gradini" falso il freddo non peggiora col tempo: fa male uguale dal
// primo secondo all'ultimo. È quello che fa una pelliccia, e non è immunità —
// si muore lo stesso, in 225 secondi invece che in 90. La differenza è che
// una notte invernale (125 secondi) si attraversa invece di finirci dentro.
//
// Chi decide sta fuori: questo modulo riceve un booleano e non sa cosa sia una
// pelliccia, come non sa cosa sia un falò.
function doseFreddo(secondi, gradini = true) {
  if (!gradini) return secondi;
  return Math.min(secondi,15) + 2*Math.min(Math.max(0,secondi-15),15) + 3*Math.max(0,secondi-30);
}
export function secondiEsposto() { return esposizioneFreddo; }
export function moltiplicatoreFreddo(protetto = false) {
  if (protetto) return 1;
  return esposizioneFreddo >= 30 ? 3 : esposizioneFreddo >= 15 ? 2 : 1;
}

export function avanza(passo, { vuoti = [], alFreddo = false, protetto = false, mite = false, nelLetto = false } = {}) {
  if (morto || !Number.isFinite(passo) || passo <= 0) return null;

  for (const quale of vuoti) ferisci(quale, DANNO_VUOTO * passo);
  if (alFreddo && mite) {
    // Il bagnato non sale di gradino, e non fa salire nemmeno il contatore:
    // altrimenti una giornata di pioggia si pagherebbe la notte dopo, cioè la
    // condanna tornerebbe rimandata invece che tolta. Il contatore non si
    // azzera però — chi era già al secondo gradino per il gelo se lo tiene.
    ferisci("freddo", DANNO_FREDDO * FREDDO_MITE * passo);
  } else if (alFreddo) {
    const fine = esposizioneFreddo + passo;
    // L'esposizione continua ad accumularsi anche protetti, ed è voluto: chi
    // si spoglia — o si bagna — dopo due minuti deve trovarsi i gradini già
    // saliti, non un contatore azzerato. Il contatore misura quanto sei stato
    // al freddo, non quanto ti è costato.
    ferisci("freddo", DANNO_FREDDO * (doseFreddo(fine, !protetto)-doseFreddo(esposizioneFreddo, !protetto)));
    esposizioneFreddo = Math.min(30,fine);
    // Elimina soltanto il rumore di somma dei fotogrammi vicino alle soglie.
    for (const soglia of [15,30]) if (Math.abs(esposizioneFreddo-soglia)<1e-9) esposizioneFreddo=soglia;
  } else esposizioneFreddo = 0;
  if (infezione && !nelLetto) ferisci("infezione", DANNO_INFEZIONE * passo);

  // Si guarisce solo quando non manca niente, non si gela e non si è
  // infetti. Non è una cura a metà: o il corpo ha tutto quello che gli serve,
  // o sta pagando. Ed è il motivo per cui l'infezione va curata e non
  // aspettata — finché c'è, niente si rimargina.
  if (vuoti.length === 0 && !alFreddo && !infezione) {
    livello = limita(livello + CURA * (nelLetto ? CURA_NEL_LETTO : 1) * passo);
  }

  return controllaLaMorte();
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
  esposizioneFreddo = 0;
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
export function ripristina(salvata, infetta = false, esposizione = 0) {
  reimposta();
  if (Number.isFinite(salvata)) livello = limita(salvata);
  // L'infezione sì che si salva, al contrario della morte: è uno stato in cui
  // si vive, e riprendere una partita guariti per il fatto di averla chiusa
  // sarebbe il modo più comodo di curarsi che esista.
  infezione = infetta === true;
  esposizioneFreddo = Number.isFinite(esposizione) ? Math.max(0,Math.min(30,esposizione)) : 0;
}

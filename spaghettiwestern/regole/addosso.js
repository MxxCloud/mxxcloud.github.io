// Quello che il superstite si porta addosso. Una cosa per volta.
//
// PERCHÉ UN MODULO E NON UN CAMPO DELL'EROE. Chi deve sapere della pelliccia è
// il freddo, e `salute.avanza(passo, { vuoti, alFreddo })` non riceve l'eroe:
// riceve un booleano. L'unico modo perché un capo arrivi fin là è un posto che
// le regole possano interrogare da sole, ed è la stessa forma di riparo.js —
// un modulo minuscolo che risponde a una domanda e basta. Metterlo sull'eroe
// avrebbe voluto dire far passare l'eroe attraverso tre funzioni che non lo
// vogliono, o riscrivere la tappa.
//
// E PERCHÉ NON È UNA NONA CASELLA. `CASELLE = 8` non è una costante, è
// un'invariante: otto tasti in comandi.js, la griglia della cassa, la
// validazione del salvataggio. Una nona casella che i tasti non selezionano e
// che la cassa deve saltare sarebbe un'eccezione in cinque file.
//
// Questo modulo non importa inventario.js di proposito: indossare è un gesto
// che sposta roba, e i gesti stanno in azioni.js. Se il travaso stesse qui, la
// stessa mossa esisterebbe in due posti. Non importa nemmeno meteo.js, che
// invece deve poter chiedere qui: la regola "una pelliccia zuppa non scalda"
// sta dove si conta il freddo, non dove si tiene il capo.
import { CATALOGO } from "./oggetti.js";

// Una casella come quelle dello zaino, non una stringa. Costa un livello di
// indirezione oggi e lo ripaga il giorno che un capo avrà degli usi o una
// data: l'HUD lo disegna con la stessa funzione delle altre caselle, e il
// cadavere se lo prende senza convertire niente.
let capo = null;

export const indossato = () => capo;
export const dati = () => (capo ? CATALOGO[capo.cosa]?.addosso ?? null : null);
// Il catalogo è anche il predicato: se una cosa ha "addosso", si indossa.
export const indossabile = (cosa) => CATALOGO[cosa]?.addosso !== undefined;

// Mettono e tolgono, e non toccano lo zaino: chi chiama deve occuparsi del
// travaso, perché è lui che sa se c'è posto. Restituiscono quello che c'era
// prima, che è l'unica cosa che serve per fare lo scambio in una riga sola.
export function indossa(cosa) {
  if (!indossabile(cosa)) return undefined;
  const prima = capo;
  capo = { cosa };
  return prima;
}
export function togliDiDosso() {
  const prima = capo;
  capo = null;
  return prima;
}
export function reimposta() { capo = null; }

// --- il salvataggio -------------------------------------------------------

export function istantanea() { return capo ? { ...capo } : null; }

// Severo come il resto di salvataggio.js, e con un controllo in più che vale
// la pena nominare: non basta che l'oggetto esista, deve essere indossabile.
// Un salvataggio che dichiara una pietra addosso è storto, e va rifiutato
// prima di toccare la partita — non dopo, quando ci si ritrova con un sasso
// indosso che non protegge da niente e non si sa come sia arrivato lì.
export function statoValido(v) {
  if (v === null || v === undefined) return true;
  return typeof v === "object" && typeof v.cosa === "string" && indossabile(v.cosa);
}

// Indulgente come inventario.ripristina(): quello che non passa diventa niente.
// Un capo storto deve costare un capo, non una partita.
export function ripristina(stato) {
  capo = statoValido(stato) && stato ? { cosa: stato.cosa } : null;
}

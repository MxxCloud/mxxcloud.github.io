// Il diario (M7.18.64): cosa è successo, e perché.
//
// Fino a qui le notizie del mattino passavano da una catena di "se no": se ne
// diceva una sola, la più grave. Una notte in cui morivano dei polli e
// seccava l'orto lasciava sapere dei polli, e dell'orto niente — e il
// messaggio del risveglio, arrivando per ultimo, copriva anche quella. In un
// gioco con tante regole perdere un'informazione vuol dire non capire le
// conseguenze delle proprie scelte, che è la cosa che il gioco ha da
// insegnare.
//
// Adesso le notizie sono tutte: l'annuncio dice la più grave e quante altre
// ce ne sono, e il diario le tiene, con il giorno e l'ora. Ci finisce quello
// che succede quando non guardi, o che ha una causa da ricordare — non le
// scritte di un istante come "+1 legna".
//
// Si salva con la partita, e resta da un superstite all'altro: la valle è la
// stessa, e chi ricomincia vuole sapere cosa è successo a chi c'era prima.
import * as tempo from "./tempo.js";

// Quaranta voci: qualche giorno di partita. Un diario che tiene tutto diventa
// un archivio, e un archivio non lo legge nessuno.
export const MASSIMO = 40;
const LUNGHEZZA = 120;

const GRIGIO = "#c9b189";
const ROSSO = "#c0705f";
const VERDE = "#9ec97e";

let righe = [];

export function scrivi(testo, colore = GRIGIO) {
  righe.push({ giorno: tempo.giornoCorrente(), ora: tempo.oraCorrente(), testo: String(testo).slice(0, LUNGHEZZA), colore });
  if (righe.length > MASSIMO) righe = righe.slice(-MASSIMO);
}

// Dalla più recente.
export function voci() {
  return righe.slice().reverse();
}

export function quante() {
  return righe.length;
}

export function stato() {
  return righe.map((r) => ({ ...r }));
}

const COLORE = /^#[0-9a-f]{6}$/i;
export function statoValido(s) {
  return Array.isArray(s) && s.length <= MASSIMO && s.every((r) => r && typeof r === "object"
    && Number.isInteger(r.giorno) && r.giorno >= 1
    && Number.isFinite(r.ora) && r.ora >= 0 && r.ora < 24
    && typeof r.testo === "string" && r.testo.length <= LUNGHEZZA
    && typeof r.colore === "string" && COLORE.test(r.colore));
}

export function ripristina(s) {
  righe = statoValido(s) ? s.map((r) => ({ ...r })) : [];
}

export function reimposta() {
  righe = [];
}

// --- le notizie del mattino ------------------------------------------------

// Tutte le notizie di un resoconto (simulazione.resoconto()), nell'ordine di
// gravità. È la catena che stava in gioco.js, con gli stessi testi e gli
// stessi colori: la prima è esattamente quello che prima si annunciava.
// "arrivata" è il nome della stagione appena cominciata e "arrivo" la sua
// frase; "canicola" dice se oggi va detta (una volta al giorno, e solo a
// schermo libero: lo decide chi chiama).
export function notizie(r, { arrivata = null, arrivo = null, canicola = false } = {}) {
  const n = [];
  const di = (testo, colore) => n.push({ testo, colore });
  // I polli per primi: un animale morto è la notizia più grave del mattino, e
  // ognuna ha il suo rimedio — il pollaio, il mangime, il recinto.
  if (r.polliDiFreddo > 0) di(`il freddo si è portato via dei polli: ${r.polliDiFreddo}`, ROSSO);
  if (r.polliDiFame > 0) di(`dei polli sono morti di fame: ${r.polliDiFame}`, ROSSO);
  if (r.polliNelloZaino > 0) di("il pollo nello zaino è morto", ROSSO);
  if (r.pulciniPersi > 0) di(r.pulciniPersi === 1 ? "un pulcino fuori dal recinto non ha passato la notte"
    : `dei pulcini fuori dal recinto non hanno passato la notte: ${r.pulciniPersi}`, ROSSO);
  if (r.polliScappati > 0) di(`dei polli sono scappati: ${r.polliScappati}`, ROSSO);
  // La stagione che si porta via il campo si dice in una frase sola invece
  // che in due.
  if (r.appassite > 0 && arrivata) di(`${arrivata}: l'orto è morto`, ROSSO);
  // La sete prima del marcire: è l'unica delle due che si poteva evitare
  // stamattina con un secchio.
  if (r.seccate > 0) di(`l'orto è seccato: ${r.seccate}`, ROSSO);
  // Il buio accanto alla sete: si poteva evitare anche questo.
  if (r.alBuio > 0) di(`al chiuso l'orto è morto: ${r.alBuio}`, ROSSO);
  if (r.alChiuso > 0) di(`al chiuso l'orto non cresce: ${r.alChiuso}`, GRIGIO);
  // Le bestie dopo la sete e prima del marcire, per la stessa ragione.
  if (r.mangiate > 0) di(`le bestie hanno mangiato l'orto: ${r.mangiate}`, ROSSO);
  // I parassiti (M7.18.42): prima i morti, poi il contagio, poi lo scoppio.
  if (r.parassitiUccise > 0) di(`i parassiti hanno ucciso delle piante: ${r.parassitiUccise}`, ROSSO);
  if (r.parassitiContagiate > 0) di(`i parassiti si allargano: ${r.parassitiContagiate}`, ROSSO);
  if (r.parassitiNuovi > 0) di("i parassiti sono nell'orto: estirpa o spargi cenere", ROSSO);
  if (r.appassite > 0 && !arrivata) di(`l'orto è marcito: ${r.appassite}`, ROSSO);
  if (arrivata && !(r.appassite > 0)) di(arrivo, GRIGIO);
  // Il cibo guasto prima del fuoco spento: un fuoco si riaccende, del cibo
  // andato non torna niente.
  if (r.guaste > 0) di(`si è guastato del cibo: ${r.guaste}`, ROSSO);
  // Il fuoco spento con la sua causa, perché ognuna ha il suo rimedio. La
  // legna prima della pioggia: è il fuoco di casa.
  if (r.spentiLegna > 0) di("il fuoco ha finito la legna", ROSSO);
  if (r.spentiPioggia > 0) di("la pioggia ha spento il fuoco", ROSSO);
  if (r.torceFinite > 0) di("la torcia si è consumata", ROSSO);
  // Gli avvisi dopo i fatti: parlano di oggi e di stanotte.
  if (r.polliAffamati > 0) di(`i polli hanno fame: ${r.polliAffamati}`, GRIGIO);
  if (r.polloDomani > 0) di("il pollo nello zaino non passa un'altra notte", GRIGIO);
  // La canicola (M7.18.42) prima della sete: dice la stessa cosa più forte.
  if (canicola) di("oggi canicola: chi non beve, secca", "#e0704a");
  if (r.assetate > 0) di(`l'orto ha sete: ${r.assetate}`, GRIGIO);
  if (r.inScadenza > 0) di("del cibo sta per guastarsi", GRIGIO);
  if (r.aSeme > 0) di(`l'orto è andato a seme: ${r.aSeme}`, GRIGIO);
  if (r.cresciute > 0) di("l'orto è cresciuto", VERDE);
  // Le buone notizie del pollaio, dopo quelle dell'orto.
  if (r.pulciniNati > 0) di(r.pulciniNati === 1 ? "è nato un pulcino" : `sono nati dei pulcini: ${r.pulciniNati}`, VERDE);
  if (r.pulciniCresciuti?.length > 0) di(`un pulcino è cresciuto: ${r.pulciniCresciuti[0]}`, VERDE);
  if (r.uovaDeposte > 0) di(`nel pollaio ci sono uova: +${r.uovaDeposte}`, VERDE);
  // Ultima: la valle si è rimessa a posto da sola.
  if (r.tornati > 0) di(`la valle è ricresciuta: ${r.tornati}`, "#7fae63");
  return n;
}

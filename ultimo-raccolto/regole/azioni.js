// Quello che il giocatore fa al mondo: raccogliere e posare.

import * as schermo from "../motore/schermo.js";
import * as mappa from "../mondo/mappa.js";
import * as modifiche from "../mondo/modifiche.js";
import * as inventario from "./inventario.js";
import { impronta } from "../motore/casuale.js";
import { OGGETTO, TERRENO } from "../mondo/generazione.js";
import * as tempo from "./tempo.js";
import * as bisogni from "./bisogni.js";
import * as salute from "./salute.js";
import { CATALOGO, ATTREZZI, raccoltaDi, colpiNecessari } from "./oggetti.js";
import * as orto from "./orto.js";
import * as stagioni from "./stagioni.js";

const { TASSELLO } = schermo;

const SCARTI = {
  su: [0, -1],
  giu: [0, 1],
  sinistra: [-1, 0],
  destra: [1, 0],
};

// Il tassello davanti ai piedi, non quello sotto: si agisce su ciò che si ha
// di fronte, che è anche l'unico modo di posare un falò senza restarci dentro.
export function bersaglio(eroe) {
  const [dx, dy] = SCARTI[eroe.guarda] ?? SCARTI.giu;
  const tx = Math.floor(eroe.px / TASSELLO) + dx;
  const ty = Math.floor(eroe.py / TASSELLO) + dy;
  return { tx, ty, oggetto: mappa.oggettoDi(tx, ty) };
}

// Cosa succederebbe premendo adesso il tasto. Serve all'interfaccia, che deve
// poterlo dire prima invece di lasciare indovinare.
// Quanto ristora un sorso. Bastano un paio di volte al giorno, che è il
// ritmo giusto perché bere sia un gesto e non un lavoro.
const SORSO = 0.45;

export function azionePossibile(eroe, cosaInMano) {
  const b = bersaglio(eroe);

  // Di notte il giaciglio accoglie, di giorno si smonta. Un giaciglio che di
  // notte si smonta invece di accogliere sarebbe una trappola; e dormire di
  // giorno salterebbe la giornata invece della notte, che è il contrario di
  // quello che serve.
  if (b.oggetto === OGGETTO.GIACIGLIO && tempo.eNotte()) {
    return { tipo: "dormi", verbo: "Dormi", bersaglio: b };
  }

  // Prima di tutto il resto: un mucchio sta per terra e non copre niente, e
  // chi ci si mette davanti lo sta guardando per riprenderselo.
  if (b.oggetto === OGGETTO.MUCCHIO) {
    return { tipo: "prendi", verbo: "Prendi", bersaglio: b };
  }

  // Il corpo del superstite di prima. "Fruga" e non "Prendi" perché non è la
  // stessa cosa: un mucchio contiene quello che ci hai messo, un cadavere
  // contiene tutto quello che avevi addosso quando sei caduto, e il verbo è
  // l'unico posto in cui dirlo prima che il giocatore prema il tasto.
  if (b.oggetto === OGGETTO.CADAVERE) {
    return { tipo: "fruga", verbo: "Fruga", bersaglio: b };
  }

  const raccolta = raccoltaDi(b.oggetto);
  if (raccolta) {
    const dati = modifiche.di(b.tx, b.ty);
    const gia = dati?.colpi ?? 0;
    // Mai sotto uno: chi comincia a mani nude e passa all'ascia ha già dato
    // più colpi di quanti ne servano, e "restano 0" sarebbe una bugia.
    const restano = Math.max(1, colpiNecessari(b.oggetto, cosaInMano) - gia);
    return { tipo: "raccogli", verbo: raccolta.verbo, restano, bersaglio: b };
  }
  const terreno = mappa.terrenoDi(b.tx, b.ty);
  const acqua = terreno === TERRENO.ACQUA || terreno === TERRENO.ACQUA_BASSA;

  // Alla riva: con un secchio vuoto in mano si riempie, altrimenti si beve.
  // Decide quello che si ha in mano, come per tutto il resto — non il
  // contesto, che costringerebbe a indovinare.
  if (acqua && cosaInMano === "secchio") {
    return { tipo: "riempi", verbo: "Riempi i secchi", bersaglio: b };
  }
  if (acqua) {
    if (bisogni.livello("sete") < 1) {
      return { tipo: "bevi", verbo: "Bevi", bersaglio: b };
    }
    return null;
  }

  // La zappa non accorcia un lavoro: ne apre uno che senza di lei non
  // esiste.
  if (ATTREZZI[cosaInMano]?.zappa && b.oggetto === OGGETTO.NESSUNO && zappabile(terreno)) {
    return { tipo: "zappa", verbo: "Zappa", bersaglio: b };
  }

  if (cosaInMano === "semi" && b.oggetto === OGGETTO.TERRA_ZAPPATA) {
    // Zappare d'inverno resta permesso — preparare il campo per la primavera è
    // una cosa sensata da fare — ma seminare no: il seme morirebbe la notte
    // stessa, e farglielo scoprire dopo sarebbe una trappola travestita da
    // regola.
    if (!stagioni.siColtiva()) {
      return { tipo: "semina", verbo: "Semina", impedito: "d'inverno non germoglia", bersaglio: b };
    }
    return { tipo: "semina", verbo: "Semina", bersaglio: b };
  }

  if (cosaInMano === "secchio_pieno" && orto.siPuoInnaffiare(b.oggetto)) {
    const gia = modifiche.di(b.tx, b.ty)?.bagnato === true;
    if (!gia) return { tipo: "innaffia", verbo: "Innaffia", bersaglio: b };
    return null;
  }

  const posa = cosaInMano && CATALOGO[cosaInMano]?.posa;
  if (posa !== undefined && posa !== null && posabile(b)) {
    return { tipo: "posa", verbo: "Posa", cosa: cosaInMano, bersaglio: b };
  }
  return null;
}

// Si zappa dove cresce qualcosa di erbaceo, non sulla roccia né sulla
// sabbia: un orto ha bisogno di terra, e dirlo con i terreni invece che con
// un messaggio evita di spiegarlo.
function zappabile(terreno) {
  return terreno === TERRENO.ERBA || terreno === TERRENO.STERPAGLIA || terreno === TERRENO.TERRA;
}

function posabile(b) {
  if (b.oggetto !== OGGETTO.NESSUNO) return false;
  // Non si costruisce nell'acqua. Il resto del terreno va bene: la roccia è
  // sassosa, non è una parete.
  return !mappa.solidoIn(b.tx, b.ty);
}

// --- mucchi per terra -----------------------------------------------------

// Mettere qualcosa per terra. Un tassello regge un mucchio solo, quindi o è
// libero, o contiene già la stessa cosa e allora si sommano: due mucchi di
// legna affiancati sarebbero soltanto due tasselli occupati.
function deponi(tx, ty, cosa, quante) {
  const oggetto = mappa.oggettoDi(tx, ty);
  if (oggetto === OGGETTO.MUCCHIO) {
    const dati = modifiche.di(tx, ty);
    if (dati?.cosa !== cosa) return false;
    mappa.cambiaTassello(tx, ty, { oggetto: OGGETTO.MUCCHIO, cosa, quante: dati.quante + quante });
    return true;
  }
  if (oggetto !== OGGETTO.NESSUNO || mappa.solidoIn(tx, ty)) return false;
  mappa.cambiaTassello(tx, ty, { oggetto: OGGETTO.MUCCHIO, cosa, quante });
  return true;
}

// Il tassello indicato, altrimenti uno degli otto attorno. Serve a quello che
// avanza da un raccolto: la roba cade dove è cresciuta, e se lì non c'è posto
// cade accanto invece di svanire.
const INTORNO = [
  [0, 0], [0, -1], [1, 0], [0, 1], [-1, 0],
  [-1, -1], [1, -1], [1, 1], [-1, 1],
];

function deponiVicino(tx, ty, cosa, quante) {
  for (const [dx, dy] of INTORNO) {
    if (deponi(tx + dx, ty + dy, cosa, quante)) return { tx: tx + dx, ty: ty + dy };
  }
  return null;
}

// Gettare: si svuota una casella intera davanti ai piedi. Sta su un tasto suo
// e non sulla barra perché la barra è già contesa da otto azioni che
// dipendono dal contesto — con la zappa in mano davanti all'erba la barra
// zappa, e non ci sarebbe verso di posare la zappa su un prato.
export function getta(eroe, indice) {
  const casella = inventario.contenuto()[indice];
  if (!casella) return null;

  const { tx, ty } = bersaglio(eroe);
  if (!deponi(tx, ty, casella.cosa, casella.quantita)) return { tipo: "nonCePosto" };

  inventario.svuotaCasella(indice);
  return { tipo: "gettato", cosa: casella.cosa, quante: casella.quantita, tx, ty };
}

// --- il cadavere ----------------------------------------------------------

// Dove si è caduti, o il più vicino possibile. Si allarga ad anelli invece di
// fermarsi agli otto tasselli attorno perché qui non si può fallire: quello
// che il cadavere non riceve è tutto quello che il superstite aveva addosso,
// e perderlo per un albero messo male sarebbe la peggiore delle punizioni —
// invisibile e senza rimedio.
const RAGGIO_CADAVERE = 6;

function postoPerIlCorpo(tx0, ty0) {
  for (let raggio = 0; raggio <= RAGGIO_CADAVERE; raggio += 1) {
    for (let dy = -raggio; dy <= raggio; dy += 1) {
      for (let dx = -raggio; dx <= raggio; dx += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== raggio) continue;
        const tx = tx0 + dx;
        const ty = ty0 + dy;
        if (mappa.oggettoDi(tx, ty) !== OGGETTO.NESSUNO) continue;
        if (mappa.solidoIn(tx, ty)) continue;
        return { tx, ty };
      }
    }
  }
  return null;
}

// Il superstite cade e lascia lì il corpo con tutto quello che portava. Lo
// zaino si svuota qui e non altrove: il corpo e lo zaino sono la stessa roba
// in due posti diversi, e svuotarlo in un altro file vorrebbe dire poterlo
// dimenticare.
//
// Il cadavere non si degrada, come non si degradano i mucchi, e per la stessa
// ragione scritta nel README: finché non esistono i contenitori, farlo marcire
// toglierebbe l'unico ripostiglio che c'è. Qui però la ragione è più forte —
// un cadavere che marcisce prima che tu riesca a tornarci non è una regola,
// è una porta chiusa.
export function lasciaIlCadavere(eroe, giorno) {
  const roba = inventario
    .contenuto()
    .filter(Boolean)
    .map((casella) => ({ cosa: casella.cosa, quantita: casella.quantita }));
  inventario.svuota();

  const tx0 = Math.floor(eroe.px / TASSELLO);
  const ty0 = Math.floor(eroe.py / TASSELLO);
  const posto = postoPerIlCorpo(tx0, ty0);
  if (!posto) return null;

  mappa.cambiaTassello(posto.tx, posto.ty, { oggetto: OGGETTO.CADAVERE, roba, giorno });
  return { ...posto, quante: roba.length };
}

// L'esito della raccolta è deciso dalle coordinate, non dal caso del momento:
// lo stesso cespuglio ha le bacche o non le ha, sempre. Oltre a rispettare la
// regola che qui Math.random non esiste, rende il mondo una cosa che si può
// imparare invece di una lotteria.
function resaDi(raccolta, tx, ty) {
  const seme = mappa.semeCorrente().valore;
  const ottenuto = [];
  raccolta.resa.forEach((voce, i) => {
    if (voce.probabilita !== undefined) {
      if (impronta(tx + i * 101, ty - i * 57, seme ^ 0x3c6ef372) > voce.probabilita) return;
    }
    ottenuto.push({ cosa: voce.cosa, quante: voce.quante });
  });
  return ottenuto;
}

// Usare quello che si ha in mano su di sé. Sta fuori da agisci() perché non
// ha un bersaglio: mangiare non ha un davanti, e infilarlo nella barra
// avrebbe voluto dire decidere se si mangia o si abbatte l'albero che si ha
// di fronte. Servirà anche alle bende, quando ci sarà qualcosa che ferisce.
export function consuma(cosaInMano) {
  const effetto = cosaInMano && CATALOGO[cosaInMano]?.commestibile;
  if (!effetto) return null;
  if (!inventario.togli(cosaInMano, 1)) return null;

  const ristorato = {};
  for (const [quale, quanto] of Object.entries(effetto)) {
    ristorato[quale] = bisogni.ristora(quale, quanto);
  }
  return { tipo: "consumato", cosa: cosaInMano, ristorato };
}

// Restituisce un resoconto di cosa è successo, perché l'interfaccia deve
// poterlo dire al giocatore: un colpo che non ottiene niente e un colpo che
// abbatte un albero non possono sembrare lo stesso gesto.
export function agisci(eroe, cosaInMano) {
  const azione = azionePossibile(eroe, cosaInMano);
  if (!azione || azione.impedito) return null;

  const { tx, ty } = azione.bersaglio;

  if (azione.tipo === "bevi") {
    bisogni.ristora("sete", SORSO);
    return { tipo: "bevi" };
  }

  if (azione.tipo === "prendi") {
    const dati = modifiche.di(tx, ty);
    if (!dati) return null;
    // Si prende quello che ci sta, e il resto resta lì. Far sparire un mucchio
    // perché lo zaino era pieno sarebbe lo stesso difetto da cui nascono i
    // mucchi.
    const resto = inventario.aggiungi(dati.cosa, dati.quante);
    if (resto === dati.quante) return { tipo: "zainoPieno" };
    if (resto > 0) {
      mappa.cambiaTassello(tx, ty, { oggetto: OGGETTO.MUCCHIO, cosa: dati.cosa, quante: resto });
    } else {
      mappa.cambiaTassello(tx, ty, { oggetto: OGGETTO.NESSUNO });
    }
    return { tipo: "preso", cosa: dati.cosa, quante: dati.quante - resto, resta: resto };
  }

  if (azione.tipo === "fruga") {
    const dati = modifiche.di(tx, ty);
    const roba = Array.isArray(dati?.roba) ? dati.roba : [];

    // Si prende quello che ci sta e il resto resta addosso al corpo, casella
    // per casella: è la stessa regola del mucchio, ma qui serve di più — chi
    // torna a riprendersi otto caselle con lo zaino mezzo pieno deve poter
    // fare due viaggi invece di scegliere cosa perdere.
    const rimasto = [];
    const presi = [];
    for (const voce of roba) {
      const resto = inventario.aggiungi(voce.cosa, voce.quantita);
      if (resto < voce.quantita) presi.push({ cosa: voce.cosa, quante: voce.quantita - resto });
      if (resto > 0) rimasto.push({ cosa: voce.cosa, quantita: resto });
    }

    if (presi.length === 0 && rimasto.length > 0) return { tipo: "zainoPieno" };

    // Il corpo sparisce solo quando è vuoto. Un cadavere spogliato che resta
    // lì sarebbe un secondo lutto senza informazione: quello che c'era da
    // dire l'ha già detto.
    if (rimasto.length > 0) mappa.cambiaTassello(tx, ty, { ...dati, roba: rimasto });
    else mappa.cambiaTassello(tx, ty, { oggetto: OGGETTO.NESSUNO });

    return { tipo: "frugato", presi, resta: rimasto.length };
  }

  if (azione.tipo === "riempi") {
    // Si riempiono tutti in una volta: andare avanti e indietro una volta per
    // secchio sarebbe una passeggiata obbligatoria, non una scelta.
    const quanti = inventario.quante("secchio");
    if (quanti === 0) return null;
    inventario.togli("secchio", quanti);
    inventario.aggiungi("secchio_pieno", quanti);
    return { tipo: "riempi", quanti };
  }

  if (azione.tipo === "zappa") {
    mappa.cambiaTassello(tx, ty, { oggetto: OGGETTO.TERRA_ZAPPATA });
    return { tipo: "zappa" };
  }

  if (azione.tipo === "semina") {
    if (!inventario.togli("semi", 1)) return null;
    mappa.cambiaTassello(tx, ty, { oggetto: OGGETTO.SEMINATO });
    return { tipo: "semina" };
  }

  if (azione.tipo === "innaffia") {
    if (!inventario.togli("secchio_pieno", 1)) return null;
    inventario.aggiungi("secchio", 1);
    orto.innaffia(tx, ty, azione.bersaglio.oggetto);
    return { tipo: "innaffia" };
  }

  if (azione.tipo === "dormi") {
    // Il tempo saltato si paga: si salta la notte, non il proprio
    // metabolismo. Senza questo, dormire sarebbe un tasto per far sparire i
    // problemi invece di una scelta fra riposare e restare svegli.
    const secondi = tempo.secondiFinoAlle(tempo.ALBA_PIENA);
    tempo.avanza(secondi);
    bisogni.passanoSecondi(secondi);
    // Anche la salute paga la notte saltata: chi si corica con la fame a zero
    // non deve poterla dormire senza conseguenze, che sarebbe il modo più
    // comodo di rendere innocua l'unica cosa che uccide.
    //
    // Il freddo invece la notte non la fa: dormire la salta, e saltarla
    // significa saltare il gelo. È un secondo mestiere per il giaciglio che
    // non costa una riga — d'inverno si sceglie fra accendere un fuoco e
    // andare a letto, ed entrambe sono cose che bisogna essersi costruiti.
    salute.passanoSecondi(secondi, { vuoti: bisogni.vuoti() });
    bisogni.ristora("stanchezza", 1);
    return { tipo: "dormi", secondi };
  }

  if (azione.tipo === "posa") {
    if (!inventario.togli(azione.cosa, 1)) return null;
    // Il giorno in cui è stato posato resta scritto sul tassello: è quello che
    // permette ai fuochi di consumarsi invece di restare accesi per sempre.
    mappa.cambiaTassello(tx, ty, {
      oggetto: CATALOGO[azione.cosa].posa,
      posata: tempo.giornoCorrente(),
    });
    return { tipo: "posa", tx, ty, cosa: azione.cosa };
  }

  const oggetto = azione.bersaglio.oggetto;
  const raccolta = raccoltaDi(oggetto);
  const precedente = modifiche.di(tx, ty) ?? {};
  const colpi = (precedente.colpi ?? 0) + 1;
  const necessari = colpiNecessari(oggetto, cosaInMano);

  if (colpi < necessari) {
    // Annota e basta: l'albero è ancora lo stesso albero, quindi il settore
    // non va ricotto — e se lo fosse, cancellerebbe il tremolio appena
    // cominciato.
    mappa.annotaTassello(tx, ty, { ...precedente, colpi });
    return { tipo: "colpo", tx, ty, scheggie: raccolta.scheggie, restano: necessari - colpi };
  }

  const ottenuto = resaDi(raccolta, tx, ty);
  const avanzate = [];
  for (const voce of ottenuto) {
    const resto = inventario.aggiungi(voce.cosa, voce.quante);
    if (resto > 0) avanzate.push({ cosa: voce.cosa, quante: resto });
  }

  // Il tassello si libera per primo, così quello che avanza può cadere proprio
  // lì: è dove il giocatore sta già guardando.
  mappa.cambiaTassello(tx, ty, { oggetto: OGGETTO.NESSUNO });

  // Quello che non ci sta resta per terra invece di sparire. Prima spariva, e
  // "zaino pieno, perso qualcosa" era un messaggio che annunciava un danno
  // senza offrire niente da farci: il mondo si riprende quello che è tuo, ma
  // non deve mangiarselo mentre guardi.
  const perse = [];
  for (const voce of avanzate) {
    if (!deponiVicino(tx, ty, voce.cosa, voce.quante)) perse.push(voce);
  }

  return { tipo: "raccolto", tx, ty, scheggie: raccolta.scheggie, ottenuto, avanzate, perse };
}

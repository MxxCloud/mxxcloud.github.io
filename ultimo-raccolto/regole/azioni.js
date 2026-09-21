// Quello che il giocatore fa al mondo: raccogliere e posare.

import * as schermo from "../motore/schermo.js";
import * as mappa from "../mondo/mappa.js";
import * as modifiche from "../mondo/modifiche.js";
import * as inventario from "./inventario.js";
import * as addosso from "./addosso.js";
import { impronta } from "../motore/casuale.js";
import { OGGETTO, TERRENO } from "../mondo/generazione.js";
import * as tempo from "./tempo.js";
import * as riposo from "./riposo.js";
import * as bisogni from "./bisogni.js";
import * as salute from "./salute.js";
import { CATALOGO, ATTREZZI, raccoltaDi, colpiNecessari, dannoDi, portataDi, attrezzoServe } from "./oggetti.js";
import * as fauna from "./fauna.js";
import * as infetti from "./infetti.js";
import * as urti from "../entita/urti.js";
import * as chiasso from "./chiasso.js";
import * as orto from "./orto.js";
import * as contenitori from "./contenitori.js";
import * as stagioni from "./stagioni.js";
import * as simulazione from "./simulazione.js";
import * as entita from "../entita/entita.js";
import * as meteo from "./meteo.js";
import * as freddo from "./freddo.js";
import * as pesca from "./pesca.js";

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

const COLPI_DURI = new Set([OGGETTO.ALBERO, OGGETTO.SASSO, OGGETTO.MURO, OGGETTO.MURO_ROTTO, OGGETTO.BANCO, OGGETTO.CARRO, OGGETTO.TRONCO]);

// Su cosa si dorme, e quanto rende. Due letti e due condizioni: scritto come
// ternario annidato — `inverno ? (fuoco ? x : y) : z` — reggeva finché il letto
// era uno solo, e il giorno che ne arriva un terzo diventa illeggibile prima di
// essere sbagliato.
//
// Fuori dall'inverno i due letti valgono uguale, e non è pigrizia: quello che
// una pelliccia sotto la schiena toglie di mezzo è il freddo, e d'agosto non
// c'è niente da togliere. Pagare quattro volte tanto per dormire meglio a
// luglio sarebbe una ricetta che risponde a una domanda che nessuno fa.
//
// E le pelli danno RIPOSO, non CALORE: d'inverno senza fuoco si continua a
// prendere danno da gelo dormendoci sopra, esattamente come sulla paglia. Il
// calore è la tappa dopo, ed è di proposito che le due cose stanno separate.
const RIPOSO = {
  [OGGETTO.GIACIGLIO]: { conFuoco: 0.75, senza: 0.25 },
  [OGGETTO.GIACIGLIO_PELLI]: { conFuoco: 1, senza: 0.5 },
};
const LETTI = new Set(Object.keys(RIPOSO).map(Number));

// A che mestiere sta servendo l'attrezzo in questa azione, o null se l'azione
// non è lavoro da attrezzi: strappare un cespuglio, aprire una cassa, posare
// un falò non consumano niente e non chiedono niente.
function scopoDi(azione) {
  if (!azione) return null;
  if (azione.tipo === "combatti") return "combatti";
  if (azione.tipo === "macella") return "macella";
  if (azione.tipo === "zappa") return "zappa";
  if (azione.tipo === "pesca") return "pesca";
  if (azione.tipo === "raccogli" && COLPI_DURI.has(azione.bersaglio.oggetto)) return "raccolta";
  return null;
}

// Cosa si ha davvero in mano, per questo mestiere.
//
// Tre cose diventano mani nude qui dentro, ed è giusto che sia la stessa riga
// per tutte e tre: non avere niente, avere in mano un attrezzo rotto, e avere
// in mano un attrezzo che quel mestiere non lo fa — la lancia davanti a un
// albero, la zappa davanti a un infetto.
//
// UN ATTREZZO ROTTO NON TOGLIE IL GESTO. La prima stesura dell'usura lo
// impediva, e il difetto si vedeva nel momento peggiore: l'ascia che si rompe
// mentre uno ti è addosso faceva smettere di rispondere la barra, e bisognava
// cambiare casella con un infetto addosso. Adesso vale come un pugno — che è
// poco, ed è comunque il gesto che avevi in mano.
export function strumento(cosaInMano, indice, scopo) {
  if (!cosaInMano) return null;
  if (CATALOGO[cosaInMano]?.durata === undefined) return cosaInMano;
  if (scopo && !attrezzoServe(cosaInMano, scopo)) return null;
  const casella = inventario.attrezzo(cosaInMano, indice);
  return casella && inventario.usiRimasti(casella) > 0 ? cosaInMano : null;
}

export function azionePossibile(eroe, cosaInMano, indice) {
  // Prima di qualunque cosa, perché nel momento in cui uno ti è addosso non
  // esiste nient'altro da fare. Senza questa riga in cima, trovandosi un
  // infetto sopra un cespuglio la barra strappava il cespuglio — e sarebbe
  // stata l'ultima cosa fatta.
  const portata = portataDi(strumento(cosaInMano, indice, "combatti"));
  const infetto = infetti.quelloDavanti(eroe, portata);
  const animale = fauna.davanti(eroe, portata);
  // Il bersaglio più vicino: un animale non deve coprire un infetto addosso.
  const distanza = e => e ? Math.hypot(e.px-eroe.px,e.py-eroe.py) : Infinity;
  const addosso = distanza(infetto) <= distanza(animale) ? infetto : animale;
  if (addosso) {
    return { tipo: "combatti", verbo: addosso.specie ? "Colpisci " + fauna.SPECIE[addosso.specie].nome : "Colpisci", nemico: addosso };
  }

  // Una carcassa resta per terra due giorni, e in quei due giorni copre quello
  // che ha davanti. Passa davanti al mondo finché c'è da lavorarci; quando il
  // lavoro non si può fare — manca l'ascia, o non c'è posto per quello che ne
  // uscirebbe — torna davanti il mondo. Senza questa regola un bufalo caduto
  // sulla soglia teneva chiusa la porta di casa fino a dopodomani, e l'unico
  // modo di riaprirla era un'ascia che magari stava dentro.
  //
  // L'avviso non si perde: resta l'ultima risposta quando davanti non c'è
  // nient'altro da fare, che è il momento in cui serve davvero sentirsi dire
  // perché non succede niente.
  const carcassa = fauna.davanti(eroe, 24, true);
  const daMacellare = carcassa ? sullaCarcassa(carcassa, cosaInMano, indice) : null;
  if (daMacellare && !daMacellare.impedito) return daMacellare;

  return sulTassello(eroe, cosaInMano, indice) ?? daMacellare;
}

function sullaCarcassa(carcassa, cosaInMano, indice) {
  const lavorata = carcassa.resti !== null;
  const senzaAscia = !attrezzoServe(cosaInMano, "macella") || !strumento(cosaInMano, indice, "macella");
  return { tipo: lavorata ? "spoglia" : "macella", carcassa,
    verbo: (lavorata ? "Raccogli " : "Macella ") + fauna.SPECIE[carcassa.specie].nome,
    restano: lavorata ? undefined : 3-carcassa.tagli,
    impedito: !lavorata && senzaAscia ? "serve un'ascia funzionante"
      : !fauna.spazioPerIResti(carcassa) ? "zaino pieno" : null };
}

// Quello che si può fare al tassello che si ha davanti. Sta in una funzione
// sua perché la carcassa deve poterlo chiedere e poi farsi da parte, e perché
// qui dentro si esce da una dozzina di punti diversi: con un "return" solo
// in fondo la regola della carcassa andrebbe ripetuta a ognuno di essi.
function sulTassello(eroe, cosaInMano, indice) {
  const b = bersaglio(eroe);

  // Il pozzo d'inverno gela come tutto il resto. Non è una riva dove pescare e
  // non si porta via come un oggetto dello zaino.
  //
  // Reggerlo aperto tutto l'anno sarebbe stato comodo e sbagliato: la sete
  // d'inverno è il vincolo che l'acqua ghiacciata mette da M4, e un pozzo ogni
  // dieci celle l'avrebbe sciolto ovunque senza che nessuno l'avesse deciso.
  // Lo stato del gelo si chiede a mappa e non alle stagioni: il pozzo deve
  // ghiacciare nello stesso istante degli stagni, e due calendari che
  // rispondono alla stessa domanda prima o poi si contraddicono.
  if (b.oggetto === OGGETTO.POZZO) {
    const gelato = mappa.gelato() ? "il pozzo è gelato" : null;
    if (cosaInMano === "secchio") return { tipo: "riempi", verbo: "Attingi acqua", bersaglio: b, impedito: gelato };
    return { tipo: "bevi", verbo: "Bevi dal pozzo", bersaglio: b,
      impedito: gelato ?? (bisogni.livello("sete") >= 1 ? "non hai sete" : null) };
  }

  // Di giorno due ore; la notte fino alle sette. X smonta il letto.
  if (LETTI.has(b.oggetto)) {
    return { tipo: "dormi", verbo: tempo.eNotte() ? "Dormi fino alle 7" : "Riposa 2 ore", bersaglio: b };
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

  // La cassa si apre, e si apre sempre — anche vuota, che è l'unico momento in
  // cui ci si mette dentro la prima cosa. Sta prima del catalogo della
  // raccolta per la stessa ragione del falò: senza, "Raccogli" vincerebbe e
  // non ci sarebbe verso di aprirla.
  //
  // Smontarla è dentro la schermata e non qui: sono due gesti diversi su due
  // tasti diversi, e metterli tutti e due sulla barra vorrebbe dire una barra
  // che a volte apre e a volte si porta via il ripostiglio.
  if (b.oggetto === OGGETTO.CASSA) {
    return { tipo: "apri", verbo: "Apri", bersaglio: b };
  }

  // La porta si apre e si chiude, e sta qui sopra per la stessa ragione della
  // cassa: è l'unica cosa da fare a una porta che si ha davanti. Staccarla sta
  // su X, come smontare una cassa — due gesti diversi su due tasti diversi, e
  // soprattutto: il tasto che si preme di notte con qualcuno alle calcagna non
  // deve poter portare via la porta.
  if (b.oggetto === OGGETTO.PORTA) {
    return { tipo: "porta", verbo: "Apri", bersaglio: b };
  }
  if (b.oggetto === OGGETTO.PORTA_APERTA) {
    return { tipo: "porta", verbo: "Chiudi", bersaglio: b,
      impedito: occupato(b.tx, b.ty, eroe) ? "passaggio occupato" : null };
  }

  // Davanti al fuoco, con qualcosa di crudo in mano, si cucina invece di
  // raccogliere il falò. Decide quello che si ha in mano, come decide il
  // secchio alla riva: è la stessa regola scritta due volte in due punti, e
  // sta prima del catalogo della raccolta perché senza di essa il falò
  // acceso vincerebbe sempre con "Raccogli".
  const cotto = cosaInMano && CATALOGO[cosaInMano]?.cuoce;
  if (cotto && b.oggetto === OGGETTO.FALO_ACCESO) {
    return { tipo: "cucina", verbo: "Cucina", cosa: cosaInMano, diventa: cotto, bersaglio: b };
  }

  const raccolta = raccoltaDi(b.oggetto);
  if (raccolta) {
    const dati = modifiche.di(b.tx, b.ty);
    const gia = dati?.colpi ?? 0;
    // Mai sotto uno: chi comincia a mani nude e passa all'ascia ha già dato
    // più colpi di quanti ne servano, e "restano 0" sarebbe una bugia.
    // Con la lancia in mano si abbatte come a mani nude, e senza rovinarla:
    // strumento() lo sa, e qui si vede da solo nel numero di colpi che manca.
    const attrezzo = COLPI_DURI.has(b.oggetto) ? strumento(cosaInMano, indice, "raccolta") : cosaInMano;
    const restano = Math.max(1, colpiNecessari(b.oggetto, attrezzo) - gia);
    return { tipo: "raccogli", verbo: raccolta.verbo, restano, bersaglio: b };
  }
  const terreno = mappa.terrenoDi(b.tx, b.ty);
  const acqua = terreno === TERRENO.ACQUA || terreno === TERRENO.ACQUA_BASSA;

  if (strumento(cosaInMano, indice, "pesca") === "canna" && (acqua || terreno === TERRENO.GHIACCIO)) {
    const inCorso = pesca.stato();
    return { tipo: "pesca", verbo: inCorso ? "Ritira la lenza" : "Pesca", bersaglio: b,
      impedito: inCorso ? null : pesca.impedimento(b.tx, b.ty) };
  }
  if (terreno === TERRENO.GHIACCIO && (cosaInMano === "secchio" || bisogni.livello("sete") < 1)) {
    return { tipo: "ghiaccio", impedito: "ghiaccio: cerca acqua aperta", bersaglio: b };
  }

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
  if (ATTREZZI[strumento(cosaInMano, indice, "zappa")]?.zappa && b.oggetto === OGGETTO.NESSUNO && zappabile(terreno)) {
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
    // Sotto un albero il falò si accende anche mentre piove, ed è la seconda
    // metà del riparo debole: senza, la chioma rallentava l'acqua e non dava
    // niente da fare. Con, il viaggiatore ha il suo ciclo — ti infili nella
    // macchia, accendi, ti asciughi — e la pioggia diventa una cosa a cui si
    // reagisce invece di una cosa che si subisce.
    if (cosaInMano === "falo" && meteo.evento() === "pioggia" && !meteo.riparatoDallaPioggia(b.tx,b.ty))
      return { tipo: "posa", bersaglio: b, impedito: "piove: accendi il fuoco al chiuso o sotto gli alberi" };
    return { tipo: "posa", verbo: "Posa", cosa: cosaInMano, bersaglio: b,
      impedito: (cosaInMano === "muro" || cosaInMano === "porta") && occupato(b.tx, b.ty, eroe) ? "passaggio occupato" : null };
  }
  return null;
}

// Si zappa dove cresce qualcosa di erbaceo, non sulla roccia né sulla
// sabbia: un orto ha bisogno di terra, e dirlo con i terreni invece che con
// un messaggio evita di spiegarlo.
function zappabile(terreno) {
  return terreno === TERRENO.ERBA || terreno === TERRENO.STERPAGLIA || terreno === TERRENO.TERRA;
}

function occupato(tx, ty, eroe) {
  // Comprende l'eroe anche nei collaudi senza registro delle entità.
  return [eroe, ...entita.tutte(), ...fauna.tutte()].some(e => e &&
    e.px + urti.LARGHEZZA / 2 > tx * TASSELLO && e.px - urti.LARGHEZZA / 2 < (tx + 1) * TASSELLO &&
    e.py > ty * TASSELLO && e.py - urti.ALTEZZA < (ty + 1) * TASSELLO);
}

function posabile(b) {
  if (b.oggetto !== OGGETTO.NESSUNO) return false;
  // Non si costruisce nell'acqua. Il resto del terreno va bene: la roccia è
  // sassosa, non è una parete.
  const t = mappa.terrenoNaturaleDi(b.tx, b.ty);
  return t !== TERRENO.ACQUA && t !== TERRENO.ACQUA_BASSA && !mappa.solidoIn(b.tx, b.ty);
}

// --- mucchi per terra -----------------------------------------------------

// Mettere qualcosa per terra. Un tassello regge un mucchio solo, quindi o è
// libero, o contiene già la stessa cosa e allora si sommano: due mucchi di
// legna affiancati sarebbero soltanto due tasselli occupati.
//
// "dal" viaggia con la roba, e senza di esso il terreno era una macchina per
// ringiovanire il cibo: si gettava una rapa vecchia di cinque giorni e la si
// riprendeva appena colta. Peggio ancora il ramo che somma — rifacendo il
// tassello senza data buttava via anche l'età del mucchio che c'era, quindi
// bastava una bacca fresca per rimettere a nuovo una pila intera.
//
// Quando due pile si uniscono la data si mescola con la stessa regola dello
// zaino e della cassa (media pesata, arrotondata verso il vecchio): è la
// ragione per cui mescolaDate sta in inventario.js ed è esportata invece di
// essere riscritta qui.
function deponi(tx, ty, cosa, quante, dal, usi, massimo) {
  const fondo = mappa.terrenoNaturaleDi(tx, ty);
  if (fondo === TERRENO.ACQUA || fondo === TERRENO.ACQUA_BASSA) return false;
  const oggetto = mappa.oggettoDi(tx, ty);
  // Solo il cibo porta una data, come in mettiIn(): darla anche alla legna
  // vorrebbe dire un campo per mucchio che non serve a nessuno.
  const deperibile = CATALOGO[cosa]?.dura !== undefined;
  const quando = deperibile ? (dal ?? tempo.giornoCorrente()) : undefined;

  if (oggetto === OGGETTO.MUCCHIO) {
    const dati = modifiche.di(tx, ty);
    if (dati?.cosa !== cosa || CATALOGO[cosa]?.durata) return false;
    const cambio = { oggetto: OGGETTO.MUCCHIO, cosa, quante: dati.quante + quante };
    if (deperibile) {
      cambio.dal = inventario.mescolaDate(dati.dal, dati.quante, quando, quante);
    }
    mappa.cambiaTassello(tx, ty, cambio);
    return true;
  }
  if (oggetto !== OGGETTO.NESSUNO || mappa.solidoIn(tx, ty)) return false;
  const cambio = { oggetto: OGGETTO.MUCCHIO, cosa, quante };
  if (deperibile) cambio.dal = quando;
  if (CATALOGO[cosa]?.durata) {
    cambio.usi = usi ?? CATALOGO[cosa].durata;
    // Come nello zaino: il tetto si scrive solo se è sceso.
    if (massimo !== undefined && massimo < CATALOGO[cosa].durata) cambio.massimo = massimo;
  }
  mappa.cambiaTassello(tx, ty, cambio);
  return true;
}

// Il tassello indicato, altrimenti uno degli otto attorno. Serve a quello che
// avanza da un raccolto: la roba cade dove è cresciuta, e se lì non c'è posto
// cade accanto invece di svanire.
const INTORNO = [
  [0, 0], [0, -1], [1, 0], [0, 1], [-1, 0],
  [-1, -1], [1, -1], [1, 1], [-1, 1],
];

function deponiVicino(tx, ty, cosa, quante, dal) {
  for (const [dx, dy] of INTORNO) {
    if (deponi(tx + dx, ty + dy, cosa, quante, dal)) return { tx: tx + dx, ty: ty + dy };
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
  if (!deponi(tx, ty, casella.cosa, casella.quantita, casella.dal, casella.usi, casella.massimo)) {
    return { tipo: "nonCePosto" };
  }

  inventario.svuotaCasella(indice);
  return { tipo: "gettato", cosa: casella.cosa, quante: casella.quantita, tx, ty };
}

// --- smontare una cassa ---------------------------------------------------

// Solo da vuota, e il motivo non è il realismo: una cassa piena sollevabile
// sarebbe uno zaino da dodici caselle da portarsi dietro, e il limite dello
// zaino è una delle poche cose che in un survival costringono a scegliere.
// Vuota invece si sposta, perché sbagliare dove costruire deve costare la
// fatica di svuotarla e non la cassa.
// La porta si stacca intera, come si smonta una cassa: è un infisso, si toglie
// dai cardini e te la porti via. Il muro no — quello si abbatte a colpi e rende
// tutte e tre le pietre che è costato; spostarlo richiede comunque lavoro.
// Sono due gesti diversi perché sono due cose diverse, e il gioco lo dice con
// quello che torna in mano.
//
// Sta sullo stesso tasto con cui si smonta una cassa, e non sulla barra: la
// barra apre e chiude, ed è il tasto che si preme di notte con qualcuno alle
// calcagna. Non deve poter portare via la porta.
//
// Prende l'eroe e non due coordinate perché è un gesto su quello che si ha
// davanti, come getta(): chi chiama non deve sapere cos'è un tassello.
export function staccaLaPorta(eroe) {
  const { tx, ty, oggetto } = bersaglio(eroe);
  if (oggetto !== OGGETTO.PORTA && oggetto !== OGGETTO.PORTA_APERTA) return null;
  if (inventario.spazioPer("porta") < 1) return { tipo: "zainoPieno" };
  inventario.aggiungi("porta", 1);
  mappa.cambiaTassello(tx, ty, { oggetto: OGGETTO.NESSUNO });
  return { tipo: "staccata", tx, ty };
}

export function smontaIlLetto(eroe) {
  const { tx, ty, oggetto } = bersaglio(eroe);
  if (!LETTI.has(oggetto)) return null;
  const cosa = oggetto === OGGETTO.GIACIGLIO_PELLI ? "giaciglio_pelli" : "giaciglio";
  if (inventario.spazioPer(cosa) < 1) return { tipo: "zainoPieno" };
  inventario.aggiungi(cosa, 1);
  mappa.cambiaTassello(tx, ty, { oggetto: OGGETTO.NESSUNO });
  bisogni.consuma("stanchezza", 0.01);
  return { tipo: "lettoSmontato" };
}

export function smonta(tx, ty) {
  if (mappa.oggettoDi(tx, ty) !== OGGETTO.CASSA) return null;
  if (!contenitori.eVuota(tx, ty)) return { tipo: "nonEVuota" };
  if (inventario.spazioPer("cassa") < 1) return { tipo: "zainoPieno" };
  inventario.aggiungi("cassa", 1);
  mappa.cambiaTassello(tx, ty, { oggetto: OGGETTO.NESSUNO });
  return { tipo: "smontata" };
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
// Il corpo resta dov'è e non si disfa da solo — il cambio di giorno non
// visita i cadaveri — ma quello che porta addosso non è in pausa: ogni pila
// parte con la sua data e quella data non viene riscritta da nessuno. Questo
// commento diceva il contrario fino a M7.4, ed era vero finché il cibo non si
// guastava da nessuna parte; adesso la freschezza è un dato solo e il corpo
// non è il posto in cui si azzera.
export function lasciaIlCadavere(eroe, giorno) {
  const roba = inventario
    .contenuto()
    .filter(Boolean)
    // La data parte con la roba. Il tempo in cui il corpo è rimasto lì conta
    // come conta dappertutto: un corpo lasciato una stagione restituisce roba
    // spesa, che sparisce alla prima alba. È più severo di com'era scritto
    // prima — vedi decadimento.js — ed è una regola sola invece di
    // un'eccezione.
    .map((casella) => ({ ...casella }));
  // Anche quello che si aveva addosso: è roba tua come il resto, e lasciarla
  // sul morto è l'unica entropia che questa tappa porta — si perde morendo, e
  // fa male perché ti coglie lontano da casa e d'inverno. La quantità non è
  // cosmetica: casellaValida() pretende un intero positivo, e una voce senza
  // renderebbe illeggibile il salvataggio.
  const capo = addosso.togliDiDosso();
  if (capo) roba.push({ ...capo, quantita: 1 });
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
//
// La soglia però si sposta con il mese (vedi il cespuglio in oggetti.js).
// Resta una funzione delle coordinate, quindi non diventa una lotteria: è un
// calendario. E siccome un cespuglio si strappa una volta sola, quello che il
// giocatore vede non è "questo cespuglio è cambiato" ma "d'inverno ne servono
// quattro per quello che d'estate ne dava uno", che è la cosa da imparare.
function resaDi(raccolta, tx, ty) {
  const seme = mappa.semeCorrente().valore;
  const ottenuto = [];
  raccolta.resa.forEach((voce, i) => {
    if (voce.probabilita !== undefined) {
      const soglia = stagioni.valoreStagionale(voce.probabilita);
      if (soglia <= 0) return;
      if (impronta(tx + i * 101, ty - i * 57, seme ^ 0x3c6ef372) > soglia) return;
    }
    ottenuto.push({ cosa: voce.cosa, quante: voce.quante });
  });
  return ottenuto;
}

// Usare quello che si ha in mano su di sé. Sta fuori da agisci() perché non
// ha un bersaglio: mangiare non ha un davanti, e infilarlo nella barra
// avrebbe voluto dire decidere se si mangia o si abbatte l'albero che si ha
// di fronte. Adesso serve anche alle bende, che è quello che il commento qui
// sopra prometteva da M2.
export function consuma(cosaInMano, indice) {
  const voce = cosaInMano && CATALOGO[cosaInMano];
  if (!voce) return null;
  if (voce.commestibile) return mangia(cosaInMano, voce.commestibile);
  if (voce.cura) return medicati(cosaInMano, voce.cura);
  // Il terzo ramo della stessa frase. "E" significa già usa quello che hai in
  // mano su di te — mangiare, fasciarsi — e indossare è lo stesso gesto con
  // una parola in più. A smistare è il catalogo, come per gli altri due.
  if (voce.addosso) return vesti(cosaInMano, indice);
  return null;
}

function vesti(cosa, indice) {
  if (inventario.contenuto()[indice]?.cosa !== cosa) return null;
  inventario.svuotaCasella(indice);
  const prima = addosso.indossa(cosa);
  // Lo scambio non può fallire: la casella si è appena liberata, quindi il
  // capo vecchio ci sta sempre. Una via d'uscita per un caso che non succede
  // sarebbe una riga che nessuno potrà mai leggere per capire se funziona.
  if (prima) inventario.aggiungi(prima.cosa, 1);
  return { tipo: "indossato", cosa, tolto: prima?.cosa ?? null };
}

// Togliersi qualcosa non ha una casella da cui partire: quello che hai addosso
// non sta nello zaino, quindi non lo si può selezionare e premere E sopra. Per
// questo il gesto sta su "E a mani vuote", che oggi non fa niente ed è l'unico
// significato libero rimasto su quel tasto — e significa già, alla lettera,
// usare le mani su di sé.
export function spogliati() {
  const capo = addosso.indossato();
  if (!capo) return null;
  if (inventario.spazioPer(capo.cosa) < 1) return { tipo: "zainoPieno" };
  addosso.togliDiDosso();
  inventario.aggiungi(capo.cosa, 1);
  return { tipo: "tolto", cosa: capo.cosa };
}

function mangia(cosa, effetto) {
  if (!inventario.togli(cosa, 1)) return null;

  const ristorato = {};
  for (const [quale, quanto] of Object.entries(effetto)) {
    ristorato[quale] = bisogni.ristora(quale, quanto);
  }

  // Un contenitore non si consuma, si svuota: il secchio bevuto torna
  // secchio. Se non ci sta più — zaino pieno di altro — resta comunque
  // bevuto, perché l'alternativa sarebbe non poter bere avendo l'acqua in
  // mano, che è esattamente il difetto che questo campo è venuto a togliere.
  const diventa = CATALOGO[cosa]?.diventa;
  if (diventa) inventario.aggiungi(diventa, 1);

  return { tipo: "consumato", cosa, ristorato, diventa: diventa ?? null };
}

// Una benda si consuma anche quando non c'era un'infezione da togliere: cura
// comunque un po' di salute, e a salute piena e senza infezione non si spreca
// — si rifiuta. Consumarla per niente sarebbe la punizione più sciocca del
// gioco, sprecata proprio su chi sta cercando di curarsi.
function medicati(cosa, effetto) {
  const serve = (effetto.infezione && salute.eInfetto()) || salute.livelloCorrente() < 1;
  if (!serve) return { tipo: "nonServe", cosa };
  if (!inventario.togli(cosa, 1)) return null;

  const curata = effetto.infezione ? salute.curati() : false;
  const rimarginato = salute.ristora(effetto.salute ?? 0);
  return { tipo: "medicato", cosa, curata, rimarginato };
}

// Restituisce un resoconto di cosa è successo, perché l'interfaccia deve
// poterlo dire al giocatore: un colpo che non ottiene niente e un colpo che
// abbatte un albero non possono sembrare lo stesso gesto.
export function agisci(eroe, cosaInMano, indice) {
  const azione = azionePossibile(eroe, cosaInMano, indice);
  const scopo = scopoDi(azione);
  // Si consuma solo l'attrezzo che sta facendo il suo mestiere: la lancia
  // davanti a un albero non è l'attrezzo di quel gesto, quindi non paga.
  const attrezzo = scopo && strumento(cosaInMano, indice, scopo) === cosaInMano
    ? inventario.attrezzo(cosaInMano, indice)
    : null;
  if (salute.eMorto() || riposo.secondiDiSonno() > 0) return null;
  const esito = esegui(eroe, cosaInMano, indice, azione);
  // Si paga il gesto compiuto, anche a mani nude, non un tentativo rifiutato.
  const costo = esito?.lavorato ? 0.02
    : esito?.tipo === "combattuto" ? 0.02
    : esito?.tipo === "zappa" ? 0.02
    : ["colpo", "raccolto"].includes(esito?.tipo) ? (scopo === "raccolta" ? 0.015 : 0.005)
    : ({ semina: 0.005, innaffia: 0.005, posa: 0.01, cotto: 0.005, riempi: 0.005 }[esito?.tipo] ?? 0);
  if (costo) bisogni.consuma("stanchezza", costo);
  if (esito && attrezzo && (["combattuto", "colpo", "raccolto", "zappa"].includes(esito.tipo) || esito.lavorato)) {
    const avviso = inventario.usura(attrezzo);
    if (avviso) esito.usura = avviso;
  }
  return esito;
}

function esegui(eroe, cosaInMano, indice, azione) {
  if (pesca.stato()) { pesca.interrompi(); return { tipo: "pescaInterrotta" }; }
  if (!azione || azione.impedito) return null;
  if (azione.tipo === "pesca") return pesca.inizia(eroe, azione.bersaglio.tx, azione.bersaglio.ty, indice);

  if (azione.tipo === "macella" || azione.tipo === "spoglia") return fauna.macella(azione.carcassa);

  if (azione.tipo === "combatti") {
    const esito = (azione.nemico.specie ? fauna : infetti).colpisci(azione.nemico, dannoDi(strumento(cosaInMano, indice, "combatti")));
    // Il combattimento si sente. È la ragione per cui uno che urla ne chiama
    // altri, ed è anche il motivo per cui non conviene mettersi a fare a
    // botte in mezzo alla valle di notte.
    chiasso.colpo();
    return {
      tipo: "combattuto",
      caduto: esito.caduto,
      specie: azione.nemico.specie,
      px: azione.nemico.px,
      py: azione.nemico.py,
    };
  }

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
    const resto = inventario.aggiungi(dati.cosa, dati.quante, dati.dal, dati.usi, dati.massimo);
    if (resto === dati.quante) return { tipo: "zainoPieno" };
    if (resto > 0) {
      // Quello che resta per terra tiene l'età che aveva: prenderne metà non
      // è un modo di rinfrescare l'altra metà.
      mappa.cambiaTassello(tx, ty, { ...dati, oggetto: OGGETTO.MUCCHIO, cosa: dati.cosa, quante: resto });
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
      const resto = inventario.aggiungi(voce.cosa, voce.quantita, voce.dal, voce.usi, voce.massimo);
      if (resto < voce.quantita) presi.push({ cosa: voce.cosa, quante: voce.quantita - resto });
      if (resto > 0) rimasto.push({ ...voce, quantita: resto });
    }

    if (presi.length === 0 && rimasto.length > 0) return { tipo: "zainoPieno" };

    // Il corpo sparisce solo quando è vuoto. Un cadavere spogliato che resta
    // lì sarebbe un secondo lutto senza informazione: quello che c'era da
    // dire l'ha già detto.
    if (rimasto.length > 0) mappa.cambiaTassello(tx, ty, { ...dati, roba: rimasto });
    else mappa.cambiaTassello(tx, ty, { oggetto: OGGETTO.NESSUNO });

    return { tipo: "frugato", presi, resta: rimasto.length };
  }

  if (azione.tipo === "apri") {
    // Non cambia niente nel mondo: chi orchestra apre la schermata, e da lì in
    // poi è contenitori.js a spostare la roba. Le regole dicono cosa si può
    // fare, non aprono pannelli.
    return { tipo: "aperta", tx, ty };
  }

  if (azione.tipo === "cucina") {
    // Una per volta, e di proposito: cuocere l'intera pila con un tasto
    // toglierebbe l'unica cosa che il fuoco chiede, cioè di restarci accanto.
    if (!inventario.trasforma([{ cosa: azione.cosa, quante: 1 }], { cosa: azione.diventa, quante: 1 })) {
      return { tipo: "zainoPieno" };
    }
    return { tipo: "cotto", cosa: azione.cosa, diventa: azione.diventa };
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
    const inverno = stagioni.stagioneCorrente() === "inverno";
    const diurno = !tempo.eNotte();
    const prima = bisogni.livello("stanchezza");
    riposo.reimposta();
    const letto = { px:(tx+0.5)*TASSELLO, py:(ty+0.75)*TASSELLO };
    let riscaldato = freddo.fuocoPerRiposo(letto);
    const secondi = simulazione.avanza(diurno ? 2 * riposo.ORA : tempo.secondiFinoAlle(tempo.ALBA_PIENA), {
      dorme: true, eroe: letto,
      alFreddo: () => {
        riscaldato = freddo.fuocoPerRiposo(letto) && riscaldato;
        return freddo.tipo(letto);
      },
    });
    const pocoRiposato = inverno && !riscaldato;
    const limite = inverno ? RIPOSO[azione.bersaglio.oggetto][riscaldato ? "conFuoco" : "senza"] : 1;
    const recuperata = salute.eMorto() ? 0 : bisogni.ristora("stanchezza", riposo.recupero(prima, secondi, limite));
    return { tipo: "dormi", secondi, diurno, recuperata, pocoRiposato, stamina: bisogni.livello("stanchezza"), sveglio: !salute.eMorto(),
      messaggio: pocoRiposato && !salute.eMorto() ? "Non ti senti molto riposato..." : null };
  }

  if (azione.tipo === "porta") {
    const apre = azione.bersaglio.oggetto === OGGETTO.PORTA;
    // Si tiene quello che c'era scritto sul tassello, e non è pignoleria: lì
    // dentro ci sono i colpi che la porta ha già preso. Una porta mezza
    // sfondata che si rimette a nuovo aprendola e richiudendola sarebbe il
    // modo più corto per annullare una notte intera.
    const dati = modifiche.di(tx, ty) ?? {};
    mappa.cambiaTassello(tx, ty, {
      ...dati,
      oggetto: apre ? OGGETTO.PORTA_APERTA : OGGETTO.PORTA,
    });
    // Chiudendola ci si fa da parte, come dopo aver posato una cassa: si sta
    // sul tassello davanti mentre il riquadro d'urto sborda, e senza questa
    // riga ci si chiuderebbe dentro la propria porta.
    if (!apre) {
      const [dx, dy] = SCARTI[eroe.guarda] ?? SCARTI.giu;
      urti.spingiFuori(eroe, dx, dy);
    }
    return { tipo: "porta", aperta: apre, tx, ty };
  }

  if (azione.tipo === "posa") {
    if (!inventario.togli(azione.cosa, 1)) return null;
    // Il giorno in cui è stato posato resta scritto sul tassello: è quello che
    // permette ai fuochi di consumarsi invece di restare accesi per sempre.
    mappa.cambiaTassello(tx, ty, {
      oggetto: CATALOGO[azione.cosa].posa,
      posata: tempo.giornoCorrente(),
    });
    // E poi ci si fa da parte, se la cosa posata ha preso il posto dei propri
    // piedi. Capita con quello che ferma — il falò e la cassa — perché si posa
    // sul tassello davanti al punto dei piedi mentre il riquadro d'urto è
    // largo dieci e alto sette: camminando, quel riquadro sborda spesso nel
    // tassello davanti. Senza questa riga si restava incastrati dentro la
    // propria cassa, senza più un modo di uscire.
    const [dx, dy] = SCARTI[eroe.guarda] ?? SCARTI.giu;
    urti.spingiFuori(eroe, dx, dy);
    return { tipo: "posa", tx, ty, cosa: azione.cosa };
  }

  const oggetto = azione.bersaglio.oggetto;
  const raccolta = raccoltaDi(oggetto);
  const precedente = modifiche.di(tx, ty) ?? {};
  const colpi = (precedente.colpi ?? 0) + 1;
  const necessari = colpiNecessari(
    oggetto,
    COLPI_DURI.has(oggetto) ? strumento(cosaInMano, indice, "raccolta") : cosaInMano
  );

  if (colpi < necessari) {
    // Annota e basta: l'albero è ancora lo stesso albero, quindi il settore
    // non va ricotto — e se lo fosse, cancellerebbe il tremolio appena
    // cominciato.
    mappa.annotaTassello(tx, ty, { ...precedente, colpi });
    return {
      tipo: "colpo",
      tx,
      ty,
      scheggie: raccolta.scheggie,
      voce: raccolta.voce,
      restano: necessari - colpi,
    };
  }

  const ottenuto = resaDi(raccolta, tx, ty);
  const avanzate = [];
  for (const voce of ottenuto) {
    const resto = inventario.aggiungi(voce.cosa, voce.quante);
    if (resto > 0) avanzate.push({ cosa: voce.cosa, quante: resto });
  }

  // Il tassello si libera per primo, così quello che avanza può cadere proprio
  // lì: è dove il giocatore sta già guardando.
  //
  // Il giorno resta scritto: è da lì che parte il conto della ricrescita. La
  // stessa data che i fuochi chiamano "posata" e le colture "maturata" — e
  // come loro, chi la trova mancante assume adesso e la scrive, così i
  // salvataggi di prima non restano spogli per sempre.
  mappa.cambiaTassello(tx, ty, { oggetto: OGGETTO.NESSUNO, svuotata: tempo.giornoCorrente() });

  // Quello che non ci sta resta per terra invece di sparire. Prima spariva, e
  // "zaino pieno, perso qualcosa" era un messaggio che annunciava un danno
  // senza offrire niente da farci: il mondo si riprende quello che è tuo, ma
  // non deve mangiarselo mentre guardi.
  const perse = [];
  for (const voce of avanzate) {
    if (!deponiVicino(tx, ty, voce.cosa, voce.quante)) perse.push(voce);
  }

  return {
    tipo: "raccolto",
    tx,
    ty,
    scheggie: raccolta.scheggie,
    voce: raccolta.voce,
    ottenuto,
    avanzate,
    perse,
  };
}

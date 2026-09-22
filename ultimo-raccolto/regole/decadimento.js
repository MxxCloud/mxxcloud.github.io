// Quello che lasci non ti aspetta.
//
// L'orto ha già la sua scadenza, ma da solo direbbe che il mondo si riprende
// soltanto le piante. Qui ci sono le altre cose che il giocatore lascia dietro
// di sé e che smettono di funzionare da sole: i fuochi.
//
// Il falò acceso e la torcia piantata erano le due cose che rendevano un posto
// abitabile e restavano accese per sempre. Un accampamento che non chiede
// niente a nessuno non è un accampamento, è un monumento — e l'unica ragione
// per tornare in un posto dev'essere che il posto ne ha bisogno.
//
// E il cibo, che da questa tappa si guasta.
//
// Per sei tappe non si guastava da nessuna parte, e il commento che stava qui
// diceva perché: finché non ci sono contenitori in cui mettere le cose al
// sicuro, far marcire anche i mucchi toglie l'unico ripostiglio che esiste, e
// far marcire lo zaino mentre il terreno è una dispensa eterna insegna
// soltanto a usare il terreno come dispensa. Era un debito con una condizione
// scritta, e la condizione è la cassa.
//
// Adesso il cibo si guasta ovunque stia — zaino, mucchio, cassa — e la cassa
// lo rallenta invece di fermarlo. Il cadavere non fa eccezione: nuovoGiorno()
// non lo visita, quindi non marcisce sul posto casella per casella, ma ogni
// cosa che ne esce si porta dietro la data in cui è stata raccolta, e i giorni
// passati a cercare il corpo li ha contati l'orologio come dappertutto. Una
// prima versione di questa regola faceva del cadavere un posto in cui il tempo
// si ferma; era una gentilezza che non tornava con niente — qui la freschezza
// è una sola cosa, il giorno in cui hai preso quella roba, e non esiste
// contenitore che lo riscriva. Recuperare il proprio corpo è un viaggio con
// una scadenza: quello che c'era dentro può benissimo essere andato.

import { OGGETTO } from "../mondo/generazione.js";
import * as mappa from "../mondo/mappa.js";
import * as modifiche from "../mondo/modifiche.js";
import * as tempo from "./tempo.js";
import * as stagioni from "./stagioni.js";
import { CATALOGO } from "./oggetti.js";
import * as inventario from "./inventario.js";
import * as contenitori from "./contenitori.js";
import * as meteo from "./meteo.js";

// Quanto dura un fuoco, in giorni, e in cosa si trasforma quando finisce.
//
// È rimasta la torcia piantata sola, e non è una tavola svuotata per sbaglio:
// la torcia brucia sé stessa — è un bastone, finisce e non lascia niente — e
// una cosa che si consuma si racconta con una scadenza. I fuochi che bruciano
// quello che ci metti dentro non si raccontano così: si raccontano con quanto
// gli resta, e stanno qui sotto, nella sezione loro.
const FUOCHI = {
  [OGGETTO.TORCIA_PIANTATA]: { giorni: 1, diventa: OGGETTO.NESSUNO },
};

// --- i fuochi che hanno fame ------------------------------------------------

// Quanto ci sta dentro, e cosa resta quando finisce.
//
// Sono due, e la differenza fra loro è tutta qui: il focolare tiene quattro
// legna, il falò due. Bruciano allo stesso ritmo — una legna al giorno, due
// d'inverno — quindi il camino di casa dà quattro giorni d'autonomia e il
// fuoco da viaggio due, uno solo d'inverno. È la stessa frase detta due volte:
// quello che hai costruito dove hai deciso che è casa regge una stagione,
// quello che ti porti dietro regge una notte.
//
// Nessuno dei due nasce acceso. Le dieci pietre comprano il camino e le tre
// legna comprano la fossa del falò; il fuoco si compra ogni volta, una legna
// alla volta, e questa è la differenza fra la pietra che resta e la legna che
// se ne va.
//
// E per il falò è anche una toppa a un buco vecchio: si posava acceso, bruciava
// due giorni, diventava cenere, e la cenere si raccoglieva ed era di nuovo un
// falò da posare acceso. Tre legna pagate una volta sola e fuoco per sempre,
// bastava tornare a raccogliere la propria cenere.
//
// La stagione si legge all'alba, cioè quando si brucia: conta quella in cui ci
// si sveglia, non quella in cui si era caricato.
const FOCOLAI = {
  [OGGETTO.FOCOLARE_ACCESO]: { capienza: 4, spento: OGGETTO.FOCOLARE_SPENTO },
  [OGGETTO.FALO_ACCESO]: { capienza: 2, spento: OGGETTO.FALO_SPENTO },
};

// Da spento ad acceso: la tavola di sopra letta dall'altro verso, costruita
// qui invece di scritta a mano perché due elenchi che dicono la stessa cosa
// prima o poi non la dicono più.
const ACCESO_DI = Object.fromEntries(
  Object.entries(FOCOLAI).map(([acceso, f]) => [f.spento, Number(acceso)])
);

// Quanto ci sta in questo fuoco, acceso o spento che sia, o null se quello che
// c'è su questo tassello non è un fuoco che si carica.
export function capienzaDi(oggetto) {
  return FOCOLAI[oggetto]?.capienza ?? FOCOLAI[ACCESO_DI[oggetto]]?.capienza ?? null;
}

export function accesoDi(oggetto) {
  return ACCESO_DI[oggetto] ?? null;
}

export function siCarica(oggetto) {
  return capienzaDi(oggetto) !== null;
}

export function legnaAlGiorno() {
  return stagioni.stagioneCorrente() === "inverno" ? 2 : 1;
}

// Quanta ne ha dentro adesso, da 0 (spento) alla capienza.
//
// Un fuoco acceso senza il conto è un fuoco acceso prima che la legna si
// contasse: si assume pieno, che è lo stesso riguardo che i fuochi hanno
// sempre avuto per chi li aveva accesi prima che i fuochi durassero. Punire
// una partita vecchia per un cambiamento del gioco è l'unica cosa che questo
// modulo non fa.
// Si chiede l'oggetto alla mappa e non alle modifiche, ed è la differenza fra
// un falò posato da te e la cenere di un accampamento bruciato: quella la posa
// la generazione, quindi nelle modifiche non c'è finché non la si tocca. Un
// fuoco trovato si riaccende come il proprio.
export function legnaNel(tx, ty) {
  const oggetto = mappa.oggettoDi(tx, ty);
  const fuoco = FOCOLAI[oggetto];
  if (fuoco) return modifiche.di(tx, ty)?.legna ?? fuoco.capienza;
  if (ACCESO_DI[oggetto] !== undefined) return 0;
  return null;
}

// --- la cenere -------------------------------------------------------------
//
// Ogni giorno che un fuoco brucia lascia un po' di cenere sul fondo, fino a
// tre, e resta anche quando il fuoco si spegne. Si prende a mani vuote e sul
// campo è concime (vedi orto.js): è il primo filo che lega il fuoco all'orto,
// e la ragione per cui un focolare acceso tutto l'inverno vale qualcosa anche
// a primavera.
export const CENERE_MASSIMA = 3;

export function cenereNel(tx, ty) {
  if (!siCarica(mappa.oggettoDi(tx, ty))) return 0;
  return modifiche.di(tx, ty)?.cenere ?? 0;
}

// La si prende tutta, e il fuoco resta com'era.
export function prendiCenere(tx, ty) {
  const quante = cenereNel(tx, ty);
  if (quante === 0) return 0;
  const { cenere, ...resto } = modifiche.di(tx, ty);
  modifiche.imposta(tx, ty, resto);
  return quante;
}

// --- l'essiccatoio --------------------------------------------------------

// Quanti giorni asciutti servono perché la carne sia secca.
export const GIORNI_DI_SECCA = 3;

// Quanti giorni asciutti sono passati da quando è stata stesa.
//
// Si CONTANO i giorni buoni, non si sottraggono quelli cattivi da un totale:
// meteo.evento(giorno) e la stagione sono funzioni pure del giorno e del seme,
// quindi la risposta è la stessa che si guardi ogni alba o che si torni dopo
// una settimana. Nessun contatore sul tassello, e niente che si possa
// disallineare.
//
// DUE COSE FERMANO IL CONTO, e nessuna delle due rovina quello che pende: la
// roba non si perde, ci mette solo di più.
//
// La pioggia, un giorno per stagione: si bagna quello che è steso, e quel
// giorno non conta.
//
// E L'INVERNO INTERO, a prescindere dalla neve. Non è il maltempo, è la
// stagione: al freddo l'aria non tira via niente, e un telaio caricato in
// novembre resta un telaio carico fino a marzo. Prima d'inverno si seccava
// come d'estate — la neve non fermava niente — ed era l'unica cosa della valle
// che l'inverno non toccava, in un gioco dove l'inverno raddoppia la fame,
// gela l'acqua, dirada la caccia e brucia il doppio della legna. Adesso la
// scorta per marzo va preparata prima che arrivi marzo, che è tutto il punto
// di una scorta.
export function giorniAsciutti(dal, a) {
  let asciutti = 0;
  for (let giorno = dal + 1; giorno <= a; giorno += 1) {
    if (meteo.evento(giorno) === "pioggia") continue;
    if (stagioni.stagioneDi(giorno) === "inverno") continue;
    asciutti += 1;
  }
  return asciutti;
}

// Si secca oggi? Serve all'interfaccia, che deve poterlo dire prima invece di
// lasciar credere che il telaio sia rotto.
export function siSeccaOggi() {
  return stagioni.stagioneCorrente() !== "inverno" && meteo.evento() !== "pioggia";
}

// --- il guasto ------------------------------------------------------------

// Quanti giorni dura una cosa dove sta adesso. Una cassa moltiplica, il resto
// del mondo no: è tutta la differenza fra un ripostiglio e un posto per terra.
export function vitaDi(cosa, inCassa = false) {
  const dura = CATALOGO[cosa]?.dura;
  if (dura === undefined) return undefined;
  return dura * (inCassa ? contenitori.RALLENTA : 1);
}

// Quanto è andata, da 0 (appena colta) a 1 (guasta). Serve all'interfaccia:
// una scadenza che non si vede è una trappola, e questo gioco le scadenze le
// annuncia — è la stessa ragione per cui l'autunno dice che l'inverno dà poco.
//
// Restituisce null per quello che non si guasta, così chi disegna ha una
// domanda sola da fare invece di due.
export function quantoEAndata(casella, inCassa = false) {
  if (!casella) return null;
  const vita = vitaDi(casella.cosa, inCassa);
  if (vita === undefined) return null;
  // Senza data si assume appena messa. È lo stesso riguardo che i fuochi hanno
  // per chi li aveva accesi prima che i fuochi durassero.
  const dal = casella.dal ?? tempo.giornoCorrente();
  return Math.min(1, Math.max(0, (tempo.giornoCorrente() - dal) / vita));
}

// L'avviso si conta in GIORNI e non in frazioni della vita, e ci è arrivato
// per prova: la prima stesura diceva "oltre sette decimi", e su una cosa che
// dura tre giorni non scattava mai. I giorni sono interi, quindi le bacche
// passano da due terzi — che è meno di sette decimi — direttamente a guaste.
// L'avviso esisteva senza succedere, che è il difetto che questo progetto
// insegue da sempre, e stava dentro la sua stessa correzione.
//
// Un giorno di preavviso e non due: deve arrivare quando c'è ancora tempo di
// farci qualcosa — mangiarlo, cuocerlo, metterlo in cassa — e con le scadenze
// corte che ha questo gioco due giorni prima vorrebbe dire quasi sempre.
const GIORNI_DI_AVVISO = 1;

export function staPerGuastarsi(casella, inCassa = false) {
  if (!casella) return false;
  const vita = vitaDi(casella.cosa, inCassa);
  if (vita === undefined) return false;
  const dal = casella.dal ?? tempo.giornoCorrente();
  return tempo.giornoCorrente() - dal >= vita - GIORNI_DI_AVVISO;
}

// Guasta quello che è ora di guastare, in una fila di caselle qualunque —
// lo zaino o una cassa. Restituisce quante unità sono andate perse.
function guastaLaFila(fila, inCassa, giorno) {
  let perse = 0;
  for (let i = 0; i < fila.length; i += 1) {
    const casella = fila[i];
    if (!casella) continue;
    const vita = vitaDi(casella.cosa, inCassa);
    if (vita === undefined) continue;
    // Senza data la si scrive e si aspetta domani: è il caso del cibo messo
    // via in un gioco in cui non si guastava, e farlo marcire al primo
    // risveglio sarebbe punire il giocatore per un cambiamento del gioco.
    if (casella.dal === undefined) {
      casella.dal = giorno;
      continue;
    }
    if (giorno - casella.dal < vita) continue;
    perse += casella.quantita;
    fila[i] = null;
  }
  return perse;
}

// Da chiamare a ogni cambio di giorno, come l'orto. Dice quanti fuochi si sono
// spenti e quanto cibo si è guastato: una cosa che succede mentre dormi e che
// nessuno racconta è un guasto, dal punto di vista di chi gioca.
export function nuovoGiorno() {
  const giorno = tempo.giornoCorrente();

  // Lo zaino per primo, che è l'unico posto che non sta nelle modifiche.
  let guaste = guastaLaFila(inventario.contenuto(), false, giorno);
  // Quante pile stanno per andare. Si conta dopo aver guastato, altrimenti
  // quello che è appena marcito verrebbe contato anche come "sta per".
  let inScadenza = inventario.contenuto().filter((c) => staPerGuastarsi(c, false)).length;

  // Si raccoglie scorrendo e si agisce dopo: perOgnuno scorre la mappa dei
  // cambiamenti, e cambiarla mentre la si scorre è il modo più corto per
  // saltarne metà.
  const spenti = [];
  const seccati = [];
  const svuotati = [];
  const casse = [];
  modifiche.perOgnuno((tx, ty, cambio) => {
    const fuoco = FUOCHI[cambio.oggetto];
    if (fuoco) {
      // Senza data si assume acceso adesso e la si scrive: è il caso di un
      // fuoco che esisteva prima che i fuochi avessero una durata, e spegnerlo
      // subito sarebbe punire il giocatore per un cambiamento del gioco.
      const acceso = cambio.posata ?? giorno;
      if (giorno - acceso >= fuoco.giorni) spenti.push({ tx, ty, diventa: fuoco.diventa });
      else if (cambio.posata === undefined) modifiche.imposta(tx, ty, { ...cambio, posata: giorno });
      return;
    }

    // I fuochi che hanno fame mangiano la loro legna, e quando finisce resta
    // quello che non brucia: la pietra del camino, la fossa del falò. Si scrive
    // il resto invece di spegnere e basta — chi torna a casa vuole sapere
    // quanto gliene resta, non solo se è ancora acceso.
    const focolaio = FOCOLAI[cambio.oggetto];
    if (focolaio) {
      const resta = (cambio.legna ?? focolaio.capienza) - legnaAlGiorno();
      // Un giorno di fuoco, un po' di cenere: la si scrive prima di sapere se
      // il fuoco regge un altro giorno, perché anche l'ultima legna brucia.
      const cenere = Math.min(CENERE_MASSIMA, (cambio.cenere ?? 0) + 1);
      if (resta >= 1) modifiche.imposta(tx, ty, { ...cambio, legna: resta, cenere });
      else spenti.push({ tx, ty, diventa: focolaio.spento, cenere });
      return;
    }

    // La carne stesa, che diventa secca quando ha avuto i suoi giorni di sole.
    // Il disegno cambia, ed è l'unica cosa che lo dice: da lontano si vede se
    // vale la pena tornare.
    if (cambio.oggetto === OGGETTO.ESSICCATOIO_CARICO) {
      const dal = cambio.dal ?? giorno;
      if (giorniAsciutti(dal, giorno) >= GIORNI_DI_SECCA) {
        // "cosa" viaggia con il carico: il telaio che finisce di seccare deve
        // ricordare se lì sopra c'era carne o pesce, se no chi torna a
        // ritirarlo trova l'altra cosa.
        seccati.push({ tx, ty, quante: cambio.quante, cosa: cambio.cosa });
      } else if (cambio.dal === undefined) {
        modifiche.imposta(tx, ty, { ...cambio, dal: giorno });
      }
      return;
    }

    if (cambio.oggetto === OGGETTO.CASSA) {
      casse.push({ tx, ty });
      return;
    }

    // Un mucchio è una casella sola per terra, e si guasta come le altre: il
    // terreno non è più una dispensa eterna, ed è esattamente il cambiamento
    // che la cassa rende sopportabile.
    if (cambio.oggetto !== OGGETTO.MUCCHIO) return;
    const fila = [{ cosa: cambio.cosa, quantita: cambio.quante, dal: cambio.dal }];
    const perse = guastaLaFila(fila, false, giorno);
    if (perse > 0) {
      guaste += perse;
      svuotati.push({ tx, ty });
    } else if (cambio.dal === undefined && fila[0].dal !== undefined) {
      modifiche.imposta(tx, ty, { ...cambio, dal: fila[0].dal });
    }
  });

  for (const { tx, ty } of casse) {
    const fila = contenitori.contenutoDi(tx, ty);
    const perse = guastaLaFila(fila, true, giorno);
    guaste += perse;
    inScadenza += fila.filter((c) => staPerGuastarsi(c, true)).length;
    // Si riscrive sempre e non solo quando qualcosa è andato: guastaLaFila
    // riempie anche le date mancanti, e perderle vorrebbe dire rifare quel
    // lavoro a ogni alba per sempre.
    contenitori.scrivi(tx, ty, fila);
  }

  for (const { tx, ty, quante, cosa } of seccati) {
    mappa.cambiaTassello(tx, ty, { oggetto: OGGETTO.ESSICCATOIO_PRONTO, quante, cosa });
  }

  for (const { tx, ty, diventa, cenere } of spenti) {
    mappa.cambiaTassello(tx, ty, cenere ? { oggetto: diventa, cenere } : { oggetto: diventa });
  }
  for (const { tx, ty } of svuotati) {
    mappa.cambiaTassello(tx, ty, { oggetto: OGGETTO.NESSUNO });
  }

  return { fuochi: spenti.length, guaste, inScadenza, seccati: seccati.length };
}

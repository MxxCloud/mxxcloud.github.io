// L'orto: la prima cosa che è tua.
//
// È la prima volta che il gioco chiede di tornare in un posto, che è la
// definizione minima di averne uno. Fino a qui si poteva andare in qualunque
// direzione senza perdere niente; da adesso lasciare l'orto senza acqua ha
// una conseguenza.
//
// Orto e fame si tengono a vicenda: senza la fame l'orto sarebbe decorazione,
// senza l'orto la fame sarebbe solo una tassa. Con le stagioni si aggiunge il
// terzo lato: l'orto ha una finestra, e la finestra si chiude da sola.

import { OGGETTO } from "../mondo/generazione.js";
import * as mappa from "../mondo/mappa.js";
import * as modifiche from "../mondo/modifiche.js";
import * as tempo from "./tempo.js";
import * as stagioni from "./stagioni.js";
import * as meteo from "./meteo.js";
import * as colture from "./colture.js";
import * as riparo from "./riparo.js";
import { impronta } from "../motore/casuale.js";

// In ordine di crescita: ogni giorno innaffiato avanza di uno. Quattro stadi,
// quindi tre innaffiature dalla semina al raccolto. È la fila della rapa, ed è
// anche l'elenco degli stadi che ogni coltura attraversa: le altre ne ripetono
// qualcuno per crescere più piano (vedi colture.js).
//
// Il germoglio era stato tolto quando l'orto rendeva poco e un'innaffiatura
// saltata costava soltanto un giorno: allora il margine serviva a non perdere
// tutto per l'inverno. Da M7.16 l'orto costa di più per un'altra strada — si
// secca, e i semi si guadagnano — e il giorno in più torna a essere tempo che
// il campo ti chiede. La scadenza vera è l'autunno: chi semina il primo giorno
// raccoglie l'ultimo, chi semina il secondo lo lascia all'inverno.
export const CRESCITA = [
  OGGETTO.SEMINATO,
  OGGETTO.GERMOGLIO,
  OGGETTO.CRESCIUTA,
  OGGETTO.MATURA,
];

// Gli stadi che non fanno più parte della crescita ma possono ancora trovarsi
// in un salvataggio scritto prima, con lo stadio che ne prende il posto. Oggi
// non ce n'è nessuno — il germoglio che stava qui è tornato nella fila — ma la
// strada resta, perché la fila è già cambiata due volte.
const RITIRATI = {};

// Quanti giorni una coltura matura resta da mangiare, e quanti poi resta a
// seme prima di seccarsi. Due e due: il tempo di accorgersi che è pronta e di
// scegliere, non di dimenticarsene. Prima una matura marciva dopo tre giorni e
// basta; adesso nel mezzo c'è l'unico posto da cui vengono i semi, quindi
// lasciarla lì non è più solo una dimenticanza — può essere una decisione.
export const GIORNI_DI_MATURITA = 2;
export const GIORNI_A_SEME = 2;

// Quanta sete uccide lo dice la coltura (vedi colture.js): un giorno
// senz'acqua ferma la pianta e le ingiallisce le foglie, e a un certo numero
// di giorni asciutti di fila la secca — tre per la rapa. D'estate l'aria è
// arida e un giorno senz'acqua conta due: la stagione che asseta il
// superstite asseta anche il campo.
//
// Prima di M7.16 un'innaffiatura saltata costava un giorno e basta, quindi
// l'orto non chiedeva niente. E la soglia della rapa è tre e non due, che era
// la prima idea: con due, d'estate un giorno dimenticato seccava il campo
// intero, e l'orto diventava un obbligo di ogni cinque minuti invece di una
// cosa da curare. Misurato su sei tasselli e un anno di stagioni buone:
// saltando un giorno su quattro, con due si raccoglieva un settimo di quanto
// rende la cura perfetta, con tre la metà. Un giorno perso deve costare un
// giorno — che in una stagione di quattro è già molto — non tutto.
function sogliaDi(cambio) {
  return colture.di(cambio?.coltura).sete;
}

// Quanta sete fa patire il giorno dato a chi non beve.
function seteDi(giorno) {
  return meteo.evento(giorno) === "arido" ? 2 : 1;
}

// Una pianta assetata secca stanotte se nessuno la innaffia oggi? Serve a chi
// la guarda: "ha sete" e "stanotte è morta" chiedono due fretta diverse.
export function seccaStanotte(cambio, giorno = tempo.giornoCorrente()) {
  return (cambio?.secco ?? 0) + seteDi(giorno) >= sogliaDi(cambio);
}

// --- la terra ---------------------------------------------------------------
//
// La terra dell'orto si ricorda quanto le si è chiesto. Fino a M7.17 un
// tassello dava lo stesso raccolto per sempre, quindi il campo migliore era
// quello che c'era già e non si pensava mai a cosa piantarci dopo: si
// ripiantava la stessa cosa. Adesso ogni tassello ha una fertilità, da zero a
// tre, e un prato appena zappato parte da due.
//
// - Ogni raccolto ne toglie uno — anche quello a seme, che è la pianta che
//   finisce il suo lavoro.
// - I fagioli ne ridanno uno invece di toglierlo: le leguminose ingrassano la
//   terra, ed è la ragione per cui si seminano dopo il resto. È la rotazione,
//   e non serve spiegarla: la si vede nel raccolto.
// - Un inverno a riposo ne ridà uno, a chi non ha niente di piantato.
// - Interrare una pianta morta ne ridà uno, e anche la cenere (vedi azioni.js).
//
// Quanto conta: a tre, una pianta che non ha mai patito la sete rende uno di
// più; a uno, uno di meno — mai sotto uno; a zero la terra è sfinita, e ci
// attecchiscono solo i fagioli. Non un raccolto dimezzato a sorpresa: una
// regola che si legge prima di seminare, e che dice anche cosa fare.
export const FERTILITA_INIZIALE = 2;
export const FERTILITA_MASSIMA = 3;

export function fertilitaDi(cambio) {
  return Number.isInteger(cambio?.fertilita) ? cambio.fertilita : FERTILITA_INIZIALE;
}

// Un tassello del campo: la terra zappata, quello che ci cresce, e quello che
// ci è morto. È dove la fertilità ha un senso, e dove il salvataggio la accetta.
export function eDelCampo(oggetto) {
  return oggetto === OGGETTO.TERRA_ZAPPATA || eColtura(oggetto) || oggetto === OGGETTO.APPASSITA;
}

// Un tassello nuovo che si porta dietro la terra del vecchio. Tutti i passaggi
// del campo che riscrivono il tassello da capo — la pianta che muore, quella
// raccolta, quella mangiata — passano di qui, se no la fertilità si
// perderebbe proprio nei momenti in cui cambia.
function conLaTerra(vecchio, nuovo) {
  if (vecchio?.fertilita !== undefined) nuovo.fertilita = vecchio.fertilita;
  return nuovo;
}

const limitata = (n) => Math.max(0, Math.min(FERTILITA_MASSIMA, n));

// Il tassello dopo che la X ha spianato il campo: torna prato. Ma la terra
// stanca se lo ricorda — altrimenti spianare e zappare di nuovo sarebbe il
// modo di rifare nuova la terra senza fagioli, cenere o inverno, cioè di
// saltare tutta M7.18. Quella grassa no: il bonus si perde spianando, ed è il
// prezzo di averci ripensato. Senza ricordo il tassello scrive solo
// "niente", come un cespuglio strappato: la ricrescita lo riconosce e, se lì
// la valle aveva qualcosa, a suo tempo lo rimette.
export function spianata(cambio) {
  const f = fertilitaDi(cambio);
  return f < FERTILITA_INIZIALE ? { oggetto: OGGETTO.NESSUNO, fertilita: f } : { oggetto: OGGETTO.NESSUNO };
}

// Un prato che si ricorda di essere stato un campo stanco: quello che
// spianata() ha lasciato. È l'unico posto fuori dal campo dove la fertilità ha
// un senso, e il salvataggio lo accetta solo così.
export function pratoStanco(cambio) {
  return cambio?.oggetto === OGGETTO.NESSUNO && Number.isInteger(cambio.fertilita)
    && cambio.fertilita >= 0 && cambio.fertilita < FERTILITA_INIZIALE;
}

// La terra dopo aver ricevuto qualcosa: la cenere, una pianta interrata.
export function concimata(cambio) {
  return { ...cambio, fertilita: limitata(fertilitaDi(cambio) + 1) };
}

// Che cosa resta sul tassello dopo averci raccolto: la terra zappata, con la
// fertilità che il raccolto le ha tolto — o, per i fagioli, restituito. Prima
// il raccolto lasciava un prato, e il campo andava zappato da capo ogni volta:
// un gesto in più che non chiedeva di scegliere niente. Adesso la zappa serve
// una volta, e quello che costa è la terra.
export function dopoIlRaccolto(oggetto, cambio) {
  const f = fertilitaDi(cambio);
  if (oggetto === OGGETTO.APPASSITA) return conLaTerra(cambio, { oggetto: OGGETTO.TERRA_ZAPPATA });
  const ingrassa = oggetto === OGGETTO.MATURA && colture.di(cambio?.coltura).ingrassa;
  return { oggetto: OGGETTO.TERRA_ZAPPATA, fertilita: limitata(f + (ingrassa ? 1 : -1)) };
}

// La raccolta di questo tassello, con la terra che conta: la voce della sua
// coltura (vedi colture.js), e il raccolto principale di uno in più o in meno
// secondo la fertilità.
export function raccolta(base, oggetto, cambio) {
  const voce = colture.raccolta(base, oggetto, cambio);
  if (oggetto !== OGGETTO.MATURA) return voce;
  const f = fertilitaDi(cambio);
  const scarto = f >= FERTILITA_MASSIMA && !cambio?.patito ? 1 : f <= 1 ? -1 : 0;
  if (scarto === 0) return voce;
  const [primo, ...resto] = voce.resa;
  return { ...voce, resa: [{ ...primo, quante: Math.max(1, primo.quante + scarto) }, ...resto] };
}

export function eColtura(oggetto) {
  return CRESCITA.includes(oggetto) || oggetto in RITIRATI || oggetto === OGGETTO.A_SEME;
}

// Lo stadio dopo nella fila della sua coltura, con il passo a cui arriva, o
// niente se è l'ultimo. Passa dai ritirati, così una coltura di un salvataggio
// vecchio rientra nella catena nuova al primo giorno innaffiato.
function prossimoStadio(cambio) {
  if (cambio.oggetto in RITIRATI) {
    const oggetto = RITIRATI[cambio.oggetto];
    return { oggetto, passo: colture.di(cambio.coltura).stadi.indexOf(oggetto) };
  }
  const stadi = colture.di(cambio.coltura).stadi;
  const passo = colture.passoDi(cambio) + 1;
  if (passo >= stadi.length) return undefined;
  return { oggetto: stadi[passo], passo };
}

export function eMatura(oggetto) {
  return oggetto === OGGETTO.MATURA;
}

export function eAppassita(oggetto) {
  return oggetto === OGGETTO.APPASSITA;
}

// Sta ancora crescendo, cioè beve? La matura e quella andata a seme hanno
// finito: il loro orologio è un altro.
function inCrescita(oggetto) {
  return eColtura(oggetto) && !eMatura(oggetto) && oggetto !== OGGETTO.A_SEME;
}

// Il seme nella terra asciutta aspetta, e non muore: è quello che fa un seme.
// La sete la patisce solo quello che è già spuntato.
function spuntata(oggetto) {
  return inCrescita(oggetto) && oggetto !== OGGETTO.SEMINATO;
}

export function siPuoInnaffiare(oggetto) {
  return oggetto === OGGETTO.TERRA_ZAPPATA || inCrescita(oggetto);
}

// Quello che l'acqua fa a un tassello, detto una volta sola per il secchio e
// per la pioggia: lo bagna, e toglie la sete — una pianta assetata e poi
// innaffiata ha rotto la fila dei giorni asciutti, e le foglie tornano verdi
// subito, che è anche la risposta al gesto che serve.
export function bagna(cambio) {
  const { secco, ...resto } = cambio;
  return { ...resto, bagnato: true };
}

// Da chiamare a ogni cambio di giorno, e restituisce cosa è successo perché
// l'interfaccia deve poterlo dire: una coltura cresciuta, una seccata e un
// campo morto nella notte non possono passare in silenzio.
//
// Si raccoglie prima e si modifica poi: cambiare le modifiche mentre le si
// sta scorrendo è il modo classico di perdersi metà dell'orto.
export function nuovoGiorno() {
  const giorno = tempo.giornoCorrente();
  const siColtiva = stagioni.siColtiva();
  // La sete è quella del giorno appena finito, non di quello che comincia.
  const sete = seteDi(giorno - 1);

  const appassite = [];
  const seccate = [];
  const aSeme = [];
  const assetate = [];
  const daCrescere = [];
  const daDatare = [];
  const fermi = [];
  const alBuio = [];
  const alChiuso = [];
  const allAperto = [];
  modifiche.perOgnuno((tx, ty, vecchio) => {
    if (!eColtura(vecchio.oggetto)) return;
    let cambio = vecchio;
    const coltura = colture.di(cambio.coltura);
    // AL CHIUSO NON CRESCE NIENTE (M7.18.14). Le stanze sono fatte per
    // dormire, costruire e ripararsi; una pianta vuole il cielo. "Chiuso" è il
    // posto murato di riparo.js — una radura fra gli alberi resta campagna.
    //
    // Un orto seminato all'aperto e poi murato non muore di colpo: la prima
    // notte si ferma — non cresce anche se bagnato, non ha sete, e l'orologio
    // della matura sta fermo — e lo si scrive sul tassello. Se la notte dopo
    // è ancora chiuso, appassisce. In mezzo c'è un giorno per accorgersene e
    // smontare un muro; e il tasto davanti alla pianta lo dice prima.
    //
    // L'inverno però viene prima del buio: chi non regge il gelo muore
    // comunque, murato o no.
    if (!(!siColtiva && !coltura.gelo) && riparo.murato(tx, ty)) {
      if (cambio.buio) alBuio.push({ tx, ty, cambio });
      else alChiuso.push({ tx, ty, cambio });
      return;
    }
    // Riaperto dopo una notte al buio: si dimentica e si vive la notte come
    // tutte le altre. Si scrive a parte perché non tutti i rami qui sotto
    // riscrivono il tassello.
    if (cambio.buio) {
      const { buio, ...resto } = cambio;
      cambio = resto;
      allAperto.push({ tx, ty, cambio });
    }
    // D'inverno muore tutto quello che era piantato, maturo e a seme
    // compresi: è la scadenza, ed è la ragione per cui esiste una stagione
    // buona. Si guarda prima di far crescere, perché crescere e morire lo
    // stesso giorno sarebbe una crescita che nessuno ha visto.
    //
    // Tranne chi regge il gelo: il cavolo d'inverno non muore, si ferma. Non
    // cresce, non ha sete, e l'orologio di quello maturo sta fermo con lui —
    // se no un cavolo maturato a novembre andrebbe a seme a dicembre, e il
    // fresco di gennaio sarebbe una promessa che l'inverno non mantiene.
    if (!siColtiva) {
      if (!coltura.gelo) appassite.push({ tx, ty, cambio });
      else if (cambio.maturata !== undefined) fermi.push({ tx, ty, cambio });
      return;
    }
    if (!inCrescita(cambio.oggetto)) {
      // Una matura ha i giorni contati, e anche quella a seme: il momento in
      // cui è maturata è scritto sul tassello, ed è il solo dato che serve a
      // tutte e due. Senza data si assume adesso e la si scrive — senza
      // scriverla il confronto darebbe zero ogni giorno e quella coltura non
      // cambierebbe mai, un "non succede niente" che nessuna prova noterebbe.
      if (cambio.maturata === undefined) {
        daDatare.push({ tx, ty, cambio });
        return;
      }
      // Chi non va a seme — la patata, i fagioli — resta matura per tutti e
      // quattro i giorni e poi marcisce: il suo seme è il raccolto stesso.
      const eta = giorno - cambio.maturata;
      if (eta >= GIORNI_DI_MATURITA + GIORNI_A_SEME) {
        appassite.push({ tx, ty, cambio });
      } else if (eMatura(cambio.oggetto) && eta >= GIORNI_DI_MATURITA && coltura.aSeme) {
        aSeme.push({ tx, ty, cambio });
      }
      return;
    }
    if (cambio.bagnato) {
      daCrescere.push({ tx, ty, cambio });
      return;
    }
    if (!spuntata(cambio.oggetto)) return;
    const secco = (cambio.secco ?? 0) + sete;
    // "Patito" resta scritto fino al raccolto: una pianta che ha avuto sete
    // non rende di più nemmeno su una terra grassa.
    if (secco >= coltura.sete) seccate.push({ tx, ty, cambio });
    else assetate.push({ tx, ty, cambio: { ...cambio, secco, patito: true } });
  });

  for (const { tx, ty, cambio } of allAperto) modifiche.imposta(tx, ty, cambio);
  for (const { tx, ty, cambio } of alChiuso) {
    const fermo = { ...cambio, buio: 1 };
    if (cambio.maturata !== undefined) fermo.maturata = cambio.maturata + 1;
    modifiche.imposta(tx, ty, fermo);
  }
  for (const { tx, ty, cambio } of daDatare) {
    modifiche.imposta(tx, ty, { ...cambio, maturata: giorno });
  }
  // Fermo vuol dire che il giorno d'inverno non conta: la data della
  // maturazione avanza con il calendario, e l'età resta quella di ieri. Il
  // disegno non cambia, quindi basta annotarlo.
  for (const { tx, ty, cambio } of fermi) {
    modifiche.imposta(tx, ty, { ...cambio, maturata: cambio.maturata + 1 });
  }
  for (const { tx, ty, cambio } of [...appassite, ...seccate, ...alBuio]) {
    mappa.cambiaTassello(tx, ty, conLaTerra(cambio, { oggetto: OGGETTO.APPASSITA }));
  }
  for (const { tx, ty, cambio } of aSeme) {
    mappa.cambiaTassello(tx, ty, { ...cambio, oggetto: OGGETTO.A_SEME });
  }
  for (const { tx, ty, cambio } of assetate) {
    mappa.cambiaTassello(tx, ty, cambio);
  }

  let cresciute = 0;
  for (const { tx, ty, cambio } of daCrescere) {
    const prossimo = prossimoStadio(cambio);
    if (prossimo === undefined) continue;
    // Crescere asciuga e toglie la sete, e chi arriva a maturo si porta
    // dietro la data: da lì parte il conto dei giorni buoni. Il passo si
    // scrive solo per le colture che non sono la rapa: la sua fila non ripete
    // stadi, e un campo di rape resta scritto come prima.
    const { bagnato, secco, passo, ...resto } = cambio;
    const nuovo = { ...resto, oggetto: prossimo.oggetto };
    if (cambio.coltura !== undefined) nuovo.passo = prossimo.passo;
    if (eMatura(prossimo.oggetto)) nuovo.maturata = giorno;
    mappa.cambiaTassello(tx, ty, nuovo);
    cresciute += 1;
  }

  const mangiate = bestie(giorno);
  const riposate = riposo(giorno);

  // Anche la terra zappata e lasciata lì si asciuga: innaffiare in anticipo
  // non deve valere come innaffiare al momento giusto.
  const daAsciugare = [];
  modifiche.perOgnuno((tx, ty, cambio) => {
    if (cambio.bagnato) daAsciugare.push({ tx, ty, cambio });
  });
  for (const { tx, ty, cambio } of daAsciugare) {
    const { bagnato, ...resto } = cambio;
    mappa.cambiaTassello(tx, ty, resto);
  }

  return {
    cresciute,
    appassite: appassite.length,
    seccate: seccate.length,
    assetate: assetate.length,
    aSeme: aSeme.length,
    mangiate,
    riposate,
    alBuio: alBuio.length,
    alChiuso: alChiuso.length,
  };
}

// L'inverno a riposo: il primo giorno di primavera, la terra che non aveva
// niente di piantato ne esce con un punto in più. Chi ha tenuto un cavolo
// sotto la neve ha avuto il cavolo; la terra riposa solo se la si lascia.
function riposo(giorno) {
  if (stagioni.stagioneDi(giorno) !== "primavera" || stagioni.giornoNellaStagione(giorno) !== 1) return 0;
  const riposati = [];
  const guariti = [];
  modifiche.perOgnuno((tx, ty, cambio) => {
    // Anche il prato che si ricordava di essere stanco riposa, e quando torna
    // come nuovo se lo dimentica.
    if (pratoStanco(cambio)) {
      guariti.push({ tx, ty, cambio });
      return;
    }
    if (cambio.oggetto !== OGGETTO.TERRA_ZAPPATA && cambio.oggetto !== OGGETTO.APPASSITA) return;
    if (fertilitaDi(cambio) >= FERTILITA_MASSIMA) return;
    riposati.push({ tx, ty, cambio });
  });
  for (const { tx, ty, cambio } of riposati) mappa.cambiaTassello(tx, ty, concimata(cambio));
  for (const { tx, ty, cambio } of guariti) modifiche.imposta(tx, ty, spianata({ ...cambio, fertilita: cambio.fertilita + 1 }));
  return riposati.length;
}

// --- le bestie ----------------------------------------------------------------
//
// Di notte, in primavera e d'autunno, le bestie vengono a mangiare l'orto: una
// notte su due una pianta non protetta sparisce, e resta la terra. Sono le due
// stagioni in cui la fauna cammina di più per la valle (vedi fauna.js), e
// l'estate e l'inverno restano tranquilli per una ragione ciascuno — d'estate
// la prateria dà abbastanza, d'inverno nel campo non c'è niente.
//
// Non è una bestia che cammina davvero fino al campo, ed è una scelta: una
// pianta mangiata mentre dormi è la stessa cosa sia che l'abbia mangiata un
// cervo disegnato sia uno contato, e contarlo costa una riga invece di un
// comportamento. Il tiro è delle coordinate e del giorno, come tutto il resto
// del mondo: la stessa notte nello stesso orto va sempre allo stesso modo.
//
// Protegge l'orto uno spaventapasseri a tre tasselli o un fuoco acceso a tre
// tasselli. Fino a M7.18.13 bastavano anche dei muri; da M7.18.14 un orto
// murato non cresce, quindi la stanza chiusa protegge soltanto la notte di
// grazia prima che appassisca (vedi nuovoGiorno).
export const PROBABILITA_BESTIE = 0.5;

// Si possono spegnere, e lo fanno soltanto i collaudi: una prova sulla sete
// o sulla semina che fallisce perché stanotte è passato un cervo è una prova
// che non dice niente. Lo stesso motivo per cui il gelo si imposta da fuori.
let bestieAttive = true;
export function impostaBestie(attive) {
  bestieAttive = attive;
}
export const RAGGIO_SPAVENTAPASSERI = 3;

const PRELIBATE = new Set([OGGETTO.GERMOGLIO, OGGETTO.CRESCIUTA, OGGETTO.MATURA]);

export function protetta(tx, ty) {
  const r = RAGGIO_SPAVENTAPASSERI;
  for (let dy = -r; dy <= r; dy += 1) {
    for (let dx = -r; dx <= r; dx += 1) {
      if (mappa.oggettoDi(tx + dx, ty + dy) === OGGETTO.SPAVENTAPASSERI) return true;
    }
  }
  return mappa.fuocoVicino(tx, ty, r) || meteo.coperto(tx, ty);
}

function bestie(giorno) {
  if (!bestieAttive) return 0;
  const stagione = stagioni.stagioneDi(giorno - 1);
  if (stagione !== "primavera" && stagione !== "autunno") return 0;
  const seme = mappa.semeCorrente().valore;
  if (impronta(giorno, 0, seme ^ 0x6c0b2a5d) >= PROBABILITA_BESTIE) return 0;
  let scelta = null;
  let punteggio = Infinity;
  modifiche.perOgnuno((tx, ty, cambio) => {
    if (!PRELIBATE.has(cambio.oggetto)) return;
    const p = impronta(tx + giorno * 7, ty - giorno * 13, seme ^ 0x1f3d5b79);
    if (p < punteggio) {
      punteggio = p;
      scelta = { tx, ty, cambio };
    }
  });
  // Si sceglie fra tutte e poi si guarda se era protetta: la bestia è venuta
  // per quella, e se c'era lo spaventapasseri se n'è andata. Scegliere solo
  // fra le scoperte vorrebbe dire che proteggere metà orto sposta la bestia
  // sull'altra metà — vero, forse, ma una regola che non si vede.
  if (!scelta || protetta(scelta.tx, scelta.ty)) return 0;
  mappa.cambiaTassello(scelta.tx, scelta.ty, conLaTerra(scelta.cambio, { oggetto: OGGETTO.TERRA_ZAPPATA }));
  return 1;
}

export function innaffia(tx, ty, oggetto) {
  mappa.cambiaTassello(tx, ty, bagna({ ...(modifiche.di(tx, ty) ?? {}), oggetto }));
}

export function quante() {
  let n = 0;
  modifiche.perOgnuno((tx, ty, cambio) => {
    if (eColtura(cambio.oggetto)) n += 1;
  });
  return n;
}

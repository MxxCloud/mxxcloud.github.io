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
import * as colture from "./colture.js";
import * as contenitori from "./contenitori.js";
import * as stagioni from "./stagioni.js";
import * as simulazione from "./simulazione.js";
import * as entita from "../entita/entita.js";
import * as meteo from "./meteo.js";
import * as freddo from "./freddo.js";
import * as pesca from "./pesca.js";
import * as riparo from "./riparo.js";
import * as decadimento from "./decadimento.js";

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

// L'essiccatoio: quanti pezzi crudi per una razione secca, e quanti ne tiene.
//
// Tre a uno è il baratto della conserva, e il carico è un multiplo di tre —
// quindi 3 o 6, mai 4 né 5. Prendere "quello che c'è" farebbe restare due pezzi
// dentro a marcire senza che nessuno lo dica, e una regola che mangia due carni
// in silenzio è una trappola, non una difficoltà.
export const PEZZI_PER_RAZIONE = 3;
export const CARICO_MASSIMO = 6;

// Quanti pezzi entrano in un gesto, avendone tanti in mano e tanti già appesi.
//
// TRE PER VOLTA, e non "tutti quelli che ci stanno". Stendere sei pezzi con un
// tasto solo faceva sparire dallo zaino mezza scorta di carne in un fotogramma,
// e il giocatore se ne accorgeva dopo; tre per volta è il gesto che si vede —
// appendi una fila, guardi il telaio, appendi l'altra. Il carico massimo resta
// sei, quindi il secondo gesto è anche l'ultimo.
export function quanteSiStendono(disponibili, gia = 0) {
  const posto = Math.max(0, CARICO_MASSIMO - gia);
  if (posto < PEZZI_PER_RAZIONE || disponibili < PEZZI_PER_RAZIONE) return 0;
  return PEZZI_PER_RAZIONE;
}

// Cosa si stende, e cosa diventa.
//
// Il telaio non sa cosa gli appendi: sa che dopo tre soli quello che pende è
// una razione che arriva a marzo. Per questo è una tavola e non due rami di un
// "se": la carne è arrivata per prima e il pesce dopo, e il giorno che si
// seccheranno le rape sarà una riga, non una terza stesura della stessa regola.
//
// Le parole stanno qui accanto ai dati perché l'italiano non si deduce da un
// identificatore: "servono almeno 3 carni" e "servono almeno 3 pesci" cambiano
// genere e numero, e costruirle a pezzi in mezzo al codice è il modo più
// sicuro di scrivere "3 pesci secche".
export const SECCABILI = {
  carne_cruda: { secca: "carne_secca", tanti: "carni", quello: "la carne",
    uno: "carne secca", molti: "carni secche" },
  pesce_crudo: { secca: "pesce_secco", tanti: "pesci", quello: "il pesce",
    uno: "pesce secco", molti: "pesci secchi" },
  // I fagioli sono i primi al plurale, e il telaio lo deve dire bene: "il
  // pesce sta seccando", ma "i fagioli stanno".
  fagioli: { secca: "fagioli_secchi", tanti: "fagioli", quello: "i fagioli", plurale: true,
    uno: "manciata di fagioli secchi", molti: "manciate di fagioli secchi" },
};

// Quante ne sono, dette come si dicono. Una riga per non scrivere mai
// "ritirati: 1 pesci secchi", che è quello che diceva prima — e lo diceva
// anche per la carne, da M7.15: "ritirate 1 carni secche".
export function detteCosi(cosa, quante) {
  const voce = SECCABILI[cosa];
  return `${quante} ${quante === 1 ? voce.uno : voce.molti}`;
}

// Cosa sta seccando su questo telaio. Senza il campo è carne: è il carico di
// una partita cominciata quando il pesce non si seccava ancora, e chi torna a
// ritirarlo deve trovarci quello che ci aveva messo.
export function stesoIn(tx, ty) {
  const cosa = modifiche.di(tx, ty)?.cosa;
  return SECCABILI[cosa] ? cosa : "carne_cruda";
}

// Cosa brucia in un fuoco, e quanto ne serve per una tacca.
//
// IL CONTATORE CONTA IN LEGNA. Una tacca è una legna, e tutto il resto è un
// cambio: due rami, dieci fibre. Il fuoco non impara unità nuove, impara
// cambi — è la ragione per cui la tacca resta un intero e il messaggio resta
// "2/4 legna" anche quando dentro ci è andata dell'erba secca.
//
// I RAMI, DUE PER UNA. Misurato: un albero rende tre legna e un ramo solo, cioè
// tre tacche contro mezza — la legna scalda sei volte tanto a parità di albero
// abbattuto. A uno i due materiali diventerebbero la stessa cosa e la legna
// perderebbe il mestiere; a tre il ramo non varrebbe la fatica di tenerlo.
// A due il ramo è quello che è: una riserva. E risolve quello che il ramo era
// diventato — entrava da ogni albero e usciva da cinque ricette che si fanno
// una volta sola, quindi si accumulava a quaranta per casella senza che niente
// lo consumasse.
//
// LA FIBRA, DIECI PER UNA, ed è il fuoco di chi non ha un'ascia. Un cespuglio
// dà due fibre con uno strappo a mani nude, quindi una tacca sono cinque
// cespugli: cinque gesti contro i due terzi di colpo d'ascia che costa una
// legna. Cara in fatica, gratis in attrezzi — e i cespugli stanno dappertutto,
// anche dove non c'è un albero. È il combustibile del viandante rimasto a
// secco, non quello con cui si tiene caldo un camino: chi ha la legna non
// brucerà mai l'erba, perché quella serve a torce, giacigli e mezzo catalogo.
// Il filo di lino invece non brucia affatto: un campo innaffiato quattro volte
// per fare quello che fanno due rami sarebbe l'errore, non la scelta.
const COMBUSTIBILI = {
  legna: { quante: 1, tanti: "legna" },
  ramo: { quante: 2, tanti: "rami" },
  fibra: { quante: 10, tanti: "fibra" },
};

// Come si chiama il fuoco che si ha davanti, per il verbo e per il messaggio.
//
// Sta qui e non nel catalogo degli oggetti perché è il fuoco sul tassello a
// parlare, non la cosa nello zaino: nello zaino il falò è spento per
// definizione, sul tassello è tutte e due le cose a giorni alterni.
const NOME_DEL_FUOCO = {
  [OGGETTO.FOCOLARE_ACCESO]: "focolare",
  [OGGETTO.FOCOLARE_SPENTO]: "focolare",
  [OGGETTO.FALO_ACCESO]: "falò",
  [OGGETTO.FALO_SPENTO]: "falò",
};

const COLPI_DURI = new Set([OGGETTO.ALBERO, OGGETTO.SASSO, OGGETTO.MURO, OGGETTO.MURO_ROTTO, OGGETTO.CARRO, OGGETTO.TRONCO]);

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
  if (azione.tipo === "zappa" || azione.tipo === "interra") return "zappa";
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
  // "Scalda" e non "è il falò": un fuoco su cui non si cucina sarebbe un fuoco
  // che il giocatore deve imparare a memoria invece che guardare.
  const cotto = cosaInMano && CATALOGO[cosaInMano]?.cuoce;
  if (cotto && mappa.scaldaIn(b.tx, b.ty)) {
    return { tipo: "cucina", verbo: "Cucina", cosa: cosaInMano, diventa: cotto, bersaglio: b };
  }

  // Il focolare: con del combustibile in mano lo si carica, altrimenti lo si
  // guarda.
  //
  // Guardare è un'azione vera e non un ripiego, ed è l'unica del gioco che non
  // cambia niente: quanta legna ha dentro un camino è la cosa che decide se
  // stanotte si dorme al caldo, e non si vede — la fiamma è la stessa con una
  // legna e con quattro. Un dato che decide e non si vede è una trappola, e
  // questo gioco le scadenze le annuncia.
  //
  // Una carica per volta, come si cuoce una carne per volta: il focolare è il
  // posto in cui si torna, e tornarci con la legna è il gesto. Farlo fare al
  // tasto una volta sola, per quattro giorni, vorrebbe dire una casa che non
  // chiede niente — cioè un monumento, che è quello che decadimento.js dice di
  // non voler costruire.
  if (decadimento.siCarica(b.oggetto)) {
    const legna = decadimento.legnaNel(b.tx, b.ty);
    const capienza = decadimento.capienzaDi(b.oggetto);
    const quale = NOME_DEL_FUOCO[b.oggetto];
    const fascina = COMBUSTIBILI[cosaInMano];
    if (fascina && legna < capienza) {
      // Il cambio sta scritto sul tasto quando non è uno, e non in un messaggio
      // dopo: quanto costa una tacca è la cosa che si vuole sapere prima di
      // darla, e un giocatore che lo scopre contando i rami spariti dallo zaino
      // l'ha imparato nel modo sbagliato.
      return { tipo: "carica", bersaglio: b, legna, capienza, fuoco: quale,
        cosa: cosaInMano, quante: fascina.quante,
        verbo: fascina.quante > 1
          ? `Carica il ${quale} (${fascina.quante} ${fascina.tanti})`
          : `Carica il ${quale}`,
        // La pioggia non impedisce più di POSARE un fuoco — quello che si posa
        // è una fossa fredda, e l'acqua su una fossa fredda non ha niente da
        // dire — ma impedisce di accenderlo allo scoperto. La regola non è
        // cambiata, è arrivata al punto giusto: prima rifiutava il gesto
        // sbagliato, adesso rifiuta quello che l'acqua spegnerebbe la sera
        // stessa.
        impedito: inventario.quante(cosaInMano) < fascina.quante
          ? `servono ${fascina.quante} ${fascina.tanti}`
          : meteo.evento() === "pioggia" && !meteo.riparatoDallaPioggia(b.tx, b.ty)
            ? "piove: accendi il fuoco al chiuso o sotto gli alberi" : null };
    }
    // A mani vuote, se c'è della cenere, la si prende: è quello che resta
    // della legna bruciata, e sul campo è concime (vedi decadimento.js).
    const cenere = decadimento.cenereNel(b.tx, b.ty);
    if (!cosaInMano && cenere > 0) {
      return { tipo: "cenere", verbo: `Prendi la cenere (${cenere})`, bersaglio: b, quante: cenere,
        impedito: inventario.spazioPer("cenere") < cenere ? "zaino pieno: getta qualcosa con G" : null };
    }
    return { tipo: "guarda", verbo: `Guarda il ${quale}`, bersaglio: b, legna, capienza, fuoco: quale };
  }

  // L'essiccatoio, i due gesti che lo riguardano. Stanno sopra il catalogo
  // della raccolta come il fuoco che si carica: sono l'unica cosa da fare a un
  // telaio che si ha davanti, e la X resta libera di portarselo via.
  // Si stende su un telaio vuoto e su uno già carico che abbia ancora posto,
  // purché sia la stessa roba: due file di pesce o due file di carne, mai una
  // per una.
  //
  // E IL CONTO RIPARTE DA OGGI, per tutto quello che pende. Non è una
  // punizione gratuita: senza, appendere tre pezzi il giorno prima che il
  // telaio sia pronto li faceva seccare in un giorno invece di tre, cioè si
  // barava aspettando. Qui la scelta è quella di sempre — in un gioco sulla
  // sopravvivenza, fra due regole si tiene la più severa — e la riga che ne
  // esce è anche più corta da spiegare: il telaio secca quello che ha, da
  // quando ce l'ha tutto.
  //
  // Il costo sta scritto sul tasto, come per i rami del focolare, e solo
  // quando c'è: rabboccando lo stesso giorno il conto riparte da oggi, che è
  // dov'era già. Chi riempie il telaio con due pressioni di seguito non paga
  // niente, e chi torna domani lo sa prima di premere.
  const daSeccare = SECCABILI[cosaInMano];
  const siStende = b.oggetto === OGGETTO.ESSICCATOIO
    || (b.oggetto === OGGETTO.ESSICCATOIO_CARICO && stesoIn(b.tx, b.ty) === cosaInMano);
  if (daSeccare && siStende) {
    const dati = b.oggetto === OGGETTO.ESSICCATOIO ? null : modifiche.di(b.tx, b.ty);
    const gia = dati?.quante ?? 0;
    const quante = quanteSiStendono(inventario.quante(cosaInMano), gia);
    const riparte = gia > 0 && (dati?.dal ?? tempo.giornoCorrente()) < tempo.giornoCorrente();
    if (quante > 0 || gia === 0) {
      // D'inverno si può stendere lo stesso — la roba aspetta, e in primavera
      // riparte da sola — ma il tasto lo dice prima, se no un telaio che per
      // una stagione intera non cambia disegno si legge come un telaio rotto.
      // L'inverno passa davanti al conto che riparte: fra due avvisi si dà
      // quello che il giocatore non può indovinare da solo.
      const dInverno = stagioni.stagioneCorrente() === "inverno";
      const nota = dInverno ? " (d'inverno non secca)" : riparte ? " (riparte il conto)" : "";
      return { tipo: "stendi", verbo: `Stendi${nota}`,
        quante, gia, riparte, dInverno, cosa: cosaInMano, bersaglio: b,
        impedito: quante === 0 ? `servono almeno ${PEZZI_PER_RAZIONE} ${daSeccare.tanti}` : null };
    }
  }
  if (b.oggetto === OGGETTO.ESSICCATOIO_PRONTO) {
    return { tipo: "ritira", verbo: "Ritira", bersaglio: b };
  }
  // Carico non si tocca, e dirlo serve a una cosa sola: che chi ci sta davanti
  // sappia che la carne è ancora lì dentro e non è andata persa.
  if (b.oggetto === OGGETTO.ESSICCATOIO_CARICO) {
    // Perché non è ancora pronto, e non solo che non lo è: d'inverno il conto
    // sta fermo fino a primavera, e un telaio che non si muove per quattro
    // giorni senza che nessuno dica niente è un telaio che sembra guasto.
    const { quello, plurale } = SECCABILI[stesoIn(b.tx, b.ty)];
    const fermo = stagioni.stagioneCorrente() === "inverno"
      ? `d'inverno ${quello} non ${plurale ? "seccano" : "secca"}`
      : `${quello} ${plurale ? "stanno" : "sta"} ancora seccando`;
    return { tipo: "essiccatoio", verbo: "Guarda l'essiccatoio", bersaglio: b, impedito: fermo };
  }

  // Con la zappa in mano una pianta morta non si ripulisce: si interra. Niente
  // fibra, ma la terra ne esce più grassa — è il compost, ed è la scelta fra
  // una benda domani e un raccolto migliore la prossima volta.
  if (b.oggetto === OGGETTO.APPASSITA && ATTREZZI[strumento(cosaInMano, indice, "zappa")]?.zappa) {
    const piena = orto.fertilitaDi(modifiche.di(b.tx, b.ty)) >= orto.FERTILITA_MASSIMA;
    return { tipo: "interra", verbo: "Interra", bersaglio: b, impedito: piena ? "la terra è già grassa" : null };
  }

  const raccolta = raccoltaIn(b.oggetto, b.tx, b.ty);
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

  // Il seme che si ha in mano decide la coltura: sono tre semi, una patata e
  // un fagiolo, e ognuno pianta la sua.
  const semina = colture.dalSeme(cosaInMano);
  if (semina && b.oggetto === OGGETTO.TERRA_ZAPPATA) {
    const coltura = colture.di(semina);
    // La terra si dice sul tasto, quando non è quella di sempre: grassa rende
    // di più, stanca di meno, e sfinita accetta solo i fagioli — che è anche
    // il rimedio, scritto dove serve.
    const f = orto.fertilitaDi(modifiche.di(b.tx, b.ty));
    const nota = f >= orto.FERTILITA_MASSIMA ? " (terra grassa)" : f === 1 ? " (terra stanca)" : f === 0 ? " (terra sfinita)" : "";
    const gesto = { tipo: "semina", verbo: coltura.verbo + nota, coltura: semina, bersaglio: b };
    // Zappare d'inverno resta permesso — preparare il campo per la primavera è
    // una cosa sensata da fare — ma seminare no: il seme morirebbe la notte
    // stessa, e farglielo scoprire dopo sarebbe una trappola travestita da
    // regola. Fuori dalla sua stagione vale lo stesso, e si dice quale è: un
    // fagiolo seminato in autunno non vedrebbe l'estate.
    if (!stagioni.siColtiva()) return { ...gesto, impedito: "d'inverno non germoglia" };
    if (!coltura.stagioni.includes(stagioni.stagioneCorrente())) return { ...gesto, impedito: coltura.quando };
    if (f === 0 && !coltura.ingrassa) return { ...gesto, impedito: "terra sfinita: solo fagioli, cenere o riposo" };
    return gesto;
  }

  // La cenere si sparge sulla terra del campo, vuota o già seminata: è
  // concime, e il concime si dà anche a quello che cresce. Sulla terra già
  // grassa non serve, e lo si dice prima di sprecarla.
  if (cosaInMano === "cenere" && (b.oggetto === OGGETTO.TERRA_ZAPPATA || orto.eColtura(b.oggetto))) {
    const piena = orto.fertilitaDi(modifiche.di(b.tx, b.ty)) >= orto.FERTILITA_MASSIMA;
    return { tipo: "spargi", verbo: "Spargi la cenere", bersaglio: b, impedito: piena ? "la terra è già grassa" : null };
  }

  if (cosaInMano === "secchio_pieno" && orto.siPuoInnaffiare(b.oggetto)) {
    const gia = modifiche.di(b.tx, b.ty)?.bagnato === true;
    if (!gia) return { tipo: "innaffia", verbo: "Innaffia", bersaglio: b };
    return null;
  }

  // Una pianta assetata lo dice a chi le sta davanti, con qualunque cosa in
  // mano: le foglie gialle si vedono, ma "gialle" non dice se stanotte è
  // morta, e da M7.16 può succedere.
  const pianta = modifiche.di(b.tx, b.ty);
  if (orto.eColtura(b.oggetto) && pianta?.secco > 0) {
    const quanto = orto.seccaStanotte(pianta) ? "ha sete: stanotte secca" : "ha sete: senz'acqua non cresce";
    return { tipo: "coltura", verbo: "Guarda", bersaglio: b, impedito: quanto };
  }

  const posa = cosaInMano && CATALOGO[cosaInMano]?.posa;
  if (posa !== undefined && posa !== null && posabile(b)) {
    // Sotto un albero il falò si accende anche mentre piove, ed è la seconda
    // metà del riparo debole: senza, la chioma rallentava l'acqua e non dava
    // niente da fare. Con, il viaggiatore ha il suo ciclo — ti infili nella
    // macchia, accendi, ti asciughi — e la pioggia diventa una cosa a cui si
    // reagisce invece di una cosa che si subisce.
    // Il focolare vuole quattro mura, ed è quello che gli impedisce di essere
    // soltanto un falò migliore: in viaggio, sotto un temporale, dentro una
    // macchia, il falò resta l'unica risposta. In cambio, dove sta, la pioggia
    // non lo tocca mai — non serve dirlo da nessuna parte, perché la pioggia
    // spegne i fuochi scoperti e lui scoperto non è per definizione.
    if (cosaInMano === "focolare" && riparo.stanzaDi(b.tx, b.ty) === null)
      return { tipo: "posa", bersaglio: b, impedito: "il focolare vuole quattro mura" };
    // E l'essiccatoio vuole l'esatto contrario: aria. I due insieme fanno le
    // due metà di una fattoria — il fuoco dentro, la carne fuori — e sono la
    // prima coppia di regole di posa che si spiegano a vicenda.
    if (cosaInMano === "essiccatoio" && riparo.stanzaDi(b.tx, b.ty) !== null)
      return { tipo: "posa", bersaglio: b, impedito: "l'essiccatoio vuole aria" };
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

// --- smontare: la X -------------------------------------------------------

// QUELLO CHE È TUO SI SMONTA, QUELLO CHE È DEL MONDO SI ABBATTE.
//
// È una regola sola e sta su un tasto solo. Fino a M7.13 non era così: la
// porta e il giaciglio si toglievano con la X, la cassa dal suo pannello, il
// banco e il focolare a colpi di barra come un albero. Tre gesti per una cosa
// sola, e nessuno dei tre si poteva indovinare dall'altro — che è il modo più
// sicuro di avere un gioco che si impara a memoria invece che guardandolo.
//
// Adesso: davanti a una cosa che hai costruito, X. Un gesto solo, e torna in
// mano intera. Il muro resta fuori di proposito — quello si abbatte a colpi e
// rende le pietre che è costato — perché un muro non si smonta, si demolisce.
//
// E la barra resta libera di fare l'altra cosa, che è la ragione per cui i due
// tasti sono due: la barra apre la cassa, apre la porta, ci si dorme sopra e ci
// si cucina, ed è il tasto che si preme di notte con qualcuno alle calcagna.
// Non deve poter portare via la porta.
const SMONTAGGI = {
  [OGGETTO.PORTA]: { cosa: "porta", verbo: "Stacca la porta" },
  [OGGETTO.PORTA_APERTA]: { cosa: "porta", verbo: "Stacca la porta" },
  [OGGETTO.GIACIGLIO]: { cosa: "giaciglio", verbo: "Smonta il giaciglio" },
  [OGGETTO.GIACIGLIO_PELLI]: { cosa: "giaciglio_pelli", verbo: "Smonta il giaciglio" },
  [OGGETTO.BANCO]: { cosa: "banco", verbo: "Smonta il banco" },
  [OGGETTO.CASSA]: { cosa: "cassa", verbo: "Smonta la cassa" },
  [OGGETTO.FOCOLARE_SPENTO]: { cosa: "focolare", verbo: "Smonta il focolare" },
  [OGGETTO.FOCOLARE_ACCESO]: { cosa: "focolare", verbo: "Smonta il focolare" },
  // Il falò si raccoglie da spento come il focolare, e per lo stesso motivo:
  // un fuoco acceso in tasca non esiste, e la legna che ci hai messo dentro
  // non si riprende cambiando idea. Qui la cenere delle rovine conta come
  // roba tua — chi arriva a un accampamento bruciato trova una fossa già
  // fatta, e può portarsela via o riaccenderla.
  [OGGETTO.FALO_SPENTO]: { cosa: "falo", verbo: "Raccogli il falò", detto: "raccolto" },
  [OGGETTO.FALO_ACCESO]: { cosa: "falo", verbo: "Raccogli il falò", detto: "raccolto" },
  // L'essiccatoio in tutti e tre gli stati. Carico e pronto compaiono qui
  // apposta invece di restare fuori: la X deve poter dire PERCHÉ non si può,
  // e una cosa che non risponde al tasto è indistinguibile da una dimenticata.
  [OGGETTO.ESSICCATOIO]: { cosa: "essiccatoio", verbo: "Smonta l'essiccatoio" },
  [OGGETTO.ESSICCATOIO_CARICO]: { cosa: "essiccatoio", verbo: "Smonta l'essiccatoio" },
  [OGGETTO.ESSICCATOIO_PRONTO]: { cosa: "essiccatoio", verbo: "Smonta l'essiccatoio" },
  [OGGETTO.SPAVENTAPASSERI]: { cosa: "spaventapasseri", verbo: "Smonta lo spaventapasseri" },
};

// Gli stati dell'essiccatoio in cui c'è dentro della carne.
const ESSICCATOIO_PIENO = new Set([OGGETTO.ESSICCATOIO_CARICO, OGGETTO.ESSICCATOIO_PRONTO]);

// Un gesto e non un lavoro, quindi si paga in un colpo solo. Quanto un colpo
// dato bene: smontare è più che sollevare e meno che abbattere.
const FATICA_SMONTAGGIO = 0.02;

// Cosa farebbe la X adesso, o null. Serve all'interfaccia, che deve poterlo
// dire prima invece di lasciare indovinare: è lo stesso patto di
// azionePossibile(), e per la stessa ragione il perché di un rifiuto si dice
// qui e non dopo aver premuto.
//
// Prende l'eroe e non due coordinate perché è un gesto su quello che si ha
// davanti, come getta(): chi chiama non deve sapere cos'è un tassello.
export function smontaggioPossibile(eroe) {
  const b = bersaglio(eroe);
  const voce = SMONTAGGI[b.oggetto];
  if (!voce) return null;
  // "detto" è come si racconta il gesto una volta fatto, quando "smontato" non
  // è la parola giusta: una fossa di pietre non si smonta, si raccoglie.
  return { tipo: "smonta", verbo: voce.verbo, cosa: voce.cosa, detto: voce.detto ?? "smontato",
    bersaglio: b, impedito: perche(b, voce) };
}

// Le due cose che si smontano solo da vuote, e i due motivi sono diversi.
//
// La cassa: una cassa piena sollevabile sarebbe uno zaino da dodici caselle da
// portarsi dietro, e il limite dello zaino è una delle poche cose che in un
// survival costringono a scegliere. Vuota invece si sposta, perché sbagliare
// dove costruire deve costare la fatica di svuotarla e non la cassa.
//
// Il focolare: dentro c'è un fuoco acceso. Smontare un camino mentre brucia
// vorrebbe dire metterselo in tasca acceso, e soprattutto vorrebbe dire che la
// legna dentro si può riavere indietro cambiando idea — cioè un ripostiglio
// per la legna travestito da fuoco. Si aspetta che finisca, o si aspetta di
// aver pagato per tornare a prendersi la pietra.
function perche(b, voce) {
  if (b.oggetto === OGGETTO.CASSA && !contenitori.eVuota(b.tx, b.ty)) return "prima svuotala";
  // L'essiccatoio: è il terzo caso, e ha la stessa forma dei primi due. Dentro
  // c'è roba tua, e smontare il telaio con la carne appesa vorrebbe dire farla
  // sparire — di nuovo un ripostiglio travestito da struttura.
  if (ESSICCATOIO_PIENO.has(b.oggetto)) return `prima ritira ${SECCABILI[stesoIn(b.tx, b.ty)].quello}`;
  if (NOME_DEL_FUOCO[b.oggetto] && decadimento.legnaNel(b.tx, b.ty) > 0) {
    return `il ${NOME_DEL_FUOCO[b.oggetto]} è acceso: ${decadimento.legnaNel(b.tx, b.ty)}/${decadimento.capienzaDi(b.oggetto)}`;
  }
  // Il messaggio è quello finito e non una parola d'ordine da tradurre altrove:
  // chi lo riceve lo mostra e basta, e il rimedio sta dentro la frase perché
  // è lì che serve saperlo.
  if (inventario.spazioPer(voce.cosa) < 1) return "zaino pieno: getta qualcosa con G";
  return null;
}

// Il gesto vero. Restituisce cosa è successo, come agisci(): un rifiuto non è
// il silenzio, è una frase da far leggere.
export function smontaDavanti(eroe) {
  const azione = smontaggioPossibile(eroe);
  if (!azione) return null;
  if (azione.impedito) return { tipo: "impedito", messaggio: azione.impedito };

  const { tx, ty } = azione.bersaglio;
  inventario.aggiungi(azione.cosa, 1);
  mappa.cambiaTassello(tx, ty, { oggetto: OGGETTO.NESSUNO });
  bisogni.consuma("stanchezza", FATICA_SMONTAGGIO);
  return { tipo: "smontato", cosa: azione.cosa, detto: azione.detto, tx, ty };
}

// La stessa cosa dal pannello della cassa, dove non si ha un "davanti" ma due
// coordinate. Resta perché la cassa è l'unica che si smonta anche da aperta —
// ed è lì che si scopre di averla svuotata.
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

// La voce della raccolta per quello che sta su questo tassello. È quella della
// tavola in oggetti.js, tranne per l'orto: lì la matura e quella a seme rendono
// quello della loro coltura, che il tassello si ricorda (vedi colture.js).
function raccoltaIn(oggetto, tx, ty) {
  const base = raccoltaDi(oggetto);
  if (!base || !orto.eColtura(oggetto)) return base;
  return orto.raccolta(base, oggetto, modifiche.di(tx, ty));
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
    : esito?.tipo === "zappa" || esito?.tipo === "interra" ? 0.02
    : ["colpo", "raccolto"].includes(esito?.tipo) ? (scopo === "raccolta" ? 0.015 : 0.005)
    : ({ semina: 0.005, innaffia: 0.005, spargi: 0.005, posa: 0.01, cotto: 0.005, riempi: 0.005 }[esito?.tipo] ?? 0);
  if (costo) bisogni.consuma("stanchezza", costo);
  if (esito && attrezzo && (["combattuto", "colpo", "raccolto", "zappa", "interra"].includes(esito.tipo) || esito.lavorato)) {
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

  if (azione.tipo === "guarda") {
    return { tipo: "guardato", tx, ty, legna: azione.legna, massimo: azione.capienza, fuoco: azione.fuoco };
  }

  if (azione.tipo === "carica") {
    if (!inventario.togli(azione.cosa, azione.quante)) return null;
    const legna = Math.min(azione.capienza, azione.legna + 1);
    // Il tassello si riscrive da zero e non si aggiorna: quello che c'era
    // dentro era il conto di prima e la data di un fuoco che si misurava a
    // giorni. Un campo che nessuno legge più è un campo che qualcuno un giorno
    // leggerà.
    //
    // La cenere no: è quello che è rimasto delle cariche di prima, e sta sul
    // fondo del camino finché qualcuno non la prende.
    const cenere = decadimento.cenereNel(tx, ty);
    mappa.cambiaTassello(tx, ty, { oggetto: decadimento.accesoDi(azione.bersaglio.oggetto) ?? azione.bersaglio.oggetto, legna,
      ...(cenere > 0 ? { cenere } : {}) });
    // E ci si fa da parte, per la stessa ragione di quando si posa: accendere
    // un falò lo rende solido — la fossa fredda non lo era — e il riquadro
    // d'urto sborda spesso nel tassello davanti. Senza questa riga si accende
    // il fuoco dentro cui si sta.
    const [dx, dy] = SCARTI[eroe.guarda] ?? SCARTI.giu;
    urti.spingiFuori(eroe, dx, dy);
    return { tipo: "carica", tx, ty, legna, massimo: azione.capienza, fuoco: azione.fuoco,
      cosa: azione.cosa, quante: azione.quante };
  }

  if (azione.tipo === "stendi") {
    if (azione.quante === 0 || !inventario.togli(azione.cosa, azione.quante)) return null;
    // "dal" e non un contatore: quanti giorni asciutti siano passati lo sa il
    // calendario, che è una funzione pura del giorno e del seme. E riparte da
    // oggi anche rabboccando: il telaio secca quello che ha, da quando ce l'ha
    // tutto — vedi il commento sull'azione.
    mappa.cambiaTassello(tx, ty, {
      oggetto: OGGETTO.ESSICCATOIO_CARICO,
      dal: tempo.giornoCorrente(),
      quante: azione.gia + azione.quante,
      cosa: azione.cosa,
    });
    return { tipo: "stendi", tx, ty, quante: azione.quante, appesi: azione.gia + azione.quante,
      riparte: azione.riparte, cosa: azione.cosa, tanti: SECCABILI[azione.cosa].tanti };
  }

  if (azione.tipo === "ritira") {
    const quante = modifiche.di(tx, ty)?.quante ?? PEZZI_PER_RAZIONE;
    const cosa = stesoIn(tx, ty);
    const voce = SECCABILI[cosa];
    const secche = Math.floor(quante / PEZZI_PER_RAZIONE);
    // Si prende quello che ci sta e il resto resta appeso, come per i mucchi:
    // far sparire una scorta di tre stagioni perché lo zaino era pieno sarebbe
    // il difetto peggiore che questa tappa possa avere. E quello che resta
    // appeso resta quello che era: senza "cosa" un pesce a metà ritiro
    // diventerebbe carne.
    const resto = inventario.aggiungi(voce.secca, secche);
    if (resto === secche) return { tipo: "zainoPieno" };
    if (resto > 0) mappa.cambiaTassello(tx, ty, { oggetto: OGGETTO.ESSICCATOIO_PRONTO, quante: resto * PEZZI_PER_RAZIONE, cosa });
    else mappa.cambiaTassello(tx, ty, { oggetto: OGGETTO.ESSICCATOIO });
    return { tipo: "ritira", tx, ty, secche: secche - resto, cosa,
      dette: detteCosi(cosa, secche - resto) };
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

  if (azione.tipo === "interra") {
    mappa.cambiaTassello(tx, ty, orto.concimata(orto.dopoIlRaccolto(OGGETTO.APPASSITA, modifiche.di(tx, ty))));
    return { tipo: "interra" };
  }

  if (azione.tipo === "spargi") {
    if (!inventario.togli("cenere", 1)) return null;
    mappa.cambiaTassello(tx, ty, orto.concimata(modifiche.di(tx, ty) ?? { oggetto: azione.bersaglio.oggetto }));
    return { tipo: "spargi" };
  }

  if (azione.tipo === "cenere") {
    const quante = decadimento.prendiCenere(tx, ty);
    if (quante > 0) inventario.aggiungi("cenere", quante);
    return { tipo: "cenere", quante };
  }

  if (azione.tipo === "semina") {
    const seme = colture.di(azione.coltura).seme;
    if (!inventario.togli(seme, 1)) return null;
    // La rapa non scrive la sua coltura, com'è sempre stato: un campo di rape
    // resta scritto uguale a quello di un salvataggio di prima. La terra sì,
    // se ne ha una sua: è la stessa terra, con dentro un seme.
    const cambio = { oggetto: OGGETTO.SEMINATO };
    const terra = modifiche.di(tx, ty)?.fertilita;
    if (terra !== undefined) cambio.fertilita = terra;
    if (azione.coltura !== colture.RAPA) {
      cambio.coltura = azione.coltura;
      cambio.passo = 0;
    }
    mappa.cambiaTassello(tx, ty, cambio);
    return { tipo: "semina", coltura: azione.coltura };
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
  const raccolta = raccoltaIn(oggetto, tx, ty);
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
  //
  // Il campo no: lì resta la terra zappata, con la fertilità che il raccolto
  // le ha lasciato (vedi orto.js).
  mappa.cambiaTassello(tx, ty, orto.eDelCampo(oggetto)
    ? orto.dopoIlRaccolto(oggetto, precedente)
    : { oggetto: OGGETTO.NESSUNO, svuotata: tempo.giornoCorrente() });

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

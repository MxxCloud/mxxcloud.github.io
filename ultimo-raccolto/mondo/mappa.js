// Mappa: catalogo dei tasselli, settori pre-disegnati, collisioni.
//
// Il mondo è infinito e calcolato (vedi generazione.js), ma ridisegnare 24x14
// tasselli pixel per pixel a ogni fotogramma sarebbe uno spreco: il terreno non
// cambia quasi mai. Quindi si lavora per settori di 16x16 tasselli, ognuno
// cotto una volta in un canvas da 256x256 e ridisegnato solo se qualcosa
// dentro di lui cambia. Ogni fotogramma copia i pochi settori inquadrati.

import * as schermo from "../motore/schermo.js";
import { impronta, semeDaTesto } from "../motore/casuale.js";
import { cuoci, mascherato, ruotato, sovrapposto } from "../arte/sprite.js";
import * as terrenoArte from "../arte/sprite-terreno.js";
import * as oggettiArte from "../arte/sprite-oggetti.js";
import * as luoghiArte from "../arte/sprite-luoghi.js";
import * as coseArte from "../arte/sprite-cose.js";
import * as ortoArte from "../arte/sprite-orto.js";
import * as transizioniArte from "../arte/sprite-transizioni.js";
import { TERRENO, OGGETTO, terrenoIn, oggettoIn, preparaRovine, inselvatichitaNellOrto } from "./generazione.js";
import * as modifiche from "./modifiche.js";
import { TAVOLOZZA, TAVOLOZZA_BAGNATA, FOGLIE_ASSETATE, TERRA_STANCA, TERRA_SFINITA } from "../arte/tavolozza.js";

const { TASSELLO } = schermo;
export const SETTORE = 16;
const LATO_SETTORE = SETTORE * TASSELLO;

// --- cataloghi ------------------------------------------------------------

// L'acqua è l'unico terreno che ferma: la roccia è terreno sassoso, non parete.
// Quando arriveranno le pareti saranno oggetti, non tasselli di terreno.
const CATALOGO = {
  [TERRENO.GHIACCIO]: { varianti: terrenoArte.GHIACCIO, solido: false },
  [TERRENO.ACQUA]: { varianti: terrenoArte.ACQUA, solido: true },
  [TERRENO.ACQUA_BASSA]: { varianti: terrenoArte.ACQUA_BASSA, solido: true },
  [TERRENO.SABBIA]: { varianti: terrenoArte.SABBIA, solido: false },
  // "Fiorabile" dice soltanto che su questo terreno può crescere qualcosa di
  // piccolo. Quando — cioè in che stagione — non lo sa la mappa: glielo passa
  // dall'alto chi conosce il calendario.
  [TERRENO.ERBA]: { varianti: terrenoArte.ERBA, solido: false, fiorabile: true },
  [TERRENO.STERPAGLIA]: { varianti: terrenoArte.STERPAGLIA, solido: false, fiorabile: true },
  [TERRENO.ROCCIA]: { varianti: terrenoArte.ROCCIA, solido: false },
  [TERRENO.TERRA]: { varianti: terrenoArte.TERRA, solido: false },
};

// Il cespuglio si attraversa: serve a sporcare la vista e a nascondere, non a
// bloccare. Alberi e sassi fermano, e fermano l'intero tassello — più preciso
// di così, a sedici pixel, il giocatore lo leggerebbe come un blocco casuale.
const CATALOGO_OGGETTI = {
  [OGGETTO.CARRO]: { sprite: luoghiArte.CARRO, solido: true },
  [OGGETTO.POZZO]: { sprite: luoghiArte.POZZO, solido: true },
  [OGGETTO.TRONCO]: { sprite: luoghiArte.TRONCO, solido: true },
  [OGGETTO.ALBERO]: { sprite: oggettiArte.ALBERO, solido: true },
  [OGGETTO.SASSO]: { sprite: oggettiArte.SASSO, solido: true },
  [OGGETTO.CESPUGLIO]: { sprite: oggettiArte.CESPUGLIO, solido: false },
  // Le piante selvatiche (M7.18.30) si attraversano come il cespuglio: sono
  // erba alta, non un ostacolo.
  [OGGETTO.SPIGHE_SELVATICHE]: { sprite: oggettiArte.SPIGHE_SELVATICHE, solido: false },
  [OGGETTO.LINO_SELVATICO]: { sprite: oggettiArte.LINO_SELVATICO, solido: false },
  [OGGETTO.CAVOLO_SELVATICO]: { sprite: oggettiArte.CAVOLO_SELVATICO, solido: false },
  [OGGETTO.PATATA_SELVATICA]: { sprite: oggettiArte.PATATA_SELVATICA, solido: false },
  [OGGETTO.FAGIOLI_SELVATICI]: { sprite: oggettiArte.FAGIOLI_SELVATICI, solido: false },
  // Lo spaventapasseri rotto degli orti abbandonati (M7.18.31): non ferma,
  // come quello del giocatore.
  [OGGETTO.SPAVENTAPASSERI_ROTTO]: { sprite: oggettiArte.SPAVENTAPASSERI_ROTTO, solido: false },

  // Il falò acceso ferma: ci si cammina attorno, non dentro. Quello spento no
  // — è cenere, e restare bloccati da un mucchio di cenere sarebbe assurdo.
  [OGGETTO.FALO_ACCESO]: {
    fotogrammi: coseArte.FALO_ACCESO,
    solido: true,
    luce: { raggio: 64, intensita: 1 },
    // Il falò è l'unica cosa che scalda, ed è per questo che "scalda" è un
    // campo suo invece della luce. Una torcia illumina e non riscalda: fin qui
    // le due cose erano lo stesso campo, e una torcia piantata scaldava come un
    // fuoco perché nessuno aveva mai avuto bisogno di distinguerle.
    scalda: true,
  },
  [OGGETTO.FALO_SPENTO]: { sprite: coseArte.FALO_SPENTO, solido: false },

  // Il focolare. Scalda come il falò — è lo stesso campo, e questo è tutto il
  // lavoro che il freddo ha dovuto fare per accorgersene: "scalda" era già una
  // domanda sul catalogo e non su un identificatore.
  //
  // Illumina un po' più in là del falò (ottanta contro sessantaquattro): una
  // stanza intera, che è il posto dove sta.
  //
  // E scalda la stanza intera, che il falò non fa: il falò scalda tre tasselli
  // dovunque stia, anche fra quattro mura. È il vantaggio vero del focolare,
  // quello che vale le dieci pietre e la regola delle quattro mura (vedi
  // riparo.caldaDentro).
  [OGGETTO.FOCOLARE_ACCESO]: {
    fotogrammi: coseArte.FOCOLARE_ACCESO,
    solido: true,
    luce: { raggio: 80, intensita: 1 },
    scalda: true,
    scaldaStanza: true,
  },
  // Spento ferma lo stesso, e la cenere del falò no: quella è cenere, questo è
  // un metro cubo di pietra che è rimasto dov'era.
  [OGGETTO.FOCOLARE_SPENTO]: { sprite: coseArte.FOCOLARE_SPENTO, solido: true },

  // L'essiccatoio, nei suoi tre stati. Ferma come il banco e la cassa: è un
  // mobile, e un mobile ingombra. Non scalda e non illumina — è l'unica
  // struttura che non fa niente per chi ci sta accanto, e tutto per chi torna.
  // I tre stati dell'essiccatoio non sono tre disegni ma lo stesso telaio con
  // sopra quello che ci pende davvero: "steso" dice alla cottura di comporlo
  // leggendo il tassello — quanti pezzi, e se sono carne o pesce — come già fa
  // il mucchio con l'icona di quello che contiene. Lo sprite qui è il telaio
  // nudo, e serve da misura: è alto uguale in tutti e tre i casi.
  [OGGETTO.ESSICCATOIO]: { sprite: coseArte.ESSICCATOIO_VUOTO, solido: true, steso: "vuoto" },
  [OGGETTO.ESSICCATOIO_CARICO]: { sprite: coseArte.ESSICCATOIO_VUOTO, solido: true, steso: "fresco" },
  [OGGETTO.ESSICCATOIO_PRONTO]: { sprite: coseArte.ESSICCATOIO_VUOTO, solido: true, steso: "secco" },

  // Non ferma: ci si deve poter camminare sopra per sdraiarcisi, e comunque
  // un materasso per terra non è un ostacolo.
  [OGGETTO.GIACIGLIO]: { sprite: coseArte.GIACIGLIO_STESO, solido: false },
  [OGGETTO.GIACIGLIO_PELLI]: { sprite: coseArte.GIACIGLIO_PELLI_STESO, solido: false },
  // Il letto non ferma, come il giaciglio: ci si sdraia sopra. E non chiude
  // una stanza, perché non ferma — un letto messo di traverso in una porta non
  // fa di una casa due case.
  [OGGETTO.LETTO]: { sprite: coseArte.LETTO, solido: false },

  // L'orto. Nessuno di questi ferma: ci si deve poter camminare in mezzo per
  // innaffiarlo. "Bagnabile" dice alla cottura di guardare se il tassello è
  // stato innaffiato e, in quel caso, di usare la tavolozza della terra
  // bagnata — stesso disegno, terreno più scuro.
  //
  // E "suolo": l'orto non è una cosa che sta sul terreno, è il terreno. Il
  // disegno va cotto dentro il settore come l'erba e la sabbia, non messo in
  // fila con quello che sta in piedi — se no un solco più in basso dei piedi
  // del superstite gli viene disegnato sopra, e si vede il personaggio sotto
  // il campo. Succedeva, ed è il difetto che questa riga chiude: l'ordine dei
  // piedi è la profondità giusta per un albero, non per una zolla.
  //
  // E "stadio": da M7.17 lo stesso stadio ha un disegno per coltura, e quale
  // coltura sia lo sa il tassello, non l'oggetto. La cottura chiede il disegno
  // a sprite-orto.js con il nome dello stadio e la coltura scritta lì.
  [OGGETTO.TERRA_ZAPPATA]: { sprite: ortoArte.TERRA_ZAPPATA, solido: false, bagnabile: true, suolo: true },
  [OGGETTO.SEMINATO]: { sprite: ortoArte.SEMINATO, stadio: "SEMINATO", solido: false, bagnabile: true, suolo: true },
  [OGGETTO.GERMOGLIO]: { sprite: ortoArte.GERMOGLIO, stadio: "GERMOGLIO", solido: false, bagnabile: true, suolo: true },
  [OGGETTO.CRESCIUTA]: { sprite: ortoArte.CRESCIUTA, stadio: "CRESCIUTA", solido: false, bagnabile: true, suolo: true },
  [OGGETTO.MATURA]: { sprite: ortoArte.MATURA, stadio: "MATURA", solido: false, bagnabile: true, suolo: true },
  // Andata a seme non beve più: è una pianta che ha finito, e innaffiarla
  // sarebbe un gesto che non cambia niente.
  [OGGETTO.A_SEME]: { sprite: ortoArte.A_SEME, stadio: "A_SEME", solido: false, suolo: true },

  // Lo spaventapasseri non ferma: sta in mezzo al campo, e fra le file ci si
  // deve poter passare. Ma sta in piedi, quindi niente "suolo": un superstite
  // che gli passa dietro gli sta dietro davvero.
  [OGGETTO.SPAVENTAPASSERI]: { sprite: coseArte.SPAVENTAPASSERI, solido: false },

  // L'appassita non è bagnabile: innaffiare un morto non lo riporta indietro,
  // e lasciarla scurire come il resto dell'orto direbbe che si sta facendo
  // qualcosa di utile.
  [OGGETTO.APPASSITA]: { sprite: ortoArte.APPASSITA, solido: false, suolo: true },

  // Non ferma, e non potrebbe: un mucchio si raccoglie standoci davanti, ma
  // uno lasciato in mezzo a un passaggio stretto diventerebbe un muro che ti
  // sei costruito da solo.
  [OGGETTO.MUCCHIO]: { sprite: coseArte.MUCCHIO, solido: false, mucchio: true },

  // Il corpo del superstite di prima. Non ferma, e la ragione è la stessa del
  // mucchio ma più forte: si muore dove capita, e un cadavere caduto in un
  // passaggio stretto sarebbe un muro costruito dalla propria sfortuna.
  [OGGETTO.CADAVERE]: { sprite: coseArte.CADAVERE, solido: false },

  // I muri di chi c'era prima. Il muro ferma, le macerie no — ed è tutta la
  // differenza fra un ostacolo e una porta: si entra in una casa in rovina da
  // dove il muro è venuto giù.
  [OGGETTO.MURO]: { sprite: oggettiArte.MURO, solido: true },
  [OGGETTO.MURO_ROTTO]: { sprite: oggettiArte.MURO_ROTTO, solido: false },

  // Il banco ferma, come la cassa: sono le due cose che fanno di un prato un
  // posto, e un posto ha degli ingombri.
  [OGGETTO.BANCO]: { sprite: coseArte.BANCO, solido: true },

  // La cassa ferma, e deve: è un mobile. Camminarci dentro toglierebbe
  // l'unica cosa che la rende un posto invece di un oggetto — che sta lì,
  // ingombra, e bisogna girarci attorno per arrivare alla porta.
  [OGGETTO.CASSA]: { sprite: coseArte.CASSA, solido: true },

  // La porta: lo stesso tassello in due stati, e la differenza fra i due è
  // tutta qui. Chiusa ferma come un muro, aperta non ferma niente — e non ha
  // una via di mezzo, perché a sedici pixel una porta socchiusa sarebbe un
  // disegno diverso che si comporta uguale.
  //
  // Aperta non ferma i piedi, ma la stanza la chiude lo stesso: una casa con
  // la porta aperta è ancora una casa. Fino a M7.18.10 aprirla metteva tutta
  // la stanza all'aperto — la pioggia spegneva il fuoco dentro e innaffiava
  // l'orto fra le mura. Il muro crollato invece apre davvero: è un buco, non
  // una porta (vedi chiudeIn).
  [OGGETTO.PORTA]: { sprite: coseArte.PORTA, solido: true },
  [OGGETTO.PORTA_APERTA]: { sprite: coseArte.PORTA_APERTA, solido: false, chiude: true },

  // Lo steccato e il cancello (M7.18.16). Fermano i piedi come un muro, ma
  // non chiudono il posto: fra le assi passano la luce, l'aria e la pioggia.
  // "Recinta" è la loro parola, e chiudeIn() la ignora apposta — un recinto
  // non è una stanza, non scalda, non ripara, e l'orto dentro cresce. Conta
  // soltanto per chi chiede se un posto è recintato (vedi riparo.js). Il
  // cancello aperto non recinta niente: da lì le bestie entrano.
  [OGGETTO.STECCATO]: { sprite: coseArte.STECCATO, solido: true, recinta: true },
  [OGGETTO.CANCELLO]: { sprite: coseArte.CANCELLO, solido: true, recinta: true },
  [OGGETTO.CANCELLO_APERTO]: { sprite: coseArte.CANCELLO_APERTO, solido: false },

  // Il pollaio ferma come un mobile: è una casetta.
  [OGGETTO.POLLAIO]: { sprite: coseArte.POLLAIO, solido: true },

  // Una torcia piantata è luce fissa che costa molto meno di un falò, e non
  // ferma: è un bastone, ci si passa accanto.
  [OGGETTO.TORCIA_PIANTATA]: {
    fotogrammi: coseArte.TORCIA_PIANTATA,
    solido: false,
    luce: { raggio: 42, intensita: 0.85 },
  },
};

// Che disegno va sopra un mucchio. Lo registra dall'alto chi conosce il
// catalogo delle cose, perché qui sotto le regole non si importano mai: la
// mappa sa che su un tassello può esserci un mucchio, non che esiste una cosa
// che si chiama "legna".
let iconeMucchio = {};

export function registraIconeMucchio(icone) {
  iconeMucchio = icone;
}

// I disegni dei fiori da spargere sui terreni fiorabili, o niente. La mappa
// non sa cosa sia la primavera: sa che ogni tanto le viene detto di spargere
// questi, e ogni tanto di non spargere niente.
let fioritura = null;

// D'inverno le piante degli orti abbandonati sono secche (M7.18.33): lo dice
// gioco.js al cambio di stagione, come la fioritura, e si ricuociono i settori.
let ortiSecchi = false;
export function impostaOrtiSecchi(secchi) {
  if (secchi === ortiSecchi) return false;
  ortiSecchi = secchi;
  settori.clear();
  return true;
}

export function impostaFioritura(fiori) {
  const nuova = fiori ?? null;
  if (nuova === fioritura) return false;
  fioritura = nuova;
  settori.clear();
  return true;
}

// Quanti tasselli fiorabili portano un fiore. Un quarto: più fitto sembra un
// giardino curato invece di una valle lasciata andare, più rado e la stagione
// non si vede attraversando lo schermo.
const QUOTA_FIORI = 0.25;

// Quanto in alto sta l'icona sul sacco: i due pixel di margine la centrano in
// larghezza, e la riga in meno la fa appoggiare invece che galleggiare.
const SCARTO_ICONA = [2, 1];

// Con che colori si cuoce il mondo adesso. Le stagioni sono una regola, e le
// regole non si importano da qui: la coppia arriva dall'alto e la mappa sa
// soltanto che esistono due tavolozze, una asciutta e una bagnata.
let tavolozzaMondo = TAVOLOZZA;
let tavolozzaMondoBagnata = TAVOLOZZA_BAGNATA;

export function impostaTavolozze(asciutta, bagnata) {
  if (asciutta === tavolozzaMondo && bagnata === tavolozzaMondoBagnata) return false;
  tavolozzaMondo = asciutta;
  tavolozzaMondoBagnata = bagnata;
  // Ogni settore cotto porta addosso i colori vecchi: si buttano tutti, e
  // vengono rifatti dalla stessa macchina che li fa la prima volta. È una
  // stangata in un fotogramma solo, e capita quattro volte in trentadue
  // giorni — misurata, non stimata: vedi costoCottura().
  settori.clear();
  return true;
}

// --- transizioni ----------------------------------------------------------

// Chi invade chi. Senza un ordine, due tasselli affiancati si sfrangerebbero a
// vicenda e il confine tornerebbe a essere una linea, solo più sporca: il
// terreno più forte scavalca il bordo del più debole e mai il contrario.
//
// L'ordine si legge come natura. La vegetazione si riprende tutto, quindi
// l'erba sta in cima; la riva sfuma nell'acqua bassa e l'acqua bassa in quella
// profonda, quindi l'acqua sta in fondo.
const PRIORITA = {
  [TERRENO.GHIACCIO]: 1,
  [TERRENO.ACQUA]: 0,
  [TERRENO.ACQUA_BASSA]: 1,
  [TERRENO.SABBIA]: 2,
  [TERRENO.ROCCIA]: 3,
  [TERRENO.TERRA]: 4,
  [TERRENO.STERPAGLIA]: 5,
  [TERRENO.ERBA]: 6,
};

// Nord, est, sud, ovest — in quest'ordine, che è anche l'ordine di rotazione.
// L'indice del lato è quindi direttamente il numero di quarti di giro da dare
// alla maschera, che esiste disegnata solo per il nord.
const LATI = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

// Le diagonali seguono lo stesso giro a partire da nord-ovest, così anche qui
// l'indice è il numero di quarti. I due lati adiacenti alla diagonale q sono
// q e (q + 3) % 4.
const DIAGONALI = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];

// --- stato ----------------------------------------------------------------

let seme = 0;
let nomeSeme = "";
const settori = new Map();

export function inizializza(nome) {
  nomeSeme = nome;
  seme = semeDaTesto(nome);
  settori.clear();
  // Le rovine tengono una memoria per cella e un seme loro: cambiando valle va
  // buttata, altrimenti la valle nuova si troverebbe addosso le case della
  // vecchia.
  preparaRovine(seme);
}

// La rovina di una cella, per chi disegna la mappa grande. Il mondo la sa già
// — la maglia è in rovine.js — e passare di qui evita che l'interfaccia debba
// sapere che esiste un seme.
export { rovinaNellaCella, laFattoria, luogoIn, inselvatichitaNellOrto } from "./generazione.js";
export { CELLA as CELLA_ROVINE } from "./rovine.js";

export function semeCorrente() {
  return { nome: nomeSeme, valore: seme };
}

// --- interrogazione del mondo ---------------------------------------------

let gelo = false;
export function impostaGelo(attivo) {
  if (gelo === attivo) return false;
  gelo = attivo; settori.clear(); return true;
}
// Sta gelando? La pone il pozzo, che deve ghiacciare insieme agli stagni e non
// per conto suo: due calendari che decidono la stessa cosa prima o poi si
// contraddicono, e il giorno che succede è il giocatore a doverlo capire.
export function gelato() { return gelo; }
export function terrenoNaturaleDi(tx, ty) { return terrenoIn(tx, ty, seme); }
export function terrenoDi(tx, ty) {
  const t = terrenoNaturaleDi(tx, ty);
  return gelo && t === TERRENO.ACQUA_BASSA ? TERRENO.GHIACCIO : t;
}

// Le modifiche hanno sempre l'ultima parola sulla generazione: è il punto in
// cui il mondo smette di essere una funzione pura delle coordinate e comincia
// a ricordarsi di chi ci è passato.
export function oggettoDi(tx, ty) {
  const cambio = modifiche.di(tx, ty);
  if (cambio && cambio.oggetto !== undefined) return cambio.oggetto;
  return oggettoIn(tx, ty, seme, terrenoIn(tx, ty, seme));
}

// Cosa ci sarebbe su questo tassello se il giocatore non l'avesse mai
// toccato. È l'oggettoDi() senza l'ultima parola delle modifiche, e serve alla
// ricrescita: cosa può tornare lo decide la generazione, non cosa è stato
// tolto. Un tassello dove non c'era niente resta niente anche dopo averci
// posato e ripreso un mucchio.
export function oggettoGenerato(tx, ty) {
  return oggettoIn(tx, ty, seme, terrenoIn(tx, ty, seme));
}

// Annota qualcosa su un tassello senza toccare il disegno. Serve ai colpi
// intermedi: un albero a metà abbattimento è ancora lo stesso albero, e
// ricuocere duecentocinquantasei tasselli per aggiornare un contatore è
// spreco puro. Peggio: la ricottura ricrea gli oggetti da zero e cancella
// ogni stato temporaneo, quindi con l'invalidazione a ogni colpo l'albero
// colpito non potrebbe nemmeno tremare.
export function annotaTassello(tx, ty, cambio) {
  modifiche.imposta(tx, ty, cambio);
}

// Il pavimento di questo tassello, o null. Sta nelle modifiche accanto
// all'oggetto e non al suo posto, perché sopra un pavimento si posa: un letto,
// una cassa, un fuoco (vedi modifiche.js, che lo tiene fermo mentre sopra
// cambia tutto il resto).
export function pavimentoIn(tx, ty) {
  return modifiche.di(tx, ty)?.pavimento ?? null;
}

// Cambia un tassello e butta via il settore che lo conteneva, così alla
// prossima inquadratura viene ricotto con il mondo nuovo. Solo quel settore:
// un oggetto sta tutto dentro il suo tassello e non sfrangia i vicini.
export function cambiaTassello(tx, ty, cambio) {
  if (cambio === null) modifiche.rimuovi(tx, ty);
  else modifiche.imposta(tx, ty, cambio);
  // Anche i settori dei quattro vicini: uno steccato sul bordo di un settore
  // cambia il disegno del pezzo accanto, che può stare nel settore di là. Di
  // solito sono lo stesso settore, e buttarlo due volte non costa niente.
  for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    settori.delete(chiave(Math.floor((tx + dx) / SETTORE), Math.floor((ty + dy) / SETTORE)));
  }
}

// Con cosa si collega un pezzo di steccato: altro steccato e il cancello,
// chiuso o aperto — un cancello aperto è ancora un pezzo della stessa fila.
function collegaSteccato(tx, ty) {
  const oggetto = oggettoDi(tx, ty);
  return oggetto === OGGETTO.STECCATO || oggetto === OGGETTO.CANCELLO || oggetto === OGGETTO.CANCELLO_APERTO;
}

// Butta via tutti i settori cotti. Serve a chi cambia il mondo in blocco —
// un caricamento — invece che un tassello per volta: cambiaTassello butta il
// settore giusto, ma rifarlo per mille modifiche vorrebbe dire buttarli tutti
// mille volte.
export function scordaSettori() {
  settori.clear();
}

// C'è qualcosa di acceso entro questo raggio di tasselli? Serve al freddo, e
// serve che sia una domanda sul mondo e non sull'inquadratura: lumiVisibili()
// risponderebbe quasi sempre uguale e ogni tanto no, perché dipende da dove
// sta la camera — cioè una regola di sopravvivenza decisa dal disegno.
// C'è una fiamma accesa proprio su questo tassello?
//
// È la stessa domanda di fuocoVicino con raggio zero, e ha un nome suo perché
// altrove se ne faceva una diversa: "è il falò acceso?". Finché il fuoco era
// uno solo le due domande coincidevano; adesso che ce ne sono due, chi chiede
// per nome resta indietro di un fuoco — ci si cucinava e ci si dormiva accanto
// solo al falò, e il focolare sarebbe stato un fuoco su cui non si cucina.
// È suolo, cioè terreno lavorato e non una cosa che ci sta sopra? Serve a chi
// disegna, ed è esportata perché è una domanda sul mondo come "è solido": chi
// la fa non deve conoscere il catalogo, e un collaudo può pretendere che una
// zolla resti suolo e un albero no.
export function eSuolo(oggetto) {
  return oggetto !== OGGETTO.NESSUNO && CATALOGO_OGGETTI[oggetto]?.suolo === true;
}

export function scaldaIn(tx, ty) {
  const oggetto = oggettoDi(tx, ty);
  return oggetto !== OGGETTO.NESSUNO && CATALOGO_OGGETTI[oggetto].scalda === true;
}

export function fuocoVicino(tx, ty, raggio) {
  return campoVicino(tx, ty, raggio, "scalda");
}

// C'è entro questo raggio un fuoco che scalda tutta la stanza? Il focolare sì,
// il falò no (vedi il catalogo, e riparo.caldaDentro).
export function scaldaStanzaVicino(tx, ty, raggio) {
  return campoVicino(tx, ty, raggio, "scaldaStanza");
}

function campoVicino(tx, ty, raggio, campo) {
  for (let dy = -raggio; dy <= raggio; dy += 1) {
    for (let dx = -raggio; dx <= raggio; dx += 1) {
      const oggetto = oggettoDi(tx + dx, ty + dy);
      if (oggetto !== OGGETTO.NESSUNO && CATALOGO_OGGETTI[oggetto][campo]) return true;
    }
  }
  return false;
}

// C'è un banco da lavoro a portata di braccio?
//
// Si guarda il mondo e non l'inquadratura, per la stessa ragione per cui lo fa
// luceVicina: una regola di gioco decisa da dove sta la camera è una regola
// decisa dal disegno.
//
// Tre tasselli e non zero. "Davanti al banco" sarebbe stato più severo e più
// coerente con il fuoco, ma il fuoco si guarda mentre si cucina e il banco no:
// si gira per l'accampamento a raccogliere quello che serve, e doversi
// riallineare ogni volta sarebbe una tassa su un gesto che non ha niente da
// insegnare.
export function bancoVicino(tx, ty, raggio = 3) {
  for (let dy = -raggio; dy <= raggio; dy += 1) {
    for (let dx = -raggio; dx <= raggio; dx += 1) {
      if (oggettoDi(tx + dx, ty + dy) === OGGETTO.BANCO) return true;
    }
  }
  return false;
}

// Questo tassello fa da parete a una stanza? Tutto quello che ferma i piedi —
// un muro, una porta chiusa, un albero, un sasso, una cassa — senza contare il
// terreno, e in più la porta aperta.
//
// Esiste separata da solidoIn() perché il riparo ha bisogno di distinguere le
// due cose. L'acqua ferma i piedi ed è solida, ma non è una parete: un isolotto
// in mezzo al lago non è una stanza, e un accampamento sulla riva non è al
// chiuso perché di là c'è il lago. Le pareti sono roba che sta in piedi.
//
// E la porta aperta si attraversa ma è una parete: aperta o chiusa, una casa
// resta chiusa. Il muro crollato no — lì la casa ha un buco.
export function chiudeIn(tx, ty) {
  const oggetto = oggettoDi(tx, ty);
  if (oggetto === OGGETTO.NESSUNO) return false;
  const voce = CATALOGO_OGGETTI[oggetto];
  if (voce.recinta === true) return false;
  return voce.solido === true || voce.chiude === true;
}

// Lo steccato e il cancello chiuso: pareti di un recinto e di nient'altro.
export function recintaIn(tx, ty) {
  const oggetto = oggettoDi(tx, ty);
  return oggetto !== OGGETTO.NESSUNO && CATALOGO_OGGETTI[oggetto].recinta === true;
}

// Che cosa toglie la vista. Non è la solidità, e non è nemmeno chiudeIn():
// l'acqua ferma i piedi e non gli occhi, e gli alberi fermano i piedi ma
// rendere cieco il bosco cambierebbe tutto il combattimento di M6 — quanti
// te ne accorgono, da quanto lontano, quante volte si scappa fra gli alberi —
// e quello va misurato per conto suo, non di sbieco mentre si aggiungono i
// muri. Qui ci sono le due cose che si costruiscono apposta perché non ti
// vedano.
const CIECHI = new Set([OGGETTO.MURO, OGGETTO.PORTA]);

// Da questo tassello si vede quell'altro? Una camminata alla Bresenham lungo
// la linea, saltando i due capi: il tassello su cui si sta e quello su cui sta
// l'altro non possono accecare se stessi.
//
// Venti passi al massimo e nessuna allocazione: si fa per ogni infetto che
// potrebbe vederti, cioè qualche volta per fotogramma.
export function vedeDa(tx0, ty0, tx1, ty1) {
  let x = tx0;
  let y = ty0;
  const dx = Math.abs(tx1 - x);
  const dy = -Math.abs(ty1 - y);
  const passoX = x < tx1 ? 1 : -1;
  const passoY = y < ty1 ? 1 : -1;
  let errore = dx + dy;

  for (;;) {
    if (x === tx1 && y === ty1) return true;
    const doppio = 2 * errore;
    if (doppio >= dy) {
      errore += dy;
      x += passoX;
    }
    if (doppio <= dx) {
      errore += dx;
      y += passoY;
    }
    if (x === tx1 && y === ty1) return true;
    if (CIECHI.has(oggettoDi(x, y))) return false;
  }
}

export function solidoIn(tx, ty) {
  const terreno = terrenoDi(tx, ty);
  if (CATALOGO[terreno].solido) return true;
  const oggetto = oggettoDi(tx, ty);
  return oggetto !== OGGETTO.NESSUNO && CATALOGO_OGGETTI[oggetto].solido;
}

// --- settori --------------------------------------------------------------

const chiave = (sx, sy) => `${sx},${sy}`;

// Il settore si legge con un tassello di bordo per lato: per sfrangiare un
// tassello bisogna sapere cosa ha attorno, e i tasselli sul perimetro hanno
// vicini che appartengono al settore accanto. Senza il bordo la frangia si
// interromperebbe ogni sedici tasselli, disegnando la griglia dei settori.
const BORDO = 1;
const LATO_GRIGLIA = SETTORE + BORDO * 2;

// Una sola passata di terreni per settore invece di interrogarne nove per
// tassello: 324 valutazioni di rumore al posto di 2304.
function grigliaTerreni(sx, sy) {
  const griglia = new Int8Array(LATO_GRIGLIA * LATO_GRIGLIA);
  for (let y = 0; y < LATO_GRIGLIA; y += 1) {
    for (let x = 0; x < LATO_GRIGLIA; x += 1) {
      const tx = sx * SETTORE + x - BORDO;
      const ty = sy * SETTORE + y - BORDO;
      griglia[y * LATO_GRIGLIA + x] = terrenoDi(tx, ty);
    }
  }
  return griglia;
}

// La variante si sceglie con l'impronta del tassello: stabile fra una
// ricottura e l'altra, altrimenti il prato cambierebbe disegno ogni volta che
// il settore esce e rientra dalla memoria. Serve sia al tassello di base sia a
// quello del vicino usato come sfrangiatura, perché la frangia deve sembrare
// un pezzo del vicino vero e non di un suo sosia.
function tasselloDi(tx, ty, terreno) {
  const varianti = CATALOGO[terreno].varianti;
  const quale = Math.floor(impronta(tx, ty, seme ^ 0x5bf03635) * varianti.length) % varianti.length;
  return cuoci(varianti[quale], tavolozzaMondo);
}

// La maschera cambia da un tassello all'altro lungo lo stesso confine: con una
// sola frangia ripetuta, un bordo lungo si leggerebbe come una decalcomania.
function mascheraLato(tx, ty, quarti) {
  const forme = transizioniArte.LATO;
  const scelta = Math.floor(impronta(tx + quarti * 37, ty, seme ^ 0x2f1b3d77) * forme.length) % forme.length;
  return ruotato(cuoci(forme[scelta], transizioniArte.TAVOLOZZA_MASCHERA), quarti);
}

function mascheraAngolo(tx, ty, quarti) {
  const forme = transizioniArte.ANGOLO;
  const scelta = Math.floor(impronta(tx, ty + quarti * 37, seme ^ 0x7a5ce19b) * forme.length) % forme.length;
  return ruotato(cuoci(forme[scelta], transizioniArte.TAVOLOZZA_MASCHERA), quarti);
}

// Una correzione — la sete, la terra stanca — sopra una tavolozza data, una
// sola per ciascuna coppia: la cottura mette in cache per identità della
// tavolozza (vedi tavolozza.js), e una nuova a ogni tassello rifarebbe il
// disegno ogni volta.
const corrette = new Map();
function correttaDi(tavolozza, correzione) {
  let perQuesta = corrette.get(correzione);
  if (!perQuesta) {
    perQuesta = new Map();
    corrette.set(correzione, perQuesta);
  }
  let fatta = perQuesta.get(tavolozza);
  if (!fatta) {
    fatta = { ...tavolozza, ...correzione };
    perQuesta.set(tavolozza, fatta);
  }
  return fatta;
}

// Riusati a ogni tassello invece di essere riallocati: la cottura di un settore
// ne farebbe cinquecento oggetti usa e getta.
const viciniForti = new Set();
const perPrevalenza = [];

let tempoCottura = 0;
let settoriCotti = 0;
// Gli ultimi tempi, non solo la media: la media nasconde proprio la cosa che
// si sente, cioè quanto costa il singolo settore quando ci si cammina dentro.
const ultimiTempi = [];

function cuociSettore(sx, sy) {
  const inizio = performance.now();

  const canvas = document.createElement("canvas");
  canvas.width = LATO_SETTORE;
  canvas.height = LATO_SETTORE;
  const pennello = canvas.getContext("2d");
  pennello.imageSmoothingEnabled = false;

  const terreni = grigliaTerreni(sx, sy);
  const leggi = (x, y) => terreni[(y + BORDO) * LATO_GRIGLIA + (x + BORDO)];

  const oggetti = [];

  for (let y = 0; y < SETTORE; y += 1) {
    for (let x = 0; x < SETTORE; x += 1) {
      const tx = sx * SETTORE + x;
      const ty = sy * SETTORE + y;
      const terreno = leggi(x, y);

      pennello.drawImage(tasselloDi(tx, ty, terreno), x * TASSELLO, y * TASSELLO);
      sfrangia(pennello, leggi, x, y, tx, ty, terreno);
      // Il pavimento copre il terreno e le sue frange, e ci si dipinge sopra
      // il resto: un fiore fra le assi di casa sarebbe il prato che passa
      // attraverso il legno.
      if (pavimentoIn(tx, ty)) pennello.drawImage(cuoci(coseArte.PAVIMENTO_LEGNO, tavolozzaMondo), x * TASSELLO, y * TASSELLO);
      else fiorisci(pennello, tx, ty, terreno, x, y);

      const oggetto = oggettoDi(tx, ty);
      if (oggetto !== OGGETTO.NESSUNO) {
        const voce = CATALOGO_OGGETTI[oggetto];
        // Un tassello innaffiato si disegna con la terra scura: è la stessa
        // immagine cotta con un'altra tavolozza, non un secondo disegno.
        const bagnato = voce.bagnabile && modifiche.di(tx, ty)?.bagnato === true;
        // E una pianta che ha passato un giorno senz'acqua ha le foglie
        // gialle: è l'avviso che domani, senza acqua, secca. Si stende sopra
        // la terra asciutta o bagnata che sia, per la ragione scritta accanto
        // a FOGLIE_ASSETATE.
        const assetata = voce.bagnabile && modifiche.di(tx, ty)?.secco > 0;
        // E la terra del campo che si stanca schiarisce, se è asciutta: la
        // fertilità è scritta sul tassello (vedi orto.js), e senza è quella di
        // un prato appena zappato.
        const fertilita = voce.suolo ? (modifiche.di(tx, ty)?.fertilita ?? 2) : 2;
        const terra = bagnato ? tavolozzaMondoBagnata
          : fertilita <= 0 ? correttaDi(tavolozzaMondo, TERRA_SFINITA)
          : fertilita === 1 ? correttaDi(tavolozzaMondo, TERRA_STANCA)
          : tavolozzaMondo;
        const tavolozza = assetata ? correttaDi(terra, FOGLIE_ASSETATE) : terra;
        const disegno = voce.stadio ? ortoArte.disegnoDi(modifiche.di(tx, ty)?.coltura, voce.stadio)
          // Lo steccato si collega ai pezzi accanto (vedi sprite-cose.js).
          : oggetto === OGGETTO.STECCATO
            ? coseArte.steccatoVerso(collegaSteccato(tx, ty - 1), collegaSteccato(tx, ty + 1),
              collegaSteccato(tx + 1, ty), collegaSteccato(tx - 1, ty))
          // E da M7.18.26 anche il cancello, che in una fila verticale si
          // gira con lei.
          : ortiSecchi && inselvatichitaNellOrto(tx, ty, oggetto) ? oggettiArte.PIANTA_SECCA
          : oggetto === OGGETTO.CANCELLO || oggetto === OGGETTO.CANCELLO_APERTO
            ? coseArte.cancelloVerso(oggetto === OGGETTO.CANCELLO_APERTO,
              collegaSteccato(tx, ty - 1), collegaSteccato(tx, ty + 1),
              collegaSteccato(tx + 1, ty), collegaSteccato(tx - 1, ty))
            : voce.sprite;
        const fotogrammi = voce.fotogrammi
          ? voce.fotogrammi.map((f) => cuoci(f, tavolozza))
          : [cuoci(disegno, tavolozza)];
        // Un mucchio è il sacco più l'icona di quello che contiene. Se
        // l'icona manca resta il sacco: un mucchio senza disegno si vede e si
        // raccoglie lo stesso, mentre un errore qui lo farebbe sparire.
        if (voce.mucchio) {
          const icona = iconeMucchio[modifiche.di(tx, ty)?.cosa];
          if (icona) fotogrammi[0] = sovrapposto(fotogrammi[0], cuoci(icona), ...SCARTO_ICONA);
        }
        // E l'essiccatoio è il telaio più quello che ci pende: tre pezzi
        // disegnano tre strisce, sei ne disegnano sei. Un telaio mezzo carico
        // che si disegna pieno è la stessa bugia del falò che nell'icona
        // aveva la fiamma dentro pur posandosi spento.
        if (voce.steso && voce.steso !== "vuoto") {
          const dati = modifiche.di(tx, ty);
          const disegno = coseArte.essiccatoioSteso(dati?.quante ?? 0, dati?.cosa, voce.steso === "secco");
          fotogrammi[0] = cuoci(disegno, tavolozza);
        }
        const sprite = fotogrammi[0];
        // Il suolo si dipinge qui e finisce lì: è terreno lavorato, quindi sta
        // sotto tutto quello che ci cammina sopra, sempre. Niente luce e
        // niente fotogrammi — un solco non brilla e non si muove — quindi non
        // serve che resti nella fila di quelli che si ordinano per i piedi.
        if (voce.suolo) {
          pennello.drawImage(sprite, x * TASSELLO, (y + 1) * TASSELLO - sprite.height);
          continue;
        }
        oggetti.push({
          tipo: oggetto,
          tx,
          ty,
          fotogrammi,
          sprite,
          // Ancorato ai piedi: lo sprite è più alto del tassello e cresce
          // verso l'alto, com'è ovvio per un albero e per niente ovvio per il
          // disegno, che parte dall'angolo in alto a sinistra.
          x: tx * TASSELLO,
          y: (ty + 1) * TASSELLO - sprite.height,
          base: (ty + 1) * TASSELLO,
          // La luce esce dalla fiamma, non dal centro geometrico dello
          // sprite: qualche pixel più in alto dei piedi.
          luce: voce.luce
            ? { x: tx * TASSELLO + TASSELLO / 2, y: (ty + 1) * TASSELLO - 9, ...voce.luce }
            : null,
        });
      }
    }
  }

  const durata = performance.now() - inizio;
  tempoCottura += durata;
  settoriCotti += 1;
  ultimiTempi.push(durata);
  if (ultimiTempi.length > 12) ultimiTempi.shift();
  return { canvas, oggetti };
}

// Sparge un fiore sul tassello, se è di quelli che fioriscono e se le sue
// coordinate lo vogliono.
//
// Quale fiore e dove cade li decidono le coordinate, come tutto il resto del
// mondo: lo stesso tassello ha lo stesso fiore nello stesso punto, sempre.
// Serve a due cose insieme — il settore ricotto non cambia aspetto, e il prato
// non è un reticolo. Una prima versione metteva i fiori dentro i tasselli
// stessi, e cadevano tutti allo stesso punto dentro il loro tassello: si
// vedeva la griglia da sedici pixel a occhio nudo.
function fiorisci(pennello, tx, ty, terreno, x, y) {
  if (!fioritura || !CATALOGO[terreno].fiorabile) return;
  if (impronta(tx, ty, seme ^ 0x1d7f3ab5) >= QUOTA_FIORI) return;

  const quale = fioritura[
    Math.floor(impronta(tx + 13, ty - 29, seme ^ 0x6ad91c37) * fioritura.length) % fioritura.length
  ];
  const cotto = cuoci(quale, tavolozzaMondo);
  // Dentro il tassello, con un margine che tiene il fiore lontano dai bordi:
  // un fiore a cavallo di due tasselli si spezza, perché i settori si cuociono
  // uno per volta.
  const spazioX = TASSELLO - cotto.width - 2;
  const spazioY = TASSELLO - cotto.height - 2;
  const dx = 1 + Math.floor(impronta(tx - 7, ty + 41, seme ^ 0x2be4f019) * spazioX);
  const dy = 1 + Math.floor(impronta(tx + 61, ty + 5, seme ^ 0x51c0a7d3) * spazioY);
  pennello.drawImage(cotto, x * TASSELLO + dx, y * TASSELLO + dy);
}

// Sovrappone al tassello appena disegnato le frange dei vicini più forti.
function sfrangia(pennello, leggi, x, y, tx, ty, terreno) {
  const mio = PRIORITA[terreno];

  viciniForti.clear();
  for (let q = 0; q < 4; q += 1) {
    const lato = leggi(x + LATI[q][0], y + LATI[q][1]);
    if (PRIORITA[lato] > mio) viciniForti.add(lato);
    const diagonale = leggi(x + DIAGONALI[q][0], y + DIAGONALI[q][1]);
    if (PRIORITA[diagonale] > mio) viciniForti.add(diagonale);
  }
  if (viciniForti.size === 0) return;

  // In ordine di prevalenza crescente, così quando due vicini diversi sono
  // entrambi più forti il più forte finisce sopra.
  perPrevalenza.length = 0;
  for (const vicino of viciniForti) perPrevalenza.push(vicino);
  perPrevalenza.sort((a, b) => PRIORITA[a] - PRIORITA[b]);

  const sinistra = x * TASSELLO;
  const alto = y * TASSELLO;

  for (const vicino of perPrevalenza) {
    for (let q = 0; q < 4; q += 1) {
      if (leggi(x + LATI[q][0], y + LATI[q][1]) !== vicino) continue;
      const tassello = tasselloDi(tx + LATI[q][0], ty + LATI[q][1], vicino);
      pennello.drawImage(mascherato(tassello, mascheraLato(tx, ty, q)), sinistra, alto);
    }

    for (let q = 0; q < 4; q += 1) {
      if (leggi(x + DIAGONALI[q][0], y + DIAGONALI[q][1]) !== vicino) continue;
      // L'angolo serve solo quando la diagonale tocca da sola. Se uno dei due
      // lati adiacenti è a sua volta più forte, la sua frangia copre già lo
      // spigolo, e aggiungere l'angolo raddoppierebbe lo spessore proprio lì.
      const adiacente = (q + 3) % 4;
      if (PRIORITA[leggi(x + LATI[q][0], y + LATI[q][1])] > mio) continue;
      if (PRIORITA[leggi(x + LATI[adiacente][0], y + LATI[adiacente][1])] > mio) continue;
      const tassello = tasselloDi(tx + DIAGONALI[q][0], ty + DIAGONALI[q][1], vicino);
      pennello.drawImage(mascherato(tassello, mascheraAngolo(tx, ty, q)), sinistra, alto);
    }
  }
}

// Misura di servizio: la cottura è l'unica cosa che avviene a scatti mentre si
// cammina, quindi è l'unica che può farsi sentire.
export function costoCottura() {
  return {
    settori: settoriCotti,
    medioMs: settoriCotti ? tempoCottura / settoriCotti : 0,
    ultimiMs: ultimiTempi.map((v) => +v.toFixed(2)),
  };
}

function settore(sx, sy) {
  const k = chiave(sx, sy);
  let s = settori.get(k);
  if (!s) {
    s = cuociSettore(sx, sy);
    settori.set(k, s);
  }
  return s;
}

// I settori cotti sono un quarto di megabyte l'uno: camminando a lungo
// riempirebbero la memoria. Si buttano quelli lontani dall'inquadratura, e si
// ricuociono uguali se il giocatore torna indietro.
//
// La finestra di lavoro vera è una ventina di settori: al massimo sei
// inquadrati più l'anello che la precottura prepara attorno. Il raggio è più
// largo di così per non ributtare via un settore appena cucinato quando si
// cammina avanti e indietro sullo stesso confine.
const RAGGIO_MEMORIA = 3;
const SETTORI_MASSIMI = 30;

function potaSettori(sxCentro, syCentro) {
  if (settori.size <= SETTORI_MASSIMI) return;
  for (const k of settori.keys()) {
    const [sx, sy] = k.split(",").map(Number);
    if (Math.abs(sx - sxCentro) > RAGGIO_MEMORIA || Math.abs(sy - syCentro) > RAGGIO_MEMORIA) {
      settori.delete(k);
    }
  }
}

// --- disegno --------------------------------------------------------------

// Riempito a ogni fotogramma ma allocato una volta sola: un array nuovo per
// fotogramma darebbe al raccoglitore di rifiuti sessanta oggetti al secondo da
// smaltire, e si vedrebbe come singhiozzo.
const oggettiInquadrati = [];
const lumiInquadrati = [];

// Le luci accese dentro l'inquadratura, riempite insieme agli oggetti: chi
// disegna l'oscurità le ritrova già pronte senza ripercorrere i settori.
export function lumiVisibili() {
  return lumiInquadrati;
}

export function disegnaTerreno(fotogramma = 0) {
  const q = schermo.inquadratura();
  const primo = Math.floor(q.sinistra / LATO_SETTORE);
  const ultimo = Math.floor((q.destra - 1) / LATO_SETTORE);
  const sopra = Math.floor(q.sopra / LATO_SETTORE);
  const sotto = Math.floor((q.sotto - 1) / LATO_SETTORE);

  oggettiInquadrati.length = 0;
  lumiInquadrati.length = 0;

  for (let sy = sopra; sy <= sotto; sy += 1) {
    for (let sx = primo; sx <= ultimo; sx += 1) {
      const s = settore(sx, sy);
      schermo.disegna(s.canvas, sx * LATO_SETTORE, sy * LATO_SETTORE);
      for (const oggetto of s.oggetti) {
        if (!schermo.visibile(oggetto.x, oggetto.y, oggetto.sprite.width, oggetto.sprite.height)) continue;
        if (oggetto.fotogrammi.length > 1) {
          oggetto.sprite = oggetto.fotogrammi[fotogramma % oggetto.fotogrammi.length];
        }
        oggettiInquadrati.push(oggetto);
        if (oggetto.luce) lumiInquadrati.push(oggetto.luce);
      }
    }
  }

  potaSettori(Math.floor((primo + ultimo) / 2), Math.floor((sopra + sotto) / 2));
  return oggettiInquadrati;
}

// Cuoce in anticipo un settore appena fuori dall'inquadratura, al massimo uno
// per fotogramma.
//
// Da quando i tasselli si sfrangiano, cuocere un settore costa qualche
// millisecondo invece di una frazione. Non è molto, ma cadeva tutto nel
// fotogramma in cui si varca il confine di un settore — e in diagonale se ne
// varcano due insieme, che è abbastanza da far perdere un fotogramma proprio
// mentre ci si muove. Anticipando, quando ci si arriva è già pronto: il costo
// non sparisce, smette di essere uno scatto.
//
// Un settore per fotogramma e non tutti: cuocerne tre insieme ricrea lo
// stesso problema che si sta risolvendo.
export function precuociVicini() {
  const q = schermo.inquadratura();
  const primo = Math.floor(q.sinistra / LATO_SETTORE) - 1;
  const ultimo = Math.floor((q.destra - 1) / LATO_SETTORE) + 1;
  const sopra = Math.floor(q.sopra / LATO_SETTORE) - 1;
  const sotto = Math.floor((q.sotto - 1) / LATO_SETTORE) + 1;

  for (let sy = sopra; sy <= sotto; sy += 1) {
    for (let sx = primo; sx <= ultimo; sx += 1) {
      const k = chiave(sx, sy);
      if (settori.has(k)) continue;
      settori.set(k, cuociSettore(sx, sy));
      return true;
    }
  }
  return false;
}

export function settoriInMemoria() {
  return settori.size;
}

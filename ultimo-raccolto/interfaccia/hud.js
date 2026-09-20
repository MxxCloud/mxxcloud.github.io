// L'interfaccia disegnata dentro il gioco.
//
// Sta sul canvas e non nel DOM, al contrario della diagnostica: la
// diagnostica è uno strumento da sviluppo e può permettersi il font di
// sistema, l'interfaccia vera no. Una barra dello zaino con il testo
// antialiasato accanto a icone di dodici pixel si vede subito come una cosa
// incollata sopra un'altra.

import * as schermo from "../motore/schermo.js";
import * as testo from "../arte/testo.js";
import { cuoci, tinta } from "../arte/sprite.js";
import * as indicatori from "../arte/sprite-indicatori.js";
import * as bisogni from "../regole/bisogni.js";
import { CATALOGO } from "../regole/oggetti.js";
import * as inventario from "../regole/inventario.js";
import { RICETTE, bastano } from "../regole/ricette.js";
import * as contenitori from "../regole/contenitori.js";
import * as decadimento from "../regole/decadimento.js";
import { nomeDi } from "../regole/oggetti.js";

const LATO_CASELLA = 18;
const DISTANZA_CASELLE = 2;
const MARGINE_BASSO = 6;

const CHIARO = "#e4e2d6";
const TENUE = "#9a9689";

// Colori dell'interfaccia, tenuti qui e non nella tavolozza degli sprite:
// quella descrive il mondo, questa descrive il vetro davanti al mondo.
const FONDO = "rgb(16 18 22 / 0.78)";
const FONDO_PIENO = "rgb(16 18 22 / 0.92)";
const BORDO = "#3a3f48";
const BORDO_SCELTO = "#c9b189";
const GRIGIO = "#8e8a7e";
const VERDE = "#7fae63";
const ROSSO = "#c0705f";

function riquadro(p, x, y, larghezza, altezza, fondo, bordo) {
  p.fillStyle = fondo;
  p.fillRect(x, y, larghezza, altezza);
  p.fillStyle = bordo;
  p.fillRect(x, y, larghezza, 1);
  p.fillRect(x, y + altezza - 1, larghezza, 1);
  p.fillRect(x, y, 1, altezza);
  p.fillRect(x + larghezza - 1, y, 1, altezza);
}

// --- barra dello zaino ----------------------------------------------------

function larghezzaBarra() {
  return inventario.CASELLE * LATO_CASELLA + (inventario.CASELLE - 1) * DISTANZA_CASELLE;
}

// Una casella, disegnata da un posto solo. La barra in basso e la cassa la
// vogliono identica — stessa cornice, stessa icona, stesso conto, stessa
// freschezza — e tenerne due copie avrebbe voluto dire due posti in cui
// sistemare la stessa cosa.
function casellaDisegnata(p, x, y, casella, scelta, inCassa) {
  riquadro(p, x, y, LATO_CASELLA, LATO_CASELLA, FONDO, scelta ? BORDO_SCELTO : BORDO);
  if (!casella) return;

  const icona = CATALOGO[casella.cosa]?.icona;
  if (icona) p.drawImage(cuoci(icona), x + 3, y + 3);

  // La quantità solo se è più di una: "1" accanto a ogni icona è rumore.
  if (casella.quantita > 1) {
    const etichetta = String(casella.quantita);
    testo.disegnaConOmbra(p, etichetta, x + LATO_CASELLA - 2 - testo.larghezza(etichetta), y + LATO_CASELLA - 7, CHIARO);
  }

  // La durata di un attrezzo: una barretta lungo il bordo di sotto.
  //
  // Da questa tappa ci sono due cose da dire invece di una. La barra colorata
  // è la lena che resta adesso; il tacchetto rosso è fin dove arriva il pieno
  // di questo esemplare, che scende a ogni riparazione e non risale mai. Si
  // vede a colpo d'occhio la differenza fra un'ascia quasi scarica e un'ascia
  // rifatta cinque volte, che è poi la cosa che decide se conviene ripararla
  // ancora o rifarla da capo.
  const usi = inventario.usiRimasti(casella);
  if (usi !== null) {
    const durata = CATALOGO[casella.cosa].durata;
    const massimo = inventario.massimoDi(casella);
    const larga = LATO_CASELLA - 4;
    p.fillStyle = usi === 0 ? ROSSO : BORDO;
    p.fillRect(x + 2, y + LATO_CASELLA - 3, larga, 2);
    // Il colore dice quanto è carico adesso (usi sul suo pieno), la lunghezza
    // dice quanto gli resta in assoluto (usi sul pieno di quando era nuovo).
    // Sono due domande diverse e il giocatore se le fa tutte e due: un'ascia
    // appena riparata è verde e corta — piena, ma non è più quella di prima.
    p.fillStyle = coloreBisogno(usi / massimo);
    p.fillRect(x + 2, y + LATO_CASELLA - 3, Math.ceil(larga * usi / durata), 2);
    // Un pixel, e solo quando il tetto è sceso: su un attrezzo nuovo non c'è
    // niente da segnare.
    if (massimo < durata) {
      p.fillStyle = ROSSO;
      p.fillRect(x + 2 + Math.round(larga * massimo / durata), y + LATO_CASELLA - 4, 1, 3);
    }
  }

  // La freschezza: una riga di un pixel lungo il bordo di sopra, che si
  // accorcia e cambia colore. Un pixel e non una barra vera perché è
  // un'informazione di sfondo — serve a far scegliere quale rapa mangiare per
  // prima, non a essere guardata.
  //
  // Si disegna sempre e non solo quando sta per andare, e la ragione è quella
  // che regge tutto questo gioco: una scadenza che non si vede è una trappola.
  // Perdere il raccolto d'autunno e scoprire soltanto dopo che esisteva un
  // orologio sarebbe una regola imparata nel modo peggiore.
  const andata = decadimento.quantoEAndata(casella, inCassa);
  if (andata === null) return;
  const resta = 1 - andata;
  const piena = LATO_CASELLA - 4;
  const lunga = Math.max(1, Math.round(piena * resta));
  p.fillStyle = "#2b2f36";
  p.fillRect(x + 2, y + 1, piena, 1);
  p.fillStyle = coloreBisogno(resta);
  p.fillRect(x + 2, y + 1, lunga, 1);
}

export function disegnaZaino(p, scelta) {
  const totale = larghezzaBarra();
  const x0 = Math.round((schermo.LARGHEZZA - totale) / 2);
  const y = schermo.ALTEZZA - LATO_CASELLA - MARGINE_BASSO;
  const caselle = inventario.contenuto();

  for (let i = 0; i < caselle.length; i += 1) {
    const x = x0 + i * (LATO_CASELLA + DISTANZA_CASELLE);
    casellaDisegnata(p, x, y, caselle[i], i === scelta, false);
  }

  return { x0, y, larghezza: totale };
}

// --- la cassa -------------------------------------------------------------

// Due griglie e un cursore solo.
//
// Due cursori — uno per parte, e un tasto per saltare fra le parti — sarebbero
// tre cose da imparare per un gesto solo. Con un cursore unico che scavalca il
// confine, le frecce fanno quello che fanno sempre e la barra ha un
// significato solo: manda dall'altra parte quello che è selezionato. Non c'è
// "prendi" e non c'è "metti", c'è "sposta", e da che parte si vede.
const COLONNE = 4;
const CASSA_RIGHE = contenitori.CASELLE / COLONNE;
const ZAINO_RIGHE = inventario.CASELLE / COLONNE;
const PASSO_CASELLA = LATO_CASELLA + DISTANZA_CASELLE;

// Quante caselle in tutto, cassa più zaino: il cursore le percorre come se
// fossero una griglia sola, perché per chi guarda lo sono.
export const CASSA_TOTALI = contenitori.CASELLE + inventario.CASELLE;

export function disegnaCassa(p, { contenuto, scelta }) {
  const griglia = COLONNE * PASSO_CASELLA - DISTANZA_CASELLE;
  const larghezza = griglia + 16;
  const altezza = 12 + CASSA_RIGHE * PASSO_CASELLA + 10 + ZAINO_RIGHE * PASSO_CASELLA + 13;
  const x = Math.round((schermo.LARGHEZZA - larghezza) / 2);
  const y = Math.round((schermo.ALTEZZA - altezza) / 2);

  p.fillStyle = "rgb(8 9 12 / 0.72)";
  p.fillRect(0, 0, schermo.LARGHEZZA, schermo.ALTEZZA);
  riquadro(p, x, y, larghezza, altezza, FONDO_PIENO, BORDO);

  const sinistra = x + 8;
  testo.disegna(p, "LA CASSA", sinistra, y + 4, CHIARO);

  const primaRiga = y + 12;
  for (let i = 0; i < contenitori.CASELLE; i += 1) {
    const cx = sinistra + (i % COLONNE) * PASSO_CASELLA;
    const cy = primaRiga + Math.floor(i / COLONNE) * PASSO_CASELLA;
    casellaDisegnata(p, cx, cy, contenuto[i], i === scelta, true);
  }

  const yZaino = primaRiga + CASSA_RIGHE * PASSO_CASELLA + 2;
  testo.disegna(p, "ZAINO", sinistra, yZaino, GRIGIO);

  const caselle = inventario.contenuto();
  const primaZaino = yZaino + 8;
  for (let i = 0; i < inventario.CASELLE; i += 1) {
    const cx = sinistra + (i % COLONNE) * PASSO_CASELLA;
    const cy = primaZaino + Math.floor(i / COLONNE) * PASSO_CASELLA;
    casellaDisegnata(p, cx, cy, caselle[i], contenitori.CASELLE + i === scelta, false);
  }

  // Il piede dice i tasti, come nella schermata della partita: una schermata
  // modale che non dice come si esce è una stanza senza porta.
  const vuota = contenuto.every((c) => !c);
  const piede = vuota ? "SPAZIO SPOSTA   X SMONTA   C CHIUDI" : "SPAZIO SPOSTA   C CHIUDI";
  testo.disegna(p, piede, x + Math.round((larghezza - testo.larghezza(piede)) / 2), y + altezza - 9, GRIGIO);
}

// --- i bisogni ------------------------------------------------------------

const ICONE_BISOGNI = {
  fame: indicatori.FAME,
  sete: indicatori.SETE,
  stanchezza: indicatori.STANCHEZZA,
};

const LARGHEZZA_BARRA = 44;
const ALTEZZA_BARRA = 5;
const PASSO_BARRA = 10;

// Il colore dice lo stato prima della lunghezza: di sottocoda si guarda una
// barra per un decimo di secondo, e in quel decimo si legge una tinta, non
// una misura.
function coloreBisogno(livello) {
  if (livello > 0.5) return "#7fae63";
  if (livello > 0.2) return "#d8a44a";
  return "#c0705f";
}

const FREDDO = "#8fa8d8";
const MALATO = "#9d7fb0";

function barra(p, y, icona, livello, colore) {
  p.drawImage(cuoci(icona, tinta(colore)), 5, y - 1);

  const x = 15;
  p.fillStyle = "rgb(16 18 22 / 0.78)";
  p.fillRect(x - 1, y - 1, LARGHEZZA_BARRA + 2, ALTEZZA_BARRA + 2);
  p.fillStyle = "#2b2f36";
  p.fillRect(x, y, LARGHEZZA_BARRA, ALTEZZA_BARRA);
  p.fillStyle = colore;
  // Arrotondato per eccesso finché resta qualcosa: una barra che sparisce
  // mentre il bisogno non è ancora a zero direbbe una bugia.
  const pieno = livello > 0 ? Math.max(1, Math.round(LARGHEZZA_BARRA * livello)) : 0;
  p.fillRect(x, y, pieno, ALTEZZA_BARRA);
}

// In alto a sinistra: è l'unico angolo rimasto libero, con l'orologio in alto
// a destra, lo zaino in basso al centro e la minimappa in basso a destra.
//
// La salute sta sopra e staccata dalle altre tre. Non è un vezzo di
// impaginazione: le tre di sotto dicono cosa manca, quella di sopra dice
// quanto manca alla fine della partita, e mettendole in fila si sarebbero
// lette come quattro cose dello stesso peso.
export function disegnaBisogni(
  p,
  { salute = 1, alFreddo = false, infetto = false, inseguito = false } = {}
) {
  barra(p, 5, indicatori.SALUTE, salute, coloreBisogno(salute));

  // Gli avvisi stanno in fila accanto alla barra che stanno consumando, e
  // compaiono solo quando valgono. Non sono barre: il gelo, l'infezione e
  // l'essere inseguiti o ci sono o non ci sono, e disegnarli come misure
  // avrebbe voluto dire tre numeri in più da guardare per sapere tre sì o no.
  let ax = 15 + LARGHEZZA_BARRA + 4;
  const avviso = (righe, colore) => {
    p.drawImage(cuoci(righe, tinta(colore)), ax, 4);
    ax += 9;
  };
  if (alFreddo) avviso(indicatori.FREDDO, FREDDO);
  if (infetto) avviso(indicatori.INFEZIONE, MALATO);
  // Lampeggia, al contrario degli altri due: il freddo e l'infezione sono
  // stati in cui si è, questo è qualcosa che sta succedendo adesso, e la
  // differenza si legge prima di leggere il simbolo.
  if (inseguito && Math.floor(Date.now() / 300) % 2 === 0) {
    avviso(indicatori.INSEGUITO, ROSSO);
  }

  const livelli = bisogni.tutti();
  let y = 5 + PASSO_BARRA + 3;

  for (const quale of bisogni.ELENCO) {
    barra(p, y, ICONE_BISOGNI[quale], livelli[quale], coloreBisogno(livelli[quale]));
    y += PASSO_BARRA;
  }
}

// --- il colpo preso -------------------------------------------------------

// Una cornice rossa che sbiadisce. Non un velo su tutto lo schermo: coprire
// il gioco proprio nel momento in cui bisogna decidere se scappare o
// rispondere sarebbe una punizione dentro la punizione. Dai bordi si vede
// senza guardarla, che è quello che serve.
const SPESSORE_DANNO = 10;

export function disegnaDanno(p, forza) {
  if (!(forza > 0)) return;

  const a = Math.min(0.55, forza * 0.55);
  const larghezza = schermo.LARGHEZZA;
  const altezza = schermo.ALTEZZA;

  for (let i = 0; i < SPESSORE_DANNO; i += 1) {
    // Più fitto sul bordo estremo e trasparente verso il centro: una fascia
    // piena si legge come una cornice disegnata, questa come un lampo.
    p.fillStyle = `rgb(150 30 26 / ${(a * (1 - i / SPESSORE_DANNO)).toFixed(3)})`;
    p.fillRect(i, i, larghezza - i * 2, 1);
    p.fillRect(i, altezza - i - 1, larghezza - i * 2, 1);
    p.fillRect(i, i, 1, altezza - i * 2);
    p.fillRect(larghezza - i - 1, i, 1, altezza - i * 2);
  }
}

// --- la morte -------------------------------------------------------------

// Occupa lo schermo intero e non si chiude da sola. È l'unica schermata del
// gioco che non si può togliere di mezzo con un tasto qualsiasi: si legge
// cos'è successo, e poi si decide di continuare.
export function disegnaMorte(p, { causa, giorno, stagione, corpo }) {
  p.fillStyle = "rgb(8 9 12 / 0.86)";
  p.fillRect(0, 0, schermo.LARGHEZZA, schermo.ALTEZZA);

  const larghezza = 210;
  const altezza = 82;
  const x = Math.round((schermo.LARGHEZZA - larghezza) / 2);
  const y = Math.round((schermo.ALTEZZA - altezza) / 2);

  riquadro(p, x, y, larghezza, altezza, FONDO_PIENO, ROSSO);

  const centrata = (scritta, ry, colore) => {
    testo.disegna(p, scritta, Math.round((schermo.LARGHEZZA - testo.larghezza(scritta)) / 2), ry, colore);
  };

  // La causa e non solo il fatto: "sei morto" lascia al giocatore il compito
  // di indovinare cosa avrebbe dovuto fare diversamente, ed è esattamente la
  // cosa che una morte deve insegnare.
  centrata(`SEI MORTO ${causa.toUpperCase()}`, y + 12, ROSSO);
  centrata(`GIORNO ${giorno}  ${stagione.toUpperCase()}`, y + 24, TENUE);

  // Quello che la morte non porta via si dice qui, perché è la metà del
  // patto: senza, si legge come una partita finita.
  centrata("LA VALLE RESTA COM'ERA.", y + 40, GRIGIO);
  centrata(
    corpo ? "IL TUO CORPO È DOVE SEI CADUTO, CON" : "QUELLO CHE AVEVI ADDOSSO È PERDUTO.",
    y + 48,
    GRIGIO
  );
  if (corpo) centrata("TUTTO QUELLO CHE AVEVI ADDOSSO.", y + 56, GRIGIO);

  centrata("SPAZIO  UN NUOVO SUPERSTITE", y + altezza - 13, BORDO_SCELTO);
}

// --- orologio -------------------------------------------------------------

// La stagione ha il suo colore, preso dalla valle che disegna. Serve a farla
// leggere in un colpo d'occhio anche a chi non sta leggendo: si guarda
// l'orologio per sapere che ora è, e la stagione arriva lo stesso.
const TINTA_STAGIONE = {
  estate: "#c9b189",
  autunno: "#a8762c",
  inverno: "#8fa8d8",
  primavera: "#7fb85a",
};

export function disegnaOrologio(p, { giorno, orologio, eNotte, stagione, giornoNellaStagione, giorniPerStagione }) {
  const riga1 = `GIORNO ${giorno}`;
  // Il giorno dentro la stagione e non solo il nome: "inverno" da solo non
  // dice se conviene ancora seminare o se è meglio andare a fare legna.
  const riga2 = `${stagione.toUpperCase()} ${giornoNellaStagione}/${giorniPerStagione}`;
  const riga3 = orologio;
  const larghezza = Math.max(
    testo.larghezza(riga1),
    testo.larghezza(riga2),
    testo.larghezza(riga3)
  );
  const x = schermo.LARGHEZZA - larghezza - 7;

  riquadro(p, x - 4, 3, larghezza + 8, 25, FONDO, BORDO);
  testo.disegna(p, riga1, x, 6, TENUE);
  testo.disegna(p, riga2, x, 13, TINTA_STAGIONE[stagione] ?? TENUE);
  testo.disegna(p, riga3, x, 20, eNotte ? "#8fa8d8" : CHIARO);
}

// --- suggerimento dell'azione --------------------------------------------

export function disegnaMeteo(p, { evento, domani, bagnato, freddo = 0 }) {
  if (freddo > 0) testo.disegnaConOmbra(p, `FREDDO X${freddo}`, 7, 72, "#91b9cc");
  const nomi = { arido: "ARIDO: SETE X3", pioggia: "PIOGGIA", neve: "NEVE: PASSO -28%", sereno: "SERENO" };
  const scritta = nomi[evento];
  const x = schermo.LARGHEZZA - testo.larghezza(scritta) - 7;
  testo.disegnaConOmbra(p, scritta, x, 33, evento === "arido" ? "#e0b46a" : "#abcdd7");
  if (domani !== evento && domani !== "sereno") {
    const previsione = `DOMANI ${domani === "arido" ? "ARIDO" : domani.toUpperCase()}`;
    testo.disegnaConOmbra(p, previsione, schermo.LARGHEZZA-testo.larghezza(previsione)-7, 42, TENUE);
  }
  if (bagnato > 0.01) testo.disegnaConOmbra(p, bagnato >= 0.5 ? "ZUPPO: CERCA CALORE" : "BAGNATO", 7, 63, "#91b9cc");
}

export function disegnaAzione(p, azione) {
  if (!azione) return;

  // Un'azione impedita si dice al posto del tasto, non dopo averlo premuto.
  // Il tasto nominato è una promessa, e prometterlo per poi non fare niente è
  // peggio che non nominarlo: si finisce a pestare la barra chiedendosi se il
  // gioco ha sentito.
  if (azione.impedito) {
    const scritta = azione.impedito.toUpperCase();
    const larghezza = testo.larghezza(scritta);
    const x = Math.round((schermo.LARGHEZZA - larghezza) / 2);
    const y = schermo.ALTEZZA - LATO_CASELLA - MARGINE_BASSO - 14;
    riquadro(p, x - 5, y - 4, larghezza + 10, 13, FONDO, BORDO);
    testo.disegna(p, scritta, x, y, "#c0705f");
    return;
  }

  let etichetta = azione.verbo.toUpperCase();
  if (["raccogli", "macella"].includes(azione.tipo) && azione.restano > 1) etichetta += ` (${azione.restano})`;
  if (azione.tipo === "posa") etichetta += ` ${nomeDi(azione.cosa).toUpperCase()}`;

  const scritta = `SPAZIO  ${etichetta}`;
  const larghezza = testo.larghezza(scritta);
  const x = Math.round((schermo.LARGHEZZA - larghezza) / 2);
  const y = schermo.ALTEZZA - LATO_CASELLA - MARGINE_BASSO - 14;

  riquadro(p, x - 5, y - 4, larghezza + 10, 13, FONDO, BORDO);
  testo.disegna(p, scritta, x, y, CHIARO);
}

// --- messaggio di passaggio ----------------------------------------------

export function disegnaMessaggio(p, messaggio) {
  if (!messaggio) return;
  const larghezza = testo.larghezza(messaggio.testo);
  const x = Math.round((schermo.LARGHEZZA - larghezza) / 2);
  // Sale piano mentre svanisce: un messaggio fermo che sparisce sembra un
  // errore di disegno, uno che si muove sembra una notifica.
  const y = 26 - Math.round((1 - messaggio.vita) * 5);
  testo.disegnaConOmbra(p, messaggio.testo, x, y, messaggio.colore ?? CHIARO);
}

// --- pannello delle ricette ----------------------------------------------

// Quante righe ci stanno. Sette e non undici, e non è l'altezza dello schermo
// a deciderlo — undici ci starebbero per un pelo: è che un elenco che si legge
// tutto in un colpo smette di essere un elenco quando diventa una parete.
//
// Fino a M7.3 questo pannello disegnava tutta la lista in colonna e le ricette
// si sceglievano con i tasti da 1 a 8. Erano due tetti veri, non due scelte di
// misura: le ricette erano esattamente otto, quindi la nona sarebbe stata
// irraggiungibile, e a undici il riquadro sfondava lo schermo. Con una
// finestra che scorre e un cursore, il tetto non c'è più.
const RICETTE_VISIBILI = 7;

export function disegnaRicette(p, { scelta, alBanco }) {
  const righe = Math.min(RICETTE_VISIBILI, RICETTE.length);
  const altezzaRiga = 16;
  const larghezza = 164;
  const altezza = 16 + righe * altezzaRiga + 12;
  const x = Math.round((schermo.LARGHEZZA - larghezza) / 2);
  const y = Math.round((schermo.ALTEZZA - altezza) / 2) - 12;

  // La finestra tiene il cursore in mezzo finché può, e si incolla agli
  // estremi quando ci arriva: scorrere di continuo anche in cima a un elenco
  // corto fa perdere il senso di dove si è.
  const primo = Math.max(0, Math.min(scelta - (righe >> 1), RICETTE.length - righe));

  riquadro(p, x, y, larghezza, altezza, FONDO_PIENO, BORDO);
  testo.disegna(p, "COSTRUIRE", x + 7, y + 6, CHIARO);

  // Due cose nell'intestazione, e nessuna è decorazione. Il conto dice che
  // l'elenco continua sotto — con una finestra che scorre, senza non si sa
  // quanto manca. "AL BANCO" acceso dice che il banco lì accanto sta
  // funzionando: senza, l'unico modo di saperlo sarebbe provare.
  //
  // Stanno una accanto al titolo e una a destra, e non si scambiano il posto:
  // la prima stesura le metteva tutte e due a destra, una esclusa dall'altra,
  // e arrivando al banco spariva il conto proprio quando si comincia a
  // scorrere davvero.
  if (RICETTE.length > righe) {
    const conto = `${scelta + 1}/${RICETTE.length}`;
    testo.disegna(p, conto, x + 14 + testo.larghezza("COSTRUIRE"), y + 6, GRIGIO);
  }
  if (alBanco) {
    const eti = "AL BANCO";
    testo.disegna(p, eti, x + larghezza - 7 - testo.larghezza(eti), y + 6, BORDO_SCELTO);
  }

  for (let i = 0; i < righe; i += 1) {
    const indice = primo + i;
    const ricetta = RICETTE[indice];
    const ry = y + 17 + i * altezzaRiga;
    // Due modi diversi di non poter costruire, e vanno detti diversi: manca la
    // roba, o manca il posto. Il primo si risolve raccogliendo, il secondo
    // tornando a casa — e un grigio solo li manderebbe a fare la cosa
    // sbagliata.
    const manca = ricetta.banco && !alBanco;
    const possibile = !manca && bastano(ricetta);
    const eScelta = indice === scelta;

    if (eScelta) {
      p.fillStyle = "rgb(255 255 255 / 0.08)";
      p.fillRect(x + 3, ry - 2, larghezza - 6, altezzaRiga - 2);
    }

    const icona = CATALOGO[ricetta.produce.cosa]?.icona;
    if (icona) p.drawImage(cuoci(icona), x + 5, ry - 2);

    const nome = ((ricetta.ripara ? "Ripara " : "") + nomeDi(ricetta.produce.cosa)).toUpperCase();
    testo.disegna(p, nome, x + 20, ry, possibile ? CHIARO : GRIGIO);

    // Quante ne escono, se sono più di una: due conserve da sei bacche è
    // metà di quello che c'è da sapere su quella riga.
    if (ricetta.produce.quante > 1) {
      testo.disegna(p, `x${ricetta.produce.quante}`, x + 22 + testo.larghezza(nome), ry, GRIGIO);
    }

    // Le ricette del banco lo dicono sempre, anche quando il banco c'è: chi
    // apre il pannello in mezzo a un prato deve poter vedere che esistono e
    // cosa gli manca, che è il solo modo di imparare il sistema senza che
    // nessuno glielo spieghi.
    if (ricetta.banco) {
      const eti = "BANCO";
      testo.disegna(p, eti, x + larghezza - 7 - testo.larghezza(eti), ry, manca ? ROSSO : BORDO_SCELTO);
    }

    // Il costo dice quanto hai e quanto serve, non solo quanto serve: senza,
    // bisogna aprire lo zaino per capire perché la riga è grigia.
    let cx = x + 20;
    const cy = ry + 7;
    for (const voce of ricetta.costo) {
      const posseduti = inventario.quante(voce.cosa);
      const pezzo = `${posseduti}/${voce.quante} ${nomeDi(voce.cosa).toUpperCase()}`;
      testo.disegna(p, pezzo, cx, cy, posseduti >= voce.quante ? VERDE : ROSSO);
      cx += testo.larghezza(pezzo) + 5;
    }
  }

  const piede = RICETTE[scelta]?.ripara ? "SPAZIO RIPARA IL PIU USURATO   C CHIUDI" : "FRECCE SCEGLI   SPAZIO COSTRUISCI   C CHIUDI";
  testo.disegna(p, piede, x + Math.round((larghezza - testo.larghezza(piede)) / 2), y + altezza - 9, GRIGIO);
}

// --- promemoria dei comandi ----------------------------------------------

// Accanto allo zaino, sempre. È il rimedio a un difetto vero della prima
// versione: chi raccoglieva legna non aveva modo di scoprire che serviva a
// costruire, perché niente sullo schermo nominava il tasto. Un sistema che
// non si trova è come se non ci fosse.
export function disegnaPromemoria(p, barra, cosaInMano, allaPorta = false, indice, alLetto = false) {
  const righe = ["C  COSTRUIRE"];
  const attrezzo = inventario.attrezzo(cosaInMano, indice);
  if (attrezzo) {
    const usi = inventario.usiRimasti(attrezzo);
    // Rotto non vuol più dire "non puoi": vuol dire "vale come un pugno". Il
    // promemoria deve dire quello, perché è la differenza fra un giocatore che
    // preme la barra e uno che la smette di premere.
    righe.push(usi === 0
      ? "ROTTO: VALE COME LE MANI NUDE"
      : "DURATA " + usi + "/" + inventario.massimoDi(attrezzo));
  }

  // Il promemoria del mangiare compare solo con qualcosa di commestibile in
  // mano. È lo stesso difetto di prima in un'altra forma: un tasto che
  // nessuno nomina è un tasto che non esiste — ma nominarlo sempre sarebbe
  // rumore, perché quasi mai si ha del cibo selezionato.
  // "Mangia" o "bevi" a seconda di cosa ristora: con il secchio pieno in mano
  // un promemoria che dice di mangiarlo si legge come un errore del gioco.
  const commestibile = cosaInMano && CATALOGO[cosaInMano]?.commestibile;
  if (commestibile) {
    const beve = (commestibile.sete ?? 0) > 0 && !(commestibile.fame > 0);
    righe.push(beve ? "E  BEVI" : `E  MANGIA ${nomeDi(cosaInMano).toUpperCase()}`);
  }
  // Stessa regola per la benda, stesso tasto: si nomina quando si ha in mano
  // qualcosa che si usa su di sé.
  if (cosaInMano && CATALOGO[cosaInMano]?.cura) righe.push("E  FASCIATI");

  // Stessa regola per il gettare, e con lo stesso momento giusto: si nomina
  // quando serve. A zaino pieno non poter costruire né raccogliere è un
  // vicolo cieco, e il tasto che ne esce va detto lì, non in un elenco letto
  // venti minuti prima.
  if (inventario.pieno()) righe.push("G  GETTA PER TERRA");

  // E stessa regola per la porta: il tasto che la stacca si nomina davanti a
  // una porta e in nessun altro momento. Senza, sarebbe una riga fissa per un
  // gesto che si fa due volte in una partita; con, è la risposta alla domanda
  // che uno si fa proprio lì — e adesso come la tolgo?
  if (allaPorta) righe.push("X  STACCA LA PORTA");
  if (alLetto) righe.push("X  SMONTA GIACIGLIO");

  let y = barra.y + 7 - (righe.length - 1) * 7;
  for (const scritta of righe) {
    testo.disegnaConOmbra(p, scritta, barra.x0 - testo.larghezza(scritta) - 8, y, TENUE);
    y += 7;
  }
}

// --- schermata di apertura ------------------------------------------------

const COMANDI = [
  ["WASD  FRECCE", "CAMMINARE"],
  ["MAIUSC", "CORRERE"],
  ["SPAZIO", "COLPIRE CIÒ CHE HAI DAVANTI"],
  ["1-8", "SCEGLIERE DALLO ZAINO"],
  ["C", "COSTRUIRE"],
  ["E", "MANGIARE O FASCIARTI"],
  ["G", "POSARE PER TERRA CIÒ CHE HAI IN MANO"],
  ["X", "SMONTARE PORTA O GIACIGLIO"],
  ["M", "MINIMAPPA"],
  ["TAB", "LA MAPPA DI QUELLO CHE HAI VISTO"],
  ["V", "IL VOLUME: MUTO, PIANO, FORTE"],
  ["P", "SALVARE E CARICARE"],
  ["F3", "DIAGNOSTICA"],
];

// Si mostra a ogni avvio e sparisce al primo tasto. A ogni avvio e non solo
// al primo: chi sa già i comandi preme W e non la vede più, chi torna dopo
// una settimana non deve andarseli a cercare.
export function disegnaApertura(p, versione) {
  const larghezza = 236;
  const altezza = 30 + COMANDI.length * 9 + 22;
  const x = Math.round((schermo.LARGHEZZA - larghezza) / 2);
  const y = Math.round((schermo.ALTEZZA - altezza) / 2);

  p.fillStyle = "rgb(8 9 12 / 0.72)";
  p.fillRect(0, 0, schermo.LARGHEZZA, schermo.ALTEZZA);
  riquadro(p, x, y, larghezza, altezza, FONDO_PIENO, BORDO);

  testo.disegna(p, "ULTIMO RACCOLTO", x + 10, y + 9, CHIARO);
  // La versione sta qui perché è l'unico posto in cui serve davvero: senza,
  // non c'è modo di distinguere "non è stato pubblicato" da "il browser ti
  // sta servendo una copia vecchia".
  testo.disegna(p, versione, x + larghezza - 10 - testo.larghezza(versione), y + 9, BORDO_SCELTO);
  testo.disegna(p, "DI GIORNO SI RACCOGLIE, DI NOTTE SERVE LUCE", x + 10, y + 18, GRIGIO);

  COMANDI.forEach(([tasto, cosa], i) => {
    const ry = y + 32 + i * 9;
    testo.disegna(p, tasto, x + 10, ry, BORDO_SCELTO);
    testo.disegna(p, cosa, x + 86, ry, TENUE);
  });

  const chiudi = "UN TASTO QUALSIASI PER COMINCIARE";
  testo.disegna(p, chiudi, Math.round((schermo.LARGHEZZA - testo.larghezza(chiudi)) / 2), y + altezza - 11, GRIGIO);
}

// --- la partita: salvare e caricare ---------------------------------------

// Due modi e non due schermate: le stesse quattro caselle si guardano per
// salvare e per caricare, e vederle una volta sola insegna dove sono. Il modo
// si cambia con destra e sinistra, che dentro un menu vogliono già dire
// "cambia colonna" senza che nessuno lo spieghi.
const NOMI_SLOT = { 1: "PRIMA", 2: "SECONDA", 3: "TERZA", alba: "ALBA" };

function quandoInBreve(quando) {
  const d = new Date(quando);
  if (Number.isNaN(d.getTime())) return "";
  const due = (n) => String(n).padStart(2, "0");
  return `${due(d.getDate())}/${due(d.getMonth() + 1)} ${due(d.getHours())}:${due(d.getMinutes())}`;
}

export function disegnaPartita(p, { voci, modo, scelta, rete }) {
  const altezzaRiga = 16;
  const larghezza = 186;
  // Due righe di piede: i tasti sono sei, e su una riga sola non ci stanno
  // senza diventare sigle da decifrare.
  const altezza = 27 + voci.length * altezzaRiga + 20;
  const x = Math.round((schermo.LARGHEZZA - larghezza) / 2);
  const y = Math.round((schermo.ALTEZZA - altezza) / 2) - 12;

  riquadro(p, x, y, larghezza, altezza, FONDO_PIENO, BORDO);
  testo.disegna(p, "LA PARTITA", x + 7, y + 6, CHIARO);

  // I modi scritti tutti, quello attivo acceso: una sola parola che cambia
  // costringerebbe a ricordare cosa c'era scritto prima.
  const salva = modo === "salva";
  const acceso = (quale) => (modo === quale ? BORDO_SCELTO : GRIGIO);
  testo.disegna(p, "CARICA", x + 74, y + 6, acceso("carica"));
  testo.disegna(p, "SALVA", x + 110, y + 6, acceso("salva"));
  testo.disegna(p, "RETE", x + 142, y + 6, acceso("rete"));

  if (modo === "rete") {
    disegnaRete(p, x, y, larghezza, altezza, rete);
    return;
  }

  voci.forEach((voce, i) => {
    const ry = y + 28 + i * altezzaRiga;
    const eScelta = i === scelta;
    // Una casella automatica non si scrive a mano, e una vuota non si carica:
    // in entrambi i casi la riga resta lì ma spenta, perché sparire sposterebbe
    // le altre e farebbe premere il numero sbagliato.
    const usabile = salva ? !voce.automatico : !voce.vuoto;

    if (eScelta) {
      p.fillStyle = "rgb(255 255 255 / 0.08)";
      p.fillRect(x + 3, ry - 2, larghezza - 6, altezzaRiga - 2);
    }

    testo.disegna(p, `${i + 1}`, x + 7, ry, eScelta ? BORDO_SCELTO : GRIGIO);
    testo.disegna(p, NOMI_SLOT[voce.slot] ?? String(voce.slot), x + 16, ry, usabile ? CHIARO : GRIGIO);

    // In modo salva la casella dell'alba dice cosa è invece di cosa contiene:
    // il grigio da solo dice "non si può" e non dice "perché", ed è la stessa
    // lezione del suggerimento impedito.
    if (salva && voce.automatico) {
      testo.disegna(p, "LA SCRIVE L'ALBA", x + 60, ry, GRIGIO);
      return;
    }

    if (voce.vuoto) {
      testo.disegna(p, "VUOTA", x + 60, ry, GRIGIO);
      return;
    }

    const riga = `GIORNO ${voce.giorno}  ${voce.stagione.toUpperCase()}`;
    testo.disegna(p, riga, x + 60, ry, usabile ? CHIARO : GRIGIO);
    testo.disegna(p, `${voce.seme}  ${quandoInBreve(voce.quando)}`, x + 16, ry + 7, GRIGIO);
  });

  const verbo = salva ? "SALVA" : "CARICA";
  testo.disegna(p, `1-4 SCEGLI   A/D MODO   SPAZIO ${verbo}   P CHIUDI`, x + 7, y + altezza - 17, GRIGIO);
  // Il file sta su una riga sua perché non riguarda le caselle: porta via e
  // porta dentro la partita in corso, ed è quello che serve per cambiare
  // computer.
  testo.disegna(p, "F  SALVA SU FILE      I  APRI UN FILE", x + 7, y + altezza - 9, GRIGIO);
}

// Il pannello della rete, che prende il posto delle caselle nel modo "rete".
// Non è un elenco: la sincronia è una cosa sola, accesa o spenta, e disegnarla
// come una quinta riga la farebbe sembrare una quinta casella.
function disegnaRete(p, x, y, larghezza, altezza, rete = {}) {
  const riga = (n) => y + 28 + n * 9;

  if (!rete.configurata) {
    testo.disegna(p, "LA SINCRONIA NON È CONFIGURATA", x + 7, riga(0), ROSSO);
    testo.disegna(p, "MANCA LA CHIAVE DEL PROGETTO IN", x + 7, riga(1), GRIGIO);
    testo.disegna(p, "REGOLE/SINCRONIA.JS", x + 7, riga(2), GRIGIO);
    testo.disegna(p, "A/D MODO   P CHIUDI", x + 7, y + altezza - 9, GRIGIO);
    return;
  }

  // Mentre si scrive il codice il pannello diventa una riga sola: tutto il
  // resto è roba che non si può fare finché non si è finito di scrivere, e
  // lasciarla lì accesa sarebbe un invito a premere tasti che non rispondono.
  if (rete.scrittura !== null && rete.scrittura !== undefined) {
    testo.disegna(p, "SCRIVI IL CODICE DELL'ALTRA PARTITA", x + 7, riga(0), CHIARO);
    // Il cursore lampeggia sul ritmo del tempo vero e non dei fotogrammi: a
    // sessanta al secondo un lampeggio a fotogrammi è troppo veloce.
    const cursore = Math.floor(Date.now() / 400) % 2 === 0 ? "-" : " ";
    testo.disegna(p, rete.scrittura + cursore, x + 7, riga(2), BORDO_SCELTO);
    testo.disegna(p, "INVIO CONFERMA   ESC ANNULLA", x + 7, y + altezza - 9, GRIGIO);
    return;
  }

  if (!rete.codice) {
    testo.disegna(p, "SINCRONIA SPENTA", x + 7, riga(0), GRIGIO);
    testo.disegna(p, "UN CODICE LEGA QUESTA PARTITA ALLA", x + 7, riga(2), GRIGIO);
    testo.disegna(p, "RETE. SCRIVILO SULL'ALTRO COMPUTER", x + 7, riga(3), GRIGIO);
    testo.disegna(p, "E LA VALLE TI SEGUE.", x + 7, riga(4), GRIGIO);
    testo.disegna(p, "SPAZIO CREA UN CODICE", x + 7, y + altezza - 17, GRIGIO);
    testo.disegna(p, "I  SCRIVI UN CODICE CHE HAI GIÀ", x + 7, y + altezza - 9, GRIGIO);
    return;
  }

  testo.disegna(p, "CODICE", x + 7, riga(0), GRIGIO);
  // Il codice è la cosa da ricopiare a mano, quindi è la cosa più in vista
  // della schermata.
  testo.disegna(p, rete.codice, x + 40, riga(0), BORDO_SCELTO);

  testo.disegna(p, "IN RETE", x + 7, riga(2), GRIGIO);
  if (rete.nuvola === "attesa") {
    testo.disegna(p, "CONTROLLO...", x + 40, riga(2), GRIGIO);
  } else if (!rete.nuvola) {
    testo.disegna(p, "NON RAGGIUNGIBILE", x + 40, riga(2), ROSSO);
  } else if (rete.nuvola.vuota) {
    testo.disegna(p, "ANCORA NIENTE", x + 40, riga(2), GRIGIO);
  } else {
    const quando = `GIORNO ${rete.nuvola.giorno}  ${(rete.nuvola.stagione ?? "").toUpperCase()}`;
    testo.disegna(p, quando, x + 40, riga(2), CHIARO);
    testo.disegna(p, rete.nuvola.seme ?? "", x + 40, riga(3), GRIGIO);
  }

  // Il conflitto si dice qui e non solo con un messaggio di passaggio: è uno
  // stato in cui si resta finché non si decide, non una cosa successa una
  // volta.
  if (rete.conflitto) {
    testo.disegna(p, "IN RETE C'È UNA PARTITA CHE QUESTO", x + 7, riga(4), ROSSO);
    testo.disegna(p, "COMPUTER NON HA MAI VISTO. NIENTE", x + 7, riga(5), ROSSO);
    testo.disegna(p, "SALE FINCHÉ NON DECIDI.", x + 7, riga(6), ROSSO);
    testo.disegna(p, "SPAZIO RIPRENDI QUELLA IN RETE", x + 7, y + altezza - 17, GRIGIO);
    testo.disegna(p, "F  TIENI QUESTA E SOVRASCRIVI", x + 7, y + altezza - 9, GRIGIO);
    return;
  }

  testo.disegna(p, "OGNI SALVATAGGIO SALE DA SOLO.", x + 7, riga(5), GRIGIO);
  testo.disegna(p, "SPAZIO RIPRENDI DALLA RETE", x + 7, y + altezza - 17, GRIGIO);
  testo.disegna(p, "X  SPEGNI LA SINCRONIA", x + 7, y + altezza - 9, GRIGIO);
}

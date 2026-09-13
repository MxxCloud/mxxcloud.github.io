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

export function disegnaZaino(p, scelta) {
  const totale = larghezzaBarra();
  const x0 = Math.round((schermo.LARGHEZZA - totale) / 2);
  const y = schermo.ALTEZZA - LATO_CASELLA - MARGINE_BASSO;
  const caselle = inventario.contenuto();

  for (let i = 0; i < caselle.length; i += 1) {
    const x = x0 + i * (LATO_CASELLA + DISTANZA_CASELLE);
    const eScelta = i === scelta;
    riquadro(p, x, y, LATO_CASELLA, LATO_CASELLA, FONDO, eScelta ? BORDO_SCELTO : BORDO);

    const casella = caselle[i];
    if (!casella) continue;

    const icona = CATALOGO[casella.cosa]?.icona;
    if (icona) p.drawImage(cuoci(icona), x + 3, y + 3);

    // La quantità solo se è più di una: "1" accanto a ogni icona è rumore.
    if (casella.quantita > 1) {
      const etichetta = String(casella.quantita);
      testo.disegnaConOmbra(p, etichetta, x + LATO_CASELLA - 2 - testo.larghezza(etichetta), y + LATO_CASELLA - 7, CHIARO);
    }
  }

  return { x0, y, larghezza: totale };
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

// In alto a sinistra: è l'unico angolo rimasto libero, con l'orologio in alto
// a destra, lo zaino in basso al centro e la minimappa in basso a destra.
export function disegnaBisogni(p) {
  const livelli = bisogni.tutti();
  let y = 5;

  for (const quale of bisogni.ELENCO) {
    const livello = livelli[quale];
    const colore = coloreBisogno(livello);

    p.drawImage(cuoci(ICONE_BISOGNI[quale], tinta(colore)), 5, y - 1);

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

    y += PASSO_BARRA;
  }
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
  if (azione.tipo === "raccogli" && azione.restano > 1) etichetta += ` (${azione.restano})`;
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

export function disegnaRicette(p, scelta) {
  const righe = RICETTE.length;
  const altezzaRiga = 16;
  const larghezza = 150;
  const altezza = 16 + righe * altezzaRiga + 12;
  const x = Math.round((schermo.LARGHEZZA - larghezza) / 2);
  const y = Math.round((schermo.ALTEZZA - altezza) / 2) - 12;

  riquadro(p, x, y, larghezza, altezza, FONDO_PIENO, BORDO);
  testo.disegna(p, "COSTRUIRE", x + 7, y + 6, CHIARO);

  RICETTE.forEach((ricetta, i) => {
    const ry = y + 17 + i * altezzaRiga;
    const possibile = bastano(ricetta);
    const eScelta = i === scelta;

    if (eScelta) {
      p.fillStyle = "rgb(255 255 255 / 0.08)";
      p.fillRect(x + 3, ry - 2, larghezza - 6, altezzaRiga - 2);
    }

    const icona = CATALOGO[ricetta.produce.cosa]?.icona;
    if (icona) p.drawImage(cuoci(icona), x + 5, ry - 2);

    testo.disegna(p, `${i + 1}`, x + 20, ry, eScelta ? BORDO_SCELTO : GRIGIO);
    testo.disegna(p, nomeDi(ricetta.produce.cosa).toUpperCase(), x + 28, ry, possibile ? CHIARO : GRIGIO);

    // Il costo dice quanto hai e quanto serve, non solo quanto serve: senza,
    // bisogna aprire lo zaino per capire perché la riga è grigia.
    let cx = x + 28;
    const cy = ry + 7;
    for (const voce of ricetta.costo) {
      const posseduti = inventario.quante(voce.cosa);
      const pezzo = `${posseduti}/${voce.quante} ${nomeDi(voce.cosa).toUpperCase()}`;
      testo.disegna(p, pezzo, cx, cy, posseduti >= voce.quante ? VERDE : ROSSO);
      cx += testo.larghezza(pezzo) + 5;
    }
  });

  const piede = `1-${RICETTE.length} SCEGLI   SPAZIO COSTRUISCI   C CHIUDI`;
  testo.disegna(p, piede, x + 7, y + altezza - 9, GRIGIO);
}

// --- promemoria dei comandi ----------------------------------------------

// Accanto allo zaino, sempre. È il rimedio a un difetto vero della prima
// versione: chi raccoglieva legna non aveva modo di scoprire che serviva a
// costruire, perché niente sullo schermo nominava il tasto. Un sistema che
// non si trova è come se non ci fosse.
export function disegnaPromemoria(p, barra, cosaInMano) {
  const righe = ["C  COSTRUIRE"];

  // Il promemoria del mangiare compare solo con qualcosa di commestibile in
  // mano. È lo stesso difetto di prima in un'altra forma: un tasto che
  // nessuno nomina è un tasto che non esiste — ma nominarlo sempre sarebbe
  // rumore, perché quasi mai si ha del cibo selezionato.
  const commestibile = cosaInMano && CATALOGO[cosaInMano]?.commestibile;
  if (commestibile) righe.push(`E  MANGIA ${nomeDi(cosaInMano).toUpperCase()}`);

  // Stessa regola per il gettare, e con lo stesso momento giusto: si nomina
  // quando serve. A zaino pieno non poter costruire né raccogliere è un
  // vicolo cieco, e il tasto che ne esce va detto lì, non in un elenco letto
  // venti minuti prima.
  if (inventario.pieno()) righe.push("G  GETTA PER TERRA");

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
  ["E", "MANGIARE CIÒ CHE HAI IN MANO"],
  ["G", "POSARE PER TERRA CIÒ CHE HAI IN MANO"],
  ["M", "MAPPA"],
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

export function disegnaPartita(p, { voci, modo, scelta }) {
  const altezzaRiga = 16;
  const larghezza = 186;
  // Due righe di piede: i tasti sono sei, e su una riga sola non ci stanno
  // senza diventare sigle da decifrare.
  const altezza = 27 + voci.length * altezzaRiga + 20;
  const x = Math.round((schermo.LARGHEZZA - larghezza) / 2);
  const y = Math.round((schermo.ALTEZZA - altezza) / 2) - 12;

  riquadro(p, x, y, larghezza, altezza, FONDO_PIENO, BORDO);
  testo.disegna(p, "LA PARTITA", x + 7, y + 6, CHIARO);

  // I due modi scritti entrambi, quello attivo acceso: una sola parola che
  // cambia costringerebbe a ricordare cosa c'era scritto prima.
  const salva = modo === "salva";
  testo.disegna(p, "CARICA", x + 92, y + 6, salva ? GRIGIO : BORDO_SCELTO);
  testo.disegna(p, "SALVA", x + 132, y + 6, salva ? BORDO_SCELTO : GRIGIO);

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

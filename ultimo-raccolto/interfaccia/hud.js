// L'interfaccia disegnata dentro il gioco.
//
// Sta sul canvas e non nel DOM, al contrario della diagnostica: la
// diagnostica è uno strumento da sviluppo e può permettersi il font di
// sistema, l'interfaccia vera no. Una barra dello zaino con il testo
// antialiasato accanto a icone di dodici pixel si vede subito come una cosa
// incollata sopra un'altra.

import * as schermo from "../motore/schermo.js";
import * as testo from "../arte/testo.js";
import { cuoci } from "../arte/sprite.js";
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

// --- orologio -------------------------------------------------------------

export function disegnaOrologio(p, giorno, orologio, eNotte) {
  const riga1 = `GIORNO ${giorno}`;
  const riga2 = orologio;
  const larghezza = Math.max(testo.larghezza(riga1), testo.larghezza(riga2));
  const x = schermo.LARGHEZZA - larghezza - 7;

  riquadro(p, x - 4, 3, larghezza + 8, 18, FONDO, BORDO);
  testo.disegna(p, riga1, x, 6, TENUE);
  testo.disegna(p, riga2, x, 13, eNotte ? "#8fa8d8" : CHIARO);
}

// --- suggerimento dell'azione --------------------------------------------

export function disegnaAzione(p, azione) {
  if (!azione) return;

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

  const piede = "1-2 SCEGLI   SPAZIO COSTRUISCI   C CHIUDI";
  testo.disegna(p, piede, x + 7, y + altezza - 9, GRIGIO);
}

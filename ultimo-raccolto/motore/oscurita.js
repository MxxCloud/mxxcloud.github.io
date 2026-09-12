// Il buio, e i buchi che le luci ci fanno dentro.
//
// L'oscurità non si disegna direttamente sullo schermo: si costruisce su un
// telo a parte, ci si ritagliano sopra le luci, e solo alla fine il telo
// finisce sul gioco. Disegnare i due passaggi direttamente sullo schermo
// cancellerebbe anche il gioco sotto, invece che solo il buio.

import * as schermo from "./schermo.js";
import { telaio } from "../arte/sprite.js";

// Quanto arriva a coprire il buio nel cuore della notte. A 1 si vedrebbe
// nero pieno; questo lascia intravedere le sagome, che è ciò che rende la
// notte inquietante invece che vuota.
const COPERTURA_MASSIMA = 0.82;

let telo = null;
let pennelloTelo = null;

function preparaTelo() {
  if (telo) return;
  const fatto = telaio(schermo.LARGHEZZA, schermo.ALTEZZA);
  telo = fatto.canvas;
  pennelloTelo = fatto.contesto;
}

export function disegna(pennello, luceAmbiente, tinta, lumi) {
  // In pieno giorno non c'è niente da coprire, e un telo trasparente steso
  // sessanta volte al secondo è comunque lavoro sprecato.
  if (luceAmbiente >= 0.999) return;

  preparaTelo();
  const copertura = (1 - luceAmbiente) * COPERTURA_MASSIMA;

  pennelloTelo.globalCompositeOperation = "source-over";
  pennelloTelo.clearRect(0, 0, schermo.LARGHEZZA, schermo.ALTEZZA);
  pennelloTelo.fillStyle = tinta;
  pennelloTelo.globalAlpha = copertura;
  pennelloTelo.fillRect(0, 0, schermo.LARGHEZZA, schermo.ALTEZZA);
  pennelloTelo.globalAlpha = 1;

  // "destination-out" toglie dal telo invece di aggiungere: ogni luce scava
  // il buio già steso. Il gradiente serve a non avere un bordo netto, che
  // leggerebbe come un disco di cartone appoggiato sopra il fuoco.
  pennelloTelo.globalCompositeOperation = "destination-out";
  for (const luce of lumi) {
    const x = Math.round(luce.x - schermo.camera.x);
    const y = Math.round(luce.y - schermo.camera.y);
    const raggio = luce.raggio;
    if (x + raggio < 0 || x - raggio > schermo.LARGHEZZA) continue;
    if (y + raggio < 0 || y - raggio > schermo.ALTEZZA) continue;

    const sfumatura = pennelloTelo.createRadialGradient(x, y, 0, x, y, raggio);
    const forza = Math.min(1, luce.intensita ?? 1);
    sfumatura.addColorStop(0, `rgb(0 0 0 / ${forza})`);
    sfumatura.addColorStop(0.45, `rgb(0 0 0 / ${forza * 0.72})`);
    sfumatura.addColorStop(1, "rgb(0 0 0 / 0)");
    pennelloTelo.fillStyle = sfumatura;
    pennelloTelo.fillRect(x - raggio, y - raggio, raggio * 2, raggio * 2);
  }

  pennelloTelo.globalCompositeOperation = "source-over";
  pennello.drawImage(telo, 0, 0);
}

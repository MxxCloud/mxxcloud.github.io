// Scheggie: i pezzetti che saltano via quando si colpisce qualcosa.
//
// Servono a una cosa sola, ed è la cosa che mancava: far sentire il colpo.
// Un albero che perde foglie e trucioli dice "l'hai preso" molto prima di
// qualunque numero sullo schermo.
//
// Non usano Math.random ma il generatore seminato del gioco. Le scheggie non
// fanno parte del mondo e non devono essere riproducibili, ma tenere una sola
// sorgente di casualità evita che un giorno qualcuno copi da qui l'abitudine
// sbagliata in un posto dove invece conta.

import * as schermo from "./schermo.js";
import { TAVOLOZZA } from "../arte/tavolozza.js";
import { generatore } from "./casuale.js";

const MASSIME = 240;
// Abbastanza perché ricadano in fretta: una scheggia che plana sembra una
// piuma, e un colpo d'ascia non fa volare piume.
const GRAVITA = 220;
const ATTRITO = 0.86;

const caso = generatore(0x5eed1e);

// Allocate una volta sola e riusate a rotazione. Sessanta volte al secondo
// per decine di pezzetti, creare oggetti nuovi darebbe al raccoglitore di
// rifiuti un lavoro che si vedrebbe come singhiozzo.
const pozzo = [];
for (let i = 0; i < MASSIME; i += 1) {
  pozzo.push({ viva: false, x: 0, y: 0, vx: 0, vy: 0, vita: 0, durata: 1, colore: "#fff" });
}
let prossima = 0;

export function sparge(x, y, quante, chiavi, forza = 1) {
  const colori = chiavi.map((c) => TAVOLOZZA[c]).filter(Boolean);
  if (colori.length === 0) return;

  for (let i = 0; i < quante; i += 1) {
    // A pozzo pieno si sovrascrive la più vecchia invece di rifiutare la
    // nuova: il colpo appena dato conta più di uno sfrido di mezzo secondo fa.
    const p = pozzo[prossima];
    prossima = (prossima + 1) % MASSIME;

    const angolo = caso() * Math.PI * 2;
    const spinta = (30 + caso() * 60) * forza;
    p.viva = true;
    p.x = x + (caso() - 0.5) * 6;
    p.y = y + (caso() - 0.5) * 6;
    p.vx = Math.cos(angolo) * spinta;
    // Verso l'alto di più che verso il basso: uno scoppio che parte solo in
    // orizzontale sembra una macchia che si allarga, non qualcosa che salta.
    p.vy = Math.sin(angolo) * spinta - 40 * forza;
    p.durata = 0.35 + caso() * 0.35;
    p.vita = p.durata;
    p.colore = colori[Math.floor(caso() * colori.length) % colori.length];
  }
}

export function aggiorna(passo) {
  for (const p of pozzo) {
    if (!p.viva) continue;
    p.vita -= passo;
    if (p.vita <= 0) {
      p.viva = false;
      continue;
    }
    p.vy += GRAVITA * passo;
    p.vx *= ATTRITO ** (passo * 60);
    p.x += p.vx * passo;
    p.y += p.vy * passo;
  }
}

export function disegna() {
  const pennello = schermo.pennello();
  const q = schermo.inquadratura();
  for (const p of pozzo) {
    if (!p.viva) continue;
    if (p.x < q.sinistra || p.x > q.destra || p.y < q.sopra || p.y > q.sotto) continue;
    pennello.fillStyle = p.colore;
    pennello.fillRect(Math.round(p.x - schermo.camera.x), Math.round(p.y - schermo.camera.y), 1, 1);
  }
}

export function vive() {
  let n = 0;
  for (const p of pozzo) if (p.viva) n += 1;
  return n;
}

export function svuota() {
  for (const p of pozzo) p.viva = false;
}

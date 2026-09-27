// La luce e l'aria (M7.18.44): il primo passo dell'upgrade grafico.
//
// Non si ridisegna niente. I disegni restano quelli, a 384×216 e a sedici
// pixel per tassello; cambia quello che ci passa sopra e sotto:
//
// - la luce di torce e fuochi è calda e trema, invece di un buco grigio nel
//   buio;
// - l'alba e il tramonto hanno un colore loro, e non solo di notte;
// - le cose in piedi hanno un'ombra morbida, che il sole allunga la mattina
//   e la sera;
// - i fuochi fanno fumo e scintille;
// - l'acqua luccica al sole;
// - nelle notti d'estate ci sono le lucciole;
// - da M7.18.46 c'è il vento: le chiome degli alberi, i cespugli, le piante
//   selvatiche e i ciuffi d'erba piegano alle raffiche, il fumo va dove va il
//   vento, e d'autunno cadono le foglie.
//
// Tutto è solo disegno: niente di quello che sta qui cambia una regola. Il
// raggio delle luci che tiene lontani gli infetti resta quello del catalogo
// — il tremolio allarga e stringe il disegno, non la luce vera — e gli avvisi
// del gioco (le foglie gialle della sete, i puntini dei parassiti) restano
// sotto colori che li scaldano senza coprirli.
//
// Si accende e si spegne col tasto L, e la scelta sta in localStorage come
// il volume: è una cosa dello schermo di chi gioca, non della valle.
//
// Le parti di conto sono funzioni pure — che colore ha quest'ora, dove cade
// un'ombra, quanto trema una fiamma, dove luccica l'acqua — e si provano
// senza un browser; il disegno le chiama e basta.

import { impronta, generatore } from "../motore/casuale.js";
import { OGGETTO } from "../mondo/generazione.js";
import { tavolozzaDi } from "./tavolozza.js";

const LARGHEZZA = 384;
const ALTEZZA = 216;
const TASSELLO = 16;

// --- acceso o spento ---------------------------------------------------------

const CHIAVE = "ultimo-raccolto/effetti";
let accesi = leggi();

function leggi() {
  try {
    return globalThis.localStorage?.getItem(CHIAVE) !== "spenti";
  } catch {
    return true;
  }
}

export function attivi() {
  return accesi;
}

export function imposta(valore) {
  accesi = Boolean(valore);
  try {
    globalThis.localStorage?.setItem(CHIAVE, accesi ? "accesi" : "spenti");
  } catch {
    // Non poterlo ricordare non è un guasto: vale per questa volta.
  }
  if (!accesi) svuota();
  return accesi;
}

export function alterna() {
  return imposta(!accesi);
}

// --- il colore dell'ora --------------------------------------------------------

// Due passaggi e basta: la notte ha già la sua tinta nel buio (vedi
// regole/tempo.js), e il mezzogiorno non ha bisogno di nessuno. L'alba è
// rosata e breve; la sera comincia due ore prima del tramonto e si fa più
// calda fino a che il buio la copre.
const ALBA = { centro: 6.3, mezza: 1.8, forza: 0.36, colore: [255, 178, 132] };
const SERA = { da: 16.5, picco: 18.8, a: 21, forza: 0.5, colore: [255, 146, 64] };

export function coloreDellOra(ora) {
  const alba = Math.max(0, 1 - Math.abs(ora - ALBA.centro) / ALBA.mezza);
  let sera = 0;
  if (ora > SERA.da && ora <= SERA.picco) sera = (ora - SERA.da) / (SERA.picco - SERA.da);
  else if (ora > SERA.picco && ora < SERA.a) sera = 1 - (ora - SERA.picco) / (SERA.a - SERA.picco);
  // Ammorbidito: una rampa dritta si vede cominciare.
  const liscia = (x) => x * x * (3 - 2 * x);
  const a = liscia(alba) * ALBA.forza;
  const s = liscia(sera) * SERA.forza;
  if (a <= 0 && s <= 0) return { forza: 0, colore: null };
  return a >= s
    ? { forza: a, colore: `rgb(${ALBA.colore.join(" ")})` }
    : { forza: s, colore: `rgb(${SERA.colore.join(" ")})` };
}

export function disegnaColoreDellOra(p, ora) {
  if (!accesi) return;
  const { forza, colore } = coloreDellOra(ora);
  p.save();
  if (forza > 0) {
    // "soft-light" scalda e dà un filo di contrasto senza velare: un
    // "source-over" arancione sarebbe una pellicola sul vetro, e le foglie
    // gialle della sete si confonderebbero col resto.
    p.globalCompositeOperation = "soft-light";
    p.globalAlpha = forza;
    p.fillStyle = colore;
    p.fillRect(0, 0, LARGHEZZA, ALTEZZA);
  }
  // Una vignetta leggera, sempre: tiene l'occhio al centro, dove sei tu.
  p.globalCompositeOperation = "source-over";
  p.globalAlpha = 1;
  const v = p.createRadialGradient(LARGHEZZA / 2, ALTEZZA / 2, ALTEZZA * 0.45, LARGHEZZA / 2, ALTEZZA / 2, LARGHEZZA * 0.62);
  v.addColorStop(0, "rgb(0 0 0 / 0)");
  v.addColorStop(1, "rgb(0 0 0 / 0.22)");
  p.fillStyle = v;
  p.fillRect(0, 0, LARGHEZZA, ALTEZZA);
  p.restore();
}

// --- le ombre --------------------------------------------------------------------

// Chi ha un'ombra: chi cammina (le entità, che hanno un tipo a parole —
// "giocatore", "infetto" — o nessuno) e le cose del mondo che stanno in piedi,
// che hanno il numero del loro OGGETTO. Non i muri, le porte e gli steccati: sono
// costruzioni lunghe, e un'ombra a ogni tassello si leggerebbe come una riga
// sporca alla base di ogni parete.
const CON_OMBRA = new Set([
  OGGETTO.ALBERO, OGGETTO.SASSO, OGGETTO.CESPUGLIO, OGGETTO.CASSA, OGGETTO.BANCO,
  OGGETTO.CARRO, OGGETTO.POZZO, OGGETTO.TRONCO, OGGETTO.ESSICCATOIO, OGGETTO.ESSICCATOIO_CARICO,
  OGGETTO.ESSICCATOIO_PRONTO, OGGETTO.SPAVENTAPASSERI, OGGETTO.SPAVENTAPASSERI_ROTTO, OGGETTO.POLLAIO,
  OGGETTO.FALO_ACCESO, OGGETTO.FALO_SPENTO, OGGETTO.FOCOLARE_ACCESO, OGGETTO.FOCOLARE_SPENTO,
  OGGETTO.TORCIA_PIANTATA,
]);

// Quello che si vede davvero in un disegno di una cosa del mondo: la riga
// più bassa con un pixel, e la colonna più a sinistra e la larghezza di
// tutto il disegno. Un sasso sta in un riquadro di sedici ma è largo
// quattordici e tocca terra con quattro, e l'ombra lo deve sapere. Si conta
// una volta per disegno: i disegni delle cose del mondo sono cotti quando si
// prepara un settore, non a ogni fotogramma.
const LIMITI = new WeakMap();
const VUOTO = Object.freeze({ vuoto: true });
export function limitiDi(sprite) {
  if (!sprite || typeof sprite.getContext !== "function") return null;
  const noti = LIMITI.get(sprite);
  if (noti) return noti;
  const { width: w, height: h } = sprite;
  const dati = sprite.getContext("2d").getImageData(0, 0, w, h).data;
  let sinistra = w, destra = -1, sotto = -1;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (dati[(y * w + x) * 4 + 3] === 0) continue;
      if (x < sinistra) sinistra = x;
      if (x > destra) destra = x;
      sotto = y;
    }
  }
  const limiti = sotto < 0 ? VUOTO : { sinistra, larghezza: destra - sinistra + 1, sotto };
  LIMITI.set(sprite, limiti);
  return limiti;
}

// Dove cade l'ombra di una cosa a quest'ora, o niente. È un'ovale piatta
// appena sotto la linea dei piedi: si vede davanti alla cosa e un poco ai
// lati, e così un sasso tondo sembra appoggiato per terra invece di avere un
// alone attorno alla base. Il sole va da est a ovest, quindi la mattina
// l'ombra scivola a ovest e la sera a est, più lunga; a mezzogiorno sta sotto
// i piedi. Di notte sparisce: la luce che c'è viene dai fuochi, e un'ombra
// del sole sarebbe una bugia.
//
// Si dà in pixel interi e rispetto all'angolo del disegno (dx, dy), perché
// il gioco mette i disegni sul pixel intero più vicino alla camera: in
// M7.18.44 l'ombra si calcolava a parte, in posizioni frazionarie, e
// camminando ballava di un pixel rispetto alla sua cosa.
//
// "limiti" è quello che si vede davvero nel disegno (vedi limitiDi). Chi
// cammina non ne ha — il suo disegno cambia a ogni passo — e usa un'impronta
// fissa, più stretta del riquadro.
export function ombraDi(cosa, ora, luce, limiti = null) {
  if (typeof cosa.tipo === "number" && !CON_OMBRA.has(cosa.tipo)) return null;
  if (limiti?.vuoto) return null;
  const forza = 0.28 * Math.min(1, Math.max(0, (luce - 0.25) / 0.6));
  if (forza <= 0) return null;
  const w = cosa.sprite?.width ?? TASSELLO;
  const h = cosa.sprite?.height ?? TASSELLO;
  const larghezza = limiti ? limiti.larghezza : w * 0.7;
  const centro = limiti ? limiti.sinistra + limiti.larghezza / 2 : w / 2;
  const piedi = limiti ? limiti.sotto + 1 : h;
  const sole = Math.max(-1, Math.min(1, (ora - 12.5) / 6.5));
  const misura = Math.min(larghezza * 0.42, 12);
  const rx = Math.max(2, Math.round(misura * (1 + 0.25 * Math.abs(sole))));
  const ry = Math.max(2, Math.round(misura * 0.32));
  return {
    dx: Math.round(centro + sole * 2) - rx,
    // Il centro un pixel sotto i piedi: la metà alta finisce dietro la cosa.
    dy: piedi + 1 - ry,
    rx,
    ry,
    forza,
  };
}

// L'ovale a pixel pieni, senza sfumature: sui bordi di un disegno a pixel
// una macchia sfumata si legge come uno sbaffo. Una per misura, e sono poche.
const OVALI = new Map();
function ovale(rx, ry) {
  const chiave = `${rx},${ry}`;
  const nota = OVALI.get(chiave);
  if (nota) return nota;
  const c = document.createElement("canvas");
  c.width = rx * 2;
  c.height = ry * 2;
  const x = c.getContext("2d");
  x.fillStyle = "rgb(22 18 30)";
  for (let py = 0; py < ry * 2; py += 1) {
    const b = (py + 0.5 - ry) / ry;
    const mezza = Math.round(rx * Math.sqrt(Math.max(0, 1 - b * b)));
    if (mezza > 0) x.fillRect(rx - mezza, py, mezza * 2, 1);
  }
  OVALI.set(chiave, c);
  return c;
}

// Sotto tutte le cose in piedi, prima di disegnarle: un'ombra sta per terra,
// e quella di un albero non deve coprire chi gli passa davanti. La posizione
// si arrotonda come quella del disegno (vedi schermo.disegna), così l'ombra
// sta ferma rispetto alla sua cosa anche mentre la vista scorre.
export function disegnaOmbre(p, cose, camera, ora, luce) {
  if (!accesi) return;
  p.save();
  for (const cosa of cose) {
    const limiti = typeof cosa.tipo === "number" ? limitiDi(cosa.sprite) : null;
    const o = ombraDi(cosa, ora, luce, limiti);
    if (!o) continue;
    p.globalAlpha = o.forza;
    p.drawImage(ovale(o.rx, o.ry), Math.round(cosa.x - camera.x) + o.dx, Math.round(cosa.y - camera.y) + o.dy);
  }
  p.restore();
}

// La vista, dalla camera: la stessa di schermo.inquadratura().
function vistaDi(camera) {
  const sinistra = Math.floor(camera.x);
  const sopra = Math.floor(camera.y);
  return { sinistra, sopra, destra: sinistra + LARGHEZZA, sotto: sopra + ALTEZZA };
}

// --- la fiamma che trema ---------------------------------------------------------

// Quanto è grande adesso il disegno di una luce rispetto al suo raggio: tre
// onde di passo diverso, così il tremolio non si ripete a occhio. La fase
// viene dal posto, perché due fuochi vicini non tremino insieme; quella in
// mano ha la sua, se no camminando cambierebbe ritmo a ogni passo.
export function tremolio(luce, secondi) {
  if (!accesi) return 1;
  const fase = luce.inMano ? 1.3 : ((luce.x * 0.37 + luce.y * 0.61) % 6.283);
  return 1 + 0.05 * Math.sin(secondi * 8.3 + fase) + 0.035 * Math.sin(secondi * 19.7 + fase * 2.3)
    + 0.02 * Math.sin(secondi * 31 + fase * 0.7);
}

// Il calore sopra il buio: una pozza arancione, sommata e non stesa, che
// conta solo quando fa scuro. Di giorno il fuoco non illumina niente.
//
// Da M7.18.45 a metà forza: in M7.18.44 la notte attorno a un fuoco si
// faceva troppo chiara. Il buco nel buio è quello di sempre; qui sopra resta
// il colore, non altra luce.
const CALORE = { pozza: 0.2, bordo: 0.1, cuore: 0.3 };
export function disegnaBagliori(p, camera, lumi, luce, secondi) {
  if (!accesi) return;
  const notte = 1 - luce;
  if (notte <= 0.02) return;
  p.save();
  p.globalCompositeOperation = "lighter";
  for (const l of lumi) {
    const t = tremolio(l, secondi);
    const raggio = l.raggio * 0.95 * t;
    const x = l.x - camera.x;
    const y = l.y - camera.y;
    if (x + raggio < 0 || x - raggio > LARGHEZZA || y + raggio < 0 || y - raggio > ALTEZZA) continue;
    const k = notte * Math.min(1, l.intensita ?? 1) * (0.85 + 0.15 * t);
    const g = p.createRadialGradient(x, y, 0, x, y, raggio);
    g.addColorStop(0, `rgb(255 176 92 / ${CALORE.pozza * k})`);
    g.addColorStop(0.3, `rgb(255 128 48 / ${CALORE.bordo * k})`);
    g.addColorStop(1, "rgb(255 90 20 / 0)");
    p.fillStyle = g;
    p.fillRect(x - raggio, y - raggio, raggio * 2, raggio * 2);
    // Il cuore della fiamma, piccolo e chiaro.
    const c = p.createRadialGradient(x, y, 0, x, y, 7 * t);
    c.addColorStop(0, `rgb(255 230 170 / ${CALORE.cuore * k})`);
    c.addColorStop(1, "rgb(255 200 120 / 0)");
    p.fillStyle = c;
    p.fillRect(x - 8, y - 8, 16, 16);
  }
  p.restore();
}

// --- il vento (M7.18.46) ---------------------------------------------------------------

// Quanto tira adesso, da zero a poco più di uno e mezzo. Soffia sempre da
// ovest — una valle ha il suo vento — a raffiche lente: due onde di passo
// diverso, così una raffica non arriva a tempo come un metronomo. Con la
// pioggia tira più forte, con la neve un po' di più.
export function vento(secondi, evento) {
  const raffica = 0.5 + 0.3 * Math.sin(secondi * 0.23) + 0.2 * Math.sin(secondi * 0.61 + 1.7);
  const forza = evento === "pioggia" ? 1.6 : evento === "neve" ? 1.2 : 1;
  return raffica * forza;
}

// Quanto piega adesso quello che sta in questo punto del mondo: sempre
// sottovento, e di più o di meno col passare dell'onda, che corre da ovest a
// est. Così un bosco non ondeggia tutto insieme: la raffica lo attraversa.
export function piega(aria, secondi, x, y) {
  return aria * (0.55 + 0.45 * Math.sin(secondi * 2.2 - x * 0.03 - y * 0.011));
}

// Chi si piega, e come: fasce del disegno dall'alto, ognuna con la sua parte
// della piega; quello che resta sotto l'ultima fascia sta fermo. Un albero
// piega la chioma (le prime quindici righe su ventitré) e non il tronco; un
// cespuglio e una pianta selvatica la metà di sopra, e di un pixel al più.
// Tutto in pixel interi: a questa risoluzione mezzo pixel non esiste, e un
// disegno che si sposta di un pixel intero è il modo in cui la pixel art ha
// sempre fatto muovere le foglie.
const ALBERO_MOSSO = { fasce: [[0.33, 1], [0.65, 0.6]], massimo: 2, scala: 1.8 };
const BASSO_MOSSO = { fasce: [[0.5, 1]], massimo: 1, scala: 1.5 };
const MOSSI = new Map([
  [OGGETTO.ALBERO, ALBERO_MOSSO],
  [OGGETTO.CESPUGLIO, BASSO_MOSSO],
  [OGGETTO.SPIGHE_SELVATICHE, BASSO_MOSSO],
  [OGGETTO.LINO_SELVATICO, BASSO_MOSSO],
  [OGGETTO.CAVOLO_SELVATICO, BASSO_MOSSO],
  [OGGETTO.PATATA_SELVATICA, BASSO_MOSSO],
  [OGGETTO.FAGIOLI_SELVATICI, BASSO_MOSSO],
]);

// Le fasce di un disegno mosso: [da, a, scarto] in righe e pixel, dall'alto.
// L'ultima è ferma. Niente per chi non piega.
export function fasceMosse(cosa, quanto) {
  const modo = MOSSI.get(cosa.tipo);
  if (!modo || !cosa.sprite) return null;
  const h = cosa.sprite.height;
  const scarto = Math.max(0, Math.min(modo.massimo, Math.round(quanto * modo.scala)));
  const fasce = [];
  let da = 0;
  for (const [fino, peso] of modo.fasce) {
    const a = Math.round(fino * h);
    fasce.push([da, a, Math.round(scarto * peso)]);
    da = a;
  }
  fasce.push([da, h, 0]);
  return fasce;
}

// Disegna una cosa in piedi piegata dal vento, se è una che piega, e dice se
// l'ha fatto: se no la disegna il gioco come sempre. "x" è già quella del
// disegno, col sussulto di un colpo se c'è.
export function disegnaMosso(p, cosa, x, camera, secondi, aria) {
  if (!accesi) return false;
  const quanto = piega(aria, secondi, cosa.x, cosa.base ?? cosa.y);
  const fasce = fasceMosse(cosa, quanto);
  if (!fasce) return false;
  const sx = Math.round(x - camera.x);
  const sy = Math.round(cosa.y - camera.y);
  const w = cosa.sprite.width;
  for (const [da, a, scarto] of fasce) {
    if (a > da) p.drawImage(cosa.sprite, 0, da, w, a - da, sx + scarto, sy + da, w, a - da);
  }
  return true;
}

// I ciuffi d'erba: l'erba è una trama cotta nei settori e non si muove, quindi
// sopra ci stanno dei ciuffi di tre fili, uno ogni quattro tasselli di prato
// libero, che piegano col vento. Il posto di un ciuffo è del tassello, e si
// chiede se è prato libero solo ai tasselli che ne hanno uno.
const QUANTI_CIUFFI = 0.25;
export function ciuffi(q, secondi, aria, ePratoLibero) {
  if (!accesi) return [];
  const trovati = [];
  const x0 = Math.floor(q.sinistra / TASSELLO), x1 = Math.floor((q.destra - 1) / TASSELLO);
  const y0 = Math.floor(q.sopra / TASSELLO), y1 = Math.floor((q.sotto - 1) / TASSELLO);
  for (let ty = y0; ty <= y1 + 1; ty += 1) {
    for (let tx = x0; tx <= x1; tx += 1) {
      if (impronta(tx, ty, 0xc1f0) > QUANTI_CIUFFI) continue;
      if (!ePratoLibero(tx, ty)) continue;
      const x = tx * TASSELLO + 3 + Math.floor(impronta(tx, ty, 0xc1f1) * 10);
      const y = ty * TASSELLO + 6 + Math.floor(impronta(tx, ty, 0xc1f2) * 9);
      trovati.push({
        x,
        y,
        alto: impronta(tx, ty, 0xc1f3) < 0.5 ? 3 : 4,
        piega: Math.max(0, Math.min(2, Math.round(piega(aria, secondi, x, y) * 1.6))),
      });
    }
  }
  return trovati;
}

export function disegnaCiuffi(p, camera, secondi, aria, stagione, ePratoLibero) {
  if (!accesi) return;
  const q = vistaDi(camera);
  const lista = ciuffi(q, secondi, aria, ePratoLibero);
  if (lista.length === 0) return;
  // I colori del prato di questa stagione: il più scuro alla radice, il più
  // chiaro in punta. D'autunno i ciuffi sono secchi come il resto.
  const t = tavolozzaDi(stagione);
  const scuro = t["6"], chiaro = t["8"];
  for (const c of lista) {
    const bx = Math.round(c.x - camera.x), by = Math.round(c.y - camera.y);
    // Tre fili: quello di mezzo più alto, i due di lato aperti in punta.
    for (const [dx, alto, apertura] of [[-2, c.alto - 1, -1], [0, c.alto, 0], [2, c.alto - 1, 1]]) {
      for (let k = 0; k < alto; k += 1) {
        const quota = k / Math.max(1, alto - 1);
        const spinta = Math.round((c.piega + apertura * 0.6) * quota * quota);
        p.fillStyle = k === 0 ? scuro : chiaro;
        p.fillRect(bx + dx + spinta, by - k, 1, 1);
      }
    }
  }
}

// --- fumo e scintille ------------------------------------------------------------

// Particelle nel mondo, non sullo schermo: se ti sposti, il fumo resta sopra
// il suo fuoco. Il fumo solo dai fuochi veri — falò e focolare, che hanno la
// luce più larga — e le scintille da tutto quello che brucia, torcia in mano
// compresa. Un tetto al numero, perché una notte con dieci fuochi non diventi
// una nebbia.
const MASSIMO = 260;
// Le foglie hanno un tetto loro: un bosco d'autunno non deve lasciare senza
// scintille il fuoco acceso lì accanto.
const MASSIMO_FOGLIE = 60;
const particelle = [];
const accumulati = new Map();
let caso = null;
let ultimo = null;

function pronto() {
  if (caso) return;
  const numero = new Uint32Array(1);
  globalThis.crypto?.getRandomValues?.(numero);
  caso = generatore(numero[0] || 0x5eed);
}

// I collaudi fissano il caso; il gioco no.
export function seminaParticelle(seme) {
  caso = generatore(seme >>> 0);
  svuota();
}

export function svuota() {
  particelle.length = 0;
  accumulati.clear();
  ultimo = null;
}

export function quanteParticelle(tipo) {
  return tipo ? particelle.filter((x) => x.tipo === tipo).length : particelle.length;
}

// Dove stanno, per i collaudi.
export function posizioniParticelle(tipo) {
  return particelle.filter((x) => x.tipo === tipo).map(({ x, y }) => ({ x, y }));
}

function emetti(tipo, l) {
  if (particelle.length >= MASSIMO) return;
  const scintilla = tipo === "scintilla";
  particelle.push({
    tipo,
    x: l.x + (caso() - 0.5) * (scintilla ? 4 : 5),
    y: l.y - (scintilla ? 2 : 5),
    vx: (caso() - 0.5) * (scintilla ? 10 : 4),
    vy: -(scintilla ? 14 + caso() * 10 : 6 + caso() * 4),
    eta: 0,
    vita: scintilla ? 0.7 + caso() * 0.7 : 2.8 + caso() * 1.4,
    fase: caso() * 6.283,
  });
}

// Un passo del tempo vero. Si chiede l'ora del browser e non il passo del
// gioco perché il fumo sale anche a gioco fermo, com'è giusto che faccia
// una finestra aperta su un posto.
export function aggiorna(secondi, lumi, { piove = false, aria = 0, alberi = [], stagione = null } = {}) {
  if (!accesi) return;
  pronto();
  const passo = ultimo === null ? 0 : Math.min(0.1, Math.max(0, secondi - ultimo));
  ultimo = secondi;
  // D'autunno le foglie: da ogni albero in vista, una ogni otto secondi o
  // giù di lì, di più quando tira vento.
  if (stagione === "autunno") {
    for (const albero of alberi) {
      if (albero.tipo !== OGGETTO.ALBERO) continue;
      const chiave = `foglie ${albero.x},${albero.y}`;
      const conto = accumulati.get(chiave) ?? { foglie: 0 };
      conto.foglie += passo * (0.08 + 0.1 * aria);
      while (conto.foglie >= 1) { conto.foglie -= 1; foglia(albero); }
      accumulati.set(chiave, conto);
    }
  }
  const visti = new Set();
  for (const l of lumi) {
    const chiave = l.inMano ? "mano" : `${Math.round(l.x)},${Math.round(l.y)}`;
    visti.add(chiave);
    const conto = accumulati.get(chiave) ?? { scintille: 0, fumo: 0 };
    conto.scintille += passo * (l.inMano ? 1.5 : 3.2);
    // Sotto la pioggia il fumo si schiaccia: meno, e più grigio.
    if (l.raggio >= 60) conto.fumo += passo * (piove ? 0.8 : 1.6);
    while (conto.scintille >= 1) { conto.scintille -= 1; emetti("scintilla", l); }
    while (conto.fumo >= 1) { conto.fumo -= 1; emetti("fumo", l); }
    accumulati.set(chiave, conto);
  }
  for (const chiave of accumulati.keys()) {
    if (!visti.has(chiave) && !chiave.startsWith("foglie ")) accumulati.delete(chiave);
  }
  if (accumulati.size > 400) for (const chiave of accumulati.keys()) if (chiave.startsWith("foglie ")) accumulati.delete(chiave);
  for (let i = particelle.length - 1; i >= 0; i -= 1) {
    const s = particelle[i];
    s.eta += passo;
    if (s.eta >= s.vita) { particelle.splice(i, 1); continue; }
    if (s.tipo === "foglia") {
      // Cade ondeggiando e il vento la porta; arrivata a terra ci resta un
      // poco, e poi sparisce.
      if (s.y < s.terra) {
        s.x += (aria * 9 + Math.sin(s.eta * 2.6 + s.fase) * 10) * passo;
        s.y = Math.min(s.terra, s.y + s.vy * passo);
        if (s.y >= s.terra) s.vita = s.eta + 1.8;
      }
      continue;
    }
    // Il fumo va col vento, sempre di più man mano che sale.
    const spinta = s.tipo === "fumo" ? aria * 7 * Math.min(1, s.eta) : 0;
    s.x += (s.vx + spinta + Math.sin(s.eta * 3 + s.fase) * (s.tipo === "fumo" ? 3 : 6)) * passo;
    s.y += s.vy * passo;
  }
}

// Una foglia nasce nella chioma di un albero e cade fino a terra, poco sotto
// il tronco o poco davanti.
const COLORI_FOGLIE = ["rgb(201 120 47)", "rgb(163 69 42)", "rgb(216 168 58)", "rgb(138 90 42)"];
function foglia(albero) {
  if (particelle.length >= MASSIMO) return;
  if (quanteParticelle("foglia") >= MASSIMO_FOGLIE) return;
  const w = albero.sprite?.width ?? TASSELLO;
  const h = albero.sprite?.height ?? TASSELLO * 1.5;
  particelle.push({
    tipo: "foglia",
    x: albero.x + 2 + caso() * (w - 4),
    y: albero.y + 1 + caso() * h * 0.55,
    vx: 0,
    vy: 7 + caso() * 5,
    eta: 0,
    vita: 30,
    fase: caso() * 6.283,
    terra: (albero.base ?? albero.y + h) - 3 + caso() * 9,
    colore: COLORI_FOGLIE[Math.floor(caso() * COLORI_FOGLIE.length)],
  });
}

// Le foglie prima del buio, come il fumo: di notte cadono al buio.
export function disegnaFoglie(p, camera) {
  if (!accesi) return;
  p.save();
  for (const s of particelle) {
    if (s.tipo !== "foglia") continue;
    const aTerra = s.y >= s.terra;
    p.globalAlpha = aTerra ? Math.max(0, Math.min(1, (s.vita - s.eta) / 1.8)) : 1;
    p.fillStyle = s.colore;
    // Girando, una foglia si vede ora di piatto e ora di taglio.
    const piatta = aTerra || Math.sin(s.eta * 7 + s.fase) > 0;
    p.fillRect(Math.round(s.x - camera.x), Math.round(s.y - camera.y), piatta ? 2 : 1, 1);
  }
  p.restore();
}

// Il fumo prima del buio: di notte si spegne con tutto il resto, e resta
// visibile solo dove c'è luce — com'è il fumo vero.
export function disegnaFumo(p, camera) {
  if (!accesi) return;
  p.save();
  for (const s of particelle) {
    if (s.tipo !== "fumo") continue;
    const k = s.eta / s.vita;
    const r = 1.5 + k * 4;
    p.globalAlpha = 0.22 * (1 - k) * Math.min(1, s.eta * 4);
    p.fillStyle = "rgb(150 146 140)";
    p.beginPath();
    p.arc(Math.round(s.x - camera.x), Math.round(s.y - camera.y), r, 0, Math.PI * 2);
    p.fill();
  }
  p.restore();
}

// Le scintille dopo il buio: brillano di luce loro.
export function disegnaScintille(p, camera) {
  if (!accesi) return;
  p.save();
  p.globalCompositeOperation = "lighter";
  for (const s of particelle) {
    if (s.tipo !== "scintilla") continue;
    const k = s.eta / s.vita;
    p.globalAlpha = (1 - k) * (0.6 + 0.4 * Math.sin(s.eta * 30 + s.fase));
    p.fillStyle = k < 0.4 ? "rgb(255 220 130)" : "rgb(255 130 50)";
    p.fillRect(Math.round(s.x - camera.x), Math.round(s.y - camera.y), 1, 1);
  }
  p.restore();
}

// --- l'acqua al sole ---------------------------------------------------------------

// Quanto sole batte sull'acqua: solo nelle ore centrali delle stagioni
// belle (M7.18.45). In primavera e d'estate, dalle dieci alle sedici, con
// mezz'ora per accendersi e mezz'ora per spegnersi; la mattina, la sera,
// d'autunno e d'inverno il sole è basso e l'acqua non abbaglia.
const STAGIONI_DEL_SOLE = new Set(["primavera", "estate"]);
export function soleSullAcqua(ora, stagione) {
  if (!STAGIONI_DEL_SOLE.has(stagione)) return 0;
  return Math.max(0, Math.min(1, ora - 9.5, 16.5 - ora));
}

// Dove luccica l'acqua adesso. Ogni tassello ha il suo giro di tre secondi e
// in quel giro, per mezzo secondo, forse luccica: un tassello su otto. Si
// chiede se è acqua solo a quelli, che sono pochi, e non a tutti quelli in
// vista a ogni fotogramma. Su uno specchio d'acqua che riempie la vista ne
// brillano quattro o cinque alla volta.
const GIRO_ACQUA = 3;
const LAMPO = 0.5;
const QUANTI_LUCCICANO = 0.12;
export function luccichii(q, secondi, { ora, stagione }, eAcqua) {
  const sole = soleSullAcqua(ora, stagione);
  if (!accesi || sole <= 0) return [];
  const trovati = [];
  const x0 = Math.floor(q.sinistra / TASSELLO), x1 = Math.floor((q.destra - 1) / TASSELLO);
  const y0 = Math.floor(q.sopra / TASSELLO), y1 = Math.floor((q.sotto - 1) / TASSELLO);
  for (let ty = y0; ty <= y1; ty += 1) {
    for (let tx = x0; tx <= x1; tx += 1) {
      const tempo = secondi / GIRO_ACQUA + impronta(tx, ty, 0x51a7);
      const giro = Math.floor(tempo);
      const dentro = (tempo - giro) * GIRO_ACQUA;
      if (dentro > LAMPO || impronta(tx, ty, giro) > QUANTI_LUCCICANO) continue;
      if (!eAcqua(tx, ty)) continue;
      trovati.push({
        x: tx * TASSELLO + 3 + Math.floor(impronta(tx, giro, 0x3c) * 10),
        y: ty * TASSELLO + 3 + Math.floor(impronta(giro, ty, 0x3d) * 10),
        forza: Math.sin((dentro / LAMPO) * Math.PI) * sole,
      });
    }
  }
  return trovati;
}

export function disegnaLuccichii(p, camera, secondi, stato, eAcqua) {
  if (!accesi) return;
  const lista = luccichii(vistaDi(camera), secondi, stato, eAcqua);
  if (lista.length === 0) return;
  p.save();
  p.fillStyle = "rgb(236 248 255)";
  for (const l of lista) {
    // Un trattino che si allunga e si accorcia col lampo, più chiaro al
    // centro, e al culmine una scintilla sopra: il riflesso del sole su
    // un'onda, non un pixel bianco.
    const x = Math.round(l.x - camera.x), y = Math.round(l.y - camera.y);
    const mezzo = l.forza > 0.6 ? 2 : 1;
    p.globalAlpha = 0.5 * l.forza;
    p.fillRect(x - mezzo, y, mezzo * 2 + 1, 1);
    p.globalAlpha = 0.95 * l.forza;
    p.fillRect(x, y, 1, 1);
    if (l.forza > 0.8) {
      p.globalAlpha = 0.6 * l.forza;
      p.fillRect(x, y - 1, 1, 1);
    }
  }
  p.restore();
}

// --- le lucciole -------------------------------------------------------------------

// Nelle notti d'estate, all'aperto e senza pioggia. Stanno su una maglia del
// mondo — una cella di tre tasselli su tre, e in una su sei c'è una lucciola
// (una su tre fino a M7.18.44: erano troppe) — così non spariscono e
// ricompaiono quando la vista si sposta: girano attorno al loro posto, e si
// accendono e spengono ognuna col suo ritmo.
const MAGLIA = 48;
const QUANTE_LUCCIOLE = 0.165;
export function lucciole(q, secondi, { stagione, luce, alChiuso = false, piove = false }) {
  if (!accesi || stagione !== "estate" || luce > 0.45 || alChiuso || piove) return [];
  const trovate = [];
  const buio = Math.min(1, (0.45 - luce) / 0.25);
  for (let cy = Math.floor(q.sopra / MAGLIA) - 1; cy <= Math.floor(q.sotto / MAGLIA) + 1; cy += 1) {
    for (let cx = Math.floor(q.sinistra / MAGLIA) - 1; cx <= Math.floor(q.destra / MAGLIA) + 1; cx += 1) {
      if (impronta(cx, cy, 0x1ecc) > QUANTE_LUCCIOLE) continue;
      const fase = impronta(cx, cy, 0x1ecd) * 6.283;
      const x = (cx + 0.5) * MAGLIA + Math.sin(secondi * 0.35 + fase) * 18 + Math.sin(secondi * 0.9 + fase * 2) * 5;
      const y = (cy + 0.5) * MAGLIA + Math.cos(secondi * 0.27 + fase) * 12 + Math.sin(secondi * 1.3 + fase) * 3;
      const accesa = Math.pow(Math.max(0, Math.sin(secondi * (0.9 + fase * 0.1) + fase)), 3);
      if (accesa < 0.05) continue;
      trovate.push({ x, y, forza: accesa * buio });
    }
  }
  return trovate;
}

export function disegnaLucciole(p, camera, secondi, stato) {
  const lista = lucciole(vistaDi(camera), secondi, stato);
  if (lista.length === 0) return;
  p.save();
  p.globalCompositeOperation = "lighter";
  for (const l of lista) {
    const x = Math.round(l.x - camera.x), y = Math.round(l.y - camera.y);
    const alone = p.createRadialGradient(x + 0.5, y + 0.5, 0, x + 0.5, y + 0.5, 4);
    alone.addColorStop(0, `rgb(200 255 120 / ${0.45 * l.forza})`);
    alone.addColorStop(1, "rgb(200 255 120 / 0)");
    p.fillStyle = alone;
    p.fillRect(x - 4, y - 4, 9, 9);
    p.globalAlpha = l.forza;
    p.fillStyle = "rgb(236 255 170)";
    p.fillRect(x, y, 1, 1);
    p.globalAlpha = 1;
  }
  p.restore();
}

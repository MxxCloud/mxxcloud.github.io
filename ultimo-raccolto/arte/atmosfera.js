// Precipitazioni leggere, senza immagini esterne e senza coprire la stanza.
import { LARGHEZZA, ALTEZZA, TASSELLO, inquadratura } from "../motore/schermo.js";

const modulo = (n, m) => ((n % m) + m) % m;
export function disegna(p, evento, secondi, stanza = null) {
  if (evento !== "pioggia" && evento !== "neve") return;
  const neve = evento === "neve", q = inquadratura();
  const coperti = new Set((stanza ?? []).map(t => `${t.tx},${t.ty}`));
  // Include le pareti e gli arredi solidi che delimitano il pavimento coperto.
  for (const t of stanza ?? []) for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])
    coperti.add(`${t.tx+dx},${t.ty+dy}`);
  p.save();
  p.fillStyle = neve ? "#e6eef1" : "#91b9cc";
  p.globalAlpha = neve ? 0.8 : 0.55;
  const n = neve ? 90 : 70;
  for (let i = 0; i < n; i++) {
    const x = Math.floor(modulo(i*79 + secondi*(neve?4:18) + (neve?Math.sin(secondi+i)*4:0) - q.sinistra, LARGHEZZA));
    const y = Math.floor(modulo(i*47 + secondi*(neve?15:110) - q.sopra, ALTEZZA));
    if (coperti.has(`${Math.floor((x+q.sinistra)/TASSELLO)},${Math.floor((y+q.sopra)/TASSELLO)}`)) continue;
    p.fillRect(x, y, neve && i%3===0 ? 2 : 1, neve ? 1 : 4);
  }
  p.restore();
}

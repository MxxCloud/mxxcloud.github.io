// Una cattura richiede tempo alla riva; nessun salto dell'orologio o pausa.
import * as mappa from "../mondo/mappa.js";
import * as modifiche from "../mondo/modifiche.js";
import { TERRENO, OGGETTO } from "../mondo/generazione.js";
import * as tempo from "./tempo.js";
import * as stagioni from "./stagioni.js";
import * as inventario from "./inventario.js";
import * as salute from "./salute.js";

export const ATTESA = 12;
export const PESCI_AL_GIORNO = 2;
let lenza = null;

export function impedimento(tx, ty) {
  const terreno = mappa.terrenoNaturaleDi(tx, ty);
  if (terreno !== TERRENO.ACQUA && terreno !== TERRENO.ACQUA_BASSA) return "serve una riva";
  if (mappa.oggettoDi(tx, ty) !== OGGETTO.NESSUNO) return "acqua ingombra";
  if (stagioni.stagioneCorrente() === "inverno") return "d'inverno i pesci non abboccano";
  const dati = modifiche.di(tx, ty);
  if (dati?.giornoPesca === tempo.giornoCorrente() && dati.pescati >= PESCI_AL_GIORNO) return "qui non abbocca più: torna domani";
  if (inventario.spazioPer("pesce_crudo") < 1) return "zaino pieno";
  return null;
}

export function inizia(eroe, tx, ty, indice) {
  const canna = inventario.attrezzo("canna", indice);
  if (!canna || inventario.usiRimasti(canna) === 0) return null;
  if (lenza || salute.eMorto() || inventario.quante("canna") < 1 || impedimento(tx, ty)) return null;
  lenza = { canna, tx, ty, px: eroe.px, py: eroe.py, guarda: eroe.guarda, trascorsi: 0, salute: salute.livelloCorrente() };
  return { tipo: "pesca" };
}

export function interrompi() { lenza = null; }
export function stato() { return lenza ? { ...lenza } : null; }

export function aggiorna(passo, eroe, cosaInMano, indice) {
  if (!lenza) return null;
  const l = lenza;
  const impedito = impedimento(l.tx, l.ty);
  if (inventario.attrezzo(cosaInMano, indice) !== l.canna || inventario.usiRimasti(l.canna) === 0 ||
      salute.eMorto() || cosaInMano !== "canna" || inventario.quante("canna") < 1 ||
      eroe.inMovimento || Math.hypot(eroe.px-l.px, eroe.py-l.py) > 0.1 || eroe.guarda !== l.guarda ||
      salute.livelloCorrente() < l.salute - 1e-9 || impedito) {
    interrompi();
    return { tipo: "pescaInterrotta", motivo: impedito ?? "pesca interrotta" };
  }
  l.salute = salute.livelloCorrente();
  l.trascorsi += Math.max(0, Number.isFinite(passo) ? passo : 0);
  if (l.trascorsi < ATTESA) return null;
  // La disponibilità si paga soltanto quando il pesce entra nello zaino.
  if (inventario.aggiungi("pesce_crudo", 1, tempo.giornoCorrente()) !== 0) {
    interrompi();return { tipo: "pescaInterrotta", motivo: "zaino pieno" };
  }
  const dati = modifiche.di(l.tx, l.ty) ?? {};
  mappa.annotaTassello(l.tx, l.ty, { ...dati, giornoPesca: tempo.giornoCorrente(),
    pescati: (dati.giornoPesca === tempo.giornoCorrente() ? dati.pescati ?? 0 : 0) + 1 });
  interrompi();
  return { tipo: "pescato", usura: inventario.usura(l.canna) };
}

// La campana della chiesa (M7.18.57).
//
// Si suona solo di notte e una volta per notte. Da quel momento, fino
// all'alba piena, ogni infetto che non ti vede e non ti sente va verso la
// chiesa invece di vagare — anche quelli che nascono dopo. È il modo di
// tenerli lontani da casa per una notte, e ha un prezzo detto prima: il
// colpo si sente da quaranta tasselli, e chi suona sta proprio lì. Bisogna
// correre.
//
// La notte è quella della luna (luna.notteDi): comincia la sera e finisce
// alle sette del mattino dopo. Va nel salvataggio, perché una partita
// ricaricata a mezzanotte deve avere ancora la campana suonata.
import * as luna from "./luna.js";
import * as schermo from "../motore/schermo.js";

export const CHIASSO = 40 * schermo.TASSELLO;

let suonata = null;

export function suona(x, y) {
  suonata = { notte: luna.notteDi(), x, y };
}

export function suonataStanotte() {
  return suonata !== null && suonata.notte === luna.notteDi();
}

// Dove vanno gli infetti adesso, o null se la campana tace.
export function richiamo() {
  return suonataStanotte() ? { x: suonata.x, y: suonata.y } : null;
}

export function stato() {
  return suonata ? { ...suonata } : null;
}

export function statoValido(s) {
  return s === null || (typeof s === "object" && Number.isInteger(s.notte) &&
    Number.isFinite(s.x) && Number.isFinite(s.y));
}

export function ripristina(s) {
  suonata = s && statoValido(s) ? { notte: s.notte, x: s.x, y: s.y } : null;
}

export function reimposta() {
  suonata = null;
}

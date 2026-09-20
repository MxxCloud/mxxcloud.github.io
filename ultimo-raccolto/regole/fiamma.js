// Quanto resta acceso quello che tieni in mano.
//
// Sta in un modulo suo e non dentro il ciclo di gioco per la ragione di
// sempre in questo progetto: una regola scritta in gioco.js è una regola che
// nessun collaudo può leggere, e il ritmo con cui brucia una torcia è
// esattamente il genere di numero che si sbaglia e non se ne accorge nessuno.
//
// Un uso ogni cinque secondi, sessanta usi: trecento secondi, cioè la stessa
// giornata che dura una torcia piantata per terra. La simmetria non è un vezzo
// — è la frase che spiega la regola senza doverla imparare: una torcia dura un
// giorno, che la tenga in mano o che la pianti.
import * as inventario from "./inventario.js";
import { CATALOGO } from "./oggetti.js";

export const SECONDI_PER_USO = 5;

// L'avanzo sotto i cinque secondi vive qui e non nel salvataggio: ricaricando
// si perde al massimo un secondo di fiamma, e non vale un campo in più da
// scrivere e da validare.
let avanzo = 0;
export function reimposta() { avanzo = 0; }
export const acceso = () => avanzo;

// Brucia solo quello che è acceso, cioè quello che fa luce E si consuma. In
// fondo allo zaino una torcia non è accesa: una scorta che cala senza essere
// usata sarebbe una tassa che il giocatore non può vedere.
export function avanza(passo, cosaInMano, indice) {
  const voce = CATALOGO[cosaInMano];
  if (!Number.isFinite(passo) || passo <= 0 || !voce?.luce || !voce?.durata) {
    avanzo = 0;
    return [];
  }
  avanzo += passo;
  const eventi = [];
  // Lo stesso epsilon della tolleranza degli animali, e per lo stesso motivo:
  // un sessantesimo sommato trecento volte fa 4,999999999999998, quindi senza
  // questa riga la torcia brucerebbe un fotogramma più tardi a sessanta
  // fotogrammi che a trenta. Un collaudo l'ha trovato prima di un giocatore.
  while (avanzo + 1e-9 >= SECONDI_PER_USO) {
    avanzo -= SECONDI_PER_USO;
    const fine = inventario.brucia(indice);
    if (!fine) { avanzo = 0; break; }
    if (fine.finita) {
      eventi.push(fine);
      if (!fine.ancora) { avanzo = 0; break; }
    }
  }
  return eventi;
}

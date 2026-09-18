// Un'unica cronologia per fotogrammi, sonno e assenze. Le soglie dei bisogni
// e la mezzanotte sono confini: il passato non usa le condizioni del futuro.
import * as tempo from "./tempo.js";
import * as bisogni from "./bisogni.js";
import * as salute from "./salute.js";
import * as orto from "./orto.js";
import * as decadimento from "./decadimento.js";
import * as ricrescita from "./ricrescita.js";

const vuoto = () => ({ cresciute: 0, appassite: 0, spenti: 0, guaste: 0, inScadenza: 0, tornati: 0 });
let eventi = vuoto();

export function resoconto() {
  const risultato = eventi;
  eventi = vuoto();
  return risultato;
}

export function avanza(secondi, { dorme = false, corre = false, siMuove = false, alFreddo = () => false } = {}) {
  if (!Number.isFinite(secondi) || secondi <= 0) return 0;
  const opzioni = { dorme, corre, siMuove };
  let trascorsi = 0;
  while (secondi > 1e-10 && !salute.eMorto()) {
    const giorno = tempo.giornoCorrente();
    const mezzanotte = (24 - tempo.oraCorrente()) * tempo.SECONDI_PER_GIORNO / 24;
    // Un secondo al massimo per valutare gelo e luci anche nelle assenze.
    const passo = Math.min(secondi, 1, Math.max(1e-9, mezzanotte), bisogni.secondiAlVuoto(opzioni));
    salute.avanza(passo, {
      vuoti: bisogni.vuoti().filter(v => !dorme || v !== "stanchezza"),
      alFreddo: !dorme && alFreddo(),
    });
    if (dorme) bisogni.passanoSecondi(passo);
    else bisogni.avanza(passo, { corre, siMuove });
    tempo.avanza(passo);
    trascorsi += passo;
    secondi -= passo;
    if (tempo.giornoCorrente() !== giorno) {
      const orti = orto.nuovoGiorno();
      const lasciato = decadimento.nuovoGiorno();
      eventi.cresciute += orti.cresciute;
      eventi.appassite += orti.appassite;
      eventi.spenti += lasciato.fuochi;
      eventi.guaste += lasciato.guaste;
      eventi.inScadenza = lasciato.inScadenza;
      eventi.tornati += ricrescita.nuovoGiorno();
    }
  }
  return trascorsi;
}

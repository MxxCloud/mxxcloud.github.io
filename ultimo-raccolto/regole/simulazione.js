// Un'unica cronologia per fotogrammi, sonno e assenze. Le soglie dei bisogni
// e la mezzanotte sono confini: il passato non usa le condizioni del futuro.
import * as riposo from "./riposo.js";
import * as meteo from "./meteo.js";
import * as addosso from "./addosso.js";
import * as tempo from "./tempo.js";
import * as bisogni from "./bisogni.js";
import * as salute from "./salute.js";
import * as orto from "./orto.js";
import * as decadimento from "./decadimento.js";
import * as ricrescita from "./ricrescita.js";

const vuoto = () => ({ cresciute: 0, appassite: 0, seccate: 0, assetate: 0, aSeme: 0, mangiate: 0, spenti: 0, guaste: 0, inScadenza: 0, tornati: 0, risvegliForzati: 0 });
let eventi = vuoto();

export function resoconto() {
  const risultato = eventi;
  eventi = vuoto();
  return risultato;
}

export function avanza(secondi, { eroe = null, dorme = false, corre = false, siMuove = false, alFreddo = () => false } = {}) {
  if (!Number.isFinite(secondi) || secondi <= 0) return 0;
  let trascorsi = 0;
  while (secondi > 1e-10 && !salute.eMorto()) {
    eventi.spenti += meteo.aggiornaMondo().spenti;
    const esaurito = bisogni.livello("stanchezza") === 0;
    const dormendo = dorme || riposo.secondiDiSonno() > 0;
    const confineRiposo = riposo.confine(esaurito, dorme);
    const opzioni = { dorme: dormendo, corre, siMuove };
    const giorno = tempo.giornoCorrente();
    const mezzanotte = (24 - tempo.oraCorrente()) * tempo.SECONDI_PER_GIORNO / 24;
    // Un secondo al massimo per valutare gelo e luci anche nelle assenze.
    const passo = Math.min(secondi, 1, confineRiposo, Math.max(1e-9, mezzanotte), bisogni.secondiAlVuoto(opzioni), meteo.secondiAlCambio(eroe));
    // Una pelliccia zuppa non scalda, ed è la regola che tiene insieme le due
    // scale: l'unico modo di rimetterla in funzione è asciugarsi, cioè un
    // fuoco. È il costo ricorrente della pelliccia, pagato in legna e visibile
    // nella barra del bagnato invece che in un contatore invisibile.
    //
    // Sta qui e non in addosso.js perché è una frase sul freddo, non sulla
    // pelliccia — e perché meteo deve poter chiedere ad addosso per la
    // pioggia: metterla là creerebbe un ciclo fra i due.
    const protetto = Boolean(addosso.dati()?.gradiniFermi) && !meteo.zuppo();
    // Il richiamo restituisce che freddo è, non se fa freddo: "gelo",
    // "bagnato" o niente (vedi freddo.js). Boolean() regge anche un richiamo
    // vecchio che rispondeva sì o no, e in quel caso mite resta falso — cioè
    // la regola severa, che è la risposta giusta quando non si sa.
    const che = alFreddo();
    salute.avanza(passo, {
      vuoti: bisogni.vuoti().filter(v => !dormendo || v !== "stanchezza"),
      alFreddo: Boolean(che),
      protetto,
      mite: che === "bagnato",
    });
    if (dormendo) bisogni.passanoSecondi(passo);
    else bisogni.avanza(passo, { corre, siMuove });
    if (riposo.avanza(passo, { esaurito, dorme, vivo: !salute.eMorto() })) {
      bisogni.ristora("stanchezza", 0.25);
      eventi.risvegliForzati++;
    }
    meteo.avanza(passo, eroe);
    tempo.avanza(passo);
    trascorsi += passo;
    secondi -= passo;
    if (tempo.giornoCorrente() !== giorno) {
      const orti = orto.nuovoGiorno();
      const lasciato = decadimento.nuovoGiorno();
      eventi.cresciute += orti.cresciute;
      eventi.appassite += orti.appassite;
      eventi.seccate += orti.seccate;
      eventi.aSeme += orti.aSeme;
      eventi.mangiate += orti.mangiate;
      // Come "in scadenza": è lo stato di stamattina, non una somma. Dopo
      // due notti d'assenza le assetate di ieri sono le seccate di oggi, e
      // contarle due volte direbbe un orto più grande di quello che c'è.
      eventi.assetate = orti.assetate;
      eventi.spenti += lasciato.fuochi;
      eventi.guaste += lasciato.guaste;
      eventi.inScadenza = lasciato.inScadenza;
      eventi.tornati += ricrescita.nuovoGiorno();
    }
  }
  return trascorsi;
}

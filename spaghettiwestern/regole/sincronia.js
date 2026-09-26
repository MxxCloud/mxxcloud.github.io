// La partita che segue chi gioca da un computer all'altro.
//
// Le caselle di salvataggio stanno nell'archivio del browser, quindi su un
// dispositivo solo; il file le fa attraversare quel confine a mano. Qui il
// confine si attraversa da solo.
//
// Il modello è quello della chiave, non quello dell'account: il gioco genera
// un codice casuale, e chi ha il codice ha la partita. Niente registrazione,
// niente password, niente indirizzo di posta — tre cose che in un gioco
// sarebbero tre modi di non cominciare a giocare. Il prezzo è dichiarato: il
// codice va tenuto come si tiene una chiave di casa.
//
// Il locale resta la verità. Questo modulo manda copie e sa riportarle
// indietro: una rete che non va, un servizio che chiude o una chiave
// sbagliata costano la sincronia e mai la partita.

import * as salvataggio from "./salvataggio.js";
import * as stagioni from "./stagioni.js";

// --- il progetto ----------------------------------------------------------

// Le due stringhe del progetto Firebase. Sono pubbliche per costruzione —
// stanno nel sorgente di qualunque sito che usi Firebase dal browser, e Google
// le documenta come non segrete: identificano il progetto, non autorizzano
// niente. Chi protegge i dati sono le regole di sicurezza del database, e
// dentro quelle regole il codice della partita.
//
// Per usare un progetto proprio si cambiano queste due righe e nient'altro.
//
// Spaghetti western usa lo stesso progetto di Ultimo raccolto: è il nome del
// database, non dell'indirizzo. Le partite non si mescolano lo stesso, perché
// ogni gioco genera e tiene i suoi codici nel suo angolo dell'archivio.
export const PROGETTO = {
  projectId: "ultimo-raccolto",
  // Finché è vuota la sincronia si spegne da sola e lo dice, invece di provare
  // a chiamare e fallire in un modo che sembra un guasto di rete.
  apiKey: "AIzaSyDYI5PLM1dKs21-sYZez6SSsQV1Gn7K3bo",
};

export function configurata() {
  return Boolean(PROGETTO.projectId && PROGETTO.apiKey);
}

const radice = () =>
  `https://firestore.googleapis.com/v1/projects/${PROGETTO.projectId}` +
  `/databases/(default)/documents/partite`;

// Quanto si aspetta una risposta prima di lasciar perdere. Tre secondi: oltre,
// chi sta giocando ha già capito che qualcosa non va, e il gioco non deve
// restare fermo ad aspettare una rete che non risponde.
const ATTESA = 3000;

// --- il codice ------------------------------------------------------------

// Alfabeto senza i caratteri che si confondono leggendoli da uno schermo e
// riscrivendoli a mano: niente O contro 0, niente I contro 1, niente lettera
// elle. Trentadue simboli, cinque bit ciascuno.
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const GRUPPI = 4;
const PER_GRUPPO = 4;

export function codiceNuovo() {
  const byte = new Uint8Array(GRUPPI * PER_GRUPPO);
  crypto.getRandomValues(byte);
  const lettere = [...byte].map((b) => ALFABETO[b % ALFABETO.length]);
  const gruppi = [];
  for (let g = 0; g < GRUPPI; g += 1) {
    gruppi.push(lettere.slice(g * PER_GRUPPO, (g + 1) * PER_GRUPPO).join(""));
  }
  return gruppi.join("-");
}

// Si accetta quello che il giocatore ha scritto anche se ha saltato i
// trattini o ha usato le minuscole: sono i due errori che fa chiunque
// ricopi sedici caratteri da uno schermo, e rifiutarli sarebbe pedanteria.
export function normalizza(scritto) {
  const pulito = (scritto ?? "")
    .toUpperCase()
    .split("")
    .filter((c) => ALFABETO.includes(c))
    .join("");
  if (pulito.length !== GRUPPI * PER_GRUPPO) return null;
  const gruppi = [];
  for (let g = 0; g < GRUPPI; g += 1) {
    gruppi.push(pulito.slice(g * PER_GRUPPO, (g + 1) * PER_GRUPPO));
  }
  return gruppi.join("-");
}

// --- il codice attivo -----------------------------------------------------

// Il codice sta nell'archivio del browser accanto alle caselle: è la cosa che
// lega questo dispositivo alla partita, e ricopiarlo a ogni avvio sarebbe
// esattamente la fatica che la sincronia serve a togliere.
const CHIAVE = "spaghettiwestern/sincronia";

export function codiceAttivo() {
  try {
    return globalThis.localStorage?.getItem(CHIAVE) || null;
  } catch {
    return null;
  }
}

export function attiva(codice) {
  try {
    globalThis.localStorage?.setItem(CHIAVE, codice);
    return true;
  } catch {
    return false;
  }
}

export function spegni() {
  try {
    globalThis.localStorage?.removeItem(CHIAVE);
    globalThis.localStorage?.removeItem(CHIAVE_VISTO);
  } catch {}
}

// --- non calpestare l'altro computer --------------------------------------

// Qui sta l'unica cosa davvero difficile della sincronia. Due computer con lo
// stesso codice scrivono nello stesso posto, e senza una guardia l'ultimo che
// scrive cancella l'altro — non "in teoria": basta accendere il gioco sul
// portatile, arrivare all'alba e il salvataggio automatico manda su una
// partita indietro di una settimana sopra quella buona.
//
// La guardia è il momento dell'ultima scrittura vista da questo dispositivo.
// Si manda solo se in rete c'è ancora quella, e a deciderlo è il database:
// una condizione mandata insieme alla scrittura, non un controllo fatto prima
// che lascerebbe aperta la fessura fra il controllo e la scrittura.
const CHIAVE_VISTO = "spaghettiwestern/sincronia-visto";

function vistoDi(codice) {
  try {
    const grezzo = globalThis.localStorage?.getItem(CHIAVE_VISTO);
    if (!grezzo) return null;
    const visto = JSON.parse(grezzo);
    return visto?.codice === codice ? visto.updateTime : null;
  } catch {
    return null;
  }
}

function ricordaVisto(codice, updateTime) {
  try {
    globalThis.localStorage?.setItem(CHIAVE_VISTO, JSON.stringify({ codice, updateTime }));
  } catch {}
}

// --- comprimere -----------------------------------------------------------

// Il salvataggio è JSON ripetitivo, quindi gzip lo riduce di sedici volte:
// centotrenta kilobyte diventano otto. Non serve a stare dentro un limite —
// ci si starebbe comunque — serve a non spedire centotrenta kilobyte ogni
// volta che qualcuno dorme, da una connessione che magari è quella del
// telefono.
//
// Compressione e base64 sono nel browser da anni: nessuna libreria.
async function comprimi(testo) {
  const flusso = new Blob([testo]).stream().pipeThrough(new CompressionStream("gzip"));
  const byte = new Uint8Array(await new Response(flusso).arrayBuffer());
  // A blocchi: String.fromCharCode con centomila argomenti in una volta
  // supera il limite degli argomenti di una chiamata e solleva.
  let binario = "";
  for (let i = 0; i < byte.length; i += 8192) {
    binario += String.fromCharCode(...byte.subarray(i, i + 8192));
  }
  return btoa(binario);
}

async function decomprimi(base64) {
  const binario = atob(base64);
  const byte = Uint8Array.from(binario, (c) => c.charCodeAt(0));
  const flusso = new Blob([byte]).stream().pipeThrough(new DecompressionStream("gzip"));
  return await new Response(flusso).text();
}

// --- mandare e prendere ---------------------------------------------------

// Ogni chiamata risponde con un esito e non solleva mai: il ciclo di gioco
// gira sessanta volte al secondo e non è il posto dove far esplodere una
// richiesta di rete.
async function chiama(indirizzo, opzioni = {}) {
  try {
    const risposta = await fetch(indirizzo, {
      ...opzioni,
      signal: AbortSignal.timeout(ATTESA),
    });
    return { risposta };
  } catch {
    return { risposta: null };
  }
}

// Con forza a vero la condizione non si manda e si sovrascrive comunque: è la
// via d'uscita quando il giocatore ha guardato le due partite e ha deciso lui
// quale tenere. Mai automatica.
export async function manda(stato, forza = false) {
  const codice = codiceAttivo();
  if (!codice) return { ok: false, perche: "sincronia spenta" };
  if (!configurata()) return { ok: false, perche: "sincronia non configurata" };

  let dati = null;
  try {
    dati = await comprimi(JSON.stringify(stato));
  } catch {
    return { ok: false, perche: "compressione non riuscita" };
  }

  // I campi accanto ai dati servono a far vedere cosa c'è nella nuvola senza
  // scaricarla: "giorno 19, inverno" dice se vale la pena riprenderla molto
  // meglio di una data.
  const corpo = {
    fields: {
      dati: { stringValue: dati },
      quando: { integerValue: String(Date.now()) },
      giorno: { integerValue: String(stato.giorno) },
      stagione: { stringValue: stagioni.stagioneDi(stato.giorno) },
      seme: { stringValue: stato.seme },
      versione: { integerValue: "1" },
    },
  };

  let indirizzo = `${radice()}/${codice}?key=${PROGETTO.apiKey}`;
  if (!forza) {
    const visto = vistoDi(codice);
    // Senza niente di visto si scrive solo se là non c'è ancora niente: è il
    // caso del codice appena creato, ed è anche il caso del codice di un altro
    // computer scritto a mano — dove rifiutare è esattamente quello che serve.
    indirizzo += visto
      ? `&currentDocument.updateTime=${encodeURIComponent(visto)}`
      : "&currentDocument.exists=false";
  }

  const { risposta } = await chiama(indirizzo, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });

  if (!risposta) return { ok: false, perche: "rete non raggiungibile" };
  // Il database rifiuta una condizione non rispettata con 400 o con 409, a
  // seconda del caso. Per chi gioca è una cosa sola: in rete c'è altro.
  if (risposta.status === 400 || risposta.status === 409) {
    return { ok: false, conflitto: true, perche: "in rete c'è un'altra partita" };
  }
  if (risposta.status === 403) return { ok: false, perche: "il database rifiuta" };
  if (!risposta.ok) return { ok: false, perche: `errore ${risposta.status}` };

  // Il momento della scrittura appena fatta diventa quello da rispettare la
  // volta dopo.
  try {
    const scritto = await risposta.json();
    if (scritto?.updateTime) ricordaVisto(codice, scritto.updateTime);
  } catch {}

  return { ok: true, byte: dati.length };
}

// Cosa c'è nella nuvola, senza tirarla giù nel gioco: serve a mostrarlo prima
// di sovrascrivere una partita in corso.
export async function sbircia() {
  const codice = codiceAttivo();
  if (!codice) return { ok: false, perche: "sincronia spenta" };
  if (!configurata()) return { ok: false, perche: "sincronia non configurata" };

  const { risposta } = await chiama(`${radice()}/${codice}?key=${PROGETTO.apiKey}`);
  if (!risposta) return { ok: false, perche: "rete non raggiungibile" };
  if (risposta.status === 404) return { ok: true, vuota: true };
  if (!risposta.ok) return { ok: false, perche: `errore ${risposta.status}` };

  let documento = null;
  try {
    documento = await risposta.json();
  } catch {
    return { ok: false, perche: "risposta illeggibile" };
  }
  const campi = documento?.fields;
  if (!campi?.dati?.stringValue) return { ok: true, vuota: true };

  return {
    ok: true,
    vuota: false,
    updateTime: documento.updateTime ?? null,
    giorno: Number(campi.giorno?.integerValue ?? 0),
    stagione: campi.stagione?.stringValue ?? "",
    seme: campi.seme?.stringValue ?? "",
    quando: Number(campi.quando?.integerValue ?? 0),
    dati: campi.dati.stringValue,
  };
}

// Il salvataggio vero, decompresso e validato. Separato da sbircia() perché
// decomprimere e controllare costano, e per disegnare una riga di elenco non
// servono.
export async function prendi() {
  const sbirciata = await sbircia();
  if (!sbirciata.ok) return sbirciata;
  if (sbirciata.vuota) return { ok: false, perche: "in rete non c'è niente" };

  let stato = null;
  try {
    stato = JSON.parse(await decomprimi(sbirciata.dati));
  } catch {
    return { ok: false, perche: "la partita in rete è illeggibile" };
  }
  if (!salvataggio.valido(stato)) {
    return { ok: false, perche: "la partita in rete è di un'altra versione" };
  }
  // Da adesso questo dispositivo ha visto quella scrittura, e può
  // sovrascriverla: riprendere è il modo legittimo di prendersi il turno.
  if (sbirciata.updateTime) ricordaVisto(codiceAttivo(), sbirciata.updateTime);
  return { ok: true, stato };
}

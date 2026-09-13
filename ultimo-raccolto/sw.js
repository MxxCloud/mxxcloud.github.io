// Service worker: tiene una copia del gioco per giocarci senza rete.
//
// La strategia è "prima la rete" (vedi il gestore fetch in fondo), quindi chi
// è online riceve comunque i file aggiornati: non è VERSIONE a farli arrivare.
// Va cambiata lo stesso a ogni pubblicazione, per due motivi diversi.
// Modificare questo file è ciò che fa accorgere il browser che esiste un nuovo
// service worker da installare, e il nome nuovo fa cancellare ad "activate" il
// deposito precedente, così non restano in giro copie morte.
//
// L'elenco qui sotto è generato dai file veri e non scritto a mano: un modulo
// dimenticato non darebbe errore online, e si scoprirebbe solo la prima volta
// che qualcuno prova a giocare in treno.

const VERSIONE = "ultimo-raccolto-v12";

const RISORSE = [
  "./",
  "./arte/sprite-cose.js",
  "./arte/sprite-impugnati.js",
  "./arte/sprite-indicatori.js",
  "./arte/sprite-oggetti.js",
  "./arte/sprite-orto.js",
  "./arte/sprite-personaggi.js",
  "./arte/sprite-terreno.js",
  "./arte/sprite-testo.js",
  "./arte/sprite-transizioni.js",
  "./arte/sprite.js",
  "./arte/tavolozza.js",
  "./arte/testo.js",
  "./entita/entita.js",
  "./entita/giocatore.js",
  "./gioco.js",
  "./icona-192.png",
  "./icona-512.png",
  "./index.html",
  "./interfaccia/hud.js",
  "./interfaccia/minimappa.js",
  "./manifest.webmanifest",
  "./mondo/generazione.js",
  "./mondo/mappa.js",
  "./mondo/modifiche.js",
  "./motore/casuale.js",
  "./motore/ciclo.js",
  "./motore/comandi.js",
  "./motore/oscurita.js",
  "./motore/scheggie.js",
  "./motore/schermo.js",
  "./regole/azioni.js",
  "./regole/bisogni.js",
  "./regole/inventario.js",
  "./regole/oggetti.js",
  "./regole/orto.js",
  "./regole/stagioni.js",
  "./regole/decadimento.js",
  "./regole/salvataggio.js",
  "./regole/sincronia.js",
  "./regole/ricette.js",
  "./regole/tempo.js",
  "./style.css",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(VERSIONE)
      // "reload" salta la cache HTTP: senza, si precaricherebbero copie vecchie.
      .then((deposito) =>
        deposito.addAll(RISORSE.map((r) => new Request(r, { cache: "reload" })))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomi) =>
        Promise.all(nomi.filter((nome) => nome !== VERSIONE).map((nome) => caches.delete(nome)))
      )
      .then(() => self.clients.claim())
  );
});

// Prima la rete, poi la copia locale: chi è online vede subito le versioni
// aggiornate, e restare bloccati su una copia vecchia diventa impossibile.
self.addEventListener("fetch", (evento) => {
  const richiesta = evento.request;
  if (richiesta.method !== "GET" || new URL(richiesta.url).origin !== self.location.origin) {
    return;
  }

  evento.respondWith(
    // Senza "no-cache" la richiesta verrebbe soddisfatta dalla cache HTTP del
    // browser: GitHub Pages dichiara max-age=600, quindi per dieci minuti la
    // rete non verrebbe mai interpellata e "prima la rete" sarebbe una bugia.
    fetch(richiesta.url, { cache: "no-cache", credentials: "same-origin" })
      .then((risposta) => {
        if (risposta.ok) {
          const copia = risposta.clone();
          caches.open(VERSIONE).then((deposito) => deposito.put(richiesta, copia));
        }
        return risposta;
      })
      .catch(async () => {
        const salvata = await caches.match(richiesta);
        if (salvata) return salvata;
        // Senza rete una navigazione qualsiasi deve comunque aprire il gioco.
        if (richiesta.mode === "navigate") return caches.match("./index.html");
        return Response.error();
      })
  );
});

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

const VERSIONE = "ultimo-raccolto-v88";

const RISORSE = [
  "./arte/luoghi.js",
  "./arte/sprite-luoghi.js",
  "./",
  "./arte/sprite-cose.js",
  "./arte/sprite-fauna.js",
  "./regole/fauna.js",
  "./regole/riposo.js",
  "./arte/sprite-fiori.js",
  "./arte/sprite-impugnati.js",
  "./arte/sprite-indicatori.js",
  "./arte/sprite-oggetti.js",
  "./arte/sprite-orto.js",
  "./arte/sprite-personaggi.js",
  "./arte/sprite-terreno.js",
  "./arte/sprite-testo.js",
  "./arte/sprite-transizioni.js",
  "./arte/sprite.js",
  "./arte/piante.js",
  "./arte/tavolozza.js",
  "./arte/testo.js",
  "./arte/voci.js",
  "./entita/entita.js",
  "./entita/giocatore.js",
  "./entita/infetto.js",
  "./entita/urti.js",
  "./gioco.js",
  "./icona-192.png",
  "./icona-512.png",
  "./index.html",
  "./interfaccia/hud.js",
  "./interfaccia/mappa.js",
  "./interfaccia/minimappa.js",
  "./interfaccia/tinte.js",
  "./manifest.webmanifest",
  "./mondo/generazione.js",
  "./mondo/mappa.js",
  "./mondo/modifiche.js",
  "./mondo/ostacoli.js",
  "./mondo/rovine.js",
  "./motore/casuale.js",
  "./motore/ciclo.js",
  "./motore/comandi.js",
  "./motore/oscurita.js",
  "./motore/scheggie.js",
  "./motore/schermo.js",
  "./motore/suono.js",
  "./regole/azioni.js",
  "./regole/bisogni.js",
  "./regole/chiasso.js",
  "./regole/colture.js",
  "./regole/contenitori.js",
  "./regole/decadimento.js",
  "./regole/esplorato.js",
  "./regole/addosso.js",
  "./regole/fiamma.js",
  "./regole/freddo.js",
  "./regole/infetti.js",
  "./regole/inventario.js",
  "./regole/oggetti.js",
  "./regole/orto.js",
  "./regole/ricette.js",
  "./regole/ricrescita.js",
  "./regole/riparo.js",
  "./regole/salute.js",
  "./regole/simulazione.js",
  "./regole/acqua.js",
  "./regole/pesca.js",
  "./regole/polli.js",
  "./regole/meteo.js",
  "./arte/atmosfera.js",
  "./regole/salvataggio.js",
  "./regole/sincronia.js",
  "./regole/stagioni.js",
  "./regole/tempo.js",
  "./regole/udito.js",
  "./style.css",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(VERSIONE)
      // "reload" salta la cache HTTP del browser, ma non quella di GitHub
      // Pages, che tiene ogni file dieci minuti per conto suo: subito dopo una
      // pubblicazione il deposito avrebbe preso gioco.js nuovo e un modulo
      // vecchio, la stessa miscela di M7.15.7. Con "?v=" e il nome del
      // deposito l'indirizzo non l'ha mai chiesto nessuno, quindi arriva
      // dall'origine. Per questo più sotto le copie si cercano anche a
      // prescindere dalla query.
      .then((deposito) =>
        deposito.addAll(RISORSE.map((r) => new Request(`${r}?v=${VERSIONE}`, { cache: "reload" })))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomi) =>
        Promise.all(nomi.filter((nome) => nome.startsWith("ultimo-raccolto-") && nome !== VERSIONE).map((nome) => caches.delete(nome)))
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
        // La pagina chiede i moduli con la sua versione (vedi index.html), il
        // deposito li ha precaricati con la propria: se la copia con
        // l'indirizzo esatto non c'è, va bene quella dello stesso file. Senza
        // questo secondo tentativo, offline non partirebbe niente.
        const salvata = (await caches.match(richiesta)) ?? (await caches.match(richiesta, { ignoreSearch: true }));
        if (salvata) return salvata;
        // Senza rete una navigazione qualsiasi deve comunque aprire il gioco.
        if (richiesta.mode === "navigate") return caches.match("./index.html", { ignoreSearch: true });
        return Response.error();
      })
  );
});

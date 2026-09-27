// Il gioco si è spostato a /Pugnodisemi/. Questo worker prende il posto di
// quello che teneva la copia offline qui: cancella le sue cache
// ("spaghettiwestern-…", non quelle "pugnodisemi-…" del nuovo indirizzo) e si
// toglie di mezzo, così il vecchio indirizzo non serve più il gioco vecchio.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomi) => Promise.all(nomi.filter((nome) => nome.startsWith("spaghettiwestern-")).map((nome) => caches.delete(nome))))
      .then(() => self.registration.unregister())
  );
});

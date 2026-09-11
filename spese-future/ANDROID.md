# Budget futuro come app Android (TWA)

L'app è già installabile da Chrome come PWA. Questo documento serve per il
passo successivo: impacchettarla in un APK firmato — una *Trusted Web Activity*,
cioè Chrome senza barra dell'indirizzo dentro un'app Android — come è già stato
fatto per Spese personali.

Il sito è pronto: manifesto completo con icone 192, 512 e maskable, tema,
`start_url` e `scope` dentro `/spese-future/`. Manca solo la firma, che richiede
una chiave privata: non sta nel repository e non deve starci.

## Valori da usare

| Campo | Valore |
|---|---|
| URL della PWA | `https://mxxcloud.github.io/spese-future/` |
| Manifesto | `https://mxxcloud.github.io/spese-future/manifest.webmanifest` |
| Host da verificare | `mxxcloud.github.io` |
| Package id | `io.github.mxxcloud.budget` |
| Nome dell'app | `Budget futuro` |
| Nome sotto l'icona | `Budget` |
| Colore del tema | `#41499b` |
| Colore di sfondo | `#f5f6f8` |
| Orientamento | verticale |

Il package id **deve** essere diverso da `io.github.mxxcloud.twa`, che è già
usato da Spese personali: due app con lo stesso id non convivono sul telefono.

## Strada A — PWABuilder (la più rapida, tutto dal browser)

1. Apri <https://www.pwabuilder.com> e inserisci
   `https://mxxcloud.github.io/spese-future/`.
2. *Package for stores* → **Android** → *Generate package*.
3. Compila con i valori della tabella qui sopra. Alla voce *Signing key*
   scegli **New** se non hai già una chiave per questa app.
4. Scarica lo zip. Dentro trovi:
   - `app-release-signed.apk` — da installare sul telefono;
   - `*.keystore` e `signing-key-info.txt` — **la chiave privata e le sue
     password**: conservale fuori dal repository, senza non potrai più
     pubblicare aggiornamenti della stessa app;
   - `assetlinks.json` — contiene l'impronta SHA-256 da riportare sul sito.

## Strada B — Bubblewrap (da riga di comando, sulla tua macchina)

Serve una JDK 17 o più recente; l'Android SDK se lo scarica da solo alla prima
esecuzione (per questo non si può fare da qui: `dl.google.com` è irraggiungibile
dalla sessione remota).

```
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://mxxcloud.github.io/spese-future/manifest.webmanifest
bubblewrap build
```

`init` fa le domande della tabella; a `--manifest` prende già nomi, colori e
icone. `build` produce `app-release-signed.apk` (per l'installazione diretta) e
`app-release-bundle.aab` (per il Play Store, se mai servisse).

Se preferisci creare la chiave a mano prima di `init`:

```
keytool -genkeypair -v -keystore budget-futuro.keystore \
  -alias budget -keyalg RSA -keysize 2048 -validity 10000
```

## L'impronta della chiave

Serve perché Android accetti di nascondere la barra dell'indirizzo: il sito deve
dichiarare che quella app è autorizzata a rappresentarlo.

```
keytool -list -v -keystore budget-futuro.keystore -alias budget
```

Copia la riga `SHA256:` (i trentadue byte separati da due punti). Con PWABuilder
la trovi già scritta in `signing-key-info.txt` e dentro l'`assetlinks.json` dello
zip.

## Il collegamento sul sito

`/.well-known/assetlinks.json` sta nella radice del dominio e accetta più
pacchetti: a quello di Spese personali va affiancato quello nuovo.

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "io.github.mxxcloud.twa",
      "sha256_cert_fingerprints": ["3C:34:…"]
    }
  },
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "io.github.mxxcloud.budget",
      "sha256_cert_fingerprints": ["QUI L'IMPRONTA NUOVA"]
    }
  }
]
```

Il file è pubblicato grazie a `.nojekyll` nella radice: senza, GitHub Pages
ignorerebbe le cartelle che iniziano con un punto.

La verifica avviene all'avvio dell'app e non è immediata: se hai appena
pubblicato il file, disinstalla e reinstalla l'APK, oppure svuota i dati di
Chrome, altrimenti resta in memoria l'esito negativo precedente.

## Installazione sul telefono

Copia l'APK sul dispositivo e aprilo dal gestore file: Android chiederà di
autorizzare l'installazione da quella app (*Installa app sconosciute*). Con il
cavo e gli strumenti Android: `adb install app-release-signed.apk`.

Se all'apertura compare una barra con l'indirizzo, la verifica non è passata:
controlla che l'impronta nel file corrisponda a quella della chiave con cui hai
firmato, e che `package_name` sia identico a quello dichiarato nell'APK.

## Cosa cambia rispetto alla PWA installata da Chrome

Dal punto di vista del contenuto, niente: è la stessa pagina, con lo stesso
service worker. È Chrome a eseguire la TWA, quindi l'archivio è quello che
Chrome tiene per questo indirizzo: le voci inserite nella PWA installata si
ritrovano nell'APK, e viceversa.

Cambia il contorno: l'app compare nell'elenco delle applicazioni con il proprio
nome e la propria icona, si può distribuire come file o sul Play Store, e — a
verifica riuscita — si apre senza la barra dell'indirizzo.

Per spostare i dati fra dispositivi diversi resta il backup: gli archivi dei
browser non si parlano fra telefono e computer.

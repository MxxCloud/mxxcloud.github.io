# Spese future

Pianificatore delle spese che devono ancora arrivare: una app web installabile
che funziona anche senza rete. Non ha server né dipendenze da installare — è
HTML, CSS e JavaScript, e i dati restano nel dispositivo di chi la usa.

È il rovescio del [tracker delle spese](https://mxxcloud.github.io/spese-personali/):
là si registra quello che è già stato speso, qui si programma quello che si
dovrà affrontare.

## Funzionalità

**Due viste.** Una barra in basso commuta fra *Anno* e *Mese*. *Anno* è il
calendario: dodici schede, una per mese, con il totale programmato, quante
spese sono e la ripartizione per categoria; toccarne una apre il mese. *Mese* è
il dettaglio: le spese del mese raggruppate per giorno, con inserimento,
modifica, clonazione e spostamento.

**Calendario annuale.** Il totale dell'anno, quanto è già stato pagato e quanto
resta da pagare, l'andamento dei dodici mesi come grafico a colonne, i totali
per categoria e le prossime cinque scadenze a partire da oggi. I mesi liberi si
vedono quanto quelli impegnati: servono a capire dove si può spostare una spesa.

**Clonare.** Una spesa si copia in un altro mese, o in tutti i mesi di un
intervallo — è il modo di programmare una rata che si ripete senza reinserirla
dodici volte. Si può clonare anche un mese intero dentro un altro. Le copie
nascono sempre da pagare.

**Spostare.** Una spesa si sposta in un altro mese conservando il giorno, quando
il mese di arrivo lo contiene: il 31 gennaio spostato a febbraio diventa il 28
(o il 29), perché il 31 febbraio non esiste. Si può spostare anche un mese
intero, per far slittare tutto un blocco di impegni.

**Stato di pagamento.** Ogni voce è «da pagare» finché non la si segna come
pagata. I filtri in cima al mese mostrano tutte le spese, solo quelle da pagare
o solo quelle pagate, e il riepilogo dell'anno tiene i due valori separati.
«Da affrontare» conta solo ciò che cade da oggi in avanti e non è ancora pagato.

**Categorie.** Si aggiungono, rinominano ed eliminano dal pannello "Gestisci
categorie". Rinominare una categoria aggiorna anche le spese collegate, mentre
eliminarne una ancora in uso viene impedito, così nessuna spesa resta senza
categoria. A ogni categoria è associato un colore, usato in modo coerente fra
elenco, calendario e grafici; i colori sono verificati perché restino
distinguibili anche a chi ha una carenza nella visione dei colori.

**Esportazione CSV.** Le spese dell'anno aperto, in due formati: uno per Excel
in locale italiana (separatore `;`, decimali a virgola, date `gg/mm/aaaa`) e uno
standard internazionale per LibreOffice, Fogli Google e strumenti di analisi.

**Backup e ripristino.** Un file JSON con l'intero archivio, che si riporta
dentro quando serve. Il ripristino sostituisce tutto il contenuto e rifiuta il
file se anche un solo record non è valido.

## Dove stanno i dati

Nell'archivio del browser (IndexedDB), sul singolo dispositivo. Non vengono
inviati da nessuna parte e nessuno oltre a chi usa il dispositivo può leggerli.

Questo ha due conseguenze:

- **Telefono e computer hanno archivi separati.** Non si sincronizzano: una
  spesa programmata sul telefono non compare sul computer.
- **Svuotare i dati del browser cancella tutto.** Il backup è l'unico modo per
  riaverli, ed è anche il modo per spostarli da un dispositivo all'altro.

L'archivio è indipendente da quello del tracker delle spese: le due app non si
leggono a vicenda.

## Uso locale

Non basta aprire `index.html` con un doppio clic: il browser blocca i moduli
JavaScript caricati da file locali. Serve un server statico qualsiasi, per
esempio:

```
python -m http.server 8001
```

Poi apri <http://127.0.0.1:8001/spese-future/>.

## Struttura

| File | Contenuto |
|---|---|
| `index.html` | struttura della pagina |
| `style.css` | aspetto, con tema chiaro e scuro |
| `dati.js` | archiviazione e regole di calcolo |
| `app.js` | interfaccia ed eventi |
| `sw.js` | copia locale per il funzionamento offline |
| `manifest.webmanifest` | dati per l'installazione |

Modificando i file dell'applicazione va aggiornata anche la costante `VERSIONE`
in `sw.js`. Non serve a far arrivare le modifiche — la strategia è «prima la
rete», quindi chi è online riceve comunque i file aggiornati — ma è ciò che fa
accorgere il browser che c'è un nuovo service worker da installare, e fa
cancellare il deposito della versione precedente invece di lasciarlo lì.

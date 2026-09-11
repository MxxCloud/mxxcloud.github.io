# Budget futuro

Pianificatore delle entrate e delle uscite che devono ancora arrivare: una app
web installabile che funziona anche senza rete. Non ha server né dipendenze da
installare — è HTML, CSS e JavaScript, e i dati restano nel dispositivo di chi
la usa.

L'indirizzo resta `/spese-future/`, com'era quando l'app trattava solo le
spese: cambiarlo romperebbe i collegamenti e le copie già installate. Per lo
stesso motivo non cambiano né il nome dell'archivio nel browser né il marchio
scritto dentro i file di backup.

È il rovescio del [tracker delle spese](https://mxxcloud.github.io/spese-personali/):
là si registra quello che è già stato speso, qui si programma quello che deve
ancora succedere, da entrambe le parti del conto.

## Funzionalità

**Tre viste.** Una barra in basso commuta fra *Anno*, *Mese* e *Periodo*.
*Anno* è il calendario: dodici schede, una per mese, con il saldo, quante voci
sono e due barre — entrate e uscite — sulla stessa scala; toccarne una apre il
mese. *Mese* è il dettaglio, con inserimento, modifica, clonazione e
spostamento. *Periodo* è l'elenco completo fra due date qualsiasi, raggruppato
per mese.

**Entrate e uscite.** Ogni voce è un'uscita da pagare o un'entrata da
incassare; il tipo si sceglie all'inserimento e decide quali categorie
compaiono, perché «Stipendio» fra le spese non vorrebbe dire nulla. Totali e
saldo sono sempre separati per verso: entrate, uscite e differenza.

**Stato.** Ogni voce resta «da saldare» finché non la si segna come pagata o
incassata. I filtri mostrano tutto, solo ciò che manca o solo ciò che è già
stato saldato, sia nel mese sia nel periodo; i riepiloghi tengono i due valori
distinti, così «quanto devo ancora incassare» e «quanto devo ancora pagare»
sono due numeri che si leggono a colpo d'occhio.

**Calendario annuale.** Saldo dell'anno, entrate e uscite totali, quanto resta
da incassare e da pagare, il saldo mese per mese come grafico a colonne con la
linea dello zero, i totali per categoria — separati fra uscite ed entrate — e
le prossime cinque scadenze a partire da oggi. I mesi liberi si vedono quanto
quelli impegnati: servono a capire dove si può spostare una voce.

**Periodo.** Un intervallo scelto a mano oppure con le scorciatoie (questo
mese, quest'anno, prossimi dodici mesi, tutto), filtrabile per tipo, stato e
testo della descrizione. Mostra saldo del periodo, quanto c'è da incassare e da
pagare, quanto è già saldato, e l'elenco di tutte le voci raggruppate per mese
con il saldo di ciascuno.

**Clonare.** Una voce si copia in un altro mese, o in tutti i mesi di un
intervallo — è il modo di programmare uno stipendio o una rata che si ripete
senza reinserirli dodici volte. Si può clonare anche un mese intero dentro un
altro. Le copie nascono sempre da saldare.

**Spostare.** Una voce si sposta in un altro mese conservando il giorno, quando
il mese di arrivo lo contiene: il 31 gennaio spostato a febbraio diventa il 28
(o il 29), perché il 31 febbraio non esiste. Si può spostare anche un mese
intero, per far slittare tutto un blocco.

**Categorie.** Elenchi separati per uscite ed entrate, da aggiungere,
rinominare ed eliminare nel pannello "Gestisci categorie". Rinominare una
categoria aggiorna anche le voci collegate, mentre eliminarne una ancora in uso
viene impedito, così nessuna voce resta senza categoria. A ogni categoria è
associato un colore, usato in modo coerente fra elenco, calendario e grafici; i
colori sono verificati perché restino distinguibili anche a chi ha una carenza
nella visione dei colori.

**Tema.** Il pannello "Aspetto" sceglie fra chiaro, scuro e «Sistema», che
segue il tema del dispositivo e cambia con lui. La scelta resta su quel
dispositivo e viene applicata prima che la pagina si disegni, così all'apertura
non si vede un lampo del tema sbagliato.

**Esportazione CSV.** Le voci della selezione corrente nella vista *Periodo*,
in due formati: uno per Excel in locale italiana (separatore `;`, decimali a
virgola, date `gg/mm/aaaa`) e uno standard internazionale per LibreOffice,
Fogli Google e strumenti di analisi.

**Backup e ripristino.** Un file JSON con l'intero archivio, che si riporta
dentro quando serve. Il ripristino sostituisce tutto il contenuto e rifiuta il
file se anche un solo record non è valido. I backup scritti dalla prima
versione, quando esistevano solo le uscite, restano leggibili: le voci
diventano uscite e lo stato «pagata» diventa «saldata».

## Dove stanno i dati

Nell'archivio del browser (IndexedDB), sul singolo dispositivo. Non vengono
inviati da nessuna parte e nessuno oltre a chi usa il dispositivo può leggerli.

Questo ha due conseguenze:

- **Telefono e computer hanno archivi separati.** Non si sincronizzano: una
  voce programmata sul telefono non compare sul computer.
- **Svuotare i dati del browser cancella tutto.** Il backup è l'unico modo per
  riaverli, ed è anche il modo per spostarli da un dispositivo all'altro.

L'archivio è indipendente da quello del tracker delle spese: le due app non si
leggono a vicenda. Chi aveva già usato la app prima delle entrate non deve fare
nulla: all'apertura le voci esistenti diventano uscite e lo stato «pagata»
diventa «saldata», una volta sola.

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

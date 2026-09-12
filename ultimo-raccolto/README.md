# Ultimo raccolto

Survival in pixel art ambientato in una valle rurale dopo il collasso. Una
fattoria in rovina da rimettere in piedi, un paese abbandonato da saccheggiare,
e una notte che non è un effetto scenico.

Come le altre applicazioni di questo sito non ha server né dipendenze: è HTML,
CSS e JavaScript serviti così come sono. Nessuna compilazione, niente da
installare.

L'indirizzo è `/ultimo-raccolto/` e non cambierà: rinominarlo romperebbe i
collegamenti e, quando arriveranno i salvataggi, le partite già cominciate.

## L'idea

Il gioco sta a metà strada fra tre cose che tirano in direzioni opposte. *Stardew
Valley* presuppone che non si perda mai niente; *Don't Starve* che ricominciare
sia il gioco; *Project Zomboid* che la propria morte sia una storia. Tenerle
insieme richiede un principio, ed è questo:

> **Il posto è tuo, ma il mondo se lo riprende.**

Si coltiva e si costruisce, ma il campo si secca, il tetto marcisce, l'inverno
arriva e il corpo è un sistema che si degrada e si può spezzare per sempre. Non
è un survival accogliente: è cura contro entropia.

Quando si muore, muore il personaggio e non il mondo. La fattoria, le
costruzioni e il cadavere con tutto quello che portava addosso restano dov'erano,
e si riparte con un nuovo superstite nella stessa valle. Perdere fa male senza
cancellare il lavoro di ore, e recuperare la propria roba dal proprio cadavere è
una delle cose che si andranno a fare.

## A che punto è

È finita **M0**: il motore e una valle esplorabile a piedi. Ci si muove, la
valle si genera dal seme, alberi e sassi fermano, l'acqua ferma. Non c'è ancora
niente da raccogliere, nessun bisogno da soddisfare e nessuno da incontrare.

I terreni non si toccano più di netto: il più forte invade il bordo del vicino
con una frangia irregolare, così il confine fra roccia e prato non è più una
scalinata da sedici pixel.

Le tappe successive, nell'ordine: mondo completo con raccolta, inventario e
ciclo giorno/notte (M1); bisogni, ferite, salvataggio e morte (M2) — da lì il
gioco esiste come esperienza; coltivazione e stagioni (M3); infetti, rumore e
combattimento (M4); costruzione e decadimento (M5); superstiti, abilità e
rifinitura (M6).

## Comandi

| | |
|---|---|
| `W A S D` o frecce | camminare |
| `Maiusc` | correre |
| `Spazio` | usare (non fa ancora nulla) |
| `F3` | diagnostica |

I comandi su schermo per il telefono arrivano più avanti, ma il gioco non parla
mai di tasti: chiede a `motore/comandi.js` se si sta andando avanti. È l'unico
file da toccare quel giorno.

## L'indirizzo accetta due parametri

`?seme=ombra` apre una valle diversa. Il seme è un testo qualsiasi e la stessa
parola dà sempre la stessa valle, quindi una valle che piace si condivide
copiando l'indirizzo. `?diagnostica` accende il pannello dei numeri.

## Com'è fatto

Le dipendenze vanno in una sola direzione, e non si invertono mai:

```
arte/  motore/          non sanno nulla del gioco
   ↑
mondo/  entita/         conoscono il motore, non l'interfaccia
   ↑
gioco.js                orchestra, possiede il DOM
```

**`arte/`** — La tavolozza e gli sprite. Uno sprite è un array di stringhe, una
per riga di pixel, un carattere per colore: si legge a occhio, si modifica in un
editor di testo e in git il diff mostra quali righe di pixel sono cambiate.
`sprite.js` li cuoce una volta sola in canvas fuori schermo, perché disegnare
pixel per pixel a ogni fotogramma costerebbe quanto tutto il resto del gioco.
La tavolozza è un parametro e non una costante: lo stesso sprite cotto con
tavolozze diverse darà le stagioni senza ridisegnare niente.

Le transizioni fra terreni sono **maschere**: stessa notazione, ma "x" vuol
dire «qui prendi il pixel del vicino». Una maschera è pura forma e non sa nulla
di colore, ed è per questo che ne bastano otto per tutte le coppie di terreni
invece di servirne una per combinazione. A mano ne esistono solo due — il lato
nord e l'angolo nord-ovest — e le altre sei si ottengono ruotandole.

**`motore/`** — Lo schermo lavora a 384x216 pixel fissi e non sa quanto sia
grande la finestra; la scala è sempre un numero intero, anche a costo di due
bande nere, perché una scala frazionaria fa alcune righe di pixel più spesse
delle altre. Il ciclo aggiorna a passo fisso e disegna quando capita, senza
interpolare: con la camera arrotondata al pixel, interpolare darebbe tremolio e
non fluidità. `casuale.js` è un generatore seminato più un rumore di valore
scritto a mano — nel gioco non esiste `Math.random`.

**`mondo/`** — La valle non viene creata, viene calcolata: ogni tassello è una
funzione pura delle sue coordinate e del seme, quindi non ci sono confini e non
c'è niente da generare in anticipo. È anche ciò che renderà piccoli i
salvataggi, perché basterà memorizzare i tasselli cambiati. `mappa.js` cuoce il
terreno a settori di 16x16 tasselli e ridisegna solo quelli inquadrati.

Per sfrangiare un tassello bisogna sapere cosa ha attorno, quindi ogni settore
si legge con un tassello di bordo per lato: senza, la frangia si
interromperebbe ogni sedici tasselli e disegnerebbe la griglia dei settori. E
poiché cuocere un settore ora costa qualche millisecondo, i settori appena
fuori dall'inquadratura vengono preparati in anticipo, uno per fotogramma: il
costo non sparisce, ma smette di cadere tutto nel fotogramma in cui si varca un
confine.

**`entita/`** — Oggetti semplici con un campo `tipo` e una funzione registrata
per quel tipo. Niente sistema a componenti: le entità resteranno nell'ordine
delle centinaia e i comportamenti distinti sono pochi.

Entità e oggetti della mappa espongono la stessa forma — `x`, `y`, `base`,
`sprite` — così chi disegna li ordina tutti insieme per la posizione dei piedi,
senza sapere chi è un albero e chi un superstite. È tutta la profondità che
serve a una vista dall'alto 3/4.

## Provarlo in locale

I moduli ES non funzionano aprendo il file con un doppio clic: serve un server.

```sh
cd mxxcloud.github.io
python3 -m http.server 8001
```

Poi `http://127.0.0.1:8001/ultimo-raccolto/`.

## Le soglie del terreno sono misurate, non scelte

Le costanti in `mondo/generazione.js` che decidono dove finisce l'acqua e dove
comincia la roccia vengono dai percentili del rumore, misurati su quattro semi
diversi. Cambiando la scala o il numero di ottave la distribuzione si sposta e
vanno rimisurate, altrimenti una valle diventa un oceano. Le scale sono tarate
sull'inquadratura: lo schermo mostra 24 tasselli, e una collina larga 22 si
attraversa in uno schermo scarso — con scale molto più grandi il paesaggio non
cambiava mai mentre si camminava.

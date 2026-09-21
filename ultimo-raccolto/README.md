# Ultimo raccolto

Survival in pixel art ambientato in una valle rurale dopo il collasso. Una
fattoria in rovina da rimettere in piedi, un paese abbandonato da saccheggiare,
e una notte che non è un effetto scenico.

Come le altre applicazioni di questo sito non ha server né dipendenze: è HTML,
CSS e JavaScript serviti così come sono. Nessuna compilazione, niente da
installare.

L'indirizzo è `/ultimo-raccolto/` e non cambierà: rinominarlo romperebbe i
collegamenti e le partite già salvate, che stanno nell'archivio del browser
sotto quell'indirizzo.

## M7.12.3 — a ogni stagione la sua bestia

M7.12.1 ha insegnato alla caccia **quante** bestie ci sono e **quanto** rendono.
Restava fuori la domanda più semplice: **quali**. La scala era fissa tutto
l'anno — 35 cervo, 30 cavallo, 25 bufalo, 10 orso — a gennaio come a luglio.

Adesso la stagione decide anche chi incontri. I pesi stanno nella stessa
tabella di `massimi`, `intervallo` e `resa`, perché *cosa fa questo mese alla
caccia* deve leggersi in un posto solo:

| | Estate | Autunno | Inverno | Primavera |
| --- | --- | --- | --- | --- |
| Cervo | 33 | 28 | 20 | **40** |
| Cavallo | 27 | 17 | 15 | **30** |
| Bufalo | 25 | **40** | 25 | 15 |
| Orso | 15 | 15 | **40** | 15 |

**L'autunno è la caccia grossa**: il bufalo sale a quaranta prima del freddo, e
si somma alla stagione che arriva già più fitta (una bestia ogni 32 secondi).
È il mese in cui si fa scorta, e adesso ha una ragione sua per esserlo.

**L'inverno moltiplica l'orso e lascia stare il bufalo.** I venticinque punti
che l'orso guadagna arrivano tutti da cervo e cavallo: la stagione dirada le
bestie piccole e schive, e quello che resta o è grosso o è cattivo. Non è un
mese con meno da mangiare — a quello pensano già il tetto a una bestia e la
resa a sei decimi — è un mese **in cui quello che trovi ti guarda male**.

**La primavera è la valle che riparte**: cervo e cavallo per sette incontri su
dieci, cioè prede facili e poca resa.

Il conto, per bestia incontrata:

| | Estate | Autunno | Inverno | Primavera |
| --- | --- | --- | --- | --- |
| Carne | 3,78 | **4,33** | 4,40, cioè **2,64** con la resa invernale | 3,45 |
| Pelli | 1,80 | 2,10 | **2,30** | 1,60 |
| Probabilità che attacchi | 0,40 | 0,47 | **0,61** | 0,37 |

Due cose che questi numeri dicono e che vale la pena scrivere. La prima: **non
disfa M7.12.1.** D'inverno la bestia grezza vale di più di ogni altro mese,
perché orso e bufalo pesano — ma la resa a sei decimi la riporta a 2,64, il
minimo dell'anno, e resta una bestia sola ogni novantacinque secondi. La
seconda: **d'inverno le pelli salgono**, ed è coerente con la scelta di
M7.12.1 di lasciarle piene — la stagione per cui esiste la pelliccia è anche
quella che ne dà di più, se si ha il fegato di andarsele a prendere.

L'orso passa da dieci a quindici anche negli altri tre mesi: non è solo
l'inverno a farsi più pericoloso, è tutto l'anno.

## M7.12.2 — la pioggia si può attraversare

Misurato, e la misura è il motivo di questa tappa: **fermi in un prato, in
pieno giorno, senza aver fatto niente di sbagliato — zuppi in 10 secondi,
morti in 101.** La catena era chiusa a chiave: non si poteva accendere un falò
(impedito dalla pioggia, e comunque la pioggia spegne i fuochi scoperti), la
torcia non scalda da M7.11.1, e asciugarsi all'aperto è otto volte più lento
di quanto la pioggia bagni. L'unica risposta era una stanza chiusa già
costruita, cioè una risposta che sta a casa mentre la pioggia ti prende dove
sei.

Il difetto sotto: **il bagnato era entrato nella macchina del gelo invernale
senza portarsi dietro una via d'uscita propria.** La notte d'inverno ha due
risposte che ti costruisci e che *scegli* di affrontare; la pioggia ti capita
addosso, una volta a stagione, ovunque tu sia.

**Gli alberi riparano.** Due alberi fra gli otto vicini — un albero solo in
mezzo a un prato non è un riparo, una macchia sì — e la pioggia prende un
quarto: **fradici in 80 secondi invece che in 20**. Misurato attorno alla
fattoria: la macchia più vicina sta a tre tasselli, e il 16,6% della valle
calpestabile ripara. Non è un tetto e non deve esserlo: dentro una stanza la
pioggia si ferma, sotto gli alberi rallenta, e resta un motivo per costruirsi
una casa.

**Sotto la chioma il falò si accende, e non si spegne.** È la seconda metà del
riparo debole: senza, gli alberi rallentavano l'acqua e non davano niente da
fare. Con, il viaggiatore ha il suo ciclo — ti infili nella macchia, accendi,
ti asciughi — e un fuoco asciuga più in fretta di quanto la chioma lasci
passare.

**E il bagnato è un freddo suo.** Morde **a metà** e **non sale mai di
gradino**, e comincia **solo da fradici** e non da zuppi: fra i dieci secondi
in cui ti bagni e i venti in cui sei fradicio c'è il tempo di accorgertene e di
andare da qualche parte. Il gelo — notte d'inverno, nevicata — resta quello di
prima, perché quello lo scegli.

Una giornata intera di pioggia, dalla mezzanotte alla mezzanotte:

| | fradicio | salute peggiore |
| --- | --- | --- |
| all'aperto | 20 s | **0,39 — vivo** |
| sotto la chioma | 81 s | 0,52 |
| sotto la chioma, con un falò | **mai** | **1,00** |
| con un falò ma allo scoperto | 20 s | 0,39 — la pioggia lo spegne |

Restare sotto l'acqua costa ancora più di mezza salute, e la guarigione è
lenta: la pioggia si paga per giorni. Ma non uccide più chi la prende lontano
da casa, e adesso c'è qualcosa da fare mentre cade.

Il pannello lo dice in tre stati invece di due, perché adesso vogliono dire tre
cose diverse: **bagnato** non costa niente, **zuppo** è l'avviso che manca
poco, **fradicio** è il punto da cui la salute cala.

## M7.12.1 — la caccia impara che stagione è

Tre correzioni alla caccia, e la prima è quella che conta.

**La fauna non sapeva che stagione fosse.** D'inverno i pesci non abboccano
(M7.6), l'orto non cresce e i cespugli danno l'undici per cento (M6.5): tre
tappe costruite apposta perché l'inverno fosse l'esame. Le bestie arrivavano
identiche a luglio, e il conto diceva il resto — una giornata costa **0,556
barre** di fame, **una intera d'inverno**, e un bufalo arrostito ne rende
**2,7**. Con due bestie sempre a un passo dallo schermo, **la stagione più dura
era quella in cui si mangiava meglio**.

Adesso l'autunno è la stagione della caccia grossa e l'inverno è il magro:

| | bestie intorno | un arrivo ogni | carne |
| --- | --- | --- | --- |
| Estate, primavera | 2 | 40 s | piena |
| **Autunno** | 2 | **32 s** | piena |
| **Inverno** | **1** | **95 s** | **sei decimi** |

D'inverno sono **meno e magre**, e servivano tutt'e due: diradare porta la
giornata di caccia da sette bestie a quattro, che sono ancora quasi otto
giornate di cibo — perché il tetto non è mai stato il vincolo, lo è quanto
rende una bestia. Con la resa a sei decimi una giornata passata a cacciare
copre l'inverno e non il mese: **la caccia resta la risposta al freddo, smette
di essere la risposta a tutto**. Le pelli no, quelle restano: una pelle è una
pelle anche su una bestia magra, e toglierle d'inverno vorrebbe dire rendere
più cara la pelliccia proprio nella stagione per cui esiste. Conta il giorno in
cui la bestia è caduta, non quello in cui la macelli.

**Il cavallo era il pasto migliore e il più sicuro insieme** — quattro carni,
due pelli, danno zero, mai aggressivo — cioè il rischio e la ricompensa
ordinati al contrario: conveniva lasciar perdere il cervo, che rende meno e può
caricarti. Adesso ti vede da **cento pixel** e scappa a **88**, che si prende
solo correndo, e correre costa fiato. Quello che ne esce sono **due carni e una
pelle**: un pasto, non una scorta.

**E le bestie si sentono.** La valle aveva i passi degli infetti, il loro
respiro a trecentottanta pixel e il crepitio del fuoco; un bufalo da mezza
tonnellata camminava in silenzio, e l'orso — che attacca sempre appena ti vede
entro quattro tasselli — arrivava senza che niente lo annunciasse. Una voce
sola per quattro specie, come `colpoDi()` è una voce sola per quattro
materiali: cambia il tono, che sta accanto alle altre misure della specie —
l'orso cupo a 0,62, il cervo sottile a 1,25. Calma, una bestia si sente da
**300 pixel** e ogni nove-diciotto secondi: è l'ambiente. Inquieta, si sente da
**380** e ogni due-quattro secondi, **e il primo verso arriva nell'istante in
cui si accorge di te**: quello non è ambiente, è il momento di decidere se
restare.

## M7.12 — la pelliccia addosso

Le pelli servivano a una cosa sola, il giaciglio. Adesso diventano qualcosa che
si porta, e l'inverno si attraversa invece di aspettarlo.

**Pelle e pelliccia sono due cose**, e non per vocabolario. La pelle è già una
valuta — tre vanno nel giaciglio — e indossarla grezza vorrebbe dire risolvere
l'inverno con **un cervo**, cioè meno di quanto costasse la torcia a cui M7.11.1
ha appena tolto il calore. Qui vale la grammatica di tutto il resto del gioco:
niente si usa grezzo. La pietra diventa muro, la pelle diventa pelliccia.

La **pelliccia** si cuce al banco con **4 pelli e 3 fibre** — due animali
grossi, o un bufalo più un cervo.

**Nasce l'addosso.** Una cosa per volta, fuori dalle otto caselle, in una
casella sua staccata a destra della barra. Si indossa con **`E`**, che significa
già *usa quello che hai in mano su di te*: mangiare, fasciarsi, vestirsi sono lo
stesso gesto. E siccome quello che hai addosso non sta in nessuna casella —
quindi non lo si può selezionare — **`E` a mani vuote lo toglie**. Non c'è un
tasto nuovo da imparare: quel significato era l'unico ancora libero.

**La pelliccia non dà immunità**, e non poteva darla: sarebbe stata la torcia
un'altra volta con più passaggi. Fa una cosa sola — **il freddo smette di
peggiorare col tempo**. Il gelo moltiplica per due dopo quindici secondi e per
tre dopo trenta; con la pelliccia resta a uno dal primo secondo all'ultimo.

| | si muore dopo | una notte invernale intera all'aperto |
| --- | --- | --- |
| Senza | 90 secondi | uccide |
| Con la pelliccia | **225 secondi** | **costa il 56% della salute** |

Si arriva dall'altra parte, e ci si arriva conciati: la guarigione è lenta di
proposito, quindi una notte passata fuori si paga per un giorno e due terzi.
L'esposizione continua ad accumularsi anche protetti — chi si spoglia dopo due
minuti trova i gradini già saliti, perché il contatore misura quanto sei stato
al freddo, non quanto ti è costato.

**Ci si bagna più lentamente**: sotto la pioggia si diventa zuppi in diciotto
secondi invece di dieci, che è la distanza da cui l'accampamento è ancora
raggiungibile. Ma **una pelliccia zuppa non scalda**, ed è la regola che tiene
insieme le due cose: l'unico modo di rimetterla in funzione è asciugarsi, cioè
un fuoco. È il costo ricorrente della pelliccia, pagato in legna e visibile
nella barra del bagnato invece che in un contatore invisibile.

**Non si consuma.** L'usura di questo gioco conta gesti, e una pelliccia si
logora col tempo: costruire una seconda usura per un oggetto solo chiederebbe un
campo nel salvataggio, un indicatore nell'HUD e una ricetta di riparazione. Il
costo sta nella costruzione — e l'entropia c'è già, perché **si muore, e quello
che avevi addosso resta sul cadavere**, lontano da casa e d'inverno.

I vecchi salvataggi si riaprono a torso nudo, che è la cosa giusta: sono stati
scritti in un gioco in cui non ci si vestiva.

## M7.11.1 — la luce non è il calore, e la valle non è un paese

Tre correzioni, due alla tappa dei piccoli luoghi e una che paga un debito
vecchio quanto il freddo.

**La torcia illumina e si consuma, ma non scalda.** Fin qui luce e calore erano
lo stesso campo, quindi una torcia scaldava per sbaglio — in pugno *e* piantata
per terra. Era l'unico buco nel freddo, e non era piccolo: la torcia costa un
ramo e due fibre, non si consumava, e tenerla in mano annullava notte
invernale, nevicata ed essere zuppi. Per sempre e gratis. Adesso scalda solo il
fuoco vero: un **falò** entro tre tasselli, o una stanza chiusa che ne contiene
uno. Il progetto se n'era già accorto a metà — il riposo passava apposta "niente
in mano" al calcolo del gelo, e c'era un collaudo che diceva *"la torcia in mano
non sostituisce il falò nel riposo"*. Adesso vale anche per chi sta in piedi.

E la torcia **si consuma mentre è accesa**: sessanta usi, uno ogni cinque
secondi, cioè **trecento secondi** — la stessa giornata che dura una torcia
piantata. Nello zaino non brucia, perché lì non è accesa. La barra sotto
l'icona misura la torcia accesa, il numero dice quante ne restano: finita
quella in mano ne comincia un'altra della pila, e quando la pila finisce la
casella si svuota. Una torcia non si ripara: è un bastone che brucia.

**Il pozzo gela.** D'inverno l'acqua ghiaccia da sempre e la barra dice *"cerca
acqua aperta"*; un pozzo ogni dieci celle scioglieva quel vincolo ovunque senza
che nessuno l'avesse deciso. Adesso il pozzo ghiaccia **nello stesso istante
degli stagni** — lo stato del gelo lo chiede alla mappa, non a un secondo
calendario — e torna a dare acqua col disgelo.

**La valle si è diradata.** I piccoli luoghi erano al 46 per cento delle celle:
con le rovine faceva il 70 di valle costruita, e la natura vergine scendeva
sotto il terzo. Una cella è 64 tasselli, cioè due schermate e mezza, quindi si
incontrava qualcosa di costruito ogni quattro schermate invece che ogni undici
— e una cassa gratis ogni quattro schermate sgonfia la metà del gioco che
dovrebbe essere *un posto in cui investi*. Adesso:

| | prima | adesso |
| --- | --- | --- |
| Rovine | 24% | **24%** (invariate) |
| Piccoli luoghi | 46% | **31%** |
| Natura | 30% | **45%** |

Le rovine non si toccano di proposito: abbassare anche quelle avrebbe fatto
sparire cinque delle quarantasette case del collaudo dai mondi già in gioco, e
la stessa valle si ottiene togliendo soltanto luoghi che nessuno ha ancora
visto. Le partite in corso non perdono niente, e il collaudo che congela pianta
e posizione delle vecchie case resta verde senza essere stato rigenerato.

## M7.11 — piccoli luoghi nella valle

Tra una rovina e l'altra si incontrano cinque tipi di luogo, anche in forma
specchiata. Il nome compare avvicinandosi e la mappa TAB li segna nei settori
esplorati: ocra per i piccoli luoghi, azzurro per i pozzi.

| Luogo | Cosa offre |
| --- | --- |
| Carro rovesciato | Carico sparso in una cassa; il carro rende 3 legna e 2 fibre |
| Pozzo dei viandanti | Acqua da bere o attingere con i secchi, anche d'inverno; piccole scorte da viaggio |
| Accampamento bruciato | Focolare spento, tronchi carbonizzati, pochi materiali o una provvista superstite |
| Sosta dei boscaioli | Un giaciglio, un focolare da recuperare, legname e talvolta un'ascia usata |
| Orto abbandonato | Filari appassiti da ripulire, macerie e una cassa con semi, fibra o una zappa usata |

Ogni cassa contiene una o due pile modeste, scelte in modo deterministico.
Il bottino prelevato resta prelevato dopo salva/carica. Carro e tronchi non
ricrescono: quattro/due colpi a mani nude, due/uno con l'ascia; ogni colpo
consuma stamina e, quando usata, l'ascia. Un tronco rende una legna.
Il pozzo è una fonte fissa: non si raccoglie e non ci si pesca.

La generazione conserva le vecchie piante, probabilità e coordinate delle
rovine. Soltanto nelle celle rimaste senza rovine, esclusa quella della
fattoria, prova ad aggiungere un piccolo luogo con probabilità del 65%.
Ci sono al massimo quattro tentativi su terreno asciutto, con un margine
libero dall'acqua; ogni pianta resta interamente nella propria cella di
64 × 64 tasselli. Non ci sono spawn temporizzati: il luogo esiste già come
funzione delle coordinate e del seme.

Su 3.600 celle in quattro semi i piccoli luoghi occupano il 45,6% delle celle,
le vecchie rovine il 23,7%; il resto rimane natura. La fattoria e tutte le
rovine preesistenti del campione sono identiche alla versione precedente.
Le modifiche salvate del giocatore continuano a prevalere sugli oggetti
generati. Non occorre iniziare una nuova partita.

## M7.10 — fatica e riposo

Le azioni fisiche consumano stamina oltre al calo dovuto al tempo e al movimento.
I costi sono punti percentuali della barra, addebitati soltanto a gesto riuscito:

| Gesto | Stamina |
| --- | --- |
| Colpo in combattimento, anche a mani nude | 2% |
| Colpo su albero, pietra, muro o banco, compreso quello finale | 1,5% |
| Taglio di macellazione (tre per carcassa) | 2% |
| Zappare | 2% |
| Costruire o riparare una ricetta | 2% |
| Raccogliere risorse leggere, seminare, innaffiare, cucinare, riempire secchi | 0,5% |
| Posare una costruzione, smontare un giaciglio, catturare un pesce | 1% |

Aprire porte e casse, recuperare bottino già macellato e tentativi rifiutati
non consumano stamina. A zero si può ancora lavorare e difendersi, ma restano
il rallentamento, il divieto di corsa e il danno da esaurimento.

**Sonno volontario.** Spazio davanti a un giaciglio dorme fino alle 7 di notte,
oppure riposa per due ore di giorno. X smonta il giaciglio, anche di notte.
Fuori dall'inverno ogni ora dormita aggiunge 12,5 punti stamina: due ore +25,
quattro +50, otto +100, senza superare la barra piena.

D'inverno il recupero orario e il limite dipendono dal letto e dal falò:

| Letto | Falò durante tutto il riposo | Recupero per ora | Limite |
| --- | --- | --- | --- |
| Paglia | Sì | 9,375% | 75% |
| Paglia | No | 3,125% | 25% |
| Pelli | Sì | 12,5% | 100% |
| Pelli | No | 6,25% | 50% |

La stamina già posseduta sopra il limite non viene sottratta. Per esempio,
quattro ore invernali sulla paglia con fuoco portano da 0 a 37,5%, oppure da
50 a 75%. Il falò deve scaldare il letto per tutto il sonno; le pelli non
proteggono dal danno da freddo. Rimane l'avviso «Non ti senti molto riposato...»
quando si dorme d'inverno senza calore sufficiente.

**Svenimento.** Dopo un'ora di gioco continuativa a stamina zero si cade
addormentati sul posto per due ore e, se vivi, ci si risveglia con il 25%.
Recuperare stamina interrompe il conto; salvare e caricare lo conserva.
Nell'attuale orologio un'ora di gioco dura 12,5 secondi reali: il tempo dormito
viene saltato come quello sul giaciglio, mentre nelle assenze rientra nel
tempo effettivamente trascorso. La pesca si interrompe allo svenimento.

Fame, sete, gelo, meteo e scadenze continuano durante ogni sonno; la torcia in
mano non riscalda chi dorme. Il sonno mantiene la simulazione già usata dal
giaciglio: non fa avanzare gli spostamenti e gli attacchi di infetti e animali.
Morire durante il sonno interrompe il tempo, senza recupero o annuncio di risveglio.
I vecchi salvataggi restano compatibili e il nuovo modulo è disponibile offline.

## M7.9.2 — il primo uso delle pelli (regole del riposo aggiornate in M7.10)

Le pelli della caccia avevano un solo difetto: non servivano a niente. Si
raccoglievano macellando, si impilavano a venti, non marcivano, e restavano lì.
Adesso diventano un letto.

**Il giaciglio di pelli** si costruisce **al banco** con **3 pelli, 4 fibre e 2
legna** — un orso, un bufalo, o tre cervi. Si posa e si riprende come quello di
paglia, e di notte ci si dorme; di giorno si smonta, con la stessa regola di
sempre.

Quello che cambia è **come si passa la notte d'inverno**:

| | fuori dall'inverno | inverno col fuoco | inverno senza |
| --- | --- | --- | --- |
| Giaciglio | 100% | 75% | 25% |
| Giaciglio di pelli | 100% | **100%** | **50%** |

Con le pelli **e** un falò acceso a portata, la notte invernale riposa come
tutte le altre: è il premio di averci investito, ed è l'unico caso in cui
l'inverno smette di essere una tassa. Senza fuoco resta una brutta notte — e il
gioco continua a dirtelo.

Fuori dall'inverno i due letti valgono uguale, e non è una dimenticanza: quello
che una pelliccia sotto la schiena toglie di mezzo è il freddo, e d'agosto non
c'è niente da togliere. Pagare quattro volte tanto per dormire meglio a luglio
sarebbe una ricetta che risponde a una domanda che nessuno fa.

**Le pelli danno riposo, non calore.** D'inverno senza fuoco ci si gela sopra
esattamente come sulla paglia: il letto migliora il risveglio, non la notte. Il
calore che ci si porta addosso è un'altra tappa, ed è di proposito che le due
cose stanno separate — un letto caldo e una pelliccia rispondono a due domande
diverse, e mescolarle qui vorrebbe dire non saper più dire quale delle due ti ha
salvato.

## M7.9.1 — una carcassa non è un muro, e due bestie non sono una sola

Due correzioni alla tappa della caccia.

**La carcassa si fa da parte quando non ci si può lavorare.** Un corpo resta
per terra due giorni, e in quei due giorni copriva il tassello che aveva
davanti: un bufalo caduto sulla soglia teneva chiusa la porta di casa fino a
dopodomani, e senza un'ascia non c'era modo di toglierlo di mezzo — anche
quando l'ascia stava dentro. Adesso la barra nomina la macellazione finché
c'è da lavorarci; se manca l'ascia, o se non c'è posto nello zaino per quello
che ne uscirebbe, torna davanti la porta, la cassa, il falò. L'avviso non si
perde: resta l'ultima risposta quando davanti non c'è nient'altro da fare.

**Gli animali si scansano.** Si attraversavano fra loro e attraversavano il
superstite, e due groppe sovrapposte al pixel si leggono come una bestia sola:
in un gioco in cui la domanda è *quanti ne ho intorno* è l'informazione
peggiore possibile. Adesso restano a 18 pixel l'uno dall'altro e a 12 da chi
cammina — lo stesso punto a cui si ferma una carica, così l'orso arriva
addosso invece di tremare sul posto. Chi si scansa passa dagli urti come
tutti, quindi nessuno finisce dentro un muro. Le carcasse no: non spingono e
non si spostano, perché un corpo sta dove è caduto insieme a quello che non ti
è entrato nello zaino, e perché farle spingere vorrebbe dire uno scudo —
bastava mettersi dietro un bufalo morto e l'orso non arrivava più.

## M7.9 — caccia nelle praterie

La fauna nasce nelle radure di erba e sterpaglia, fuori dall'inquadratura:
al massimo **2 animali vivi nei dintorni**, un tentativo di arrivo ogni
**40 secondi** (primo dopo 12) — d'inverno uno solo e ogni 95, vedi M7.12.1. Gli infetti possono essere 5 nella notte.
Gli animali restano anche di giorno e nessuno è cavalcabile.

| Specie | Comportamento | Carne / pelli |
| --- | --- | --- |
| Cavallo | Fugge entro 100 pixel; mai aggressivo, neanche se ferito | 2 / 1 |
| Cervo | Entro 48 pixel per 5 secondi: 35% di attacco, altrimenti fugge | 3 / 1 |
| Bufalo | Entro 48 pixel per 5 secondi: 55% di attacco, altrimenti fugge | 6 / 3 |
| Orso | Attacca sempre quando ti vede entro 64 pixel | 5 / 3 |

Cervi e bufali diventano inquieti prima di decidere. Allontanarsi o perdere
la linea di vista interrompe il conteggio; colpirli provoca una reazione
immediata. Anche l'orso reagisce se ferito. Muri e porte chiuse impediscono
vista e attacchi. Gli animali non sfondano i muri, non infettano e perdono
l'interesse se riesci a distanziarli. La neve rallenta anche loro.

Si caccia con il normale comando Spazio: ascia e lancia consumano usi come
nel combattimento con gli infetti. Un attrezzo rotto vale ancora come un pugno.
Abbattere un animale lascia una **carcassa**, senza loot automatico. Per
macellarla occorrono **3 colpi con un'ascia funzionante**, un uso per colpo.
Finita la macellazione, il bottino che non entra nello zaino resta sulla
carcassa e si raccoglie con Spazio anche senza attrezzo.

Carne cruda: 15% fame, durata 2 giorni; arrostita sul falò: 45%, durata
4 giorni. Le pelli sono impilabili a 20 e non deperiscono; questa tappa le
rende raccoglibili, senza aggiungere ancora ricette di lavorazione.
Le carcasse spariscono al secondo cambio di giorno, come la carne cruda: macellare tardi non
ringiovanisce la carne. Vivi feriti, temperamento, carcasse e raccolta parziale
si salvano, evitando di duplicare il bottino ricaricando una partita.

## M7.8.1 — un attrezzo rotto è un pugno, e riparato non torna nuovo

Tre correzioni alla tappa dell'usura, e una regola nuova su cosa si consuma.

**Rotto non vuol più dire fermo.** A zero usi l'attrezzo resta in mano e vale
come le mani nude: un'ascia rotta abbatte in quattro colpi invece che in due e
fa un danno invece di tre, una lancia rotta colpisce da vicino. Prima toglieva
il gesto, e il difetto si vedeva nel momento peggiore — l'ascia che si rompe
mentre uno ti è addosso faceva smettere di rispondere la barra, e bisognava
cambiare casella con un infetto addosso.

**Riparare non riporta a nuovo.** Ogni riparazione costa sempre 1 pietra e 2
fibre, ma toglie **un decimo** della durata di quando l'attrezzo era nuovo, e
sotto i **due quinti** non si ripara più: va rifatto. Per l'ascia sono sei
riparazioni — 60, 54, 48, 42, 36, 30, 24 — cioè **294 colpi in tutto** invece
di infiniti. Con la riparazione piatta un'ascia era eterna: costava una pietra
a ciclo, il due per cento di quello che produceva, e la ricetta dell'ascia si
usava una volta sola in tutta la partita. La barra sotto l'icona adesso porta
un tacchetto rosso dove arriva il pieno di quell'esemplare.

**Gli attrezzi delle case arrivano usati**, fra un terzo e due terzi di quello
che reggono da nuovi, e sempre gli stessi per la stessa cassa. Un'ascia nuova
di zecca in fondo alla cassa di casa d'altri sgonfiava da sola la tappa:
frugare rendeva sempre più che riparare.

**Un attrezzo si consuma solo quando serve a quello che stai facendo.** La
lancia è un'arma: impugnarla davanti a un albero non la rovina, perché con una
lancia un albero non lo abbatte nessuno — si danno le stesse quattro manate
che si darebbero a mani nude. Specularmente la zappa non è un'arma: menarla
addosso a un infetto fa il danno di un pugno e non le costa niente. È la
stessa regola detta in un dato invece che in tre eccezioni.

E la rottura ha una voce: l'unica metallica del gioco, in una valle di legno,
pietra e fibra.

*(Rimessa in piedi anche la maniglia del collaudo: da M7.5.1 aprire il gioco
con `?diagnostica` lanciava un ReferenceError — `gioco.js` aveva smesso di
importare `decadimento` e `ricrescita` ma continuava a esporli — e nessuna
prova dai tasti veri poteva più girare. Adesso un test statico controlla che
il blocco non nomini cose che il file non conosce.)*

## M7.8 — attrezzi, usura e riparazioni

Ascia: **60 usi**, zappa: **40**, lancia: **50**, canna: **20**.
Un colpo a segno contro un infetto o contro albero, sasso, muro, macerie e
banco consuma un uso dell'attrezzo impugnato; zappare consuma un uso della
zappa e catturare un pesce uno della canna. I tentativi a vuoto e la pesca
interrotta non consumano nulla. Raccogliere piante e oggetti, aprire casse e
porte non usura gli attrezzi. Secchi e torce mantengono le regole precedenti.

A zero l'attrezzo resta nello zaino e vale come le mani nude (vedi M7.8.1);
il colpo finale vale ancora. La barra sotto l'icona indica la durata, il
promemoria riporta gli usi esatti; un avviso compare al 20% e alla rottura.

Nel menu C, al banco, **Ripara** consuma **1 pietra e 2 fibre** e ricarica
l'attrezzo più danneggiato di quel tipo presente nello zaino — non fino a
nuovo, da M7.8.1.
Non serve una casella libera e gli attrezzi integri non consumano materiali.
Usura conservata in casse, mucchi, cadaveri e salvataggi; gli attrezzi delle
partite precedenti iniziano integri. Due attrezzi a terra restano separati.

Abbattere un muro integro rende sempre **3 pietre**, anche se costruito dal
giocatore. Le macerie già presenti o prodotte dagli infetti restano a 1 pietra.

## M7.7.1 — fame, esposizione e riposo invernale

Per tutti e quattro i giorni d'inverno la fame si consuma a **2x**, anche nel
sonno e durante le assenze. Nelle altre stagioni resta a 1x; l'aridità estiva
continua a triplicare soltanto la sete.

Il danno da freddo aumenta con l'esposizione continua: **1x nei primi 15
secondi, 2x da 15 a 30 secondi, 3x da 30 secondi in poi**. Si ferma a 3x.
Il moltiplicatore compare nell'interfaccia. Quando il personaggio non è più
al freddo l'esposizione si azzera; salvare e ricaricare invece la conserva.
Anche una lunga assenza paga ogni intervallo al suo valore, senza applicare
il moltiplicatore finale ai secondi precedenti. La regola vale per ogni fonte
di freddo, compreso il corpo zuppo.

Una notte iniziata d'inverno sul giaciglio porta la stamina esattamente al
**75% con un falò acceso entro tre tasselli dal letto**, senza pareti in mezzo,
oppure al **25% senza quel calore**. Il falò deve restare acceso durante il
sonno: se si spegne a mezzanotte il riposo vale il 25%. La torcia impugnata non
sostituisce il falò. Al risveglio dal riposo freddo compare:
**«Non ti senti molto riposato...»**.

Nelle altre stagioni il riposo continua a riempire la stamina. Fame, sete e
freddo fanno comunque danno mentre si dorme: il recupero e il messaggio del
risveglio si applicano soltanto a chi sopravvive alla notte.

## M7.7 — pioggia, neve e aridità

Ogni stagione dura quattro giorni. In autunno e primavera **piove un giorno
solo**; in inverno **nevica un giorno solo**. L'evento occupa il secondo o
terzo giorno, scelto in modo stabile dal seme della valle e dall'anno:
ricaricare non cambia il meteo. Il resto della stagione è sereno. Il riquadro
sotto l'orologio indica il tempo attuale e anticipa il maltempo del giorno dopo.

**L'estate è sempre arida:** non piove e la sete si consuma a velocità **3x**
per tutta la stagione, anche dormendo o lasciando la scheda. Da piena a vuota
sono cento secondi reali, anziché trecento: preparare acqua e secchi conta.

La **pioggia innaffia automaticamente i campi scoperti**, compresi quelli
seminati mentre piove. La crescita resta giornaliera: non accelera premendo
tasti o ricaricando. Gli orti nelle stanze chiuse richiedono ancora il secchio.
I **falò scoperti si spengono**, quelli in una stanza chiusa restano accesi.
La posa di un falò sotto la pioggia è impedita prima di consumare materiali.
Una porta aperta o un muro sfondato espongono subito la stanza al maltempo.

All'aperto la pioggia bagna progressivamente: dopo **10 secondi** si è zuppi,
dopo **20 secondi** fradici — ed è da lì, non da zuppi, che si soffre il
freddo anche di giorno (vedi M7.12.2, che dà anche un riparo agli alberi). Entrare in una stanza ferma la pioggia ma non asciuga istantaneamente:
da completamente bagnati servono **40 secondi al coperto**, **10 vicino a una
fiamma o in una stanza riscaldata**, **80 all'aperto dopo la pioggia**. La torcia
in mano protegge dal freddo ma non accelera l'asciugatura. Il bagnato resta
nei salvataggi; le partite precedenti iniziano asciutte.

La **nevicata rallenta del 28%** il superstite e gli infetti allo scoperto,
e causa freddo anche di giorno. Dentro una stanza si cammina normalmente.
La neve non innaffia né spegne i falò. Finita la nevicata cessa il rallentamento;
il ghiaccio dei bassofondi dura invece tutto l'inverno, come in M7.6.

Pioggia e neve sono visibili con particelle leggere, escluse dalla stanza
del giocatore. Il meteo segue l'orologio del mondo anche durante sonno e
recupero delle assenze. **Dormire all'aperto non protegge da pioggia e freddo.**

Collaudo manuale prima del rilascio: leggibilità del meteo e delle previsioni,
pioggia sul campo, falò dentro/fuori, porta aperta durante la pioggia, asciugatura,
neve e movimento, ripresa di una partita bagnata e aggiornamento offline.

## M7.6 — l'acqua e la pesca

La canna si costruisce ovunque con **3 rami e 4 fibre**. Impugnala davanti
all'acqua e premi **Spazio**: il galleggiante e una barra mostrano l'attesa di
**12 secondi**. Il tempo, i bisogni e gli infetti continuano a muoversi.
Muoversi, voltarsi, cambiare attrezzo, subire danno o premere di nuovo Spazio
ritira la lenza. Aprire un menu o lasciare la scheda interrompe la pesca;
non si raccolgono pesci durante un'assenza.

Ogni tassello d'acqua offre **2 pesci al giorno**, poi occorre spostarsi o
tornare domani. La scorta resta nei salvataggi. Serve posto nello zaino e
una cattura aggiunge un solo pesce: per continuare bisogna rilanciare.

Il **pesce crudo** ristora il 18% della fame e dura 2 giorni nello zaino.
Davanti a un falò acceso, Spazio lo trasforma in **pesce arrostito**: ristora
il 40% e dura 4 giorni. Entrambi si impilano fino a 10, si mangiano con il
comando abituale e seguono le regole delle casse e del decadimento.

Nei quattro giorni d'inverno il **bassofondo ghiaccia**: lastre chiare e
venature lo distinguono dall'acqua profonda, e anche le mappe cambiano.
Superstite e infetti possono attraversarlo; l'acqua profonda resta un ostacolo.
D'inverno i pesci non abboccano, neppure nell'acqua aperta. Sul ghiaccio non
si costruisce, non si lascia roba e non si riempiono secchi: per bere serve
acqua aperta oppure quella messa da parte.

In primavera il bassofondo torna acqua. Chi è ancora sul ghiaccio viene
riportato sulla terra libera più vicina, senza una morte improvvisa o una
partita bloccata. La generazione della valle e i salvataggi precedenti restano
compatibili: il ghiaccio è uno stato stagionale, non una modifica permanente.

Prima del rilascio verificare nel browser lenza, barra d'attesa, cattura,
cambio attrezzo, cottura, colori delle mappe, attraversamento e disgelo.

## M7.5.1 — affidabilità e percezione

Il tempo di gioco, il sonno e il recupero dopo un'assenza condividono la stessa
simulazione: i bisogni causano danno soltanto dopo essersi esauriti e ogni
mezzanotte applica la stagione di quel giorno a colture e decadimento. Durante
le assenze si considera anche il freddo, rivalutato al massimo ogni secondo;
il recupero si interrompe alla morte. Gli infetti non vengono simulati durante
l'assenza.

I salvataggi vengono controllati prima di modificare la partita. Una ricetta
o cottura fallita lascia invariati ordine, quantità e date dello zaino. Il
service worker cancella soltanto le vecchie cache di Ultimo raccolto.

Muri e porte chiuse interrompono la vista e attenuano il rumore: ogni parete
lascia il 35% della portata sonora. Perso il contatto, gli infetti cercano
l'ultima posizione vista o sentita per quattro secondi, senza conoscere gli
spostamenti successivi. Possono ancora sfondare muri e porte verso quel punto.
Morsi e colpi del giocatore rispettano le pareti, anche agli angoli.

Le costruzioni di M7.5 restano compatibili: una stanza chiusa richiede una
fiamma per scaldarsi. Aprire una porta o sfondare un muro aggiorna subito il
riparo. Non si possono chiudere porte o posare muri e porte sopra una persona.

Test automatici senza dipendenze, con Node.js 22 o successivo:

```sh
cd ultimo-raccolto
npm test
```

La suite copre anche le date degli alimenti lasciati a terra, la compatibilità
dei salvataggi precedenti e la completezza dei moduli nella cache offline.
Prima del rilascio verificare nel browser apertura/chiusura porte, messaggi del
riparo, inseguimento dietro una parete e aggiornamento offline del service worker.

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

È finita **M7.12**. Il ciclo di gioco è quello che il pilastro promette: **di
giorno si raccoglie, di notte c'è qualcuno là fuori, l'anno gira che tu sia
pronto o no — e si muore.** La valle però ti aspetta anche domani, ti aspetta
anche dopo che sei morto, si rimette a posto da sola se le dai tempo, si sente,
c'è un posto in cui mettere le cose, non è più soltanto natura, si comincia da
una fattoria in rovina — e adesso **quel posto serve a qualcosa**: certe cose
si fanno solo al banco da lavoro, e **quel posto si può chiudere**: muri,
una porta, e di notte qualcuno che li prende a colpi.

**E da lì in poi la valle ha smesso di essere solo un posto in cui stare.**
C'è l'acqua e si pesca; il cielo fa piovere, nevicare e seccare; gli attrezzi si
consumano e si riparano senza tornare nuovi; nelle praterie c'è fauna da cacciare
e carcasse da macellare; le azioni costano fatica, e a zero si sviene; fra una
rovina e l'altra si incontrano carri rovesciati, pozzi e accampamenti bruciati.
E l'inverno, che si annullava tenendo una torcia in tasca, adesso si attraversa
solo con un fuoco vero, una stanza che ne contiene uno, o **una pelliccia
addosso** — la prima cosa che questo gioco ti lascia indossare.

Si abbattono alberi, si spaccano sassi, si strappano cespugli — a colpi, non
con un tocco: l'oggetto colpito trema e sputa scheggie, e l'ultimo colpo ne
sparge di più. Quello che ne esce finisce in uno zaino di otto caselle. Con
quei materiali si fanno ascia, torce e falò, e torce e falò si posano per
terra dove servono.

Vale una regola sola: **quello che tieni in mano è quello che usi**, e lo si
vede addosso al superstite. Con la torcia in pugno fai luce; con l'ascia
abbatti un albero in due colpi invece di quattro.

In basso a destra c'è una minimappa che mostra poco meno di tre schermate:
abbastanza per capire dov'è il lago e da che parte finisce la roccia, troppo
poco per essere una mappa del mondo — che toglierebbe il gusto di andare a
vedere. I falò e le torce che hai posato ci compaiono come puntini caldi:
sono i tuoi punti di riferimento, non quelli del mondo, e restano caldi in
ogni stagione.

**`TAB` apre la mappa di quello che hai visto.** In un mondo infinito una
mappa del mondo non esiste: qualunque cosa si disegni è un ritaglio. Questa
disegna l'unico ritaglio che abbia senso — i settori per cui sei passato — e
lascia buio tutto il resto. Cresce esplorando, e ci finiscono sopra i tuoi
punti di riferimento: i falò accesi e spenti, le torce, il tuo cadavere e il
punto di partenza. Si salva con la partita: una mappa che si perde chiudendo
la scheda non serve a niente, e un superstite nuovo la eredita — è l'unica
cosa che ha per ritrovare il corpo del precedente.

Cosa conta come «visto» non è una regola nuova: è quello che la minimappa ti
ha già mostrato, cioè trentadue tasselli attorno a te. Inventarne una seconda
avrebbe voluto dire due nozioni di visibilità che si contraddicono.

Non si ricorda il terreno, si ricordano i settori: il terreno è una funzione
delle coordinate e si ricalcola uguale, quindi memorizzarlo sarebbe scrivere
su disco qualcosa che si sa già. Una partita con seicento settori esplorati
pesa duemilaseicento byte di mappa.

**Anche la minimappa segue le stagioni**, perché è la stessa valle vista da
più in alto: una valle grigia in mezzo allo schermo e verde nell'angolo in
basso a destra si legge come un riquadro dimenticato acceso. D'inverno però
la prateria si appiattisce — l'erba e la sterpaglia, che d'estate distano
quarantasette punti di colore, d'inverno ne distano undici — ed è giusto
così: sono la stessa tinta anche nel mondo. In cambio si distingue meglio
quello per cui la minimappa esiste, cioè dov'è il lago e da che parte
finisce la roccia: l'erba e la roccia passano da trentotto punti a
cinquantadue.

Il sole gira: un giorno dura cinque minuti veri, l'alba e il tramonto
durano due ore ciascuno, e alle nove di sera è buio pieno. Una torcia in mano
o un falò acceso scavano un cerchio di luce nel buio.

Il mondo si ricorda cosa hai fatto: l'albero che hai abbattuto resta
abbattuto, il falò che hai posato resta dov'è. E adesso se lo ricorda anche
dopo che hai chiuso la scheda — vedi i salvataggi, più sotto.

**Il mondo non aspetta.** Cambiando scheda il browser smette di chiamare il
gioco — non c'è codice che possa impedirlo — ma il tempo passato non si perde:
torna tutto insieme al primo fotogramma del ritorno, e l'orologio avanza, i
bisogni calano, l'orto cresce o muore. Se manca più di un'ora di gioco te lo
dice. Oltre quattro ore vere di assenza il conto si ferma, perché recuperare
mille giorni bloccherebbe la pagina e a quel punto non cambierebbe più niente.

Il gioco è installabile e funziona senza rete.

**Fame, sete e stanchezza** si consumano a ritmi diversi: la sete morde prima
della fame, e la stanchezza dipende da quanto ti muovi — mezza giornata di
corsa la esaurisce, il che trasforma la corsa da gratis a scelta. Si beve
alla riva del lago, si mangiano le bacche, si dorme su un giaciglio costruito
apposta. Dormire porta all'alba e ristora, ma il tempo saltato si paga: ci si
sveglia assetati.

Un bisogno a zero toglie un quarto della velocità — tre ignorati riducono a
un quarto — e adesso fa anche danno: vedi la salute, più sotto.

**La valle non dà lo stesso in ogni mese.** Un cespuglio ha le bacche nel 45%
dei casi d'estate, nel 34% d'autunno, nel 14% di primavera e nell'11%
d'inverno — misurato su milleseicento cespugli per stagione con lo stesso
seme, non stimato: l'inverno rende un quarto dell'estate. I
semi vengono solo dalle piante andate a seme, cioè d'estate e d'autunno. La
fibra invece non ha stagione: è stelo secco, ce n'è sempre, ed è quello che
tiene aperta la strada delle bende anche nell'inverno peggiore.

D'inverno la valle dà **poco, non niente**: si sopravvive raccogliendo, ma
costa quattro volte il cammino, al freddo e col buio addosso. È questo a fare
del raccolto d'autunno una provvista invece di una collezione — e quando
l'autunno arriva, il gioco te lo dice.

**Quello che prendi torna, se gli dai tempo.** Un cespuglio ricresce dopo una
stagione, un albero dopo tre. Il sasso mai: la pietra è minerale, e resta
l'unica risorsa che si esaurisce davvero. D'inverno non torna niente, quindi
chi strappa in autunno rivede il cespuglio in primavera.

Prima di questo ogni cosa raccolta era tolta per sempre: la valle attorno alla
fattoria si spogliava e l'unica risposta era andarsene più lontano, che da M6
è anche più pericoloso. Il gioco spingeva fuori invece di dare un motivo per
restare.

Far ricrescere, qui, vuol dire **dimenticare una modifica**: il mondo è una
funzione delle coordinate e si ricordano solo le eccezioni, quindi togliendo
«qui non c'è niente» il cespuglio torna da sé. Il salvataggio si accorcia
invece di crescere per sempre — duecento cespugli strappati e poi ricresciuti
lasciano zero byte, misurato.

**Il fuoco cucina**, ed è il suo terzo mestiere dopo la luce e il calore. Con
qualcosa di crudo in mano davanti a un falò acceso si arrostisce: una rapa
passa da 0,6 a 1,0 di fame, le bacche da 0,3 a 0,45. Non è una dispensa —
quella vuole i contenitori — è lo stesso raccolto che vale quasi il doppio, ed
è la differenza fra sei rape e quattro per attraversare un inverno (misurato:
una stagione fredda costa 3,56 di fame). Dà anche una ragione per tornare
all'accampamento, che è pure il posto in cui di notte non ti trovano.

**Si beve da quello che si porta.** Il secchio pieno si beve con `E` e torna
secchio. Per sei tappe si poteva avere l'acqua in mano e dover tornare al lago:
il genere di assurdità che si nota solo giocando.

**L'orto** è la prima cosa tua. Con una zappa si lavora la terra, si semina
quello che si è strappato dai cespugli, si innaffia con un secchio riempito al
lago e si torna dopo giorni a raccogliere. Tre stadi, cioè due innaffiature
dalla semina al raccolto: saltare un giorno non uccide la coltura, la ferma,
e con la stagione da quattro giorni resta un giorno di margine — che è la
differenza fra una scadenza e una trappola. I solchi bagnati si riconoscono
dal terreno più scuro.

Dormire porta all'alba, quindi anche l'orto va avanti: è il modo di
comprimere l'attesa senza toglierla.

**Le stagioni** durano quattro giorni l'una, cioè venti minuti veri, e si
vedono: la valle cambia colore perché gli stessi disegni vengono cotti con
un'altra tavolozza. L'autunno vira al rame, l'inverno spegne i verdi e li
raffredda. La primavera fa un passo in più — fiorisce — perché un verde
appena più freddo dell'estate, a colpo d'occhio, è ancora l'estate: un quarto
dei tasselli d'erba e di sterpaglia porta un fiore di tre o quattro pixel,
messo dove dicono le coordinate e non sempre nello stesso punto del tassello.
Si comincia di fine estate, quindi la prima cosa che arriva è l'autunno — la
stagione buona — e subito dopo l'inverno. L'anno intero sta in un'ora e
venti.

Giorno e stagioni sono corti di proposito, finché il gioco è un cantiere:
una regola che si mostra sbagliata solo dopo una settimana di gioco va
provata in venti minuti, non in un pomeriggio.

**D'inverno non si coltiva.** Non si semina, e quello che è rimasto piantato
muore, maturo compreso. Zappare resta permesso: preparare il campo per la
primavera è una cosa sensata da fare. D'inverno viene anche fame prima, ed è
questo a trasformare il raccolto d'autunno da collezione a provvista.

**Quello che lasci si degrada.** Una coltura matura non raccolta regge tre
giorni e poi marcisce in piedi; un campo morto si ripulisce e rende un po' di
fibra, così una stagione sbagliata non lascia un pezzo di valle bruciato. I
fuochi si consumano: la torcia piantata dura un giorno, il falò due e lascia
la cenere — che si raccoglie e si ripianta, perché a mancare è il posto
acceso, non l'oggetto.

Per sei tappe non si è degradato quello che stava in un mucchio per terra, e
non per dimenticanza: finché non c'erano contenitori in cui mettere le cose al
sicuro, far marcire anche quello avrebbe tolto l'unico ripostiglio che
esisteva — e far marcire lo zaino mentre il terreno era una dispensa eterna
avrebbe insegnato soltanto a usare il terreno come dispensa. Era un debito con
una condizione scritta, e la condizione era la cassa. **Adesso c'è.**

**I salvataggi** sono quattro caselle: tre da scrivere a mano con `P`, e una
scritta dall'alba di ogni giorno. L'alba perché è il momento in cui il mondo
tira le somme — le colture crescono, i fuochi si spengono, la stagione cambia
— e salvare subito dopo significa che una partita ripresa non rifà mai quel
conto né lo salta. La stessa schermata serve a salvare e a caricare: il modo
si cambia con `A` e `D`.

Non si salva il mondo, si salva quello che hai cambiato: il resto è una
funzione delle coordinate e del seme, e ricalcolarlo costa meno che scriverlo.
Un salvataggio pesa quarantaquattro byte per tassello toccato — una partita
lunga sta sui centotrenta kilobyte.

Le caselle stanno nell'archivio del browser, quindi su quel dispositivo e su
quello soltanto, e svuotare i dati del sito le cancella. Per cambiare
computer c'è il file: dalla stessa schermata, `F` scrive la partita in corso
in un `.json` e `I` ne apre uno. È un file leggibile e non compresso, come il
backup di Budget futuro: si apre, si guarda, e si mette dove si vuole.

**La sincronia in rete** è la terza via, e sta nel modo `RETE` della stessa
schermata. Il gioco genera un codice, lo scrivi sull'altro computer, e da lì
in poi ogni salvataggio — l'alba compresa — sale da solo. Niente account,
niente password: chi ha il codice ha la partita, quindi il codice si tiene
come si tiene una chiave di casa.

Il locale resta la verità: la rete è una copia, e una connessione che non va
costa la sincronia e mai la partita. Quello che sale è compresso, perché
centotrenta kilobyte diventano otto e nessuno vuole spedirne centotrenta ogni
volta che dorme.

Due computer con lo stesso codice scrivono nello stesso posto, quindi c'è una
guardia: si manda solo se in rete c'è ancora l'ultima scrittura che questo
computer ha visto, e a deciderlo è il database insieme alla scrittura, non un
controllo fatto prima. Se qualcun altro ha scritto nel frattempo, niente sale
finché non decidi tu quale partita tenere — senza quella guardia basterebbe
accendere il gioco sul portatile e arrivare all'alba per cancellare una
settimana di lavoro.

Serve un progetto Firebase gratuito: due stringhe in `regole/sincronia.js`.
Finché la chiave è vuota la sincronia si spegne da sola e lo dice, invece di
fallire in un modo che sembra un guasto di rete.

**La salute** è la quarta barra, in cima alle altre tre, e non è un quarto
bisogno: non cala da sola. Sta sotto agli altri e raccoglie le conseguenze —
ogni bisogno a zero fa danno, il freddo fa danno, e quando non manca niente il
corpo si rimette piano. Un bisogno ignorato uccide in due giorni, tre insieme
in sedici ore; guarire del tutto ne richiede tre, perché arrivare a un passo
dalla morte non deve essere un inconveniente da risolvere mangiando una rapa.

**Il freddo** è il secondo mestiere dell'inverno, e la regola sta in una
frase: d'inverno, di notte, lontano da una fiamma, si gela. Una notte intera
all'aperto senza fuoco costa più di metà della salute, e due di fila
uccidono. Non c'è una scala di gradi: una temperatura continua vorrebbe un
indicatore in più da guardare e direbbe quello che dicono già l'orologio e il
calendario. Un cristallo azzurro compare accanto alla salute mentre si gela,
e basta.

È qui che il falò e la torcia smettono di servire solo a vedere — anche la
torcia in pugno scalda, come tutto il resto vale per quello che si ha in mano
— e il giaciglio guadagna un secondo mestiere senza una riga in più: chi
dorme salta la notte, e saltando la notte salta il gelo. D'inverno si sceglie
fra accendere un fuoco e andare a letto, e sono entrambe cose che bisogna
essersi costruiti prima.

**Quando la salute arriva a zero si muore**, e la schermata dice di cosa: la
causa è quella che ha fatto più danno, non l'ultima arrivata. Poi muore il
superstite e non il mondo. La valle non cambia di una virgola — il campo, i
falò, tutto quello che hai toccato resta dov'era — e il tuo corpo resta dove
sei caduto con addosso tutto quello che portavi.

Il nuovo superstite comincia al punto di partenza — cioè alla fattoria, da
M7.3 — pieno e a mani vuote, e l'orologio e il calendario continuano da dove
erano. **Riprendersi la propria
roba è un viaggio**: si torna al corpo, ci si mette davanti e si preme la
barra, e quello che non sta nello zaino resta addosso al cadavere per il
secondo viaggio. Il corpo resta dov'è e non si disfa da solo, ma il cibo che
porta addosso non è in pausa: da M7.1 ogni pila si ricorda il giorno in cui è
stata raccolta, e quel giorno viaggia intatto dentro e fuori dal cadavere. Il
viaggio di ritorno ha quindi una scadenza — un corpo raggiunto una stagione
dopo restituisce roba che sparirà alla prima alba.

**Gli infetti** escono col buio. Non c'è un secondo concetto — niente tane,
niente orde, nessun contatore — perché la frase da consegnare è una: di notte
è pericoloso. Quanti ce ne sono lo decide la luce, da nessuno al tramonto a
cinque nel cuore della notte, e all'alba se ne vanno.

Sono il superstite con un'altra tavolozza: stessa sagoma, stessa andatura,
stessi vestiti, svuotati. Non è pigrizia, è la cosa che dice di loro più di
qualunque disegno nuovo — erano come te — ed è possibile per la stessa
ragione che dà le stagioni, cioè che la tavolozza è un parametro della
cottura e non una costante.

**Ti trovano in due modi: perché ti vedono e perché ti sentono.** Al buio
vedono poco, quindi una notte si può attraversare stando zitti; con una
fiamma in pugno si vede da molto più lontano, ed è il prezzo dell'unica cosa
che d'inverno tiene caldo mentre si cammina. Camminare si sente da due
tasselli, correre da sei, **spaccare legna da venti** — quasi quanto vedi. È
il gesto che fai più spesso senza pensarci, ed è qui che la notte smette di
essere una questione di luce: di notte non si fa legna.

**Si scappa o si combatte.** Sono più veloci di chi cammina e più lenti di
chi corre, quindi la fuga funziona sempre e costa sempre: correre consuma
stanchezza, e sotto una soglia non si corre più. È la barra che esiste da M2
e comincia a contare adesso. Se invece ci si volta, vale la solita regola —
quello che tieni in mano è quello che usi: l'ascia ne abbatte uno in due
colpi, a mani nude ce ne vogliono cinque, e nel frattempo lui non smette.
Combattere fa rumore, e il rumore chiama gli altri.

Non lasciano niente per terra, ed è voluto: ucciderne uno non ne toglie uno
dal mondo, come spegnere un temporale non toglie pioggia all'inverno.
Combattere non è un modo per ripulire la valle, è quello che si fa quando non
si può più scappare.

**Un morso toglie salute di colpo, e uno su tre lascia dentro l'infezione.**
L'infezione non si aspetta: toglie salute piano e senza fermarsi, e finché
c'è non si rimargina più niente — né il morso, né il freddo, né la fame. Si
cura con una **benda**, tre fibre, usata con `E` come si mangia. È la seconda
volta che una risorsa senza scopo ne trova uno: la fibra serviva a due torce
e poi a niente, e adesso è quello che tieni da parte per quando le cose vanno
male.

Gli infetti non stanno nel salvataggio e non stanno nel mondo: non si contano,
si incontrano. L'infezione invece sì che si salva — è uno stato in cui si
vive, e chiudere la scheda non è una cura.

## Il banco da lavoro

Il sistema delle ricette non era corto per scelta: **era pieno.** Le ricette si
sceglievano con i tasti da `1` a `8` e di ricette ce n'erano esattamente otto,
quindi la nona sarebbe stata irraggiungibile; e il pannello disegnava tutta la
lista in colonna, quindi a undici sfondava lo schermo. Due tetti veri, non due
scelte di misura. Adesso c'è un cursore e una finestra che scorre, e il tetto
non c'è più — il che sposta tutto il peso su quella regola che questo file si
dà da M1: *aggiungere ricette che non rispondono a niente riempirebbe un menu
senza cambiare una partita.*

**Fino a qui si costruiva ovunque.** Una cassa in mezzo a un bosco, di notte,
lontano da tutto. In un gioco il cui pilastro è *il posto è tuo*, l'accampamento
non aveva un solo privilegio — ed era la cosa più strana della tappa che si
chiama Costruzione.

Adesso le ricette sono **due elenchi**. Quelle a mani nude si fanno dove capita
e sono la sopravvivenza: la luce, il fuoco, il letto, la benda, l'acqua. Quelle
al banco vogliono un posto, e sono tutto il resto — gli attrezzi compresi.

Il banco è **il primo della lista**, e non per cortesia: è la ricetta che apre
tutte le altre, quindi è quella che si deve vedere per prima aprendo il
pannello il primo giorno. Sei legne e sei pietre, cioè due alberi e tre sassi:
mezz'ora, ed è la mezz'ora che decide dov'è casa. Prima l'ascia era la prima
cosa che si faceva, in piedi in mezzo a un prato; adesso è la seconda, e la
prima è aver deciso dove stare.

Il pannello lo insegna da sé, senza che nessuno lo spieghi: le ricette del
banco portano sempre la loro etichetta, **rossa quando il banco non c'è** e
accesa quando c'è. Chi apre le costruzioni il primo giorno vede che esistono
cose che non può ancora fare, e vede esattamente cosa gli manca — che non è la
roba, è il posto. I due modi di non poter costruire vanno detti diversi: il
primo si risolve raccogliendo, il secondo tornando a casa, e un grigio solo li
manderebbe a fare la cosa sbagliata.

**Tre ricette nuove, e ognuna risponde a qualcosa che il gioco aveva e non
risolveva.**

La **lancia** risponde al combattimento. Da M6 battersi vuol dire scambiare
colpi, e non per caso: la propria portata è venti pixel e il loro braccio ne
arriva a tredici, quindi si è sempre dentro il loro raggio mentre si sta dentro
il proprio. La lancia arriva a trentadue — due tasselli — e fa due di danno
invece dei tre dell'ascia. Tre colpi tenendolo a distanza, o due lasciandogli
dare il suo: è una scelta, non un aggiornamento.

La **conserva** risponde all'inverno, che da M7.1 ha un orologio addosso.
Seccare al fuoco resta la via del cibo che nutre; questa è la via del cibo che
aspetta. Sei bacche diventano due vasi che valgono meno di quelle sei — 1,4
contro 1,8 — e durano sedici giorni invece di tre, cioè un anno di gioco invece
di meno di una stagione. È il baratto che fa ogni conserva vera: si perde
qualcosa adesso per avere qualcosa a marzo.

Il **banco** stesso risponde a un'altra cosa ancora, ed è economia: la pietra
era l'unica risorsa che il gioco dichiara finita e ne chiedeva **sei in tutto**.
Adesso ne chiede quindici, e i muri delle rovine di M7.2 sono lì apposta per
darle.

## Le rovine, e un motivo per andare

Per sette tappe il mondo generato è stato **solo natura**: albero, sasso,
cespuglio, e nient'altro. Il gioco apriva dicendo «un paese abbandonato da
saccheggiare» e mostrava una valle in cui non era mai crollato niente.

Ne discendeva un problema di gioco e non di racconto: **non c'era motivo di
allontanarsi.** Il rumore che fa la valle è stazionario — non c'è un termine
che dipenda dalla distanza dall'origine — quindi un tassello a cinquanta e uno
a cinquantamila hanno la stessa distribuzione. Gli infetti nascono relativi a
te, quindi nemmeno andare lontano è più rischioso. Da M6.5 le risorse
ricrescono a casa propria. E la mappa di M6.6 segnava soltanto la roba tua.
*Avevamo dato una mappa a un mondo che non aveva niente da mappare.*

**Adesso ci sono le case.** Una ogni due schermate e mezza, misurato: il muro
in pietra, il pavimento di terra battuta, il focolare spento, e una cassa con
dentro quello che non si sono portati via. Si entra da dove il muro è venuto
giù — ogni pianta ha almeno due varchi su lati diversi, perché un posto in cui
si entra da un buco solo e ci si trova un infetto è una trappola, non un posto.

**La maglia.** Il mondo è una funzione delle coordinate e non si pregenera
niente, ma una casa occupa settanta tasselli e un tassello deve poter sapere da
solo se gli tocca un muro. Quindi il mondo si divide in celle di 64 tasselli, e
una pianta si posa sempre **interamente dentro la sua cella**: da lì discende
tutto, perché un tassello interroga la propria cella e nessun'altra.

**Le piante sono disegni.** Una pianta è un array di stringhe, un carattere per
tassello — esattamente come uno sprite è un carattere per pixel. `#` è muro, `%`
è muro crollato, `.` è pavimento, `c` è una cassa. Si legge a occhio e in git il
diff dice quale muro è caduto. Non c'è un generatore di stanze e non ci sarà:
una casa disegnata a mano è una casa, una casa generata è la pianta di una casa.

**Il bottino non pesa un byte finché non lo tocchi.** Quello che c'è in una
cassa di rovina non sta scritto da nessuna parte: è una funzione delle
coordinate e del seme, come il terreno. Al primo prelievo si scrive una
modifica e da lì in poi è una cassa come le altre — quindi una valle piena di
case mai visitate pesa zero, che è la stessa proprietà per cui una partita con
seicento settori esplorati pesa duemilaseicento byte di mappa.

**Il pavimento è un terreno che aspettava da sempre.** `TERRENO.TERRA` esisteva
dalla prima tappa — con lo sprite, la tinta, la voce di catalogo, ed era pure
zappabile — e non lo produceva nessuno. Era un terreno in attesa di un motivo.

**I muri si abbattono**, cinque colpi, e rendono pietra. L'ascia non aiuta: è
fatta per il legno, la pietra vorrebbe un piccone, e un piccone che non esiste
non si finge. È l'unica fonte di pietra che non sia un sasso, e la pietra era
l'unica risorsa dichiarata finita del gioco.

**E la mappa comincia a servire.** Le rovine ci compaiono, e sono la prima cosa
segnata che non hai messo tu. Sulla minimappa non serve nemmeno un segnaposto —
il pavimento di terra si vede da sé come un rettangolo scuro — ma sulla mappa
grande sì: lì un settore sta in pochi pixel, e tre pixel di terra battuta in
mezzo alla sterpaglia sono tre pixel di sterpaglia. Fotografata prima di
accorgersene.

## La fattoria, e il paese

**La partita comincia dentro una fattoria in rovina.** Fino a qui il punto di
partenza era «il primo tassello calpestabile a spirale attorno all'origine»,
che è una definizione onesta di un posto che non esiste: si apriva gli occhi in
un prato qualunque. Adesso si apre gli occhi nel cortile fra la casa e la
stalla, con il focolare spento di qualcun altro e tre casse da guardare. Il
pilastro dice *il posto è tuo, ma il mondo se lo riprende*, e adesso comincia
con un posto invece che con un'intenzione.

Davanti c'è **il campo**, che è pavimento come il resto della fattoria, cioè
terra battuta. Non è servito niente per renderlo un campo: `TERRENO.TERRA` è
zappabile da sempre. Il campo di qualcun altro è ancora un campo.

**Nelle casse della fattoria non ci sono attrezzi**, e non è avarizia. Chi se
n'è andato di casa propria si è portato via l'ascia e la zappa — quello che
resta è la roba che non valeva il viaggio — e dall'altra parte l'inizio di
questo gioco è «raccogli abbastanza da farti un'ascia»: trovarne una posata nel
primo minuto lo toglierebbe di mezzo per sempre. Ci sono materiali, e ci sono i
semi: davanti c'è già un campo, e i semi lo rendono tuo prima ancora di aver
trovato una zappa.

La fattoria sta dentro la cella dell'origine come qualunque altra pianta, non
a cavallo: la regola su cui è costruita la maglia non si piega per un caso
particolare. Vuol dire che si comincia qualche tassello più in là di (0,0), e
non lo nota nessuno perché il punto di partenza è definito da dove sta la
fattoria, non il contrario. E c'è sempre: se l'origine ha un lago, si cerca
nella cella finché non si trova posto — misurato, la valle peggiore delle dieci
provate la mette a trenta tasselli invece che a uno, e costa ventotto
millisecondi prima del primo fotogramma.

**E da qualche parte c'è un paese.** Sei case attorno a una strada, una rovina
ogni venti, cioè una dozzina di schermate di cammino: raro abbastanza da valere
il viaggio. La strada è larga quattro tasselli e non due, e non per bellezza —
di notte è l'unico posto di un paese in cui si vede arrivare qualcosa prima che
sia addosso, e un vicolo fra sei case è un posto in cui si muore.

Fra una casa e l'altra la pianta non arriva, quindi lì resta la valle: **gli
alberi crescono in mezzo al paese.** Non era previsto, è una conseguenza, ed è
esattamente quello che fa un posto in cui non abita più nessuno.

Con le rovine sono arrivati anche **la cassa e il giaciglio fra i segnaposti**,
che era una svista di M7.1: si segnava il falò *spento* e non il proprio
ripostiglio, mentre questa mappa dice di sé che serve a dire dove devi andare.

## La cassa, e il cibo che si guasta

**La cassa è il primo posto tuo che non sia il terreno.** Dodici caselle contro
le otto dello zaino, otto legne e tre fibre per costruirla — la ricetta più
cara del gioco, perché è la prima cosa che non serve a fare qualcosa ma a
tenere qualcosa. Si posa dove si vuole, si apre con la barra, e si smonta solo
da vuota: una cassa piena sollevabile sarebbe uno zaino da dodici caselle da
portarsi dietro, cioè un modo di cancellare il limite che in un survival
costringe a scegliere.

Dentro la schermata ci sono due griglie e **un cursore solo**. Il confine fra
cassa e zaino non è un salto, è la riga dopo: le frecce fanno quello che fanno
sempre e la barra ha un significato unico — manda dall'altra parte quello che è
selezionato. Non c'è "prendi" e non c'è "metti", c'è "sposta", e da che parte
si vede.

**E da qui il cibo si guasta.** Le bacche durano tre giorni, la rapa sei. Il
guasto vale ovunque la roba stia — zaino, mucchio per terra, cassa — e **la
cassa rallenta invece di fermare**: dentro, tre volte tanto. È la decisione che
regge la tappa. Una cassa che ferma il tempo è una ghiacciaia: metti via il
raccolto d'autunno e l'inverno smette di essere un problema, cioè si toglie
esattamente la cosa che le stagioni erano venute a portare. Rallentando, la
domanda resta quella e cambia solo di scala.

Il cadavere non è un'eccezione, ed è la correzione più severa di M7.4. Non
marcisce sul posto — il cambio di giorno non visita i corpi — ma quello che ne
esce si porta dietro la data in cui l'avevi raccolto, quindi i giorni passati a
tornare indietro li ha contati l'orologio come dappertutto. La freschezza in
questo gioco è un dato solo, il giorno in cui hai preso quella roba, e non
esiste posto che lo riscriva: **né il terreno, né il corpo del superstite di
prima**. Riprendersi la propria roba resta un viaggio, ma adesso è un viaggio
con una scadenza.

**Arrostire e seccare erano la stessa mossa, e diventano due mosse opposte.**
Fino a qui il fuoco faceva una cosa sola — metti sopra, vale di più — e con il
guasto i due cibi cotti dicono finalmente quello che sono. Arrostire raddoppia
il valore e dimezza la durata: la rapa arrostita sfama il doppio e dura due
giorni, quindi si cuoce quello che si sta per mangiare. Seccare invece è
conservare: le bacche secche nutrono meno di una rapa arrostita ma durano
dieci giorni, trenta in una cassa, e sono l'unica cosa nel gioco che attraversa
una stagione intera. Non è stato aggiunto nessun oggetto per dirlo: erano già
lì tutti e due, e mancava la regola che li distinguesse.

**Una scadenza che non si vede è una trappola**, quindi si vede: ogni casella
di cibo porta lungo il bordo di sopra una riga di un pixel che si accorcia e
cambia colore. Un pixel e non una barra vera perché è un'informazione di
sfondo — serve a far scegliere quale rapa mangiare per prima, non a essere
guardata. E all'alba, quando qualcosa va, il gioco lo dice: prima ancora del
fuoco spento, perché un fuoco si riaccende e del cibo andato non torna niente.

Mescolando due pile della stessa cosa la data diventa la **media pesata**.
Tenere la più vecchia punirebbe chi aggiunge tre bacche fresche a una cesta che
sta per andare; tenere la più nuova permetterebbe di ringiovanire un raccolto
buttandoci sopra una bacca. La media è l'unica delle tre che si comporta come
una cesta vera.

## Il suono, che era il debito più vecchio

Per sei tappe il gioco ha misurato il rumore che fai senza fartene sentire
niente. Il colpo aveva un debito scritto nel codice — tremolio e scheggie erano
un ripiego dichiarato — e con gli infetti il conto era raddoppiato: metà di
quella tappa era un sistema di rumore che il giocatore non poteva udire.

**Niente file audio.** I suoni sono numeri, come gli sprite sono stringhe: una
voce dichiara la forma d'onda, l'altezza, l'inviluppo e il filtro, e
`motore/suono.js` la costruisce quando serve. Il diff di un `.wav` non dice
niente; il diff di `arte/voci.js` dice che il tonfo è diventato più grave e più
corto. Tutto il comparto pesa quanto un modulo, non quanto un pacchetto di
campioni da precaricare per giocare in treno.

Ed è lo stesso conto che rende economiche le stagioni: **una voce è un
parametro, non una costante.** Un materiale sono tre numeri — quanto è grave,
quanto è duro, quanto risuona — e dagli stessi tre escono il colpo e il crollo.
Il legno fa un tonfo sordo, la pietra uno schiocco secco, il cespuglio uno
strappo che *sale* invece di scendere, perché quello che si sente è la fibra
che si scuce e non la massa che si sposta. E l'ultimo colpo, quello che stacca,
è più grave e più lungo: è la stessa differenza che le scheggie raccontavano
già agli occhi.

L'altezza cambia di poco da un tassello all'altro, e non a caso: l'impronta
delle coordinate è la stessa funzione da cui nasce tutta la valle. Lo stesso
albero suona sempre uguale, due alberi vicini no, e `Math.random` non compare
nemmeno qui.

**I passi sono agganciati alle gambe, non a un cronometro.** L'animazione
avanza di un fotogramma ogni sette pixel percorsi, e il passo suona quando il
piede tocca — cioè sui due fotogrammi d'appoggio del ciclo. Correre accelera la
cadenza da sé, la fame che rallenta la rallenta da sé, e quello che
`chiasso.js` misurava in silenzio adesso si sente: fermo non ti sentono,
correre chiama, spaccare legna chiama molto più forte.

**E finalmente si sentono loro.** Questa è la metà che non esisteva affatto.
Nascono fra 260 e 420 pixel, e la vista arriva a 58 — 150 con una fiamma in
pugno: per centinaia di pixel uno si avvicinava nel buio senza un solo segnale,
e l'unico avviso arrivava quando aveva già visto te. Adesso i loro passi
arrivano da trecento pixel, attenuati dalla distanza e spostati
nell'orecchio da che parte sono, e chi ti insegue ringhia da trecentottanta.
L'esclamativo resta e non è sostituito: quello dice «ti ha visto», il verso
dice anche **da che parte**.

La curva dell'attenuazione è misurata e non scelta, come le soglie del terreno.
La prima stesura usava un esponente di 1,6 — vicino alla fisica — e contando le
voci emesse è venuto fuori che a 290 pixel non ne partiva nessuna: il tratto in
cui nascono era esattamente il tratto silenzioso, e «lo senti arrivare prima di
vederlo» era falso di un centinaio di pixel. Con 1,1 a 290 si sente appena, a
260 è un fruscio, a 150 è qualcosa che si sta avvicinando.

Il falò crepita, ed è la controparte sonora del cerchio di luce: al buio
l'accampamento si ritrova anche a orecchio. Una fiamma grande scoppietta più
spesso e più forte di una piccola senza che la regola sappia che esistono un
falò e una torcia — il raggio e l'intensità li dichiara già il catalogo per la
luce, e servono identici qui.

**Il primo tasto accende il suono.** Un browser non fa partire l'audio finché
chi guarda non ha toccato niente, e di solito quella regola si paga con un
cartello «clicca per attivare l'audio». Qui il gesto c'era già — la schermata
d'apertura si toglie con un tasto qualsiasi — quindi il tasto che comincia la
partita è anche quello che accende le casse. `V` gira fra muto, piano e forte,
e il livello si ricorda in questo computer e non nel salvataggio: una partita
viaggia fra computer, il volume appartiene alle casse.

## Il muro, la porta, e l'essere dentro

Fino a M7.4 il gioco ti dava un banco, delle casse, una fattoria e una valle da
saccheggiare, e poi **non faceva succedere niente di diverso a chi si era
costruito un posto**. Di notte gli infetti arrivavano identici che tu fossi in
mezzo a un prato o in mezzo al tuo orto — perché il recinto non si poteva
costruire. Metà del pilastro esisteva solo come inventario: nessuna delle cose
che si posavano cambiava quello che ti capitava.

**Il muro non è un disegno nuovo: è quello delle rovine.** `MURO` esiste dal
M7.2 con la sua solidità, i suoi cinque colpi e le sue due pietre di resa;
finora lo posava soltanto la generazione, e adesso lo posa anche il superstite.
Costa **tre pietre**, e la pietra è l'unica risorsa che non ricresce: un
recinto non si paga con una passeggiata, si paga smontando il paese. La catena
si chiude da sé — **si porta via la casa di chi non c'è più per tirare su la
propria** — ed è il motivo per cui le rovine erano piene di muri.

**La porta è di legna**, sei e due fibre, ed è la parte che si rifà: quando
sfondano qualcosa sfondano quello che sta sul passaggio, e una cosa che si
rompe spesso non può costare la risorsa che non torna. Si apre e si chiude con
la barra; si stacca con `X`, lo stesso tasto con cui si smonta una cassa. Sono
due tasti diversi apposta: quello che si preme di notte con qualcuno alle
calcagna non deve poter portare via la porta.

### Gli infetti sfondano

Un muro che ferma e basta sarebbe la fine della notte: si alzano quattro pareti
e il gioco è risolto per sempre. Quindi un infetto che insegue e non passa
**mena lì**, con lo stesso braccio e lo stesso ritmo con cui morderebbe. Otto
colpi per un muro, cinque per una porta: uno solo ci mette nove secondi a
passare, quattro insieme poco più di due — misurato dai tasti veri.

E il muro non sparisce: **diventa macerie**, che non fermano nessuno. Quello che
resta dopo una notte storta è un varco nella propria recinzione, non un buco nel
nulla. Le macerie si spalano in un colpo e rendono una pietra, quindi rimettere
a posto un muro sfondato costa una pietra delle tre. È la tassa della notte, e
si paga in pietra, cioè tornando al paese.

### Essere dentro

Il gioco non sapeva rispondere alla domanda più semplice che si possa fare a una
casa: *ci sono dentro?* Adesso sì, e la risposta è una sola operazione — si
allaga a partire da dove sei, e si guarda se l'acqua esce. Se non esce entro
**duecento tasselli**, sei dentro, e quello che l'allagamento ha toccato è la
stanza. Il limite non è una rinuncia: una stanza più larga di duecento tasselli
è un recinto, non una casa, e un recinto non deve scaldare.

Le pareti sono le cose che stanno in piedi — muri, porte chiuse, casse, banchi,
e anche alberi e sassi: chi si accampa in un buco di roccia ha fatto lo stesso
lavoro di chi ha alzato quattro muri, solo che l'ha trovato già fatto. L'acqua
no: ferma i piedi ma non è una parete, quindi un isolotto non è una stanza.

Da questo discendono due cose, e sono il premio della tappa.

**Al chiuso il calore resta dentro.** La regola del freddo era *d'inverno, di
notte, lontano da una fiamma, si gela*, e il «lontano» erano tre tasselli.
Adesso, dentro una stanza, un fuoco acceso in un punto qualsiasi la scalda
tutta. Non è «al chiuso non si gela»: una capanna senza fuoco è una capanna
fredda, e regalare il tepore toglierebbe al falò il mestiere che ha da M1.
Quello che cambia è la portata — ed è esattamente la differenza fra stare
vicino a un fuoco e avere una stanza con un fuoco dentro.

**Non ti vedono attraverso i muri.** Fino a qui la percezione guardava solo la
distanza, e nessuno se ne accorgeva perché gli unici muri stavano lontano da
dove si vive. Con i muri che si costruiscono sarebbe stata la prima cosa a
saltare all'occhio.

**Il chiasso invece passa**, ed è una decisione. Dietro un muro non sei
invisibile: sei irraggiungibile. Spaccare legna di notte dentro casa chiama
comunque qualcuno alla porta. Prima il chiasso decideva *se* ti trovavano,
adesso decide *dove* — ed è tutto quello che serviva perché una parete sia una
questione di geometria e non un numero in più.

## La mappa di strada

Il pilastro ha due metà: **un posto in cui investi** e **un mondo che se lo
riprende**. Vanno costruite in tensione fra loro, non una dopo l'altra. Ogni
tappa aggiunge o una ragione per investire, o una forza che si riprende
quello che hai investito — perché se arrivano prima tutte le une e poi tutte
le altre, per mezzo progetto il gioco non è quello che dice di essere.

Da qui viene l'ordine, che non è quello immaginato all'inizio:

| | | |
|---|---|---|
| **M2** | I bisogni | Fame, sete, stanchezza. Il corpo è la prima cosa che si consuma, e il tempo diventa una risorsa. |
| **M3** | L'orto | Semini, innaffi, torni dopo giorni. La prima cosa tua. |
| **M4** | Stagioni e decadimento | Le colture muoiono fuori stagione, quello che lasci si degrada. *Qui il gioco diventa ciò che dice di essere.* |
| **M5** | Il corpo e la morte | Salute, freddo, morte con una causa; il nuovo superstite nella stessa valle, col cadavere del precedente. |
| **M6** | Gli infetti | Chiasso, inseguimento, combattimento, ferite e infezione. La notte da scomoda a pericolosa. |
| **M6.5** | Quello che la valle dà | La raccolta segue le stagioni, quello che prendi ricresce, il fuoco cucina. *Qui l'orto smette di essere facoltativo.* |
| **M6.6** | La mappa | `TAB` apre quello che hai visto. L'esplorare lascia un segno. |
| **M6.7** | Il suono | Il colpo si sente, e la notte si ascolta. *Qui il chiasso smette di essere un numero.* |
| **M7.1** | I contenitori | La cassa, e con essa il cibo che si guasta. *Il terreno smette di essere una dispensa eterna.* |
| **M7.2** | Le rovine | Le case di chi c'era prima, e dentro quello che non si sono portati via. *Qui la mappa comincia a servire.* |
| **M7.3** | La fattoria e il paese | Si comincia da una fattoria in rovina, e da qualche parte c'è un paese. *Qui l'apertura di questo file smette di essere una promessa.* |
| **M7.4** | Il banco da lavoro | Le ricette diventano due elenchi, e l'accampamento comincia a valere qualcosa. *Qui il menu smette di avere un tetto.* |
| **M7.5** | Riparo e muri | Muri e porte che si costruiscono, infetti che li sfondano, e il calore che al chiuso resta dentro. *Qui quello che costruisci comincia a difenderti.* |
| **M7.6** | L'acqua e la pesca | Il secchio, la riva, la lenza: un cibo che non viene dall'orto e non scappa. |
| **M7.7** | Il cielo | Pioggia, neve e aridità. *Qui la stagione smette di essere una cosa che succede ai cambi e diventa una cosa che succede ogni giorno.* |
| **M7.8** | L'usura | Gli attrezzi si consumano, si riparano, e non tornano nuovi. *Qui l'ascia smette di essere una cosa che si trova una volta sola.* |
| **M7.9** | La caccia | Fauna nelle praterie, e carcasse da macellare per carne e pelli. *Qui la valle smette di dare soltanto quello che sta fermo.* |
| **M7.10** | La fatica | Le azioni costano stamina, il sonno rende in proporzione, e a zero si sviene. |
| **M7.11** | I piccoli luoghi | Carri rovesciati, pozzi, accampamenti bruciati: le tracce di chi passava di qui. |
| **M7.12** | La pelliccia addosso | Le pelli diventano qualcosa che si porta, e nasce l'addosso. *Qui il freddo diventa una distanza invece di un muro.* |
| **M7.13** | Il morale | Quanto tieni al tuo posto — che a quel punto esiste. |
| **M8** | Superstiti, abilità, rifinitura | |

Le tappe con un numero in più — M7.5.1, M7.7.1, M7.8.1, M7.9.1, M7.9.2, M7.11.1 —
non stanno qui di proposito: sono correzioni e aggiunte piccole, e questa tabella
racconta l'arco, non il registro. Hanno una sezione loro in cima a questo file.

**Perché la morte così tardi.** Morire conta in proporzione a quanto hai da
perdere: prima dell'orto e delle stagioni non avresti perso niente.

**M6.5 sta fra due tappe e non è un ripensamento.** M7 è stata rimandata per
guardare indietro: dei sistemi già in piedi, la catena del cibo era l'unico
che nessun altro aveva mai messo sotto pressione. La valle nutriva identica in
ogni mese, quindi l'orto e le stagioni non pagavano; e niente ricresceva,
quindi il mondo non si riprendeva nulla — subiva. Nessuna delle due è una
funzione mancante: sono due sistemi esistenti che non facevano il loro
mestiere, ed è il genere di debito che conviene pagare prima di costruirci
sopra.

**M5 si è ristretta, e M6 ha raccolto quasi tutto.** M5 doveva portare anche
ferite, infezione e morale: ferite e infezione sono arrivate qui, con gli
infetti, perché è qui che hanno una causa. Il motivo è lo stesso che ordina
tutta la scala — un sistema che non risponde a nessuna domanda è peggio di un
sistema che manca.

**Il morale è passato a M7**, e non è un rinvio: è il posto giusto. Quello
che il morale può misurare in questo gioco è quanto tieni al tuo posto — un
fuoco acceso, un orto curato, un letto — e quel posto comincia a esistere
davvero con la costruzione. Un morale oggi sarebbe un quarto numero che dice
"è notte e ti inseguono", cioè quello che schermo e orecchie dicono già.

Il suo numero però è cambiato due volte: da M5 a M7.6, e da M7.6 a M7.13. Non
perché slitti — ogni volta che toccava a lui è emerso qualcosa che aveva più
bisogno di esistere, l'acqua, il cielo, l'usura, la caccia. Il numero non è una
data, è una posizione in fila, e questa fila si è allungata dal di dentro.

**Il salvataggio stava fuori da questa scala** e si è incastrato qui, dopo le
stagioni: era il momento giusto, perché un posto che sparisce chiudendo la
scheda è tuo solo per una seduta, e l'orto e le stagioni valevano meno di
quanto valgono davvero.

Le tappe restanti sono volutamente abbozzate: l'ordine è già cambiato più
volte per quello che è emerso costruendo, e cambierà ancora. Si dettagliano
quando ci si arriva.

**Il debito riconosciuto è stato pagato, e non dove era in calendario.**
L'audio stava in M8 insieme alla rifinitura, ed era il posto sbagliato: non
mancava una rifinitura, mancava il pezzo di due sistemi già in piedi. Il colpo
si sentiva perché l'oggetto tremava — un ripiego accettato e scritto come tale
nel codice — e metà di M6 era un sistema di rumore che il giocatore non poteva
udire: sapeva di aver fatto chiasso perché aveva corso, non perché l'avesse
sentito, e quando ne arrivava uno dal buio l'unico avviso era un esclamativo in
alto a sinistra.

È lo stesso motivo che aveva fatto nascere M6.5 fra due tappe: **un sistema che
non fa il suo mestiere è un debito che conviene pagare prima di costruirci
sopra**, e costruirci sopra era esattamente quello che M7 stava per fare.

**Le rovine vengono prima dei muri, e non è un salto di fila.** M7.2 doveva
essere «riparo e muri», cioè costruirli. Ma una casa in rovina è fatta di muri:
questa tappa consegna già il tassello del muro, la sua collisione e il suo
disegno, e costruirne uno diventa *fare quello che facevano loro* invece di
inventare un oggetto nuovo. Un muro che esiste nel mondo prima di poterlo
alzare è un muro che si è già capito a cosa serve.

**E M7 si è divisa**, per la ragione che ha diviso anche le altre: i
contenitori non erano un pezzo della costruzione fra gli altri, erano la
condizione di un debito scritto tre volte nel progetto. Farli da soli li fa
arrivare con la cosa che sbloccano — il guasto — invece che in mezzo a muri e
riparo, dove sarebbero stati una cassa in più da costruire. Il morale resta per
ultimo e non è un rinvio: quello che può misurare è quanto tieni al tuo posto,
e un posto con dentro una cassa e niente altro è ancora un accampamento.

## Comandi

| | |
|---|---|
| `W A S D` o frecce | camminare |
| `Maiusc` | correre |
| `Spazio` | agire su ciò che si ha davanti: colpire, raccogliere, zappare, seminare, innaffiare, bere, dormire, posare, aprire una cassa o una porta, frugare un cadavere, difendersi |
| `1`-`8` | scegliere la casella, cioè cosa si impugna |
| `E` | mangiare, fasciarsi con una benda, o indossare quello che hai in mano; a mani vuote, togliere quello che hai addosso |
| `G` | posare per terra la casella scelta, davanti ai piedi |
| `C` | aprire e chiudere le costruzioni, e chiudere la cassa |
| `X` | staccare la porta che si ha davanti, e smontare la cassa aperta |
| `frecce` | dentro le costruzioni e la cassa: scegliere |
| `M` | accendere e spegnere la minimappa |
| `TAB` | la mappa di quello che hai visto |
| `V` | il volume: muto, piano, forte |
| `P` | la partita: `1`-`4` la casella, `A` `D` il modo, `F` e `I` il file, `RETE` per la sincronia |
| `F3` | diagnostica |

Si agisce su quello che si ha **davanti**, non sotto i piedi: è anche l'unico
modo di posare un falò senza restarci dentro.

Gettare sta su un tasto suo e non sulla barra perché la barra è già contesa
da otto azioni che dipendono dal contesto: con la zappa in mano davanti a un
prato la barra zappa, e non ci sarebbe verso di posare la zappa. Quello che
si getta resta per terra come un mucchio, si vede da lontano per quello che
contiene e si riprende con la barra. **Niente sparisce**: quello che non sta
nello zaino finendo un raccolto cade accanto invece di andare perso.

I comandi su schermo per il telefono arrivano più avanti, ma il gioco non parla
mai di tasti: chiede a `motore/comandi.js` se si sta andando avanti. È l'unico
file da toccare quel giorno.

## Il mondo è infinito, e non è circolare

Non c'è niente di pre-generato e non ci sono confini: ogni tassello è una
funzione pura delle sue coordinate e del seme. Sondato a coordinate assurde
regge — a mille miliardi di tasselli dall'origine il terreno è ancora terreno
e le proporzioni sono quelle dichiarate.

**Non si torna mai al punto di partenza.** C'è però un dettaglio vero a metà:
il mattone di tutta la casualità è `impronta(x, y, seme)`, che fa `x | 0`,
cioè aritmetica a 32 bit — quindi l'impronta è esattamente periodica ogni 2³²
tasselli, e `impronta(0, 0)` e `impronta(2³², 0)` danno lo stesso identico
numero.

Il terreno però non eredita quel periodo, per una fortuna di progetto: il
rumore non campiona le coordinate dei tasselli ma quelle divise per le scale
del paesaggio — 22 per le colline, 14 per l'umidità, 10 per i boschi, 4 per il
disturbo. Uno spostamento di 2³² diviso 22 non è intero, quindi cade fra i
punti del reticolo e non ci si allinea. Misurato su 400 punti: il terreno a
distanza 2³² coincide 131 volte, esattamente quanto coincide a una distanza
qualunque (123). Cioè non si ripete — coincide per caso come due posti
qualsiasi.

E anche se si ripetesse non sarebbe casa tua: le modifiche sono indicizzate
sulle coordinate esatte, quindi ci si troverebbe una valle dall'aspetto
identico e del tutto vergine.

Per arrivare dove la matematica a 32 bit comincia a sfilacciarsi servono
**ventitré anni veri di corsa senza fermarsi**.

## L'indirizzo accetta quattro parametri

`?seme=ombra` apre una valle diversa. Il seme è un testo qualsiasi e la stessa
parola dà sempre la stessa valle, quindi una valle che piace si condivide
copiando l'indirizzo. `?ora=22` comincia la partita a quell'ora, perché
aspettare quindici minuti veri per vedere com'è la notte è il modo migliore
per non guardarla mai. `?giorno=9` comincia d'inverno, ed è lo stesso motivo
applicato all'anno: le stagioni cadono sui giorni 1, 5, 9 e 13, e aspettare
di arrivarci è il modo migliore per non vederci mai una stagione fuori dalla
prima.
`?diagnostica` accende il pannello dei numeri.

## Com'è fatto

Le dipendenze vanno in una sola direzione, e non si invertono mai:

```
arte/  motore/          non sanno nulla del gioco
   ↑
mondo/  entita/         conoscono il motore, non l'interfaccia
   ↑
regole/                 le regole del gioco: tempo, cose, zaino, azioni
   ↑
interfaccia/            disegna lo stato, non lo cambia
   ↑
gioco.js                orchestra, possiede il DOM
```

**`arte/`** — La tavolozza, gli sprite, le voci e le piante. Uno sprite è un array di
stringhe, una per riga di pixel, un carattere per colore: si legge a occhio, si
modifica in un editor di testo e in git il diff mostra quali righe di pixel sono
cambiate. Una voce (`voci.js`) è la stessa idea per le orecchie — una manciata
di numeri invece di un file audio — e per la stessa ragione.
`sprite.js` li cuoce una volta sola in canvas fuori schermo, perché disegnare
pixel per pixel a ogni fotogramma costerebbe quanto tutto il resto del gioco.
La tavolozza è un parametro e non una costante: lo stesso sprite cotto con
tavolozze diverse darà le stagioni senza ridisegnare niente.

Le transizioni fra terreni sono **maschere**: stessa notazione, ma "x" vuol
dire «qui prendi il pixel del vicino». Una maschera è pura forma e non sa nulla
di colore, ed è per questo che ne bastano otto per tutte le coppie di terreni
invece di servirne una per combinazione. A mano ne esistono solo due — il lato
nord e l'angolo nord-ovest — e le altre sei si ottengono ruotandole.

**`motore/`** — I dispositivi d'uscita e la casualità. `suono.js` sta qui e non
in `arte/` per la stessa ragione per cui ci sta `schermo.js`: possiede
l'`AudioContext` come l'altro possiede il canvas, e non sa niente del gioco —
gli si passa una voce e la costruisce.

Lo schermo lavora a 384x216 pixel fissi e non sa quanto sia
grande la finestra; la scala è sempre un numero intero, anche a costo di due
bande nere, perché una scala frazionaria fa alcune righe di pixel più spesse
delle altre. Il ciclo aggiorna a passo fisso e disegna quando capita, senza
interpolare: con la camera arrotondata al pixel, interpolare darebbe tremolio e
non fluidità. `casuale.js` è un generatore seminato più un rumore di valore
scritto a mano — nel gioco non esiste `Math.random`.

**`mondo/`** — `rovine.js` è la maglia: celle di 64 tasselli, tre impronte per
cella, e una memoria di quelle già risolte. Non sa cosa siano un muro o una
cassa — restituisce il carattere della pianta e lascia tradurre a
`generazione.js`, dove vive il vocabolario dei tasselli. Non è pudore: è la
ragione per cui fra i due file non c'è un ciclo.

La valle non viene creata, viene calcolata: ogni tassello è una
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

Un'entità non sa cos'è la paura, il rumore o il danno: sono regole, e le
entità stanno sotto le regole. L'infetto riceve dall'alto due campi — chi
inseguire e dove andare a guardare — e in cambio alza una bandierina quando
il colpo va a segno; chi la raccoglie decide quanto costa. È la stessa
divisione per cui il superstite non sa cosa sia uno zaino e si fa dire cosa
ha in mano.

**`regole/`** — Il gioco come regole, senza sapere né come si disegna né come
si preme un tasto. `tempo.js` è l'orologio e la curva della luce; `oggetti.js`
il catalogo di cosa esiste e cosa rende; `inventario.js` lo zaino;
`ricette.js` cosa si costruisce; `azioni.js` il gesto che collega il giocatore
al mondo.

`contenitori.js` non reimplementa l'impilamento: una cassa tiene le cose
esattamente come le tiene lo zaino, quindi chiama le stesse due funzioni di
`inventario.js`, che lavorano su una fila di caselle qualsiasi. Quello che il
modulo aggiunge è soltanto dove sta quella fila — dentro le modifiche del
tassello, come la roba di un cadavere e il contenuto di un mucchio.

`chiasso.js` e `udito.js` sono gemelli e il nome lo dice: quanto lontano ti si
sente, e quanto lontano senti. Sentire è una regola e non un dettaglio del
motore — un'entità non sa cos'è la paura, il rumore o il danno, e non sa
nemmeno di fare rumore camminando: alza il piede, e chi guarda dall'alto decide
cosa se ne sente. È la stessa divisione per cui il superstite non sa cos'è uno
zaino e si fa dire cosa ha in mano.

**Quello che si impugna** non è disegnato accanto al superstite ma **composto
con lui** in un'unica figura, cotta una volta e tenuta in cache per direzione,
fotogramma e oggetto. Sono poche combinazioni, quindi disegnare il superstite
con l'ascia in mano costa quanto disegnarlo a mani nude: una `drawImage`.
Comporre invece di sovrapporre risolve due cose da sé — la profondità, che
diventa solo l'ordine dei due disegni (di spalle l'oggetto va dietro), e lo
specchiamento, perché la direzione destra riflette la figura già composta e
non serve calcolare l'aggancio allo specchio.

Serve un solo punto d'aggancio per direzione e non uno per fotogramma: nello
sprite del superstite il busto è identico nei quattro fotogrammi di una
direzione — cambiano solo le gambe — quindi camminando la mano non si muove.

**La minimappa scorre invece di rifarsi.** Calcolare il terreno dei 4096
tasselli che inquadra costa quasi trenta millisecondi, cioè due fotogrammi:
rifarla a ogni fotogramma è impensabile e rifarla a ogni passo si sentirebbe
come uno scatto. Quindi quando il giocatore cambia tassello i valori già noti
si spostano e si calcola solo la striscia appena entrata — una riga, due
centesimi di millisecondo. Continua a scorrere anche da spenta, perché
mantenerla costa pochissimo e ricostruirla da zero costa molto: riaccenderla
non deve far perdere un fotogramma.

Il cambio di stagione non la ricalcola affatto, ed è lo stesso conto che
rende economiche le stagioni nel mondo: la griglia tiene **quale** terreno
c'è, non di che colore è, quindi una stagione nuova rifà sette tinte e
ridipinge 4096 pixel invece di rivalutare 4096 tasselli di rumore. Una
ricostruzione sola per stagione, misurata contandole.

**`interfaccia/`** — L'interfaccia sta sul canvas e non nel DOM, al contrario
della diagnostica. Serve un font disegnato a pixel (`arte/sprite-testo.js`, 3x5),
perché il browser disegnerebbe qualunque font di sistema con l'antialiasing e
una scritta sfumata in mezzo alla pixel art si vede come una macchia.

Entità e oggetti della mappa espongono la stessa forma — `x`, `y`, `base`,
`sprite` — così chi disegna li ordina tutti insieme per la posizione dei piedi,
senza sapere chi è un albero e chi un superstite. È tutta la profondità che
serve a una vista dall'alto 3/4.

**Il mondo che cambia.** Fino a M0 la valle era solo calcolata, il che è
prezioso — niente da generare in anticipo, nessun confine — ma da solo la
rende immutabile, e un survival in cui l'albero abbattuto ricresce appena
giri lo sguardo non è un survival. `mondo/modifiche.js` tiene le eccezioni:
solo i tasselli che il giocatore ha toccato, mentre tutto il resto continua a
venire dalla generazione. È anche ciò che renderà piccolo il salvataggio —
si scrive quella mappa, non il mondo.

**I colpi non ricuociono il settore.** Un albero a metà abbattimento è ancora
lo stesso albero: il contatore dei colpi si annota senza invalidare il
disegno, e il settore si ricuoce solo quando l'oggetto cambia davvero.
Ricuocere duecentocinquantasei tasselli per aggiornare un numero era spreco,
ma soprattutto cancellava ogni stato temporaneo — cioè rendeva impossibile
far tremare l'albero colpito.

**Il buio.** Non si disegna direttamente sullo schermo: si stende su un telo
a parte, ci si ritagliano sopra le luci con `destination-out`, e solo alla
fine il telo finisce sul gioco. Facendolo direttamente si cancellerebbe anche
il gioco sotto, invece che solo il buio. La notte non arriva mai a nero pieno:
un nero assoluto non è notte, è schermo spento.

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

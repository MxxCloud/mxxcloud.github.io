// Le cose: cosa sono, cosa rendono, quanto costa staccarle dal mondo.

import { OGGETTO } from "../mondo/generazione.js";
import * as cacciaArte from "../arte/sprite-fauna.js";
import * as arte from "../arte/sprite-cose.js";
import * as impugnati from "../arte/sprite-impugnati.js";
import * as ortoArte from "../arte/sprite-orto.js";

// Gli identificatori sono testo e non numeri di proposito: finiranno nei
// salvataggi, e un salvataggio che dice "legna" sopravvive a un riordino del
// catalogo, mentre uno che dice 3 no.
//
// "dura" è quanti giorni una cosa resta buona. Ce l'ha solo il cibo: il legno
// e la pietra non si guastano, e dare loro una scadenza vorrebbe dire che una
// partita lunga è un lavoro di manutenzione invece di una partita.
//
// Per sei tappe non l'ha avuta nessuno, e il README diceva perché: far
// marcire il cibo mentre il terreno era una dispensa eterna avrebbe insegnato
// soltanto a usare il terreno come dispensa. Adesso c'è la cassa, quindi il
// debito si può pagare.
export const CATALOGO = {
  carne_cruda: { nome: "Carne cruda", icona: cacciaArte.CARNE_CRUDA, pila: 10,
    commestibile: { fame: 0.15 }, cuoce: "carne_arrostita", dura: 2 },
  carne_arrostita: { nome: "Carne arrostita", icona: cacciaArte.CARNE_ARROSTITA, pila: 10,
    commestibile: { fame: 0.45 }, dura: 4 },
  // La carne che aspetta. Nutre meno dell'arrostita e dura tre volte tanto, ed
  // è lo stesso baratto della conserva di bacche: tre carni crude valgono 0,45
  // e questa ne vale 0,35, cioè il 78% — esattamente la proporzione che sei
  // bacche già perdono diventando due conserve. Non è il cibo con cui si mangia
  // bene, è il cibo con cui si arriva a marzo, ed è il primo che viene dalla
  // caccia invece che dall'orto.
  carne_secca: { nome: "Carne secca", icona: cacciaArte.CARNE_SECCA, pila: 20,
    commestibile: { fame: 0.35 }, dura: 12 },
  pelle: { nome: "Pelle", icona: cacciaArte.PELLE, pila: 20 },
  // Il capo, e non la spoglia. Sono due cose per una ragione che non è di
  // vocabolario ma di economia: la pelle è già una valuta — tre vanno nel
  // giaciglio — e indossarla grezza vorrebbe dire risolvere l'inverno con un
  // cervo, cioè meno di quanto costasse la torcia a cui il calore è stato
  // appena tolto. Qui vale la grammatica di tutto il resto: niente si usa
  // grezzo, la pietra diventa muro e la pelle diventa pelliccia.
  //
  // "addosso" è insieme gli effetti e il predicato "si indossa". Una cosa
  // sola da guardare, come "posa" per quello che si mette per terra.
  pelliccia: {
    nome: "Pelliccia", icona: cacciaArte.PELLICCIA, pila: 1,
    addosso: { gradiniFermi: true, pioggia: 0.55 },
  },
  canna: { durata: 20, serve: ["pesca"], nome: "Canna da pesca", icona: arte.CANNA, pila: 1,
    impugnato: { nome: "canna", righe: impugnati.CANNA, scartoY: 3 } },
  pesce_crudo: { nome: "Pesce crudo", icona: arte.PESCE_CRUDO, pila: 10,
    commestibile: { fame: 0.18 }, cuoce: "pesce_arrostito", dura: 2 },
  pesce_arrostito: { nome: "Pesce arrostito", icona: arte.PESCE_ARROSTITO, pila: 10,
    commestibile: { fame: 0.4 }, dura: 4 },
  // Il pesce che aspetta, ed è la carne secca del fiume. Il numero non è
  // scelto a occhio: seccare vale il 78% di arrostire, che è la proporzione
  // già scritta nella carne (0,45 arrostita → 0,35 secca) e nelle conserve.
  // Applicata al pesce arrostito, 0,4 × 0,78 fa 0,31, cioè tre decimi.
  //
  // Meno della carne secca di proposito, e non per sfregio al pesce: pescare
  // non ti carica addosso un orso. Il cibo che si prende senza rischio non può
  // conservarsi meglio di quello che te lo fa correre.
  pesce_secco: { nome: "Pesce secco", icona: arte.PESCE_SECCO, pila: 20,
    commestibile: { fame: 0.3 }, dura: 12 },
  legna: { nome: "Legna", icona: arte.LEGNA, pila: 40 },
  ramo: { nome: "Ramo", icona: arte.RAMO, pila: 40 },
  pietra: { nome: "Pietra", icona: arte.PIETRA, pila: 40 },
  fibra: { nome: "Fibra", icona: arte.FIBRA, pila: 60 },
  // L'unico cibo che esiste, il che rende i cespugli improvvisamente
  // preziosi. Fino a M3 non ce ne sarà altro: l'orto è la risposta a questa
  // scarsità, non un contorno.
  bacche: {
    nome: "Bacche",
    icona: arte.BACCHE,
    pila: 20,
    commestibile: { fame: 0.3 },
    cuoce: "bacche_secche",
    // Tre giorni, cioè poco meno di una stagione: un cespuglio strappato a
    // settembre non attraversa l'inverno, ed è tutto il punto.
    dura: 3,
  },
  // La torcia serve in due modi, entrambi visibili: in mano illumina chi la
  // porta, piantata resta accesa dove l'hai lasciata.
  torcia: {
    nome: "Torcia",
    icona: arte.TORCIA,
    pila: 10,
    // Sessanta usi, uno ogni cinque secondi accesa: trecento secondi, cioè
    // la stessa giornata che dura una torcia piantata. Non è un attrezzo che
    // si smussa — è un bastone che brucia — quindi non compare fra le
    // riparazioni e a zero non resta in mano: finisce.
    durata: 60,
    posa: OGGETTO.TORCIA_PIANTATA,
    impugnato: { nome: "torcia", righe: impugnati.TORCIA, scartoY: 2 },
    luce: { raggio: 46, intensita: 0.9 },
  },
  ascia: {
    durata: 60,
    serve: ["raccolta", "combatti", "macella"],
    nome: "Ascia",
    icona: arte.ASCIA,
    pila: 1,
    // Più in basso della torcia: appesa al pugno, non issata accanto
    // all'orecchio.
    impugnato: { nome: "ascia", righe: impugnati.ASCIA, scartoY: 5 },
  },
  zappa: {
    durata: 40,
    serve: ["zappa"],
    nome: "Zappa",
    icona: arte.ZAPPA,
    pila: 1,
    impugnato: { nome: "zappa", righe: impugnati.ZAPPA, scartoY: 5 },
  },
  // Vuoto e pieno sono due cose distinte invece di un secchio con un livello
  // dentro: lo zaino tiene coppie cosa-quantità e non stati, e due icone
  // diverse si leggono meglio di un numero.
  secchio: { nome: "Secchio", icona: arte.SECCHIO, pila: 4 },
  // Si beve. Sembra ovvio e per sei tappe non lo è stato: si poteva avere
  // l'acqua in mano e dover tornare al lago per bere, che è il genere di
  // assurdità che si nota solo giocando.
  //
  // Un secchio è un secchio e non una borraccia: una bevuta e torna vuoto.
  // "Diventa" serve proprio a questo — la casella non si svuota, cambia
  // contenuto — e servirà a qualunque contenitore arrivi dopo.
  secchio_pieno: {
    nome: "Secchio pieno",
    icona: arte.SECCHIO_PIENO,
    pila: 4,
    commestibile: { sete: 0.5 },
    diventa: "secchio",
  },
  // I semi della rapa. L'identificatore resta "semi" perché è quello scritto
  // in ogni salvataggio da M3 in poi; il nome è cambiato perché adesso di semi
  // ce ne sono tre, e "Semi" non diceva più quali.
  semi: { nome: "Semi di rapa", icona: arte.SEMI, pila: 40 },
  // Sfama il doppio delle bacche: è il senso dell'orto, e senza questo
  // divario coltivare sarebbe un passatempo invece di una risposta alla fame.
  rapa: {
    nome: "Rapa",
    icona: arte.RAPA,
    pila: 20,
    commestibile: { fame: 0.6 },
    cuoce: "rapa_arrostita",
    // Il doppio delle bacche, ed è giusto: è una radice, e una radice si
    // tiene. Sei giorni sono una stagione e mezza — un raccolto d'autunno
    // arriva all'inverno, ma non lo attraversa tutto.
    dura: 6,
  },
  // I due cibi cotti. Non sono una dispensa — quella vuole i contenitori, che
  // sono della tappa della costruzione — sono lo stesso raccolto che vale
  // quasi il doppio, ed è questo a far passare l'inverno. Il fuoco guadagna
  // il terzo mestiere dopo la luce e il calore, e con esso una ragione per
  // tornare all'accampamento: che è anche il posto in cui di notte non ti
  // trovano.
  // Arrostire e seccare erano la stessa mossa — metti sul fuoco, vale di più
  // — e con il guasto diventano due mosse opposte, senza che sia stato
  // aggiunto niente: è quello che i due cibi già dicevano di essere.
  //
  // Arrostire raddoppia il valore e dimezza la durata: si cuoce quello che si
  // sta per mangiare. Due giorni sono meno di una rapa cruda, e non è una
  // punizione — è quello che fa una cosa cotta.
  rapa_arrostita: {
    nome: "Rapa arrostita",
    icona: arte.RAPA_ARROSTITA,
    pila: 20,
    commestibile: { fame: 1 },
    dura: 2,
  },
  // --- le colture di M7.17 ------------------------------------------------
  //
  // La patata è la scorta: cruda sfama poco — è una patata cruda — e dura due
  // settimane, cioè attraversa l'inverno intero in fondo allo zaino. Ed è
  // anche il suo seme: una patata piantata ne rende tre, quindi ogni patata
  // mangiata è una pianta in meno.
  //
  // Cotta vale sei decimi, e il numero è misurato. A sette, su sei tasselli e
  // un anno di stagioni buone, la patata rendeva 0,23 di fame al giorno per
  // tassello contro gli 0,17 della rapa, e durando il doppio: sarebbe stata
  // meglio in tutto, cioè l'unica scelta. A sei rende 0,2 — un po' più della
  // rapa, perché è più lenta e non si semina d'autunno — e resta la scorta.
  patata: {
    nome: "Patata",
    icona: arte.PATATA,
    pila: 20,
    commestibile: { fame: 0.3 },
    cuoce: "patata_arrostita",
    dura: 14,
  },
  patata_arrostita: {
    nome: "Patata arrostita",
    icona: arte.PATATA_ARROSTITA,
    pila: 20,
    commestibile: { fame: 0.6 },
    dura: 2,
  },
  // I fagioli crudi non sono un pasto, e dirlo col numero basta: un quarto di
  // una rapa. Cotti valgono la metà di un pasto l'uno, e tre per pianta fanno
  // la coltura che rende di più. Seccati all'essiccatoio fanno quello che fa
  // la carne: tre diventano una manciata che dura un anno e sfama meno, lo
  // stesso settantotto per cento che la carne perde seccando.
  fagioli: {
    nome: "Fagioli",
    icona: arte.FAGIOLI,
    pila: 30,
    commestibile: { fame: 0.15 },
    cuoce: "fagioli_cotti",
    dura: 6,
  },
  fagioli_cotti: {
    nome: "Fagioli cotti",
    icona: arte.FAGIOLI_COTTI,
    pila: 20,
    commestibile: { fame: 0.5 },
    dura: 2,
  },
  fagioli_secchi: {
    nome: "Fagioli secchi",
    icona: arte.FAGIOLI_SECCHI,
    pila: 20,
    commestibile: { fame: 0.35 },
    dura: 16,
  },
  // Il cavolo non si cuoce da solo: si mangia crudo, o va nella zuppa. Dura
  // più della rapa perché è una testa di foglie strette, e il suo mestiere è
  // un altro — d'inverno non muore nel campo (vedi colture.js).
  cavolo: {
    nome: "Cavolo",
    icona: arte.CAVOLO,
    pila: 10,
    commestibile: { fame: 0.6 },
    dura: 8,
  },
  semi_cavolo: { nome: "Semi di cavolo", icona: arte.SEMI_CAVOLO, pila: 40 },
  // La cenere dei fuochi, che sul campo è concime (vedi orto.js). Non si
  // guasta: è già quello che resta quando qualcosa ha finito di guastarsi.
  cenere: { nome: "Cenere", icona: arte.CENERE, pila: 20 },
  // Lo spaventapasseri si posa accanto all'orto, e di notte le bestie non si
  // avvicinano a tre tasselli da lui (vedi orto.js).
  spaventapasseri: { nome: "Spaventapasseri", icona: arte.SPAVENTAPASSERI_ICONA, pila: 2, posa: OGGETTO.SPAVENTAPASSERI },
  semi_lino: { nome: "Semi di lino", icona: arte.SEMI_LINO, pila: 40 },
  // Il filo è quello che il lino rende, ed esiste per non essere fibra: la
  // fibra si strappa ai cespugli, il filo si coltiva. Cuce quello che la fibra
  // non sa tenere — bende, lenze, pelli — e nelle altre ricette vale come
  // fibra, una per una (vedi ricette.js). Non brucia nel fuoco: sarebbe
  // buttare un campo per fare quello che fanno due rami.
  filo: { nome: "Filo di lino", icona: arte.FILO, pila: 60 },
  // La zuppa: due scodelle da una verdura, un cavolo e un secchio d'acqua,
  // sul fuoco (vedi ricette.js). Sfama più di quanto sfamerebbero i due
  // ingredienti cotti ciascuno per conto suo, e toglie anche un po' di sete:
  // è acqua. Non si tiene — due giorni, come ogni cosa cotta.
  zuppa: {
    nome: "Zuppa",
    icona: arte.ZUPPA,
    pila: 10,
    commestibile: { fame: 0.9, sete: 0.25 },
    dura: 2,
  },
  // Seccare invece è conservare, ed è l'unica cosa nel gioco che dura più di
  // una stagione. Nutre meno di una rapa arrostita e vale il triplo delle
  // bacche da cui viene: non è il cibo con cui si mangia bene, è il cibo con
  // cui si arriva a marzo. Il falò guadagna qui il suo quarto mestiere, e non
  // è stato aggiunto nessun oggetto per dirlo.
  bacche_secche: {
    nome: "Bacche secche",
    icona: arte.BACCHE_SECCHE,
    pila: 20,
    commestibile: { fame: 0.45 },
    dura: 10,
  },
  giaciglio: {
    nome: "Giaciglio",
    icona: arte.GIACIGLIO,
    pila: 3,
    posa: OGGETTO.GIACIGLIO,
  },
  // Il primo uso delle pelli, e il primo letto che si sceglie invece di
  // subirlo. Si impila a due e non a tre come quello di paglia: costa quattro
  // volte tanto, e portarsene dietro una scorta vorrebbe dire non aver capito
  // che serve dove dormi.
  giaciglio_pelli: {
    nome: "Giaciglio di pelli",
    icona: arte.GIACIGLIO_PELLI,
    pila: 2,
    posa: OGGETTO.GIACIGLIO_PELLI,
  },
  // Il falò. Si chiama "spento" e si posa spento, ed è la stessa frase del
  // focolare detta per il fuoco da viaggio: quello che porti nello zaino è la
  // fossa — tre pietre e due legni incrociati — e il fuoco lo accendi dove ti
  // fermi, con la legna che hai addosso.
  //
  // Prima era il contrario, e il buco si vedeva a contarlo: si posava acceso,
  // bruciava due giorni, lasciava cenere, e la cenere si raccoglieva ed era di
  // nuovo un falò. Tre legna pagate una volta sola e fuoco per sempre.
  falo: { nome: "Falò spento", icona: arte.FALO_ICONA_SPENTO, pila: 5, posa: OGGETTO.FALO_SPENTO },
  // Il focolare. Si impila a uno, meno della cassa e del banco, e la ragione è
  // la stessa portata all'estremo: pesa dieci pietre, sta solo al chiuso, e di
  // focolari in una casa ce n'è uno. Portarsene dietro due vorrebbe dire non
  // aver capito che cos'è.
  //
  // Si posa SPENTO, ed è la riga che dice cos'è: un camino è pietra, e la
  // pietra non arriva già accesa. Le dieci pietre comprano il posto dove sta
  // il fuoco; il fuoco si compra ogni volta, una legna alla volta.
  focolare: { nome: "Focolare", icona: arte.FOCOLARE, pila: 1, posa: OGGETTO.FOCOLARE_SPENTO },
  // L'essiccatoio. Si impila a uno come il focolare, e per la stessa ragione:
  // quello che conta è dove lo metti, e una fattoria ne ha uno. Si posa vuoto,
  // che qui non è una scelta ma l'unico stato che abbia senso avere in mano.
  essiccatoio: { nome: "Essiccatoio", icona: arte.ESSICCATOIO, pila: 1, posa: OGGETTO.ESSICCATOIO },
  // La cassa è il primo posto tuo che non sia il terreno. Si impila a tre
  // perché portarsene dietro una scorta non ha senso: quello che conta di una
  // cassa è dove la metti, e una volta messa non la sposti più.
  cassa: { nome: "Cassa", icona: arte.CASSA_ICONA, pila: 3, posa: OGGETTO.CASSA },
  // Il banco da lavoro: la prima cosa che si posa e che non serve a essere
  // usata, ma a stare lì. È quello che trasforma un accampamento in un posto
  // in cui si può fare qualcosa che altrove non si può.
  banco: { nome: "Banco", icona: arte.BANCO_ICONA, pila: 2, posa: OGGETTO.BANCO },
  // Il muro. Si impila a venti perché è l'unica cosa che si posa a decine: un
  // recinto attorno a un orto sono venti tasselli, e doverne fare quattro
  // viaggi renderebbe il costruire una faccenda di gestione dello zaino.
  //
  // È il muro delle rovine, lo stesso identico tassello: il disegno, la
  // solidità e i cinque colpi per abbatterlo esistono dal M7.2. Qui si dice
  // soltanto che adesso può posarlo anche il superstite.
  muro: { nome: "Muro", icona: arte.MURO_ICONA, pila: 20, posa: OGGETTO.MURO },
  // La porta si impila a tre come la cassa, e per la stessa ragione: quello
  // che conta è dove la metti. Un recinto ha un ingresso, non cinque.
  porta: { nome: "Porta", icona: arte.PORTA_ICONA, pila: 3, posa: OGGETTO.PORTA },
  // La lancia. Colpisce meno di un'ascia e arriva molto più lontano, ed è
  // tutta qui la scelta: tre colpi tenendolo a distanza, o due lasciandogli
  // dare il suo.
  lancia: {
    durata: 50,
    serve: ["combatti"],
    nome: "Lancia",
    icona: arte.LANCIA,
    pila: 1,
    impugnato: { nome: "lancia", righe: impugnati.LANCIA, scartoY: 7 },
  },
  // La conserva: il gradino più alto della dispensa.
  //
  // Dura un anno di gioco e sfama del tutto: un vaso riempie la fame da vuota.
  // Fino a M7.18.2 nutriva meno delle bacche che costava — due vasi 1,4 contro
  // 1,8 — e si faceva con la fibra, cioè il primo giorno. Da M7.18.3 sta al
  // secondo gradino come l'essiccatoio: il vaso si chiude col filo di lino, e
  // il filo va coltivato. Quello che costa adesso è il campo, non le bacche —
  // da M7.18.4 ne bastano quattro per due vasi — e allora il vaso può valere
  // quello che si è pagato per averlo.
  conserva: {
    nome: "Conserva",
    icona: arte.CONSERVA,
    pila: 10,
    commestibile: { fame: 1 },
    dura: 16,
  },
  // La benda è la risposta al morso, e fa due cose diverse: rimargina un po'
  // e toglie l'infezione. Non è cibo, quindi non sta fra i commestibili — ma
  // si usa con lo stesso tasto, perché "usa quello che hai in mano su di te"
  // era già la regola e inventarne un secondo tasto per lo stesso gesto
  // sarebbe un comando in più da imparare per niente.
  //
  // Di fibra fino a M7.18, e questo era metà del suo senso: la fibra era il
  // materiale meno interessante del gioco — due per una torcia e poi basta —
  // e diventava quello che tieni da parte per quando le cose vanno male. È lo
  // stesso trucco delle bacche a M2, e vale per la stessa ragione: una risorsa
  // esiste davvero solo quando c'è qualcosa che la consuma.
  //
  // Da M7.18.1 lo stesso trucco passa al filo, perché la fibra si era rivelata
  // troppo facile per fare da scorta: ce n'è un cespuglio ogni pochi passi.
  // Il filo si coltiva, e allora tenerlo da parte è di nuovo una scelta.
  benda: {
    nome: "Benda",
    icona: arte.BENDA,
    pila: 10,
    cura: { salute: 0.2, infezione: true },
  },
};

// A cosa serve un attrezzo, cioè quando lavora e quando si consuma.
//
// Non è un elenco di permessi: è la dichiarazione di che mestiere fa. La
// lancia è un'arma e basta — impugnarla per abbattere un albero non la rovina,
// perché con una lancia un albero non lo abbatte nessuno: si danno le stesse
// quattro manate che si darebbero a mani nude. Vale specularmente per la
// zappa, che di suo non è un'arma: menarla addosso a un infetto fa il danno di
// un pugno e non le costa niente, perché non è con quella che stai colpendo.
//
// È la regola generale detta in un dato invece che in tre "se": un attrezzo si
// consuma quando serve a quello che stai facendo, e in nessun altro momento.
export function attrezzoServe(cosa, scopo) {
  return CATALOGO[cosa]?.serve?.includes(scopo) ?? false;
}

// Cosa fa un attrezzo tenuto in mano. La regola del gioco è una sola —
// quello che impugni è quello che usi — e vale tanto per la torcia, che
// illumina, quanto per l'ascia, che abbatte in meno colpi.
export const ATTREZZI = {
  // L'ascia adesso fa due mestieri, ed è lo stesso mestiere: stacca. Tre di
  // danno contro i cinque punti di un infetto vuol dire due colpi invece di
  // cinque, cioè prenderne uno invece di tre. È quello che la trasforma da
  // attrezzo più veloce ad arma — senza aggiungere una spada, che avrebbe
  // voluto dire un secondo oggetto per un gesto che già esiste.
  ascia: { colpi: { [OGGETTO.ALBERO]: 2, [OGGETTO.CARRO]: 2, [OGGETTO.TRONCO]: 1 }, danno: 3 },
  // La zappa non accorcia niente: apre un'azione che senza di lei non
  // esiste. È il secondo modo in cui un attrezzo può contare.
  zappa: { zappa: true },
  // La lancia è il terzo modo: non accorcia un lavoro e non ne apre uno, ma
  // cambia da dove si fa. Due di danno contro i tre dell'ascia — cioè tre
  // colpi invece di due — e trentadue pixel di portata contro venti: due
  // tasselli, mentre il loro braccio ne arriva a poco più di uno. Chi ha una
  // lancia può colpire e fare un passo indietro; chi ha un'ascia deve stare
  // dentro il loro raggio per tutto il tempo.
  lancia: { danno: 2, portata: 32 },
};

// Quanti colpi servono davvero, tenuto conto di cosa si ha in mano. A mani
// nude restano quattro per un albero: l'attrezzo è una ricompensa, non un
// rattoppo a un numero sbagliato.
// Quanto fa male un colpo a qualcosa che si difende. A mani nude uno: si può
// combattere senza niente in mano, ma è il genere di scelta che si fa una
// volta sola.
const DANNO_A_MANI_NUDE = 1;

// Quanto lontano arriva un colpo normale. Vale a mani nude e con l'ascia:
// poco più del braccio di un infetto, che ne ha tredici. Chi impugna qualcosa
// deve poter colpire per primo, ma di un soffio.
const PORTATA_A_MANI_NUDE = 20;

export function dannoDi(cosaInMano) {
  return ATTREZZI[cosaInMano]?.danno ?? DANNO_A_MANI_NUDE;
}

// Da quanto lontano arriva un colpo. A mani nude e con quasi tutto il resto
// si deve stare addosso; con la lancia no, ed è l'unica cosa che fa.
export function portataDi(cosaInMano) {
  return ATTREZZI[cosaInMano]?.portata ?? PORTATA_A_MANI_NUDE;
}

export function colpiNecessari(oggetto, cosaInMano) {
  const raccolta = RACCOLTA[oggetto];
  if (!raccolta) return 0;
  return ATTREZZI[cosaInMano]?.colpi?.[oggetto] ?? raccolta.colpi;
}

export function nomeDi(cosa) {
  return CATALOGO[cosa]?.nome ?? cosa;
}

// Quanti colpi serve dare e cosa ne esce. I colpi non sono una tassa: sono
// ciò che rende l'abbattere un albero una decisione invece di un riflesso —
// e più avanti, quando ci sarà qualcosa che ti sente, anche un rischio.
export const RACCOLTA = {
  [OGGETTO.CARRO]: {
    verbo: "Smantella carro", colpi: 4, voce: "legno", scheggie: ["w", "h", "c"],
    resa: [{ cosa: "legna", quante: 3 }, { cosa: "fibra", quante: 2 }],
  },
  [OGGETTO.TRONCO]: {
    verbo: "Spacca tronco", colpi: 2, voce: "legno", scheggie: ["h", "d"],
    resa: [{ cosa: "legna", quante: 1 }],
  },
  [OGGETTO.ALBERO]: {
    verbo: "Abbatti",
    colpi: 4,
    // Chiavi della tavolozza e non colori scritti a mano: se un giorno la
    // chioma cambia tinta, cambiano anche le scheggie senza che nessuno se lo
    // debba ricordare.
    //
    // Sono volutamente più chiare dell'albero: legno vivo e foglia in luce.
    // Con i colori della chioma sparivano dentro la chioma, che è il modo più
    // sicuro di costruire un riscontro che non si vede.
    // Di che cosa è fatto, cioè come suona quando lo colpisci. Sta qui
    // accanto alle scheggie perché è la stessa dichiarazione fatta per
    // l'altro senso: quelle dicono di che colore vola via, questa di che
    // rumore fa. Un materiale e non una voce già pronta, così aggiungere un
    // oggetto è scrivere "legno" e non tarare un suono.
    voce: "legno",
    scheggie: ["w", "w", "k", "h"],
    resa: [
      { cosa: "legna", quante: 3 },
      { cosa: "ramo", quante: 1 },
    ],
  },
  [OGGETTO.SASSO]: {
    verbo: "Spacca",
    colpi: 2,
    voce: "pietra",
    scheggie: ["f", "s", "e"],
    resa: [{ cosa: "pietra", quante: 2 }],
  },
  // L'unico oggetto della valle la cui resa dipende dal mese, ed è giusto che
  // sia l'unico: il legno e la pietra non hanno stagioni, una bacca sì.
  //
  // Prima di questa tabella un cespuglio a gennaio dava bacche esattamente
  // come ad agosto, e la conseguenza non era estetica: si attraversava
  // l'inverno di sola raccolta, quindi l'orto era facoltativo e il raccolto
  // d'autunno era una collezione invece di una provvista — proprio il
  // contrario di quello che il resto del gioco dichiara.
  [OGGETTO.CESPUGLIO]: {
    verbo: "Strappa",
    colpi: 1,
    voce: "erba",
    scheggie: ["k", "a", "w"],
    resa: [
      // La fibra non ha finestra, e non per pigrizia: è stelo secco, ce n'è
      // in ogni mese, ed è l'unica cosa che la valle dà sempre. Da M6 vuol
      // dire che le bende restano possibili anche nell'inverno peggiore, che
      // è la differenza fra una stagione dura e un vicolo cieco.
      { cosa: "fibra", quante: 2 },
      // Le bacche maturano a fine estate e reggono l'autunno. D'inverno ne
      // resta un quarto: poco, non niente. Un muro alla prima invernata —
      // prima che il giocatore sappia cosa lo aspetta — sarebbe una regola
      // che toglie il gioco invece di complicarlo, e così invece si può
      // sopravvivere raccogliendo, ma costa quattro volte il cammino, al
      // freddo e col buio addosso.
      {
        cosa: "bacche",
        quante: 1,
        probabilita: { estate: 0.45, autunno: 0.34, inverno: 0.11, primavera: 0.14 },
      },
      // I semi vengono da quello che già si raccoglie: l'orto non nasce da un
      // oggetto trovato per caso ma da quello che hai strappato in giro. La
      // pianta va a seme quando ha finito di fiorire, quindi estate e
      // autunno; d'inverno niente, e non fa male perché d'inverno non si
      // semina comunque.
      {
        cosa: "semi",
        quante: 2,
        probabilita: { estate: 0.3, autunno: 0.3, inverno: 0, primavera: 0.15 },
      },
    ],
  },
  [OGGETTO.TORCIA_PIANTATA]: {
    verbo: "Raccogli",
    colpi: 1,
    voce: "fuoco",
    scheggie: ["u", "v"],
    resa: [{ cosa: "torcia", quante: 1 }],
  },
  // Di giorno si raccoglie, di notte ci si dorme: è azioni.js a decidere
  // quale dei due, in base all'ora. Un giaciglio che di notte si smonta
  // invece di accogliere sarebbe una trappola.
  [OGGETTO.GIACIGLIO]: {
    verbo: "Raccogli",
    colpi: 1,
    voce: "erba",
    scheggie: ["9", "a", "h"],
    resa: [{ cosa: "giaciglio", quante: 1 }],
  },
  [OGGETTO.GIACIGLIO_PELLI]: {
    verbo: "Raccogli",
    colpi: 1,
    voce: "erba",
    scheggie: ["c", "l", "h"],
    resa: [{ cosa: "giaciglio_pelli", quante: 1 }],
  },
  // Solo la coltura matura si raccoglie: strappare un germoglio darebbe
  // niente e toglierebbe il senso dell'aspettare. Gli stadi immaturi non
  // stanno qui apposta.
  //
  // Una rapa, e niente semi. Rendeva due rape e due semi, cioè ogni seme ne
  // ridava due insieme al cibo: l'orto cresceva da solo come un interesse
  // composto, e un tassello curato sfamava da solo — 0,67 di fame al giorno
  // contro gli 0,56 che se ne consumano. Adesso il cibo e i semi sono due
  // raccolti diversi dello stesso tassello, e bisogna scegliere.
  [OGGETTO.MATURA]: {
    verbo: "Raccogli",
    colpi: 1,
    voce: "erba",
    scheggie: ["y", "x", "5"],
    resa: [{ cosa: "rapa", quante: 1 }],
  },
  // La matura lasciata andare a seme: niente da mangiare, la radice è
  // diventata legno, ma tre semi — cioè tre tasselli per la prossima volta.
  // Uno ogni tre va lasciato qui per tenere l'orto com'è, e ogni seme in più è
  // un campo che si allarga.
  [OGGETTO.A_SEME]: {
    verbo: "Raccogli i semi",
    colpi: 1,
    voce: "erba",
    scheggie: ["v", "x", "g"],
    resa: [{ cosa: "semi", quante: 3 }],
  },

  // Un campo morto si ripulisce, e qualcosa rende: gli steli secchi sono
  // fibra. Non è un premio di consolazione da mettere in pari con il raccolto
  // — due rape non tornano — ma lasciare la terra guasta per sempre
  // trasformerebbe una stagione sbagliata in un pezzo di valle bruciato.
  [OGGETTO.APPASSITA]: {
    verbo: "Ripulisci",
    colpi: 1,
    voce: "erba",
    scheggie: ["9", "a", "g"],
    resa: [{ cosa: "fibra", quante: 1 }],
  },
  // Il focolare non sta qui, e nemmeno il banco, e nemmeno il falò: quello che
  // è tuo e si riprende intero non si abbatte a colpi, si prende con la X.
  // Questa tavola è il lavoro — alberi, sassi, muri di chi c'era prima — e
  // riprendersi una cosa propria non è lavoro, è ripensarci.
  //
  // I muri di chi c'era prima si abbattono, e rendono pietra.
  //
  // Cinque colpi, più di un albero: un muro è la cosa più solida della valle e
  // deve sembrarlo. L'ascia non aiuta — è fatta per il legno — e questo è
  // l'unico posto del gioco in cui avere l'attrezzo giusto non serve: la
  // pietra vorrebbe un piccone, e un piccone che non esiste non si finge.
  //
  // È anche l'unica fonte di pietra che non sia un sasso, e la pietra era
  // l'unica risorsa dichiarata finita del gioco. Una casa in rovina ne ha
  // dentro più di quanta se ne trovi in un giorno di cammino.
  [OGGETTO.MURO]: {
    verbo: "Abbatti",
    colpi: 5,
    voce: "pietra",
    scheggie: ["e", "f", "d"],
    resa: [{ cosa: "pietra", quante: 3 }],
  },
  // Le macerie si spalano via in un colpo. Ci si passa già sopra, quindi
  // toglierle non apre niente: rendono poco e servono a chi sta raccogliendo
  // pietra e non vuole passare cinque colpi su ogni muro.
  [OGGETTO.MURO_ROTTO]: {
    verbo: "Spala",
    colpi: 1,
    voce: "pietra",
    scheggie: ["e", "d"],
    resa: [{ cosa: "pietra", quante: 1 }],
  },

  // Una cassa si riprende, ma solo vuota, e a dirlo è azioni.js. Il motivo è
  // che una cassa piena sollevabile sarebbe uno zaino da dodici caselle: il
  // limite dello zaino è una delle poche cose che in un survival costringono
  // a scegliere, e un modo di aggirarlo lo cancellerebbe. Vuota invece si
  // sposta, perché sbagliare dove costruire deve costare fatica e non la
  // cassa.
  [OGGETTO.CASSA]: {
    verbo: "Raccogli",
    colpi: 1,
    voce: "legno",
    scheggie: ["w", "c", "h"],
    resa: [{ cosa: "cassa", quante: 1 }],
  },
};

export function raccoltaDi(oggetto) {
  return RACCOLTA[oggetto];
}

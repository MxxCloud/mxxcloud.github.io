// Le cose che si raccolgono, si costruiscono e si portano nello zaino.
//
// Le icone sono 12x12: entrano in una casella dello zaino con un margine, e
// restano leggibili a occhio anche quando la scala dello schermo è 2x. Più
// piccole diventerebbero macchie colorate, più grandi non ci starebbero in
// otto sulla barra.

export const LEGNA = [
  "............",
  "............",
  ".rrrrrrrrrr.",
  ".rhhhhhhhhr.",
  ".rhgghgghhr.",
  ".rhhhhhhhhr.",
  ".rhgghgghhr.",
  ".rhhhhhhhhr.",
  ".rrrrrrrrrr.",
  "............",
  "............",
  "............",
];

export const RAMO = [
  "............",
  "..........gh",
  ".........hg.",
  "........hg..",
  "...h...hg...",
  "....hghg....",
  ".....hg.....",
  "....hg......",
  "...hg.......",
  "..hg........",
  "............",
  "............",
];

export const PIETRA = [
  "............",
  "............",
  "...dddd.....",
  "..deeeed....",
  ".deefffeed..",
  ".deffffeed..",
  ".deeffeeed..",
  "..deeeeed...",
  "...ddddd....",
  "............",
  "............",
  "............",
];

export const FIBRA = [
  "............",
  "...k..k.....",
  "..k.kk.k....",
  "..k.kk.k....",
  "...kkkk.....",
  "...jjjj.....",
  "..jjjjjj....",
  "...jjjj.....",
  "...9999.....",
  "....99......",
  "............",
  "............",
];

export const BACCHE = [
  "............",
  ".....j......",
  "....jkj.....",
  "...ttjtt....",
  "..tttjttt...",
  "..tttjttt...",
  "...tt.tt....",
  "............",
  "............",
  "............",
  "............",
  "............",
];

export const TORCIA = [
  "............",
  ".....v......",
  "....vuv.....",
  "....vuv.....",
  ".....u......",
  "....ghg.....",
  "....ghg.....",
  "....ghg.....",
  "....ghg.....",
  "....ghg.....",
  "............",
  "............",
];

// Il falò nello zaino, ed è spento: da M7.14.2 si posa una fossa fredda e la
// si accende con la legna, quindi l'icona con il fuoco dentro prometteva una
// cosa che quella casella non dà più. I legni sono quelli di sempre — si
// riconosce che è lui — ma nei toni della cenere invece che della fiamma.
//
// L'icona accesa è stata tolta e non commentata: quello che non disegna più
// niente è un disegno che il prossimo crede ancora in uso.
export const FALO_ICONA_SPENTO = [
  "............",
  "............",
  "............",
  "............",
  "..d.....d...",
  "..gd...dg...",
  "...dg.gd....",
  "..dgggggd...",
  "...ddddd....",
  "............",
  "............",
  "............",
];

// Il falò posato per terra è un'altra cosa dall'icona nello zaino: più grande,
// ancorato ai piedi come gli alberi, e con la fiamma su due fotogrammi. Un
// fuoco fermo si legge come un disegno di un fuoco; basta pochissimo movimento
// perché si legga come un fuoco.
export const FALO_ACCESO = [
  [
    "................",
    ".......v........",
    "......vuv.......",
    ".....vuuuv......",
    ".....vuuuv......",
    "....vuuuuuv.....",
    ".....vuuuv......",
    "......vuv.......",
    "...g.......g....",
    "...hg.....gh....",
    "....hg...gh.....",
    "..ghhhhhhhhg....",
    "...ggggggg......",
    "................",
  ],
  [
    "................",
    "......v.........",
    "......vuv.......",
    ".....vuuv.......",
    "....vuuuuv......",
    "....vuuuuv......",
    ".....vuuuv......",
    "......vuv.......",
    "...g.......g....",
    "...hg.....gh....",
    "....hg...gh.....",
    "..ghhhhhhhhg....",
    "...ggggggg......",
    "................",
  ],
];

// Il falò spento resta lì a dire "qui c'era un accampamento": è il primo
// pezzo di mondo che il giocatore lascia dietro di sé.
export const FALO_SPENTO = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "...d.......d....",
  "...gd.....dg....",
  "....dg...gd.....",
  "..dggggggggd....",
  "...ddddddd......",
  "................",
];

// Il focolare: la stessa fiamma del falò, dentro la pietra.
//
// Il disegno dice da solo la differenza fra i due fuochi, e deve: un falò è
// legna per terra, questo è una cosa costruita, con due montanti e un
// architrave. Chi lo vede in una stanza capisce prima di leggere qualunque
// verbo che quella casa è finita.
export const FOCOLARE = [
  "............",
  "..ffffffff..",
  "..feeeeeef..",
  "..fedddcef..",
  "..fedvdcef..",
  "..fdvuvdef..",
  "..fdvuvdef..",
  "..fedvdcef..",
  "..feeeeeef..",
  "..dddddddd..",
  "............",
  "............",
];

// Posato è più grande e ancorato ai piedi, e la fiamma sta su due fotogrammi
// come quella del falò: un fuoco fermo si legge come il disegno di un fuoco.
// Il cuore del focolare è scuro anche da acceso — è l'interno di una cappa, e
// se fosse trasparente ci si vedrebbe l'erba attraverso.
export const FOCOLARE_ACCESO = [
  [
    "................",
    "..ffffffffffff..",
    "..feeeeeeeeeef..",
    "..fedddddddddf..",
    "..fedddvddddef..",
    "..fedvuvdddeef..",
    "..fdvuuuvddeef..",
    "..fdvuuuvddeef..",
    "..fedvuvdddeef..",
    "..feddvdddddef..",
    "..feeeeeeeeeef..",
    "..dddddddddddd..",
    "................",
    "................",
  ],
  [
    "................",
    "..ffffffffffff..",
    "..feeeeeeeeeef..",
    "..fedddddddddf..",
    "..feddddvdddef..",
    "..feddvuvddeef..",
    "..fedvuuuvdeef..",
    "..fedvuuuvdeef..",
    "..feddvuvddeef..",
    "..fedddvddddef..",
    "..feeeeeeeeeef..",
    "..dddddddddddd..",
    "................",
    "................",
  ],
];

// Spento resta in piedi: è pietra, non cenere. È la differenza che rende il
// focolare un investimento invece di un affitto — quello che si è perso è la
// legna, non le dieci pietre.
export const FOCOLARE_SPENTO = [
  "................",
  "..ffffffffffff..",
  "..feeeeeeeeeef..",
  "..fedddddddddf..",
  "..feddddddddef..",
  "..feddddddddef..",
  "..fedddddddeef..",
  "..fedddddddeef..",
  "..feddddddddef..",
  "..feddddddddef..",
  "..feeeeeeeeeef..",
  "..dddddddddddd..",
  "................",
  "................",
];

// L'essiccatoio: un telaio di rami con le corde tese, e quello che ci pende.
//
// I tre stati sono tre disegni e non uno con un dettaglio in più, perché il
// disegno è l'unica cosa che dice se vale la pena tornare: vuoto sono corde
// nude, carico sono strisce rosse, pronto sono strisce scure e strette. Si
// legge da una schermata di distanza, che è dove si sta quando si decide.
export const ESSICCATOIO = [
  "............",
  ".hh......hh.",
  ".hhgggggghh.",
  ".hhtt.tt.hh.",
  ".hhtt.tt.hh.",
  ".hhgggggghh.",
  ".hhtt.tt.hh.",
  ".hhtt.tt.hh.",
  ".hhgggggghh.",
  ".hh......hh.",
  ".gg......gg.",
  "............",
];

// Vuoto: solo il telaio e le tre traverse. Si legge come una cosa che aspetta.
export const ESSICCATOIO_VUOTO = [
  "................",
  "..hh........hh..",
  "..hhgggggggghh..",
  "..hh........hh..",
  "..hh........hh..",
  "..hhgggggggghh..",
  "..hh........hh..",
  "..hh........hh..",
  "..hhgggggggghh..",
  "..hh........hh..",
  "..hh........hh..",
  "..gg........gg..",
  ".ggg........ggg.",
  "................",
];

// Quello che pende, e dove.
//
// Tre posti per traversa e due traverse: sei pezzi, che è il carico massimo.
// Si riempiono in ordine — prima la fila di sopra, poi quella di sotto — così
// un telaio a metà si legge a colpo d'occhio come un telaio a metà, e non come
// un telaio pieno di roba rada.
const POSTI = [
  { riga: 3, colonna: 4 }, { riga: 3, colonna: 7 }, { riga: 3, colonna: 10 },
  { riga: 6, colonna: 4 }, { riga: 6, colonna: 7 }, { riga: 6, colonna: 10 },
];

// Di che colore è quello che pende. La carne è quella delle bacche appassite,
// il pesce è l'azzurro dell'acqua da cui viene — lo stesso "3" dell'icona nello
// zaino, perché un pesce steso e un pesce in mano devono essere la stessa cosa
// vista da due distanze. Seccati, tutti e due sbiadiscono nella loro metà di
// tavolozza: la carne in "A", il pesce in "D".
const TINTE_STESE = {
  carne_cruda: { fresco: "t", secco: "A" },
  pesce_crudo: { fresco: "3", secco: "D" },
  // I baccelli verdi, e i fagioli bruni quando il baccello si è seccato.
  fagioli: { fresco: "x", secco: "l" },
};

// Il telaio con sopra quello che c'è davvero.
//
// Una funzione e non tre disegni fissi, ed è il punto di questa tappa: quanti
// pezzi pendono è l'informazione su cui il giocatore decide se tornare, e
// disegnare sempre sei strisce per un carico da tre sarebbe la stessa bugia
// che il falò acceso raccontava dall'icona dello zaino.
//
// Fresco pende largo e pieno, secco pende stretto e storto: è la differenza
// che si vede da lontano, ed è l'unica che serve vedere.
export function essiccatoioSteso(quante = 0, cosa = "carne_cruda", secco = false) {
  const righe = ESSICCATOIO_VUOTO.map((r) => r.split(""));
  const tinta = (TINTE_STESE[cosa] ?? TINTE_STESE.carne_cruda)[secco ? "secco" : "fresco"];
  for (const { riga, colonna } of POSTI.slice(0, Math.max(0, Math.min(POSTI.length, quante)))) {
    if (secco) {
      righe[riga][colonna] = tinta;
      righe[riga][colonna + 1] = tinta;
      righe[riga + 1][colonna + 1] = tinta;
    } else {
      righe[riga][colonna] = tinta;
      righe[riga][colonna + 1] = tinta;
      righe[riga + 1][colonna] = tinta;
      righe[riga + 1][colonna + 1] = tinta;
    }
  }
  return righe.map((r) => r.join(""));
}
export const ASCIA = [
  "............",
  "..eeee......",
  ".effffe.....",
  ".efffee.....",
  "..eeehg.....",
  "....hg......",
  "...hg.......",
  "..hg........",
  ".hg.........",
  ".g..........",
  "............",
  "............",
];

// La torcia piantata per terra: luce fissa che costa un quinto di un falò.
// Due fotogrammi, come il falò — un fuoco fermo si legge come il disegno di
// un fuoco.
export const TORCIA_PIANTATA = [
  [
    "................",
    "................",
    ".......v........",
    "......vuv.......",
    "......vuv.......",
    ".......u........",
    "......ghg.......",
    "......ghg.......",
    "......ghg.......",
    "......ghg.......",
    "......ghg.......",
    "......ghg.......",
    ".....ddgdd......",
    "......ddd.......",
    "................",
    "................",
  ],
  [
    "................",
    "................",
    "......v.........",
    "......vuv.......",
    ".......uv.......",
    ".......u........",
    "......ghg.......",
    "......ghg.......",
    "......ghg.......",
    "......ghg.......",
    "......ghg.......",
    "......ghg.......",
    ".....ddgdd......",
    "......ddd.......",
    "................",
    "................",
  ],
];

export const GIACIGLIO = [
  "............",
  "............",
  "..hhhhhhhh..",
  ".h99999999h.",
  ".h9aaaaaa9h.",
  ".h9aaaaaa9h.",
  ".h99999999h.",
  "..hhhhhhhh..",
  "............",
  "............",
  "............",
  "............",
];

// Il giaciglio steso per terra. Non è alto: si disegna quasi tutto dentro il
// suo tassello, al contrario di alberi e falò che crescono verso l'alto.
export const GIACIGLIO_STESO = [
  "................",
  "................",
  "..hhhhhhhhhhhh..",
  ".h999999999999h.",
  ".h9aaaaaaaaaa9h.",
  ".h9aaaaaaaaaa9h.",
  ".h9aaaaaaaaaa9h.",
  ".h9aaaaaaaaaa9h.",
  ".h999999999999h.",
  "..hhhhhhhhhhhh..",
];

// Lo stesso telaio del giaciglio, conciato. La paglia (9, a) diventa il bruno
// della fauna (c, l); la cornice di rami (h) resta, perché un letto di pelli è
// un letto, non un mucchio di pelli. Scambiare la tavolozza invece di
// ridisegnare non è pigrizia: disegnare a mano è la risorsa più scarsa del
// progetto, e due letti che si leggono come parenti dicono da soli che il
// secondo è il primo fatto meglio.
const concia = (righe) => righe.map(r => r.replaceAll("9", "c").replaceAll("a", "l"));
export const GIACIGLIO_PELLI = concia(GIACIGLIO);
export const GIACIGLIO_PELLI_STESO = concia(GIACIGLIO_STESO);

// Il letto: una cornice di legno con la testiera, il cuscino di lino e una
// coperta. Più alto del giaciglio di un palmo — è un mobile, non un materasso
// per terra — ma si disegna ancora quasi tutto dentro il suo tassello.
export const LETTO = [
  "................",
  ".g............g.",
  ".gwwwwwwwwwwwwg.",
  ".ghhhhhhhhhhhhg.",
  ".gzzzzzzzzzzzzg.",
  ".gzzzzzzzzzzzzg.",
  ".gppppppppppppg.",
  ".goooooooooooog.",
  ".gooooopoooooog.",
  ".goooooooooooog.",
  ".goooooooopooog.",
  ".gwwwwwwwwwwwwg.",
  ".gg..........gg.",
  "................",
];

export const LETTO_ICONA = [
  "............",
  ".g........g.",
  ".gwwwwwwwwg.",
  ".gzzzzzzzzg.",
  ".gppppppppg.",
  ".goooooooog.",
  ".gooooopoog.",
  ".goooooooog.",
  ".gwwwwwwwwg.",
  ".gg......gg.",
  "............",
  "............",
];

// Il pavimento di legno: quattro assi per tassello, con le giunture sfalsate
// perché una fila di tasselli non si legga come una griglia. Copre il
// tassello tutto — si stende sopra l'erba e i suoi bordi — e sta sotto tutto
// quello che ci si posa.
export const PAVIMENTO_LEGNO = [
  "hhhhhhhhhhghhhhh",
  "hhwhhhhhhhghhhhh",
  "hhhhhhhwhhghhhwh",
  "gggggggggggggggg",
  "ccccgcccccccccwc",
  "cwccgccccccwcccc",
  "ccccgccccccccccc",
  "gggggggggggggggg",
  "hhhhhhhhhhhhhghh",
  "hhhhwhhhhhhhhghh",
  "hhhhhhhhhwhhhghh",
  "gggggggggggggggg",
  "cccccccgcccccccc",
  "ccwccccgccccwccc",
  "cccccccgcccccccc",
  "gggggggggggggggg",
];

export const PAVIMENTO_ICONA = [
  "............",
  "............",
  "..hhhhhhgh..",
  "..hwhhhhgh..",
  "..gggggggg..",
  "..ccgccccc..",
  "..ccgcccwc..",
  "..gggggggg..",
  "..hhhhhghh..",
  "..hwhhhghh..",
  "..gggggggg..",
  "............",
];

export const ZAPPA = [
  "............",
  "..eeee......",
  "..eeee......",
  "...ehg......",
  "....hg......",
  "....hg......",
  ".....hg.....",
  ".....hg.....",
  "......hg....",
  "......hg....",
  "............",
  "............",
];

export const SECCHIO = [
  "............",
  "..ssssssss..",
  "..s......s..",
  "..s......s..",
  "..s......s..",
  "..s......s..",
  "..s......s..",
  "...s....s...",
  "...ssssss...",
  "............",
  "............",
  "............",
];

// Pieno e vuoto sono due oggetti distinti invece di un secchio con un livello
// dentro: lo zaino tiene coppie cosa-quantità e non stati, e due icone
// diverse si distinguono a colpo d'occhio meglio di un numero.
export const SECCHIO_PIENO = [
  "............",
  "..ssssssss..",
  "..s333333s..",
  "..s322223s..",
  "..s222222s..",
  "..s222222s..",
  "..s222222s..",
  "...s2222s...",
  "...ssssss...",
  "............",
  "............",
  "............",
];

export const SEMI = [
  "............",
  "............",
  "...bb..bb...",
  "..baab.baab.",
  "..baab.baab.",
  "...bb..bb...",
  "....bb......",
  "...baab.....",
  "...baab.....",
  "....bb......",
  "............",
  "............",
];

export const RAPA = [
  "............",
  "....k.k.....",
  "...kkkkk....",
  "....kkk.....",
  "...55555....",
  "..5555555...",
  "..5555555...",
  "...55555....",
  "....555.....",
  ".....5......",
  "............",
  "............",
];

// Il sacco su cui si posa quello che si toglie dallo zaino. È 16x16, cioè un
// tassello intero, perché sta per terra e non in una casella: sopra ci va
// l'icona della cosa contenuta, così un mucchio si riconosce da lontano per
// quello che è invece che per il fatto di essere un mucchio.
export const MUCCHIO = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "....gggggggg....",
  "..gghhhhhhhhgg..",
  ".ghhhhhhhhhhhhg.",
  ".ghhhhhhhhhhhhg.",
  "..gghhhhhhhhgg..",
  "....gggggggg....",
];

// Il corpo del superstite di prima, steso. Sedici per dieci, cioè un tassello
// in larghezza e poco più di mezzo in altezza: è quanto occupa una persona
// distesa, e l'altezza bassa è metà del disegno — tutto il resto della valle
// sta in piedi, e una figura orizzontale si legge come "caduta" prima ancora
// che si distingua cosa sia.
//
// Il viso usa l'ombra della pelle e non la luce: è l'unico posto del gioco in
// cui la pelle è più scura del normale, e a questa dimensione il pallore è
// l'unico modo di dire "morto" invece di "sdraiato".
export const CADAVERE = [
  "................",
  "................",
  "................",
  "....rrrr........",
  "...rqqqqrrrrr...",
  "..rqlmmlqoooor..",
  "..rqllllqooonnnr",
  "...rqqqqrrrnnnnr",
  "....rrrr...rrrrr",
  "................",
];

// La benda: una fascia di tela arrotolata. Bianco sporco e non bianco pulito
// — è fibra strappata e bollita, non garza da farmacia — e con un capo che
// pende, perché un rotolo perfetto a dodici pixel si legge come una moneta.
//
// La macchia scura al centro è il rotolo visto di taglio: senza, la fascia
// era un rettangolo chiaro identico a mezza dozzina di altre cose.
// Il banco da lavoro.
//
// Un piano e quattro gambe, e sopra due cose lasciate lì. I due oggetti sul
// piano sono metà del disegno: un tavolo vuoto è un tavolo, un tavolo con
// sopra degli attrezzi è un posto in cui si lavora — e a sedici pixel la
// differenza fra le due cose sta tutta in sei pixel grigi.
export const BANCO = [
  "................",
  "................",
  ".....eee........",
  "....effe..cww...",
  "....eee...cww...",
  ".wwwwwwwwwwwwww.",
  ".cccccccccccccc.",
  ".hg..........gh.",
  ".hg..........gh.",
  ".hgccccccccccgh.",
  ".hg..........gh.",
  ".hg..........gh.",
  ".hg..........gh.",
  ".gg..........gg.",
];

export const BANCO_ICONA = [
  "............",
  "...eee......",
  "..effe..ww..",
  "..eee...ww..",
  ".wwwwwwwwww.",
  ".cccccccccc.",
  ".hg......gh.",
  ".hgccccccgh.",
  ".hg......gh.",
  ".hg......gh.",
  ".gg......gg.",
  "............",
];

// La lancia. Lunga e sottile, che è tutto quello che ha da dire: arriva più
// lontano di un'ascia e pesa meno di quanto colpisca.
export const LANCIA = [
  "..........s.",
  ".........ss.",
  "........ss..",
  ".......sh...",
  "......hh....",
  ".....hh.....",
  "....hh......",
  "...hh.......",
  "..hh........",
  ".hh.........",
  ".h..........",
  "............",
];

// La conserva: un vaso con dentro quello che non sarebbe arrivato a marzo.
export const CONSERVA = [
  "............",
  "...gggggg...",
  "..pppppppp..",
  "..p......p..",
  "..p.tttt.p..",
  "..p.tttt.p..",
  "..p.tttt.p..",
  "..p.tttt.p..",
  "..p......p..",
  "..pppppppp..",
  "............",
  "............",
];

// La cassa: il primo posto tuo in cui mettere le cose.
//
// Il coperchio più chiaro del corpo, e in mezzo una piastra di metallo. Il
// metallo è l'unico dettaglio che non serve a dire "legno": serve a dire che
// si apre, perché una cassa chiusa e un blocco di legno hanno la stessa
// sagoma e la differenza sta tutta lì.
export const CASSA = [
  "................",
  "................",
  "................",
  "...wwwwwwwwww...",
  "..wccccccccccw..",
  "..wcwwwwwwwwcw..",
  "..wccccccccccw..",
  "..wwwwwwwwwwww..",
  "..whhhhhhhhhhw..",
  "..whhhhsshhhhw..",
  "..whhhhsshhhhw..",
  "..whhhhhhhhhhw..",
  "..wwwwwwwwwwww..",
  "...gggggggggg...",
];

// La stessa cosa in dodici pixel, per la casella dello zaino.
export const CASSA_ICONA = [
  "............",
  "............",
  "..wwwwwwww..",
  ".wccccccccw.",
  ".wcwwwwwwcw.",
  ".wccccccccw.",
  ".wwwwwwwwww.",
  ".whhhhhhhhw.",
  ".whhhsshhhw.",
  ".whhhhhhhhw.",
  ".wwwwwwwwww.",
  "............",
];

export const BENDA = [
  "............",
  "............",
  "..zzzzzzz...",
  ".zzAAAAAzz..",
  ".zzAzzzAzz..",
  ".zzAzzzAzz..",
  ".zzAAAAAzz..",
  "..zzzzzzz...",
  "....zz......",
  "...zz.......",
  "............",
  "............",
];

// La rapa arrostita. Non è la rapa con un'altra tinta: è infilzata su uno
// spiedo, e la differenza sta nella sagoma prima che nel colore.
//
// Il motivo è pratico e si vede solo in una casella da diciotto pixel: rapa e
// rapa arrostita finiscono quasi sempre in due caselle adiacenti dello zaino,
// e due tondi dello stesso disegno in tinte diverse a quella dimensione sono
// la stessa cosa vista due volte. Lo spiedo si riconosce prima del colore.
export const RAPA_ARROSTITA = [
  "..........gh",
  ".........hg.",
  "........hg..",
  "...cccccg...",
  "..cc44ccc...",
  "..cc44ccc...",
  "...ccccc....",
  "..hg.cc.....",
  ".hg.........",
  "g...........",
  "............",
  "............",
];

// Le bacche secche, sparse su un pezzo di tela invece che attaccate al ramo.
// Stessa ragione della rapa: quello che cambia è dove stanno, non di che
// colore sono. Il rosso è spento — sono passate dal fuoco — e sono più
// piccole, perché seccando si raggrinziscono.
export const BACCHE_SECCHE = [
  "............",
  "............",
  ".zzzzzzzzzz.",
  ".z.A..A...z.",
  ".zA.A...A.z.",
  ".z...A.A..z.",
  ".zA..A...Az.",
  ".z..A...A.z.",
  ".zzzzzzzzzz.",
  "............",
  "............",
  "............",
];

// --- il muro e la porta ---------------------------------------------------

// Il muro non ha un disegno nuovo: quello per terra è MURO, che sta in
// sprite-oggetti.js da quando esistono le rovine. Qui c'è solo l'icona, cioè
// la faccia che fa nello zaino: tre corsi di pietra visti di fronte, perché
// una casella dello zaino non ha il posto per far capire altro.
export const MURO_ICONA = [
  "............",
  "............",
  ".ffffffffff.",
  ".dddddddddd.",
  ".eeddeeeedd.",
  ".dddddddddd.",
  ".ddeeeeddee.",
  ".dddddddddd.",
  ".eeddeeeedd.",
  ".dddddddddd.",
  "............",
  "............",
];

// La porta chiusa. Alta venti come il muro, perché sta dentro un muro e i due
// disegni si appoggiano allo stesso pavimento: uno più basso avrebbe fatto un
// gradino in mezzo alla parete. Gli stipiti sono di pietra e le assi di legno,
// che è anche quello che costa — pietra il muro, legna la porta.
export const PORTA = [
  "ffffffffffffffff",
  "ffffffffffffffff",
  "eeeeeeeeeeeeeeee",
  "dddddddddddddddd",
  "edwwwwwwwwwwwwde",
  "edhhghhghhghhgde",
  "edhhghhghhghhgde",
  "edhhghhghhghhgde",
  "edssssssssssssde",
  "edhhghhghhghhgde",
  "edhhghhghhghhgde",
  "edhhghhghhgshgde",
  "edhhghhghhghhgde",
  "edhhghhghhghhgde",
  "edhhghhghhghhgde",
  "edssssssssssssde",
  "edhhghhghhghhgde",
  "edhhghhghhghhgde",
  "edhhghhghhghhgde",
  "edggggggggggggde",
];

// La stessa porta aperta: gli stipiti restano, il battente è accostato contro
// quello di sinistra e in mezzo si vede il terreno. Il vuoto è trasparente e
// non nero: un rettangolo scuro in mezzo a un muro si legge come una stanza
// buia, e questa è un'uscita.
export const PORTA_APERTA = [
  "ffffffffffffffff",
  "ffffffffffffffff",
  "eeeeeeeeeeeeeeee",
  "dddddddddddddddd",
  "edwww.........de",
  "edhhg.........de",
  "edhhg.........de",
  "edhhg.........de",
  "edsss.........de",
  "edhhg.........de",
  "edhhg.........de",
  "edhsg.........de",
  "edhhg.........de",
  "edhhg.........de",
  "edhhg.........de",
  "edsss.........de",
  "edhhg.........de",
  "edhhg.........de",
  "edhhg.........de",
  "edggg.........de",
];

// L'icona: una porta chiusa nel suo stipite, che è l'unico modo di far capire
// in dodici pixel che non è una cassa in piedi.
export const PORTA_ICONA = [
  "............",
  "..dddddddd..",
  "..dwwwwwwd..",
  "..dhhghhgd..",
  "..dssssssd..",
  "..dhhghhgd..",
  "..dhhghhgd..",
  "..dhhgshgd..",
  "..dhhghhgd..",
  "..dssssssd..",
  "..dhhghhgd..",
  "..dggggggd..",
];

// --- lo steccato e il cancello ---------------------------------------------

// Due pali e due traverse che arrivano ai bordi: messi in fila, le traverse
// si toccano e lo steccato si legge come uno solo. Basso, più basso di un
// muro, perché sopra ci si vede — ed è la differenza che il gioco fa fra i due.
export const STECCATO = [
  "................",
  ".ww..........ww.",
  ".wh..........wh.",
  ".wh..........wh.",
  "wwwwwwwwwwwwwwww",
  "hhhhhhhhhhhhhhhh",
  ".wh..........wh.",
  ".wh..........wh.",
  ".wh..........wh.",
  "wwwwwwwwwwwwwwww",
  "hhhhhhhhhhhhhhhh",
  ".wh..........wh.",
  ".wh..........wh.",
  ".gg..........gg.",
];

// Il cancello: i pali ai bordi e in mezzo un'anta di assi verticali, che è
// quello che lo distingue dallo steccato a colpo d'occhio.
export const CANCELLO = [
  "................",
  "ww............ww",
  "wh............wh",
  "whwwwwwwwwwwwwwh",
  "whc.c.c.c.c.c.wh",
  "whc.c.c.c.c.c.wh",
  "whwwwwwwwwwwwwwh",
  "whc.c.c.c.c.c.wh",
  "whc.c.c.c.c.c.wh",
  "whc.c.c.c.c.c.wh",
  "whwwwwwwwwwwwwwh",
  "wh............wh",
  "wh............wh",
  "gg............gg",
];

// Aperto, l'anta è accostata al palo di sinistra, vista di taglio.
export const CANCELLO_APERTO = [
  "................",
  "ww............ww",
  "wh............wh",
  "whww..........wh",
  "whcw..........wh",
  "whcw..........wh",
  "whww..........wh",
  "whcw..........wh",
  "whcw..........wh",
  "whcw..........wh",
  "whww..........wh",
  "wh............wh",
  "wh............wh",
  "gg............gg",
];

export const STECCATO_ICONA = [
  "............",
  "............",
  ".w..w..w..w.",
  ".h..h..h..h.",
  "wwwwwwwwwwww",
  "hhhhhhhhhhhh",
  ".h..h..h..h.",
  "wwwwwwwwwwww",
  "hhhhhhhhhhhh",
  ".h..h..h..h.",
  ".g..g..g..g.",
  "............",
];

export const CANCELLO_ICONA = [
  "............",
  ".ww......ww.",
  ".whwwwwwwwh.",
  ".whc.c.c.wh.",
  ".whc.c.c.wh.",
  ".whwwwwwwwh.",
  ".whc.c.c.wh.",
  ".whc.c.c.wh.",
  ".whwwwwwwwh.",
  ".wh......wh.",
  ".gg......gg.",
  "............",
];

// --- il pollo e il pollaio (M7.18.18) ---------------------------------------

// La gallina, di profilo verso destra: cresta rossa, becco arancio. Bianca
// quella allevata; bruna quella inselvatichita, che è la stessa gallina
// rimasta sola da un anno — si distinguono a colpo d'occhio, ed è la
// differenza che conta: una scappa, l'altra è tua.
const GALLINA_A = [
  "......tt..",
  ".....zzr..",
  ".....zzzu.",
  "z...zzzz..",
  "zz.zzzzz..",
  "zzzzzzzz..",
  ".zzzzzzz..",
  "..zzzzz...",
  "...u..u...",
];
const GALLINA_B = [
  "......tt..",
  ".....zzr..",
  ".....zzzu.",
  "z...zzzz..",
  "zz.zzzzz..",
  "zzzzzzzz..",
  ".zzzzzzz..",
  "..zzzzz...",
  "....uu....",
];
// Di notte dorme accovacciata, con la testa nelle piume: più bassa, e senza
// zampe. È quello che dice che adesso si lascia prendere.
const GALLINA_DORME = [
  "..........",
  "..........",
  "......tt..",
  ".....zzz..",
  "z...zzzzu.",
  "zzzzzzzz..",
  "zzzzzzzz..",
  ".zzzzzzz..",
  "..........",
];
const bruna = (righe) => righe.map(r => r.replaceAll("z", "c"));
export const POLLO = [GALLINA_A, GALLINA_B];
export const POLLO_DORME = GALLINA_DORME;
export const POLLO_SELVATICO = [bruna(GALLINA_A), bruna(GALLINA_B)];
export const POLLO_SELVATICO_DORME = bruna(GALLINA_DORME);

export const POLLO_ICONA = [
  "............",
  "............",
  ".......tt...",
  "......zzzr..",
  "......zzzzu.",
  ".z...zzzzz..",
  ".zz.zzzzzz..",
  ".zzzzzzzzz..",
  "..zzzzzzzz..",
  "...zzzzzz...",
  "....u..u....",
  "............",
];

// Il gallo (M7.18.19): la stessa sagoma con la cresta grande, i bargigli e la
// coda scura. Una coda che si vede da lontano, perché nel recinto serve
// sapere a colpo d'occhio se c'è.
const GALLO_A = [
  ".....ttt..",
  "......tt..",
  ".....zzr..",
  ".....zzzu.",
  "g...zzzt..",
  "gg.zzzzz..",
  "jgzzzzzz..",
  ".gzzzzzz..",
  "..zzzzz...",
  "...u..u...",
];
const GALLO_B = [...GALLO_A.slice(0, 9), "....uu...."];
const GALLO_DORME = [
  "..........",
  "..........",
  ".....ttt..",
  "......t...",
  ".....zzz..",
  "g...zzzzu.",
  "jgzzzzzz..",
  ".gzzzzzz..",
  "..zzzzzz..",
  "..........",
];
export const GALLO = [GALLO_A, GALLO_B];
export const GALLO_DORME_SPRITE = GALLO_DORME;
export const GALLO_SELVATICO = [bruna(GALLO_A), bruna(GALLO_B)];
export const GALLO_SELVATICO_DORME = bruna(GALLO_DORME);

// Il pulcino: una pallina gialla, piccola abbastanza da capire che non è
// ancora un pollo.
export const PULCINO = [
  ["..vv..", ".vvvr.", "vvvvvu", ".vvvv.", "..u.u."],
  ["..vv..", ".vvvr.", "vvvvvu", ".vvvv.", "...uu."],
];
export const PULCINO_DORME = ["......", "..vv..", ".vvvvu", "vvvvv.", "......"];

export const GALLO_ICONA = [
  ".......ttt..",
  "........tt..",
  ".......zzr..",
  ".......zzzu.",
  ".g....zzzt..",
  ".gg..zzzzz..",
  ".jgzzzzzzz..",
  "..gzzzzzzz..",
  "...zzzzzz...",
  "....zzzz....",
  ".....u..u...",
  "............",
];

export const UOVO_ICONA = [
  "............",
  "............",
  ".....zz.....",
  "....zzzz....",
  "...zzzzzz...",
  "...zzzzzz...",
  "...zzzzz5...",
  "....zz55....",
  "............",
  "............",
  "............",
  "............",
];

export const UOVO_COTTO_ICONA = [
  "............",
  "............",
  "...zzzzz....",
  "..zzzzzzzz..",
  ".zzzvvvzzz..",
  ".zzzvvvvzzz.",
  "..zzvvvzzz..",
  "...zzzzzz...",
  "....zzz.....",
  "............",
  "............",
  "............",
];

export const POLLINA_ICONA = [
  "............",
  "............",
  "............",
  "....bbbb....",
  "...b9z9bb...",
  "..b99z999b..",
  "..b9z9999b..",
  ".b99999z99b.",
  ".bbbbbbbbbb.",
  "............",
  "............",
  "............",
];

// Il pollaio: una casetta di assi col tetto, e un buco scuro da cui si entra.
export const POLLAIO = [
  "......gggg......",
  "....gghhhhgg....",
  "..gghhhhhhhhgg..",
  "gghhhhhhhhhhhhgg",
  "hhhhhhhhhhhhhhhh",
  ".wwwwwwwwwwwwww.",
  ".wcwwwwwwwwwwcw.",
  ".wcwwwrrrrwwwcw.",
  ".wcwwrrrrrrwwcw.",
  ".wcwwrrrrrrwwcw.",
  ".wcww5555555wcw.",
  ".wcwwwwwwwwwwcw.",
  ".wwwwwwwwwwwwww.",
  ".gg..........gg.",
];

export const POLLAIO_ICONA = [
  "............",
  ".....gg.....",
  "...gghhgg...",
  ".gghhhhhhgg.",
  "hhhhhhhhhhhh",
  ".wwwwwwwwww.",
  ".wcwrrrrwcw.",
  ".wcwrrrrwcw.",
  ".wcw5555wcw.",
  ".wwwwwwwwww.",
  ".gg......gg.",
  "............",
];

export const CANNA = [
 "............",".........h..","........hB..",".......h.B..",
 "......h..B..",".....h...B..","....h....B..","...h.....B..",
 "..h......v..",".h..........","............","............",
];
export const PESCE_CRUDO = [
 "............","............","......3.....","....3333....",
 ".3.3BB3q3...","..33BBB333..",".3.33B333...","....3333....",
 "......3.....","............","............","............",
];
export const PESCE_ARROSTITO = [
 "............","............","......h.....","....hhhh....",
 ".h.h55hqh...","..hh555hhh..",".h.hh5hhh...","....hhhh....",
 "......h.....","............","............","............",
];

// Il pesce secco: lo stesso pesce ricolorato invece che ridisegnato — è la
// stessa scelta di CARNE_SECCA in sprite-fauna.js, e per la stessa ragione.
// Due icone che vengono dallo stesso disegno si leggono come due stati di una
// cosa sola, che è quello che sono; due disegni diversi si leggerebbero come
// due cose diverse.
//
// Blu che vira al grigio e non bruno: un pesce seccato resta un pesce, e la
// prima stesura lo faceva marrone come la carne secca — cioè toglieva l'unica
// cosa che nella casella dello zaino lo distingue da lei.
export const PESCE_SECCO = PESCE_CRUDO.map(r => r.replaceAll("3", "D").replaceAll("B", "s"));

// --- le colture di M7.17 ---------------------------------------------------
//
// Quello che si raccoglie e quello che si semina, uno per coltura. I semi si
// distinguono dal colore e dalla forma prima che dal nome: quelli della rapa
// sono i bruni di sempre, quelli del cavolo piccoli e quasi neri, quelli del
// lino piatti e dorati — che è com'è il seme di lino davvero.

export const PATATA = [
  "............",
  "............",
  "...4444.....",
  "..444444....",
  "..44w444....",
  "..444444w...",
  "...44444444.",
  "....w444444.",
  ".....44w444.",
  "......4444..",
  "............",
  "............",
];

export const PATATA_ARROSTITA = [
  "............",
  "............",
  "...wwww.....",
  "..wwhwww....",
  "..wwwwwh....",
  "..whwwwwww..",
  "...wwwwhwww.",
  "....wwwwwww.",
  ".....whwwww.",
  "......wwww..",
  "............",
  "............",
];

// Borlotti: il rosso bruno con le macchie chiare, che si riconosce anche da
// chi non ha mai sgranato un baccello.
export const FAGIOLI = [
  "............",
  "............",
  "...ll...ll..",
  "..llzl.lzll.",
  "..lzll.llzl.",
  "...ll...ll..",
  ".....ll.....",
  "....lzll....",
  "....llzl....",
  ".....ll.....",
  "............",
  "............",
];

export const FAGIOLI_COTTI = [
  "............",
  "............",
  "............",
  "..llmllmll..",
  ".hlmllmllmh.",
  ".hhhhhhhhhh.",
  "..hhhhhhhh..",
  "...hhhhhh...",
  "....gggg....",
  "............",
  "............",
  "............",
];

// Il sacchetto: i fagioli secchi non pendono dal telaio come la carne, ma
// ne escono per finire qui dentro, e il sacchetto dice che durano.
export const FAGIOLI_SECCHI = [
  "............",
  ".....gg.....",
  "....wggw....",
  "...wwwwww...",
  "..wlwllwlw..",
  "..wwlwwlww..",
  "..wlwllwlw..",
  "..wwwwwwww..",
  "...wwwwww...",
  "............",
  "............",
  "............",
];

export const CAVOLO = [
  "............",
  "....EEEE....",
  "..EExEEEE...",
  ".EEEExEEEE..",
  ".ExEEExExE..",
  ".EExEExEEE..",
  ".EEExEEExE..",
  "..EEEExEE...",
  "...EEEEE....",
  ".....x......",
  "............",
  "............",
];

export const SEMI_CAVOLO = [
  "............",
  "............",
  "...qq..qq...",
  "..qnnq.qnq..",
  "..qnnq..q...",
  "...qq.......",
  ".....qq.qq..",
  "....qnnq.q..",
  "....qnnq....",
  ".....qq.....",
  "............",
  "............",
];

// Il filo di lino: una matassa avvolta su un rocchetto, con il capo che
// pende. Chiaro come il lino e non verde come la fibra, perché nello zaino le
// due cose stanno una accanto all'altra e devono sembrare due cose: una è
// sterpo strappato, l'altra è lavoro.
export const FILO = [
  "............",
  "............",
  "..bccccccb..",
  "...zzzzz5...",
  "...555554...",
  "...zzzzz5...",
  "...555554...",
  "...zzzzz5...",
  "..bccccccb..",
  ".........5..",
  "..........5.",
  "............",
];

export const SEMI_LINO = [
  "............",
  "............",
  "...44...44..",
  "..4554.4554.",
  "...44...44..",
  "............",
  ".....44.....",
  "....4554....",
  ".....44.....",
  "............",
  "............",
  "............",
];

// La zuppa: la stessa ciotola dei fagioli, e il vapore che dice che è calda
// — cioè che è passata da un fuoco.
export const ZUPPA = [
  "....z..z....",
  ".....z..z...",
  "....z..z....",
  "..44u44u44..",
  ".h4uu44uu4h.",
  ".hhhhhhhhhh.",
  "..hhhhhhhh..",
  "...hhhhhh...",
  "....gggg....",
  "............",
  "............",
  "............",
];

// --- la terra che si stanca (M7.18) ------------------------------------------

// Lo spaventapasseri: un sacco di paglia su un palo, con il cappello e una
// camicia vecchia. Sta in piedi fra le file come un albero, e come un albero
// si disegna in fila con quello che ha i piedi più in basso.
export const SPAVENTAPASSERI = [
  "................",
  "......hhhh......",
  ".....hhhhhh.....",
  "...gggggggggg...",
  "......5555......",
  "......5g5g......",
  "......5555......",
  "......5gg5......",
  "..4.oooooooo.4..",
  ".44oooooooooo44.",
  "4...oooooooo...4",
  "....oooooooo....",
  "....oooooooo....",
  ".....oooooo.....",
  "......4..4......",
  ".......gh.......",
  ".......gh.......",
  ".......gh.......",
  ".......gh.......",
  "......dghd......",
];

export const SPAVENTAPASSERI_ICONA = [
  "....hhhh....",
  "..gggggggg..",
  "....5555....",
  "....5g5g....",
  "....5555....",
  "4.oooooooo.4",
  ".44oooooo44.",
  "...oooooo...",
  "....oooo....",
  ".....gh.....",
  ".....gh.....",
  "....dghd....",
];

// La cenere: un mucchietto grigio. Grigia come la roccia, e non per caso — è
// quello che resta quando la legna ha finito di essere legna.
export const CENERE = [
  "............",
  "............",
  "............",
  "............",
  ".....ff.....",
  "....fsff....",
  "...ffffsf...",
  "..fsfffffe..",
  ".efffsffffe.",
  ".eeeeeeeeee.",
  "............",
  "............",
];

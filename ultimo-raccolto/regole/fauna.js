// Fauna rara delle praterie. Salviamo anche i vivi: caricare non guarisce
// una preda, non rimescola il suo temperamento e non rigenera il bottino.
import * as mappa from '../mondo/mappa.js';
import { TERRENO, OGGETTO } from '../mondo/generazione.js';
import { vistaLibera } from '../mondo/ostacoli.js';
import * as urti from '../entita/urti.js';
import * as entita from '../entita/entita.js';
import { impronta } from '../motore/casuale.js';
import * as tempo from './tempo.js';
import * as stagioni from './stagioni.js';
import * as salute from './salute.js';
import * as inventario from './inventario.js';
import * as meteo from './meteo.js';
import { cuoci, riflesso } from '../arte/sprite.js';
import { ANIMALI, CARCASSE } from '../arte/sprite-fauna.js';

// Il cavallo è quello che non si fa avvicinare, e il resto dei suoi numeri
// viene da lì. Prima era il pasto migliore e il più sicuro insieme — quattro
// carni e due pelli, danno zero, mai aggressivo — cioè il rischio e la
// ricompensa ordinati al contrario: conveniva lasciar perdere il cervo, che
// può caricarti e rende meno. Adesso ti vede da sei tasselli e scappa a una
// velocità che si prende solo correndo, e correre costa fiato: quello che ne
// esce è un pasto, non una scorta.
//
// "voce" è quanto è grave il suo verso, e la usa l'udito: l'orso profondo, il
// cervo sottile. Sta qui con le altre misure della specie perché è un suo
// tratto quanto la velocità — e perché un dato solo, in un posto solo, è la
// regola che questo progetto segue anche per le tavolozze.
export const SPECIE = {
  cavallo: { nome: 'Cavallo', vita: 6, velocita: 88, danno: 0, raggio: 100, rischio: 0, carne: 2, pelli: 1, voce: 1 },
  cervo: { nome: 'Cervo', vita: 6, velocita: 80, danno: 0.12, raggio: 48, rischio: 0.35, carne: 3, pelli: 1, voce: 1.25 },
  bufalo: { nome: 'Bufalo', vita: 12, velocita: 62, danno: 0.18, raggio: 48, rischio: 0.55, carne: 6, pelli: 3, voce: 0.78 },
  orso: { nome: 'Orso', vita: 15, velocita: 70, danno: 0.24, raggio: 64, rischio: 1, carne: 5, pelli: 3, voce: 0.62 },
};

// Quante bestie intorno, e ogni quanto ne arriva una. Dipende dalla stagione,
// e prima non dipendeva da niente.
//
// Era il buco più grosso della tappa della caccia, e non si vedeva perché
// stava fra due tappe: d'inverno i pesci non abboccano (M7.6), l'orto non
// cresce e i cespugli danno l'undici per cento (M6.5) — tre tappe costruite
// apposta perché l'inverno fosse l'esame — e la fauna arrivava identica a
// luglio. Misurato: una giornata costa 0,556 barre di fame, un'intera
// d'inverno, e un bufalo arrostito ne rende 2,7. Con due bestie sempre a un
// passo dallo schermo, la stagione più dura era quella in cui si mangiava
// meglio.
//
// Adesso l'autunno è la stagione della caccia grossa — è lì che si fa la
// provvista — e l'inverno è il magro: una bestia alla volta e un arrivo ogni
// novantacinque secondi, cioè tre tentativi in una giornata invece di sette.
// Non toglie la caccia d'inverno: toglie che basti da sola.
//
// E d'inverno sono anche magre. Il conto dice perché serviva tutt'e due:
// diradare porta la giornata di caccia da sette bestie a quattro, che sono
// ancora quasi otto giornate di cibo — perché il tetto non è mai stato il
// vincolo, lo è quanto rende una bestia. Con la resa invernale a sei decimi
// una giornata passata a cacciare copre l'inverno e non il mese: la caccia
// resta la risposta al freddo, smette di essere la risposta a tutto.
//
// Le pelli no, restano quelle: una pelle è una pelle anche su una bestia
// magra, e toglierle d'inverno vorrebbe dire rendere più cara la pelliccia
// proprio nella stagione per cui esiste.
export const PER_STAGIONE = {
  estate: { massimi: 2, intervallo: 40, resa: 1 },
  autunno: { massimi: 2, intervallo: 32, resa: 1 },
  inverno: { massimi: 1, intervallo: 95, resa: 0.6 },
  primavera: { massimi: 2, intervallo: 40, resa: 1 },
};
const dellaStagione = () => PER_STAGIONE[stagioni.stagioneCorrente()] ?? PER_STAGIONE.estate;
export const quanteNeVuole = () => dellaStagione().massimi;
export const ogniQuanto = () => dellaStagione().intervallo;

// I due tetti che servono a controllare un salvataggio, e sono quelli di tutto
// l'anno, non quelli di oggi. Un salvataggio scritto d'autunno con due bestie
// intorno, riaperto d'inverno quando ne è ammessa una, deve caricarsi: quello
// che il salvataggio dichiara è successo davvero, e rifiutarlo sarebbe dire
// che una partita legittima è storta perché nel frattempo è cambiata la
// stagione.
// Quanta carne dà questa bestia. La stagione è quella in cui è caduta, non
// quella in cui la macelli: la magrezza è una cosa che l'animale aveva
// addosso, non una regola che si applica al coltello. Si legge da mortoIl, che
// è già nel salvataggio e già controllato — nessun campo nuovo, nessuna
// partita da migrare — e siccome una carcassa dura due giorni, non c'è modo di
// aspettare la primavera per macellare un cervo d'inverno.
export function carneDi(e) {
  const giorno = Math.floor(e.mortoIl / tempo.SECONDI_PER_GIORNO) + 1;
  const resa = PER_STAGIONE[stagioni.stagioneDi(giorno)]?.resa ?? 1;
  return Math.max(1, Math.round(SPECIE[e.specie].carne * resa));
}

const VIVI_MASSIMI = Math.max(...Object.values(PER_STAGIONE).map(v => v.massimi));
const ATTESA_MASSIMA = Math.max(...Object.values(PER_STAGIONE).map(v => v.intervallo));
export const TOLLERANZA = 5;
const animali = [];
let attesa = 12, sequenza = 0;
export const tutte = () => animali;
export const quanti = () => animali.filter(e => e.vita > 0).length;
const adesso = () => ((tempo.giornoCorrente()-1)*24 + tempo.oraCorrente()) * tempo.SECONDI_PER_GIORNO / 24;

// Un generatore per esemplare, conservato nel salvataggio. I tiri avvengono
// alla scadenza della tolleranza, mai a ogni fotogramma.
function caso(e) {
  e.seme = (Math.imul(e.seme, 1664525) + 1013904223) >>> 0;
  return e.seme / 4294967296;
}
export function crea(specie, px, py, seme = 1) {
  if (!Object.hasOwn(SPECIE, specie)) throw new Error('specie sconosciuta');
  return { specie, px, py, vita: SPECIE[specie].vita, seme: seme >>> 0,
    stato: 'calmo', pressione: 0, memoria: 0, ricarica: 0, giro: 0,
    dx: 0, dy: 0, destra: true, passo: 0, sussulto: 0,
    mortoIl: null, tagli: 0, resti: null };
}
export function reimposta() { animali.length = 0; attesa = 12; sequenza = 0; }

export function prateria(px, py) {
  // Una piccola radura, non il singolo pixel d'erba fra le case o gli alberi.
  const tx = Math.floor(px/16), ty = Math.floor(py/16);
  for (let dy=-1;dy<=1;dy++) for (let dx=-1;dx<=1;dx++) {
    const t = mappa.terrenoNaturaleDi(tx+dx,ty+dy);
    if (![TERRENO.ERBA, TERRENO.STERPAGLIA].includes(t) || mappa.oggettoDi(tx+dx,ty+dy) !== OGGETTO.NESSUNO) return false;
  }
  return urti.liberoIn(px,py);
}
function nasce(eroe) {
  const seme = mappa.semeCorrente().valore;
  const giro = ++sequenza;
  for (let i=0;i<24;i++) {
    const angolo = impronta(giro,i,seme ^ 0x717ab) * Math.PI*2;
    const distanza = 260 + impronta(i,giro,seme ^ 0x431ab)*120;
    const px = eroe.px+Math.cos(angolo)*distanza, py = eroe.py+Math.sin(angolo)*distanza;
    if (!prateria(px,py) || animali.some(e=>Math.hypot(e.px-px,e.py-py)<80)) continue;
    const tiro = impronta(giro,i,seme ^ 0x167ba);
    const specie = tiro<0.35 ? 'cervo' : tiro<0.65 ? 'cavallo' : tiro<0.9 ? 'bufalo' : 'orso';
    animali.push(crea(specie,px,py,Math.floor(impronta(i,giro,seme)*4294967296)));
    break;
  }
}
export function pulisci() {
  for(let i=animali.length-1;i>=0;i--) {
    const e=animali[i];
    // Stesso calendario della carne cruda: nessuna carcassa deve restituire
    // carne già scaduta che si potrebbe mangiare prima del prossimo cambio giorno.
    const giornoMorte=Math.floor(e.mortoIl/tempo.SECONDI_PER_GIORNO)+1;
    if(e.vita===0 && tempo.giornoCorrente()-giornoMorte>=2) animali.splice(i,1);
  }
}

export function percepisci(e, passo, eroe) {
  const s=SPECIE[e.specie], distanza=Math.hypot(e.px-eroe.px,e.py-eroe.py);
  const vede=vistaLibera(e,eroe);
  if (e.stato==='aggressivo') {
    if (vede && distanza<160) e.memoria=6;
    else e.memoria=Math.max(0,e.memoria-passo);
    if (e.memoria===0) { e.stato='calmo'; e.pressione=0; }
    return;
  }
  if (e.stato==='fuga') {
    e.memoria=Math.max(0,e.memoria-passo);
    if(e.memoria===0 && (!vede || distanza>s.raggio)) e.stato='calmo';
    return;
  }
  if (!vede || distanza>s.raggio) { e.pressione=0; e.stato='calmo'; return; }
  if (e.specie==='cavallo') { e.stato='fuga'; e.memoria=5; return; }
  if (e.specie==='orso') { e.stato='aggressivo'; e.memoria=6; return; }
  e.pressione+=passo;
  e.stato='allerta';
  if(e.pressione+1e-9>=TOLLERANZA) {
    e.stato=caso(e)<s.rischio ? 'aggressivo' : 'fuga';
    e.memoria=6; e.pressione=0;
  }
}

// Quanto vicini si tollerano. È la stessa ragione per cui gli infetti si
// sgomitano — due sagome sovrapposte al pixel si leggono come una sola, e in
// un gioco in cui la domanda è "quanti ne ho intorno" saperne contare uno
// quando sono due è l'informazione peggiore possibile — con due misure invece
// di una: fra bestie conta la groppa, larga il doppio di un uomo; con chi
// cammina conta il punto in cui un animale è addosso, che è lo stesso a cui si
// ferma quando carica. Se qui fosse più largo, la carica si respingerebbe da
// sola a ogni fotogramma e l'orso tremerebbe sul posto invece di arrivare.
const FRA_LORO = 18;
const ADDOSSO = 12;

// Scansa "a" da "b". Con entrambi si dividono lo spostamento; senza, si sposta
// soltanto "a", ed è il caso di chi non deve essere spinto: il superstite, che
// si troverebbe mosso dal gioco mentre tiene premuto, e la carcassa, che sta
// dove è caduta con sopra la roba che non ti è entrata nello zaino.
function scansa(a, b, minima, entrambi) {
  let dx=a.px-b.px, dy=a.py-b.py, distanza=Math.hypot(dx,dy);
  // Negato, e non "maggiore o uguale": una distanza che non è un numero esce
  // di qui invece di finire scritta nelle coordinate di una bestia.
  if(!(distanza<minima)) return;
  // Sovrapposti al pixel non esiste una direzione in cui separarli, e dividere
  // per zero li manderebbe a coordinate che non sono numeri. Se ne prende una
  // dal posto, non dal generatore dell'esemplare: quello sta nel salvataggio e
  // decide il temperamento, e consumarlo qui legherebbe il carattere di un
  // cervo a quante volte gli è passato addosso qualcuno — cioè al fotogramma.
  if(distanza<0.001) {
    const angolo=impronta(Math.round(a.px),Math.round(a.py),a.seme)*Math.PI*2;
    dx=Math.cos(angolo);dy=Math.sin(angolo);distanza=1;
  }
  const spinta=entrambi ? (minima-distanza)/2 : minima-distanza;
  // Sempre attraverso urti.muovi(): uno scansato dentro un muro sarebbe un
  // animale che attraversa quello che il superstite non attraversa.
  urti.muovi(a,dx/distanza*spinta,dy/distanza*spinta);
  if(entrambi) urti.muovi(b,-dx/distanza*spinta,-dy/distanza*spinta);
}

// Da chiamare quando si sono mossi tutti, come per gli infetti. Le carcasse
// non partecipano: non spingono e non si spostano. Farle spingere vorrebbe
// dire regalare uno scudo — bastava mettersi dietro un bufalo morto e l'orso
// non arrivava più — e farle spostare vorrebbe dire un corpo che si allontana
// dal punto in cui l'hai abbattuto, portandosi via quello che ci hai lasciato.
export function sgomitano(eroe) {
  for(let i=0;i<animali.length;i++) {
    const a=animali[i];
    if(a.vita<=0) continue;
    for(let j=i+1;j<animali.length;j++)
      if(animali[j].vita>0) scansa(a,animali[j],FRA_LORO,true);
    // Senza copie né insiemi: questa gira sessanta volte al secondo, e un
    // array nuovo per bestia per fotogramma è spazzatura da raccogliere.
    // L'eroe si nomina a parte perché nei collaudi non sta nel registro delle
    // entità; in partita ci sta, e allora basta non contarlo due volte.
    let gia=false;
    for(const corpo of entita.tutte()) { if(corpo===eroe) gia=true; scansa(a,corpo,ADDOSSO,false); }
    if(eroe && !gia) scansa(a,eroe,ADDOSSO,false);
  }
}

function muovi(e, dx, dy, distanza) {
  const n=Math.hypot(dx,dy);
  if (!n) return;
  if (Math.abs(dx)>0.01) e.destra=dx>0;
  // Piccoli passi per impedire di attraversare muri durante un fotogramma lento.
  const pezzi=Math.max(1,Math.ceil(distanza/3));
  for(let i=0;i<pezzi;i++) e.passo+=urti.muovi(e,dx/n*distanza/pezzi,dy/n*distanza/pezzi)/6;
}
function avanza(e, passo, eroe) {
  const s=SPECIE[e.specie];
  e.ricarica=Math.max(0,e.ricarica-passo);
  e.sussulto=Math.max(0,e.sussulto-passo);
  const dx=eroe.px-e.px, dy=eroe.py-e.py, distanza=Math.hypot(dx,dy);
  const fattore=meteo.fattoreVelocita(e);
  if(e.sussulto>0) return false;
  if(e.stato==='aggressivo' && vistaLibera(e,eroe)) {
    muovi(e,dx,dy,Math.min(Math.max(0,distanza-ADDOSSO),s.velocita*fattore*passo));
    if(e.ricarica===0 && Math.hypot(e.px-eroe.px,e.py-eroe.py)<=15 && vistaLibera(e,eroe)) {
      e.ricarica=1.4;
      if(s.danno>0) { salute.ferita(s.danno,'animali'); return true; }
    }
  } else if(e.stato==='fuga') {
    muovi(e,-dx || 0.01,-dy,s.velocita*fattore*passo);
  } else if(e.stato==='calmo') {
    e.giro-=passo;
    if(e.giro<=0) {
      e.giro=2+caso(e)*4;
      const angolo=caso(e)*Math.PI*2, fermo=caso(e)<0.5;
      e.dx=fermo?0:Math.cos(angolo); e.dy=fermo?0:Math.sin(angolo);
    }
    muovi(e,e.dx,e.dy,14*fattore*passo);
  }
  return false;
}
export function aggiorna(passo, eroe) {
  const eventi={attacchi:0,allerta:null};
  if(!Number.isFinite(passo)||passo<=0||salute.eMorto()) return eventi;
  pulisci();
  for(let i=animali.length-1;i>=0;i--) {
    if(animali[i].vita>0 && Math.hypot(animali[i].px-eroe.px,animali[i].py-eroe.py)>620) animali.splice(i,1);
  }
  attesa-=passo;
  // Il tetto si chiede adesso e non all'arrivo di prima: cambiando stagione
  // quelle che c'erano restano — non si dissolvono sotto gli occhi — e il
  // magro comincia dal fatto che non ne arrivano altre.
  if(attesa<=0) { attesa=ogniQuanto(); if(quanti()<quanteNeVuole()) nasce(eroe); }
  for(const e of animali) {
    if(e.vita<=0 || salute.eMorto()) continue;
    const prima=e.stato;
    percepisci(e,passo,eroe);
    if(e.stato!==prima && ['allerta','aggressivo'].includes(e.stato))
      eventi.allerta=SPECIE[e.specie].nome+(e.stato==='allerta'?' inquieto: allontanati':' ti attacca!');
    if(avanza(e,passo,eroe)) eventi.attacchi++;
  }
  return eventi;
}

const DIREZIONI={su:[0,-1],giu:[0,1],sinistra:[-1,0],destra:[1,0]};
export function davanti(eroe,portata,carcassa=false) {
  pulisci();
  const [dx,dy]=DIREZIONI[eroe.guarda]??DIREZIONI.giu;
  let trovato=null,minima=Infinity;
  for(const e of animali) {
    if((e.vita===0)!==carcassa) continue;
    const vx=e.px-eroe.px,vy=e.py-eroe.py,d=Math.hypot(vx,vy);
    if(d>portata || d>=minima || (d>6 && vx*dx+vy*dy<=0) || !vistaLibera(eroe,e)) continue;
    trovato=e;minima=d;
  }
  return trovato;
}
export function colpisci(e,danno) {
  if(!animali.includes(e)||e.vita<=0||!Number.isFinite(danno)||danno<=0) return {caduto:false};
  e.vita=Math.max(0,e.vita-danno);e.sussulto=0.3;
  if(e.vita===0) {
    e.mortoIl=adesso();e.stato='carcassa';e.pressione=0;e.memoria=0;e.sussulto=0;
    return {caduto:true};
  }
  // Il cavallo non reagisce mai con un attacco, nemmeno se ferito.
  e.stato=e.specie==='cavallo'?'fuga':'aggressivo';e.memoria=6;
  return {caduto:false};
}
// C'è posto per quello che uscirebbe da questa carcassa? Se la risposta è no,
// non c'è lavoro da fare: la barra lo chiede prima di proporre il gesto e
// macella() lo richiede prima di consumare un uso d'ascia, ed è giusto che sia
// la stessa riga a rispondere a tutte e due.
export function spazioPerIResti(e) {
  if(e.resti) return Object.entries(e.resti).some(([cosa,n]) => n>0 && inventario.spazioPer(cosa)>0);
  return inventario.spazioPer('carne_cruda')>=1 || inventario.spazioPer('pelle')>=1;
}
export function macella(e) {
  pulisci();
  if(!animali.includes(e)||e.vita!==0) return null;
  if(!spazioPerIResti(e)) return {tipo:'zainoPieno'};
  const lavorato=e.resti===null;
  if(lavorato) {
    e.tagli++;
    if(e.tagli<3) return {tipo:'macellazione',restano:3-e.tagli,lavorato:true};
    e.resti={carne_cruda:carneDi(e),pelle:SPECIE[e.specie].pelli};
  }
  const presi=[];
  for(const cosa of ['carne_cruda','pelle']) {
    const quanti=e.resti[cosa];
    const resto=inventario.aggiungi(cosa,quanti,Math.floor(e.mortoIl/tempo.SECONDI_PER_GIORNO)+1);
    if(resto<quanti) presi.push({cosa,quante:quanti-resto});
    e.resti[cosa]=resto;
  }
  const resta=e.resti.carne_cruda+e.resti.pelle;
  if(resta===0) animali.splice(animali.indexOf(e),1);
  return {tipo:'macellato',presi,resta,lavorato};
}

// Solo dati: sprite e cache grafiche non entrano nel file della partita.
const CAMPI=['specie','px','py','vita','seme','stato','pressione','memoria','ricarica','giro','dx','dy','destra','passo','sussulto','mortoIl','tagli','resti'];
export function istantanea() {
  pulisci();
  return {attesa,sequenza,animali:animali.map(e=>structuredClone(Object.fromEntries(CAMPI.map(k=>[k,e[k]]))))};
}
export function ripristina(dati) {
  reimposta();
  if(!dati) return;
  attesa=dati.attesa;sequenza=dati.sequenza;
  animali.push(...structuredClone(dati.animali));
  pulisci();
}
export function statoValido(dati) {
  const numero=(n,a,b)=>Number.isFinite(n)&&n>=a&&n<=b;
  const intero=(n,a,b)=>Number.isSafeInteger(n)&&n>=a&&n<=b;
  if(!dati || !numero(dati.attesa,0,ATTESA_MASSIMA)||!intero(dati.sequenza,0,Number.MAX_SAFE_INTEGER)||
      !Array.isArray(dati.animali)||dati.animali.length>64) return false;
  let vivi=0;
  return dati.animali.every(e=>{
    if(!e||!Object.hasOwn(SPECIE,e.specie)) return false;
    const s=SPECIE[e.specie];
    if(!numero(e.px,-1e9,1e9)||!numero(e.py,-1e9,1e9)||!numero(e.vita,0,s.vita)||!intero(e.seme,0,4294967295)||
      !['calmo','allerta','aggressivo','fuga','carcassa'].includes(e.stato)||typeof e.destra!=='boolean') return false;
    if(!numero(e.pressione,0,TOLLERANZA)||!numero(e.memoria,0,6)||!numero(e.ricarica,0,1.4)||
      !numero(e.giro,-1,6)||!numero(e.dx,-1,1)||!numero(e.dy,-1,1)||!numero(e.passo,0,1e12)||
      !numero(e.sussulto,0,0.3)||!intero(e.tagli,0,3)) return false;
    if(e.specie==='cavallo' && ['aggressivo','allerta'].includes(e.stato)) return false;
    if(e.vita>0) return ++vivi<=VIVI_MASSIMI && e.stato!=='carcassa' && e.mortoIl===null && e.tagli===0 && e.resti===null;
    if(e.stato!=='carcassa'||!numero(e.mortoIl,0,1e12)) return false;
    if(e.tagli<3) return e.resti===null;
    return e.resti && intero(e.resti.carne_cruda,0,s.carne) && intero(e.resti.pelle,0,s.pelli);
  });
}
export function daDisegnare() {
  pulisci();
  return animali.map(e=>{
    const righe=e.vita===0?CARCASSE[e.specie]:ANIMALI[e.specie][Math.floor(e.passo)%2];
    const cotto=cuoci(righe);
    e.sprite=e.destra?cotto:riflesso(cotto);e.x=e.px-e.sprite.width/2;e.y=e.py-e.sprite.height;e.base=e.py;
    return e;
  });
}

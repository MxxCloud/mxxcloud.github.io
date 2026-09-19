import * as meteo from '../regole/meteo.js';
import * as atmosfera from '../arte/atmosfera.js';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import * as pesca from '../regole/pesca.js';
import * as acqua from '../regole/acqua.js';
import * as urti from '../entita/urti.js';
import { GHIACCIO } from '../arte/sprite-terreno.js';
import { CANNA } from '../arte/sprite-impugnati.js';
import { decodifica } from '../arte/sprite.js';
import { tavolozzaDi } from '../arte/tavolozza.js';
import * as tempo from '../regole/tempo.js';
import * as bisogni from '../regole/bisogni.js';
import * as salute from '../regole/salute.js';
import * as simulazione from '../regole/simulazione.js';
import * as inventario from '../regole/inventario.js';
import * as contenitori from '../regole/contenitori.js';
import * as azioni from '../regole/azioni.js';
import * as ricette from '../regole/ricette.js';
import * as mappa from '../mondo/mappa.js';
import * as modifiche from '../mondo/modifiche.js';
import * as salvataggio from '../regole/salvataggio.js';
import * as riparo from '../regole/riparo.js';
import * as freddo from '../regole/freddo.js';
import * as fauna from '../regole/fauna.js';
import * as arteFauna from '../arte/sprite-fauna.js';
import * as infetti from '../regole/infetti.js';
import * as entita from '../entita/entita.js';
import * as decadimento from '../regole/decadimento.js';
import { OGGETTO, TERRENO } from '../mondo/generazione.js';
import { CATALOGO } from '../regole/oggetti.js';
import { vistaLibera, fattoreSuono } from '../mondo/ostacoli.js';
import * as sprite from '../arte/sprite-cose.js';
import { TAVOLOZZA } from '../arte/tavolozza.js';

let tx, ty, eroe;
function reset() {
  fauna.reimposta();
  meteo.reimposta();
  pesca.interrompi(); mappa.impostaGelo(false);
  riparo.reimposta(); tempo.reimposta(); bisogni.reimposta(); salute.reimposta();
  inventario.svuota(); modifiche.svuota(); entita.svuota(); simulazione.resoconto();
  mappa.inizializza('review');
  const f=mappa.laFattoria();
  tx=f.tx;ty=f.ty;
  eroe={px:(tx+0.5)*16,py:(ty+0.75)*16,guarda:'destra'};
  for(let y=ty-5;y<=ty+5;y++) for(let x=tx-5;x<=tx+5;x++) modifiche.imposta(x,y,{oggetto:OGGETTO.NESSUNO});
}
beforeEach(reset);
const vicino = (a,b,eps=1e-7)=>assert.ok(Math.abs(a-b)<eps, `${a} != ${b}`);
function animale(specie, distanza=16, seme=1) {
  const e=fauna.crea(specie,eroe.px+distanza,eroe.py,seme);
  fauna.tutte().push(e);return e;
}
const pos = (x,y)=>({px:(x+0.5)*16,py:(y+0.75)*16});
function stanza() {
  for(let y=ty-2;y<=ty+2;y++)for(let x=tx-2;x<=tx+2;x++) {
    modifiche.imposta(x,y,{oggetto: Math.abs(x-tx)===2 || Math.abs(y-ty)===2 ? OGGETTO.MURO : OGGETTO.NESSUNO});
  }
  modifiche.imposta(tx+2,ty,{oggetto:OGGETTO.PORTA});

}

test('301 secondi in autunno: fotogrammi e recupero producono la stessa salute',()=>{
  tempo.impostaGiorno(5);
  for(let i=0;i<301*60;i++) simulazione.avanza(1/60);
  const attiva={...bisogni.tutti(),salute:salute.livelloCorrente()};
  reset();tempo.impostaGiorno(5);simulazione.avanza(301);
  vicino(salute.livelloCorrente(),attiva.salute);
  assert.ok(salute.livelloCorrente()>0.99);
  for(const k of bisogni.ELENCO)vicino(bisogni.livello(k),attiva[k]);
});
test('assenza: esaurimento e morte interrompono il tempo senza danno retroattivo',()=>{
  const trascorsi=simulazione.avanza(14400);
  assert.equal(salute.eMorto(),true);
  assert.ok(trascorsi>600 && trascorsi<1000);
  const giorno=tempo.giornoCorrente();simulazione.avanza(300);
  assert.equal(tempo.giornoCorrente(),giorno);
});
test('l’inverno attraversato fa morire l’orto prima della primavera',()=>{
  tempo.impostaGiorno(8);tempo.impostaOra(23);
  modifiche.imposta(tx,ty,{oggetto:OGGETTO.SEMINATO,bagnato:true});
  simulazione.avanza(5*300);
  assert.equal(modifiche.di(tx,ty).oggetto,OGGETTO.APPASSITA);
  assert.ok(tempo.giornoCorrente()<13);
});
test('il moltiplicatore invernale si applica soltanto dopo mezzanotte',()=>{
  tempo.impostaGiorno(8);tempo.impostaOra(23);
  simulazione.avanza(25);
  vicino(bisogni.livello('fame'),1-(12.5+12.5*2)/540);
  assert.equal(tempo.giornoCorrente(),9);
});
test('sonno: la sete fa danno solo dopo essersi esaurita, non lo sfinimento',()=>{
  tempo.impostaGiorno(5);
  bisogni.ripristina({fame:1,sete:0.1,stanchezza:0});
  simulazione.avanza(40,{dorme:true});
  // I primi 30 secondi possono curare; gli ultimi 10 costano 10/600.
  vicino(salute.livelloCorrente(),1-10/600);
});
test('coltura bagnata cresce una sola volta per mezzanotte',()=>{
  tempo.impostaOra(23);modifiche.imposta(tx,ty,{oggetto:OGGETTO.SEMINATO,bagnato:true});
  simulazione.avanza(26);
  assert.equal(modifiche.di(tx,ty).oggetto,OGGETTO.CRESCIUTA);
  assert.equal(simulazione.resoconto().cresciute,1);
  assert.equal(simulazione.resoconto().cresciute,0);
});
test('il gelo viene applicato nel recupero e cessato nel riparo',()=>{
  tempo.impostaGiorno(9);tempo.impostaOra(22);
  simulazione.avanza(10,{alFreddo:()=>freddo.alFreddo(eroe,null)});
  vicino(salute.livelloCorrente(),1-10/225);
  stanza();modifiche.imposta(tx-1,ty,{oggetto:OGGETTO.FALO_ACCESO});salute.reimposta();
  simulazione.avanza(10,{alFreddo:()=>freddo.alFreddo(eroe,null)});
  assert.equal(salute.livelloCorrente(),1);
});
test('getta e riprendi non ringiovaniscono il cibo',()=>{
  tempo.impostaGiorno(3);inventario.aggiungi('bacche',3,1);
  assert.equal(azioni.getta(eroe,0).tipo,'gettato');
  assert.equal(modifiche.di(tx+1,ty).dal,1);
  assert.equal(azioni.agisci(eroe,null).tipo,'preso');
  assert.equal(inventario.contenuto()[0].dal,1);
});
test('raccolta parziale mantiene la data del resto a terra',()=>{
  tempo.impostaGiorno(3);
  inventario.ripristina([{cosa:'bacche',quantita:19,dal:1},...Array.from({length:7},()=>({cosa:'ascia',quantita:1}))]);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.MUCCHIO,cosa:'bacche',quante:3,dal:1});
  azioni.agisci(eroe,null);
  assert.equal(modifiche.di(tx+1,ty).quante,2);assert.equal(modifiche.di(tx+1,ty).dal,1);
});
test('mucchi uniti conservano la media pesata delle date',()=>{
  tempo.impostaGiorno(3);modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.MUCCHIO,cosa:'bacche',quante:2,dal:1});
  inventario.aggiungi('bacche',2,3);azioni.getta(eroe,0);
  assert.equal(modifiche.di(tx+1,ty).dal,2);
});
test('il cibo gettato scade nel giorno previsto',()=>{
  tempo.impostaGiorno(3);inventario.aggiungi('bacche',3,1);azioni.getta(eroe,0);
  tempo.impostaGiorno(4);decadimento.nuovoGiorno();
  assert.equal(modifiche.di(tx+1,ty).oggetto,OGGETTO.NESSUNO);
});
test('ricetta fallita lascia identici contenuto, ordine e date',()=>{
  tempo.impostaGiorno(3);inventario.ripristina([{cosa:'bacche',quantita:12,dal:1},{cosa:'fibra',quantita:3},...Array.from({length:6},()=>({cosa:'ascia',quantita:1}))]);
  const prima=structuredClone(inventario.contenuto());
  assert.deepEqual(ricette.fai(ricette.RICETTE.find(r=>r.id==='conserva'),true),{fatto:false,perche:'zaino'});
  assert.deepEqual(inventario.contenuto(),prima);
});
test('cucina fallita non ringiovanisce le bacche',()=>{
  tempo.impostaGiorno(3);inventario.ripristina([{cosa:'bacche',quantita:12,dal:1},...Array.from({length:7},()=>({cosa:'ascia',quantita:1}))]);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FALO_ACCESO});
  const prima=structuredClone(inventario.contenuto());
  assert.equal(azioni.agisci(eroe,'bacche').tipo,'zainoPieno');assert.deepEqual(inventario.contenuto(),prima);
});
test('importazione malformata rifiutata senza mutare alcuno stato',()=>{
  const prima=salvataggio.istantanea(eroe,0);
  for(const alterazione of [{modifiche:{}},{modifiche:[null]},{inventario:[{cosa:'ignoto',quantita:1}]},{esplorato:['no,NaN']},{eroe:{px:NaN,py:1}},{giorno:-1},{bisogni:[]}]) {
    const stato={...prima,...alterazione};
    assert.equal(salvataggio.valido(stato),false);assert.equal(salvataggio.applica(stato),null);
    const dopo=salvataggio.istantanea(eroe,0);delete dopo.quando;
    const base={...prima};delete base.quando;assert.deepEqual(dopo,base);
  }
});
test('salvataggi precedenti senza campi opzionali restano caricabili',()=>{
  const stato={formato:1,seme:'vecchio',giorno:2,ore:7,eroe:{px:8,py:12}};
  assert.equal(salvataggio.valido(stato),true);assert.ok(salvataggio.applica(stato));
  assert.equal(salute.livelloCorrente(),1);
});
test('salvataggi e importazioni non condividono oggetti annidati',()=>{
  modifiche.imposta(tx,ty,{oggetto:OGGETTO.CASSA,contenuto:[{cosa:'bacche',quantita:2,dal:1}]});
  const stato=salvataggio.istantanea(eroe,0);
  modifiche.di(tx,ty).contenuto[0].quantita=1;
  const salvata=stato.modifiche.find(c=>c.tx===tx&&c.ty===ty);
  assert.equal(salvata.contenuto[0].quantita,2);
  assert.ok(salvataggio.applica(stato));salvata.contenuto[0].quantita=9;
  assert.equal(modifiche.di(tx,ty).contenuto[0].quantita,2);
});
test('muro e porta chiusa bloccano vista; porta aperta e macerie no',()=>{
  const a=pos(tx,ty),b=pos(tx+2,ty);
  for(const [oggetto,visibile] of [[OGGETTO.MURO,false],[OGGETTO.PORTA,false],[OGGETTO.PORTA_APERTA,true],[OGGETTO.MURO_ROTTO,true]]) {
    modifiche.imposta(tx+1,ty,{oggetto});assert.equal(vistaLibera(a,b),visibile);
    assert.equal(vistaLibera(b,a),visibile);
  }
});
test('gli angoli diagonali fra muri non lasciano passare la vista',()=>{
  const a={px:(tx+0.5)*16,py:(ty+0.5)*16},b={px:(tx+1.5)*16,py:(ty+1.5)*16};
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.MURO});
  assert.equal(vistaLibera(a,b),false);assert.equal(vistaLibera(b,a),false);
});
test('le pareti attenuano il rumore senza azzerarlo',()=>{
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.MURO});
  vicino(fattoreSuono(pos(tx,ty),pos(tx+2,ty)),0.35);
});
test('l’infetto sente un colpo attraverso il muro, non passi deboli né il bersaglio in vista',()=>{
  const nemico={...pos(tx+2,ty),preda:null,richiamo:null,memoria:0};
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.MURO});
  infetti.percepisci(nemico,0.1,eroe,32,true);assert.equal(nemico.preda,null);assert.equal(nemico.richiamo,null);
  infetti.percepisci(nemico,0.1,eroe,320,true);assert.equal(nemico.preda,null);assert.deepEqual(nemico.richiamo,{x:eroe.px,y:eroe.py});
});
test('la memoria conserva l’ultima posizione vista senza inseguimento onnisciente',()=>{
  const nemico={...pos(tx+2,ty),preda:null,richiamo:null,memoria:0};
  infetti.percepisci(nemico,0.1,eroe,0,false);assert.equal(nemico.preda,eroe);
  const prima={x:eroe.px,y:eroe.py};modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.MURO});eroe.py+=2;
  infetti.percepisci(nemico,0.1,eroe,0,false);assert.equal(nemico.preda,null);assert.deepEqual(nemico.richiamo,prima);
  infetti.percepisci(nemico,5,eroe,0,false);assert.equal(nemico.richiamo,null);
});
test('non si colpisce con la lancia attraverso un muro',()=>{
  entita.aggiungi({tipo:'infetto',...pos(tx+2,ty),vita:5});
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.MURO});
  assert.equal(infetti.quelloDavanti(eroe,64),null);
});
function chiuso() { riparo.aggiorna(0,tx,ty); return riparo.alChiuso(); }
test('muri e porta chiusa delimitano la stanza, ma senza fuoco resta fredda',()=>{
  stanza();tempo.impostaGiorno(9);tempo.impostaOra(22);
  assert.equal(chiuso(),true);assert.equal(freddo.alFreddo(eroe,null),true);
  modifiche.imposta(tx+2,ty,{oggetto:OGGETTO.PORTA_APERTA});assert.equal(chiuso(),false);
});
test('il fuoco riscalda tutta la stanza finché la porta è chiusa',()=>{
  for(let y=ty-3;y<=ty+3;y++)for(let x=tx-4;x<=tx+4;x++)
    modifiche.imposta(x,y,{oggetto:Math.abs(x-tx)===4||Math.abs(y-ty)===3?OGGETTO.MURO:OGGETTO.NESSUNO});
  modifiche.imposta(tx+4,ty,{oggetto:OGGETTO.PORTA});
  modifiche.imposta(tx-2,ty,{oggetto:OGGETTO.FALO_ACCESO});
  eroe={...eroe,...pos(tx+2,ty)};tempo.impostaGiorno(9);tempo.impostaOra(22);
  assert.equal(freddo.alFreddo(eroe,null),false);
  modifiche.imposta(tx+4,ty,{oggetto:OGGETTO.PORTA_APERTA});assert.equal(freddo.alFreddo(eroe,null),true);
});
test('rompere il muro invalida immediatamente il riparo',()=>{
  stanza();assert.equal(chiuso(),true);
  modifiche.imposta(tx-2,ty,{oggetto:OGGETTO.MURO_ROTTO});assert.equal(chiuso(),false);
});
test('un infetto può sfondare la porta verso una posizione sentita',()=>{
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.PORTA,colpi:4});
  entita.aggiungi({tipo:'infetto',...pos(tx+2,ty),px:(tx+2)*16+5,sfonda:true,richiamo:{x:eroe.px,y:eroe.py}});
  assert.equal(infetti.raccogliGliSfondamenti()[0]?.ceduto,true);
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.NESSUNO);
});
test('porta si apre e chiude, ma non sopra una persona',()=>{
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.PORTA});
  assert.equal(azioni.agisci(eroe,null).aperta,true);assert.equal(mappa.solidoIn(tx+1,ty),false);
  entita.aggiungi({tipo:'giocatore',...pos(tx+1,ty)});
  assert.equal(azioni.azionePossibile(eroe,null).impedito,'passaggio occupato');assert.equal(azioni.agisci(eroe,null),null);
  entita.svuota();assert.equal(azioni.agisci(eroe,null).aperta,false);assert.equal(mappa.solidoIn(tx+1,ty),true);
});
test('le nuove costruzioni richiedono banco e materiali',()=>{
  const ricetta=ricette.RICETTE.find(r=>r.id==='muro');inventario.aggiungi('pietra',3);inventario.aggiungi('legna',1);
  assert.equal(ricette.fai(ricetta).perche,'banco');assert.equal(ricette.fai(ricetta,true).fatto,true);
  assert.equal(azioni.agisci(eroe,'muro').tipo,'posa');assert.equal(mappa.solidoIn(tx+1,ty),true);
});
test('muri e porte persistono nel salvataggio',()=>{
  stanza();const stato=salvataggio.istantanea(eroe,0);assert.equal(salvataggio.valido(stato),true);
  modifiche.svuota();assert.ok(salvataggio.applica(stato));assert.equal(chiuso(),true);
});
test('salvataggio completo conserva inventario, cibo e danni alle porte',()=>{
  inventario.aggiungi('bacche',3,1);inventario.aggiungi('porta',1);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.PORTA,colpi:3});
  const stato=salvataggio.istantanea(eroe,0);
  assert.ok(salvataggio.valido(stato));assert.ok(salvataggio.applica(stato));
  assert.equal(modifiche.di(tx+1,ty).colpi,3);
  assert.equal(inventario.contenuto()[0].dal,1);
});
test('un morso non attraversa l’angolo di una parete',()=>{
  const giocatore={px:(tx+1)*16+2,py:(ty+1)*16+2};
  entita.aggiungi({tipo:'infetto',px:(tx+1)*16-2,py:(ty+1)*16-2,colpo:true});
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.MURO});
  assert.equal(infetti.raccogliIMorsi(giocatore).morsi,0);
  assert.equal(salute.livelloCorrente(),1);
});
test('sprite nuovi rettangolari, con soli colori della tavolozza',()=>{
  for(const nome of ['MURO_ICONA','PORTA_ICONA','PORTA','PORTA_APERTA']) {
    const righe=sprite[nome];assert.ok(righe.every(r=>r.length===righe[0].length),nome);
    for(const c of righe.join(''))assert.ok(c==='.'||Object.hasOwn(TAVOLOZZA,c),`${nome}: ${c}`);
  }
});
test('service worker conserva le cache delle altre applicazioni',async()=>{
  const handlers={},deleted=[];let completion;
  const source=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
  const versione=source.match(/const VERSIONE = "([^"]+)"/)[1];
  runInNewContext(source,{self:{addEventListener:(k,v)=>handlers[k]=v,clients:{claim:async()=>{}}},caches:{keys:async()=>['ultimo-raccolto-v28',versione,'budget-futuro-v5'],delete:async k=>{deleted.push(k);return true;}}});
  handlers.activate({waitUntil:p=>completion=p});await completion;
  assert.deepEqual(deleted,['ultimo-raccolto-v28']);
});
test('tutti i moduli di produzione sono precaricati offline',()=>{
  const root=new URL('../',import.meta.url);const sw=readFileSync(new URL('sw.js',root),'utf8');
  for(const dir of ['arte','mondo','motore','regole','entita','interfaccia']) {
    for(const p of readdirSync(new URL(dir+'/',root)))if(p.endsWith('.js'))assert.ok(sw.includes(`"./${dir}/${p}"`),p);
  }
});

let rivaNota;
function allaRiva() {
  if (!rivaNota) {
    ricerca: for(let y=-128;y<=128;y++)for(let x=-128;x<=128;x++) {
      const a=tx+x,b=ty+y,t=mappa.terrenoNaturaleDi(a,b),prima=mappa.terrenoNaturaleDi(a-1,b);
      if(t===TERRENO.ACQUA_BASSA && prima!==TERRENO.ACQUA && prima!==TERRENO.ACQUA_BASSA) {
        rivaNota={tx:a,ty:b};break ricerca;
      }
    }
  }
  assert.ok(rivaNota,'riva generata');
  const b=rivaNota;
  modifiche.imposta(b.tx-1,b.ty,{oggetto:OGGETTO.NESSUNO});
  modifiche.imposta(b.tx,b.ty,{oggetto:OGGETTO.NESSUNO});
  eroe={...pos(b.tx-1,b.ty),guarda:'destra'};
  inventario.aggiungi('canna',1);
  return b;
}
test('canna costruibile senza banco con rami e fibra',()=>{
  inventario.aggiungi('ramo',3);inventario.aggiungi('fibra',4);
  assert.equal(ricette.fai(ricette.RICETTE.find(r=>r.id==='canna')).fatto,true);
  assert.equal(inventario.quante('canna'),1);assert.equal(inventario.quante('fibra'),0);
});
test('pesca: attesa completa, tempo e bisogni continuano, una cattura sola',()=>{
  allaRiva();assert.equal(azioni.agisci(eroe,'canna').tipo,'pesca');
  const ora=tempo.oraCorrente(),fame=bisogni.livello('fame');
  for(let i=0;i<pesca.ATTESA-1;i++){simulazione.avanza(1);assert.equal(pesca.aggiorna(1,eroe,'canna'),null);}
  assert.equal(inventario.quante('pesce_crudo'),0);
  simulazione.avanza(1);assert.equal(pesca.aggiorna(1,eroe,'canna').tipo,'pescato');
  assert.ok(tempo.oraCorrente()>ora);assert.ok(bisogni.livello('fame')<fame);
  assert.equal(pesca.aggiorna(100,eroe,'canna'),null);assert.equal(inventario.quante('pesce_crudo'),1);
  assert.equal(inventario.contenuto().find(c=>c?.cosa==='pesce_crudo').dal,tempo.giornoCorrente());
});
test('muoversi, girarsi, cambiare attrezzo o ferirsi interrompe la pesca',()=>{
  for(const motivo of ['muovi','gira','attrezzo','ferita']) {
    reset();allaRiva();azioni.agisci(eroe,'canna');
    if(motivo==='muovi')eroe.px+=1;if(motivo==='gira')eroe.guarda='su';
    if(motivo==='ferita')salute.ferita(0.1,'infetti');
    assert.equal(pesca.aggiorna(pesca.ATTESA,eroe,motivo==='attrezzo'?'ascia':'canna').tipo,'pescaInterrotta');
    assert.equal(inventario.quante('pesce_crudo'),0);
  }
});
test('spazio ritira la lenza e non consuma il punto di pesca',()=>{
  const b=allaRiva();azioni.agisci(eroe,'canna');
  assert.equal(azioni.agisci(eroe,'canna').tipo,'pescaInterrotta');assert.equal(pesca.stato(),null);
  assert.equal(modifiche.di(b.tx,b.ty).pescati,undefined);
});
test('due pesci per punto e giorno: salvare e ricaricare non rigenera la scorta',()=>{
  const b=allaRiva();
  for(let i=0;i<2;i++){azioni.agisci(eroe,'canna');assert.equal(pesca.aggiorna(pesca.ATTESA,eroe,'canna').tipo,'pescato');}
  const stato=salvataggio.istantanea(eroe,0);assert.ok(salvataggio.valido(stato));assert.ok(salvataggio.applica(stato));
  assert.match(pesca.impedimento(b.tx,b.ty),/domani/);assert.equal(azioni.agisci(eroe,'canna'),null);
  tempo.impostaGiorno(2);assert.equal(pesca.impedimento(b.tx,b.ty),null);
});
test('zaino pieno alla partenza e alla cattura non perde pesci né oggetti',()=>{
  const b=allaRiva();for(let i=0;i<7;i++)inventario.aggiungi('ascia',1);
  assert.equal(azioni.azionePossibile(eroe,'canna').impedito,'zaino pieno');
  inventario.togli('ascia',1);azioni.agisci(eroe,'canna');inventario.aggiungi('ascia',1);
  const prima=structuredClone(inventario.contenuto());
  assert.equal(pesca.aggiorna(pesca.ATTESA,eroe,'canna').motivo,'zaino pieno');
  assert.deepEqual(inventario.contenuto(),prima);assert.equal(modifiche.di(b.tx,b.ty).pescati,undefined);
});
test('inverno: ghiaccia solo il bassofondo e la pesca si ferma',()=>{
  const b=allaRiva();azioni.agisci(eroe,'canna');tempo.impostaGiorno(9);acqua.aggiorna();
  assert.equal(mappa.terrenoDi(b.tx,b.ty),TERRENO.GHIACCIO);assert.equal(mappa.solidoIn(b.tx,b.ty),false);
  assert.equal(mappa.terrenoNaturaleDi(b.tx,b.ty),TERRENO.ACQUA_BASSA);
  assert.equal(pesca.aggiorna(pesca.ATTESA,eroe,'canna').tipo,'pescaInterrotta');
  assert.match(azioni.azionePossibile(eroe,'canna').impedito,/inverno/);
  let profonda;for(let y=b.ty-30;y<=b.ty+30&&!profonda;y++)for(let x=b.tx-30;x<=b.tx+30;x++)if(mappa.terrenoDi(x,y)===TERRENO.ACQUA){profonda={x,y};break;}
  assert.ok(profonda);assert.equal(mappa.solidoIn(profonda.x,profonda.y),true);
  assert.match(pesca.impedimento(profonda.x,profonda.y),/inverno/);
});
test('ghiaccio percorribile anche dagli infetti; disgelo riporta entrambi a terra',()=>{
  const b=allaRiva();tempo.impostaGiorno(9);acqua.aggiorna();
  eroe={...eroe,...pos(b.tx,b.ty)};const nemico={...eroe,tipo:'infetto'};
  assert.ok(urti.liberoIn(eroe.px,eroe.py));
  const stato=salvataggio.istantanea(eroe,0);assert.ok(salvataggio.applica(stato));
  tempo.impostaGiorno(13);const esito=acqua.aggiorna([eroe,nemico]);
  assert.equal(esito.riportati.length,2);assert.ok(urti.liberoIn(eroe.px,eroe.py));assert.ok(urti.liberoIn(nemico.px,nemico.py));
  assert.equal(mappa.terrenoDi(b.tx,b.ty),TERRENO.ACQUA_BASSA);
  assert.equal(pesca.impedimento(b.tx,b.ty),null);
});
test('sul ghiaccio non si costruisce, getta, beve o riempie il secchio',()=>{
  allaRiva();tempo.impostaGiorno(9);acqua.aggiorna();
  assert.equal(azioni.azionePossibile(eroe,'muro'),null);
  assert.equal(azioni.getta(eroe,0).tipo,'nonCePosto');
  inventario.aggiungi('secchio',1);assert.match(azioni.azionePossibile(eroe,'secchio').impedito,/ghiaccio/);
  bisogni.ripristina({fame:1,sete:0.3,stanchezza:1});assert.equal(azioni.agisci(eroe,null),null);
});
test('pesce crudo cuoce al falò, ristora e deperisce come gli altri cibi',()=>{
  inventario.aggiungi('pesce_crudo',2,1);modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FALO_ACCESO});
  assert.equal(azioni.agisci(eroe,'pesce_crudo').diventa,'pesce_arrostito');
  tempo.impostaGiorno(3);decadimento.nuovoGiorno();
  assert.equal(inventario.quante('pesce_crudo'),0);assert.equal(inventario.quante('pesce_arrostito'),1);
  tempo.impostaGiorno(5);decadimento.nuovoGiorno();assert.equal(inventario.quante('pesce_arrostito'),0);
});
test('nuovi sprite e ghiaccio si decodificano in tutte le stagioni',()=>{
  for(const stagione of ['estate','autunno','inverno','primavera'])for(const righe of [sprite.CANNA,sprite.PESCE_CRUDO,sprite.PESCE_ARROSTITO,CANNA,...GHIACCIO]) {
    const d=decodifica(righe,tavolozzaDi(stagione));assert.ok(d.pixel.some(v=>v>0));
  }
});
test('salvataggi con conteggi di pesca corrotti sono rifiutati senza mutazioni',()=>{
  const b=allaRiva(),stato=salvataggio.istantanea(eroe,0);
  stato.modifiche.push({...b,pescati:-1,giornoPesca:1});
  assert.equal(salvataggio.applica(stato),null);assert.equal(inventario.quante('canna'),1);
});
test('entrambi i pesci si mangiano; cuocere aumenta il nutrimento',()=>{
  bisogni.ripristina({fame:0,sete:1,stanchezza:1});
  inventario.aggiungi('pesce_crudo',1);inventario.aggiungi('pesce_arrostito',1);
  assert.equal(azioni.consuma('pesce_crudo').tipo,'consumato');vicino(bisogni.livello('fame'),0.18);
  azioni.consuma('pesce_arrostito');vicino(bisogni.livello('fame'),0.58);
});
test('cattura interrotta al cambio inverno e riavviabile in primavera',()=>{
  allaRiva();tempo.impostaGiorno(8);tempo.impostaOra(23.99);
  azioni.agisci(eroe,'canna');simulazione.avanza(1);
  assert.equal(pesca.aggiorna(1,eroe,'canna').tipo,'pescaInterrotta');
  tempo.impostaGiorno(13);acqua.aggiorna();assert.equal(azioni.agisci(eroe,'canna').tipo,'pesca');
});
test('interrompere prima del recupero non cattura pesci in assenza',()=>{
  allaRiva();azioni.agisci(eroe,'canna');pesca.aggiorna(5,eroe,'canna');
  pesca.interrompi();simulazione.avanza(40);
  assert.equal(pesca.aggiorna(40,eroe,'canna'),null);assert.equal(inventario.quante('pesce_crudo'),0);
});
test('minimappa già in cache distingue gelo e disgelo senza spostamenti',async()=>{
  allaRiva();
  const minimappa=await import('../interfaccia/minimappa.js');
  const tinte=await import('../interfaccia/tinte.js');
  const prima=globalThis.document;let pixel;
  globalThis.document={createElement:()=>({getContext:()=>({
    createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
    putImageData:d=>{pixel=Uint8ClampedArray.from(d.data);},
  })})};
  try {
    minimappa.dimentica();tinte.impostaTavolozza(tavolozzaDi('estate'));minimappa.aggiorna(eroe);
    const indice=(32*64+33)*4;
    assert.deepEqual([...pixel.slice(indice,indice+3)],tinte.coloreDi(TERRENO.ACQUA_BASSA));
    tempo.impostaGiorno(9);acqua.aggiorna();tinte.impostaTavolozza(tavolozzaDi('inverno'));minimappa.ridipingiSeServe(true);
    assert.deepEqual([...pixel.slice(indice,indice+3)],tinte.coloreDi(TERRENO.GHIACCIO));
    tempo.impostaGiorno(13);acqua.aggiorna();tinte.impostaTavolozza(tavolozzaDi('primavera'));minimappa.ridipingiSeServe(false);
    assert.deepEqual([...pixel.slice(indice,indice+3)],tinte.coloreDi(TERRENO.ACQUA_BASSA));
  } finally { globalThis.document=prima; }
});

function maltempo(tipo) {
  for(let d=1;d<=16;d++)if(meteo.evento(d)===tipo){tempo.impostaGiorno(d);tempo.impostaOra(12);return d;}
  assert.fail('evento mancante');
}
test('un evento per stagione e anno; mai pioggia estiva; previsioni stabili per seme',()=>{
  for(const seme of ['review','altra valle','neve']) {
    mappa.inizializza(seme);
    for(let anno=0;anno<8;anno++)for(let stagione=0;stagione<4;stagione++) {
      const giorni=Array.from({length:4},(_,i)=>meteo.evento(anno*16+stagione*4+i+1));
      if(stagione===0)assert.deepEqual(giorni,['arido','arido','arido','arido']);
      else assert.equal(giorni.filter(e=>e===(stagione===2?'neve':'pioggia')).length,1);
    }
    const prima=Array.from({length:32},(_,i)=>meteo.evento(i+1));
    mappa.inizializza(seme);assert.deepEqual(Array.from({length:32},(_,i)=>meteo.evento(i+1)),prima);
  }
});
test('aridità triplica la sete per tutta l’estate, anche dormendo',()=>{
  for(const dorme of [false,true])for(let giorno=1;giorno<=4;giorno++) {
    reset();tempo.impostaGiorno(giorno);simulazione.avanza(30,{dorme});vicino(bisogni.livello('sete'),0.7);
  }
  reset();tempo.impostaGiorno(5);simulazione.avanza(30);vicino(bisogni.livello('sete'),0.9);
});
test('aridità finisce esattamente al confine estate/autunno',()=>{
  tempo.impostaGiorno(4);tempo.impostaOra(23);simulazione.avanza(25);
  vicino(bisogni.livello('sete'),1-50/300);
});
test('danni da sete estiva non retroattivi nel recupero',()=>{
  simulazione.avanza(101);vicino(salute.livelloCorrente(),1-1/600);
});
test('pioggia bagna le colture aperte ma non quelle nella stanza',()=>{
  stanza();maltempo('pioggia');
  modifiche.imposta(tx,ty,{oggetto:OGGETTO.SEMINATO});
  modifiche.imposta(tx+4,ty,{oggetto:OGGETTO.SEMINATO});
  const esito=meteo.aggiornaMondo();assert.equal(esito.innaffiate,1);
  assert.equal(modifiche.di(tx,ty).bagnato,undefined);assert.equal(modifiche.di(tx+4,ty).bagnato,true);
  assert.equal(meteo.aggiornaMondo().innaffiate,0);
});
test('pioggia spegne solo i falò scoperti; aprire la porta espone quello dentro',()=>{
  stanza();maltempo('pioggia');
  modifiche.imposta(tx-1,ty,{oggetto:OGGETTO.FALO_ACCESO,posata:tempo.giornoCorrente()});
  modifiche.imposta(tx+4,ty,{oggetto:OGGETTO.FALO_ACCESO,posata:tempo.giornoCorrente()});
  assert.equal(meteo.aggiornaMondo().spenti,1);
  assert.equal(mappa.oggettoDi(tx-1,ty),OGGETTO.FALO_ACCESO);
  modifiche.imposta(tx+2,ty,{oggetto:OGGETTO.PORTA_APERTA});
  assert.equal(meteo.aggiornaMondo().spenti,1);assert.equal(mappa.oggettoDi(tx-1,ty),OGGETTO.FALO_SPENTO);
});
test('pioggia impedisce di sprecare un falò posandolo allo scoperto',()=>{
  maltempo('pioggia');inventario.aggiungi('falo',1);
  assert.match(azioni.azionePossibile(eroe,'falo').impedito,/coperto/);
  assert.equal(azioni.agisci(eroe,'falo'),null);assert.equal(inventario.quante('falo'),1);
  stanza();assert.equal(azioni.agisci(eroe,'falo').tipo,'posa');
});
test('colture seminate dopo l’inizio della pioggia ricevono acqua',()=>{
  maltempo('pioggia');meteo.aggiornaMondo();
  modifiche.imposta(tx,ty,{oggetto:OGGETTO.SEMINATO});meteo.aggiornaMondo();
  assert.equal(modifiche.di(tx,ty).bagnato,true);
});
test('la pioggia durante un’assenza fa crescere l’orto alla mezzanotte giusta',()=>{
  const giorno=maltempo('pioggia');tempo.impostaOra(23);
  modifiche.imposta(tx,ty,{oggetto:OGGETTO.SEMINATO});simulazione.avanza(13);
  assert.equal(tempo.giornoCorrente(),giorno+1);assert.equal(mappa.oggettoDi(tx,ty),OGGETTO.CRESCIUTA);
  assert.equal(modifiche.di(tx,ty).bagnato,undefined);
});
test('pioggia inzuppa in venti secondi e raffredda anche di giorno',()=>{
  maltempo('pioggia');assert.equal(freddo.alFreddo(eroe,null),false);
  meteo.avanza(9,eroe);assert.equal(freddo.alFreddo(eroe,null),false);
  meteo.avanza(11,eroe);assert.equal(meteo.livelloBagnato(),1);assert.equal(freddo.alFreddo(eroe,null),true);
  assert.equal(freddo.alFreddo(eroe,'torcia'),false);
});
test('copertura impedisce di bagnarsi; fuoco coperto asciuga più in fretta',()=>{
  stanza();maltempo('pioggia');meteo.avanza(30,eroe);assert.equal(meteo.livelloBagnato(),0);
  meteo.ripristina(1);meteo.avanza(10,eroe);vicino(meteo.livelloBagnato(),0.75);
  modifiche.imposta(tx-1,ty,{oggetto:OGGETTO.FALO_ACCESO});meteo.aggiornaMondo();
  meteo.avanza(10,eroe);assert.equal(meteo.livelloBagnato(),0);assert.equal(freddo.alFreddo(eroe,null),false);
});
test('pioggia: simulazione a fotogrammi e recupero concordano su acqua e salute',()=>{
  maltempo('pioggia');
  for(let i=0;i<30*60;i++)simulazione.avanza(1/60,{eroe,alFreddo:()=>freddo.alFreddo(eroe,null)});
  const prima=salute.livelloCorrente(),bagnato=meteo.livelloBagnato();
  reset();maltempo('pioggia');simulazione.avanza(30,{eroe,alFreddo:()=>freddo.alFreddo(eroe,null)});
  vicino(salute.livelloCorrente(),prima);vicino(meteo.livelloBagnato(),bagnato);
});
test('neve rallenta allo scoperto e causa freddo diurno; il riparo protegge',()=>{
  maltempo('neve');assert.equal(meteo.fattoreVelocita(eroe),0.72);assert.equal(freddo.alFreddo(eroe,null),true);
  stanza();assert.equal(meteo.fattoreVelocita(eroe),1);assert.equal(freddo.alFreddo(eroe,null),false);
});
test('il sonno esposto alla pioggia non evita bagnato e freddo',()=>{
  maltempo('pioggia');modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.GIACIGLIO});tempo.impostaOra(22);
  assert.equal(azioni.agisci(eroe,null).tipo,'dormi');assert.ok(salute.livelloCorrente()<1);
});
test('bagnato persistente; salvataggi vecchi asciutti e valori corrotti respinti',()=>{
  meteo.ripristina(0.8);const stato=salvataggio.istantanea(eroe,0);
  meteo.reimposta();salvataggio.applica(stato);vicino(meteo.livelloBagnato(),0.8);
  assert.equal(salvataggio.applica({...stato,bagnato:2}),null);vicino(meteo.livelloBagnato(),0.8);
  delete stato.bagnato;salvataggio.applica(stato);assert.equal(meteo.livelloBagnato(),0);
});
test('precipitazioni disegnate soltanto negli eventi e con numero limitato di particelle',()=>{
  let n=0;const p={save(){},restore(){},fillRect(){n++;}};
  atmosfera.disegna(p,'arido',1);assert.equal(n,0);
  atmosfera.disegna(p,'pioggia',1);assert.equal(n,70);
  n=0;atmosfera.disegna(p,'neve',1);assert.equal(n,90);
});

test('fame 2x in ogni giorno invernale, nel sonno e nel recupero',()=>{
  for(let giorno=9;giorno<=12;giorno++)for(const dorme of [true,false]) {
    reset();tempo.impostaGiorno(giorno);simulazione.avanza(30,{dorme});
    vicino(bisogni.livello('fame'),1-60/540);
  }
});
test('freddo: danni 1x, 2x dopo 15s, 3x dopo 30s e nessun aumento ulteriore',()=>{
  salute.avanza(14,{alFreddo:true});assert.equal(salute.moltiplicatoreFreddo(),1);
  salute.avanza(1,{alFreddo:true});assert.equal(salute.moltiplicatoreFreddo(),2);
  vicino(salute.livelloCorrente(),1-15/225);
  salute.avanza(15,{alFreddo:true});assert.equal(salute.moltiplicatoreFreddo(),3);
  vicino(salute.livelloCorrente(),1-45/225);
  salute.avanza(15,{alFreddo:true});vicino(salute.livelloCorrente(),1-90/225);
  assert.equal(salute.secondiEsposto(),30);
});
test('una chiamata che attraversa entrambe le soglie non applica danni retroattivi',()=>{
  salute.avanza(45,{alFreddo:true});vicino(salute.livelloCorrente(),0.6);
});
test('freddo progressivo identico a fotogrammi e in blocco',()=>{
  for(let i=0;i<45*60;i++)salute.avanza(1/60,{alFreddo:true});
  const prima=salute.livelloCorrente();assert.equal(salute.moltiplicatoreFreddo(),3);
  salute.reimposta();salute.avanza(45,{alFreddo:true});vicino(salute.livelloCorrente(),prima);
});
test('tornare al caldo azzera l’esposizione, il freddo successivo riparte da 1x',()=>{
  salute.avanza(31,{alFreddo:true});salute.avanza(1,{alFreddo:false});
  assert.equal(salute.secondiEsposto(),0);const prima=salute.livelloCorrente();
  salute.avanza(10,{alFreddo:true});vicino(prima-salute.livelloCorrente(),10/225);
});
test('salvare non azzera il freddo accumulato; vecchi salvataggi iniziano a zero',()=>{
  salute.avanza(20,{alFreddo:true});const stato=salvataggio.istantanea(eroe,0);
  salute.reimposta();assert.ok(salvataggio.applica(stato));assert.equal(salute.secondiEsposto(),20);
  const prima=salute.livelloCorrente();salute.avanza(10,{alFreddo:true});vicino(prima-salute.livelloCorrente(),20/225);
  for(const valore of [-1,31,NaN])assert.equal(salvataggio.applica({...stato,esposizioneFreddo:valore}),null);
  delete stato.esposizioneFreddo;salvataggio.applica(stato);assert.equal(salute.secondiEsposto(),0);
});
function lettoInvernale() {
  tempo.impostaGiorno(9);tempo.impostaOra(3);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.GIACIGLIO});
  bisogni.ripristina({fame:1,sete:1,stanchezza:0.9});
}
test('riposo invernale vicino al falò porta la stamina esattamente al 75%',()=>{
  lettoInvernale();modifiche.imposta(tx+4,ty,{oggetto:OGGETTO.FALO_ACCESO,posata:9});
  const esito=azioni.agisci(eroe,null);
  assert.equal(esito.sveglio,true);assert.equal(esito.pocoRiposato,false);
  vicino(bisogni.livello('stanchezza'),0.75);assert.equal(esito.messaggio,null);
});
test('riposo invernale senza falò porta la stamina al 25% e comunica il cattivo riposo',()=>{
  lettoInvernale();const esito=azioni.agisci(eroe,null);
  assert.equal(esito.sveglio,true);vicino(bisogni.livello('stanchezza'),0.25);
  assert.equal(esito.messaggio,'Non ti senti molto riposato...');
});
test('la torcia in mano non sostituisce il falò nel riposo',()=>{
  lettoInvernale();inventario.aggiungi('torcia',1);
  const esito=azioni.agisci(eroe,'torcia');assert.equal(esito.pocoRiposato,true);
  vicino(bisogni.livello('stanchezza'),0.25);
});
test('un falò dietro un muro o oltre tre tasselli non dà il bonus del riposo',()=>{
  lettoInvernale();const letto=pos(tx+1,ty);
  modifiche.imposta(tx+3,ty,{oggetto:OGGETTO.FALO_ACCESO,posata:9});
  modifiche.imposta(tx+2,ty,{oggetto:OGGETTO.MURO});assert.equal(freddo.fuocoPerRiposo(letto),false);
  modifiche.imposta(tx+2,ty,{oggetto:OGGETTO.NESSUNO});assert.equal(freddo.fuocoPerRiposo(letto),true);
  modifiche.imposta(tx+3,ty,{oggetto:OGGETTO.NESSUNO});modifiche.imposta(tx+5,ty,{oggetto:OGGETTO.FALO_ACCESO});
  assert.equal(freddo.fuocoPerRiposo(letto),false);
});
test('falò che si spegne durante la notte riduce il recupero al 25%',()=>{
  lettoInvernale();tempo.impostaOra(23);
  modifiche.imposta(tx+2,ty,{oggetto:OGGETTO.FALO_ACCESO,posata:8});
  const esito=azioni.agisci(eroe,null);assert.equal(esito.sveglio,true);assert.equal(esito.pocoRiposato,true);
  vicino(bisogni.livello('stanchezza'),0.25);
});
test('notte iniziata d’inverno conserva il limite al risveglio primaverile',()=>{
  lettoInvernale();tempo.impostaGiorno(12);tempo.impostaOra(23);
  const esito=azioni.agisci(eroe,null);assert.equal(tempo.giornoCorrente(),13);
  assert.equal(esito.pocoRiposato,true);vicino(bisogni.livello('stanchezza'),0.25);
});
test('riposo nelle altre stagioni continua a riempire la stamina',()=>{
  lettoInvernale();tempo.impostaGiorno(5);
  const esito=azioni.agisci(eroe,null);assert.equal(esito.sveglio,true);
  assert.equal(esito.pocoRiposato,false);vicino(bisogni.livello('stanchezza'),1);
});
test('morire durante il sonno non ripristina stamina né annuncia un risveglio',()=>{
  lettoInvernale();salute.ripristina(0.01);
  const prima=bisogni.livello('stanchezza'),esito=azioni.agisci(eroe,null);
  assert.equal(esito.sveglio,false);assert.equal(esito.messaggio,null);
  vicino(bisogni.livello('stanchezza'),prima);
});

const riparazione = cosa => ricette.RICETTE.find(r => r.id === 'ripara_'+cosa);
test('ascia: sessanta colpi efficaci, poi resta rotta; si può continuare a mani nude',()=>{
  inventario.aggiungi('ascia',1);
  for(let i=0;i<60;i++) {
    modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.ALBERO});
    const esito=azioni.agisci(eroe,'ascia',0);
    assert.equal(esito.tipo,'colpo');assert.equal(inventario.contenuto()[0].usi,59-i);
    if(i===47) assert.deepEqual(esito.usura,{cosa:'ascia',rotto:false});
    if(i===59) assert.deepEqual(esito.usura,{cosa:'ascia',rotto:true});
  }
  // Rotta non toglie il gesto: vale come un pugno, quindi l'albero chiede i
  // quattro colpi delle mani nude invece dei due dell'ascia, e non si consuma
  // più niente perché non c'è più niente da consumare.
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.ALBERO});
  const dopo=azioni.azionePossibile(eroe,'ascia',0);
  assert.ok(!dopo.impedito);assert.equal(dopo.restano,4);
  assert.equal(azioni.agisci(eroe,'ascia',0).tipo,'colpo');
  assert.equal(inventario.contenuto()[0].usi,0);
  assert.equal(inventario.quante('ascia'),1);
  assert.equal(azioni.agisci(eroe,null,7).tipo,'colpo');
});
test('ultimo uso mantiene bonus e resa, senza consumare l’altra ascia',()=>{
  inventario.aggiungi('ascia',1,undefined,42);inventario.aggiungi('ascia',1,undefined,1);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.ALBERO,colpi:1});
  assert.equal(azioni.agisci(eroe,'ascia',1).tipo,'raccolto');
  assert.equal(inventario.quante('legna'),3);
  assert.equal(inventario.contenuto()[0].usi,42);assert.equal(inventario.contenuto()[1].usi,0);
});
test('zappa: il terreno riuscito consuma un uso, ripetere o agire nel vuoto no',()=>{
  inventario.aggiungi('zappa',1,undefined,1);
  // Cerca un tassello realmente coltivabile nella fattoria.
  let trovato=false;
  for(let y=ty-4;y<ty+4&&!trovato;y++)for(let x=tx-4;x<tx+4&&!trovato;x++) {
    eroe={...pos(x-1,y),guarda:'destra'};
    if(azioni.azionePossibile(eroe,'zappa',0)?.tipo==='zappa') trovato=true;
  }
  assert.ok(trovato);assert.equal(azioni.agisci(eroe,'zappa',0).tipo,'zappa');
  assert.equal(inventario.contenuto()[0].usi,0);
  assert.equal(azioni.agisci(eroe,'zappa',0),null);
});
test('lancia: consuma solo colpi a segno, e rotta colpisce come un pugno',()=>{
  inventario.aggiungi('lancia',1,undefined,1);
  assert.equal(azioni.agisci(eroe,'lancia',0),null);
  assert.equal(inventario.contenuto()[0].usi,1);
  const nemico={tipo:'infetto',...pos(tx+1,ty),vita:5};entita.aggiungi(nemico);
  assert.equal(azioni.agisci(eroe,'lancia',0).tipo,'combattuto');assert.equal(nemico.vita,3);
  // A zero resta un bastone: un danno invece di due, e niente da consumare.
  assert.equal(azioni.agisci(eroe,'lancia',0).tipo,'combattuto');assert.equal(nemico.vita,2);
  assert.equal(inventario.contenuto()[0].usi,0);
});
test('prendere piante e aprire casse non consuma e funziona anche con attrezzo rotto',()=>{
  inventario.aggiungi('ascia',1,undefined,0);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.CESPUGLIO});
  assert.equal(azioni.agisci(eroe,'ascia',0).tipo,'raccolto');
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.CASSA,contenuto:[]});
  assert.equal(azioni.agisci(eroe,'ascia',0).tipo,'aperta');
  assert.equal(inventario.contenuto()[0].usi,0);
});
test('canna: solo la cattura consuma, l’ultimo pesce entra e poi serve riparare',()=>{
  allaRiva();inventario.contenuto()[0].usi=1;
  azioni.agisci(eroe,'canna',0);pesca.aggiorna(5,eroe,'canna',0);
  azioni.agisci(eroe,'canna',0);assert.equal(inventario.contenuto()[0].usi,1);
  azioni.agisci(eroe,'canna',0);
  const esito=pesca.aggiorna(pesca.ATTESA,eroe,'canna',0);
  assert.equal(esito.tipo,'pescato');assert.equal(esito.usura.rotto,true);
  assert.equal(inventario.quante('pesce_crudo'),1);assert.equal(inventario.contenuto()[0].usi,0);
  assert.equal(azioni.agisci(eroe,'canna',0),null);
});
test('cambiare fra due canne interrompe senza usurare nessuna delle due',()=>{
  allaRiva();inventario.aggiungi('canna',1,undefined,7);
  azioni.agisci(eroe,'canna',1);
  assert.equal(pesca.aggiorna(pesca.ATTESA,eroe,'canna',0).tipo,'pescaInterrotta');
  assert.equal(inventario.contenuto()[0].usi,20);assert.equal(inventario.contenuto()[1].usi,7);
});
test('riparazione: richiede banco e materiali senza perdite in caso di rifiuto',()=>{
  inventario.aggiungi('ascia',1,undefined,0);inventario.aggiungi('pietra',1);
  let prima=structuredClone(inventario.contenuto());
  assert.deepEqual(ricette.fai(riparazione('ascia'),true),{fatto:false,perche:'materiali'});
  assert.deepEqual(inventario.contenuto(),prima);
  inventario.aggiungi('fibra',2);prima=structuredClone(inventario.contenuto());
  assert.deepEqual(ricette.fai(riparazione('ascia'),false),{fatto:false,perche:'banco'});
  assert.deepEqual(inventario.contenuto(),prima);
});
test('riparazione a zaino pieno ripristina solo il più usurato, costa 1 pietra e 2 fibre',()=>{
  inventario.aggiungi('ascia',1,undefined,9);inventario.aggiungi('ascia',1,undefined,0);
  inventario.aggiungi('pietra',5);inventario.aggiungi('fibra',8);inventario.aggiungi('zappa',4);
  assert.equal(inventario.pieno(),true);
  assert.equal(ricette.fai(riparazione('ascia'),true).fatto,true);
  // Riparata, non rifatta: cinquantaquattro invece di sessanta.
  assert.equal(inventario.contenuto()[0].usi,9);assert.equal(inventario.contenuto()[1].usi,54);
  assert.equal(inventario.massimoDi(inventario.contenuto()[1]),54);
  assert.equal(inventario.quante('pietra'),4);assert.equal(inventario.quante('fibra'),6);
  for(const cosa of ['zappa','lancia']) {
    const prima=structuredClone(inventario.contenuto());
    assert.equal(ricette.fai(riparazione(cosa),true).perche,'integro');
    assert.deepEqual(inventario.contenuto(),prima);
  }
});
test('ogni attrezzo nuovo ha la propria durata, e riparato ne perde un decimo',()=>{
  for(const [cosa,durata] of Object.entries({ascia:60,zappa:40,lancia:50,canna:20})) {
    inventario.svuota();inventario.aggiungi(cosa,1);
    assert.equal(inventario.contenuto()[0].usi,durata);
    inventario.contenuto()[0].usi=0;inventario.aggiungi('pietra',1);inventario.aggiungi('fibra',2);
    assert.equal(ricette.fai(riparazione(cosa),true).fatto,true);
    assert.equal(inventario.contenuto()[0].usi,Math.round(durata*0.9));
    assert.equal(inventario.massimoDi(inventario.contenuto()[0]),Math.round(durata*0.9));
  }
});
test('usura conservata nel trasferimento in cassa e ritorno, incluso zero',()=>{
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.CASSA,contenuto:[]});
  inventario.aggiungi('ascia',1,undefined,0);inventario.aggiungi('ascia',1,undefined,17);
  contenitori.sposta(tx+1,ty,true,0);contenitori.sposta(tx+1,ty,true,1);
  assert.deepEqual(contenitori.contenutoDi(tx+1,ty).filter(Boolean).map(c=>c.usi),[0,17]);
  contenitori.sposta(tx+1,ty,false,0);contenitori.sposta(tx+1,ty,false,1);
  assert.deepEqual(inventario.contenuto().filter(Boolean).map(c=>c.usi),[0,17]);
});
test('gettare e riprendere non ripara, due attrezzi non si fondono sul terreno',()=>{
  inventario.aggiungi('ascia',1,undefined,3);inventario.aggiungi('ascia',1,undefined,0);
  assert.equal(azioni.getta(eroe,0).tipo,'gettato');
  assert.equal(azioni.getta(eroe,1).tipo,'nonCePosto');
  assert.equal(azioni.agisci(eroe,null).tipo,'preso');
  assert.deepEqual(inventario.contenuto().filter(Boolean).map(c=>c.usi),[3,0]);
});
test('cadavere e recupero parziale conservano l’usura di ogni oggetto',()=>{
  inventario.aggiungi('ascia',1,undefined,0);inventario.aggiungi('ascia',1,undefined,11);
  const corpo=azioni.lasciaIlCadavere(eroe,1);
  inventario.aggiungi('zappa',7);eroe={...pos(corpo.tx-1,corpo.ty),guarda:'destra'};
  assert.equal(azioni.agisci(eroe,null).tipo,'frugato');
  assert.equal(inventario.contenuto()[7].usi,0);
  assert.equal(modifiche.di(corpo.tx,corpo.ty).roba[0].usi,11);
  inventario.svuota();azioni.agisci(eroe,null);assert.equal(inventario.contenuto()[0].usi,11);
});
test('salvataggio conserva usi in zaino, cassa, mucchio e cadavere e respinge valori corrotti',()=>{
  inventario.aggiungi('ascia',1,undefined,0);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.CASSA,contenuto:[{cosa:'canna',quantita:1,usi:9}]});
  modifiche.imposta(tx+2,ty,{oggetto:OGGETTO.MUCCHIO,cosa:'zappa',quante:1,usi:2});
  modifiche.imposta(tx+3,ty,{oggetto:OGGETTO.CADAVERE,roba:[{cosa:'lancia',quantita:1,usi:3}]});
  const stato=salvataggio.istantanea(eroe,0);
  assert.ok(salvataggio.applica(JSON.parse(JSON.stringify(stato))));
  assert.equal(inventario.contenuto()[0].usi,0);
  assert.equal(contenitori.contenutoDi(tx+1,ty)[0].usi,9);
  assert.equal(modifiche.di(tx+2,ty).usi,2);assert.equal(modifiche.di(tx+3,ty).roba[0].usi,3);
  for(const valore of [-1,61,0.5,NaN,null,'3'])for(const dove of ['inventario','cassa','mucchio','cadavere']) {
    const copia=structuredClone(stato);
    if(dove==='inventario') copia.inventario[0].usi=valore;
    else {
      const d=copia.modifiche.find(v=>v.tx===tx+({cassa:1,mucchio:2,cadavere:3}[dove])&&v.ty===ty);
      (dove==='cassa'?d.contenuto[0]:dove==='cadavere'?d.roba[0]:d).usi=valore;
    }
    assert.equal(salvataggio.applica(copia),null);
    assert.equal(inventario.contenuto()[0].usi,0);
  }
});
test('vecchi salvataggi: attrezzi integri anche nelle vecchie pile a terra',()=>{
  const stato=salvataggio.istantanea(eroe,0);
  stato.inventario=[{cosa:'ascia',quantita:1}];
  stato.modifiche=[{tx:tx+1,ty,oggetto:OGGETTO.MUCCHIO,cosa:'canna',quante:2}];
  assert.ok(salvataggio.applica(stato));assert.equal(inventario.contenuto()[0].usi,60);
  azioni.agisci(eroe,null);assert.deepEqual(inventario.contenuto().filter(c=>c?.cosa==='canna').map(c=>c.usi),[20,20]);
});
test('muro abbattuto rende 3 pietre; rocce e macerie mantengono le rese',()=>{
  for(const [oggetto,colpi,pietre] of [[OGGETTO.MURO,5,3],[OGGETTO.SASSO,2,2],[OGGETTO.MURO_ROTTO,1,1]]) {
    inventario.svuota();modifiche.imposta(tx+1,ty,{oggetto});
    for(let i=0;i<colpi;i++) azioni.agisci(eroe,null);
    assert.equal(inventario.quante('pietra'),pietre);
  }
});
test('sei riparazioni e poi va rifatta: il tetto scende di un decimo per volta',()=>{
  inventario.aggiungi('ascia',1);inventario.aggiungi('pietra',20);inventario.aggiungi('fibra',20);
  const tetti=[];
  for(let i=0;i<10;i++) {
    const attrezzo=inventario.contenuto()[0];
    attrezzo.usi=0;
    const esito=ricette.fai(riparazione('ascia'),true);
    if(!esito.fatto) { assert.equal(esito.perche,'consumato');break; }
    tetti.push(inventario.massimoDi(inventario.contenuto()[0]));
  }
  assert.deepEqual(tetti,[54,48,42,36,30,24]);
  // Arrivata al minimo il tetto resta lì e nessuno la raddrizza più: da qui in
  // avanti l'ascia non si ripara, si rifà.
  assert.equal(inventario.massimoDi(inventario.contenuto()[0]),24);
  assert.equal(ricette.fai(riparazione('ascia'),true).perche,'consumato');
  // Sei riparazioni pagate e la settima rifiutata senza togliere niente.
  assert.equal(inventario.quante('pietra'),14);
  assert.equal(inventario.quante('fibra'),8);
});
test('la lancia davanti a un albero vale come le mani nude e non si consuma',()=>{
  inventario.aggiungi('lancia',1);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.ALBERO});
  assert.equal(azioni.azionePossibile(eroe,'lancia',0).restano,4);
  for(let i=0;i<3;i++) assert.equal(azioni.agisci(eroe,'lancia',0).tipo,'colpo');
  assert.equal(azioni.agisci(eroe,'lancia',0).tipo,'raccolto');
  assert.equal(inventario.contenuto()[0].usi,50);
});
test('la zappa addosso a un infetto fa il danno di un pugno e non si consuma',()=>{
  inventario.aggiungi('zappa',1);
  const nemico={tipo:'infetto',...pos(tx+1,ty),vita:5};entita.aggiungi(nemico);
  assert.equal(azioni.agisci(eroe,'zappa',0).tipo,'combattuto');
  assert.equal(nemico.vita,4);assert.equal(inventario.contenuto()[0].usi,40);
});
test('una canna rotta non pesca, e non toglie il bere',()=>{
  inventario.aggiungi('canna',1,undefined,0);
  let riva=null;
  for(let r=1;r<60&&!riva;r++) for(let dy=-r;dy<=r&&!riva;dy++) for(let dx=-r;dx<=r&&!riva;dx++) {
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r) continue;
    const t=mappa.terrenoDi(tx+dx,ty+dy);
    if(t===TERRENO.ACQUA||t===TERRENO.ACQUA_BASSA) riva={x:tx+dx,y:ty+dy};
  }
  assert.ok(riva,'nessuna acqua vicino alla fattoria');
  eroe={...pos(riva.x-1,riva.y),guarda:'destra'};
  const azione=azioni.azionePossibile(eroe,'canna',0);
  assert.notEqual(azione?.tipo,'pesca');
  bisogni.consuma?.('sete',0.5);
  assert.ok(['bevi','riempi',undefined].includes(azione?.tipo));
});
test('gli attrezzi trovati nelle case arrivano usati, e sempre gli stessi',()=>{
  let trovati=0;
  for(let r=1;r<110&&trovati<2;r++) for(let dy=-r;dy<=r&&trovati<2;dy++) for(let dx=-r;dx<=r&&trovati<2;dx++) {
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r) continue;
    const x=tx+dx,y=ty+dy;
    if(mappa.oggettoGenerato(x,y)!==OGGETTO.CASSA) continue;
    for(const c of contenitori.contenutoDi(x,y).filter(Boolean)) {
      const durata=CATALOGO[c.cosa]?.durata;
      if(durata===undefined) continue;
      trovati++;
      assert.ok(c.usi>=Math.round(durata*0.3)&&c.usi<=Math.round(durata*0.65),`${c.cosa} ${c.usi}/${durata}`);
      // Riaprire la stessa cassa non rimescola niente.
      assert.equal(contenitori.contenutoDi(x,y).find(v=>v?.cosa===c.cosa).usi,c.usi);
    }
  }
  assert.ok(trovati>0,'nessun attrezzo nelle case entro cento tasselli');
});
test('il tetto sceso viaggia in cassa, per terra e nel salvataggio',()=>{
  inventario.aggiungi('ascia',1,undefined,5,30);
  assert.equal(inventario.massimoDi(inventario.contenuto()[0]),30);
  assert.equal(azioni.getta(eroe,0).tipo,'gettato');
  assert.equal(modifiche.di(tx+1,ty).massimo,30);
  assert.equal(azioni.agisci(eroe,null).tipo,'preso');
  assert.equal(inventario.massimoDi(inventario.contenuto()[0]),30);
  const stato=salvataggio.istantanea(eroe,0);
  assert.ok(salvataggio.applica(structuredClone(stato)));
  assert.equal(inventario.massimoDi(inventario.contenuto()[0]),30);
  // Un tetto impossibile è un salvataggio storto, e si rifiuta prima di toccare niente.
  for(const valore of [0,61,12.5,'30']) {
    const copia=structuredClone(stato);copia.inventario[0].massimo=valore;
    assert.equal(salvataggio.applica(copia),null);
  }
  // E gli usi non possono superare il tetto dichiarato.
  const oltre=structuredClone(stato);oltre.inventario[0].usi=31;
  assert.equal(salvataggio.applica(oltre),null);
});
test('la maniglia del collaudo nomina solo cose che esistono davvero',()=>{
  // Una prova statica, e sta qui per una ragione precisa: il difetto che ha
  // tenuto ferma la maniglia per due tappe non era nella logica di gioco — che
  // questi test coprono bene — ma nel ponte verso il collaudo dal browser, che
  // non guardava nessuno. Si legge gioco.js, si prendono le chiavi abbreviate
  // del blocco globalThis.ultimoRaccolto e si verifica che ognuna sia un nome
  // che il file conosce.
  const sorgente=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  const blocco=sorgente.slice(sorgente.indexOf('globalThis.ultimoRaccolto = {'));
  const chiavi=[...blocco.matchAll(/^\s{4}([a-zA-Z_$][\w$]*),$/gm)].map(m=>m[1]);
  assert.ok(chiavi.length>10,'blocco della maniglia non riconosciuto');
  const dichiarati=new Set([...sorgente.matchAll(/import \* as ([\w$]+) from|^(?:let|const|function) ([\w$]+)/gm)]
    .flatMap(m=>[m[1],m[2]]).filter(Boolean));
  for(const chiave of chiavi) assert.ok(dichiarati.has(chiave),`la maniglia espone ${chiave}, che gioco.js non importa né dichiara`);
});


test('fauna: sagome, animazioni, carcasse e icone sono valide e distinte',()=>{
  for(const fs of Object.values(arteFauna.ANIMALI)) for(const f of fs) decodifica(f);
  for(const f of Object.values(arteFauna.CARCASSE)) decodifica(f);
  for(const k of ['CARNE_CRUDA','CARNE_ARROSTITA','PELLE']) decodifica(arteFauna[k]);
  assert.equal(new Set(Object.values(arteFauna.ANIMALI).map(f=>JSON.stringify(f[0]))).size,4);
});
test('il cavallo fugge sempre e non ferisce neppure dopo essere stato colpito',()=>{
  const e=animale('cavallo',10);fauna.colpisci(e,1);
  assert.equal(e.stato,'fuga');
  for(let i=0;i<600;i++) {
    e.px=eroe.px+10;e.py=eroe.py;
    assert.equal(fauna.aggiorna(1/60,eroe).attacchi,0);
    assert.notEqual(e.stato,'aggressivo');
  }
  assert.equal(salute.livelloCorrente(),1);assert.equal(salute.eInfetto(),false);
});
test('cervo e bufalo tollerano 5 secondi poi possono attaccare oppure fuggire',()=>{
  for(const specie of ['cervo','bufalo']) for(const [seme,stato] of [[1,'aggressivo'],[1000,'fuga']]) {
    const e=fauna.crea(specie,eroe.px+32,eroe.py,seme);
    fauna.percepisci(e,4.99,eroe);assert.equal(e.stato,'allerta');
    fauna.percepisci(e,0.01,eroe);assert.equal(e.stato,stato);
  }
});
test('l’allerta si azzera allontanandosi o nascondendosi dietro un muro',()=>{
  const e=animale('bufalo',32);fauna.percepisci(e,4,eroe);
  e.px+=100;fauna.percepisci(e,0.1,eroe);assert.equal(e.pressione,0);
  e.px=eroe.px+32;fauna.percepisci(e,4,eroe);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.MURO});
  fauna.percepisci(e,1,eroe);assert.equal(e.stato,'calmo');assert.equal(e.pressione,0);
});
test('la decisione casuale di aggressione non dipende dal framerate',()=>{
  const a=fauna.crea('cervo',eroe.px+32,eroe.py,1),b=structuredClone(a);
  fauna.percepisci(a,5,eroe);
  for(let i=0;i<300;i++)fauna.percepisci(b,1/60,eroe);
  assert.equal(a.stato,b.stato);assert.equal(a.seme,b.seme);
});
test('orso: aggredisce subito a vista ma non vede né colpisce attraverso una parete',()=>{
  const e=animale('orso',32);fauna.percepisci(e,1/60,eroe);assert.equal(e.stato,'aggressivo');
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.MURO});
  for(let i=0;i<360;i++)fauna.aggiorna(1/60,eroe);
  assert.equal(salute.livelloCorrente(),1);
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.MURO);
});
test('orso: danno con ricarica, nessuna infezione; fuga oltre il raggio interrompe la caccia',()=>{
  const e=animale('orso',12);
  assert.equal(fauna.aggiorna(1/60,eroe).attacchi,1);vicino(salute.livelloCorrente(),0.76);
  for(let i=0;i<30;i++)fauna.aggiorna(1/60,eroe);
  vicino(salute.livelloCorrente(),0.76);assert.equal(salute.eInfetto(),false);
  e.px=eroe.px+200;fauna.percepisci(e,6,eroe);assert.equal(e.stato,'calmo');
});
test('caccia usa portata, danno e usura della lancia; rotta torna a mani nude',()=>{
  const e=animale('cervo',30);inventario.aggiungi('lancia',1,undefined,1);
  assert.equal(azioni.azionePossibile(eroe,'lancia',0).nemico,e);
  azioni.agisci(eroe,'lancia',0);assert.equal(e.vita,4);assert.equal(inventario.contenuto()[0].usi,0);
  assert.equal(azioni.agisci(eroe,'lancia',0),null);
  e.px=eroe.px+16;azioni.agisci(eroe,'lancia',0);assert.equal(e.vita,3);
});
test('il combattimento sceglie il più vicino fra fauna e infetti',()=>{
  const e=animale('cervo',16),z={tipo:'infetto',...pos(tx+2,ty),vita:5};entita.aggiungi(z);
  inventario.aggiungi('lancia',1);
  assert.equal(azioni.azionePossibile(eroe,'lancia',0).nemico,e);
  z.px=eroe.px+10;assert.equal(azioni.azionePossibile(eroe,'lancia',0).nemico,z);
});
test('abbattimento lascia una sola carcassa senza loot automatico',()=>{
  const e=animale('cervo');fauna.colpisci(e,6);
  assert.equal(e.vita,0);assert.equal(e.stato,'carcassa');assert.equal(inventario.quante('carne_cruda'),0);
  fauna.colpisci(e,6);assert.equal(fauna.tutte().length,1);
  for(const cosa of [null,'secchio','lancia','zappa'])assert.match(azioni.azionePossibile(eroe,cosa).impedito,/ascia/);
});
test('macellare richiede tre usi reali di ascia, con bottino distinto per specie',()=>{
  for(const specie of Object.keys(fauna.SPECIE)) {
    reset();const e=animale(specie);fauna.colpisci(e,100);
    inventario.aggiungi('ascia',1,undefined,3);
    for(let i=0;i<2;i++) {
      assert.equal(azioni.agisci(eroe,'ascia',0).tipo,'macellazione');assert.equal(inventario.quante('pelle'),0);
    }
    const esito=azioni.agisci(eroe,'ascia',0);
    assert.equal(esito.tipo,'macellato');assert.equal(esito.usura.rotto,true);
    assert.equal(inventario.quante('carne_cruda'),fauna.SPECIE[specie].carne);
    assert.equal(inventario.quante('pelle'),fauna.SPECIE[specie].pelli);
    assert.equal(fauna.tutte().length,0);
  }
});
test('ascia rotta a metà macellazione: progresso conservato e ripresa con un altro esemplare',()=>{
  const e=animale('bufalo');fauna.colpisci(e,100);
  inventario.aggiungi('ascia',1,undefined,1);inventario.aggiungi('ascia',1);
  azioni.agisci(eroe,'ascia',0);assert.equal(e.tagli,1);
  assert.equal(azioni.agisci(eroe,'ascia',0),null);assert.equal(e.tagli,1);
  azioni.agisci(eroe,'ascia',1);azioni.agisci(eroe,'ascia',1);
  assert.equal(inventario.quante('carne_cruda'),6);assert.equal(inventario.contenuto()[1].usi,58);
});
test('macellazione a zaino pieno non consuma; bottino parziale resta recuperabile senza ascia',()=>{
  const e=animale('orso');fauna.colpisci(e,100);
  inventario.aggiungi('ascia',8);
  assert.equal(azioni.azionePossibile(eroe,'ascia',0).impedito,'zaino pieno');
  assert.equal(azioni.agisci(eroe,'ascia',0),null);
  assert.equal(fauna.macella(e).tipo,'zainoPieno');
  assert.equal(e.tagli,0);assert.equal(inventario.contenuto()[0].usi,60);
  inventario.svuotaCasella(7);
  for(let i=0;i<3;i++)azioni.agisci(eroe,'ascia',0);
  assert.equal(e.resti.carne_cruda,0);assert.equal(e.resti.pelle,3);
  assert.equal(azioni.azionePossibile(eroe,'ascia',0).impedito,'zaino pieno');
  assert.equal(azioni.agisci(eroe,'ascia',0),null);
  inventario.svuotaCasella(6);
  const esito=azioni.agisci(eroe,null,6);assert.equal(esito.tipo,'macellato');assert.equal(esito.lavorato,false);
  assert.equal(inventario.quante('pelle'),3);assert.equal(inventario.contenuto()[0].usi,57);
  assert.equal(fauna.tutte().length,0);
});
test('salvare conserva ferite, temperamento e avanzamento della macellazione senza alias',()=>{
  const vivo=animale('bufalo',32,1000),morto=animale('cervo',16);
  fauna.colpisci(vivo,2);fauna.colpisci(morto,100);inventario.aggiungi('ascia',1);
  azioni.agisci(eroe,'ascia',0);
  const stato=salvataggio.istantanea(eroe,0),prima=structuredClone(stato.fauna);
  assert.ok(salvataggio.applica(stato));assert.deepEqual(fauna.istantanea(),prima);
  fauna.tutte()[0].vita=1;assert.deepEqual(stato.fauna,prima);
});
test('salvataggio di carcassa già macellata non rigenera la carne raccolta',()=>{
  const e=animale('cervo');fauna.colpisci(e,100);inventario.aggiungi('ascia',7);
  for(let i=0;i<3;i++)azioni.agisci(eroe,'ascia',0);
  const stato=salvataggio.istantanea(eroe,0);assert.ok(salvataggio.applica(stato));
  inventario.svuotaCasella(6);azioni.agisci(eroe,null,6);
  assert.equal(inventario.quante('carne_cruda'),3);assert.equal(inventario.quante('pelle'),1);
  assert.equal(fauna.tutte().length,0);
});
test('fauna malformata rifiutata prima di alterare la partita; vecchi salvataggi compatibili',()=>{
  animale('cervo');const stato=salvataggio.istantanea(eroe,0);
  for(const [campo,valore] of [['specie','drago'],['vita',-1],['px',NaN],['pressione',9],['seme',-1],['tagli',4],['resti',{}]]) {
    const copia=structuredClone(stato);copia.fauna.animali[0][campo]=valore;
    assert.equal(salvataggio.applica(copia),null);
    assert.deepEqual(fauna.istantanea(),stato.fauna);
  }
  const vecchio=structuredClone(stato);delete vecchio.fauna;
  assert.ok(salvataggio.applica(vecchio));assert.equal(fauna.quanti(),0);
});
test('carcasse scadono anche dopo salvataggio o salto del tempo; macellare non ringiovanisce carne',()=>{
  animale('cervo');const e=fauna.tutte()[0];fauna.colpisci(e,100);inventario.aggiungi('ascia',1);
  tempo.impostaGiorno(2);for(let i=0;i<3;i++)azioni.agisci(eroe,'ascia',0);
  assert.equal(inventario.contenuto().find(c=>c?.cosa==='carne_cruda').dal,1);
  const altro=animale('orso');fauna.colpisci(altro,100);
  const stato=salvataggio.istantanea(eroe,0);stato.giorno=4;
  assert.ok(salvataggio.applica(stato));assert.equal(fauna.tutte().length,0);
});
test('la carne si cucina, nutre e si guasta; le pelli restano',()=>{
  inventario.aggiungi('carne_cruda',2);inventario.aggiungi('pelle',1);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FALO_ACCESO});
  assert.equal(azioni.agisci(eroe,'carne_cruda',0).tipo,'cotto');
  assert.equal(inventario.quante('carne_arrostita'),1);
  bisogni.ripristina({fame:0.1,sete:1,stanchezza:1});azioni.consuma('carne_arrostita');
  vicino(bisogni.livello('fame'),0.55);
  tempo.impostaGiorno(3);decadimento.nuovoGiorno();
  assert.equal(inventario.quante('carne_cruda'),0);assert.equal(inventario.quante('pelle'),1);
});
test('carcassa abbattuta la sera scade insieme alla carne, senza bottino già guasto',()=>{
  tempo.impostaOra(23);const e=animale('cervo');fauna.colpisci(e,100);
  tempo.impostaGiorno(3);tempo.impostaOra(0);
  assert.equal(fauna.macella(e),null);assert.equal(fauna.tutte().length,0);
});
test('fauna rara: due vivi al massimo, arrivi distanziati e nati in prateria fuori schermo',()=>{
  let visti=0;
  for(let i=0;i<150;i++) {
    const prima=new Set(fauna.tutte());
    fauna.aggiorna(1,eroe);
    assert.ok(fauna.quanti()<=2);
    for(const e of fauna.tutte()) if(!prima.has(e)) {
      visti++;assert.ok(Math.hypot(e.px-eroe.px,e.py-eroe.py)>240);
      assert.ok([TERRENO.ERBA,TERRENO.STERPAGLIA].includes(mappa.terrenoNaturaleDi(Math.floor(e.px/16),Math.floor(e.py/16))));
    }
  }
  assert.ok(visti>0);
});

test('una carcassa non tiene chiuso quello che copre se non ci si può lavorare',()=>{
  // Caduto sulla soglia: la carcassa sta ai piedi, la porta è il tassello
  // davanti. Sono due cose diverse nello stesso posto, e la barra ne nomina
  // una sola.
  const e=animale('cervo',6);fauna.colpisci(e,100);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.PORTA});
  assert.equal(azioni.azionePossibile(eroe,null).tipo,'porta');
  inventario.aggiungi('ascia',8);
  assert.equal(azioni.azionePossibile(eroe,'ascia',0).tipo,'porta');
  // Con l'ascia e un posto dove mettere la carne il lavoro c'è, e passa avanti.
  inventario.svuotaCasella(7);
  assert.equal(azioni.azionePossibile(eroe,'ascia',0).tipo,'macella');
  // Quando davanti non c'è altro da fare, l'avviso resta l'ultima risposta.
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.NESSUNO});
  assert.match(azioni.azionePossibile(eroe,null).impedito,/ascia/);
});
test('gli animali si scansano fra loro e dal superstite, senza entrare nei muri',()=>{
  const a=animale('cervo',40),b=animale('bufalo',41);
  fauna.sgomitano(eroe);
  assert.ok(Math.hypot(a.px-b.px,a.py-b.py)>=17.9,'due groppe restano due sagome');
  // Camminargli addosso non lo attraversa: si sposta lui, non il superstite.
  const dove={px:eroe.px,py:eroe.py};
  a.px=eroe.px;a.py=eroe.py;
  for(let i=0;i<3;i++)fauna.sgomitano(eroe);
  assert.ok(Math.hypot(a.px-eroe.px,a.py-eroe.py)>=11.9);
  assert.deepEqual({px:eroe.px,py:eroe.py},dove);
  // La carcassa no: sta dove è caduta, con sopra quello che non ti è entrato.
  const morto=animale('orso',60);fauna.colpisci(morto,100);
  const caduto={px:morto.px,py:morto.py};
  b.px=morto.px;b.py=morto.py;fauna.sgomitano(eroe);
  assert.deepEqual({px:morto.px,py:morto.py},caduto);
  // Scansarsi non è un permesso di attraversare i muri.
  modifiche.imposta(tx+3,ty,{oggetto:OGGETTO.MURO});
  // Appoggiati al muro, uno sopra l'altro: separandosi uno dei due ha il muro
  // dalla sua parte, e deve restarne fuori.
  a.px=b.px=(tx+3)*16-urti.LARGHEZZA/2-1;a.py=b.py=eroe.py;
  assert.ok(urti.liberoIn(a.px,a.py),'il collaudo parte da un posto libero');
  for(let i=0;i<4;i++)fauna.sgomitano(eroe);
  for(const e of [a,b]) assert.ok(urti.liberoIn(e.px,e.py),`${e.specie} finito dentro il muro`);
});

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
import * as azioni from '../regole/azioni.js';
import * as ricette from '../regole/ricette.js';
import * as mappa from '../mondo/mappa.js';
import * as modifiche from '../mondo/modifiche.js';
import * as salvataggio from '../regole/salvataggio.js';
import * as riparo from '../regole/riparo.js';
import * as freddo from '../regole/freddo.js';
import * as infetti from '../regole/infetti.js';
import * as entita from '../entita/entita.js';
import * as decadimento from '../regole/decadimento.js';
import { OGGETTO, TERRENO } from '../mondo/generazione.js';
import { vistaLibera, fattoreSuono } from '../mondo/ostacoli.js';
import * as sprite from '../arte/sprite-cose.js';
import { TAVOLOZZA } from '../arte/tavolozza.js';

let tx, ty, eroe;
function reset() {
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
const pos = (x,y)=>({px:(x+0.5)*16,py:(y+0.75)*16});
function stanza() {
  for(let y=ty-2;y<=ty+2;y++)for(let x=tx-2;x<=tx+2;x++) {
    modifiche.imposta(x,y,{oggetto: Math.abs(x-tx)===2 || Math.abs(y-ty)===2 ? OGGETTO.MURO : OGGETTO.NESSUNO});
  }
  modifiche.imposta(tx+2,ty,{oggetto:OGGETTO.PORTA});

}

test('301 secondi: fotogrammi e recupero producono la stessa salute',()=>{
  for(let i=0;i<301*60;i++) simulazione.avanza(1/60);
  const attiva={...bisogni.tutti(),salute:salute.livelloCorrente()};
  reset();simulazione.avanza(301);
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
  vicino(bisogni.livello('fame'),1-(12.5+12.5*1.6)/540);
  assert.equal(tempo.giornoCorrente(),9);
});
test('sonno: la sete fa danno solo dopo essersi esaurita, non lo sfinimento',()=>{
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

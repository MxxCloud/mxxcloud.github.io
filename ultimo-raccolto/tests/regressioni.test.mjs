import * as riposo from "../regole/riposo.js";
import { createHash } from 'node:crypto';
import { LUOGHI } from '../arte/luoghi.js';
import * as spriteLuoghi from '../arte/sprite-luoghi.js';
import * as rovine from '../mondo/rovine.js';
import * as ricrescita from '../regole/ricrescita.js';
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
import * as fiamma from '../regole/fiamma.js';
import * as addosso from '../regole/addosso.js';
import * as fauna from '../regole/fauna.js';
import * as arteFauna from '../arte/sprite-fauna.js';
import * as infetti from '../regole/infetti.js';
import * as entita from '../entita/entita.js';
import * as decadimento from '../regole/decadimento.js';
import { OGGETTO, TERRENO } from '../mondo/generazione.js';
import { CATALOGO, RACCOLTA } from '../regole/oggetti.js';
import { vistaLibera, fattoreSuono } from '../mondo/ostacoli.js';
import * as sprite from '../arte/sprite-cose.js';
import { TAVOLOZZA } from '../arte/tavolozza.js';

let tx, ty, eroe;
function reset() {
  fiamma.reimposta();
  addosso.reimposta();
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

function trovaLuogo(id) {
  for(let y=-12;y<=12;y++)for(let x=-12;x<=12;x++) {
    const r=mappa.rovinaNellaCella(x,y);if(r?.luogo===id)return r;
  }
  assert.fail('luogo assente: '+id);
}
function segnoNelLuogo(r,segno) {
  for(let y=0;y<r.altezza;y++)for(let x=0;x<r.larghezza;x++)if(r.pianta[y][x]===segno)return {tx:r.tx0+x,ty:r.ty0+y};
  assert.fail('segno assente: '+segno);
}
test('47 rovine e fattorie di quattro semi conservano esattamente pianta e posizione',()=>{
  const fixture=JSON.parse(readFileSync(new URL('./rovine-pre-luoghi.json',import.meta.url),'utf8'));
  for(const f of fixture) {
    mappa.inizializza(f.seme);const r=mappa.rovinaNellaCella(f.cx,f.cy);
    assert.ok(r);assert.equal(r.luogo,undefined);
    assert.equal(createHash('sha256').update(JSON.stringify([r.tx0,r.ty0,r.pianta])).digest('hex'),f.hash);
  }
});
test('le cinque piante sono rettangolari, diverse e lasciano accesso ai punti utili',()=>{
  assert.equal(new Set(LUOGHI.map(l=>l.id)).size,5);
  for(const l of LUOGHI) {
    const w=l.pianta[0].length,h=l.pianta.length;
    assert.ok(l.pianta.every(r=>r.length===w));assert.equal(l.pianta.join('').split('c').length-1,1);
    const visitati=new Set(),coda=[[-1,-1]];
    for(let i=0;i<coda.length;i++){
      const [x,y]=coda[i],k=`${x},${y}`;
      if(x<-1||y<-1||x>w||y>h||visitati.has(k)||'cvot'.includes(l.pianta[y]?.[x]??' '))continue;
      visitati.add(k);coda.push([x-1,y],[x+1,y],[x,y-1],[x,y+1]);
    }
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      assert.ok(' .cvotgaf%'.includes(l.pianta[y][x]));
      if('cvotgf'.includes(l.pianta[y][x]))assert.ok([[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(p=>visitati.has(p.join(','))),l.id);
    }
  }
});
test('sprite dei luoghi decodificabili in tutte le stagioni',()=>{
  for(const stagione of ['estate','autunno','inverno','primavera'])for(const s of Object.values(spriteLuoghi)) {
    const d=decodifica(s,tavolozzaDi(stagione));assert.equal(d.larghezza,16);assert.ok(d.pixel.some(v=>v>0));
  }
});
test('luoghi deterministici, dentro la cella, anche a coordinate negative e dopo svuotamento cache',()=>{
  const trovati=[];
  for(const l of LUOGHI) {
    const r=trovaLuogo(l.id),cx=Math.floor(r.tx0/64),cy=Math.floor(r.ty0/64);
    assert.ok(r.tx0>=cx*64+6&&r.ty0>=cy*64+6);
    assert.ok(r.tx0+r.larghezza<=cx*64+58&&r.ty0+r.altezza<=cy*64+58);
    assert.equal(mappa.luogoIn(r.tx0,r.ty0)?.luogo,l.id);
    assert.equal(mappa.luogoIn(r.tx0-1,r.ty0),null);
    assert.equal(mappa.luogoIn(r.tx0-1,r.ty0,3)?.luogo,l.id);
    trovati.push({cx,cy,r:structuredClone(r)});
  }
  for(let x=40;x<120;x++)mappa.rovinaNellaCella(x,40);
  for(const f of trovati)assert.deepEqual(mappa.rovinaNellaCella(f.cx,f.cy),f.r);
  assert.equal(mappa.rovinaNellaCella(0,0).luogo,undefined);
});
test('nessuna costruzione viene collocata quando il terreno è acqua',()=>{
  rovine.inizializza(1234);
  for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++)assert.equal(rovine.nellaCella(x,y,()=>false),null);
});
test('pozzo: si beve e si riempiono i secchi anche in inverno, senza pesca o distruzione',()=>{
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.POZZO});tempo.impostaGiorno(9);
  bisogni.consuma('sete',0.8);assert.equal(azioni.agisci(eroe,null).tipo,'bevi');vicino(bisogni.livello('sete'),0.65);
  inventario.aggiungi('secchio',2);assert.equal(azioni.agisci(eroe,'secchio').quanti,2);
  assert.equal(inventario.quante('secchio_pieno'),2);vicino(bisogni.livello('stanchezza'),0.995);
  bisogni.ristora('sete',1);inventario.aggiungi('canna',1);inventario.aggiungi('ascia',1);
  assert.equal(azioni.agisci(eroe,'canna'),null);assert.equal(azioni.agisci(eroe,'ascia'),null);
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.POZZO);assert.equal(mappa.solidoIn(tx+1,ty),true);
});
test('carro e tronchi richiedono lavoro, consumano ascia e stamina e non ricrescono',()=>{
  const r=trovaLuogo('carro'),p=segnoNelLuogo(r,'v');
  eroe={...pos(p.tx-1,p.ty),guarda:'destra'};
  // Libera il punto in cui sta il personaggio, mantenendo il carro generato.
  modifiche.imposta(p.tx-1,p.ty,{oggetto:OGGETTO.NESSUNO});
  inventario.aggiungi('ascia',1);
  assert.equal(azioni.agisci(eroe,'ascia').tipo,'colpo');assert.equal(azioni.agisci(eroe,'ascia').tipo,'raccolto');
  assert.equal(inventario.attrezzo('ascia').usi,58);vicino(bisogni.livello('stanchezza'),0.97);
  assert.equal(inventario.quante('legna'),3);assert.equal(inventario.quante('fibra'),2);
  const stato=salvataggio.istantanea(eroe,0);assert.ok(salvataggio.applica(stato));
  tempo.impostaGiorno(100);ricrescita.nuovoGiorno();assert.equal(mappa.oggettoDi(p.tx,p.ty),OGGETTO.NESSUNO);
  modifiche.imposta(p.tx,p.ty,{oggetto:OGGETTO.TRONCO});
  assert.equal(azioni.agisci(eroe,'ascia').tipo,'raccolto');assert.equal(inventario.attrezzo('ascia').usi,57);
  assert.equal(inventario.quante('legna'),4);
});
test('bottino dei piccoli luoghi tematico, modesto e stabile alla riapertura',()=>{
  const ammessi={carro:['fibra','legna','benda'],pozzo:['secchio','fibra','pietra'],bruciato:['fibra','benda','conserva'],boscaioli:['legna','ramo','ascia'],orto:['semi','fibra','zappa']};
  for(const l of LUOGHI) {
    const r=trovaLuogo(l.id),p=segnoNelLuogo(r,'c');
    const prima=contenitori.contenutoDi(p.tx,p.ty),pile=prima.filter(Boolean);
    assert.ok(pile.length>=1&&pile.length<=2);
    for(const c of pile){assert.ok(ammessi[l.id].includes(c.cosa));assert.ok(c.quantita<=4);}
    assert.deepEqual(contenitori.contenutoDi(p.tx,p.ty),prima);
    assert.equal(modifiche.di(p.tx,p.ty),undefined);
  }
});
test('una cassa saccheggiata non rigenera il bottino dopo salva e carica',()=>{
  const r=trovaLuogo('boscaioli'),p=segnoNelLuogo(r,'c');
  for(let i=0;i<contenitori.CASELLE;i++)contenitori.sposta(p.tx,p.ty,false,i);
  assert.equal(contenitori.eVuota(p.tx,p.ty),true);
  const stato=salvataggio.istantanea(eroe,0);assert.ok(salvataggio.applica(stato));
  assert.equal(contenitori.eVuota(p.tx,p.ty),true);
});
test('le costruzioni salvate prevalgono sui nuovi oggetti generati',()=>{
  const r=trovaLuogo('pozzo'),p=segnoNelLuogo(r,'o');
  modifiche.imposta(p.tx,p.ty,{oggetto:OGGETTO.MURO,colpi:1});
  const stato=salvataggio.istantanea(eroe,0);assert.ok(salvataggio.applica(stato));
  assert.equal(mappa.oggettoDi(p.tx,p.ty),OGGETTO.MURO);assert.equal(modifiche.di(p.tx,p.ty).colpi,1);
});

test('ogni colpo di raccolta costa stamina, incluso quello finale e le mani nude',()=>{
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.ALBERO});
  inventario.aggiungi('ascia',1);
  let colpi=0,esito;
  do { esito=azioni.agisci(eroe,'ascia');colpi++; } while(esito.tipo==='colpo');
  assert.equal(esito.tipo,'raccolto');vicino(bisogni.livello('stanchezza'),1-colpi*0.015);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.SASSO});
  azioni.agisci(eroe,null);vicino(bisogni.livello('stanchezza'),1-(colpi+1)*0.015);
});
test('combattere costa il 2% anche con un attrezzo rotto e si può colpire a zero',()=>{
  animale('orso');inventario.aggiungi('ascia',1);inventario.attrezzo('ascia').usi=0;
  assert.equal(azioni.agisci(eroe,'ascia').tipo,'combattuto');
  vicino(bisogni.livello('stanchezza'),0.98);
  bisogni.consuma('stanchezza',1);
  assert.equal(azioni.agisci(eroe,'ascia').tipo,'combattuto');
  assert.equal(bisogni.livello('stanchezza'),0);
});
test('zappare costa il 2%, seminare e innaffiare lo 0,5%',()=>{
  inventario.aggiungi('zappa',1);inventario.aggiungi('semi',1);inventario.aggiungi('secchio_pieno',1);
  // Un tassello sicuramente coltivabile.
  let trovato=null;
  for(let y=ty-20;y<=ty+20&&!trovato;y++)for(let x=tx-20;x<=tx+20;x++) {
    modifiche.imposta(x,y,{oggetto:OGGETTO.NESSUNO});
    const e={...pos(x-1,y),guarda:'destra'};
    if(azioni.azionePossibile(e,'zappa')?.tipo==='zappa'){trovato=e;break;}
  }
  assert.ok(trovato);
  assert.equal(azioni.agisci(trovato,'zappa').tipo,'zappa');vicino(bisogni.livello('stanchezza'),0.98);
  assert.equal(azioni.agisci(trovato,'semi').tipo,'semina');vicino(bisogni.livello('stanchezza'),0.975);
  assert.equal(azioni.agisci(trovato,'secchio_pieno').tipo,'innaffia');vicino(bisogni.livello('stanchezza'),0.97);
});
test('ogni taglio di macellazione costa il 2%; senza ascia non si paga',()=>{
  const a=animale('cervo');fauna.colpisci(a,100);
  assert.equal(azioni.agisci(eroe,null),null);vicino(bisogni.livello('stanchezza'),1);
  inventario.aggiungi('ascia',1);
  for(let i=0;i<3;i++){assert.equal(azioni.agisci(eroe,'ascia').lavorato,true);vicino(bisogni.livello('stanchezza'),1-(i+1)*0.02);}
});
test('costruzione e riparazione costano solo quando riescono',()=>{
  const benda=ricette.RICETTE.find(r=>r.id==='benda');
  assert.equal(ricette.fai(benda).fatto,false);vicino(bisogni.livello('stanchezza'),1);
  inventario.aggiungi('fibra',5);assert.equal(ricette.fai(benda).fatto,true);vicino(bisogni.livello('stanchezza'),0.98);
  inventario.aggiungi('ascia',1);inventario.attrezzo('ascia').usi=1;inventario.aggiungi('pietra',1);
  const ricetta=ricette.RICETTE.find(r=>r.id==='ripara_ascia');
  assert.equal(ricette.fai(ricetta,false).fatto,false);vicino(bisogni.livello('stanchezza'),0.98);
  assert.equal(ricette.fai(ricetta,true).fatto,true);vicino(bisogni.livello('stanchezza'),0.96);
});
test('aprire una porta non costa stamina',()=>{
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.PORTA});
  assert.equal(azioni.agisci(eroe,null).tipo,'porta');vicino(bisogni.livello('stanchezza'),1);
});
test('il recupero notturno è proporzionale alle ore effettive, fino a otto',()=>{
  for(const [ora,atteso] of [[23,1],[3,0.5],[5.9,1.1/8]]) {
    reset();tempo.impostaGiorno(5);tempo.impostaOra(ora);
    modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.GIACIGLIO});bisogni.consuma('stanchezza',1);
    const esito=azioni.agisci(eroe,null);
    assert.equal(esito.sveglio,true);vicino(bisogni.livello('stanchezza'),atteso);
    vicino(esito.recuperata,atteso);vicino(tempo.oraCorrente(),7);
  }
});
test('di giorno il giaciglio dà due ore di riposo e 25 punti stamina',()=>{
  tempo.impostaGiorno(5);tempo.impostaOra(12);bisogni.consuma('stanchezza',0.8);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.GIACIGLIO});
  const esito=azioni.agisci(eroe,null);
  vicino(esito.secondi,25);vicino(tempo.oraCorrente(),14);vicino(bisogni.livello('stanchezza'),0.45);
  vicino(bisogni.livello('sete'),1-25/300);assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.GIACIGLIO);
});
test('dormire non sottrae stamina già posseduta oltre il limite invernale',()=>{
  lettoInvernale();bisogni.ristora('stanchezza',0.9);
  azioni.agisci(eroe,null);vicino(bisogni.livello('stanchezza'),0.9);
});
test('lo smontaggio con zaino pieno lascia intatto il giaciglio e non stanca',()=>{
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.GIACIGLIO});
  inventario.aggiungi('pietra',CATALOGO.pietra.pila*inventario.CASELLE);
  assert.match(azioni.smontaDavanti(eroe).messaggio,/zaino pieno/);
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.GIACIGLIO);vicino(bisogni.livello('stanchezza'),1);
});
test('si sviene dopo un’ora a zero; due ore dopo ci si sveglia al 25%',()=>{
  tempo.impostaGiorno(5);
  bisogni.consuma('stanchezza',1);
  simulazione.avanza(12);assert.equal(riposo.secondiDiSonno(),0);
  simulazione.avanza(0.5);vicino(riposo.secondiDiSonno(),25);
  simulazione.avanza(24);vicino(riposo.secondiDiSonno(),1);vicino(bisogni.livello('stanchezza'),0);
  simulazione.avanza(1);assert.equal(riposo.secondiDiSonno(),0);vicino(bisogni.livello('stanchezza'),0.25);
  vicino(bisogni.livello('sete'),1-37.5/300);assert.equal(simulazione.resoconto().risvegliForzati,1);
});
test('il tempo prima di arrivare a zero non conta come esaurimento',()=>{
  bisogni.consuma('stanchezza',1-2/600);
  simulazione.avanza(14);assert.equal(riposo.secondiDiSonno(),0);vicino(riposo.istantanea().esaurimento,12);
  simulazione.avanza(0.5);vicino(riposo.secondiDiSonno(),25);
});
test('recuperare stamina azzera l’ora continuativa di esaurimento',()=>{
  bisogni.consuma('stanchezza',1);simulazione.avanza(12);
  bisogni.ristora('stanchezza',0.1);bisogni.consuma('stanchezza',1);
  simulazione.avanza(1);vicino(riposo.istantanea().esaurimento,1);assert.equal(riposo.secondiDiSonno(),0);
});
test('sonno volontario a zero non fa scattare uno svenimento',()=>{
  bisogni.consuma('stanchezza',1);simulazione.avanza(10);
  simulazione.avanza(25,{dorme:true});assert.deepEqual(riposo.istantanea(),{esaurimento:0,sonno:0});
});
test('svenimento attraversando mezzanotte: fotogrammi e assenza equivalenti',()=>{
  function prepara(){reset();tempo.impostaGiorno(5);tempo.impostaOra(23);bisogni.consuma('stanchezza',1);}
  prepara();for(let i=0;i<50*60;i++)simulazione.avanza(1/60);
  const stato={...bisogni.tutti(),salute:salute.livelloCorrente(),ora:tempo.oraCorrente()};
  prepara();simulazione.avanza(50);
  for(const k of bisogni.ELENCO)vicino(bisogni.livello(k),stato[k]);
  vicino(salute.livelloCorrente(),stato.salute);vicino(tempo.oraCorrente(),stato.ora);
  assert.equal(tempo.giornoCorrente(),6);assert.equal(simulazione.resoconto().risvegliForzati,1);
});
test('esaurimento e sonno forzato sopravvivono a salva/carica',()=>{
  bisogni.consuma('stanchezza',1);simulazione.avanza(12);
  const prima=salvataggio.istantanea(eroe,0);reset();assert.ok(salvataggio.applica(prima));
  simulazione.avanza(0.5);vicino(riposo.secondiDiSonno(),25);simulazione.avanza(10);
  const durante=salvataggio.istantanea(eroe,0);reset();assert.ok(salvataggio.applica(durante));
  vicino(riposo.secondiDiSonno(),15);simulazione.avanza(15);vicino(bisogni.livello('stanchezza'),0.25);
});
test('vecchi salvataggi compatibili; timer corrotti rifiutati senza mutazioni',()=>{
  const stato=salvataggio.istantanea(eroe,0);delete stato.riposo;assert.ok(salvataggio.applica(stato));
  assert.deepEqual(riposo.istantanea(),{esaurimento:0,sonno:0});
  for(const riposo of [null,{esaurimento:12.5,sonno:0},{esaurimento:-1,sonno:0},{esaurimento:0,sonno:26},{esaurimento:1,sonno:2},{esaurimento:NaN,sonno:0}]) {
    assert.equal(salvataggio.applica({...stato,riposo}),null);vicino(bisogni.livello('stanchezza'),1);
  }
});
test('morire durante lo svenimento non dà stamina né risveglio',()=>{
  bisogni.consuma('stanchezza',1);simulazione.avanza(12.5);salute.ripristina(0.01);
  simulazione.avanza(25,{alFreddo:()=>true});assert.equal(salute.eMorto(),true);
  vicino(bisogni.livello('stanchezza'),0);assert.equal(simulazione.resoconto().risvegliForzati,0);
});
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
  simulazione.avanza(10,{alFreddo:()=>freddo.alFreddo(eroe)});
  vicino(salute.livelloCorrente(),1-10/225);
  stanza();modifiche.imposta(tx-1,ty,{oggetto:OGGETTO.FALO_ACCESO});salute.reimposta();
  simulazione.avanza(10,{alFreddo:()=>freddo.alFreddo(eroe)});
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
  assert.equal(chiuso(),true);assert.equal(freddo.alFreddo(eroe),true);
  modifiche.imposta(tx+2,ty,{oggetto:OGGETTO.PORTA_APERTA});assert.equal(chiuso(),false);
});
test('il fuoco riscalda tutta la stanza finché la porta è chiusa',()=>{
  for(let y=ty-3;y<=ty+3;y++)for(let x=tx-4;x<=tx+4;x++)
    modifiche.imposta(x,y,{oggetto:Math.abs(x-tx)===4||Math.abs(y-ty)===3?OGGETTO.MURO:OGGETTO.NESSUNO});
  modifiche.imposta(tx+4,ty,{oggetto:OGGETTO.PORTA});
  modifiche.imposta(tx-2,ty,{oggetto:OGGETTO.FALO_ACCESO});
  eroe={...eroe,...pos(tx+2,ty)};tempo.impostaGiorno(9);tempo.impostaOra(22);
  assert.equal(freddo.alFreddo(eroe),false);
  modifiche.imposta(tx+4,ty,{oggetto:OGGETTO.PORTA_APERTA});assert.equal(freddo.alFreddo(eroe),true);
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
test('sotto la pioggia il falò si posa, ma non si accende allo scoperto',()=>{
  // La regola è la stessa di sempre e sta al punto giusto: posare una fossa
  // fredda sotto l'acqua non spreca niente, accenderla sì.
  maltempo('pioggia');inventario.aggiungi('falo',2);inventario.aggiungi('legna',4);
  assert.equal(azioni.agisci(eroe,'falo',0).tipo,'posa');
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FALO_SPENTO);
  assert.match(azioni.azionePossibile(eroe,'legna',1).impedito,/piove/);
  assert.equal(azioni.agisci(eroe,'legna',1),null);
  assert.equal(inventario.quante('legna'),4);
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FALO_SPENTO);
  // Al chiuso invece si accende. La stanza rifà i tasselli dentro, quindi il
  // falò si riposa: è il secondo dei due nello zaino.
  stanza();
  assert.equal(azioni.agisci(eroe,'falo',0).tipo,'posa');
  assert.equal(azioni.azionePossibile(eroe,'legna',1).impedito ?? null,null);
  assert.equal(azioni.agisci(eroe,'legna',1).tipo,'carica');
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FALO_ACCESO);
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
  maltempo('pioggia');assert.equal(freddo.alFreddo(eroe),false);
  meteo.avanza(9,eroe);assert.equal(freddo.alFreddo(eroe),false);
  meteo.avanza(11,eroe);assert.equal(meteo.livelloBagnato(),1);assert.equal(freddo.alFreddo(eroe),true);
  assert.equal(freddo.alFreddo(eroe),true,'la torcia in mano non scalda più');
});
test('copertura impedisce di bagnarsi; fuoco coperto asciuga più in fretta',()=>{
  stanza();maltempo('pioggia');meteo.avanza(30,eroe);assert.equal(meteo.livelloBagnato(),0);
  meteo.ripristina(1);meteo.avanza(10,eroe);vicino(meteo.livelloBagnato(),0.75);
  modifiche.imposta(tx-1,ty,{oggetto:OGGETTO.FALO_ACCESO});meteo.aggiornaMondo();
  meteo.avanza(10,eroe);assert.equal(meteo.livelloBagnato(),0);assert.equal(freddo.alFreddo(eroe),false);
});
test('pioggia: simulazione a fotogrammi e recupero concordano su acqua e salute',()=>{
  maltempo('pioggia');
  for(let i=0;i<30*60;i++)simulazione.avanza(1/60,{eroe,alFreddo:()=>freddo.alFreddo(eroe)});
  const prima=salute.livelloCorrente(),bagnato=meteo.livelloBagnato();
  reset();maltempo('pioggia');simulazione.avanza(30,{eroe,alFreddo:()=>freddo.alFreddo(eroe)});
  vicino(salute.livelloCorrente(),prima);vicino(meteo.livelloBagnato(),bagnato);
});
test('neve rallenta allo scoperto e causa freddo diurno; il riparo protegge',()=>{
  maltempo('neve');assert.equal(meteo.fattoreVelocita(eroe),0.72);assert.equal(freddo.alFreddo(eroe),true);
  stanza();assert.equal(meteo.fattoreVelocita(eroe),1);assert.equal(freddo.alFreddo(eroe),false);
});
test('il sonno esposto alla pioggia non evita bagnato e freddo',()=>{
  // Un sonnellino di due ore in pieno giorno di pioggia: ci si fradicia e si
  // paga. Di notte si pagherebbe ugualmente, ma la pioggia finisce a
  // mezzanotte e da M7.12.2 il bagnato morde così piano che all'alba il corpo
  // se l'è già ripreso — il che è la regola nuova, non un buco.
  maltempo('pioggia');modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.GIACIGLIO});tempo.impostaOra(12);
  assert.equal(azioni.agisci(eroe,null).tipo,'dormi');
  assert.equal(meteo.fradicio(),true);
  assert.ok(salute.livelloCorrente()<1);
  assert.ok(salute.livelloCorrente()>0.9,'una dormita sotto l’acqua non è una condanna');
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
function lettoInvernale(quale=OGGETTO.GIACIGLIO) {
  tempo.impostaGiorno(9);tempo.impostaOra(3);
  modifiche.imposta(tx+1,ty,{oggetto:quale});
  bisogni.ripristina({fame:1,sete:1,stanchezza:0});
}
test('quattro ore invernali vicino al falò recuperano il 37,5%',()=>{
  lettoInvernale();modifiche.imposta(tx+4,ty,{oggetto:OGGETTO.FALO_ACCESO,posata:9});
  const esito=azioni.agisci(eroe,null);
  assert.equal(esito.sveglio,true);assert.equal(esito.pocoRiposato,false);
  vicino(bisogni.livello('stanchezza'),0.375);assert.equal(esito.messaggio,null);
});
test('quattro ore invernali senza falò recuperano il 12,5% e comunicano il cattivo riposo',()=>{
  lettoInvernale();const esito=azioni.agisci(eroe,null);
  assert.equal(esito.sveglio,true);vicino(bisogni.livello('stanchezza'),0.125);
  assert.equal(esito.messaggio,'Non ti senti molto riposato...');
});
test('la torcia in mano non sostituisce il falò nel riposo',()=>{
  lettoInvernale();inventario.aggiungi('torcia',1);
  const esito=azioni.agisci(eroe,'torcia');assert.equal(esito.pocoRiposato,true);
  vicino(bisogni.livello('stanchezza'),0.125);
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
test('quattro ore nelle altre stagioni recuperano metà stamina',()=>{
  lettoInvernale();tempo.impostaGiorno(5);
  const esito=azioni.agisci(eroe,null);assert.equal(esito.sveglio,true);
  assert.equal(esito.pocoRiposato,false);vicino(bisogni.livello('stanchezza'),0.5);
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
  for(const k of ['CARNE_CRUDA','CARNE_ARROSTITA','PELLE','PELLICCIA']) decodifica(arteFauna[k]);
  assert.notDeepEqual(arteFauna.PELLE,arteFauna.PELLICCIA,'spoglia e capo si devono distinguere');
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

const RICETTA_PELLI = ricette.RICETTE.find(r=>r.id==='giaciglio_pelli');
test('il giaciglio di pelli vuole il banco, tre pelli e le altre cose',()=>{
  inventario.aggiungi('pelle',2);inventario.aggiungi('fibra',4);inventario.aggiungi('legna',2);
  assert.equal(ricette.fai(RICETTA_PELLI).perche,'banco');
  assert.equal(ricette.fai(RICETTA_PELLI,true).perche,'materiali');
  inventario.aggiungi('pelle',1);
  assert.equal(ricette.fai(RICETTA_PELLI,true).fatto,true);
  assert.equal(inventario.quante('pelle'),0);assert.equal(inventario.quante('giaciglio_pelli'),1);
});
test('il giaciglio di pelli si posa e si riprende, e torna sé stesso',()=>{
  inventario.aggiungi('giaciglio_pelli',1);
  assert.equal(azioni.agisci(eroe,'giaciglio_pelli').tipo,'posa');
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.GIACIGLIO_PELLI);
  assert.equal(mappa.solidoIn(tx+1,ty),false);
  tempo.impostaOra(12);
  assert.equal(azioni.smontaDavanti(eroe).tipo,'smontato');
  assert.equal(inventario.quante('giaciglio_pelli'),1);assert.equal(inventario.quante('giaciglio'),0);
});
test('sulle pelli si dorme sia di giorno sia di notte',()=>{
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.GIACIGLIO_PELLI});
  tempo.impostaOra(12);assert.equal(azioni.azionePossibile(eroe,null).verbo,'Riposa 2 ore');
  tempo.impostaOra(22);assert.equal(azioni.azionePossibile(eroe,null).tipo,'dormi');
});
test('sulle pelli la notte invernale col fuoco riposa come le altre',()=>{
  lettoInvernale(OGGETTO.GIACIGLIO_PELLI);
  modifiche.imposta(tx+4,ty,{oggetto:OGGETTO.FALO_ACCESO,posata:9});
  const esito=azioni.agisci(eroe,null);
  assert.equal(esito.pocoRiposato,false);assert.equal(esito.messaggio,null);
  vicino(bisogni.livello('stanchezza'),0.5);
});
test('sulle pelli senza fuoco si riposa a metà, e il cattivo riposo si dice lo stesso',()=>{
  lettoInvernale(OGGETTO.GIACIGLIO_PELLI);
  const esito=azioni.agisci(eroe,null);
  vicino(bisogni.livello('stanchezza'),0.25);
  assert.equal(esito.pocoRiposato,true);
  assert.equal(esito.messaggio,'Non ti senti molto riposato...');
  // Le pelli danno riposo, non calore: d'inverno senza fuoco si gela lo stesso.
  assert.ok(salute.livelloCorrente()<1);
});
test('fuori dall’inverno i due letti sono indistinguibili',()=>{
  for(const quale of [OGGETTO.GIACIGLIO,OGGETTO.GIACIGLIO_PELLI]) {
    reset();tempo.impostaGiorno(2);tempo.impostaOra(22);
    modifiche.imposta(tx+1,ty,{oggetto:quale});
    bisogni.ripristina({fame:1,sete:1,stanchezza:0.4});
    const esito=azioni.agisci(eroe,null);
    assert.equal(esito.pocoRiposato,false);vicino(bisogni.livello('stanchezza'),1);
  }
});
test('un giaciglio di pelli sopravvive a salva e carica',()=>{
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.GIACIGLIO_PELLI});
  const stato=salvataggio.istantanea(eroe,0);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.NESSUNO});
  assert.ok(salvataggio.applica(stato));
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.GIACIGLIO_PELLI);
});

test('la torcia illumina ma non scalda: né in mano, né piantata, né al chiuso',()=>{
  tempo.impostaGiorno(9);tempo.impostaOra(3);
  inventario.aggiungi('torcia',1);
  assert.equal(freddo.alFreddo(eroe),true,'notte invernale, torcia in mano');
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.TORCIA_PIANTATA});
  assert.equal(freddo.alFreddo(eroe),true,'né piantata accanto');
  stanza();modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.TORCIA_PIANTATA});
  assert.equal(freddo.alFreddo(eroe),true,'né dentro una stanza chiusa');
  // Quello che scalda resta il fuoco vero, e questa è la regressione del
  // passaggio da luceVicina() a fuocoVicino().
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FALO_ACCESO});
  assert.equal(freddo.alFreddo(eroe),false,'il falò sì');
});
test('la torcia accesa si consuma, la pila scala, e nello zaino non brucia',()=>{
  inventario.aggiungi('torcia',2);
  assert.equal(inventario.contenuto()[0].usi,60);
  assert.deepEqual(fiamma.avanza(5,'legna',0),[],'quello che non fa luce non brucia');
  assert.deepEqual(fiamma.avanza(5,null,0),[],'e nemmeno le mani vuote');
  assert.equal(inventario.contenuto()[0].usi,60,'la torcia nello zaino è intatta');
  for(let i=0;i<59;i++) assert.deepEqual(fiamma.avanza(5,'torcia',0),[]);
  assert.equal(inventario.contenuto()[0].usi,1);
  assert.deepEqual(fiamma.avanza(5,'torcia',0),[{cosa:'torcia',finita:true,ancora:1}]);
  assert.equal(inventario.quante('torcia'),1);
  assert.equal(inventario.contenuto()[0].usi,60,'ne comincia un\'altra intera');
  for(let i=0;i<59;i++) fiamma.avanza(5,'torcia',0);
  assert.deepEqual(fiamma.avanza(5,'torcia',0),[{cosa:'torcia',finita:true,ancora:0}]);
  assert.equal(inventario.quante('torcia'),0,'finita la pila, finita la casella');
});
test('il ritmo della fiamma non dipende dai fotogrammi',()=>{
  inventario.aggiungi('torcia',1);
  for(let i=0;i<300;i++) fiamma.avanza(1/60,'torcia',0);
  assert.equal(inventario.contenuto()[0].usi,59,'cinque secondi sono un uso, comunque li conti');
});
test('il pozzo gela d’inverno e torna a dare acqua col disgelo',()=>{
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.POZZO});
  bisogni.ripristina({fame:1,sete:0.3,stanchezza:1});
  inventario.aggiungi('secchio',1);
  assert.equal(azioni.azionePossibile(eroe,null).tipo,'bevi');
  assert.equal(azioni.azionePossibile(eroe,'secchio').impedito,null);
  tempo.impostaGiorno(9);acqua.aggiorna();
  assert.match(azioni.azionePossibile(eroe,null).impedito,/gelato/);
  assert.match(azioni.azionePossibile(eroe,'secchio').impedito,/gelato/);
  assert.equal(azioni.agisci(eroe,null),null,'e premere non fa niente');
  vicino(bisogni.livello('sete'),0.3);
  tempo.impostaGiorno(13);acqua.aggiorna();
  assert.equal(azioni.azionePossibile(eroe,null).impedito,null,'il disgelo lo riapre');
  assert.equal(azioni.agisci(eroe,null).tipo,'bevi');
});

test('la valle resta più natura che costruito, e il conto è misurato non dichiarato',()=>{
  const R=12;
  let celle=0,case_=0,luoghi=0;
  for(const seme of ['valle-1','prova']) {
    mappa.inizializza(seme);
    for(let cy=-R;cy<=R;cy++)for(let cx=-R;cx<=R;cx++) {
      celle++;
      const c=mappa.rovinaNellaCella(cx,cy);
      if(!c) continue;
      c.luogo ? luoghi++ : case_++;
    }
  }
  const pc=n=>100*n/celle, natura=pc(celle-case_-luoghi);
  // Le rovine non si toccano: è la riga che protegge i mondi già in gioco.
  assert.ok(pc(case_)>22 && pc(case_)<27,`rovine ${pc(case_).toFixed(1)}%`);
  assert.ok(pc(luoghi)>28 && pc(luoghi)<34,`luoghi ${pc(luoghi).toFixed(1)}%`);
  assert.ok(natura>42,`natura ${natura.toFixed(1)}%: la valle si sta riempiendo`);
});

test('il cadavere regge una voce più dello zaino: è un mucchio, non uno zaino',()=>{
  // Nessun oggetto indossabile esiste ancora: la fila da nove si costruisce a
  // mano, ed è esattamente il caso che il giorno della pelliccia arriverà da
  // solo — morire con lo zaino pieno e qualcosa addosso.
  for(let i=0;i<8;i++)inventario.aggiungi('pietra',1);
  const stato=salvataggio.istantanea(eroe,0);
  const roba=[...Array(9)].map(()=>({cosa:'pietra',quantita:1}));
  stato.modifiche=[{tx:tx+1,ty,oggetto:OGGETTO.CADAVERE,roba,giorno:1}];
  assert.ok(salvataggio.valido(stato),'nove voci sono ammesse');
  stato.modifiche[0].roba=[...roba,{cosa:'pietra',quantita:1}];
  assert.equal(salvataggio.valido(stato),false,'dieci no: il tetto resta un tetto');
});

const RICETTA_PELLICCIA = ricette.RICETTE.find(r=>r.id==='pelliccia');
const gela = (secondi)=>simulazione.avanza(secondi,{eroe,alFreddo:()=>freddo.alFreddo(eroe)});
function vestito() { inventario.aggiungi('pelliccia',1);azioni.consuma('pelliccia',0); }

test('la pelliccia si indossa con E, la casella si libera, la seconda si scambia',()=>{
  inventario.aggiungi('pelliccia',1);
  assert.deepEqual(azioni.consuma('pelliccia',0),{tipo:'indossato',cosa:'pelliccia',tolto:null});
  assert.equal(addosso.indossato().cosa,'pelliccia');
  assert.equal(inventario.quante('pelliccia'),0,'non occupa più una casella');
  inventario.aggiungi('pelliccia',1);
  assert.equal(azioni.consuma('pelliccia',0).tolto,'pelliccia','la vecchia torna nello zaino');
  assert.equal(inventario.quante('pelliccia'),1);
  assert.equal(addosso.indossato().cosa,'pelliccia');
});
test('a mani vuote E spoglia; a zaino pieno si rifiuta senza perdere il capo',()=>{
  vestito();
  // Otto asce e non otto pietre: la pietra si impila a quaranta, quindi otto
  // pietre stanno in una casella sola e lo zaino pieno non sarebbe pieno.
  inventario.aggiungi('ascia',8);
  assert.deepEqual(azioni.spogliati(),{tipo:'zainoPieno'});
  assert.equal(addosso.indossato().cosa,'pelliccia','resta addosso');
  inventario.svuotaCasella(7);
  assert.deepEqual(azioni.spogliati(),{tipo:'tolto',cosa:'pelliccia'});
  assert.equal(addosso.indossato(),null);assert.equal(inventario.quante('pelliccia'),1);
  assert.equal(azioni.spogliati(),null,'a torso nudo non fa niente');
});
test('la pelliccia tiene il freddo a uno: sessanta secondi di neve costano meno della metà',()=>{
  bisogni.ripristina({fame:1,sete:1,stanchezza:1});
  maltempo('neve');vestito();
  gela(60);
  vicino(salute.livelloCorrente(),1-60/225,1e-6);
  assert.equal(salute.moltiplicatoreFreddo(true),1);
  reset();bisogni.ripristina({fame:1,sete:1,stanchezza:1});maltempo('neve');
  gela(60);
  vicino(salute.livelloCorrente(),1-135/225,1e-6);
  assert.equal(salute.moltiplicatoreFreddo(),3);
});
test('una notte invernale intera vestiti si attraversa invece di uccidere',()=>{
  bisogni.ripristina({fame:1,sete:1,stanchezza:1});
  maltempo('neve');vestito();
  gela(125);
  assert.equal(salute.eMorto(),false,'si arriva dall’altra parte');
  vicino(salute.livelloCorrente(),1-125/225,1e-6);
});
test('l’esposizione si accumula anche protetti: spogliarsi non azzera i gradini',()=>{
  bisogni.ripristina({fame:1,sete:1,stanchezza:1});
  maltempo('neve');vestito();
  gela(40);
  vicino(salute.secondiEsposto(),30);
  assert.equal(salute.moltiplicatoreFreddo(),3,'i gradini erano saliti lo stesso');
});
test('una pelliccia zuppa non scalda',()=>{
  bisogni.ripristina({fame:1,sete:1,stanchezza:1});
  maltempo('neve');vestito();meteo.ripristina(1);
  gela(30);
  vicino(salute.livelloCorrente(),1-45/225,1e-6,'zuppa vale come niente');
  reset();bisogni.ripristina({fame:1,sete:1,stanchezza:1});
  maltempo('neve');vestito();meteo.ripristina(0.4);
  gela(30);
  vicino(salute.livelloCorrente(),1-30/225,1e-6,'bagnata ma non zuppa protegge ancora');
});
test('con la pelliccia ci si bagna in diciotto secondi invece di dieci',()=>{
  maltempo('pioggia');
  meteo.avanza(10,eroe);assert.equal(meteo.zuppo(),true,'nudi bastano dieci secondi');
  reset();maltempo('pioggia');vestito();
  meteo.avanza(18,eroe);assert.equal(meteo.zuppo(),false);
  meteo.avanza(1,eroe);assert.equal(meteo.zuppo(),true);
});
test('la ricetta della pelliccia vuole il banco e quattro pelli',()=>{
  inventario.aggiungi('pelle',3);inventario.aggiungi('fibra',3);
  assert.equal(ricette.fai(RICETTA_PELLICCIA).perche,'banco');
  assert.equal(ricette.fai(RICETTA_PELLICCIA,true).perche,'materiali');
  inventario.aggiungi('pelle',1);
  assert.equal(ricette.fai(RICETTA_PELLICCIA,true).fatto,true);
  assert.equal(inventario.quante('pelle'),0);assert.equal(inventario.quante('pelliccia'),1);
});
test('la pelliccia si salva e torna addosso; i capi storti sono respinti prima di toccare la partita',()=>{
  vestito();
  const stato=salvataggio.istantanea(eroe,0);
  addosso.reimposta();
  assert.ok(salvataggio.applica(stato));
  assert.equal(addosso.indossato().cosa,'pelliccia');
  for(const storto of [{cosa:'pietra'},{cosa:'nulla'},'pelliccia',42]) {
    assert.equal(salvataggio.valido({...stato,addosso:storto}),false,JSON.stringify(storto));
  }
  const vecchio={...stato};delete vecchio.addosso;
  assert.ok(salvataggio.applica(vecchio));
  assert.equal(addosso.indossato(),null,'un salvataggio vecchio si riapre a torso nudo');
});
test('morire con lo zaino pieno e la pelliccia addosso non rompe il salvataggio',()=>{
  vestito();
  inventario.aggiungi('ascia',8);
  const morto=azioni.lasciaIlCadavere(eroe,1);
  assert.equal(morto.quante,9,'otto caselle più quello che avevi addosso');
  assert.equal(addosso.indossato(),null,'il capo resta sul corpo');
  const dati=modifiche.di(morto.tx,morto.ty);
  assert.ok(dati.roba.some(c=>c.cosa==='pelliccia'&&c.quantita===1));
  const stato=salvataggio.istantanea(eroe,0);
  assert.ok(salvataggio.valido(stato),'una fila da nove è ammessa: un cadavere è un mucchio');
});
test('fauna: l’inverno è magro, l’autunno è la stagione della caccia',()=>{
  // Trecento secondi, cioè una giornata intera, uccidendo tutto quello che
  // arriva: così si conta quante bestie offre la stagione, non quante ne
  // stanno intorno insieme.
  const inUnaGiornata = (giorno) => {
    tempo.reimposta(); tempo.impostaGiorno(giorno); fauna.reimposta();
    let arrivate = 0;
    for (let s = 0; s < tempo.SECONDI_PER_GIORNO; s += 1) {
      const prima = new Set(fauna.tutte());
      fauna.aggiorna(1, eroe);
      for (const e of fauna.tutte()) if (!prima.has(e)) { arrivate += 1; e.vita = 0; e.stato = 'carcassa'; e.mortoIl = 0; }
    }
    return arrivate;
  };
  const estate = inUnaGiornata(1), autunno = inUnaGiornata(5), inverno = inUnaGiornata(9);
  assert.ok(inverno < estate, `inverno ${inverno} non è meno di estate ${estate}`);
  assert.ok(autunno >= estate, `autunno ${autunno} non è almeno quanto estate ${estate}`);
  assert.equal(fauna.PER_STAGIONE.inverno.massimi, 1);
});
test('fauna: d’inverno se ne tollera una sola viva, e quelle che c’erano restano',()=>{
  tempo.reimposta(); tempo.impostaGiorno(5); fauna.reimposta();
  const a = animale('cervo', 300), b = animale('bufalo', 320);
  tempo.impostaGiorno(9);
  assert.equal(fauna.quanteNeVuole(), 1);
  for (let s = 0; s < 200; s += 1) fauna.aggiorna(1, eroe);
  // Nessuna dissolta sotto gli occhi, e nessuna arrivata in più.
  assert.ok(fauna.tutte().includes(a) && fauna.tutte().includes(b));
  assert.equal(fauna.quanti(), 2);
});
test('il cavallo si fa notare da lontano e rende un pasto, non una scorta',()=>{
  const s = fauna.SPECIE.cavallo;
  assert.ok(s.raggio >= 96, 'il cavallo deve accorgersi di te da lontano');
  assert.ok(s.carne < fauna.SPECIE.cervo.carne, 'il sicuro non può rendere più del rischioso');
  assert.ok(s.velocita > fauna.SPECIE.bufalo.velocita);
  // Si accorge di te da sei tasselli e scappa, senza aspettare la tolleranza.
  const e = animale('cavallo', 96);
  fauna.aggiorna(1 / 60, eroe);
  assert.equal(e.stato, 'fuga');
});
test('ogni specie ha una voce, e la voce è una misura sensata',()=>{
  for (const [specie, s] of Object.entries(fauna.SPECIE)) {
    assert.ok(Number.isFinite(s.voce) && s.voce > 0.3 && s.voce < 2, `${specie} senza voce`);
  }
  assert.ok(fauna.SPECIE.orso.voce < fauna.SPECIE.cervo.voce, 'l’orso deve essere più cupo del cervo');
});
test('d’inverno le bestie sono magre, e conta il giorno in cui sono cadute',()=>{
  // Un cervo abbattuto d'inverno rende meno di uno abbattuto d'estate, e
  // macellarlo il giorno dopo non lo ingrassa.
  const resa = (giorno) => {
    tempo.reimposta(); tempo.impostaGiorno(giorno); fauna.reimposta(); inventario.svuota();
    const e = animale('cervo', 16);
    fauna.colpisci(e, 99);
    for (let i = 0; i < 3; i += 1) fauna.macella(e);
    return inventario.quante('carne_cruda');
  };
  const estate = resa(1), inverno = resa(9);
  assert.equal(estate, fauna.SPECIE.cervo.carne);
  assert.ok(inverno < estate, `inverno ${inverno} non è meno di estate ${estate}`);
  assert.ok(inverno >= 1, 'una bestia magra rende poco, non niente');
  // Le pelli non cambiano: la pelliccia non deve costare di più proprio
  // nella stagione per cui esiste.
  assert.equal(inventario.quante('pelle'), fauna.SPECIE.cervo.pelli);
});
test('la pioggia non uccide più chi la prende all’aperto',()=>{
  // Il caso che ha aperto questa tappa: fermi in mezzo a un prato, in pieno
  // giorno, senza aver fatto niente di sbagliato. Prima: zuppo a 10 secondi,
  // morto a 101.
  maltempo('pioggia');tempo.impostaOra(0);
  salute.reimposta();meteo.reimposta();
  let fradicioA=null;
  // Una giornata intera sotto l'acqua, dalla mezzanotte alla mezzanotte.
  for(let s=1;s<=295;s+=1) {
    simulazione.avanza(1,{eroe,alFreddo:()=>freddo.tipo(eroe)});
    if(fradicioA===null && meteo.fradicio()) fradicioA=s;
  }
  assert.ok(fradicioA>=20 && fradicioA<=22, `fradicio a ${fradicioA}s`);
  assert.equal(salute.eMorto(),false,'una giornata intera di pioggia non deve uccidere');
  assert.ok(salute.livelloCorrente()<0.5,'ma deve costare: restare sotto l’acqua non è gratis');
});
test('il bagnato morde solo da fradici, e non sale di gradino',()=>{
  maltempo('pioggia');salute.reimposta();meteo.reimposta();
  // Zuppo ma non fradicio: nessun danno, e nessun freddo dichiarato.
  meteo.ripristina(0.6);
  assert.equal(freddo.tipo(eroe),null);
  simulazione.avanza(2,{eroe,alFreddo:()=>freddo.tipo(eroe)});
  assert.equal(salute.livelloCorrente(),1);
  // Fradicio: freddo "bagnato", e il moltiplicatore non sale mai.
  meteo.ripristina(1);
  assert.equal(freddo.tipo(eroe),'bagnato');
  for(let s=0;s<60;s+=1) simulazione.avanza(1,{eroe,alFreddo:()=>freddo.tipo(eroe)});
  assert.equal(salute.moltiplicatoreFreddo(false),1,'il bagnato non fa salire i gradini');
  const perso=1-salute.livelloCorrente();
  // Sessanta secondi fradici: a metà danno e senza gradini sono 60/450.
  vicino(perso,60/450,1e-3);
});
test('sotto la chioma la pioggia bagna un quarto, e il falò si accende',()=>{
  const giorno=maltempo('pioggia');
  // Due alberi accanto al tassello davanti: una macchia, non un albero solo.
  modifiche.imposta(tx+1,ty-1,{oggetto:OGGETTO.ALBERO});
  modifiche.imposta(tx+1,ty+1,{oggetto:OGGETTO.ALBERO});
  assert.equal(meteo.sottoLaChioma(tx+1,ty),true);
  assert.equal(meteo.sottoLaChioma(tx-3,ty),false,'un prato non ripara');
  // Bagna un quarto: fradici in ottanta secondi invece che in venti. Si misura
  // prima di accendere qualunque cosa, se no è il fuoco che asciuga.
  meteo.reimposta();
  const dentroLaMacchia={px:(tx+1.5)*16,py:(ty+0.75)*16,guarda:'destra'};
  for(let s=0;s<40;s+=1) meteo.avanza(1,dentroLaMacchia);
  vicino(meteo.livelloBagnato(),40/80,1e-6);
  assert.equal(giorno>0,true);
  // E il falò si accende sotto la chioma e non sul prato scoperto: la fossa si
  // posa dovunque, è la legna che l'acqua non lascia accendere.
  inventario.svuota();inventario.aggiungi('legna',4);
  modifiche.imposta(tx-3,ty,{oggetto:OGGETTO.FALO_SPENTO});
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FALO_SPENTO});
  const sulPrato={...pos(tx-4,ty),guarda:'destra'};
  assert.match(azioni.azionePossibile(sulPrato,'legna',0).impedito,/piove/);
  const sottoIlBosco={...pos(tx,ty),guarda:'destra'};
  assert.equal(azioni.azionePossibile(sottoIlBosco,'legna',0).impedito ?? null,null);
  assert.equal(azioni.agisci(sottoIlBosco,'legna',0).tipo,'carica');
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FALO_ACCESO);
});

test('la stagione decide quale bestia arriva, e i pesi sono quelli dichiarati',()=>{
  // Misurata, non dichiarata: si spazza il tiro da zero a uno e si conta dove
  // cade. Uniforme e non casuale, così il conto è esatto e non ballerino.
  const PASSI=10000;
  for(const [stagione,pesi] of Object.entries({
    estate:{cervo:33,cavallo:27,bufalo:25,orso:15},
    autunno:{cervo:28,cavallo:17,bufalo:40,orso:15},
    inverno:{cervo:20,cavallo:15,bufalo:25,orso:40},
    primavera:{cervo:40,cavallo:30,bufalo:15,orso:15},
  })) {
    const conto={cervo:0,cavallo:0,bufalo:0,orso:0};
    for(let i=0;i<PASSI;i++) conto[fauna.specieDi((i+0.5)/PASSI,stagione)]++;
    for(const [specie,peso] of Object.entries(pesi)) {
      const misurato=100*conto[specie]/PASSI;
      assert.ok(Math.abs(misurato-peso)<0.5,`${stagione}/${specie}: ${misurato.toFixed(1)}% invece di ${peso}%`);
    }
  }
});
test('lo stesso tiro dà bestie diverse a seconda del mese',()=>{
  assert.equal(fauna.specieDi(0.5,'estate'),'cervo');
  assert.equal(fauna.specieDi(0.5,'inverno'),'bufalo');
  // Il tiro che d'inverno è un orso e in ogni altra stagione è un bufalo: è
  // tutta la tappa in una riga.
  assert.equal(fauna.specieDi(0.7,'inverno'),'orso');
  for(const s of ['estate','autunno','primavera']) assert.equal(fauna.specieDi(0.7,s),'bufalo');
});
test('nessuna specie sparisce dal calendario, e l’inverno è il mese più pericoloso',()=>{
  for(const s of Object.keys(fauna.PER_STAGIONE))
    for(const specie of Object.keys(fauna.SPECIE))
      assert.ok(fauna.PER_STAGIONE[s].frequenze[specie]>0,`${specie} manca d'${s}`);
  assert.equal(fauna.PER_STAGIONE.inverno.frequenze.orso,40);
  for(const s of ['estate','autunno','primavera']) assert.equal(fauna.PER_STAGIONE[s].frequenze.orso,15);
  // Quanto è probabile che quello che incontri decida di attaccarti.
  // Il rischio vero è quello temperato dalla stagione, non quello di catalogo.
  const pericolo=s=>Object.entries(fauna.PER_STAGIONE[s].frequenze)
    .reduce((n,[id,peso])=>n+peso*fauna.rischioDi(id,s),0)/100;
  assert.ok(pericolo('inverno')>pericolo('autunno'),'inverno > autunno');
  assert.ok(pericolo('autunno')>pericolo('estate'),'autunno > estate');
  assert.ok(pericolo('estate')>pericolo('primavera'),'estate > primavera');
  // E l'autunno deve arrivare a un soffio dall'inverno: sono i due mesi
  // pericolosi, e lo sono per ragioni diverse — d'autunno è la preda che ti
  // carica, d'inverno è il predatore che c'è. Se il divario si riapre, uno
  // dei due ha smesso di fare il suo mestiere.
  assert.ok(pericolo('inverno')-pericolo('autunno')<0.05,
    `autunno ${pericolo('autunno').toFixed(3)} troppo lontano da inverno ${pericolo('inverno').toFixed(3)}`);
});
test('la stagione arriva fino alla nascita, non solo alla tabella',()=>{
  const nata=giorno=>{
    fauna.reimposta();tempo.impostaGiorno(giorno);
    fauna.aggiorna(12,eroe);
    return fauna.tutte()[0]?.specie;
  };
  // Stesso seme e stessa sequenza in tutte e quattro: se la bestia cambia, a
  // deciderlo è stata la stagione e nient'altro.
  const specie=[nata(1),nata(5),nata(9),nata(13)];
  for(const s of specie) assert.ok(s,'una bestia nasce in ogni stagione');
  assert.ok(new Set(specie).size>1,'la stagione non sta decidendo niente: '+specie.join(','));
});

test('il temperamento tocca solo chi tira davvero i dadi',()=>{
  // Il cavallo ha rischio zero e l'orso uno: moltiplicarli non li sposta, e
  // non serve un caso speciale scritto a mano per tenerli fuori.
  for(const s of Object.keys(fauna.PER_STAGIONE)) {
    assert.equal(fauna.rischioDi('cavallo',s),0,`il cavallo non carica mai (${s})`);
    assert.equal(fauna.rischioDi('orso',s),1,`l'orso carica sempre (${s})`);
  }
  vicino(fauna.rischioDi('cervo','estate'),0.35);
  vicino(fauna.rischioDi('bufalo','estate'),0.55);
  vicino(fauna.rischioDi('cervo','autunno'),0.4375);
  vicino(fauna.rischioDi('bufalo','autunno'),0.6875);
  vicino(fauna.rischioDi('cervo','inverno'),0.28);
  vicino(fauna.rischioDi('bufalo','inverno'),0.44);
});
test('il temperamento arriva fino alla decisione, e si misura contando le cariche',()=>{
  const quanteCaricano=(specie,giorno,quante=3000)=>{
    tempo.impostaGiorno(giorno);
    let aggressive=0;
    for(let i=1;i<=quante;i++) {
      const e=fauna.crea(specie,eroe.px+32,eroe.py,Math.imul(i,2654435761));
      fauna.percepisci(e,5,eroe);   // cinque secondi: la tolleranza scade e decide
      if(e.stato==='aggressivo') aggressive++;
    }
    return aggressive/quante;
  };
  for(const [specie,giorno,atteso] of [
    ['cervo',1,0.35],['cervo',5,0.4375],['cervo',9,0.28],
    ['bufalo',1,0.55],['bufalo',5,0.6875],['bufalo',9,0.44],
  ]) {
    const misurato=quanteCaricano(specie,giorno);
    assert.ok(Math.abs(misurato-atteso)<0.03,
      `${specie} giorno ${giorno}: carica il ${(100*misurato).toFixed(1)}% invece del ${(100*atteso).toFixed(2)}%`);
  }
});

// --- M7.13: il focolare ----------------------------------------------------

const CAPIENZA_FOCOLARE = decadimento.capienzaDi(OGGETTO.FOCOLARE_ACCESO);
const CAPIENZA_FALO = decadimento.capienzaDi(OGGETTO.FALO_ACCESO);

// Posare il focolare davanti all'eroe, saltando la regola delle quattro mura:
// serve ai collaudi che parlano di legna e di calore, non di dove si può.
function focolare(legna=CAPIENZA_FOCOLARE) {
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FOCOLARE_ACCESO,legna});
  return {tx:tx+1,ty};
}
test('il focolare si posa solo dentro quattro mura, e si posa spento',()=>{
  inventario.aggiungi('focolare',1);
  assert.match(azioni.azionePossibile(eroe,'focolare',0).impedito,/quattro mura/);
  assert.equal(azioni.agisci(eroe,'focolare',0),null);
  assert.equal(inventario.quante('focolare'),1);
  stanza();
  assert.equal(azioni.azionePossibile(eroe,'focolare',0).impedito ?? null,null);
  assert.equal(azioni.agisci(eroe,'focolare',0).tipo,'posa');
  // Le dieci pietre comprano il camino, non il fuoco: arriva freddo.
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FOCOLARE_SPENTO);
  assert.equal(decadimento.legnaNel(tx+1,ty),0);
  assert.equal(freddo.fuocoPerRiposo(pos(tx+1,ty+1)),false);
});
test('il focolare scalda come il falò, accanto e per tutta la stanza',()=>{
  tempo.impostaGiorno(9);tempo.impostaOra(23);
  assert.equal(freddo.alFreddo(eroe),true);
  focolare();riparo.reimposta();
  assert.equal(freddo.alFreddo(eroe),false);
  // E dall'altro capo di una stanza chiusa, cioè oltre i tre tasselli.
  reset();tempo.impostaGiorno(9);tempo.impostaOra(23);stanza();
  modifiche.imposta(tx+1,ty-1,{oggetto:OGGETTO.FOCOLARE_ACCESO,legna:1});
  const lontano={px:(tx-1+0.5)*16,py:(ty+1+0.75)*16,guarda:'destra'};
  riparo.reimposta();
  assert.equal(freddo.alFreddo(lontano),false);
});
test('sul focolare si cucina e accanto si dorme',()=>{
  const f=focolare();
  inventario.aggiungi('carne_cruda',1);
  assert.equal(azioni.azionePossibile(eroe,'carne_cruda',0).tipo,'cucina');
  azioni.agisci(eroe,'carne_cruda',0);
  assert.equal(inventario.quante('carne_arrostita'),1);
  assert.equal(freddo.fuocoPerRiposo(pos(f.tx,f.ty+1)),true);
});
// --- M7.14: la legna del focolare, e la X -----------------------------------

test('una legna per volta fino al pieno, e la prima accende',()=>{
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FOCOLARE_SPENTO});
  inventario.aggiungi('legna',6);
  for(let attesa=1;attesa<=CAPIENZA_FOCOLARE;attesa++) {
    assert.equal(azioni.azionePossibile(eroe,'legna',0).verbo,'Carica il focolare');
    const esito=azioni.agisci(eroe,'legna',0);
    assert.equal(esito.tipo,'carica');assert.equal(esito.legna,attesa);
    assert.equal(decadimento.legnaNel(tx+1,ty),attesa);
    // La prima legna accende, e da lì in poi scalda: è la differenza che si
    // vede dal letto accanto.
    assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FOCOLARE_ACCESO);
  }
  // Pieno: la legna in mano non entra più, e il tasto lo dice prima.
  assert.equal(inventario.quante('legna'),2);
  assert.equal(azioni.azionePossibile(eroe,'legna',0).verbo,'Guarda il focolare');
  assert.equal(azioni.agisci(eroe,'legna',0).tipo,'guardato');
  assert.equal(inventario.quante('legna'),2);
});
test('due rami valgono una legna, e con uno solo il tasto lo dice prima',()=>{
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FOCOLARE_SPENTO});
  inventario.aggiungi('ramo',1);
  const scarso=azioni.azionePossibile(eroe,'ramo',0);
  assert.equal(scarso.tipo,'carica');
  assert.match(scarso.verbo,/2 rami/);
  assert.equal(scarso.impedito,'servono 2 rami');
  assert.equal(azioni.agisci(eroe,'ramo',0),null);
  assert.equal(inventario.quante('ramo'),1);
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FOCOLARE_SPENTO);
  // Con due, una tacca sola: il contatore conta in legna, i rami si cambiano.
  inventario.aggiungi('ramo',5);
  const esito=azioni.agisci(eroe,'ramo',0);
  assert.equal(esito.tipo,'carica');assert.equal(esito.legna,1);
  assert.equal(inventario.quante('ramo'),4);
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FOCOLARE_ACCESO);
  // E si alterna: quattro rami e una legna riempiono un focolare a quattro.
  azioni.agisci(eroe,'ramo',0);azioni.agisci(eroe,'ramo',0);
  assert.equal(decadimento.legnaNel(tx+1,ty),3);
  assert.equal(inventario.quante('ramo'),0);
  inventario.aggiungi('legna',1);
  assert.equal(azioni.azionePossibile(eroe,'legna',1).verbo,'Carica il focolare');
  azioni.agisci(eroe,'legna',1);
  assert.equal(decadimento.legnaNel(tx+1,ty),CAPIENZA_FOCOLARE);
});
test('un albero scalda sei volte tanto in legna che in rami',()=>{
  // Non è una ripetizione del collaudo qui sopra: quello prova il cambio,
  // questo prova che il cambio non rende i due materiali la stessa cosa. Un
  // albero rende tre legna e un ramo solo — tre tacche contro mezza — e il
  // giorno che qualcuno tocca la resa dell'albero o il cambio, il ramo può
  // diventare combustibile migliore della legna senza che nessuno se ne
  // accorga giocando.
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FOCOLARE_SPENTO});
  const resa=RACCOLTA[OGGETTO.ALBERO].resa;
  const perAlbero=c=>resa.find(v=>v.cosa===c)?.quante ?? 0;
  // Il costo di una tacca si chiede al gioco invece di leggerlo da una
  // costante: quello che conta è quanto ne toglie davvero il gesto.
  const perTacca=c=>{inventario.svuota();inventario.aggiungi(c,9);return azioni.azionePossibile(eroe,c,0).quante;};
  const tacche=c=>perAlbero(c)/perTacca(c);
  assert.equal(tacche('legna')/tacche('ramo'),6);
});
test('guardare il focolare dice quanto è carico, e non cambia niente',()=>{
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FOCOLARE_SPENTO});
  let esito=azioni.agisci(eroe,null,0);
  assert.equal(esito.tipo,'guardato');assert.equal(esito.legna,0);
  assert.equal(esito.massimo,CAPIENZA_FOCOLARE);
  focolare(2);
  esito=azioni.agisci(eroe,null,0);
  assert.equal(esito.legna,2);
  vicino(bisogni.livello('stanchezza'),1);
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FOCOLARE_ACCESO);
  assert.equal(decadimento.legnaNel(tx+1,ty),2);
});
test('una legna al giorno, due d’inverno, e poi resta la pietra',()=>{
  const legna=()=>decadimento.legnaNel(tx+1,ty);
  focolare();
  // Giorni 1-4: estate. Una al giorno, e il pieno dura quattro albe.
  for(const [giorno,resta] of [[2,3],[3,2],[4,1]]) {
    tempo.impostaGiorno(giorno);decadimento.nuovoGiorno();
    assert.equal(legna(),resta,`giorno ${giorno}`);
    assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FOCOLARE_ACCESO);
  }
  tempo.impostaGiorno(5);decadimento.nuovoGiorno();
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FOCOLARE_SPENTO);
  assert.equal(legna(),0);
  // Giorni 9-12: inverno. Due al giorno, cioè mezza stagione di autonomia.
  reset();focolare();tempo.impostaGiorno(9);
  tempo.impostaGiorno(10);decadimento.nuovoGiorno();assert.equal(legna(),2);
  tempo.impostaGiorno(11);decadimento.nuovoGiorno();
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FOCOLARE_SPENTO);
});
test('un focolare acceso di una partita vecchia vale pieno, non spento',()=>{
  // Senza il conto della legna: è il salvataggio scritto quando il focolare si
  // misurava a giorni, e spegnerlo subito sarebbe punirlo per un cambiamento
  // del gioco.
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FOCOLARE_ACCESO,posata:1});
  assert.equal(decadimento.legnaNel(tx+1,ty),CAPIENZA_FOCOLARE);
  tempo.impostaGiorno(2);decadimento.nuovoGiorno();
  assert.equal(decadimento.legnaNel(tx+1,ty),CAPIENZA_FOCOLARE-1);
});
test('il focolare carico non si smonta: prima deve finire la legna',()=>{
  focolare(1);
  const impedito=azioni.smontaggioPossibile(eroe).impedito;
  assert.match(impedito,/acceso: 1\/4/);
  assert.equal(azioni.smontaDavanti(eroe).tipo,'impedito');
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FOCOLARE_ACCESO);
  assert.equal(inventario.quante('focolare'),0);
  // Finita la legna la pietra torna in mano, tutta: le dieci pietre sono un
  // investimento e non un affitto.
  tempo.impostaGiorno(2);decadimento.nuovoGiorno();
  assert.equal(azioni.smontaggioPossibile(eroe).impedito,null);
  assert.equal(azioni.smontaDavanti(eroe).tipo,'smontato');
  assert.equal(inventario.quante('focolare'),1);
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.NESSUNO);
});
test('la X smonta in un gesto tutto quello che hai costruito',()=>{
  const roba=[
    [OGGETTO.PORTA,'porta'],[OGGETTO.PORTA_APERTA,'porta'],
    [OGGETTO.GIACIGLIO,'giaciglio'],[OGGETTO.GIACIGLIO_PELLI,'giaciglio_pelli'],
    [OGGETTO.BANCO,'banco'],[OGGETTO.CASSA,'cassa'],[OGGETTO.FOCOLARE_SPENTO,'focolare'],
  ];
  for(const [oggetto,cosa] of roba) {
    reset();modifiche.imposta(tx+1,ty,{oggetto});
    assert.equal(azioni.smontaggioPossibile(eroe).cosa,cosa,cosa);
    const esito=azioni.smontaDavanti(eroe);
    assert.equal(esito.tipo,'smontato',cosa);
    assert.equal(inventario.quante(cosa),1,cosa);
    assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.NESSUNO,cosa);
    assert.ok(bisogni.livello('stanchezza')<1,cosa);
  }
  // E quello che è del mondo no: il muro si abbatte, non si smonta.
  reset();modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.MURO});
  assert.equal(azioni.smontaggioPossibile(eroe),null);
  assert.equal(azioni.azionePossibile(eroe,null,0).verbo,'Abbatti');
});
test('la barra non smonta più: banco e focolare non sono roba da colpire',()=>{
  for(const oggetto of [OGGETTO.BANCO,OGGETTO.FOCOLARE_SPENTO,OGGETTO.FOCOLARE_ACCESO]) {
    reset();modifiche.imposta(tx+1,ty,{oggetto,legna:1});
    const azione=azioni.azionePossibile(eroe,null,0);
    assert.notEqual(azione?.tipo,'raccogli',String(oggetto));
    for(let i=0;i<5;i++) azioni.agisci(eroe,null,0);
    assert.equal(mappa.oggettoDi(tx+1,ty),oggetto,String(oggetto));
    assert.equal(inventario.quante('banco')+inventario.quante('focolare'),0);
  }
});
test('la cassa piena non si smonta nemmeno con la X',()=>{
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.CASSA,contenuto:[{cosa:'legna',quantita:1}]});
  assert.equal(azioni.smontaggioPossibile(eroe).impedito,'prima svuotala');
  assert.equal(azioni.smontaDavanti(eroe).messaggio,'prima svuotala');
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.CASSA);
});
test('un salvataggio con un focolare carico si rilegge con la sua legna',()=>{
  focolare(3);
  const stato=salvataggio.istantanea(eroe,0);
  assert.equal(salvataggio.valido(stato),true);
  reset();assert.ok(salvataggio.applica(stato));
  assert.equal(decadimento.legnaNel(tx+1,ty),3);
  // Fuori scala si rifiuta prima di toccare la partita: zero non è un fuoco.
  for(const legna of [0,CAPIENZA_FOCOLARE+1,1.5]) {
    const storto=JSON.parse(JSON.stringify(stato));
    storto.modifiche.find(m=>m.oggetto===OGGETTO.FOCOLARE_ACCESO).legna=legna;
    assert.equal(salvataggio.valido(storto),false,String(legna));
  }
});
test('la pioggia non spegne il focolare: è il motivo per cui sta al chiuso',()=>{
  const giorno=maltempo('pioggia');
  focolare(giorno);
  meteo.aggiornaMondo();
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FOCOLARE_ACCESO);
});

// --- M7.14.2: anche il falò si accende --------------------------------------

test('il falò si posa spento e si accende a legna, e ne tiene due',()=>{
  inventario.aggiungi('falo',1);inventario.aggiungi('legna',5);
  assert.equal(azioni.agisci(eroe,'falo',0).tipo,'posa');
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FALO_SPENTO);
  assert.equal(decadimento.legnaNel(tx+1,ty),0);
  assert.equal(freddo.fuocoPerRiposo(pos(tx+1,ty+1)),false);
  // La prima legna accende, la seconda riempie, la terza non entra.
  assert.equal(azioni.agisci(eroe,'legna',1).legna,1);
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FALO_ACCESO);
  assert.equal(azioni.agisci(eroe,'legna',1).legna,CAPIENZA_FALO);
  assert.equal(CAPIENZA_FALO,2);
  const pieno=azioni.azionePossibile(eroe,'legna',1);
  assert.equal(pieno.tipo,'guarda');
  assert.equal(azioni.agisci(eroe,'legna',1).tipo,'guardato');
  assert.equal(inventario.quante('legna'),3);
  // E scalda e cuoce come prima, perché quello lo dice il catalogo.
  assert.equal(freddo.fuocoPerRiposo(pos(tx+1,ty+1)),true);
  assert.equal(mappa.scaldaIn(tx+1,ty),true);
});
test('il falò dura due giorni, e d’inverno una notte sola',()=>{
  const acceso=()=>mappa.oggettoDi(tx+1,ty)===OGGETTO.FALO_ACCESO;
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FALO_ACCESO,legna:CAPIENZA_FALO});
  tempo.impostaGiorno(2);decadimento.nuovoGiorno();
  assert.equal(decadimento.legnaNel(tx+1,ty),1);assert.equal(acceso(),true);
  tempo.impostaGiorno(3);decadimento.nuovoGiorno();
  assert.equal(acceso(),false);
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FALO_SPENTO);
  // D'inverno ne brucia due al giorno: il pieno non arriva a domani.
  reset();modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FALO_ACCESO,legna:CAPIENZA_FALO});
  tempo.impostaGiorno(9);tempo.impostaGiorno(10);decadimento.nuovoGiorno();
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FALO_SPENTO);
});
test('il falò acceso non si raccoglie, e la barra non lo raccoglie più',()=>{
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FALO_ACCESO,legna:1});
  assert.match(azioni.smontaggioPossibile(eroe).impedito,/falò è acceso: 1\/2/);
  assert.equal(azioni.smontaDavanti(eroe).tipo,'impedito');
  assert.equal(inventario.quante('falo'),0);
  // La barra su un fuoco carica o guarda: non lo mette più in tasca.
  for(let i=0;i<4;i++) azioni.agisci(eroe,null,0);
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FALO_ACCESO);
  assert.equal(inventario.quante('falo'),0);
  // Spento invece torna in mano con la X, e torna spento.
  tempo.impostaGiorno(2);decadimento.nuovoGiorno();
  assert.equal(azioni.smontaDavanti(eroe).tipo,'smontato');
  assert.equal(inventario.quante('falo'),1);
  assert.equal(azioni.agisci(eroe,'falo',0).tipo,'posa');
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FALO_SPENTO);
});
test('la cenere di un accampamento bruciato è un falò da riaccendere',()=>{
  const r=trovaLuogo('bruciato');
  const cenere=segnoNelLuogo(r,'f');
  assert.equal(mappa.oggettoDi(cenere.tx,cenere.ty),OGGETTO.FALO_SPENTO);
  assert.equal(decadimento.legnaNel(cenere.tx,cenere.ty),0);
  const davanti={...pos(cenere.tx-1,cenere.ty),guarda:'destra'};
  inventario.aggiungi('legna',2);
  assert.equal(azioni.azionePossibile(davanti,'legna',0).tipo,'carica');
  assert.equal(azioni.agisci(davanti,'legna',0).legna,1);
  assert.equal(mappa.oggettoDi(cenere.tx,cenere.ty),OGGETTO.FALO_ACCESO);
});
test('la pioggia spegne il falò scoperto e la legna dentro se n’è andata',()=>{
  maltempo('pioggia');
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FALO_ACCESO,legna:CAPIENZA_FALO});
  meteo.aggiornaMondo();
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FALO_SPENTO);
  assert.equal(decadimento.legnaNel(tx+1,ty),0);
  assert.equal(modifiche.di(tx+1,ty).legna,undefined,'niente conti vecchi sul tassello');
});
test('un salvataggio non può dichiarare in un falò più legna di quanta ce ne stia',()=>{
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FALO_ACCESO,legna:CAPIENZA_FALO});
  const stato=salvataggio.istantanea(eroe,0);
  assert.equal(salvataggio.valido(stato),true);
  const storto=JSON.parse(JSON.stringify(stato));
  storto.modifiche.find(m=>m.oggetto===OGGETTO.FALO_ACCESO).legna=CAPIENZA_FOCOLARE;
  assert.equal(salvataggio.valido(storto),false,'quattro legna stanno nel focolare, non nel falò');
  // E la legna non sta sui tasselli che non sono fuochi accesi.
  const altrove=JSON.parse(JSON.stringify(stato));
  altrove.modifiche.find(m=>m.oggetto===OGGETTO.FALO_ACCESO).oggetto=OGGETTO.FALO_SPENTO;
  assert.equal(salvataggio.valido(altrove),false);
});
test('accendere un falò addosso non ci chiude dentro il fuoco',()=>{
  // La fossa fredda non ferma i piedi, il fuoco acceso sì: chi gli sta
  // appiccicato e lo accende si troverebbe dentro un tassello solido.
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FALO_SPENTO});
  assert.equal(mappa.solidoIn(tx+1,ty),false);
  eroe.px=(tx+1)*16-1;
  assert.equal(urti.liberoIn(eroe.px,eroe.py),true,'prima è libero');
  inventario.aggiungi('legna',1);
  assert.equal(azioni.agisci(eroe,'legna',0).tipo,'carica');
  assert.equal(mappa.solidoIn(tx+1,ty),true);
  assert.equal(urti.liberoIn(eroe.px,eroe.py),true,'e dopo non si sta dentro il fuoco');
});

// --- M7.15: l'essiccatoio --------------------------------------------------

function essiccatoio(oggetto=OGGETTO.ESSICCATOIO, extra={}) {
  modifiche.imposta(tx+1,ty,{oggetto,...extra});
  return {tx:tx+1,ty};
}
test('l’essiccatoio vuole aria: dentro una stanza non si posa',()=>{
  inventario.aggiungi('essiccatoio',1);stanza();
  assert.match(azioni.azionePossibile(eroe,'essiccatoio',0).impedito,/aria/);
  assert.equal(azioni.agisci(eroe,'essiccatoio',0),null);
  assert.equal(inventario.quante('essiccatoio'),1);
  reset();inventario.aggiungi('essiccatoio',1);
  assert.equal(azioni.agisci(eroe,'essiccatoio',0).tipo,'posa');
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.ESSICCATOIO);
});
test('si stende a multipli di tre, mai quattro né cinque',()=>{
  assert.deepEqual([0,1,2,3,4,5,6,7,9,20].map(azioni.quanteSiStendono),
    [0,0,0,3,3,3,6,6,6,6]);
  essiccatoio();inventario.aggiungi('carne_cruda',2);
  assert.match(azioni.azionePossibile(eroe,'carne_cruda',0).impedito,/almeno 3/);
  assert.equal(azioni.agisci(eroe,'carne_cruda',0),null);
  assert.equal(inventario.quante('carne_cruda'),2);
  inventario.aggiungi('carne_cruda',3);
  assert.equal(azioni.agisci(eroe,'carne_cruda',0).quante,3);
  assert.equal(inventario.quante('carne_cruda'),2);
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.ESSICCATOIO_CARICO);
  assert.equal(modifiche.di(tx+1,ty).quante,3);
});
test('la carne secca vuole tre albe asciutte: due non bastano',()=>{
  // L'estate è arida per tutti e quattro i giorni, quindi qui non piove mai.
  tempo.impostaGiorno(1);essiccatoio(OGGETTO.ESSICCATOIO_CARICO,{dal:1,quante:6});
  tempo.impostaGiorno(3);decadimento.nuovoGiorno();
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.ESSICCATOIO_CARICO);
  tempo.impostaGiorno(4);decadimento.nuovoGiorno();
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.ESSICCATOIO_PRONTO);
  assert.equal(modifiche.di(tx+1,ty).quante,6);
});
test('la pioggia ferma il conto senza rovinare la carne',()=>{
  const pioggia=maltempo('pioggia');
  // Si stende il giorno prima dell'acquazzone: quel giorno non conta, quindi
  // ce ne vogliono quattro invece di tre.
  const dal=pioggia-1;
  assert.equal(decadimento.giorniAsciutti(dal,dal+3),2,'il giorno di pioggia non conta');
  assert.equal(decadimento.giorniAsciutti(dal,dal+4),3);
  essiccatoio(OGGETTO.ESSICCATOIO_CARICO,{dal,quante:3});
  tempo.impostaGiorno(dal+3);decadimento.nuovoGiorno();
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.ESSICCATOIO_CARICO,'la carne è ancora lì');
  tempo.impostaGiorno(dal+4);decadimento.nuovoGiorno();
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.ESSICCATOIO_PRONTO);
});
test('ritirare dà una carne secca ogni tre, e lascia il telaio vuoto',()=>{
  essiccatoio(OGGETTO.ESSICCATOIO_PRONTO,{quante:6});
  assert.equal(azioni.azionePossibile(eroe,null,0).verbo,'Ritira');
  assert.equal(azioni.agisci(eroe,null,0).secche,2);
  assert.equal(inventario.quante('carne_secca'),2);
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.ESSICCATOIO);
});
test('con la carne dentro, la X non porta via l’essiccatoio',()=>{
  for(const stato of [OGGETTO.ESSICCATOIO_CARICO,OGGETTO.ESSICCATOIO_PRONTO]) {
    reset();essiccatoio(stato,{dal:1,quante:6});
    assert.match(azioni.smontaggioPossibile(eroe).impedito,/prima ritira la carne/);
    assert.equal(azioni.smontaDavanti(eroe).tipo,'impedito');
    assert.equal(mappa.oggettoDi(tx+1,ty),stato);
    assert.equal(inventario.quante('essiccatoio'),0);
  }
  // Da vuoto torna in mano intero, con lo stesso gesto di tutto il resto.
  reset();essiccatoio();
  assert.equal(azioni.smontaggioPossibile(eroe).impedito,null);
  assert.equal(azioni.smontaDavanti(eroe).tipo,'smontato');
  assert.equal(inventario.quante('essiccatoio'),1);
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.NESSUNO);
});
test('la carne secca dura dodici giorni, trentasei in cassa',()=>{
  tempo.impostaGiorno(1);inventario.aggiungi('carne_secca',1,1);
  tempo.impostaGiorno(12);decadimento.nuovoGiorno();
  assert.equal(inventario.quante('carne_secca'),1);
  tempo.impostaGiorno(13);decadimento.nuovoGiorno();
  assert.equal(inventario.quante('carne_secca'),0);
  assert.equal(decadimento.vitaDi('carne_secca',true),36);
});
test('un carico fuori scala rende il salvataggio non valido',()=>{
  const stato=salvataggio.istantanea(eroe,0);
  stato.modifiche=[{tx:tx+1,ty,oggetto:OGGETTO.ESSICCATOIO_CARICO,dal:1,quante:6}];
  assert.ok(salvataggio.valido(stato),'sei carni sono il carico massimo');
  for(const storto of [7,0,-1,2.5,'tre',undefined]) {
    stato.modifiche=[{tx:tx+1,ty,oggetto:OGGETTO.ESSICCATOIO_CARICO,dal:1,quante:storto}];
    assert.equal(salvataggio.valido(stato),false,String(storto));
  }
});

import * as riposo from "../regole/riposo.js";
import { createHash } from 'node:crypto';
import { LUOGHI, ORTO_DELLA_FATTORIA } from '../arte/luoghi.js';
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
import * as polli from '../regole/polli.js';
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
import * as campana from '../regole/campana.js';
import * as chiasso from '../regole/chiasso.js';
import * as infettoEntita from '../entita/infetto.js';
import * as mappa from '../mondo/mappa.js';
import * as modifiche from '../mondo/modifiche.js';
import * as salvataggio from '../regole/salvataggio.js';
import * as esplorato from '../regole/esplorato.js';
import * as comandi from '../motore/comandi.js';
import * as riparo from '../regole/riparo.js';
import * as freddo from '../regole/freddo.js';
import * as fiamma from '../regole/fiamma.js';
import * as addosso from '../regole/addosso.js';
import * as fauna from '../regole/fauna.js';
import * as arteFauna from '../arte/sprite-fauna.js';
import * as infetti from '../regole/infetti.js';
import * as entita from '../entita/entita.js';
import * as decadimento from '../regole/decadimento.js';
import * as stagioni from '../regole/stagioni.js';
import * as orto from '../regole/orto.js';
import * as colture from '../regole/colture.js';
import * as ortoArte from '../arte/sprite-orto.js';
import * as arteCose from '../arte/sprite-cose.js';
import { OGGETTO, TERRENO } from '../mondo/generazione.js';
import * as generazione from '../mondo/generazione.js';
import * as arteOggetti from '../arte/sprite-oggetti.js';
import { FATTORIA } from '../arte/piante.js';
import { CATALOGO, RACCOLTA } from '../regole/oggetti.js';
import { vistaLibera, fattoreSuono } from '../mondo/ostacoli.js';
import * as sprite from '../arte/sprite-cose.js';
import { TAVOLOZZA, TAVOLOZZA_INFETTO } from '../arte/tavolozza.js';

let tx, ty, eroe;
function reset() {
  fiamma.reimposta();
  addosso.reimposta();
  fauna.reimposta();
  polli.reimposta();
  meteo.reimposta();
  pesca.interrompi(); mappa.impostaGelo(false); orto.impostaBestie(false); orto.impostaParassiti(false);
  riparo.reimposta(); tempo.reimposta(); bisogni.reimposta(); salute.reimposta();
  inventario.svuota(); modifiche.svuota(); entita.svuota(); simulazione.resoconto(); esplorato.svuota(); ricette.reimposta(); campana.reimposta(); chiasso.reimposta();
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
      // 's' da M7.18.30: le piante inselvatichite dell'orto abbandonato; 'p'
      // da M7.18.31, il suo spaventapasseri rotto.
      // 'u' da M7.18.32: la seconda fila dell'orto.
      assert.ok(' .cvotgaf%spu'.includes(l.pianta[y][x]));
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
  // Da M7.17 i luoghi di chi viaggiava hanno i fagioli, e l'orto i semi
  // della rapa e del cavolo e qualche patata.
  const ammessi={carro:['fibra','legna','fagioli','benda'],pozzo:['secchio','fibra','pietra'],bruciato:['fibra','benda','fagioli','conserva'],boscaioli:['legna','ramo','ascia'],orto:['semi','semi_cavolo','patata','grano','fibra','zappa']};
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
  inventario.aggiungi('filo',5);assert.equal(ricette.fai(benda).fatto,true);vicino(bisogni.livello('stanchezza'),0.98);
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
  // Il germoglio, da M7.16: è tornato nella fila, quindi il seme passa di lì.
  assert.equal(modifiche.di(tx,ty).oggetto,OGGETTO.GERMOGLIO);
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
  tempo.impostaGiorno(3);inventario.ripristina([{cosa:'bacche',quantita:12,dal:1},{cosa:'filo',quantita:3},...Array.from({length:6},()=>({cosa:'ascia',quantita:1}))]);
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
test('muri e porta delimitano la stanza, ma senza fuoco resta fredda',()=>{
  stanza();tempo.impostaGiorno(9);tempo.impostaOra(22);
  assert.equal(chiuso(),true);assert.equal(freddo.alFreddo(eroe),true);
  // Aperta, la porta resta una parete: una casa con la porta aperta è ancora
  // una casa. Il muro crollato invece la apre.
  modifiche.imposta(tx+2,ty,{oggetto:OGGETTO.PORTA_APERTA});assert.equal(chiuso(),true);
  modifiche.imposta(tx-2,ty,{oggetto:OGGETTO.MURO_ROTTO});assert.equal(chiuso(),false);
});
// Una stanza di sette tasselli per cinque, con la porta chiusa a est.
function stanzaGrande() {
  for(let y=ty-3;y<=ty+3;y++)for(let x=tx-4;x<=tx+4;x++)
    modifiche.imposta(x,y,{oggetto:Math.abs(x-tx)===4||Math.abs(y-ty)===3?OGGETTO.MURO:OGGETTO.NESSUNO});
  modifiche.imposta(tx+4,ty,{oggetto:OGGETTO.PORTA});
}
test('il focolare riscalda tutta la stanza, anche a porta aperta, finché i muri reggono',()=>{
  stanzaGrande();
  modifiche.imposta(tx-2,ty,{oggetto:OGGETTO.FOCOLARE_ACCESO});
  eroe={...eroe,...pos(tx+2,ty)};tempo.impostaGiorno(9);tempo.impostaOra(22);
  assert.equal(freddo.alFreddo(eroe),false);
  modifiche.imposta(tx+4,ty,{oggetto:OGGETTO.PORTA_APERTA});assert.equal(freddo.alFreddo(eroe),false);
  modifiche.imposta(tx,ty-3,{oggetto:OGGETTO.MURO_ROTTO});assert.equal(freddo.alFreddo(eroe),true);
});
test('il falò in casa scalda tre tasselli come fuori, non la stanza',()=>{
  stanzaGrande();
  modifiche.imposta(tx-2,ty,{oggetto:OGGETTO.FALO_ACCESO});
  tempo.impostaGiorno(9);tempo.impostaOra(22);
  eroe={...eroe,...pos(tx+2,ty)};assert.equal(freddo.alFreddo(eroe),true);
  eroe={...eroe,...pos(tx+1,ty)};assert.equal(freddo.alFreddo(eroe),false);
  // E ci si asciuga allo stesso modo: a quattro tasselli come in una stanza
  // senza fuoco, un quarantesimo al secondo; col focolare un decimo.
  eroe={...eroe,...pos(tx+2,ty)};
  meteo.ripristina(1);meteo.avanza(4,eroe);vicino(meteo.livelloBagnato(),0.9);
  modifiche.imposta(tx-2,ty,{oggetto:OGGETTO.FOCOLARE_ACCESO});
  meteo.ripristina(1);meteo.avanza(4,eroe);vicino(meteo.livelloBagnato(),0.6);
});
test('rompere il muro invalida immediatamente il riparo',()=>{
  stanza();assert.equal(chiuso(),true);
  modifiche.imposta(tx-2,ty,{oggetto:OGGETTO.MURO_ROTTO});assert.equal(chiuso(),false);
});
// Un tassello su cui la generazione mette questo oggetto, strappato, con
// attorno un campo zappato più largo di una stanza: non ricresce e non chiude,
// così a decidere se è chiuso è solo quello che il collaudo ci posa attorno.
function strappato(tipo) {
  for(let r=0;r<400;r++)for(let y=ty-r;y<=ty+r;y++)for(let x=tx-r;x<=tx+r;x++){
    if(Math.max(Math.abs(x-tx),Math.abs(y-ty))!==r||mappa.oggettoGenerato(x,y)!==tipo)continue;
    for(let yy=y-8;yy<=y+8;yy++)for(let xx=x-8;xx<=x+8;xx++)modifiche.imposta(xx,yy,{oggetto:OGGETTO.TERRA_ZAPPATA});
    modifiche.imposta(x,y,{oggetto:OGGETTO.NESSUNO});
    return {tx:x,ty:y};
  }
  assert.fail('niente di generato: '+tipo);
}
// Il primo giorno di questa stagione, da questo giorno in poi.
function primoDi(stagione,da) {
  for(let g=da;;g++)if(stagioni.stagioneDi(g)===stagione&&stagioni.giornoNellaStagione(g)===1)return g;
}
const STAGIONE_DI={[OGGETTO.CESPUGLIO]:'primavera',[OGGETTO.ALBERO]:'estate'};
test('i cespugli tornano il primo giorno di primavera, gli alberi il primo d’estate: una volta l’anno',()=>{
  const albero=strappato(OGGETTO.ALBERO),cespuglio=strappato(OGGETTO.CESPUGLIO);
  // Il campo del cespuglio può aver coperto l'albero.
  modifiche.imposta(albero.tx,albero.ty,{oggetto:OGGETTO.NESSUNO});
  const tornato={albero:[],cespuglio:[]};
  for(let g=2;g<=40;g++) {
    tempo.impostaGiorno(g);ricrescita.nuovoGiorno();
    for(const [nome,p,tipo] of [['albero',albero,OGGETTO.ALBERO],['cespuglio',cespuglio,OGGETTO.CESPUGLIO]]) {
      if(mappa.oggettoDi(p.tx,p.ty)!==tipo)continue;
      tornato[nome].push(g);
      // Ripreso la mattina stessa in cui è tornato: aspetta l'anno dopo.
      modifiche.imposta(p.tx,p.ty,{oggetto:OGGETTO.NESSUNO});
    }
  }
  assert.equal(stagioni.stagioneDi(13),'primavera');assert.equal(stagioni.stagioneDi(17),'estate');
  assert.deepEqual(tornato.cespuglio,[13,29]);
  assert.deepEqual(tornato.albero,[17,33]);
});
test('un salvataggio di prima con la data del raccolto torna lo stesso nel suo giorno',()=>{
  const p=strappato(OGGETTO.CESPUGLIO);
  modifiche.imposta(p.tx,p.ty,{oggetto:OGGETTO.NESSUNO,svuotata:12});
  tempo.impostaGiorno(13);ricrescita.nuovoGiorno();
  assert.equal(mappa.oggettoDi(p.tx,p.ty),OGGETTO.CESPUGLIO);
});
test('alberi e cespugli non ricrescono in un posto chiuso, nemmeno a porta aperta',()=>{
  for(const tipo of [OGGETTO.ALBERO,OGGETTO.CESPUGLIO]) {
    reset();
    const p=strappato(tipo);
    for(let y=p.ty-2;y<=p.ty+2;y++)for(let x=p.tx-2;x<=p.tx+2;x++)
      if(Math.abs(x-p.tx)===2||Math.abs(y-p.ty)===2)modifiche.imposta(x,y,{oggetto:OGGETTO.MURO});
    modifiche.imposta(p.tx+2,p.ty,{oggetto:OGGETTO.PORTA_APERTA});
    const giorno=primoDi(STAGIONE_DI[tipo],20);
    tempo.impostaGiorno(giorno);ricrescita.nuovoGiorno();
    assert.equal(mappa.oggettoDi(p.tx,p.ty),OGGETTO.NESSUNO);
    // Crollato un muro la stanza è aperta, ma non torna fuori stagione:
    // aspetta il suo giorno.
    modifiche.imposta(p.tx-2,p.ty,{oggetto:OGGETTO.MURO_ROTTO});
    tempo.impostaGiorno(giorno+1);ricrescita.nuovoGiorno();
    assert.equal(mappa.oggettoDi(p.tx,p.ty),OGGETTO.NESSUNO);
    tempo.impostaGiorno(giorno+16);ricrescita.nuovoGiorno();
    assert.equal(mappa.oggettoDi(p.tx,p.ty),tipo);
  }
});
test('una radura chiusa da alberi, sassi e mobili ricresce: la chiude solo un muro',()=>{
  const p=strappato(OGGETTO.ALBERO);
  modifiche.imposta(p.tx-1,p.ty,{oggetto:OGGETTO.ALBERO});
  modifiche.imposta(p.tx+1,p.ty,{oggetto:OGGETTO.ALBERO});
  modifiche.imposta(p.tx,p.ty-1,{oggetto:OGGETTO.SASSO});
  modifiche.imposta(p.tx,p.ty+1,{oggetto:OGGETTO.MURO});
  tempo.impostaGiorno(primoDi('estate',20));
  ricrescita.nuovoGiorno();
  assert.equal(mappa.oggettoDi(p.tx,p.ty),OGGETTO.NESSUNO);
  // Con una cassa al posto del muro per il freddo resta una stanza, come un
  // buco nella roccia; ma è ancora bosco, e il bosco si riprende l'albero.
  modifiche.imposta(p.tx,p.ty+1,{oggetto:OGGETTO.CASSA});
  assert.notEqual(riparo.stanzaDi(p.tx,p.ty),null);
  ricrescita.nuovoGiorno();
  assert.equal(mappa.oggettoDi(p.tx,p.ty),OGGETTO.ALBERO);
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
test('canna costruibile senza banco con rami e filo, e la fibra non fa lenza',()=>{
  const canna=ricette.RICETTE.find(r=>r.id==='canna');
  inventario.aggiungi('ramo',3);inventario.aggiungi('fibra',4);
  assert.equal(ricette.fai(canna).perche,'materiali');
  inventario.aggiungi('filo',4);
  assert.equal(ricette.fai(canna).fatto,true);
  assert.equal(inventario.quante('canna'),1);assert.equal(inventario.quante('filo'),0);assert.equal(inventario.quante('fibra'),4);
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
test('il maltempo è un tiro al 25% per giorno; mai pioggia estiva; previsioni stabili per seme',()=>{
  // Da M7.18.58 non c'è più un giorno di maltempo per stagione: ogni giorno
  // d'autunno e di primavera piove una volta su quattro, ogni giorno
  // d'inverno nevica una volta su quattro. Misurato su tre semi e cinquanta
  // anni.
  assert.equal(meteo.PROBABILITA_MALTEMPO,0.25);
  const conto={pioggia:[0,0],neve:[0,0]};let asciutte=0,stagioni_=0,difila=0;
  for(const seme of ['review','altra valle','neve']) {
    mappa.inizializza(seme);
    for(let anno=0;anno<50;anno++)for(let stagione=0;stagione<4;stagione++) {
      const giorni=Array.from({length:4},(_,i)=>meteo.evento(anno*16+stagione*4+i+1));
      // Da M7.18.42 un giorno d'estate, dal secondo al quarto, è la canicola.
      if(stagione===0){
        assert.equal(giorni[0],'arido');assert.equal(giorni.filter(e=>e==='canicola').length,1);
        assert.ok(giorni.every(e=>e==='arido'||e==='canicola'));
        continue;
      }
      const tipo=stagione===2?'neve':'pioggia';
      assert.ok(giorni.every(e=>e===tipo||e==='sereno'),'d’inverno solo neve, fuori solo pioggia');
      conto[tipo][0]+=giorni.filter(e=>e===tipo).length;conto[tipo][1]+=4;
      stagioni_++;if(!giorni.includes(tipo))asciutte++;
      for(let i=1;i<4;i++)if(giorni[i]===tipo&&giorni[i-1]===tipo)difila++;
    }
  }
  for(const [tipo,[n,tot]] of Object.entries(conto))assert.ok(n/tot>0.21&&n/tot<0.29,`${tipo} ${(100*n/tot).toFixed(1)}%`);
  // Stagioni senza maltempo (attese il 32%) e giorni di maltempo di fila.
  assert.ok(asciutte/stagioni_>0.24&&asciutte/stagioni_<0.4,`asciutte ${asciutte}/${stagioni_}`);
  assert.ok(difila>20,'di fila: '+difila);
  for(const seme of ['review','altra valle','neve']) {
    mappa.inizializza(seme);
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
  // A porta aperta l'orto fra le mura resta asciutto; col muro crollato no.
  modifiche.imposta(tx+2,ty,{oggetto:OGGETTO.PORTA_APERTA});
  assert.equal(meteo.aggiornaMondo().innaffiate,0);assert.equal(modifiche.di(tx,ty).bagnato,undefined);
  modifiche.imposta(tx-2,ty,{oggetto:OGGETTO.MURO_ROTTO});
  assert.equal(meteo.aggiornaMondo().innaffiate,1);assert.equal(modifiche.di(tx,ty).bagnato,true);
});
test('pioggia spegne solo i falò scoperti; la porta aperta no, il muro crollato espone quello dentro',()=>{
  stanza();maltempo('pioggia');
  modifiche.imposta(tx-1,ty,{oggetto:OGGETTO.FALO_ACCESO,posata:tempo.giornoCorrente()});
  modifiche.imposta(tx+4,ty,{oggetto:OGGETTO.FALO_ACCESO,posata:tempo.giornoCorrente()});
  assert.equal(meteo.aggiornaMondo().spenti,1);
  assert.equal(mappa.oggettoDi(tx-1,ty),OGGETTO.FALO_ACCESO);
  modifiche.imposta(tx+2,ty,{oggetto:OGGETTO.PORTA_APERTA});
  assert.equal(meteo.aggiornaMondo().spenti,0);assert.equal(mappa.oggettoDi(tx-1,ty),OGGETTO.FALO_ACCESO);
  // In alto e non accanto al falò: un buco che dà sul fuoco lo chiude il fuoco.
  modifiche.imposta(tx,ty-2,{oggetto:OGGETTO.MURO_ROTTO});
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
test('il resoconto dice perché si è spento il fuoco: legna, pioggia o torcia',()=>{
  // Tutte e tre nella mezzanotte in cui comincia a piovere, ed è il caso che
  // le confondeva: il focolare in casa finisce la legna, il falò fuori lo
  // spegne l'acqua, la torcia piantata ieri si consuma.
  const giorno=maltempo('pioggia');
  stanza();modifiche.imposta(tx-1,ty,{oggetto:OGGETTO.FOCOLARE_ACCESO,legna:1});
  modifiche.imposta(tx+4,ty,{oggetto:OGGETTO.FALO_ACCESO,legna:2});
  modifiche.imposta(tx,ty+4,{oggetto:OGGETTO.TORCIA_PIANTATA,posata:giorno-1});
  tempo.impostaGiorno(giorno-1);tempo.impostaOra(23.9);simulazione.resoconto();
  simulazione.avanza(5);
  const r=simulazione.resoconto();
  assert.equal(tempo.giornoCorrente(),giorno);
  assert.equal(mappa.oggettoDi(tx-1,ty),OGGETTO.FOCOLARE_SPENTO);
  assert.equal(mappa.oggettoDi(tx+4,ty),OGGETTO.FALO_SPENTO);
  assert.equal(mappa.oggettoDi(tx,ty+4),OGGETTO.NESSUNO);
  assert.deepEqual([r.spentiLegna,r.spentiPioggia,r.torceFinite],[1,1,1]);
});
test('sotto la pioggia al chiuso si caricano anche il focolare e il falò acceso, all’aperto no',()=>{
  // Il focolare e il falò acceso sono solidi: la stanza va chiesta a chi gli
  // sta attorno, non al loro tassello. Prima il focolare non si caricava
  // sotto la pioggia neanche in casa, e restava senza legna a mezzanotte.
  maltempo('pioggia');inventario.aggiungi('legna',10);
  for(const [oggetto,legna] of [[OGGETTO.FOCOLARE_SPENTO],[OGGETTO.FOCOLARE_ACCESO,1],[OGGETTO.FALO_ACCESO,1],[OGGETTO.FALO_SPENTO]]) {
    stanza();modifiche.imposta(tx+1,ty,legna?{oggetto,legna}:{oggetto});
    const dentro=azioni.azionePossibile(eroe,'legna',0);
    assert.equal(dentro.tipo,'carica',String(oggetto));assert.equal(dentro.impedito ?? null,null,String(oggetto));
    // Crollato il muro di fronte la stanza non c'è più, e il fuoco è di nuovo
    // all'aperto. Non la porta: si apre proprio sul fuoco, e uno solido il
    // varco lo chiude da sé.
    modifiche.imposta(tx-2,ty,{oggetto:OGGETTO.MURO_ROTTO});
    assert.match(azioni.azionePossibile(eroe,'legna',0).impedito,/piove/,String(oggetto));
  }
  stanza();modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FOCOLARE_SPENTO});
  assert.equal(azioni.agisci(eroe,'legna',0).tipo,'carica');
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FOCOLARE_ACCESO);
  // E la pioggia non lo spegne: sta in casa.
  meteo.aggiornaMondo();assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FOCOLARE_ACCESO);
});
test('colture seminate dopo l’inizio della pioggia ricevono acqua',()=>{
  maltempo('pioggia');meteo.aggiornaMondo();
  modifiche.imposta(tx,ty,{oggetto:OGGETTO.SEMINATO});meteo.aggiornaMondo();
  assert.equal(modifiche.di(tx,ty).bagnato,true);
});
test('la pioggia durante un’assenza fa crescere l’orto alla mezzanotte giusta',()=>{
  const giorno=maltempo('pioggia');tempo.impostaOra(23);
  modifiche.imposta(tx,ty,{oggetto:OGGETTO.SEMINATO});simulazione.avanza(13);
  assert.equal(tempo.giornoCorrente(),giorno+1);assert.equal(mappa.oggettoDi(tx,ty),OGGETTO.GERMOGLIO);
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
  // Da M7.18.55 la pioggia ha due piani di gocce inclinate, disegnate pixel
  // per pixel: 45 lontane da 3 e 40 vicine da 5. Sempre un numero fisso.
  atmosfera.disegna(p,'pioggia',1);assert.equal(n,45*3+40*5);
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
    inventario.contenuto()[0].usi=0;inventario.aggiungi('pietra',1);inventario.aggiungi(cosa==='canna'?'filo':'fibra',2);
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
  inventario.aggiungi('pelle',2);inventario.aggiungi('filo',4);inventario.aggiungi('legna',2);
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
  let celle=0,case_=0,luoghi=0,unici=0;
  for(const seme of ['valle-1','prova']) {
    mappa.inizializza(seme);
    for(let cy=-R;cy<=R;cy++)for(let cx=-R;cx<=R;cx++) {
      celle++;
      const c=mappa.rovinaNellaCella(cx,cy);
      if(!c) continue;
      c.unico ? unici++ : c.luogo ? luoghi++ : case_++;
    }
  }
  const pc=n=>100*n/celle, natura=pc(celle-case_-luoghi-unici);
  // Le rovine non si toccano: è la riga che protegge i mondi già in gioco.
  assert.ok(pc(case_)>22 && pc(case_)<27,`rovine ${pc(case_).toFixed(1)}%`);
  assert.ok(pc(luoghi)>28 && pc(luoghi)<34,`luoghi ${pc(luoghi).toFixed(1)}%`);
  // I luoghi unici (M7.18.56) si contano a parte: uno ogni sedici celle. Da
  // M7.18.57 ci sono tutti e quattro, quindi poco più di una cella su
  // diciassette.
  assert.ok(pc(unici)>4.5 && pc(unici)<7,`unici ${pc(unici).toFixed(1)}%`);
  // Le rovine e i piccoli luoghi non cambiano; la natura cala solo delle
  // celle dei luoghi unici, uno per regione: 38,5% misurato a M7.18.57.
  assert.ok(natura>37,`natura ${natura.toFixed(1)}%: la valle si sta riempiendo`);
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
  inventario.aggiungi('pelle',3);inventario.aggiungi('filo',3);
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
test('si stende tre per volta, mai quattro né cinque',()=>{
  // Tre per gesto, qualunque cosa si abbia in mano: sotto tre non si stende
  // niente, sopra tre se ne stendono comunque tre.
  assert.deepEqual([0,1,2,3,4,5,6,7,9,20].map(n=>azioni.quanteSiStendono(n)),
    [0,0,0,3,3,3,3,3,3,3]);
  // E con tre già appesi ne entrano altri tre, poi basta.
  assert.equal(azioni.quanteSiStendono(9,3),3);
  assert.equal(azioni.quanteSiStendono(9,6),0);
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
  // Un acquazzone che non abbia l'inverno nei tre giorni dopo: l'inverno ferma
  // il conto per conto suo (vedi M7.15.6), e mescolare le due regole in una
  // prova sola vorrebbe dire non provarne bene nessuna delle due.
  let pioggia=0;
  for(let d=1;d<=32 && !pioggia;d++) {
    if(meteo.evento(d)!=='pioggia') continue;
    if([1,2,3].every(i=>stagioni.stagioneDi(d+i)!=='inverno')) pioggia=d;
  }
  assert.ok(pioggia,'un acquazzone fuori dall inverno');
  tempo.impostaGiorno(pioggia);
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

// --- M7.15.1: la fibra brucia ----------------------------------------------

test('dieci fibra valgono una legna, e con nove il tasto lo dice prima',()=>{
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FOCOLARE_SPENTO});
  inventario.aggiungi('fibra',9);
  const scarsa=azioni.azionePossibile(eroe,'fibra',0);
  assert.equal(scarsa.tipo,'carica');
  assert.match(scarsa.verbo,/10 fibra/);
  assert.equal(scarsa.impedito,'servono 10 fibra');
  assert.equal(azioni.agisci(eroe,'fibra',0),null);
  assert.equal(inventario.quante('fibra'),9);
  inventario.aggiungi('fibra',11);
  const esito=azioni.agisci(eroe,'fibra',0);
  assert.equal(esito.tipo,'carica');assert.equal(esito.legna,1);
  assert.equal(inventario.quante('fibra'),10);
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FOCOLARE_ACCESO);
  // E vale anche per il falò, che è lo stesso fuoco più piccolo.
  reset();modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FALO_SPENTO});
  inventario.aggiungi('fibra',10);
  assert.equal(azioni.agisci(eroe,'fibra',0).legna,1);
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FALO_ACCESO);
  assert.equal(inventario.quante('fibra'),0);
});
test('la legna resta il combustibile migliore, qualunque cosa si aggiunga',()=>{
  // L'invariante, non i numeri: la tacca si misura in legna, quindi nessun
  // altro combustibile può costarne meno di una unità. Il giorno che qualcuno
  // ne aggiunge uno a buon mercato, il fuoco smetterebbe di chiedere legna.
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FOCOLARE_SPENTO});
  const costo=c=>{
    inventario.svuota();inventario.aggiungi(c,CATALOGO[c].pila);
    return azioni.azionePossibile(eroe,c,0)?.quante ?? null;
  };
  assert.equal(costo('legna'),1);
  for(const c of ['ramo','fibra']) assert.ok(costo(c)>costo('legna'),c);
  // E quello che non è combustibile non entra: la pietra non brucia.
  assert.equal(costo('pietra'),null);
});

// --- M7.15.2: si secca anche il pesce ---------------------------------------

test('tre pesci crudi diventano un pesce secco, con le stesse regole della carne',()=>{
  essiccatoio();inventario.aggiungi('pesce_crudo',5);
  assert.equal(azioni.azionePossibile(eroe,'pesce_crudo',0).verbo,'Stendi');
  const steso=azioni.agisci(eroe,'pesce_crudo',0);
  assert.equal(steso.quante,3);
  assert.equal(inventario.quante('pesce_crudo'),2,'i due spaiati restano in mano');
  assert.equal(modifiche.di(tx+1,ty).cosa,'pesce_crudo');
  // Tre albe asciutte, come per la carne: il telaio non sa cosa gli pende.
  tempo.impostaGiorno(4);decadimento.nuovoGiorno();
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.ESSICCATOIO_PRONTO);
  assert.equal(modifiche.di(tx+1,ty).cosa,'pesce_crudo','il pronto ricorda cosa pende');
  assert.equal(azioni.agisci(eroe,null,0).secche,1);
  assert.equal(inventario.quante('pesce_secco'),1);
  assert.equal(inventario.quante('carne_secca'),0,'un pesce non diventa carne');
});
test('il pesce secco è la carne secca del fiume, ma vale meno',()=>{
  const pesce=CATALOGO.pesce_secco, carne=CATALOGO.carne_secca;
  assert.equal(pesce.dura,carne.dura,'stessa scorta: dodici giorni');
  assert.ok(pesce.commestibile.fame<carne.commestibile.fame,'e nutre meno');
  // E seccare deve restare il baratto che è, per tutti e due: nutre meno che
  // arrostire, dura molto di più. Se quel divario si chiudesse, il fuoco
  // perderebbe il mestiere di cuocere senza che nessuno lo abbia deciso.
  for(const [arrostito,secco] of [['carne_arrostita','carne_secca'],['pesce_arrostito','pesce_secco']]) {
    assert.ok(CATALOGO[secco].commestibile.fame<CATALOGO[arrostito].commestibile.fame,`${secco} nutre meno di ${arrostito}`);
    assert.ok(CATALOGO[secco].dura>CATALOGO[arrostito].dura,`${secco} dura più di ${arrostito}`);
  }
});
test('il telaio dice cosa ci pende, e non si mischia',()=>{
  essiccatoio(OGGETTO.ESSICCATOIO_CARICO,{dal:1,quante:3,cosa:'pesce_crudo'});
  assert.match(azioni.azionePossibile(eroe,null,0).impedito,/il pesce sta ancora seccando/);
  // Con altra roba in mano non si aggiunge niente: il carico è uno solo.
  inventario.aggiungi('carne_cruda',3);
  assert.match(azioni.azionePossibile(eroe,'carne_cruda',0).impedito,/il pesce sta ancora seccando/);
  assert.equal(azioni.agisci(eroe,'carne_cruda',0),null);
  assert.equal(inventario.quante('carne_cruda'),3);
  assert.match(azioni.smontaggioPossibile(eroe).impedito,/prima ritira il pesce/);
});
test('un carico steso prima che il pesce si seccasse resta carne',()=>{
  // Nessun campo "cosa": è il telaio di una partita di M7.15.
  essiccatoio(OGGETTO.ESSICCATOIO_PRONTO,{quante:3});
  assert.equal(azioni.agisci(eroe,null,0).secche,1);
  assert.equal(inventario.quante('carne_secca'),1);
  assert.equal(inventario.quante('pesce_secco'),0);
});
test('il salvataggio rifiuta un telaio che dichiara di seccare la pietra',()=>{
  essiccatoio(OGGETTO.ESSICCATOIO_CARICO,{dal:1,quante:3,cosa:'pesce_crudo'});
  const stato=salvataggio.istantanea(eroe,0);
  assert.equal(salvataggio.valido(stato),true);
  for(const storto of ['pietra','carne_secca','',3]) {
    const rotto=JSON.parse(JSON.stringify(stato));
    rotto.modifiche.find(m=>m.oggetto===OGGETTO.ESSICCATOIO_CARICO).cosa=storto;
    assert.equal(salvataggio.valido(rotto),false,String(storto));
  }
  // E il carico che si rilegge è ancora pesce.
  reset();assert.ok(salvataggio.applica(stato));
  assert.equal(modifiche.di(tx+1,ty).cosa,'pesce_crudo');
});
test('una razione sola non si dice al plurale',()=>{
  // "Ritirati: 1 pesci secchi" è quello che diceva il gioco, e lo diceva anche
  // per la carne da M7.15. Il conto e la parola vengono dallo stesso posto.
  assert.equal(azioni.detteCosi('pesce_crudo',1),'1 pesce secco');
  assert.equal(azioni.detteCosi('pesce_crudo',2),'2 pesci secchi');
  assert.equal(azioni.detteCosi('carne_cruda',1),'1 carne secca');
  assert.equal(azioni.detteCosi('carne_cruda',2),'2 carni secche');
  essiccatoio(OGGETTO.ESSICCATOIO_PRONTO,{quante:3,cosa:'pesce_crudo'});
  assert.equal(azioni.agisci(eroe,null,0).dette,'1 pesce secco');
});

// --- M7.15.3: il telaio mostra quello che ha, e si carica a file ------------

test('sei pezzi in mano vogliono due gesti, e rabboccare fa ripartire il conto',()=>{
  tempo.impostaGiorno(1);
  essiccatoio();inventario.aggiungi('carne_cruda',6);
  // Lo stesso giorno il conto riparte da dov'era: riempire con due pressioni
  // di seguito non costa niente, e il tasto non promette un costo che non c'è.
  assert.equal(azioni.azionePossibile(eroe,'carne_cruda',0).verbo,'Stendi');
  assert.equal(azioni.agisci(eroe,'carne_cruda',0).quante,3);
  assert.equal(inventario.quante('carne_cruda'),3,'la prima fila ne prende tre');
  assert.equal(modifiche.di(tx+1,ty).quante,3);
  // Domani invece costa, e lo dice prima di prendere la carne.
  tempo.impostaGiorno(2);
  const azione=azioni.azionePossibile(eroe,'carne_cruda',0);
  assert.equal(azione.verbo,'Stendi (riparte il conto)');
  assert.equal(azione.riparte,true);
  const secondo=azioni.agisci(eroe,'carne_cruda',0);
  assert.equal(secondo.quante,3);assert.equal(secondo.appesi,6);
  assert.equal(inventario.quante('carne_cruda'),0);
  assert.equal(modifiche.di(tx+1,ty).quante,6);
  assert.equal(modifiche.di(tx+1,ty).dal,2,'il conto riparte da oggi, per tutto quello che pende');
  // Pieno: il terzo gesto non entra.
  inventario.aggiungi('carne_cruda',3);
  assert.notEqual(azioni.azionePossibile(eroe,'carne_cruda',0)?.tipo,'stendi');
  assert.equal(azioni.agisci(eroe,'carne_cruda',0),null);
  assert.equal(inventario.quante('carne_cruda'),3);
});
test('non si rabbocca un telaio con roba diversa',()=>{
  essiccatoio(OGGETTO.ESSICCATOIO_CARICO,{dal:1,quante:3,cosa:'pesce_crudo'});
  inventario.aggiungi('carne_cruda',6);
  assert.match(azioni.azionePossibile(eroe,'carne_cruda',0).impedito,/il pesce sta ancora seccando/);
  assert.equal(azioni.agisci(eroe,'carne_cruda',0),null);
  assert.equal(modifiche.di(tx+1,ty).quante,3);
  // Con lo stesso pesce invece sì.
  inventario.aggiungi('pesce_crudo',3);
  assert.equal(azioni.agisci(eroe,'pesce_crudo',1).appesi,6);
});
test('il telaio disegna i pezzi che ha davvero, e il pesce è azzurro',()=>{
  const vuoto=sprite.essiccatoioSteso(0);
  const tre=sprite.essiccatoioSteso(3,'carne_cruda');
  const sei=sprite.essiccatoioSteso(6,'carne_cruda');
  const conta=(righe,tinta)=>righe.join('').split('').filter(c=>c===tinta).length;
  assert.equal(conta(vuoto,'t'),0,'vuoto non appende niente');
  assert.equal(conta(sei,'t'),conta(tre,'t')*2,'sei pezzi disegnano il doppio di tre');
  // Tre pezzi stanno tutti nella fila di sopra: sotto la seconda traversa non
  // pende niente, ed è quello che si legge da lontano.
  assert.deepEqual(tre.slice(6,8),vuoto.slice(6,8));
  assert.notDeepEqual(tre.slice(3,5),vuoto.slice(3,5));
  // Il pesce steso ha la tinta del pesce nello zaino, e la si chiede all'icona
  // invece di ripeterla qui: scritta a mano, questo collaudo resterebbe verde
  // il giorno che l'icona cambia colore e il telaio no.
  const tinte=righe=>new Set(righe.join('').split(''));
  const telaio=tinte(vuoto);
  const appeso=[...tinte(sprite.essiccatoioSteso(6,'pesce_crudo'))].filter(c=>!telaio.has(c));
  assert.deepEqual(appeso,['3'],'il carico aggiunge una tinta sola');
  assert.ok(appeso.every(c=>tinte(sprite.PESCE_CRUDO).has(c)),'ed è quella del pesce in mano');
  assert.ok(!appeso.includes('t'),'non è il rosso della carne');
  // Secco: la carne vira ad A, il pesce al blu grigiastro D.
  assert.ok(conta(sprite.essiccatoioSteso(6,'carne_cruda',true),'A')>0);
  assert.ok(conta(sprite.essiccatoioSteso(6,'pesce_crudo',true),'D')>0);
});
test('il pesce secco è blu grigiastro, non bruno come la carne',()=>{
  const pixel=sprite.PESCE_SECCO.join('').split('');
  assert.ok(pixel.includes('D'),'usa la tinta nuova');
  assert.equal(pixel.filter(c=>c==='g').length,0,'e non più il bruno del legno');
  const blu=TAVOLOZZA.D, acqua=TAVOLOZZA['3'];
  const canali=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
  const [r,v,b]=canali(blu);
  assert.ok(b>r,'tende al blu');
  assert.ok(b-r<canali(acqua)[2]-canali(acqua)[0],'ma meno del pesce crudo: è sbiadito');
});
test('rabboccando non si secca in un giorno: il conto riparte per tutti',()=>{
  // Il modo di barare che la regola chiude: tre pezzi il giorno prima che il
  // telaio sia pronto, e li si portava a casa dopo un'alba invece che dopo
  // tre. Adesso aspettano tutti, e aspettano da oggi.
  tempo.impostaGiorno(1);
  essiccatoio();inventario.aggiungi('pesce_crudo',6);
  azioni.agisci(eroe,'pesce_crudo',0);
  tempo.impostaGiorno(3);
  azioni.agisci(eroe,'pesce_crudo',0);
  assert.equal(modifiche.di(tx+1,ty).quante,6);
  // I giorni buoni li conta il calendario e non questo collaudo: si chiede a
  // lui quando sarebbe stata pronta la prima fila e quando lo è il telaio
  // rabboccato, e si pretende che il secondo giorno venga dopo il primo.
  const quando=dal=>{let g=dal;while(decadimento.giorniAsciutti(dal,g)<decadimento.GIORNI_DI_SECCA)g+=1;return g;};
  const senzaRabbocco=quando(1), conRabbocco=quando(3);
  assert.ok(conRabbocco>senzaRabbocco,'rabboccare costa giorni');
  tempo.impostaGiorno(senzaRabbocco);decadimento.nuovoGiorno();
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.ESSICCATOIO_CARICO,'il giorno della prima fila non basta più');
  tempo.impostaGiorno(conRabbocco);decadimento.nuovoGiorno();
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.ESSICCATOIO_PRONTO,'tre soli dopo il rabbocco');
  assert.equal(azioni.agisci(eroe,null,0).secche,2);
  assert.equal(inventario.quante('pesce_secco'),2);
});

// --- M7.15.5: il ghiaccio non è color sangue --------------------------------

test('nella tavolozza non ci sono due chiavi uguali',()=>{
  // Il difetto che questo collaudo chiude è costato ogni inverno giocato fin
  // qui: "A" era il ghiaccio in cima al file e il sangue degli infetti in
  // fondo, e in un oggetto letterale vince l'ultimo. Rileggendo non si vede —
  // le due righe stanno a venti righe di distanza — e il gioco non protesta.
  const sorgente=readFileSync(new URL('../arte/tavolozza.js',import.meta.url),'utf8');
  const chiaviDi=tavola=>{
    const corpo=sorgente.slice(sorgente.indexOf(`export const ${tavola} = {`));
    return [...corpo.slice(0,corpo.indexOf('\n};')).matchAll(/^\s*"?([A-Za-z0-9.])"?:\s*["#.]/gm)].map(m=>m[1]);
  };
  // La tavolozza piena e le sue correzioni: quella bagnata e le quattro vesti
  // stagionali ridefiniscono poche chiavi di proposito — lì il doppione è fra
  // le righe della stessa tavola, non fra una tavola e l'altra.
  for(const tavola of ['TAVOLOZZA','TAVOLOZZA_BAGNATA','TAVOLOZZA_INFETTO']) {
    const chiavi=chiaviDi(tavola);
    const doppie=chiavi.filter((c,i)=>chiavi.indexOf(c)!==i);
    assert.deepEqual(doppie,[],`${tavola}: chiavi ripetute ${doppie.join(', ')}`);
  }
  // E che il conto si legga davvero: un'espressione regolare che non trova
  // niente passerebbe questo collaudo senza guardare una riga.
  assert.ok(chiaviDi('TAVOLOZZA').length>20,`chiavi lette: ${chiaviDi('TAVOLOZZA').length}`);
});
test('il ghiaccio si disegna azzurro, da vicino e da lontano',async()=>{
  const tinte=await import('../interfaccia/tinte.js');
  tinte.impostaTavolozza(tavolozzaDi('inverno'));
  const lettere=new Set(GHIACCIO.flat().join(''));
  assert.ok(!lettere.has('A'),'niente sangue sulle lastre');
  const [r,v,b]=tinte.coloreDi(TERRENO.GHIACCIO);
  assert.ok(b>r+40,`da lontano è azzurro e non rosso: ${r},${v},${b}`);
  // E ogni lettera del disegno è una tinta che esiste davvero: una chiave
  // sbagliata qui dipingerebbe il ghiaccio di trasparente senza dire niente.
  for(const lettera of lettere) {
    assert.ok(TAVOLOZZA[lettera],`la tinta ${lettera} esiste`);
    const [rr,,bb]=[1,3,5].map(i=>parseInt(TAVOLOZZA[lettera].slice(i,i+2),16));
    assert.ok(bb>=rr,`la tinta ${lettera} del ghiaccio non è calda`);
  }
});

// --- M7.15.6: d'inverno non si secca ----------------------------------------

test('l’inverno ferma il conto per intero, neve o sereno che sia',()=>{
  // Non è il maltempo, è la stagione: nessuno dei quattro giorni conta, e non
  // importa che tiri neve o che sia sereno.
  const inverno=[9,10,11,12];
  for(const g of inverno) assert.equal(stagioni.stagioneDi(g),'inverno');
  assert.ok(inverno.some(g=>meteo.evento(g)!=='neve'),'e fra quei giorni ce n’è di sereni');
  assert.equal(decadimento.giorniAsciutti(8,12),0,'da fine autunno a fine inverno: zero soli buoni');
  tempo.impostaGiorno(10);
  assert.equal(decadimento.siSeccaOggi(),false,'a gennaio il telaio non lavora');
  tempo.impostaGiorno(14);
  assert.equal(decadimento.siSeccaOggi(),meteo.evento()!=='pioggia','e fuori dall’inverno decide la pioggia');
});
test('la carne stesa in autunno aspetta la primavera',()=>{
  tempo.impostaGiorno(8);
  essiccatoio();inventario.aggiungi('carne_cruda',3);
  assert.equal(azioni.agisci(eroe,'carne_cruda',0).quante,3);
  // Tutto l'inverno a telaio fermo: il disegno non cambia e la roba non si
  // perde. Quattro albe invernali e non succede niente.
  for(const giorno of [9,10,11,12]) {
    tempo.impostaGiorno(giorno);decadimento.nuovoGiorno();
    assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.ESSICCATOIO_CARICO,`giorno ${giorno}`);
    assert.equal(modifiche.di(tx+1,ty).quante,3,'la carne è ancora lì');
  }
  // In primavera riparte da sola, senza che il giocatore tocchi niente.
  let pronto=13; while(decadimento.giorniAsciutti(8,pronto)<decadimento.GIORNI_DI_SECCA) pronto+=1;
  assert.ok(pronto>=15,'e i tre soli buoni arrivano solo a primavera inoltrata');
  tempo.impostaGiorno(pronto);decadimento.nuovoGiorno();
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.ESSICCATOIO_PRONTO);
  assert.equal(azioni.agisci(eroe,null,0).secche,1);
});
test('d’inverno il tasto lo dice prima, e il telaio carico spiega perché sta fermo',()=>{
  tempo.impostaGiorno(10);
  essiccatoio();inventario.aggiungi('pesce_crudo',6);
  const azione=azioni.azionePossibile(eroe,'pesce_crudo',0);
  assert.equal(azione.verbo,"Stendi (d'inverno non secca)");
  assert.equal(azione.dInverno,true);
  // Si stende lo stesso: la roba aspetta la primavera invece di marcire in
  // mano, e il gioco non toglie un gesto — dice cosa comporta.
  assert.equal(azioni.agisci(eroe,'pesce_crudo',0).quante,3);
  assert.match(azioni.azionePossibile(eroe,null,0).impedito,/d'inverno il pesce non secca/);
  // In primavera la stessa domanda ha l'altra risposta.
  tempo.impostaGiorno(13);
  assert.match(azioni.azionePossibile(eroe,null,0).impedito,/il pesce sta ancora seccando/);
  assert.equal(azioni.azionePossibile(eroe,'pesce_crudo',0).verbo,'Stendi (riparte il conto)');
});

// --- M7.15.7: l'orto è terreno, non una cosa che ci sta sopra ---------------

test('l’orto è suolo e quello che sta in piedi no',()=>{
  // Il difetto che questa riga chiude: i solchi entravano nella fila di quello
  // che si ordina per i piedi, quindi un solco più in basso del superstite gli
  // veniva disegnato sopra — e il personaggio spariva sotto il campo.
  for(const stadio of ['TERRA_ZAPPATA','SEMINATO','GERMOGLIO','CRESCIUTA','MATURA','A_SEME','APPASSITA']) {
    assert.equal(mappa.eSuolo(OGGETTO[stadio]),true,stadio);
  }
  // E tutto quello che sta in piedi resta in piedi: un albero davanti a te ti
  // nasconde, ed è giusto così.
  for(const dritto of ['ALBERO','SASSO','FALO_ACCESO','FALO_SPENTO','BANCO','CASSA','PORTA',
    'ESSICCATOIO','ESSICCATOIO_CARICO','TORCIA_PIANTATA','MUCCHIO','GIACIGLIO','CADAVERE']) {
    assert.equal(mappa.eSuolo(OGGETTO[dritto]),false,dritto);
  }
  assert.equal(mappa.eSuolo(OGGETTO.NESSUNO),false);
});
test('il suolo non illumina e non si anima: il disegno cotto lo ignorerebbe',()=>{
  // La cottura del suolo guarda solo lo sprite fermo — niente fotogrammi e
  // niente luce — quindi dare a una zolla una fiamma o un'animazione vorrebbe
  // dire perderle senza che nessuno lo dica. Si legge dal catalogo vero.
  const sorgente=readFileSync(new URL('../mondo/mappa.js',import.meta.url),'utf8');
  const blocco=sorgente.slice(sorgente.indexOf('const CATALOGO_OGGETTI'),sorgente.indexOf('\n};',sorgente.indexOf('const CATALOGO_OGGETTI')));
  for(const [,voce] of blocco.matchAll(/\[OGGETTO\.\w+\]:\s*\{([^}]*)\}/g)) {
    if(!voce.includes('suolo: true')) continue;
    assert.ok(!voce.includes('luce:'),'una zolla non illumina: '+voce.trim());
    assert.ok(!voce.includes('fotogrammi:'),'una zolla non si anima: '+voce.trim());
  }
});

// --- M7.15.8: una pubblicazione arriva tutta o non arriva ------------------

test('ogni modulo si chiede con la versione del gioco',()=>{
  // Il difetto che questa riga chiude: GitHub Pages tiene ogni file in cache
  // dieci minuti, ciascuno per conto suo, e subito dopo M7.15.7 il browser ha
  // avuto gioco.js nuovo — con il numero nuovo a schermo — e mondo/mappa.js
  // vecchio, con l'orto ancora sopra il superstite. Un indirizzo con "?v="
  // nuovo non sta in nessuna cache: arriva dall'origine insieme agli altri.
  const root=new URL('../',import.meta.url);
  const pagina=readFileSync(new URL('index.html',root),'utf8');
  const versione=readFileSync(new URL('gioco.js',root),'utf8').match(/const VERSIONE = "([^"]+)"/)[1];
  const imports=JSON.parse(pagina.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
  const moduli=[];
  for(const dir of ['arte','mondo','motore','regole','entita','interfaccia'])
    for(const p of readdirSync(new URL(dir+'/',root)))if(p.endsWith('.js'))moduli.push(`./${dir}/${p}`);
  for(const m of moduli)assert.equal(imports[m],`${m}?v=${versione}`,m);
  // E niente di più: una voce per un file che non c'è più resterebbe lì a
  // sembrare una garanzia.
  assert.deepEqual(Object.keys(imports).sort(),moduli.sort());
  // L'ingresso non passa dalla mappa degli import, che vale solo per gli
  // import: la versione se la porta scritta da sé.
  assert.ok(pagina.includes(`<script type="module" src="gioco.js?v=${versione}"></script>`),'gioco.js con la versione');
  // Prima di qualunque modulo: una mappa che arriva dopo non vale più.
  assert.ok(pagina.indexOf('type="importmap"')<pagina.indexOf('type="module"'));
});
test('offline il modulo chiesto con la versione si trova lo stesso',async()=>{
  // Il deposito precarica gli indirizzi senza "?v=", la pagina li chiede con:
  // senza il secondo tentativo, offline si aprirebbe la pagina e basta.
  const handlers={},chiesti=[];let risposta;
  const source=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
  runInNewContext(source,{URL,self:{addEventListener:(k,v)=>handlers[k]=v,location:{origin:'https://valle.test'}},
    fetch:()=>Promise.reject(new TypeError('offline')),
    caches:{match:async(r,opzioni)=>{chiesti.push(opzioni?.ignoreSearch===true);return opzioni?.ignoreSearch?'mappa.js':undefined;}}});
  handlers.fetch({request:{method:'GET',url:'https://valle.test/ultimo-raccolto/mondo/mappa.js?v=M7.15.8',mode:'cors'},respondWith:p=>risposta=p});
  assert.equal(await risposta,'mappa.js');
  assert.deepEqual(chiesti,[false,true]);
});
test('il precarico chiede indirizzi che nessuna cache ha mai visto',async()=>{
  // Anche la copia offline si faceva dagli indirizzi senza versione, cioè
  // dalla stessa cache di GitHub Pages che ha mescolato M7.15.7.
  const handlers={};let chiesti,fatto;
  const source=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
  const versione=source.match(/const VERSIONE = "([^"]+)"/)[1];
  runInNewContext(source,{self:{addEventListener:(k,v)=>handlers[k]=v,skipWaiting:async()=>{}},
    Request:class{constructor(url,opzioni){this.url=url;this.cache=opzioni.cache;}},
    caches:{open:async()=>({addAll:async r=>{chiesti=r;}})}});
  handlers.install({waitUntil:p=>fatto=p});await fatto;
  assert.ok(chiesti.length>60);
  for(const r of chiesti){assert.match(r.url,new RegExp(`^\\./[^?]*\\?v=${versione}$`));assert.equal(r.cache,'reload');}
  assert.ok(chiesti.some(r=>r.url===`./mondo/mappa.js?v=${versione}`));
});
test('offline la navigazione trova la pagina precaricata con la versione',async()=>{
  const handlers={};let risposta;
  const source=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
  runInNewContext(source,{URL,self:{addEventListener:(k,v)=>handlers[k]=v,location:{origin:'https://valle.test'}},
    fetch:()=>Promise.reject(new TypeError('offline')),
    caches:{match:async(r,opzioni)=>opzioni?.ignoreSearch&&(r.url??r).endsWith('index.html')?'pagina':undefined}});
  handlers.fetch({request:{method:'GET',url:'https://valle.test/ultimo-raccolto/?diagnostica',mode:'navigate'},respondWith:p=>risposta=p});
  assert.equal(await risposta,'pagina');
});

// --- M7.16: l'orto si paga -------------------------------------------------

// Mezzanotte fra ieri e questo giorno: è tutto quello che l'orto guarda.
function notte(giorno) { tempo.impostaGiorno(giorno); return orto.nuovoGiorno(); }

test('la matura dà una rapa e niente semi, quella a seme tre semi e niente da mangiare',()=>{
  // Rendeva due rape e due semi: ogni seme ne ridava due insieme al cibo, e
  // l'orto cresceva da solo come un interesse composto.
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.MATURA,maturata:1});
  assert.equal(azioni.agisci(eroe,null).tipo,'raccolto');
  assert.equal(inventario.quante('rapa'),1);assert.equal(inventario.quante('semi'),0);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.A_SEME,maturata:1});
  assert.equal(azioni.azionePossibile(eroe,null).verbo,'Raccogli i semi');
  assert.equal(azioni.agisci(eroe,null).tipo,'raccolto');
  // Tre: sei fra M7.18.23 e M7.18.28, finché il mangime dei polli veniva
  // dai semi; da M7.18.29 il mangime è il grano.
  assert.equal(inventario.quante('semi'),3);assert.equal(inventario.quante('rapa'),1);
});
test('la matura lasciata lì va a seme in due giorni, e in altri due si secca',()=>{
  tempo.impostaGiorno(13);modifiche.imposta(tx,ty,{oggetto:OGGETTO.MATURA,maturata:13});
  assert.equal(notte(14).aSeme,0);assert.equal(mappa.oggettoDi(tx,ty),OGGETTO.MATURA);
  assert.equal(notte(15).aSeme,1);assert.equal(mappa.oggettoDi(tx,ty),OGGETTO.A_SEME);
  assert.equal(modifiche.di(tx,ty).maturata,13,'la data resta: è da lì che si conta');
  notte(16);assert.equal(mappa.oggettoDi(tx,ty),OGGETTO.A_SEME);
  assert.equal(notte(17).appassite,1);assert.equal(mappa.oggettoDi(tx,ty),OGGETTO.APPASSITA);
});
test('un giorno senz’acqua ingiallisce e ferma, e l’acqua rompe la fila',()=>{
  // In autunno, dove non è arido.
  for(const giorno of [5,6,7])assert.notEqual(meteo.evento(giorno),'arido');
  tempo.impostaGiorno(5);modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.GERMOGLIO});
  const primo=notte(6);
  assert.equal(primo.assetate,1);assert.equal(primo.seccate,0);
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.GERMOGLIO,'assetata non cresce');
  assert.equal(modifiche.di(tx+1,ty).secco,1);
  // Davanti lo dice, con qualunque cosa in mano — e dice quanto è grave.
  assert.equal(azioni.azionePossibile(eroe,null).impedito,"ha sete: senz'acqua non cresce");
  assert.match(azioni.azionePossibile(eroe,'semi').impedito,/ha sete/);
  // Il secchio viene prima dell'avviso, e toglie la sete subito.
  inventario.aggiungi('secchio_pieno',1);
  assert.equal(azioni.agisci(eroe,'secchio_pieno',0).tipo,'innaffia');
  assert.equal(modifiche.di(tx+1,ty).secco,undefined);assert.equal(modifiche.di(tx+1,ty).bagnato,true);
  notte(7);assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.CRESCIUTA);
  assert.equal(modifiche.di(tx+1,ty).secco,undefined);
  // Asciutta di nuovo, la fila riparte da uno.
  notte(8);assert.equal(modifiche.di(tx+1,ty).secco,1);
  // E d'inverno si muore di gelo, non di sete: la notizia è un'altra.
  const inverno=notte(9);assert.equal(inverno.seccate,0);assert.equal(inverno.appassite,1);
});
test('tre giorni asciutti di fila seccano, e il secondo lo dice',()=>{
  tempo.impostaGiorno(13);modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.GERMOGLIO});
  for(const giorno of [13,14,15])assert.notEqual(meteo.evento(giorno),'arido');
  notte(14);notte(15);assert.equal(modifiche.di(tx+1,ty).secco,2);
  assert.equal(azioni.azionePossibile(eroe,null).impedito,'ha sete: stanotte secca');
  assert.equal(notte(16).seccate,1);assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.APPASSITA);
});
test('d’estate un giorno senz’acqua conta due',()=>{
  // Un'estate in cui il secondo e il terzo giorno sono aridi e non canicola.
  let base=1;while(!(meteo.evento(base+1)==='arido'&&meteo.evento(base+2)==='arido'))base+=16;
  assert.ok(base<16*20);
  tempo.impostaGiorno(base+1);modifiche.imposta(tx,ty,{oggetto:OGGETTO.CRESCIUTA});
  assert.equal(notte(base+2).seccate,0);assert.equal(modifiche.di(tx,ty).secco,2);
  assert.equal(notte(base+3).seccate,1);assert.equal(mappa.oggettoDi(tx,ty),OGGETTO.APPASSITA);
});
test('il seme nella terra asciutta aspetta, anche d’estate',()=>{
  tempo.impostaGiorno(1);modifiche.imposta(tx,ty,{oggetto:OGGETTO.SEMINATO});
  for(const giorno of [2,3,4]) {
    const esito=notte(giorno);assert.equal(esito.seccate+esito.assetate,0);
    assert.equal(mappa.oggettoDi(tx,ty),OGGETTO.SEMINATO);assert.equal(modifiche.di(tx,ty).secco,undefined);
  }
});
test('la pioggia toglie la sete come il secchio',()=>{
  maltempo('pioggia');modifiche.imposta(tx,ty,{oggetto:OGGETTO.GERMOGLIO,secco:1});
  assert.equal(meteo.aggiornaMondo().innaffiate,1);
  assert.equal(modifiche.di(tx,ty).secco,undefined);assert.equal(modifiche.di(tx,ty).bagnato,true);
});
test('la sete si salva solo su una coltura e solo sotto la soglia',()=>{
  const stato=salvataggio.istantanea(eroe,0);
  stato.modifiche=[{tx:tx+1,ty,oggetto:OGGETTO.GERMOGLIO,secco:1},{tx:tx+2,ty,oggetto:OGGETTO.A_SEME,maturata:3}];
  assert.ok(salvataggio.valido(stato));
  stato.modifiche=[{tx:tx+1,ty,oggetto:OGGETTO.GERMOGLIO,secco:2}];
  assert.ok(salvataggio.valido(stato),'due è l’ultimo giorno prima di seccare');
  for(const storto of [3,0,-1,1.5,'uno']) {
    stato.modifiche=[{tx:tx+1,ty,oggetto:OGGETTO.GERMOGLIO,secco:storto}];
    assert.equal(salvataggio.valido(stato),false,String(storto));
  }
  stato.modifiche=[{tx:tx+1,ty,oggetto:OGGETTO.ALBERO,secco:1}];
  assert.equal(salvataggio.valido(stato),false,'una sete su un albero');
});

// Un anno di stagioni buone — primavera, estate, autunno — su sei tasselli,
// con un giardiniere che fa sempre la stessa cosa: raccoglie la matura se ha
// almeno `riserva` semi da parte, altrimenti la lascia andare a seme; semina
// dove è vuoto; innaffia nei giorni in cui `cura` dice sì. Rende la fame
// cotta prodotta per tassello e per giorno.
function rendita(cura, riserva) {
  const campi=[0,1,2,3,4,5].map(i=>({x:tx-2+i,y:ty+3}));
  for(const {x,y} of campi)modifiche.imposta(x,y,{oggetto:OGGETTO.NESSUNO});
  const resa=(o,cosa)=>RACCOLTA[o].resa.filter(v=>v.cosa===cosa).reduce((a,v)=>a+v.quante,0);
  const valore=CATALOGO[CATALOGO.rapa.cuoce].commestibile.fame;
  let semi=campi.length,fame=0;
  for(let giorno=13;giorno<25;giorno++) {
    tempo.impostaGiorno(giorno);
    for(const {x,y} of campi) {
      const o=modifiche.di(x,y).oggetto;
      if(o===OGGETTO.MATURA&&semi>=riserva){fame+=resa(o,'rapa')*valore;modifiche.imposta(x,y,{oggetto:OGGETTO.NESSUNO});}
      else if(o===OGGETTO.A_SEME){semi+=resa(o,'semi');modifiche.imposta(x,y,{oggetto:OGGETTO.NESSUNO});}
      else if(o===OGGETTO.APPASSITA)modifiche.imposta(x,y,{oggetto:OGGETTO.NESSUNO});
      if(modifiche.di(x,y).oggetto===OGGETTO.NESSUNO&&semi>0){semi--;modifiche.imposta(x,y,{oggetto:OGGETTO.SEMINATO});}
      const ora=modifiche.di(x,y).oggetto;
      if(cura(giorno)&&orto.siPuoInnaffiare(ora))orto.innaffia(x,y,ora);
    }
    notte(giorno+1);
  }
  return fame/(campi.length*12);
}
test('l’orto rende, ma un tassello non sfama più da solo',()=>{
  // Prima un tassello curato dava 0,67 di fame al giorno, e se ne consumano
  // 0,56: bastava un tassello. Adesso con la cura perfetta e i semi tenuti
  // da parte ne servono tre o quattro per mangiare, e di più per l'inverno.
  const perfetta=rendita(()=>true,1);
  assert.ok(perfetta>0.12&&perfetta<0.2,`cura perfetta: ${perfetta.toFixed(3)} per tassello al giorno`);
  assert.ok(0.56/perfetta>3,'un tassello non sfama più da solo');
  // Raccogliere tutto e non tenere mai semi rende meno: i semi sono un
  // raccolto, non un regalo.
  const ingordo=rendita(()=>true,0);
  assert.ok(ingordo<perfetta*0.7,`senza semi da parte: ${ingordo.toFixed(3)}`);
  // Un giorno saltato ogni quattro costa, ma non tutto il campo.
  const distratta=rendita(giorno=>giorno%4!==0,1);
  assert.ok(distratta>perfetta*0.3&&distratta<perfetta*0.7,`un giorno su quattro senz'acqua: ${distratta.toFixed(3)}`);
});

// --- M7.17: cinque colture --------------------------------------------------

// Un tassello zappato davanti al superstite, e il superstite con in mano quello
// che si dice.
function zappato(){modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.TERRA_ZAPPATA});}
// Cresce un giorno: la si innaffia e passa la mezzanotte.
function unGiorno(x,y,giorno){orto.innaffia(x,y,modifiche.di(x,y).oggetto);notte(giorno);}

test('ogni seme pianta la sua coltura, e fuori stagione dice quando',()=>{
  tempo.impostaGiorno(13);zappato();
  inventario.aggiungi('patata',2);inventario.aggiungi('fagioli',2);inventario.aggiungi('semi_lino',2);
  // La patata si pianta, e il tasto lo dice col suo verbo.
  assert.equal(azioni.azionePossibile(eroe,'patata',0).verbo,'Pianta');
  // I fagioli no: in primavera non è la loro stagione, e si dice quale è.
  assert.equal(azioni.azionePossibile(eroe,'fagioli',1).impedito,'i fagioli si seminano d’estate'.replace('’',"'"));
  assert.equal(azioni.agisci(eroe,'fagioli',1),null);assert.equal(inventario.quante('fagioli'),2);
  assert.equal(azioni.agisci(eroe,'patata',0).tipo,'semina');
  assert.deepEqual(modifiche.di(tx+1,ty),{oggetto:OGGETTO.SEMINATO,coltura:'patata',passo:0});
  assert.equal(inventario.quante('patata'),1,'si pianta una patata dello zaino');
  // D'inverno nessuno germoglia, e lo si dice come prima.
  tempo.impostaGiorno(10);zappato();
  assert.equal(azioni.azionePossibile(eroe,'semi_lino',2).impedito,"d'inverno non germoglia");
  // E la rapa resta scritta com'era: senza coltura.
  tempo.impostaGiorno(13);inventario.aggiungi('semi',1);
  assert.equal(azioni.agisci(eroe,'semi',3).tipo,'semina');
  assert.deepEqual(modifiche.di(tx+1,ty),{oggetto:OGGETTO.SEMINATO});
});
test('la patata cresce piano: sei stadi, cinque innaffiature, e rende tre patate',()=>{
  tempo.impostaGiorno(13);modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.SEMINATO,coltura:'patata',passo:0});
  const visti=[];
  for(let giorno=14;giorno<=18;giorno++){unGiorno(tx+1,ty,giorno);visti.push(modifiche.di(tx+1,ty).oggetto);}
  assert.deepEqual(visti,[OGGETTO.GERMOGLIO,OGGETTO.GERMOGLIO,OGGETTO.CRESCIUTA,OGGETTO.CRESCIUTA,OGGETTO.MATURA]);
  assert.equal(modifiche.di(tx+1,ty).passo,5);assert.equal(modifiche.di(tx+1,ty).coltura,'patata');
  assert.equal(azioni.agisci(eroe,null).tipo,'raccolto');
  assert.equal(inventario.quante('patata'),3);assert.equal(inventario.quante('rapa'),0);
});
test('ogni coltura rende il suo raccolto, e a seme i suoi semi',()=>{
  const prova=(coltura,oggetto,atteso)=>{
    inventario.svuota();const stadi=colture.di(coltura).stadi;
    modifiche.imposta(tx+1,ty,{oggetto,coltura,passo:stadi.length-1,maturata:tempo.giornoCorrente()});
    assert.equal(azioni.agisci(eroe,null).tipo,'raccolto',coltura);
    for(const [cosa,quante] of Object.entries(atteso))assert.equal(inventario.quante(cosa),quante,`${coltura}: ${cosa}`);
  };
  prova('lino',OGGETTO.MATURA,{filo:4,fibra:0});
  prova('lino',OGGETTO.A_SEME,{semi_lino:3,filo:0});
  prova('cavolo',OGGETTO.MATURA,{cavolo:1});
  prova('cavolo',OGGETTO.A_SEME,{semi_cavolo:3,cavolo:0});
  // Patata e fagioli non cambiano: il raccolto è anche il seme.
  prova('fagioli',OGGETTO.MATURA,{fagioli:3});
  prova('patata',OGGETTO.MATURA,{patata:3});
});
test('patata e fagioli non vanno a seme: il loro seme è il raccolto, e dopo quattro giorni marciscono',()=>{
  tempo.impostaGiorno(13);modifiche.imposta(tx,ty,{oggetto:OGGETTO.MATURA,coltura:'patata',passo:5,maturata:13});
  for(const giorno of [14,15,16]){assert.equal(notte(giorno).aSeme,0);assert.equal(mappa.oggettoDi(tx,ty),OGGETTO.MATURA);}
  assert.equal(notte(17).appassite,1);assert.equal(mappa.oggettoDi(tx,ty),OGGETTO.APPASSITA);
});
test('il cavolo regge il gelo: d’inverno si ferma invece di morire, e il maturo resta da mangiare',()=>{
  tempo.impostaGiorno(7);
  modifiche.imposta(tx,ty,{oggetto:OGGETTO.MATURA,coltura:'cavolo',passo:4,maturata:7});
  modifiche.imposta(tx+2,ty,{oggetto:OGGETTO.CRESCIUTA,coltura:'cavolo',passo:2});
  modifiche.imposta(tx+3,ty,{oggetto:OGGETTO.CRESCIUTA});
  notte(8);
  const gelo=notte(9);assert.equal(gelo.appassite,1,'la rapa muore');
  assert.equal(mappa.oggettoDi(tx+3,ty),OGGETTO.APPASSITA);
  for(const giorno of [10,11,12]){notte(giorno);assert.equal(mappa.oggettoDi(tx,ty),OGGETTO.MATURA,`giorno ${giorno}`);}
  assert.equal(mappa.oggettoDi(tx+2,ty),OGGETTO.CRESCIUTA,'quello che cresceva aspetta la primavera');
  // L'ultimo giorno d'autunno era rimasto senz'acqua, e quella sete se la
  // porta dietro: ma l'inverno non ne aggiunge.
  assert.equal(modifiche.di(tx+2,ty).secco,1,'d’inverno non ha sete');
  // I quattro giorni d'inverno non contano: a primavera ha l'età di fine
  // autunno più uno, cioè due, e va a seme.
  assert.equal(modifiche.di(tx,ty).maturata,11);
  assert.equal(notte(13).aSeme,1);assert.equal(mappa.oggettoDi(tx,ty),OGGETTO.A_SEME);
  // E quello che aspettava riprende a crescere, quando lo si innaffia.
  unGiorno(tx+2,ty,14);assert.equal(mappa.oggettoDi(tx+2,ty),OGGETTO.CRESCIUTA);assert.equal(modifiche.di(tx+2,ty).passo,3);
  unGiorno(tx+2,ty,15);assert.equal(mappa.oggettoDi(tx+2,ty),OGGETTO.MATURA);
});
test('i fagioli bevono: d’estate un giorno senz’acqua li secca, la patata lo regge',()=>{
  tempo.impostaGiorno(2);
  modifiche.imposta(tx,ty,{oggetto:OGGETTO.CRESCIUTA,coltura:'fagioli',passo:2});
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.CRESCIUTA,coltura:'patata',passo:3});
  assert.equal(notte(3).seccate,1);
  assert.equal(mappa.oggettoDi(tx,ty),OGGETTO.APPASSITA);
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.CRESCIUTA);assert.equal(modifiche.di(tx+1,ty).secco,2);
  // Ma d'estate la patata il secondo giorno non lo regge, e guardandola lo si
  // legge: a quattro secca, e ne ha già due.
  assert.equal(azioni.azionePossibile(eroe,null).impedito,'ha sete: stanotte secca','d’estate il secondo giorno la secca');
});
test('i fagioli si seccano all’essiccatoio, e il telaio lo dice al plurale',()=>{
  assert.equal(azioni.SECCABILI.fagioli.secca,'fagioli_secchi');
  tempo.impostaGiorno(10);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.ESSICCATOIO_CARICO,cosa:'fagioli',quante:3,dal:10});
  assert.equal(azioni.azionePossibile(eroe,null).impedito,"d'inverno i fagioli non seccano");
  tempo.impostaGiorno(13);
  assert.equal(azioni.azionePossibile(eroe,null).impedito,'i fagioli stanno ancora seccando');
  assert.equal(azioni.detteCosi('fagioli',2),'2 manciate di fagioli secchi');
});
test('la zuppa vuole un fuoco, e il secchio torna vuoto',()=>{
  const zuppa=ricette.RICETTE.find(r=>r.id==='zuppa');
  inventario.aggiungi('rapa',1);inventario.aggiungi('cavolo',1);inventario.aggiungi('secchio_pieno',1);
  assert.equal(ricette.fai(zuppa,true,false).perche,'fuoco','il banco non basta');
  assert.equal(inventario.quante('rapa'),1);
  assert.ok(ricette.fai(zuppa,false,true).fatto);
  assert.equal(inventario.quante('zuppa'),2);assert.equal(inventario.quante('secchio'),1);
  assert.equal(inventario.quante('secchio_pieno'),0);assert.equal(inventario.quante('cavolo'),0);
  // Sfama più dei due ingredienti cotti ciascuno per conto suo.
  const cotto=c=>CATALOGO[CATALOGO[c].cuoce]?.commestibile.fame ?? CATALOGO[c].commestibile.fame;
  for(const r of ricette.RICETTE.filter(r=>r.produce.cosa==='zuppa')) {
    const ingredienti=r.costo.filter(v=>v.cosa!=='secchio_pieno').reduce((a,v)=>a+cotto(v.cosa)*v.quante,0);
    assert.ok(CATALOGO.zuppa.commestibile.fame*r.produce.quante>ingredienti,r.id);
  }
});
test('con lo zaino pieno la zuppa non si fa, e non si perde niente',()=>{
  const zuppa=ricette.RICETTE.find(r=>r.id==='zuppa');
  inventario.aggiungi('rapa',1);inventario.aggiungi('cavolo',1);inventario.aggiungi('secchio_pieno',1);
  for(const cosa of ['legna','pietra','fibra','ramo','torcia'])inventario.aggiungi(cosa,1);
  // Otto caselle piene: via rapa, cavolo e secchio pieno se ne liberano tre,
  // e servono la zuppa e il secchio — due. Ci sta.
  assert.ok(ricette.fai(zuppa,false,true).fatto);
  // Con due rape e due cavoli le loro caselle restano occupate, e se ne
  // libera una sola — quella del secchio pieno: la zuppa ci sta, il secchio no.
  inventario.svuota();
  inventario.aggiungi('rapa',2);inventario.aggiungi('cavolo',2);inventario.aggiungi('secchio_pieno',1);
  for(const cosa of ['legna','pietra','fibra','ramo','torcia'])inventario.aggiungi(cosa,1);
  const prima=JSON.stringify(inventario.contenuto());
  assert.equal(ricette.fai(zuppa,false,true).perche,'zaino');
  assert.equal(JSON.stringify(inventario.contenuto()),prima);
});
test('coltura e passo si salvano solo se tornano con lo stadio',()=>{
  const stato=salvataggio.istantanea(eroe,0);
  const valida=m=>{stato.modifiche=[{tx:tx+1,ty,...m}];return salvataggio.valido(stato);};
  assert.ok(valida({oggetto:OGGETTO.GERMOGLIO,coltura:'patata',passo:2}));
  assert.ok(valida({oggetto:OGGETTO.A_SEME,coltura:'lino',passo:4,maturata:3}));
  assert.ok(valida({oggetto:OGGETTO.CRESCIUTA,coltura:'patata',passo:3,secco:3}),'la patata regge tre giorni');
  assert.equal(valida({oggetto:OGGETTO.CRESCIUTA,coltura:'fagioli',passo:2,secco:2}),false,'i fagioli a due sono secchi');
  assert.equal(valida({oggetto:OGGETTO.GERMOGLIO,coltura:'mais',passo:1}),false,'una coltura che non esiste');
  assert.equal(valida({oggetto:OGGETTO.GERMOGLIO,coltura:'patata',passo:3}),false,'il passo non torna con lo stadio');
  assert.equal(valida({oggetto:OGGETTO.GERMOGLIO,passo:1}),false,'un passo senza coltura');
  assert.equal(valida({oggetto:OGGETTO.ALBERO,coltura:'cavolo'}),false,'una coltura su un albero');
});
test('ogni coltura ha un disegno per stadio, diverso dalla rapa e coi colori della tavolozza',()=>{
  const disegni=ortoArte.tuttiIDisegni();
  for(const {coltura,stadio,righe} of disegni){
    assert.ok(righe.length===16&&righe.every(r=>r.length===16),`${coltura} ${stadio}`);
    for(const c of righe.join(''))assert.ok(c==='.'||Object.hasOwn(TAVOLOZZA,c),`${coltura} ${stadio}: ${c}`);
  }
  for(const coltura of Object.keys(colture.COLTURE)){
    for(const stadio of ['GERMOGLIO','CRESCIUTA','MATURA']){
      const d=ortoArte.disegnoDi(coltura,stadio);assert.ok(d,`${coltura} ${stadio}`);
      if(coltura!=='rapa')assert.notDeepEqual(d,ortoArte.disegnoDi('rapa',stadio),`${coltura} ${stadio} è una rapa`);
    }
    // Chi va a seme ha il suo disegno a seme; chi non ci va non ne ha bisogno.
    if(colture.di(coltura).aSeme)assert.ok(ortoArte.disegnoDi(coltura,'A_SEME'));
  }
  // Senza coltura, e con una che non esiste, è la rapa: il campo di prima.
  assert.equal(ortoArte.disegnoDi(undefined,'MATURA'),ortoArte.MATURA);
});
test('le cose nuove hanno un’icona di dodici per dodici e un nome',()=>{
  for(const cosa of ['patata','patata_arrostita','fagioli','fagioli_cotti','fagioli_secchi','cavolo','semi_cavolo','semi_lino','zuppa']){
    const voce=CATALOGO[cosa];assert.ok(voce?.nome,cosa);
    assert.ok(voce.icona.length===12&&voce.icona.every(r=>r.length===12),cosa);
    for(const c of voce.icona.join(''))assert.ok(c==='.'||Object.hasOwn(TAVOLOZZA,c),`${cosa}: ${c}`);
  }
  // Ogni seme di ogni coltura esiste nel catalogo, e ogni raccolto anche.
  for(const [id,c] of Object.entries(colture.COLTURE)){
    assert.ok(CATALOGO[c.seme],`${id}: seme ${c.seme}`);
    for(const v of [...c.raccolto,...(c.aSeme??[])])assert.ok(CATALOGO[v.cosa],`${id}: ${v.cosa}`);
  }
});

// --- M7.18: la terra si stanca ----------------------------------------------

test('il raccolto lascia la terra zappata e le toglie un punto; i fagioli glielo ridanno',()=>{
  tempo.impostaGiorno(13);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.MATURA,maturata:13});
  assert.equal(azioni.agisci(eroe,null).tipo,'raccolto');
  assert.deepEqual(modifiche.di(tx+1,ty),{oggetto:OGGETTO.TERRA_ZAPPATA,fertilita:1},'niente prato: la terra resta, più stanca');
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.MATURA,coltura:'fagioli',passo:4,maturata:13,fertilita:1});
  azioni.agisci(eroe,null);assert.equal(modifiche.di(tx+1,ty).fertilita,2,'i fagioli ingrassano');
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.A_SEME,maturata:11,fertilita:2});
  azioni.agisci(eroe,null);assert.equal(modifiche.di(tx+1,ty).fertilita,1,'anche andare a seme stanca');
  // Una pianta morta ripulita a mano rende la fibra e lascia la terra com'era.
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.APPASSITA,fertilita:1});
  azioni.agisci(eroe,null);
  assert.equal(inventario.quante('fibra'),1);assert.deepEqual(modifiche.di(tx+1,ty),{oggetto:OGGETTO.TERRA_ZAPPATA,fertilita:1});
  // E non scende sotto zero: la sfinita resta sfinita.
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.MATURA,maturata:13,fertilita:0});
  azioni.agisci(eroe,null);assert.equal(modifiche.di(tx+1,ty).fertilita,0);
});
test('la terra grassa rende uno in più a chi non ha patito, la stanca uno in meno, mai sotto uno',()=>{
  const patate=(extra)=>{
    inventario.svuota();modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.MATURA,coltura:'patata',passo:5,maturata:13,...extra});
    azioni.agisci(eroe,null);return inventario.quante('patata');
  };
  tempo.impostaGiorno(13);
  assert.equal(patate({fertilita:3}),4);
  assert.equal(patate({fertilita:3,patito:true}),3,'la sete di un giorno se la ricorda');
  assert.equal(patate({}),3,'la terra di un prato appena zappato');
  assert.equal(patate({fertilita:1}),2);
  inventario.svuota();modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.MATURA,maturata:13,fertilita:1});
  azioni.agisci(eroe,null);assert.equal(inventario.quante('rapa'),1,'mai sotto uno');
});
test('a terra sfinita attecchiscono solo i fagioli, e il tasto dice com’è la terra',()=>{
  inventario.aggiungi('semi',3);inventario.aggiungi('fagioli',3);
  const verbo=(fertilita,cosa,indice)=>{modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.TERRA_ZAPPATA,fertilita});return azioni.azionePossibile(eroe,cosa,indice);};
  tempo.impostaGiorno(2);
  assert.equal(verbo(3,'semi',0).verbo,'Semina (terra grassa)');
  assert.equal(verbo(2,'semi',0).verbo,'Semina');
  assert.equal(verbo(1,'semi',0).verbo,'Semina (terra stanca)');
  assert.equal(verbo(0,'semi',0).impedito,'terra sfinita: solo fagioli, cenere o riposo');
  const fagioli=verbo(0,'fagioli',1);assert.equal(fagioli.verbo,'Semina (terra sfinita)');assert.equal(fagioli.impedito??null,null);
  // Seminando la terra resta quella che era.
  assert.equal(azioni.agisci(eroe,'fagioli',1).tipo,'semina');
  assert.deepEqual(modifiche.di(tx+1,ty),{oggetto:OGGETTO.SEMINATO,coltura:'fagioli',passo:0,fertilita:0});
});
test('la terra accompagna la pianta fino in fondo, anche quando muore',()=>{
  tempo.impostaGiorno(5);
  modifiche.imposta(tx,ty,{oggetto:OGGETTO.SEMINATO,fertilita:3});
  unGiorno(tx,ty,6);assert.equal(modifiche.di(tx,ty).fertilita,3);
  notte(7);assert.equal(modifiche.di(tx,ty).fertilita,3);assert.equal(modifiche.di(tx,ty).patito,true);
  // L'inverno la uccide, e la terra resta scritta sull'appassita.
  notte(8);notte(9);
  assert.equal(mappa.oggettoDi(tx,ty),OGGETTO.APPASSITA);assert.equal(modifiche.di(tx,ty).fertilita,3);
});
test('con la zappa una pianta morta si interra: niente fibra, terra più grassa',()=>{
  inventario.aggiungi('zappa',1);const usi=inventario.attrezzo('zappa',0).usi;
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.APPASSITA,fertilita:1});
  assert.equal(azioni.azionePossibile(eroe,'zappa',0).verbo,'Interra');
  assert.equal(azioni.agisci(eroe,'zappa',0).tipo,'interra');
  assert.deepEqual(modifiche.di(tx+1,ty),{oggetto:OGGETTO.TERRA_ZAPPATA,fertilita:2});
  assert.equal(inventario.quante('fibra'),0);
  assert.equal(inventario.attrezzo('zappa',0).usi,usi-1,'è un colpo di zappa');
  vicino(bisogni.livello('stanchezza'),0.98);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.APPASSITA,fertilita:3});
  assert.equal(azioni.azionePossibile(eroe,'zappa',0).impedito,'la terra è già grassa');
});
test('il fuoco che brucia lascia cenere, e la cenere ingrassa la terra',()=>{
  // D'estate, che non piove: sotto la pioggia il falò non si riaccende.
  tempo.impostaGiorno(1);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FALO_ACCESO,legna:2});
  tempo.impostaGiorno(2);decadimento.nuovoGiorno();
  assert.equal(modifiche.di(tx+1,ty).cenere,1);assert.equal(modifiche.di(tx+1,ty).legna,1);
  tempo.impostaGiorno(3);decadimento.nuovoGiorno();
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FALO_SPENTO);assert.equal(modifiche.di(tx+1,ty).cenere,2,'anche l’ultima legna');
  // Ricaricandolo la cenere resta sul fondo.
  inventario.aggiungi('legna',1);
  assert.equal(azioni.agisci(eroe,'legna',0).tipo,'carica');assert.equal(modifiche.di(tx+1,ty).cenere,2);
  // A mani vuote la si prende tutta.
  assert.equal(azioni.azionePossibile(eroe,null).verbo,'Prendi la cenere (2)');
  assert.equal(azioni.agisci(eroe,null).tipo,'cenere');
  assert.equal(inventario.quante('cenere'),2);assert.equal(modifiche.di(tx+1,ty).cenere,undefined);
  assert.equal(azioni.azionePossibile(eroe,null).verbo,'Guarda il falò');
  // E sul campo è concime: sulla terra vuota e su quella che cresce, non su quella già grassa.
  const indice=inventario.contenuto().findIndex(c=>c?.cosa==='cenere');
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.GERMOGLIO,fertilita:1});
  assert.equal(azioni.agisci(eroe,'cenere',indice).tipo,'spargi');
  assert.deepEqual(modifiche.di(tx+1,ty),{oggetto:OGGETTO.GERMOGLIO,fertilita:2});
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.TERRA_ZAPPATA,fertilita:3});
  assert.equal(azioni.azionePossibile(eroe,'cenere',indice).impedito,'la terra è già grassa');
  assert.equal(inventario.quante('cenere'),1);
});
test('un inverno a riposo ridà un punto alla terra vuota, non a quella che ha tenuto un cavolo',()=>{
  tempo.impostaGiorno(12);
  modifiche.imposta(tx,ty,{oggetto:OGGETTO.TERRA_ZAPPATA,fertilita:0});
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.APPASSITA,fertilita:1});
  modifiche.imposta(tx+2,ty,{oggetto:OGGETTO.MATURA,coltura:'cavolo',passo:4,maturata:12,fertilita:1});
  modifiche.imposta(tx+3,ty,{oggetto:OGGETTO.TERRA_ZAPPATA,fertilita:3});
  assert.equal(notte(13).riposate,2);
  assert.equal(modifiche.di(tx,ty).fertilita,1);assert.equal(modifiche.di(tx+1,ty).fertilita,2);
  assert.equal(modifiche.di(tx+2,ty).fertilita,1);assert.equal(modifiche.di(tx+3,ty).fertilita,3);
  assert.equal(notte(14).riposate,0,'una volta per inverno');
});
test('di notte, in primavera e d’autunno, le bestie mangiano una pianta non protetta',()=>{
  orto.impostaBestie(true);
  // Le notti in cui una bestia arriva, per questo seme: si cercano, non si
  // indovinano, e ce ne devono essere.
  const pianta=()=>modifiche.imposta(tx,ty,{oggetto:OGGETTO.CRESCIUTA,fertilita:3});
  const notti=[];
  for(const giorno of [6,7,8,14,15,16]){pianta();tempo.impostaGiorno(giorno-1);if(notte(giorno).mangiate===1)notti.push(giorno);}
  assert.ok(notti.length>=1,'nessuna bestia in due stagioni');
  const giorno=notti[0];
  pianta();tempo.impostaGiorno(giorno-1);assert.equal(notte(giorno).mangiate,1);
  assert.deepEqual(modifiche.di(tx,ty),{oggetto:OGGETTO.TERRA_ZAPPATA,fertilita:3},'resta la terra, con la sua fertilità');
  // Uno spaventapasseri a tre tasselli la protegge; a quattro no.
  pianta();modifiche.imposta(tx+3,ty+3,{oggetto:OGGETTO.SPAVENTAPASSERI});
  assert.equal(notte(giorno).mangiate,0);assert.equal(mappa.oggettoDi(tx,ty),OGGETTO.CRESCIUTA);
  modifiche.imposta(tx+3,ty+3,{oggetto:OGGETTO.NESSUNO});modifiche.imposta(tx+4,ty,{oggetto:OGGETTO.SPAVENTAPASSERI});
  assert.equal(notte(giorno).mangiate,1);
  // Anche un fuoco acceso, e dei muri.
  modifiche.imposta(tx+4,ty,{oggetto:OGGETTO.NESSUNO});
  pianta();modifiche.imposta(tx-2,ty,{oggetto:OGGETTO.FALO_ACCESO,legna:2});
  assert.equal(notte(giorno).mangiate,0);
  modifiche.imposta(tx-2,ty,{oggetto:OGGETTO.NESSUNO});
  stanza();pianta();assert.equal(notte(giorno).mangiate,0,'dentro una stanza chiusa');
});
test('d’estate e d’inverno le bestie restano nella prateria, e il seme non lo mangiano',()=>{
  orto.impostaBestie(true);
  for(const giorno of [2,3,4,5,10,11,12,13]){
    modifiche.imposta(tx,ty,{oggetto:OGGETTO.MATURA,maturata:giorno-1});
    modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.MATURA,coltura:'cavolo',passo:4,maturata:giorno-1});
    assert.equal(notte(giorno).mangiate,0,`notte del giorno ${giorno}`);
  }
  for(const giorno of [6,7,8,14,15,16]){
    modifiche.imposta(tx,ty,{oggetto:OGGETTO.SEMINATO});modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.A_SEME,maturata:giorno-1});
    assert.equal(notte(giorno).mangiate,0,`seme e fiori, notte del giorno ${giorno}`);
  }
});
test('lo spaventapasseri si fa a mani nude, si posa, sta in piedi e si smonta',()=>{
  const ricetta=ricette.RICETTE.find(r=>r.id==='spaventapasseri');
  assert.equal(ricetta.banco,undefined);
  // Da M7.18.22: quattro rami e dieci fibre. Con quello di prima non basta.
  assert.deepEqual(ricetta.costo,[{cosa:'ramo',quante:4},{cosa:'fibra',quante:10}]);
  inventario.aggiungi('ramo',2);inventario.aggiungi('fibra',4);
  assert.equal(ricette.fai(ricetta).fatto,false);
  inventario.aggiungi('ramo',2);inventario.aggiungi('fibra',6);
  assert.ok(ricette.fai(ricetta).fatto);assert.equal(inventario.quante('ramo'),0);assert.equal(inventario.quante('fibra'),0);assert.equal(inventario.quante('spaventapasseri'),1);
  const indice=inventario.contenuto().findIndex(c=>c?.cosa==='spaventapasseri');
  assert.equal(azioni.agisci(eroe,'spaventapasseri',indice).tipo,'posa');
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.SPAVENTAPASSERI);
  assert.equal(mappa.eSuolo(OGGETTO.SPAVENTAPASSERI),false,'sta in piedi');
  assert.equal(mappa.solidoIn(tx+1,ty),false,'fra le file ci si passa');
  assert.equal(azioni.smontaggioPossibile(eroe).verbo,'Smonta lo spaventapasseri');
  assert.equal(azioni.smontaDavanti(eroe).tipo,'smontato');assert.equal(inventario.quante('spaventapasseri'),1);
  for(const n of ['SPAVENTAPASSERI','SPAVENTAPASSERI_ICONA','CENERE']){
    const r=arteCose[n];assert.ok(r.every(x=>x.length===r[0].length),n);
    for(const c of r.join(''))assert.ok(c==='.'||Object.hasOwn(TAVOLOZZA,c),`${n}: ${c}`);
  }
});
test('la cenere si accumula fino a dieci, e si prende anche dal fuoco acceso',()=>{
  // D'estate, che non piove e si brucia una legna al giorno.
  tempo.impostaGiorno(1);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FOCOLARE_ACCESO,legna:4,cenere:8});
  for(const [giorno,attesa] of [[2,9],[3,10],[4,10]]) {
    tempo.impostaGiorno(giorno);decadimento.nuovoGiorno();
    assert.equal(modifiche.di(tx+1,ty).cenere,attesa,'giorno '+giorno);
  }
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FOCOLARE_ACCESO);
  // A mani vuote la si prende tutta, e il fuoco resta acceso con la sua legna.
  assert.equal(azioni.azionePossibile(eroe,null).verbo,'Prendi la cenere (10)');
  assert.equal(azioni.agisci(eroe,null).tipo,'cenere');
  assert.equal(inventario.quante('cenere'),10);
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.FOCOLARE_ACCESO);
  assert.equal(modifiche.di(tx+1,ty).legna,1);assert.equal(modifiche.di(tx+1,ty).cenere,undefined);
});
test('fertilità, sete patita e cenere si salvano solo dove hanno senso',()=>{
  const stato=salvataggio.istantanea(eroe,0);
  const valida=m=>{stato.modifiche=[{tx:tx+1,ty,...m}];return salvataggio.valido(stato);};
  assert.ok(valida({oggetto:OGGETTO.TERRA_ZAPPATA,fertilita:0}));
  assert.ok(valida({oggetto:OGGETTO.APPASSITA,fertilita:3}));
  assert.ok(valida({oggetto:OGGETTO.CRESCIUTA,fertilita:1,patito:true,secco:1}));
  assert.ok(valida({oggetto:OGGETTO.FALO_SPENTO,cenere:3}));
  assert.ok(valida({oggetto:OGGETTO.FOCOLARE_ACCESO,legna:2,cenere:10}));
  for(const storto of [4,-1,1.5,'due'])assert.equal(valida({oggetto:OGGETTO.TERRA_ZAPPATA,fertilita:storto}),false,String(storto));
  assert.equal(valida({oggetto:OGGETTO.ALBERO,fertilita:2}),false,'una fertilità su un albero');
  assert.equal(valida({oggetto:OGGETTO.TERRA_ZAPPATA,patito:true}),false,'patita senza pianta');
  assert.equal(valida({oggetto:OGGETTO.CRESCIUTA,patito:false}),false);
  assert.equal(valida({oggetto:OGGETTO.FALO_SPENTO,cenere:11}),false);
  assert.equal(valida({oggetto:OGGETTO.CASSA,cenere:1}),false,'cenere fuori da un fuoco');
});

// M7.18.1 — il lino fa filo, e il filo vale anche come fibra.
test('il filo vale come fibra, e si spende dopo la fibra',()=>{
  const torcia=ricette.RICETTE.find(r=>r.id==='torcia');
  inventario.aggiungi('ramo',2);inventario.aggiungi('filo',3);
  assert.equal(ricette.disponibili('fibra'),3);
  assert.equal(ricette.bastano(torcia),true);
  assert.equal(ricette.fai(torcia).fatto,true);
  assert.equal(inventario.quante('filo'),1);
  // Con tutte e due nello zaino si paga in fibra, e il filo resta per quello
  // che la fibra non sa fare.
  inventario.aggiungi('fibra',1);
  assert.equal(ricette.disponibili('fibra'),2);
  assert.equal(ricette.fai(torcia).fatto,true);
  assert.equal(inventario.quante('fibra'),0);assert.equal(inventario.quante('filo'),0);
  assert.equal(inventario.quante('torcia'),2);
});

test('la fibra non vale come filo: bende, lenze e pelli vogliono il lino',()=>{
  inventario.aggiungi('fibra',40);inventario.aggiungi('pelle',10);inventario.aggiungi('ramo',5);inventario.aggiungi('legna',5);
  assert.equal(ricette.disponibili('filo'),0);
  for(const id of ['benda','canna','pelliccia','giaciglio_pelli']) {
    const r=ricette.RICETTE.find(x=>x.id===id);
    assert.ok(r.costo.some(v=>v.cosa==='filo'),id);
    assert.equal(ricette.bastano(r),false,id);
    assert.equal(ricette.fai(r,true).perche,'materiali',id);
  }
  inventario.svuota();inventario.aggiungi('canna',1);inventario.contenuto()[0].usi=0;
  inventario.aggiungi('pietra',1);inventario.aggiungi('fibra',10);
  assert.equal(ricette.fai(ricette.RICETTE.find(r=>r.id==='ripara_canna'),true).perche,'materiali');
  // Gli attrezzi di pietra invece si rilegano ancora con la fibra.
  inventario.aggiungi('ascia',1);inventario.attrezzo('ascia').usi=0;
  assert.equal(ricette.fai(ricette.RICETTE.find(r=>r.id==='ripara_ascia'),true).fatto,true);
  assert.equal(inventario.quante('fibra'),8);
});

test('una ricetta che volesse fibra e filo non spende come fibra il filo che le serve',()=>{
  const prova={id:'prova',produce:{cosa:'benda',quante:1},costo:[{cosa:'fibra',quante:2},{cosa:'filo',quante:2}]};
  inventario.aggiungi('filo',3);
  assert.equal(ricette.bastano(prova),false);
  assert.equal(ricette.fai(prova).perche,'materiali');
  assert.equal(inventario.quante('filo'),3);
  inventario.aggiungi('filo',1);
  assert.equal(ricette.fai(prova).fatto,true);
  assert.equal(inventario.quante('filo'),0);
  // E con le voci al contrario il conto non cambia: la fibra si prende prima.
  const rovescia={...prova,costo:[...prova.costo].reverse()};
  inventario.aggiungi('fibra',1);inventario.aggiungi('filo',3);
  assert.equal(ricette.fai(rovescia).fatto,true);
  assert.equal(inventario.quante('fibra'),0);assert.equal(inventario.quante('filo'),0);
});

test('il filo è un oggetto con la sua icona, e nel fuoco non si mette',()=>{
  assert.equal(CATALOGO.filo.nome,'Filo di lino');
  assert.ok(CATALOGO.filo.pila>=40);
  assert.equal(sprite.FILO.length,12);
  for(const riga of sprite.FILO){assert.equal(riga.length,12);for(const c of riga)assert.ok(c in TAVOLOZZA,c);}
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FALO_SPENTO});
  inventario.aggiungi('filo',20);
  const azione=azioni.azionePossibile(eroe,'filo',0);
  assert.notEqual(azione?.tipo,'carica');
  azioni.agisci(eroe,'filo',0);
  assert.equal(inventario.quante('filo'),20);
});

// M7.18.2 — l'essiccatoio vuole il filo: è un attrezzo del secondo gradino.
test("l'essiccatoio si fa con sei fili, e le fibre non bastano",()=>{
  const r=ricette.RICETTE.find(x=>x.id==='essiccatoio');
  assert.deepEqual(r.costo,[{cosa:'legna',quante:4},{cosa:'ramo',quante:2},{cosa:'filo',quante:6}]);
  inventario.aggiungi('legna',4);inventario.aggiungi('ramo',2);inventario.aggiungi('fibra',30);
  assert.equal(ricette.fai(r,true).perche,'materiali');
  inventario.aggiungi('filo',6);
  assert.equal(ricette.fai(r,true).fatto,true);
  assert.equal(inventario.quante('essiccatoio'),1);
  assert.equal(inventario.quante('filo'),0);assert.equal(inventario.quante('fibra'),30);
});

// M7.18.3 — la conserva sale di gradino: filo nel costo, e sfama del tutto.
test('la conserva si chiude col filo, dura un anno e sfama del tutto',()=>{
  const r=ricette.RICETTE.find(x=>x.id==='conserva');
  assert.deepEqual(r.costo,[{cosa:'bacche',quante:4},{cosa:'filo',quante:2}]);
  inventario.aggiungi('bacche',4);inventario.aggiungi('fibra',20);
  assert.equal(ricette.fai(r,true).perche,'materiali');
  inventario.aggiungi('filo',2);
  assert.equal(ricette.fai(r,true).fatto,true);
  assert.equal(inventario.quante('conserva'),2);assert.equal(inventario.quante('fibra'),20);
  assert.equal(CATALOGO.conserva.dura,16);
  assert.equal(CATALOGO.conserva.commestibile.fame,1);
  // Un vaso riempie la fame da vuota.
  bisogni.consuma('fame',1);
  assert.equal(bisogni.livello('fame'),0);
  const i=inventario.contenuto().findIndex(c=>c?.cosa==='conserva');
  assert.equal(azioni.consuma('conserva',i).tipo,'consumato');
  assert.equal(bisogni.livello('fame'),1);
  assert.equal(inventario.quante('conserva'),1);
});

// M7.18.5 — la schermata iniziale.
test("dalla schermata iniziale non parte il salvataggio dell'alba",()=>{
  // Il difetto trovato nel browser: scorrendo le stagioni il giorno salta
  // avanti, e l'alba — che guardava solo il giorno — scriveva la valle vuota
  // nella casella ALBA e in rete. Qui si controlla che la condizione lo dica.
  const sorgente=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  const riga=sorgente.split('\n').find(r=>r.includes('salvataggio.scrivi(salvataggio.ALBA')) ?? '';
  const i=sorgente.indexOf('tempo.giornoCorrente() > albaScritta');
  assert.ok(i>0);
  const condizione=sorgente.slice(sorgente.lastIndexOf('if (',i),i);
  assert.match(condizione,/iniziale === null/);
  assert.ok(riga.length>0);
});

test('Esc e il tasto di cancellazione vogliono dire indietro',()=>{
  const sorgente=readFileSync(new URL('../motore/comandi.js',import.meta.url),'utf8');
  assert.match(sorgente,/Escape: "indietro", Backspace: "indietro"/);
  assert.match(sorgente,/"suono", "indietro",/);
});

// --- M7.18.13: il pavimento di legno e il letto ------------------------------

test('il pavimento resta sotto quello che si posa, si toglie e si riscrive',()=>{
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.NESSUNO,pavimento:'legno'});
  // Chi riscrive il tassello da capo non lo sa, e il pavimento resta.
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.CASSA});
  assert.equal(mappa.pavimentoIn(tx+1,ty),'legno');
  mappa.cambiaTassello(tx+1,ty,{oggetto:OGGETTO.NESSUNO});
  assert.equal(mappa.pavimentoIn(tx+1,ty),'legno');
  // Anche tornando alla generazione: sotto c'è una casella vuota, non un albero.
  mappa.cambiaTassello(tx+1,ty,null);
  assert.deepEqual(modifiche.di(tx+1,ty),{oggetto:OGGETTO.NESSUNO,pavimento:'legno'});
  // Lo toglie solo chi lo nomina.
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.NESSUNO,pavimento:undefined});
  assert.equal(mappa.pavimentoIn(tx+1,ty),null);
  assert.equal(Object.hasOwn(modifiche.di(tx+1,ty),'pavimento'),false);
});
test('il pavimento si posa solo al chiuso e su una casella libera, e ci si posa e cammina sopra',()=>{
  stanza();inventario.aggiungi('pavimento',3);
  // Col muro crollato non è un posto chiuso.
  modifiche.imposta(tx-2,ty,{oggetto:OGGETTO.MURO_ROTTO});
  assert.equal(azioni.azionePossibile(eroe,'pavimento',0).impedito,'il pavimento va posato al chiuso');
  modifiche.imposta(tx-2,ty,{oggetto:OGGETTO.MURO});
  const gesto=azioni.azionePossibile(eroe,'pavimento',0);
  assert.equal(gesto.tipo,'pavimenta');assert.equal(gesto.impedito ?? null,null);
  assert.equal(azioni.agisci(eroe,'pavimento',0).tipo,'pavimenta');
  assert.equal(mappa.pavimentoIn(tx+1,ty),'legno');assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.NESSUNO);
  assert.equal(inventario.quante('pavimento'),2);assert.equal(mappa.solidoIn(tx+1,ty),false);
  assert.equal(azioni.azionePossibile(eroe,'pavimento',0).impedito,"c'è già il pavimento");
  // Su una casella occupata non si posa: prima si toglie quello che c'è. Gli
  // arredi sì, da M7.18.21 (vedi più sotto); un mucchio no.
  modifiche.imposta(tx+1,ty-1,{oggetto:OGGETTO.MUCCHIO});
  assert.notEqual(azioni.azionePossibile({...eroe,...pos(tx+1,ty),guarda:'su'},'pavimento',0)?.tipo,'pavimenta');
  // Sulle assi non si zappa.
  inventario.aggiungi('zappa',1);
  const zappa=inventario.contenuto().findIndex(c=>c?.cosa==='zappa');
  assert.notEqual(azioni.azionePossibile(eroe,'zappa',zappa)?.tipo,'zappa');
  // Ci si posa sopra una cassa, e smontandola il pavimento resta; poi si solleva.
  inventario.aggiungi('cassa',1);
  const cassa=inventario.contenuto().findIndex(c=>c?.cosa==='cassa');
  assert.equal(azioni.agisci(eroe,'cassa',cassa).tipo,'posa');
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.CASSA);assert.equal(mappa.pavimentoIn(tx+1,ty),'legno');
  eroe={...eroe,...pos(tx,ty),guarda:'destra'};
  assert.equal(azioni.smontaDavanti(eroe).tipo,'smontato');
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.NESSUNO);assert.equal(mappa.pavimentoIn(tx+1,ty),'legno');
  assert.equal(azioni.smontaggioPossibile(eroe).verbo,'Solleva il pavimento');
  assert.equal(azioni.smontaDavanti(eroe).cosa,'pavimento');
  assert.equal(mappa.pavimentoIn(tx+1,ty),null);assert.equal(inventario.quante('pavimento'),3);
});
// M7.18.21 — le assi sotto gli arredi.
test('il pavimento si posa sotto una cassa piena e un focolare acceso, e lascia sopra tutto com\'era',()=>{
  stanza();inventario.aggiungi('pavimento',3);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.CASSA});
  contenitori.scrivi(tx+1,ty,[{cosa:'legna',quantita:5}]);
  assert.equal(contenitori.eVuota(tx+1,ty),false);
  // Senza assi in mano la barra apre, come sempre.
  assert.equal(azioni.azionePossibile(eroe,null).tipo,'apri');
  const gesto=azioni.azionePossibile(eroe,'pavimento',0);
  assert.equal(gesto.tipo,'pavimenta');assert.equal(gesto.impedito,null);
  assert.equal(azioni.agisci(eroe,'pavimento',0).tipo,'pavimenta');
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.CASSA);assert.equal(mappa.pavimentoIn(tx+1,ty),'legno');
  assert.deepEqual(contenitori.contenutoDi(tx+1,ty)[0],{cosa:'legna',quantita:5});
  assert.equal(inventario.quante('pavimento'),2);
  // Con le assi già sotto, le assi in mano non chiudono la cassa.
  assert.equal(azioni.azionePossibile(eroe,'pavimento',0).tipo,'apri');
  // Il focolare acceso, con la sua legna.
  modifiche.imposta(tx,ty+1,{oggetto:OGGETTO.FOCOLARE_ACCESO,legna:3});
  const giu={...eroe,guarda:'giu'};
  assert.equal(azioni.agisci(giu,'pavimento',0).tipo,'pavimenta');
  assert.equal(mappa.oggettoDi(tx,ty+1),OGGETTO.FOCOLARE_ACCESO);assert.equal(mappa.pavimentoIn(tx,ty+1),'legno');
  assert.equal(decadimento.legnaNel(tx,ty+1),3);
  // Controprova: all'aperto no, nemmeno sotto una cassa.
  modifiche.imposta(tx-2,ty,{oggetto:OGGETTO.MURO_ROTTO});
  modifiche.imposta(tx,ty-1,{oggetto:OGGETTO.BANCO});
  assert.equal(azioni.azionePossibile({...eroe,guarda:'su'},'pavimento',0).impedito,'il pavimento va posato al chiuso');
  // E una porta non è un arredo: il pavimento non ci va sotto.
  modifiche.imposta(tx-2,ty,{oggetto:OGGETTO.MURO});
  assert.notEqual(azioni.azionePossibile({...eroe,...pos(tx+1,ty),guarda:'destra'},'pavimento',0)?.tipo,'pavimenta');
});
test("con l'ascia in mano la X solleva le assi da sotto la cassa piena e il focolare acceso",()=>{
  stanza();inventario.aggiungi('ascia',1);
  const ascia=inventario.contenuto().findIndex(c=>c?.cosa==='ascia');
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.CASSA,pavimento:'legno'});
  contenitori.scrivi(tx+1,ty,[{cosa:'legna',quantita:5}]);
  // A mani vuote la X guarda quello che sta sopra, e la cassa piena non si smonta.
  assert.equal(azioni.smontaggioPossibile(eroe).impedito,'prima svuotala');
  const conLAscia=azioni.smontaggioPossibile(eroe,'ascia');
  assert.equal(conLAscia.verbo,'Solleva il pavimento');assert.equal(conLAscia.impedito,null);
  assert.equal(azioni.smontaDavanti(eroe,'ascia').cosa,'pavimento');
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.CASSA);assert.equal(mappa.pavimentoIn(tx+1,ty),null);
  assert.deepEqual(contenitori.contenutoDi(tx+1,ty)[0],{cosa:'legna',quantita:5});
  assert.equal(inventario.quante('pavimento'),1);
  // Senza assi l'ascia non ha niente da sollevare: torna lo smontaggio di sempre.
  assert.equal(azioni.smontaggioPossibile(eroe,'ascia').verbo,'Smonta la cassa');
  // Il focolare acceso resta acceso con la sua legna.
  modifiche.imposta(tx,ty+1,{oggetto:OGGETTO.FOCOLARE_ACCESO,legna:3,pavimento:'legno'});
  const giu={...eroe,guarda:'giu'};
  assert.match(azioni.smontaggioPossibile(giu).impedito,/acceso/);
  assert.equal(azioni.smontaDavanti(giu,'ascia').cosa,'pavimento');
  assert.equal(mappa.oggettoDi(tx,ty+1),OGGETTO.FOCOLARE_ACCESO);assert.equal(decadimento.legnaNel(tx,ty+1),3);
  assert.equal(mappa.pavimentoIn(tx,ty+1),null);
  // Il letto no: senza assi non si sarebbe potuto posare.
  modifiche.imposta(tx,ty-1,{oggetto:OGGETTO.LETTO,pavimento:'legno'});
  assert.equal(azioni.smontaggioPossibile({...eroe,guarda:'su'},'ascia').impedito,'il letto sta sulle assi: prima smontalo');
  // La casella vuota si solleva anche a mani nude, come prima.
  modifiche.imposta(tx-1,ty,{oggetto:OGGETTO.NESSUNO,pavimento:'legno'});
  assert.equal(azioni.smontaggioPossibile({...eroe,guarda:'sinistra'}).verbo,'Solleva il pavimento');
});
test('il letto è un mobile: si posa solo sul pavimento di legno, e ci si dorme',()=>{
  stanza();inventario.aggiungi('letto',1);
  const senza=azioni.azionePossibile(eroe,'letto',0);
  assert.equal(senza.tipo,'posa');assert.match(senza.impedito,/serve il pavimento di legno/);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.NESSUNO,pavimento:'legno'});
  assert.equal(azioni.agisci(eroe,'letto',0).tipo,'posa');
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.LETTO);assert.equal(mappa.solidoIn(tx+1,ty),false);
  assert.equal(azioni.azionePossibile(eroe,null).tipo,'dormi');
  assert.equal(azioni.smontaggioPossibile(eroe).verbo,'Smonta il letto');
});
test('pavimento e letto si fanno al banco: tre legna per tre assi, e legna, fibra e filo per il letto',()=>{
  const pav=ricette.RICETTE.find(r=>r.id==='pavimento'),letto=ricette.RICETTE.find(r=>r.id==='letto');
  assert.deepEqual(pav.costo,[{cosa:'legna',quante:3}]);assert.deepEqual(pav.produce,{cosa:'pavimento',quante:3});
  assert.deepEqual(letto.costo,[{cosa:'legna',quante:10},{cosa:'fibra',quante:15},{cosa:'filo',quante:8}]);
  assert.equal(pav.banco,true);assert.equal(letto.banco,true);
  inventario.aggiungi('legna',3);
  assert.equal(ricette.fai(pav).perche,'banco');
  assert.equal(ricette.fai(pav,true).fatto,true);assert.equal(inventario.quante('pavimento'),3);
  assert.equal(CATALOGO.letto.mobile,true);assert.equal(CATALOGO.pavimento.pavimento,'legno');
});
test('nel letto si guarisce tre volte più in fretta, e l’infezione non toglie salute nel sonno',()=>{
  salute.ferita(0.5,'animali');salute.avanza(100,{});vicino(salute.livelloCorrente(),0.5+100/900);
  salute.reimposta();salute.ferita(0.5,'animali');salute.avanza(100,{nelLetto:true});vicino(salute.livelloCorrente(),0.5+300/900);
  salute.reimposta();salute.infettati();salute.avanza(100,{});vicino(salute.livelloCorrente(),1-100/1200);
  salute.reimposta();salute.infettati();salute.avanza(100,{nelLetto:true});vicino(salute.livelloCorrente(),1);
  assert.equal(salute.eInfetto(),true,'non la cura: per quello resta la benda');
});
test('dormire nel letto guarisce più che sul giaciglio, per tutta la notte',()=>{
  // Dalle dieci di sera alle sette: nove ore, cioè 112,5 secondi. In una notte
  // serena fuori dall'estate e dall'inverno, perché nessun bisogno si vuoti e
  // non si geli: la guarigione vuole che non manchi niente.
  let giorno=1;
  while(meteo.evento(giorno)!=='sereno'||['estate','inverno'].includes(stagioni.stagioneDi(giorno)))giorno++;
  const notte=(oggetto)=>{
    reset();stanza();tempo.impostaGiorno(giorno);tempo.impostaOra(22);
    modifiche.imposta(tx+1,ty,{oggetto,pavimento:'legno'});
    salute.ferita(0.5,'animali');
    const esito=azioni.agisci(eroe,null);assert.equal(esito.tipo,'dormi');
    return salute.livelloCorrente();
  };
  vicino(notte(OGGETTO.GIACIGLIO),0.5+112.5/900,1e-6);
  vicino(notte(OGGETTO.LETTO),0.5+3*112.5/900,1e-6);
});
test('il focolare spento a mezzanotte tiene caldo sulle assi fino al mattino',()=>{
  // Una notte d'inverno: il focolare ha l'ultima legna e la finisce a mezzanotte.
  stanzaGrande();
  modifiche.imposta(tx-2,ty,{oggetto:OGGETTO.FOCOLARE_ACCESO,legna:2});
  tempo.impostaGiorno(9);tempo.impostaOra(23.9);simulazione.avanza(5);
  assert.equal(tempo.giornoCorrente(),10);
  assert.equal(mappa.oggettoDi(tx-2,ty),OGGETTO.FOCOLARE_SPENTO);
  assert.equal(modifiche.di(tx-2,ty).tepore,10);
  // Sulla terra si gela, sulle assi no.
  eroe={...eroe,...pos(tx+2,ty)};assert.equal(freddo.alFreddo(eroe),true);
  modifiche.imposta(tx+2,ty,{oggetto:OGGETTO.NESSUNO,pavimento:'legno'});assert.equal(freddo.alFreddo(eroe),false);
  // Il letto sulle assi, entro tre tasselli dal focolare, dorme al caldo.
  const letto={px:(tx+0.5)*16,py:(ty+0.75)*16};
  assert.equal(freddo.fuocoPerRiposo(letto),false);
  modifiche.imposta(tx,ty,{oggetto:OGGETTO.LETTO,pavimento:'legno'});assert.equal(freddo.fuocoPerRiposo(letto),true);
  // Fino alle sette: poi il tepore è finito (e comunque è giorno).
  assert.equal(decadimento.tiepido(tx-2,ty),true);
  tempo.impostaOra(7.5);assert.equal(decadimento.tiepido(tx-2,ty),false);
  tempo.impostaGiorno(11);tempo.impostaOra(2);assert.equal(decadimento.tiepido(tx-2,ty),false,'la notte dopo no');
  tempo.impostaGiorno(10);
  // Riaccenderlo lo riscrive da capo.
  tempo.impostaOra(2);inventario.aggiungi('legna',1);
  const davanti={...pos(tx-1,ty),guarda:'sinistra'};
  assert.equal(azioni.agisci(davanti,'legna',0).tipo,'carica');
  assert.equal(modifiche.di(tx-2,ty).tepore,undefined);
});
test('il falò spento non lascia tepore',()=>{
  stanzaGrande();
  modifiche.imposta(tx-2,ty,{oggetto:OGGETTO.FALO_ACCESO,legna:2});
  modifiche.imposta(tx+2,ty,{oggetto:OGGETTO.NESSUNO,pavimento:'legno'});
  tempo.impostaGiorno(9);tempo.impostaOra(23.9);simulazione.avanza(5);
  assert.equal(mappa.oggettoDi(tx-2,ty),OGGETTO.FALO_SPENTO);assert.equal(modifiche.di(tx-2,ty).tepore,undefined);
  eroe={...eroe,...pos(tx+2,ty)};assert.equal(freddo.alFreddo(eroe),true);
});
test('pavimento e tepore si salvano solo dove hanno senso, e il pavimento ferma la ricrescita',()=>{
  const stato=salvataggio.istantanea(eroe,0);
  const valida=m=>{stato.modifiche=[{tx:tx+1,ty,...m}];return salvataggio.valido(stato);};
  assert.ok(valida({oggetto:OGGETTO.NESSUNO,pavimento:'legno'}));
  assert.ok(valida({oggetto:OGGETTO.LETTO,pavimento:'legno'}));
  // Da M7.18.21 anche sotto una cassa piena e un focolare acceso.
  assert.ok(valida({oggetto:OGGETTO.CASSA,pavimento:'legno',contenuto:[{cosa:'legna',quantita:5}]}));
  assert.ok(valida({oggetto:OGGETTO.FOCOLARE_ACCESO,legna:3,pavimento:'legno'}));
  assert.ok(valida({oggetto:OGGETTO.FOCOLARE_SPENTO,tepore:10}));
  assert.equal(valida({oggetto:OGGETTO.NESSUNO,pavimento:'pietra'}),false);
  assert.equal(valida({pavimento:'legno'}),false,'senza oggetto tornerebbe la generazione');
  assert.equal(valida({oggetto:OGGETTO.TERRA_ZAPPATA,pavimento:'legno'}),false,'sulle assi non si zappa');
  assert.equal(valida({oggetto:OGGETTO.FALO_SPENTO,tepore:10}),false);
  // E torna com'era dopo un salvataggio.
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.LETTO,pavimento:'legno'});
  const pieno=salvataggio.istantanea(eroe,0);modifiche.svuota();assert.ok(salvataggio.applica(pieno));
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.LETTO);assert.equal(mappa.pavimentoIn(tx+1,ty),'legno');
  // Un tassello di bosco col pavimento non ricresce, nemmeno all'aperto.
  const p=strappato(OGGETTO.ALBERO);
  modifiche.imposta(p.tx,p.ty,{oggetto:OGGETTO.NESSUNO,pavimento:'legno'});
  tempo.impostaGiorno(primoDi('estate',20));ricrescita.nuovoGiorno();
  assert.equal(mappa.oggettoDi(p.tx,p.ty),OGGETTO.NESSUNO);
});

// M7.18.14 — al chiuso l'orto non cresce.
test('al chiuso la prima notte la pianta si ferma, anche bagnata, e la seconda appassisce',()=>{
  stanza();tempo.impostaGiorno(5);
  modifiche.imposta(tx,ty,{oggetto:OGGETTO.CRESCIUTA,fertilita:3,bagnato:true});
  const prima=notte(6);
  assert.equal(prima.alChiuso,1);assert.equal(prima.cresciute,0);assert.equal(prima.alBuio,0);
  assert.deepEqual(modifiche.di(tx,ty),{oggetto:OGGETTO.CRESCIUTA,fertilita:3,buio:1},'ferma, asciugata, e segnata');
  const seconda=notte(7);
  assert.equal(seconda.alBuio,1);assert.equal(seconda.alChiuso,0);
  assert.deepEqual(modifiche.di(tx,ty),{oggetto:OGGETTO.APPASSITA,fertilita:3},'appassita, con la sua terra');
});

test('al chiuso anche l’orologio della matura si ferma la prima notte',()=>{
  stanza();tempo.impostaGiorno(5);
  modifiche.imposta(tx,ty,{oggetto:OGGETTO.MATURA,maturata:5});
  notte(6);assert.equal(modifiche.di(tx,ty).maturata,6);assert.equal(modifiche.di(tx,ty).buio,1);
  notte(7);assert.equal(mappa.oggettoDi(tx,ty),OGGETTO.APPASSITA);
});

test('riaperto dopo una notte al buio, l’orto dimentica il buio e cresce',()=>{
  stanza();tempo.impostaGiorno(5);
  modifiche.imposta(tx,ty,{oggetto:OGGETTO.GERMOGLIO,bagnato:true});
  notte(6);assert.equal(modifiche.di(tx,ty).buio,1);
  // Un muro smontato: la porta, anche aperta, non basterebbe (M7.18.11).
  modifiche.imposta(tx-2,ty,{oggetto:OGGETTO.NESSUNO});
  modifiche.imposta(tx,ty,{...modifiche.di(tx,ty),bagnato:true});
  const r=notte(7);
  assert.equal(r.cresciute,1);assert.equal(r.alChiuso,0);
  assert.equal(mappa.oggettoDi(tx,ty),OGGETTO.CRESCIUTA);assert.equal(modifiche.di(tx,ty).buio,undefined);
  // E una pianta riaperta che stanotte non cresce si scorda il buio lo stesso.
  modifiche.imposta(tx,ty,{oggetto:OGGETTO.SEMINATO,buio:1});
  notte(8);assert.deepEqual(modifiche.di(tx,ty),{oggetto:OGGETTO.SEMINATO});
});

test('in una radura chiusa solo da alberi e sassi l’orto cresce: è ancora campagna',()=>{
  tempo.impostaGiorno(5);
  for(const [dx,dy,o] of [[1,0,OGGETTO.ALBERO],[-1,0,OGGETTO.ALBERO],[0,1,OGGETTO.SASSO],[0,-1,OGGETTO.ALBERO]])
    modifiche.imposta(tx+dx,ty+dy,{oggetto:o});
  assert.equal(riparo.allaga(tx,ty).chiusa,true,'chiusa per il freddo');
  assert.equal(riparo.murato(tx,ty),false,'non murata per l’orto');
  modifiche.imposta(tx,ty,{oggetto:OGGETTO.GERMOGLIO,bagnato:true});
  assert.equal(notte(6).cresciute,1);
});

test('d’inverno al chiuso muore chi non regge il gelo, come fuori: non è buio',()=>{
  stanza();tempo.impostaGiorno(8);
  modifiche.imposta(tx,ty,{oggetto:OGGETTO.CRESCIUTA});
  const r=notte(9);
  assert.equal(r.appassite,1);assert.equal(r.alBuio,0);assert.equal(r.alChiuso,0);
});

test('al chiuso non si zappa e non si semina, e la pianta murata lo dice',()=>{
  tempo.impostaGiorno(1);
  inventario.aggiungi('zappa',1);
  assert.equal(azioni.azionePossibile(eroe,'zappa',0).impedito ?? null,null,'fuori si zappa');
  stanza();
  assert.equal(azioni.azionePossibile(eroe,'zappa',0).impedito,'al chiuso non arriva la luce');
  inventario.svuota();inventario.aggiungi('semi',3);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.TERRA_ZAPPATA});
  assert.equal(azioni.azionePossibile(eroe,'semi',0).impedito,'al chiuso non arriva la luce');
  assert.equal(azioni.agisci(eroe,'semi',0),null,'il seme resta in mano');assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.TERRA_ZAPPATA);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.CRESCIUTA});
  assert.match(azioni.azionePossibile(eroe,null).impedito,/seconda notte/);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.CRESCIUTA,buio:1});
  assert.equal(azioni.azionePossibile(eroe,null).impedito,'al chiuso: stanotte appassisce');
  // Aperta la stanza, la terra torna a rispondere.
  modifiche.imposta(tx-2,ty,{oggetto:OGGETTO.NESSUNO});
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.TERRA_ZAPPATA});
  assert.equal(azioni.azionePossibile(eroe,'semi',0).impedito ?? null,null);
});

test('una notte al buio si salva solo su una pianta, e vale uno',()=>{
  const stato=salvataggio.istantanea(eroe,0);
  const valida=m=>{stato.modifiche=[{tx:tx+1,ty,...m}];return salvataggio.valido(stato);};
  assert.ok(valida({oggetto:OGGETTO.CRESCIUTA,buio:1}));
  assert.ok(valida({oggetto:OGGETTO.MATURA,maturata:3,buio:1}));
  for(const storto of [2,0,true,'1'])assert.equal(valida({oggetto:OGGETTO.CRESCIUTA,buio:storto}),false,String(storto));
  assert.equal(valida({oggetto:OGGETTO.TERRA_ZAPPATA,buio:1}),false,'buio senza pianta');
});

// M7.18.15 — la casella d'orto si toglie con la X.
test('la X spiana la terra zappata e la pianta morta, estirpa quella che cresce, e non dà niente',()=>{
  for(const [cambio,verbo,frase] of [
    [{oggetto:OGGETTO.TERRA_ZAPPATA},'Spiana la terra','terra spianata'],
    [{oggetto:OGGETTO.APPASSITA,fertilita:2},'Spiana la terra','terra spianata'],
    [{oggetto:OGGETTO.GERMOGLIO,bagnato:true},'Estirpa la pianta','pianta estirpata'],
    [{oggetto:OGGETTO.SEMINATO,coltura:'lino',passo:0},'Estirpa la pianta','pianta estirpata'],
  ]) {
    inventario.svuota();modifiche.imposta(tx+1,ty,cambio);
    const x=azioni.smontaggioPossibile(eroe);
    assert.equal(x.verbo,verbo);assert.equal(x.impedito,null);
    const esito=azioni.smontaDavanti(eroe);
    assert.equal(esito.tipo,'smontato');assert.equal(esito.frase,frase);
    assert.deepEqual(modifiche.di(tx+1,ty),{oggetto:OGGETTO.NESSUNO},'torna prato: '+verbo);
    assert.deepEqual(inventario.contenuto().filter(Boolean),[],'niente in mano');
  }
});

test('il raccolto pronto non si butta con la X: prima si raccoglie',()=>{
  for(const oggetto of [OGGETTO.MATURA,OGGETTO.A_SEME]) {
    modifiche.imposta(tx+1,ty,{oggetto,maturata:1});
    assert.equal(azioni.smontaggioPossibile(eroe).impedito,'prima raccogli');
    assert.deepEqual(azioni.smontaDavanti(eroe),{tipo:'impedito',messaggio:'prima raccogli'});
    assert.equal(mappa.oggettoDi(tx+1,ty),oggetto);
  }
});

test('si spiana anche al chiuso',()=>{
  stanza();
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.CRESCIUTA,buio:1});
  assert.equal(azioni.smontaDavanti(eroe).tipo,'smontato');
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.NESSUNO);
});

test('la terra stanca spianata se lo ricorda, rizappata resta stanca, e riposa d’inverno',()=>{
  inventario.aggiungi('zappa',1);
  // Grassa: spianando si perde il bonus, e il prato non si ricorda niente.
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.TERRA_ZAPPATA,fertilita:3});
  azioni.smontaDavanti(eroe);assert.deepEqual(modifiche.di(tx+1,ty),{oggetto:OGGETTO.NESSUNO});
  // Sfinita: se lo ricorda, e la zappa non la rifà nuova.
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.APPASSITA,fertilita:0});
  azioni.smontaDavanti(eroe);assert.deepEqual(modifiche.di(tx+1,ty),{oggetto:OGGETTO.NESSUNO,fertilita:0});
  assert.equal(azioni.agisci(eroe,'zappa',0).tipo,'zappa');
  assert.deepEqual(modifiche.di(tx+1,ty),{oggetto:OGGETTO.TERRA_ZAPPATA,fertilita:0});
  // Il prato stanco riposa come il campo: un punto a primavera, e a due se lo scorda.
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.NESSUNO,fertilita:0});
  notte(13);assert.deepEqual(modifiche.di(tx+1,ty),{oggetto:OGGETTO.NESSUNO,fertilita:1});
  notte(29);assert.deepEqual(modifiche.di(tx+1,ty),{oggetto:OGGETTO.NESSUNO});
});

test('il salvataggio accetta la fertilità sul prato solo se è stanca',()=>{
  const stato=salvataggio.istantanea(eroe,0);
  const valida=m=>{stato.modifiche=[{tx:tx+1,ty,...m}];return salvataggio.valido(stato);};
  assert.ok(valida({oggetto:OGGETTO.NESSUNO,fertilita:0}));
  assert.ok(valida({oggetto:OGGETTO.NESSUNO,fertilita:1}));
  assert.equal(valida({oggetto:OGGETTO.NESSUNO,fertilita:2}),false);
  assert.equal(valida({oggetto:OGGETTO.NESSUNO,fertilita:3}),false);
});

// M7.18.16 — lo steccato e il cancello.
// Un recinto di steccato 5×5 attorno al tassello (cx,cy), a distanza dal
// superstite, con il cancello sul lato destro.
function recinto(cx,cy,cancello=OGGETTO.CANCELLO) {
  for(let y=cy-2;y<=cy+2;y++)for(let x=cx-2;x<=cx+2;x++)
    modifiche.imposta(x,y,{oggetto:Math.abs(x-cx)===2||Math.abs(y-cy)===2?OGGETTO.STECCATO:OGGETTO.NESSUNO});
  modifiche.imposta(cx+2,cy,{oggetto:cancello});
}

test('steccato e cancello si fanno al banco e si posano',()=>{
  const steccato=ricette.RICETTE.find(r=>r.id==='steccato'),cancello=ricette.RICETTE.find(r=>r.id==='cancello');
  assert.equal(steccato.banco,true);assert.equal(cancello.banco,true);
  assert.deepEqual(steccato.costo,[{cosa:'legna',quante:2},{cosa:'ramo',quante:2},{cosa:'fibra',quante:2}]);
  inventario.aggiungi('legna',5);inventario.aggiungi('ramo',4);inventario.aggiungi('fibra',4);
  assert.equal(ricette.fai(steccato,true).fatto,true);assert.equal(ricette.fai(cancello,true).fatto,true);
  inventario.svuota();inventario.aggiungi('steccato',2);
  assert.equal(azioni.agisci(eroe,'steccato',0).tipo,'posa');
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.STECCATO);
  assert.equal(mappa.solidoIn(tx+1,ty),true,'ferma i piedi');
  assert.equal(mappa.chiudeIn(tx+1,ty),false,'ma non è una parete');
  assert.equal(mappa.recintaIn(tx+1,ty),true);
});

test('il cancello si apre e si chiude come la porta, e si smonta con la X',()=>{
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.CANCELLO,colpi:2});
  assert.equal(azioni.azionePossibile(eroe,null).verbo,'Apri');
  azioni.agisci(eroe,null);
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.CANCELLO_APERTO);assert.equal(mappa.solidoIn(tx+1,ty),false);
  assert.equal(modifiche.di(tx+1,ty).colpi,2,'si tiene i colpi presi');
  entita.aggiungi({tipo:'giocatore',...pos(tx+1,ty)});
  assert.equal(azioni.azionePossibile(eroe,null).impedito,'passaggio occupato');
  entita.svuota();
  assert.equal(azioni.azionePossibile(eroe,null).verbo,'Chiudi');
  azioni.agisci(eroe,null);assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.CANCELLO);
  assert.equal(azioni.smontaggioPossibile(eroe).verbo,'Smonta il cancello');
  azioni.smontaDavanti(eroe);assert.equal(inventario.quante('cancello'),1);assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.NESSUNO);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.STECCATO});
  azioni.smontaDavanti(eroe);assert.equal(inventario.quante('steccato'),1);
});

test('un recinto è chiuso dallo steccato e dal cancello chiuso, non da un cancello aperto o da un buco',()=>{
  const cx=tx,cy=ty;assert.equal(riparo.allaga(cx,cy).chiusa,false,'campo aperto');
  recinto(cx,cy);
  assert.equal(riparo.recintato(cx,cy),true);
  assert.equal(riparo.stanzaDi(cx,cy),null,'non è una stanza');
  assert.equal(riparo.murato(cx,cy),false,'e non è murato');
  modifiche.imposta(cx+2,cy,{oggetto:OGGETTO.CANCELLO_APERTO});
  assert.equal(riparo.recintato(cx,cy),false,'cancello aperto');
  recinto(cx,cy);modifiche.imposta(cx,cy-2,{oggetto:OGGETTO.NESSUNO});
  assert.equal(riparo.recintato(cx,cy),false,'un buco');
});

test('una radura fra alberi e sassi non è un recinto',()=>{
  for(const [dx,dy,o] of [[1,0,OGGETTO.ALBERO],[-1,0,OGGETTO.ALBERO],[0,1,OGGETTO.SASSO],[0,-1,OGGETTO.ALBERO]])
    modifiche.imposta(tx+dx,ty+dy,{oggetto:o});
  assert.equal(riparo.allaga(tx,ty).chiusa,true);
  assert.equal(riparo.recintato(tx,ty),false);
});

test('l’orto dentro un recinto cresce, si bagna di pioggia, e le bestie non lo toccano finché il cancello è chiuso',()=>{
  const cx=tx,cy=ty;assert.equal(riparo.allaga(cx,cy).chiusa,false,'campo aperto');
  recinto(cx,cy);
  tempo.impostaGiorno(5);
  modifiche.imposta(cx,cy,{oggetto:OGGETTO.GERMOGLIO,bagnato:true});
  const r=notte(6);assert.equal(r.cresciute,1);assert.equal(r.alChiuso,0);
  assert.equal(meteo.coperto(cx,cy),false,'sotto il cielo');
  // Le bestie: le stesse notti del collaudo di M7.18.
  orto.impostaBestie(true);
  const pianta=()=>modifiche.imposta(cx,cy,{oggetto:OGGETTO.CRESCIUTA,fertilita:3});
  modifiche.imposta(cx+2,cy,{oggetto:OGGETTO.CANCELLO_APERTO});
  const notti=[];
  for(const giorno of [6,7,8,14,15,16]){pianta();tempo.impostaGiorno(giorno-1);if(notte(giorno).mangiate===1)notti.push(giorno);}
  assert.ok(notti.length>=1,'con il cancello aperto la bestia entra');
  modifiche.imposta(cx+2,cy,{oggetto:OGGETTO.CANCELLO});
  pianta();tempo.impostaGiorno(notti[0]-1);
  assert.equal(notte(notti[0]).mangiate,0,'recinto chiuso');
  assert.equal(mappa.oggettoDi(cx,cy),OGGETTO.CRESCIUTA);
});

test('dentro un recinto fa freddo come fuori: non è un riparo',()=>{
  const cx=tx,cy=ty;assert.equal(riparo.allaga(cx,cy).chiusa,false,'campo aperto');recinto(cx,cy);
  const dentro={...pos(cx,cy),guarda:'giu'};
  // A mezzogiorno d'inverno fa freddo solo se nevica: un giorno di neve, dal
  // calendario (da M7.18.58 non è più un giorno fisso).
  let g=9;while(g<16*30&&meteo.evento(g)!=='neve')g++;
  tempo.impostaGiorno(g);tempo.impostaOra(12);riparo.reimposta();riparo.aggiorna(1,cx,cy);
  assert.equal(riparo.alChiuso(),false);
  assert.equal(freddo.alFreddo(dentro),true);
});

test('un infetto sfonda lo steccato e il cancello chiuso in tre colpi',()=>{
  for(const oggetto of [OGGETTO.STECCATO,OGGETTO.CANCELLO]){
    entita.svuota();
    modifiche.imposta(tx+1,ty,{oggetto,colpi:2});
    entita.aggiungi({tipo:'infetto',...pos(tx+2,ty),px:(tx+2)*16+5,sfonda:true,richiamo:{x:eroe.px,y:eroe.py}});
    assert.equal(infetti.raccogliGliSfondamenti()[0]?.ceduto,true,String(oggetto));
    assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.NESSUNO);
  }
});

// M7.18.18 — il pollo e il pollaio.
// Un pollo posato davanti al superstite (tx+1,ty), preso il giorno dato.
function unPollo(giorno=tempo.giornoCorrente()) {
  inventario.aggiungi('pollo',1,giorno);
  const i=inventario.contenuto().findIndex(c=>c?.cosa==='pollo');
  return polli.libera(tx+1,ty,i);
}

test('il pollo selvatico di giorno scappa, di notte si prende a mani nude',()=>{
  tempo.impostaGiorno(5);tempo.impostaOra(12);
  assert.equal(unPollo().nelRecinto,false);
  assert.equal(azioni.azionePossibile(eroe,null).tipo,'prendiPollo');
  assert.equal(azioni.azionePossibile(eroe,null).impedito,'di giorno scappa: prendilo di notte');
  tempo.impostaOra(23);
  assert.equal(azioni.azionePossibile(eroe,null).impedito,null);
  assert.equal(azioni.agisci(eroe,null).tipo,'polloPreso');
  assert.equal(inventario.quante('pollo'),1);assert.equal(polli.tutte().length,0);
  assert.equal(inventario.contenuto().find(c=>c?.cosa==='pollo').dal,5);
});

test('nello zaino il pollo regge una notte, alla seconda muore e resta la carne',()=>{
  tempo.impostaGiorno(5);inventario.aggiungi('pollo',1,5);
  tempo.impostaGiorno(6);let r=polli.nuovoGiorno();
  assert.equal(r.avvisoZaino,1);assert.equal(inventario.quante('pollo'),1);
  tempo.impostaGiorno(7);r=polli.nuovoGiorno();
  assert.equal(r.mortiNelloZaino,1);assert.equal(inventario.quante('pollo'),0);assert.equal(inventario.quante('carne_cruda'),1);
});

test('posato in un recinto il pollo è tuo; fuori, a mezzanotte, torna selvatico',()=>{
  tempo.impostaGiorno(5);tempo.impostaOra(12);
  recinto(tx,ty);
  inventario.aggiungi('pollo',1,5);
  assert.equal(azioni.azionePossibile(eroe,'pollo',0).verbo,'Metti il pollo nel recinto');
  assert.equal(azioni.agisci(eroe,'pollo',0).nelRecinto,true);
  const p=polli.tutte()[0];assert.equal(p.domestico,true);
  assert.equal(azioni.azionePossibile(eroe,null).impedito,null,'il tuo si prende anche di giorno');
  // Il cancello resta aperto e il pollo esce: a mezzanotte non è più tuo.
  p.px=(tx+6.5)*16;p.py=(ty+0.75)*16;
  tempo.impostaGiorno(6);const r=polli.nuovoGiorno();
  assert.equal(r.scappati,1);assert.equal(p.domestico,false);
});

test('un pollo vivo non si mette in una cassa, e con G si posa invece di finire in un mucchio',()=>{
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.CASSA});
  inventario.aggiungi('pollo',1,1);
  assert.equal(contenitori.sposta(tx+1,ty,true,0).tipo,'vivo');
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.NESSUNO});
  assert.equal(azioni.getta(eroe,0).tipo,'polloLiberato');assert.equal(inventario.quante('pollo'),0);
  assert.equal(polli.tutte().length,1);
});

test('con un’arma in mano si tira il collo al pollo e resta una carne',()=>{
  tempo.impostaOra(12);unPollo();
  inventario.aggiungi('lancia',1);
  const i=inventario.contenuto().findIndex(c=>c?.cosa==='lancia');
  assert.equal(azioni.azionePossibile(eroe,'lancia',i).verbo,'Tira il collo al pollo');
  assert.equal(azioni.agisci(eroe,'lancia',i).tipo,'polloUcciso');
  assert.equal(inventario.quante('carne_cruda'),1);assert.equal(polli.tutte().length,0);
});

test('il pollaio si fa al banco, va messo in un recinto, si riempie un mangime alla volta e si smonta solo vuoto',()=>{
  const r=ricette.RICETTE.find(x=>x.id==='pollaio');
  assert.equal(r.banco,true);
  assert.deepEqual(r.costo,[{cosa:'legna',quante:4},{cosa:'fibra',quante:4},{cosa:'filo',quante:2}]);
  inventario.aggiungi('pollaio',1);
  assert.equal(azioni.azionePossibile(eroe,'pollaio',0).impedito,'il pollaio va messo in un recinto');
  recinto(tx,ty);
  assert.equal(azioni.agisci(eroe,'pollaio',0).tipo,'posa');
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.POLLAIO);
  inventario.aggiungi('semi',3);
  const i=inventario.contenuto().findIndex(c=>c?.cosa==='semi');
  assert.equal(azioni.azionePossibile(eroe,'semi',i).verbo,'Dai da mangiare (0/12)');
  assert.equal(azioni.agisci(eroe,'semi',i).mangime,1);assert.equal(inventario.quante('semi'),2);
  assert.equal(azioni.smontaggioPossibile(eroe).impedito,"c'è ancora mangime: 1/12");
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.POLLAIO});
  assert.equal(azioni.smontaggioPossibile(eroe).impedito,null);
});

// Un recinto con un pollaio a destra dell'eroe e n polli allevati dentro.
function allevamento(n,mangime) {
  recinto(tx,ty);
  modifiche.imposta(tx,ty-1,mangime?{oggetto:OGGETTO.POLLAIO,mangime}:{oggetto:OGGETTO.POLLAIO});
  for(let i=0;i<n;i++){inventario.aggiungi('pollo',1,1);const k=inventario.contenuto().findIndex(c=>c?.cosa==='pollo');polli.libera(tx-1+(i%3),ty+1,k);}
  assert.equal(polli.tutte().filter(p=>p.domestico).length,n);
}

test('un mangime per pollo a notte: un giorno senza è fame, due di fila e muore',()=>{
  tempo.impostaGiorno(5);allevamento(2,1);
  let r=(tempo.impostaGiorno(6),polli.nuovoGiorno());
  assert.equal(r.affamati,1);assert.equal(r.mortiDiFame,0);assert.equal(polli.mangimeNel(tx,ty-1),0);
  r=(tempo.impostaGiorno(7),polli.nuovoGiorno());
  assert.equal(r.mortiDiFame,1);assert.equal(r.affamati,1);assert.equal(polli.tutte().length,1);
});

test('d’inverno un pollaio ne ripara quattro, e senza pollaio muoiono tutti di freddo',()=>{
  tempo.impostaGiorno(8);allevamento(5,12);
  let r=(tempo.impostaGiorno(9),polli.nuovoGiorno());
  assert.equal(r.mortiDiFreddo,1);assert.equal(polli.tutte().length,4);
  modifiche.imposta(tx,ty-1,{oggetto:OGGETTO.NESSUNO});
  r=(tempo.impostaGiorno(10),polli.nuovoGiorno());
  assert.equal(r.mortiDiFreddo,4);assert.equal(polli.tutte().length,0);
});

test('i polli e il mangime si salvano, e il salvataggio li controlla',()=>{
  tempo.impostaGiorno(5);allevamento(2,3);
  const stato=salvataggio.istantanea(eroe,0);
  assert.equal(salvataggio.valido(stato),true);
  assert.equal(stato.polli.polli.length,2);
  polli.reimposta();
  assert.ok(salvataggio.applica(stato));
  assert.equal(polli.tutte().filter(p=>p.domestico).length,2);
  const storto=structuredClone(stato);storto.polli.polli[0].fame=5;
  assert.equal(salvataggio.valido(storto),false);
  const valida=m=>{const t=structuredClone(stato);t.modifiche=[{tx:tx+1,ty,...m}];return salvataggio.valido(t);};
  assert.ok(valida({oggetto:OGGETTO.POLLAIO,mangime:12}));
  assert.equal(valida({oggetto:OGGETTO.POLLAIO,mangime:13}),false);
  assert.equal(valida({oggetto:OGGETTO.CASSA,mangime:2}),false);
});

test('col cancello aperto il pollo posato dentro è tuo, ma se il cancello resta aperto a mezzanotte scappa',()=>{
  tempo.impostaGiorno(5);tempo.impostaOra(12);
  recinto(tx,ty,OGGETTO.CANCELLO_APERTO);
  assert.equal(riparo.recintato(tx+1,ty),false);assert.equal(riparo.dentroLoSteccato(tx+1,ty),true);
  inventario.aggiungi('pollo',1,5);
  assert.equal(azioni.azionePossibile(eroe,'pollo',0).verbo,'Metti il pollo nel recinto');
  azioni.agisci(eroe,'pollo',0);
  assert.equal(polli.tutte()[0].domestico,true);
  tempo.impostaGiorno(6);
  assert.equal(polli.nuovoGiorno().scappati,1);
  // Fuori dallo steccato, invece, scappa subito.
  polli.reimposta();modifiche.imposta(tx-2,ty,{oggetto:OGGETTO.NESSUNO});
  inventario.aggiungi('pollo',1,6);
  assert.equal(azioni.azionePossibile(eroe,'pollo',0).verbo,'Libera il pollo');
});

// M7.18.19 — uova, gallo, pulcini, pollina.
// Un recinto con pollaio sopra l'eroe; le galline e il gallo dati, posati in fila.
function pollame({galline=1,galli=0,mangime=12}={}) {
  recinto(tx,ty);
  modifiche.imposta(tx,ty-1,{oggetto:OGGETTO.POLLAIO,mangime});
  const cose=[...Array(galline).fill('pollo'),...Array(galli).fill('gallo')];
  cose.forEach((cosa,i)=>{inventario.aggiungi(cosa,1,1);const k=inventario.contenuto().findIndex(c=>c?.cosa===cosa);polli.libera(tx-1+(i%3),ty+1,k);});
}
const notteDi=(giorno)=>{tempo.impostaGiorno(giorno);return polli.nuovoGiorno();};

test('la gallina nutrita fa un uovo ogni due giorni, non d’inverno, e affamata no',()=>{
  tempo.impostaGiorno(1);pollame({galline:1,mangime:12});
  assert.equal(notteDi(2).uova,1);assert.equal(polli.uovaNel(tx,ty-1),1);
  assert.equal(notteDi(3).uova,0,'il giorno dopo no');
  assert.equal(notteDi(4).uova,1);
  modifiche.imposta(tx,ty-1,{oggetto:OGGETTO.POLLAIO});
  assert.equal(notteDi(6).uova,0,'senza mangime niente uova');
  modifiche.imposta(tx,ty-1,{oggetto:OGGETTO.POLLAIO,mangime:12});
  assert.equal(notteDi(10).uova,0,'d’inverno niente uova');
});

test('il nido tiene sei uova, e senza pollaio l’uovo è perso',()=>{
  tempo.impostaGiorno(1);pollame({galline:1});
  modifiche.imposta(tx,ty-1,{oggetto:OGGETTO.POLLAIO,mangime:12,uova:6});
  const r=notteDi(2);assert.equal(r.uova,0);assert.equal(r.uovaPerse,1);assert.equal(polli.uovaNel(tx,ty-1),6);
});

test('le uova si prendono a mani vuote, si cuociono e si mangiano',()=>{
  recinto(tx,ty);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.POLLAIO,uova:3,cova:2});
  assert.equal(azioni.azionePossibile(eroe,null).verbo,'Prendi le uova (3)');
  assert.equal(azioni.agisci(eroe,null).quante,3);
  assert.equal(inventario.quante('uovo'),3);assert.equal(polli.uovaNel(tx+1,ty),0);
  assert.equal(modifiche.di(tx+1,ty).cova,undefined,'prenderle azzera la cova');
  assert.equal(CATALOGO.uovo.cuoce,'uovo_cotto');
  assert.ok(CATALOGO.uovo_cotto.commestibile.fame>CATALOGO.uovo.commestibile.fame);
});

test('con un gallo le uova del nido si covano e alla terza notte nasce un pulcino; senza gallo no',()=>{
  tempo.impostaGiorno(1);pollame({galline:1,galli:1});
  modifiche.imposta(tx,ty-1,{oggetto:OGGETTO.POLLAIO,mangime:12,uova:2});
  notteDi(2);assert.equal(modifiche.di(tx,ty-1).cova,1);
  notteDi(3);assert.equal(modifiche.di(tx,ty-1).cova,2);
  const r=notteDi(4);assert.equal(r.nati,1);
  const pulcino=polli.tutte().find(p=>polli.pulcino(p));
  assert.ok(pulcino);assert.equal(pulcino.domestico,true);assert.equal(riparo.recintato(Math.floor(pulcino.px/16),Math.floor(pulcino.py/16)),true);
  // Senza gallo la cova non comincia.
  polli.reimposta();pollame({galline:1});
  modifiche.imposta(tx,ty-1,{oggetto:OGGETTO.POLLAIO,mangime:12,uova:2});
  notteDi(2);notteDi(3);assert.equal(notteDi(4).nati,0);
  assert.equal(modifiche.di(tx,ty-1).cova,undefined);
});

test('il pulcino cresce in quattro giorni e non si prende né si uccide',()=>{
  tempo.impostaGiorno(1);pollame({galline:0});
  polli.ripristina({attesa:30,sequenza:0,polli:[{px:(tx+1.5)*16,py:(ty+0.75)*16,domestico:true,seme:3,dx:0,dy:0,giro:0,destra:true,passo:0,fame:0,gallo:false,eta:0,deposto:null}]});
  assert.equal(azioni.azionePossibile(eroe,null).impedito,'è un pulcino: lascialo crescere');
  inventario.aggiungi('lancia',1);const i=inventario.contenuto().findIndex(c=>c?.cosa==='lancia');
  assert.equal(azioni.azionePossibile(eroe,'lancia',i).impedito,'è un pulcino: lascialo crescere');
  for(const g of [2,3,4])notteDi(g);
  assert.equal(polli.pulcino(polli.tutte()[0]),true);
  const r=notteDi(5);
  assert.equal(r.cresciuti.length,1);assert.equal(polli.pulcino(polli.tutte()[0]),false);
  assert.equal(polli.tutte()[0].gallo,true,'seme dispari: gallo');
});

test('la pollina si accumula nel pollaio, si raccoglie con la zappa e concima come la cenere',()=>{
  tempo.impostaGiorno(1);pollame({galline:1});
  for(let g=2;g<=9;g++)notteDi(g===9?9:g);
  assert.equal(polli.pollinaNel(tx,ty-1),polli.POLLINA_MASSIMA,'si ferma al massimo');
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.POLLAIO,pollina:3});
  inventario.aggiungi('zappa',1);const z=inventario.contenuto().findIndex(c=>c?.cosa==='zappa');
  assert.equal(azioni.azionePossibile(eroe,'zappa',z).verbo,'Raccogli la pollina (3)');
  assert.equal(azioni.agisci(eroe,'zappa',z).quante,3);assert.equal(inventario.quante('pollina'),3);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.TERRA_ZAPPATA,fertilita:1});
  const p=inventario.contenuto().findIndex(c=>c?.cosa==='pollina');
  assert.equal(azioni.azionePossibile(eroe,'pollina',p).verbo,'Spargi la pollina');
  azioni.agisci(eroe,'pollina',p);
  assert.equal(orto.fertilitaDi(modifiche.di(tx+1,ty)),2);assert.equal(inventario.quante('pollina'),2);
});

test('il gallo resta gallo nello zaino e nel salvataggio, e il salvataggio controlla nido e cova',()=>{
  tempo.impostaGiorno(5);tempo.impostaOra(23);
  polli.ripristina({attesa:30,sequenza:0,polli:[{px:(tx+1.5)*16,py:(ty+0.75)*16,domestico:false,seme:3,dx:0,dy:0,giro:0,destra:true,passo:0,fame:0,gallo:true,eta:null,deposto:null}]});
  assert.equal(azioni.agisci(eroe,null).gallo,true);assert.equal(inventario.quante('gallo'),1);
  assert.equal(contenitori.sposta(tx,ty,true,inventario.contenuto().findIndex(c=>c?.cosa==='gallo')).tipo,'vivo');
  recinto(tx,ty);
  const i=inventario.contenuto().findIndex(c=>c?.cosa==='gallo');
  assert.equal(azioni.azionePossibile(eroe,'gallo',i).verbo,'Metti il gallo nel recinto');
  azioni.agisci(eroe,'gallo',i);assert.equal(polli.tutte()[0].gallo,true);
  const stato=salvataggio.istantanea(eroe,0);
  polli.reimposta();salvataggio.applica(stato);assert.equal(polli.tutte()[0].gallo,true);
  const valida=m=>{const t=structuredClone(stato);t.modifiche=[{tx:tx+3,ty,...m}];return salvataggio.valido(t);};
  assert.ok(valida({oggetto:OGGETTO.POLLAIO,uova:6,cova:2,pollina:6}));
  assert.equal(valida({oggetto:OGGETTO.POLLAIO,uova:7}),false);
  assert.equal(valida({oggetto:OGGETTO.POLLAIO,cova:3}),false);
  assert.equal(valida({oggetto:OGGETTO.CASSA,pollina:1}),false);
  const storto=structuredClone(stato);storto.polli.polli[0].eta=9;assert.equal(salvataggio.valido(storto),false);
});

test('un selvatico su quattro, circa, è un gallo',()=>{
  mappa.inizializza('valle-2');const f=mappa.laFattoria();
  let galli=0,tutti=0;
  for(let d=0;d<40;d++){polli.reimposta();const e={px:(f.tx+0.5)*16+250+d*7,py:(f.ty+0.75)*16+80,guarda:'giu'};
    for(let k=0;k<6;k++)polli.aggiorna(30,e);
    for(const p of polli.tutte()){tutti++;if(p.gallo)galli++;}}
  assert.ok(tutti>=20,'ne nascono: '+tutti);
  assert.ok(galli>0 && galli<tutti/2,`galli ${galli} su ${tutti}`);
});

// M7.18.23 — i polli razzolano. Il recinto di pollame() va messo su un prato
// vero: si cerca vicino un punto con i nove tasselli d'erba o di sterpaglia.
function suUnPrato() {
  const erboso=(x,y)=>[TERRENO.ERBA,TERRENO.STERPAGLIA].includes(mappa.terrenoNaturaleDi(x,y));
  for(let r=0;r<40;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
    const x=tx+dx,y=ty+dy;let ok=true;
    for(let j=-1;j<=1&&ok;j++)for(let i=-1;i<=1&&ok;i++)ok=erboso(x+i,y+j);
    if(ok){tx=x;ty=y;eroe={...eroe,...pos(tx,ty+3)};return;}
  }
  throw new Error('nessun prato vicino');
}
const fameDi=()=>polli.tutte().filter(p=>p.domestico&&p.fame>0).length;

test("in primavera e d'estate i polli razzolano: quattro tasselli di prato sfamano un pollo",()=>{
  suUnPrato();tempo.impostaGiorno(1);
  // Due polli, pollaio vuoto, otto tasselli di prato (il nono è il pollaio).
  pollame({galline:1,galli:1,mangime:0});
  const r=notteDi(2);
  assert.equal(r.affamati,0);assert.equal(fameDi(),0);
  assert.equal(r.uova,1,'la gallina che razzola fa le uova');
  // Il pollaio lo dice a chi lo guarda.
  const guardato=azioni.azionePossibile({...eroe,...pos(tx,ty-2),guarda:'giu'},'pietra');
  assert.equal(guardato.tipo,'guardaPollaio');assert.equal(guardato.prato,2);
  // Quattro tasselli sotto le assi o zappati: il prato basta per uno solo.
  modifiche.imposta(tx-1,ty-1,{oggetto:OGGETTO.NESSUNO,pavimento:'legno'});
  modifiche.imposta(tx+1,ty-1,{oggetto:OGGETTO.NESSUNO,pavimento:'legno'});
  modifiche.imposta(tx-1,ty,{oggetto:OGGETTO.TERRA_ZAPPATA});
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.TERRA_ZAPPATA});
  assert.equal(notteDi(3).affamati,1);
  // E con il mangime nel pollaio mangia l'altro.
  modifiche.imposta(tx,ty-1,{oggetto:OGGETTO.POLLAIO,mangime:3});
  assert.equal(notteDi(4).affamati,0);assert.equal(polli.mangimeNel(tx,ty-1),2);
});

test("d'autunno e d'inverno non si razzola: si vive del mangime",()=>{
  suUnPrato();tempo.impostaGiorno(5);
  pollame({galline:1,galli:1,mangime:0});
  assert.equal(notteDi(6).affamati,2,'autunno');
  assert.equal(azioni.azionePossibile({...eroe,...pos(tx,ty-2),guarda:'giu'},null).prato,0);
  suUnPrato();polli.reimposta();tempo.impostaGiorno(9);
  pollame({galline:1,galli:1,mangime:0});
  assert.equal(notteDi(10).affamati,2,'inverno');
});

// M7.18.24 — il pulcino fuori dal recinto non passa la notte.
test('un pulcino fuori dal recinto a mezzanotte muore; dentro cresce, e un pollo adulto scappa soltanto',()=>{
  tempo.impostaGiorno(1);pollame({galline:0});
  const base={domestico:true,seme:3,dx:0,dy:0,giro:0,destra:true,passo:0,fame:0,gallo:false,deposto:null};
  polli.ripristina({attesa:30,sequenza:0,polli:[
    {...base,px:(tx+1.5)*16,py:(ty+0.75)*16,eta:0},
    {...base,px:(tx+6.5)*16,py:(ty+0.75)*16,eta:1},
    {...base,px:(tx+7.5)*16,py:(ty+0.75)*16,eta:null},
    // Un pulcino già selvatico, da un salvataggio di prima: non cresceva più.
    {...base,domestico:false,px:(tx+8.5)*16,py:(ty+0.75)*16,eta:2},
  ]});
  const r=notteDi(2);
  assert.equal(r.pulciniPersi,2);assert.equal(r.scappati,1);
  const restano=polli.tutte();
  assert.equal(restano.length,2);
  assert.equal(restano.filter(p=>polli.pulcino(p)).length,1,'quello nel recinto resta');
  assert.equal(restano.find(p=>polli.pulcino(p)).eta,1,'e cresce');
  assert.equal(restano.find(p=>!polli.pulcino(p)).domestico,false);
});

// M7.18.24 — i comandi tornano visibili.
test('la lista dei comandi nomina ogni tasto del gioco, e H la apre',()=>{
  const sorgente=readFileSync(new URL('../motore/comandi.js',import.meta.url),'utf8');
  assert.match(sorgente,/KeyH: "aiuto"/);
  assert.match(sorgente,/"suono", "indietro", "aiuto",/);
  // La lista sta in hud.js, che nel collaudo non si carica (disegna su una
  // tela): si legge dal sorgente.
  const hud=readFileSync(new URL('../interfaccia/hud.js',import.meta.url),'utf8');
  const lista=hud.slice(hud.indexOf('export const COMANDI'),hud.indexOf('export function disegnaComandi'));
  const tasti=[...lista.matchAll(/\["([^"]+)", "/g)].map(m=>m[1]);
  for(const t of ['WASD  FRECCE','MAIUSC','SPAZIO','1-8','C','E','G','X','M','TAB','V','P','H','ESC','F3'])assert.ok(tasti.includes(t),t);
  assert.match(hud,/titolo: \(\) => \["AVVIA NUOVA PARTITA", "CARICA PARTITA", "COMANDI"\]/);
  const gioco=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  assert.match(gioco,/const VOCI_TITOLO = \["nuova", "carica", "comandi"\]/);
  assert.match(gioco,/comandiAperti \|\| iniziale !== null/,'il mondo si ferma mentre si leggono');
});

// M7.18.24 — lo steccato si collega ai vicini.
test('lo steccato si disegna secondo i vicini: da solo o in fila orizzontale come prima, in verticale un palo unito',()=>{
  const alto=['................','................',...arteCose.STECCATO];
  assert.deepEqual(arteCose.steccatoVerso(false,false,false,false),alto);
  assert.deepEqual(arteCose.steccatoVerso(false,false,true,true),alto);
  const verticale=arteCose.steccatoVerso(true,true,false,false);
  assert.equal(verticale.length,16);
  // Il palo arriva ai due bordi, e non ci sono traverse ai lati.
  assert.notEqual(verticale[0][7],'.');assert.notEqual(verticale[15][7],'.');
  assert.ok(verticale.every(r=>r[0]==='.'&&r[15]==='.'));
  // L'angolo in basso a destra: palo verso sud, traverse verso est e basta.
  const angolo=arteCose.steccatoVerso(false,true,true,false);
  assert.equal(angolo[0][7],'.');assert.notEqual(angolo[15][7],'.');
  assert.notEqual(angolo[6][15],'.');assert.equal(angolo[6][0],'.');
  // Sedici disegni fissi: lo stesso vicinato dà lo stesso oggetto, che è
  // quello che cuoci() ricorda.
  assert.equal(arteCose.steccatoVerso(true,true,false,false),verticale);
});

// M7.18.25 — l'annaffiatoio.
const casellaDi=(cosa)=>inventario.contenuto().findIndex(c=>c?.cosa===cosa);
test("l'annaffiatoio si fa al banco con un secchio, due legne e due fili",()=>{
  const r=ricette.RICETTE.find(r=>r.id==='annaffiatoio');
  assert.equal(r.banco,true);
  assert.deepEqual(r.costo,[{cosa:'secchio',quante:1},{cosa:'legna',quante:2},{cosa:'filo',quante:2}]);
  inventario.aggiungi('secchio',1);inventario.aggiungi('legna',2);inventario.aggiungi('filo',2);
  assert.equal(ricette.fai(r).perche,'banco');
  assert.equal(ricette.fai(r,true).fatto,true);assert.equal(inventario.quante('annaffiatoio'),1);
  assert.equal(inventario.quante('secchio'),0);
  assert.equal(CATALOGO.annaffiatoio_pieno.durata,4);assert.equal(CATALOGO.annaffiatoio_pieno.commestibile,undefined);
  // La riparazione non c'è: si svuota, non si consuma.
  assert.equal(ricette.RICETTE.some(r=>r.ripara==='annaffiatoio_pieno'),false);
});
test("l'annaffiatoio si riempie alla riva e al pozzo, e il pozzo gelato no",()=>{
  allaRiva();inventario.aggiungi('annaffiatoio',1);
  let i=casellaDi('annaffiatoio');
  assert.equal(azioni.azionePossibile(eroe,'annaffiatoio',i).verbo,"Riempi l'annaffiatoio");
  assert.equal(azioni.agisci(eroe,'annaffiatoio',i).annaffiatoio,true);
  // Resta nella sua casella, cioè in mano, pieno.
  assert.deepEqual(inventario.contenuto()[i],{cosa:'annaffiatoio_pieno',quantita:1,usi:4});
  // Pieno del tutto non c'è niente da riempire: alla riva si beve, come con le mani vuote.
  bisogni.consuma('sete',0.5);
  assert.equal(azioni.azionePossibile(eroe,'annaffiatoio_pieno',i).tipo,'bevi');
  inventario.contenuto()[i].usi=1;
  assert.equal(azioni.azionePossibile(eroe,'annaffiatoio_pieno',i).tipo,'riempi');
  // Il pozzo, anche d'inverno; gelato no.
  reset();inventario.aggiungi('annaffiatoio',1);i=casellaDi('annaffiatoio');
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.POZZO});
  assert.equal(azioni.azionePossibile(eroe,'annaffiatoio',i).verbo,'Attingi acqua');
  assert.equal(azioni.agisci(eroe,'annaffiatoio',i).tipo,'riempi');
  assert.equal(inventario.contenuto()[i].cosa,'annaffiatoio_pieno');
  // Col gelo il pozzo è gelato, e la riva è ghiaccio.
  inventario.contenuto()[i]={cosa:'annaffiatoio',quantita:1};
  tempo.impostaGiorno(9);acqua.aggiorna();
  assert.equal(azioni.azionePossibile(eroe,'annaffiatoio',i).impedito,'il pozzo è gelato');
  allaRiva();i=casellaDi('annaffiatoio');
  assert.equal(azioni.azionePossibile(eroe,'annaffiatoio',i).impedito,'ghiaccio: cerca acqua aperta');
  tempo.impostaGiorno(1);acqua.aggiorna();
});
test("l'annaffiatoio bagna tre tasselli per gesto, quattro gesti e torna vuoto",()=>{
  tempo.impostaGiorno(1);
  inventario.aggiungi('annaffiatoio_pieno',1);const i=casellaDi('annaffiatoio_pieno');
  // Guardando a destra: il tassello davanti e i due sopra e sotto.
  for(const y of [ty-1,ty,ty+1])modifiche.imposta(tx+1,y,{oggetto:OGGETTO.TERRA_ZAPPATA});
  const gesto=azioni.azionePossibile(eroe,'annaffiatoio_pieno',i);
  assert.equal(gesto.tipo,'innaffia');assert.equal(gesto.verbo,'Innaffia (3)');
  const esito=azioni.agisci(eroe,'annaffiatoio_pieno',i);
  assert.equal(esito.quanti,3);assert.equal(esito.vuoto,false);
  for(const y of [ty-1,ty,ty+1])assert.equal(modifiche.di(tx+1,y).bagnato,true);
  assert.equal(inventario.contenuto()[i].usi,3);
  // Già bagnati: niente gesto, e niente acqua sprecata.
  assert.notEqual(azioni.azionePossibile(eroe,'annaffiatoio_pieno',i)?.tipo,'innaffia');
  // Un tassello solo da bagnare fra i tre: conta uno, ma costa lo stesso un'innaffiata.
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.TERRA_ZAPPATA});
  assert.equal(azioni.azionePossibile(eroe,'annaffiatoio_pieno',i).verbo,'Innaffia (1)');
  // Il prato non si bagna.
  modifiche.imposta(tx+1,ty-1,{oggetto:OGGETTO.NESSUNO});modifiche.imposta(tx+1,ty+1,{oggetto:OGGETTO.NESSUNO});
  assert.equal(azioni.azionePossibile(eroe,'annaffiatoio_pieno',i).verbo,'Innaffia (1)');
  for(let n=0;n<3;n++){
    modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.TERRA_ZAPPATA});
    const e=azioni.agisci(eroe,'annaffiatoio_pieno',i);
    assert.equal(e.tipo,'innaffia');assert.equal(e.vuoto,n===2);
  }
  assert.deepEqual(inventario.contenuto()[i],{cosa:'annaffiatoio',quantita:1});
  // Guardando in su il ventaglio è in orizzontale.
  inventario.contenuto()[i]={cosa:'annaffiatoio_pieno',quantita:1,usi:4};
  for(const x of [tx-1,tx,tx+1])modifiche.imposta(x,ty-1,{oggetto:OGGETTO.TERRA_ZAPPATA});
  assert.equal(azioni.agisci({...eroe,guarda:'su'},'annaffiatoio_pieno',i).quanti,3);
  for(const x of [tx-1,tx,tx+1])assert.equal(modifiche.di(x,ty-1).bagnato,true);
});
test("il promemoria dice l'acqua dell'annaffiatoio, non la durata",()=>{
  const hud=readFileSync(new URL('../interfaccia/hud.js',import.meta.url),'utf8');
  assert.match(hud,/CATALOGO\[cosaInMano\]\?\.acqua\s*\?\s*"ACQUA "/);
  assert.equal(CATALOGO.annaffiatoio_pieno.acqua,true);
});

// M7.18.25 — il grano.
test('il grano si semina in tre stagioni, cresce in quattro innaffiature e rende sei chicchi',()=>{
  tempo.impostaGiorno(1);zappato();inventario.aggiungi('grano',2);
  const i=casellaDi('grano');
  assert.equal(azioni.azionePossibile(eroe,'grano',i).verbo,'Semina');
  assert.equal(azioni.agisci(eroe,'grano',i).tipo,'semina');
  assert.deepEqual(modifiche.di(tx+1,ty),{oggetto:OGGETTO.SEMINATO,coltura:'grano',passo:0});
  const visti=[];
  for(let giorno=2;giorno<=5;giorno++){unGiorno(tx+1,ty,giorno);visti.push(modifiche.di(tx+1,ty).oggetto);}
  assert.deepEqual(visti,[OGGETTO.GERMOGLIO,OGGETTO.CRESCIUTA,OGGETTO.CRESCIUTA,OGGETTO.MATURA]);
  inventario.svuota();
  assert.equal(azioni.agisci(eroe,null).tipo,'raccolto');assert.equal(inventario.quante('grano'),6);
  // D'autunno sì, d'inverno no.
  tempo.impostaGiorno(6);zappato();inventario.aggiungi('grano',1);
  assert.equal(azioni.azionePossibile(eroe,'grano',casellaDi('grano')).impedito ?? null,null);
  tempo.impostaGiorno(10);zappato();
  assert.equal(azioni.azionePossibile(eroe,'grano',casellaDi('grano')).impedito,"d'inverno non germoglia");
});
test('il grano regge la sete, non si mangia crudo, non si guasta e nutre i polli',()=>{
  assert.equal(colture.di('grano').sete,4);assert.ok(colture.di('grano').sete>colture.di('rapa').sete);
  assert.equal(colture.di('grano').aSeme,null);assert.equal(colture.dalSeme('grano'),'grano');
  assert.equal(CATALOGO.grano.commestibile,undefined);assert.equal(CATALOGO.grano.dura,undefined);
  inventario.aggiungi('grano',1);assert.equal(azioni.consuma('grano',casellaDi('grano'))?.tipo==='consumato',false);
  assert.ok(polli.MANGIMI.has('grano'));
  recinto(tx,ty);modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.POLLAIO});
  const i=casellaDi('grano');
  assert.equal(azioni.azionePossibile(eroe,'grano',i).verbo,'Dai da mangiare (0/12)');
  assert.equal(azioni.agisci(eroe,'grano',i).tipo,'nutrito');assert.equal(polli.mangimeNel(tx+1,ty),1);
});
test('il grano ha i suoi disegni e si salva',()=>{
  const stadi=ortoArte.tuttiIDisegni().filter(d=>d.coltura==='grano').map(d=>d.stadio);
  for(const s of ['SEMINATO','GERMOGLIO','CRESCIUTA','MATURA'])assert.ok(stadi.includes(s),s);
  const stato=salvataggio.istantanea(eroe,0);
  stato.modifiche=[{tx:tx+1,ty,oggetto:OGGETTO.CRESCIUTA,coltura:'grano',passo:2}];
  assert.ok(salvataggio.valido(stato));
  inventario.aggiungi('grano',3);inventario.aggiungi('annaffiatoio_pieno',1);inventario.contenuto()[casellaDi('annaffiatoio_pieno')].usi=2;
  const salvato=salvataggio.istantanea(eroe,0);assert.ok(salvataggio.applica(salvato));
  assert.equal(inventario.quante('grano'),3);assert.equal(inventario.contenuto()[casellaDi('annaffiatoio_pieno')].usi,2);
});

// M7.18.26 — anche il cancello si gira con la fila; da M7.18.28 visto di taglio.
test('il cancello in una fila verticale si vede di taglio: lungo da palo a palo, più sottile dello steccato',()=>{
  assert.equal(arteCose.cancelloVerso(false,false,false,true,true),arteCose.CANCELLO);
  assert.equal(arteCose.cancelloVerso(true,false,false,false,false),arteCose.CANCELLO_APERTO);
  // Con vicini di fianco resta orizzontale anche se ne ha sopra o sotto.
  assert.equal(arteCose.cancelloVerso(false,true,true,true,false),arteCose.CANCELLO);
  const chiuso=arteCose.cancelloVerso(false,true,true,false,false),aperto=arteCose.cancelloVerso(true,true,false,false,false);
  assert.equal(chiuso,arteCose.CANCELLO_VERTICALE);assert.equal(aperto,arteCose.CANCELLO_VERTICALE_APERTO);
  for(const d of [chiuso,aperto]){assert.equal(d.length,16);assert.ok(d.every(r=>r.length===16));}
  // L'anta è lunga quanto quella orizzontale: dodici righe fra i due pali.
  const anta=chiuso.filter(r=>/^\.{7}w[ch]\.{7}$/.test(r)).length;
  assert.equal(anta,arteCose.CANCELLO[4].slice(2,14).length);
  // Ed è più sottile del palo dello steccato verticale.
  const pieni=(r)=>[...r].filter(c=>c!=='.').length;
  assert.ok(pieni(chiuso[8])<pieni(arteCose.steccatoVerso(true,true,false,false)[8]));
  // I pali arrivano ai due bordi, e ai lati del tassello non c'è niente.
  assert.notEqual(chiuso[0][7],'.');assert.notEqual(chiuso[15][7],'.');assert.notEqual(aperto[15][7],'.');
  for(const d of [chiuso,aperto]){assert.equal(d[8][0],'.');assert.equal(d[8][15],'.');}
  // Chiuso l'anta sbarra il passaggio; aperto in mezzo si vede la terra, e
  // l'anta sta di fianco al cardine, sottile anche lei.
  assert.notEqual(chiuso[8][7],'.');assert.equal(aperto[8][7],'.');
  assert.ok(aperto.slice(0,2).every(r=>r.slice(10)!=='......'));
  assert.ok(aperto.slice(2).every(r=>r.slice(10)==='......'));
});

// M7.18.30 — le piante selvatiche e gli orti inselvatichiti.
const SELVATICHE=[OGGETTO.SPIGHE_SELVATICHE,OGGETTO.LINO_SELVATICO,OGGETTO.CAVOLO_SELVATICO,OGGETTO.PATATA_SELVATICA,OGGETTO.FAGIOLI_SELVATICI];
const GIA_NELLA_VALLE=new Set([OGGETTO.ALBERO,OGGETTO.SASSO,OGGETTO.CESPUGLIO,OGGETTO.CASSA,OGGETTO.MURO,OGGETTO.MURO_ROTTO,
  OGGETTO.CARRO,OGGETTO.POZZO,OGGETTO.TRONCO,OGGETTO.GIACIGLIO,OGGETTO.FALO_SPENTO]);
// Dentro un luogo unico (M7.18.56) la natura lascia il posto alla torre o
// alla cava, ed è voluto: stanno solo dove prima non c'era né una casa né un
// piccolo luogo. Fuori, niente deve essersi spostato.
function inUnLuogoUnico(x,y){
  const r=generazione.rovinaNellaCella(Math.floor(x/64),Math.floor(y/64));
  return !!r?.unico&&x>=r.tx0&&x<r.tx0+r.larghezza&&y>=r.ty0&&y<r.ty0+r.altezza;
}
function valle(seme){
  generazione.preparaRovine(seme);
  let h=0,n=0;const piante=[];
  for(let y=-120;y<120;y++)for(let x=-120;x<120;x++){
    if(inUnLuogoUnico(x,y))continue;
    const t=generazione.terrenoIn(x,y,seme),o=generazione.oggettoIn(x,y,seme,t);
    if(GIA_NELLA_VALLE.has(o)){h=(Math.imul(h,31)+(x*7919+y*104729+o*13))|0;n++;}
    if(SELVATICHE.includes(o))piante.push({x,y,o,t});
  }
  return {h,n,piante};
}
test("le piante selvatiche nascono solo negli orti abbandonati, e alberi, sassi e rovine non si spostano",()=>{
  // Le impronte di alberi, sassi, cespugli e rovine misurate con la
  // generazione di M7.18.29: non si è spostato niente. Per il seme 777 è
  // rimisurata a M7.18.31, quando alcuni piccoli luoghi sono diventati orti
  // (vedi DIVENTA_ORTO in rovine.js): con DIVENTA_ORTO a zero torna quella
  // di M7.18.29, 2028556980 su 7358 oggetti. Tutte e due rimisurate a
  // M7.18.36 per i muretti e la cassa dell'orto della fattoria: senza l'annesso
  // tornano 1752206296 su 8823 e 167087167 su 7363. Da M7.18.56 si saltano
  // i tasselli dei luoghi unici (la torre, qui, per tutti e due i semi): la
  // generazione di M7.18.55, saltando gli stessi tasselli, dà esattamente
  // questi numeri. Contandoli tutti erano -1755284879 su 8831 e -187510781
  // su 7364.
  const impronte=[[12345,-1420792303,8812],[777,1305259828,7354]];
  for(const [seme,h,n] of impronte){
    const v=valle(seme);assert.equal(v.h,h,'seme '+seme);assert.equal(v.n,n,'seme '+seme);
    // Da M7.18.38 fuori dagli orti (quelli abbandonati e quello della
    // fattoria) non ce n'è nessuna: né spighe sulla sterpaglia, né lino sulla
    // riva, né cavolo sulle rocce.
    const fuori=v.piante.filter(p=>!generazione.inselvatichitaNellOrto(p.x,p.y,p.o));
    assert.deepEqual(fuori,[],'seme '+seme);
    assert.ok(v.piante.length>=8,'negli orti sì: '+v.piante.length);
  }
});
test('ogni orto abbandonato ha otto piante inselvatichite, due varietà una per fila, fra grano, lino, patate, fagioli e cavolo',()=>{
  const ammesse=[OGGETTO.SPIGHE_SELVATICHE,OGGETTO.LINO_SELVATICO,OGGETTO.PATATA_SELVATICA,OGGETTO.FAGIOLI_SELVATICI,OGGETTO.CAVOLO_SELVATICO];
  const coppie=new Set(),viste=new Set();let orti=0;
  for(let seme=1;seme<=60&&orti<30;seme++){
    generazione.preparaRovine(seme);
    for(let cy=-4;cy<=4;cy++)for(let cx=-4;cx<=4;cx++){
      const r=generazione.rovinaNellaCella(cx,cy);
      if(r?.luogo!=='orto')continue;
      orti++;
      const file={s:[],u:[]};
      for(let y=0;y<r.altezza;y++)for(let x=0;x<r.larghezza;x++){
        const segno=r.pianta[y][x];
        assert.notEqual(segno,'a','nessuna pianta morta');
        if(!file[segno])continue;
        const tx=r.tx0+x,ty=r.ty0+y;
        file[segno].push(generazione.oggettoIn(tx,ty,seme,generazione.terrenoIn(tx,ty,seme)));
      }
      assert.equal(file.s.length,4);assert.equal(file.u.length,4);
      assert.equal(new Set(file.s).size,1,'una varietà per fila');assert.equal(new Set(file.u).size,1);
      assert.notEqual(file.s[0],file.u[0],'due varietà diverse');
      for(const o of [file.s[0],file.u[0]]){assert.ok(ammesse.includes(o));viste.add(o);}
      assert.deepEqual(generazione.varietaDellOrto(r,seme),[file.s[0],file.u[0]],'sempre le stesse');
      coppie.add(file.s[0]+'-'+file.u[0]);
    }
  }
  assert.ok(orti>=6,'orti trovati: '+orti);
  assert.equal(viste.size,5,'tutte e cinque le varietà compaiono');
  assert.ok(coppie.size>=4,'coppie diverse: '+coppie.size);
});
test("le piante selvatiche danno semi d'estate e d'inverno solo la fibra, o niente",()=>{
  const raccogli=(oggetto,giorno)=>{
    tempo.impostaGiorno(giorno);inventario.svuota();
    for(let i=0;i<20;i++){
      const x=tx-40+i*2,y=ty+40;
      modifiche.imposta(x+1,y,{oggetto});
      const e={...pos(x,y),guarda:'destra'};
      assert.equal(azioni.agisci(e,null)?.tipo,'raccolto');
      assert.equal(mappa.oggettoDi(x+1,y),OGGETTO.NESSUNO);
    }
    return (cosa)=>inventario.quante(cosa);
  };
  let q=raccogli(OGGETTO.SPIGHE_SELVATICHE,2);
  assert.equal(q('fibra'),20);assert.ok(q('grano')>0&&q('grano')<40);
  q=raccogli(OGGETTO.SPIGHE_SELVATICHE,10);assert.equal(q('fibra'),20);assert.equal(q('grano'),0);
  q=raccogli(OGGETTO.LINO_SELVATICO,2);assert.equal(q('fibra'),20);assert.ok(q('semi_lino')>0);
  q=raccogli(OGGETTO.CAVOLO_SELVATICO,2);assert.ok(q('semi_cavolo')>0);
  q=raccogli(OGGETTO.CAVOLO_SELVATICO,10);assert.equal(q('semi_cavolo'),0);
  q=raccogli(OGGETTO.PATATA_SELVATICA,6);assert.ok(q('patata')>0);
  // Il verbo dice cosa si fa.
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.PATATA_SELVATICA});
  assert.equal(azioni.azionePossibile(eroe,null).verbo,'Scava la patata');
  // E il messaggio quando non c'è niente.
  const gioco=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  assert.match(gioco,/non c'era niente da prendere/);
});
test('una pianta selvatica raccolta torna il primo giorno di primavera, e si salva',()=>{
  let trovata=null;
  for(let r=1;r<80&&!trovata;r++)for(let dy=-r;dy<=r&&!trovata;dy++)for(let dx=-r;dx<=r;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
    const x=tx+dx,y=ty+dy;
    // Da M7.18.38 le piante selvatiche stanno solo negli orti: la prima di un
    // orto con davanti un tassello libero da cui raccoglierla.
    const o=mappa.oggettoGenerato(x,y);
    if(generazione.INSELVATICHITE.includes(o)&&mappa.oggettoDi(x,y)===o&&mappa.oggettoDi(x-1,y)===OGGETTO.NESSUNO){trovata={x,y,o};break;}
  }
  assert.ok(trovata,'una pianta di un orto vicino alla fattoria');
  const {x,y,o}=trovata;
  tempo.impostaGiorno(6);
  assert.equal(azioni.agisci({...pos(x-1,y),guarda:'destra'},null)?.tipo,'raccolto');
  assert.equal(mappa.oggettoDi(x,y),OGGETTO.NESSUNO);
  const stato=salvataggio.istantanea(eroe,0);assert.ok(salvataggio.applica(stato));
  assert.equal(mappa.oggettoDi(x,y),OGGETTO.NESSUNO);
  tempo.impostaGiorno(9);ricrescita.nuovoGiorno();assert.equal(mappa.oggettoDi(x,y),OGGETTO.NESSUNO,"d'inverno no");
  tempo.impostaGiorno(13);ricrescita.nuovoGiorno();assert.equal(mappa.oggettoDi(x,y),o);
});

// M7.18.31 — gli orti abbandonati si trovano.
test('gli orti abbandonati sono quasi il doppio, e la natura non cala',()=>{
  let celle=0,orti=0;
  for(const seme of ['valle-1','valle-2','valle-3','prova']){
    mappa.inizializza(seme);
    for(let cy=-10;cy<=10;cy++)for(let cx=-10;cx<=10;cx++){celle++;if(mappa.rovinaNellaCella(cx,cy)?.luogo==='orto')orti++;}
  }
  // Erano il 5,4 per cento delle celle; un quinto dei piccoli luoghi.
  const pc=100*orti/celle;
  assert.ok(pc>8&&pc<11,`orti ${pc.toFixed(1)}%`);
});
test("ogni orto abbandonato ha il suo spaventapasseri rotto: alto, non ferma e non si raccoglie",()=>{
  assert.ok(arteOggetti.SPAVENTAPASSERI_ROTTO.length>16,'più alto di un tassello');
  let visti=0;
  for(let seme=1;seme<=20&&visti<6;seme++){
    generazione.preparaRovine(seme);
    for(let cy=-4;cy<=4;cy++)for(let cx=-4;cx<=4;cx++){
      const r=generazione.rovinaNellaCella(cx,cy);
      if(r?.luogo!=='orto')continue;
      const segni=r.pianta.join('').split('p').length-1;
      assert.equal(segni,1);
      const y=r.pianta.findIndex(riga=>riga.includes('p')),x=r.pianta[y].indexOf('p');
      const tx=r.tx0+x,ty=r.ty0+y;
      assert.equal(generazione.oggettoIn(tx,ty,seme,generazione.terrenoIn(tx,ty,seme)),OGGETTO.SPAVENTAPASSERI_ROTTO);
      visti++;
    }
  }
  assert.ok(visti>=4);
  // Nella valle del gioco: non ferma, e la barra non ci fa niente.
  const r=trovaLuogo('orto'),p=segnoNelLuogo(r,'p');
  assert.equal(mappa.oggettoDi(p.tx,p.ty),OGGETTO.SPAVENTAPASSERI_ROTTO);
  assert.equal(mappa.solidoIn(p.tx,p.ty),false);
  assert.equal(azioni.azionePossibile({...pos(p.tx-1,p.ty),guarda:'destra'},null),null);
  assert.equal(azioni.smontaggioPossibile({...pos(p.tx-1,p.ty),guarda:'destra'}),null);
});
test('sulla mappa grande l\'orto abbandonato ha un segno suo, verde e più grande',()=>{
  // Da M7.18.39 la carta è vettoriale: il segno dell'orto è un cerchio verde
  // con una foglia, il più grande dei luoghi, e la legenda lo nomina.
  const sorgente=readFileSync(new URL('../interfaccia/mappa.js',import.meta.url),'utf8');
  assert.match(sorgente,/const ORTO = "#8fd16a";/);
  assert.match(sorgente,/rovina\.luogo === "orto" \? "orto"/);
  assert.match(sorgente,/cerchio\(c, x, y, 2\.6 \* u, ORTO\)/);
  assert.match(sorgente,/cerchio\(c, x, y, 2 \* u, POZZO\)/,'più grande del pozzo');
  assert.match(sorgente,/\["orto", "ORTO ABBANDONATO"\]/,'e la legenda lo dice');
});

// M7.18.32 — negli orti abbandonati le piante danno sempre.
test("negli orti abbandonati le piante danno sempre dalla primavera all'autunno; d'inverno sono secche e danno solo fibra",()=>{
  const r=trovaLuogo('orto');
  const rese={[OGGETTO.SPIGHE_SELVATICHE]:['grano',2],[OGGETTO.LINO_SELVATICO]:['semi_lino',2],[OGGETTO.PATATA_SELVATICA]:['patata',1],
    [OGGETTO.FAGIOLI_SELVATICI]:['fagioli',2],[OGGETTO.CAVOLO_SELVATICO]:['semi_cavolo',2]};
  const raccogli=(segno,giorno)=>{
    reset();tempo.impostaGiorno(giorno);
    const p=segnoNelLuogo(r,segno),o=mappa.oggettoDi(p.tx,p.ty),e={...pos(p.tx-1,p.ty),guarda:'destra'};
    modifiche.imposta(p.tx-1,p.ty,{oggetto:OGGETTO.NESSUNO});
    const verbo=azioni.azionePossibile(e,null).verbo;
    assert.equal(azioni.agisci(e,null)?.tipo,'raccolto');
    return {o,verbo};
  };
  for(const segno of ['s','u']){
    for(const giorno of [1,6,14]){
      const {o}=raccogli(segno,giorno);const [cosa,quante]=rese[o];
      assert.equal(inventario.quante(cosa),quante,`giorno ${giorno}, ${cosa}`);
    }
    // D'inverno: secca, solo una fibra, e il tasto lo dice.
    const {o,verbo}=raccogli(segno,10);
    assert.equal(verbo,'Strappa la pianta secca');
    assert.equal(inventario.quante('fibra'),1);assert.equal(inventario.quante(rese[o][0]),0);
    assert.equal(inventario.contenuto().filter(Boolean).length,1);
  }
  // Il cavolo, tornato negli orti: d'estate dà sempre i suoi due semi.
  reset();tempo.impostaGiorno(1);
  const c=segnoNelLuogo(r,'s');modifiche.imposta(c.tx,c.ty,{oggetto:OGGETTO.CAVOLO_SELVATICO});modifiche.imposta(c.tx-1,c.ty,{oggetto:OGGETTO.NESSUNO});
  assert.equal(azioni.agisci({...pos(c.tx-1,c.ty),guarda:'destra'},null)?.tipo,'raccolto');assert.equal(inventario.quante('semi_cavolo'),2);
  // Fuori dall'orto la stessa pianta d'inverno non dà semi, e il verbo è il suo.
  reset();tempo.impostaGiorno(10);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FAGIOLI_SELVATICI});
  assert.equal(azioni.azionePossibile(eroe,null).verbo,'Raccogli i fagioli');
  assert.equal(azioni.agisci(eroe,null)?.tipo,'raccolto');assert.equal(inventario.quante('fagioli'),0);
});
test("d'inverno le piante degli orti abbandonati si disegnano secche",()=>{
  assert.equal(arteOggetti.PIANTA_SECCA.length,12);assert.ok(arteOggetti.PIANTA_SECCA.every(r=>r.length===16));
  const m=readFileSync(new URL('../mondo/mappa.js',import.meta.url),'utf8');
  assert.match(m,/export function impostaOrtiSecchi/);
  assert.match(m,/ortiSecchi && inselvatichitaNellOrto\(tx, ty, oggetto\) \? oggettiArte\.PIANTA_SECCA/);
  const g=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  assert.match(g,/mappa\.impostaOrtiSecchi\(stagione === "inverno"\)/);
});

// M7.18.34 — le piante degli orti abbandonati tornano comunque.
test('in primavera le piante degli orti abbandonati tornano anche sulla terra zappata, stanca o morta, ma non sopra la tua roba',()=>{
  const r=trovaLuogo('orto');
  const posti=['s','u'].map(g=>segnoNelLuogo(r,g));
  const [a,b]=posti;
  const piantaA=mappa.oggettoGenerato(a.tx,a.ty),piantaB=mappa.oggettoGenerato(b.tx,b.ty);
  // Terra zappata e stanca in un tassello, una cassa nell'altro.
  modifiche.imposta(a.tx,a.ty,{oggetto:OGGETTO.TERRA_ZAPPATA,fertilita:0});
  modifiche.imposta(b.tx,b.ty,{oggetto:OGGETTO.CASSA});
  tempo.impostaGiorno(9);ricrescita.nuovoGiorno();
  assert.equal(mappa.oggettoDi(a.tx,a.ty),OGGETTO.TERRA_ZAPPATA,"d'inverno no");
  tempo.impostaGiorno(13);ricrescita.nuovoGiorno();
  assert.equal(mappa.oggettoDi(a.tx,a.ty),piantaA,'la pianta si riprende la terra');
  assert.equal(modifiche.di(a.tx,a.ty),undefined);
  assert.equal(mappa.oggettoDi(b.tx,b.ty),OGGETTO.CASSA,'la cassa resta');
  // Una pianta morta e una tua coltura che cresce.
  modifiche.imposta(a.tx,a.ty,{oggetto:OGGETTO.APPASSITA});
  modifiche.imposta(b.tx,b.ty,{oggetto:OGGETTO.GERMOGLIO,coltura:'grano',passo:1});
  tempo.impostaGiorno(29);ricrescita.nuovoGiorno();
  assert.equal(mappa.oggettoDi(a.tx,a.ty),piantaA);
  assert.equal(mappa.oggettoDi(b.tx,b.ty),OGGETTO.GERMOGLIO,'la tua coltura resta');
  assert.notEqual(piantaB,undefined);
  // Fuori dagli orti la terra zappata resta tua anche in primavera.
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.TERRA_ZAPPATA});
  tempo.impostaGiorno(45);ricrescita.nuovoGiorno();
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.TERRA_ZAPPATA);
});

// M7.18.36 — l'orto della fattoria di partenza: un orto abbandonato come gli
// altri, subito a sud della prima casa (in M7.18.35 erano due file nel campo).
test("la fattoria di partenza ha il suo orto abbandonato sotto la prima casa, come gli altri, sempre fagioli e patate",()=>{
  // La pianta è quella degli orti, con le due file già decise.
  const orto=LUOGHI.find(l=>l.id==='orto').pianta;
  assert.deepEqual(ORTO_DELLA_FATTORIA,orto.map(r=>r.replaceAll('s','b').replaceAll('u','q')));
  assert.equal(ORTO_DELLA_FATTORIA.join('').split('b').length-1,4);assert.equal(ORTO_DELLA_FATTORIA.join('').split('q').length-1,4);
  // La fattoria è tornata quella di prima, e sta dove stava.
  assert.equal(FATTORIA.length,8);assert.ok(FATTORIA.every(r=>r.length===20));assert.ok(!/[bq]/.test(FATTORIA.join('')));
  for(const [seme,x0,y0] of [['valle-1',1,1],['valle-3',27,16],['review',1,9],['valle-2',1,1],['inverno',30,19]]){
    mappa.inizializza(seme);const r=mappa.rovinaNellaCella(0,0);
    assert.deepEqual([r.tx0,r.ty0],[x0,y0],'fattoria di '+seme);
    // Subito a sud della prima casa, sotto le due righe di campo.
    assert.deepEqual([r.annesso.tx0,r.annesso.ty0],[x0,y0+8],'orto di '+seme);
    assert.equal(r.annesso.luogo,'orto');assert.equal(r.annesso.nome,'Orto abbandonato');
  }
  // Dalla porta sud della casa si scende sul campo e si arriva allo spaventapasseri.
  assert.equal(FATTORIA[5].slice(0,8),'####%###');assert.equal(FATTORIA[6][4],'.');assert.equal(FATTORIA[7][4],'.');
  assert.equal(ORTO_DELLA_FATTORIA[0][4],'p');
  reset();
  const r=mappa.rovinaNellaCella(0,0),a=r.annesso;
  // Il reset dei collaudi svuota i dintorni della fattoria: qui si torna al mondo.
  const posti=[];
  ORTO_DELLA_FATTORIA.forEach((riga,y)=>[...riga].forEach((c,x)=>{mappa.cambiaTassello(a.tx0+x,a.ty0+y,null);posti.push({tx:a.tx0+x,ty:a.ty0+y,c});}));
  const ATTESO={b:OGGETTO.FAGIOLI_SELVATICI,q:OGGETTO.PATATA_SELVATICA,p:OGGETTO.SPAVENTAPASSERI_ROTTO,'%':OGGETTO.MURO_ROTTO,c:OGGETTO.CASSA};
  for(const p of posti)if(ATTESO[p.c]!==undefined)assert.equal(mappa.oggettoDi(p.tx,p.ty),ATTESO[p.c],p.c+' in '+p.tx+','+p.ty);
  // È un orto abbandonato per tutti: il nome all'arrivo, la sua cassa, il suo segno sulla mappa.
  assert.equal(mappa.luogoIn(a.tx0+2,a.ty0+1)?.nome,'Orto abbandonato');
  assert.equal(mappa.luogoIn(a.tx0+4,a.ty0+a.altezza+2,3)?.nome,'Orto abbandonato');
  assert.equal(mappa.luogoIn(r.tx0+10,r.ty0+3),null,'la fattoria non è un luogo');
  const cassa=posti.find(p=>p.c==='c'),pile=contenitori.contenutoDi(cassa.tx,cassa.ty).filter(Boolean);
  const DELL_ORTO=['semi','semi_cavolo','patata','grano','fibra','zappa'];
  // Da M7.18.43 in più i semi di lino del ripiego, quando l'orto del lino è lontano.
  const altre=pile.filter(p=>p.cosa!=='semi_lino');
  assert.equal(pile.length-altre.length,mappa.linoLontano()?1:0,'il ripiego solo se serve');
  assert.ok(altre.length>=1&&altre.length<=2);for(const p of altre)assert.ok(DELL_ORTO.includes(p.cosa),p.cosa);
  assert.match(readFileSync(new URL('../interfaccia/mappa.js',import.meta.url),'utf8'),/\[trovata, trovata\.annesso\]/);
  // Le regole degli orti abbandonati.
  const fagiolo=posti.find(p=>p.c==='b'),patata=posti.find(p=>p.c==='q');
  const raccogli=(p)=>azioni.agisci({...pos(p.tx-1,p.ty),guarda:'destra'},null)?.tipo;
  // D'estate danno sempre: due fagioli e una patata, cioè i semi del primo orto.
  tempo.impostaGiorno(1);
  assert.equal(raccogli(fagiolo),'raccolto');assert.equal(raccogli(patata),'raccolto');
  assert.equal(inventario.quante('fagioli'),2);assert.equal(inventario.quante('patata'),1);
  // D'inverno sono secche: solo fibra.
  inventario.svuota();tempo.impostaGiorno(10);
  const altro=posti.filter(p=>p.c==='b')[2];
  assert.equal(azioni.azionePossibile({...pos(altro.tx-1,altro.ty),guarda:'destra'},null).verbo,'Strappa la pianta secca');
  assert.equal(raccogli(altro),'raccolto');assert.equal(inventario.quante('fibra'),1);assert.equal(inventario.quante('fagioli'),0);
  // In primavera tornano, anche sulla terra zappata.
  modifiche.imposta(patata.tx,patata.ty,{oggetto:OGGETTO.TERRA_ZAPPATA,fertilita:0});
  tempo.impostaGiorno(13);ricrescita.nuovoGiorno();
  for(const p of [fagiolo,patata,altro])assert.equal(mappa.oggettoDi(p.tx,p.ty),ATTESO[p.c]);
});

// M7.18.37 — le piante degli orti abbandonati si estraggono a ogni partita.
test("gli orti abbandonati cambiano piante a ogni partita nuova, l'orto della fattoria no, e il salvataggio se le ricorda",()=>{
  const ammesse=generazione.INSELVATICHITE;
  const orti=[];
  for(let seme=1;seme<=40&&orti.length<12;seme++){
    generazione.preparaRovine(seme);
    for(let cy=-3;cy<=3;cy++)for(let cx=-3;cx<=3;cx++){const r=generazione.rovinaNellaCella(cx,cy);if(r?.luogo==='orto')orti.push({r,seme});}
  }
  assert.ok(orti.length>=8);
  const fila=(r,seme,segno)=>{const out=[];for(let y=0;y<r.altezza;y++)for(let x=0;x<r.larghezza;x++)if(r.pianta[y][x]===segno){const tx=r.tx0+x,ty=r.ty0+y;out.push(generazione.oggettoIn(tx,ty,seme,generazione.terrenoIn(tx,ty,seme)));}return out;};
  let cambiati=0;
  for(const {r,seme} of orti){
    generazione.preparaRovine(seme);
    generazione.impostaSorteggioDegliOrti(0);const prima=generazione.varietaDellOrto(r,seme);
    const coppie=new Set();
    for(const n of [1,2,3,0xdeadbeef,123456789,4294967295]){
      generazione.impostaSorteggioDegliOrti(n);
      const v=generazione.varietaDellOrto(r,seme);
      // Sempre due varietà diverse fra le cinque, una per fila, e sempre quelle con lo stesso numero.
      assert.notEqual(v[0],v[1]);assert.ok(v.every(o=>ammesse.includes(o)));
      assert.deepEqual(generazione.varietaDellOrto(r,seme),v);
      assert.deepEqual(fila(r,seme,'s'),[v[0],v[0],v[0],v[0]]);assert.deepEqual(fila(r,seme,'u'),[v[1],v[1],v[1],v[1]]);
      coppie.add(v.join('-'));
    }
    if([...coppie].some(c=>c!==prima.join('-')))cambiati++;
    assert.ok(coppie.size>=2,'lo stesso orto cambia da una partita all\'altra');
  }
  assert.equal(cambiati,orti.length);
  // Con zero, gli orti di prima: un salvataggio vecchio si riapre com'era.
  generazione.impostaSorteggioDegliOrti(0);
  // L'orto della fattoria è sempre fagioli e patate.
  for(const n of [0,7,0xdeadbeef]){
    mappa.inizializza('review');mappa.impostaOrti(n);
    const a=mappa.rovinaNellaCella(0,0).annesso;
    for(let y=0;y<a.altezza;y++)for(let x=0;x<a.larghezza;x++){
      const c=a.pianta[y][x];if(c!=='b'&&c!=='q')continue;
      const tx=a.tx0+x,ty=a.ty0+y;
      assert.equal(generazione.oggettoIn(tx,ty,mappa.semeCorrente().valore,generazione.terrenoIn(tx,ty,mappa.semeCorrente().valore)),c==='b'?OGGETTO.FAGIOLI_SELVATICI:OGGETTO.PATATA_SELVATICA);
    }
  }
  // Il salvataggio: il numero va e torna; senza il campo si riparte da zero.
  reset();const eroe={...pos(0,0),guarda:'giu'};
  mappa.impostaOrti(2024);
  const stato=salvataggio.istantanea(eroe,0);assert.equal(stato.orti,2024);
  mappa.impostaOrti(5);assert.ok(salvataggio.applica(stato));assert.equal(mappa.sorteggioDegliOrti(),2024);
  const vecchio=structuredClone(stato);delete vecchio.orti;
  assert.ok(salvataggio.applica(vecchio));assert.equal(mappa.sorteggioDegliOrti(),0);
  assert.equal(salvataggio.valido({...stato,orti:-1}),false);assert.equal(salvataggio.valido({...stato,orti:1.5}),false);
  // Si estrae alla partita nuova, con crypto, e non per un superstite nuovo.
  const src=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  const nuova=src.slice(src.indexOf('function avviaNuovaPartita'),src.indexOf('function estraiOrti'));
  assert.match(nuova,/mappa\.impostaOrti\(/);
  assert.match(src.slice(src.indexOf('function estraiOrti'),src.indexOf('function estraiOrti')+200),/crypto\.getRandomValues/);
  const superstite=src.slice(src.indexOf('function nuovoSuperstite'),src.indexOf('function nuovoSuperstite')+3000);
  assert.doesNotMatch(superstite.slice(0,superstite.indexOf('\n}\n')),/impostaOrti|estraiOrti/);
  mappa.impostaOrti(0);
});

// M7.18.39 — la mappa grande è una carta: nitida, a misura fissa, navigabile.
test("la mappa grande ha una misura fissa, si apre su di te e si naviga con WASD, le frecce e Q/E",async()=>{
  const carta=await import('../interfaccia/mappa.js');
  // Tre livelli di zoom contati in tasselli, non in pixel né nell'esplorato:
  // la carta non cambia proporzioni esplorando.
  assert.deepEqual(carta.LIVELLI,[96,192,384]);
  carta.apri({px:(40+0.5)*16,py:(-7+0.75)*16,guarda:'giu'});
  const st=carta.stato();
  assert.equal(st.x,40.5);assert.equal(st.y,-6.25);assert.equal(st.tasselli,192);
  const sorgente=readFileSync(new URL('../interfaccia/mappa.js',import.meta.url),'utf8');
  assert.doesNotMatch(sorgente,/function ridimensiona|RESPIRO/,'niente più atlante che si allarga');
  // Disegnata su un canvas suo alla risoluzione vera dello schermo, a
  // contorni e non a quadretti.
  assert.match(sorgente,/devicePixelRatio/);assert.match(sorgente,/const PEZZI = \[/);
  assert.match(sorgente,/new Path2D\(t\.tutto\.join\(""\)\)/);
  const comandiSrc=readFileSync(new URL('../motore/comandi.js',import.meta.url),'utf8');
  assert.match(comandiSrc,/KeyQ: "allontana"/);assert.match(comandiSrc,/Equal: "avvicina"/);
  const gioco=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  assert.match(gioco,/if \(mappaAperta\) mappaGrande\.apri\(eroe\);/);
  assert.match(gioco,/mappaGrande\.naviga\(passo, eroe\);/);
  assert.match(gioco,/mappaGrande\.nascondi\(\);/);
  assert.match(gioco,/if \(!haDormito\) leggiComandi\(passo\);/);
  const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
  assert.match(css,/#carta\[hidden\]/);
});

// M7.18.40 — sulla mappa, le piante degli orti già visitati.
test("la mappa dice le piante di un orto solo dopo che lo hai visitato, e il salvataggio se lo ricorda",async()=>{
  const carta=await import('../interfaccia/mappa.js');
  reset();
  // Le piante lette per la carta sono quelle del mondo, anche col sorteggio.
  const r=trovaLuogo('orto');
  for(const n of [0,7,0xdeadbeef]){
    mappa.impostaOrti(n);
    assert.deepEqual(carta.pianteDellOrto(r),generazione.varietaDellOrto(r,mappa.semeCorrente().valore),'sorteggio '+n);
  }
  mappa.impostaOrti(0);
  const a=mappa.rovinaNellaCella(0,0).annesso;
  assert.deepEqual(carta.pianteDellOrto(a),[OGGETTO.FAGIOLI_SELVATICI,OGGETTO.PATATA_SELVATICA]);
  // Visitato o no.
  esplorato.svuota();
  assert.equal(esplorato.ortoVisto(r),false);
  esplorato.segnaOrto(r);assert.equal(esplorato.ortoVisto(r),true);assert.equal(esplorato.ortoVisto(a),false);
  // Il salvataggio.
  const eroe={...pos(0,0),guarda:'giu'};
  const stato=salvataggio.istantanea(eroe,0);assert.deepEqual(stato.ortiVisti,[`${r.tx0},${r.ty0}`]);
  esplorato.svuota();assert.ok(salvataggio.applica(stato));assert.equal(esplorato.ortoVisto(r),true);
  const vecchio=structuredClone(stato);delete vecchio.ortiVisti;
  assert.ok(salvataggio.applica(vecchio));assert.equal(esplorato.ortoVisto(r),false);
  assert.equal(salvataggio.valido({...stato,ortiVisti:['x']}),false);assert.equal(salvataggio.valido({...stato,ortiVisti:'1,2'}),false);
  // La visita la segna l'annuncio del nome dell'orto.
  const gioco=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  assert.match(gioco,/if \(luogo\?\.luogo === "orto"\) esplorato\.segnaOrto\(luogo\);/);
  const sorgente=readFileSync(new URL('../interfaccia/mappa.js',import.meta.url),'utf8');
  assert.match(sorgente,/esplorato\.ortoVisto\(rovina\) \? pianteDellOrto\(rovina\)/);
  esplorato.svuota();
});

// M7.18.41 — i segnaposti del giocatore sulla mappa.
test("sulla mappa si mettono e si tolgono segni propri, con un simbolo e un testo breve, e il salvataggio li tiene",async()=>{
  reset();esplorato.svuota();
  assert.deepEqual(esplorato.TIPI_SEGNO,['stella','pericolo','risorsa','rifugio']);
  assert.equal(esplorato.aggiungiSegno(10,20,'pericolo','infetti'),true);
  assert.equal(esplorato.aggiungiSegno(40,20,'risorsa','acqua buona e lino'),true);
  assert.equal(esplorato.aggiungiSegno(0,0,'drago','x'),false,'tipo ignoto');
  assert.deepEqual(esplorato.segni(),[{tx:10,ty:20,tipo:'pericolo',testo:'INFETTI'},{tx:40,ty:20,tipo:'risorsa',testo:'ACQUA BUONA E LI'}]);
  // Si toglie il più vicino al mirino, e solo entro il raggio.
  assert.equal(esplorato.togliSegnoVicino(25,20,3),null);
  assert.equal(esplorato.togliSegnoVicino(11,21,3).testo,'INFETTI');
  assert.equal(esplorato.segni().length,1);
  // Il salvataggio.
  const eroe={...pos(0,0),guarda:'giu'};
  const stato=salvataggio.istantanea(eroe,0);assert.equal(stato.segnaposti.length,1);
  esplorato.svuota();assert.ok(salvataggio.applica(stato));assert.equal(esplorato.segni()[0].testo,'ACQUA BUONA E LI');
  const vecchio=structuredClone(stato);delete vecchio.segnaposti;
  assert.ok(salvataggio.applica(vecchio));assert.deepEqual(esplorato.segni(),[]);
  for(const storto of [{tx:1,ty:2,tipo:'drago',testo:''},{tx:1.5,ty:2,tipo:'stella',testo:''},{tx:1,ty:2,tipo:'stella',testo:'X'.repeat(17)},{tx:1,ty:2,tipo:'stella',testo:'<b>'}]){
    assert.equal(salvataggio.valido({...stato,segnaposti:[storto]}),false,JSON.stringify(storto));
  }
  // Un tetto, perché un salvataggio non cresca senza fine.
  esplorato.svuota();
  for(let i=0;i<esplorato.SEGNI_MASSIMI;i++)assert.equal(esplorato.aggiungiSegno(i,0,'stella',''),true);
  assert.equal(esplorato.aggiungiSegno(999,0,'stella',''),false);
  esplorato.svuota();assert.deepEqual(esplorato.segni(),[]);
  // Lo spazio entra solo nelle scritture che lo chiedono.
  comandi.iniziaScrittura(16,{spazi:true});comandi.scrivi({key:'a'});comandi.scrivi({key:' '});comandi.scrivi({key:'b'});
  assert.equal(comandi.testoScritto(),'A B');comandi.fineScrittura();
  comandi.iniziaScrittura(16);comandi.scrivi({key:'a'});comandi.scrivi({key:' '});comandi.scrivi({key:'b'});
  assert.equal(comandi.testoScritto(),'AB');comandi.fineScrittura();
  // La mappa: F mette, X toglie, con il mirino al centro.
  const sorgente=readFileSync(new URL('../interfaccia/mappa.js',import.meta.url),'utf8');
  assert.match(sorgente,/comandi\.appenaPremuto\("esporta"\)/);assert.match(sorgente,/comandi\.appenaPremuto\("spegni"\)/);
  assert.match(sorgente,/mirino\(c, centro\.x, centro\.y, u\)/);assert.match(sorgente,/segnoTuo\(c, segnato\.tipo/);
  assert.match(sorgente,/F  METTI SEGNO/);
});

// --- M7.18.42: imprevisti del raccolto — canicola e parassiti ----------------

// Il primo giorno di canicola dell'anno, per il seme dei collaudi.
function primaCanicola() {
  let c=1;while(c<=16&&meteo.evento(c)!=='canicola')c++;
  assert.ok(c<=4,'la prima estate ha la sua canicola');
  return c;
}

test('ogni estate ha un giorno di canicola, fra il secondo e il quarto, e vale arido',()=>{
  const cadute=new Set();
  for(const seme of ['review','canicola','altro seme']) {
    mappa.inizializza(seme);
    for(let anno=0;anno<12;anno++) {
      const base=anno*16;
      const estate=[1,2,3,4].map(g=>meteo.evento(base+g));
      assert.equal(estate[0],'arido','il primo giorno d’estate non è mai canicola');
      assert.equal(estate.filter(e=>e==='canicola').length,1,`${seme}, anno ${anno}`);
      cadute.add(estate.indexOf('canicola')+1);
      for(let g=1;g<=4;g++)assert.ok(meteo.arido(base+g),'canicola o arido, d’estate si ha sete doppia');
      for(let g=5;g<=16;g++)assert.equal(meteo.arido(base+g),false);
    }
    // Stabile: la stessa valle ha le stesse canicole.
    const prima=[...Array(48)].map((_,i)=>meteo.evento(i+1));
    mappa.inizializza(seme);
    assert.deepEqual([...Array(48)].map((_,i)=>meteo.evento(i+1)),prima);
  }
  assert.deepEqual([...cadute].sort(),[2,3,4],'cade su tutti e tre i giorni possibili');
});

test('la notte di canicola secca subito chi non ha bevuto, e risparmia chi sì',()=>{
  const c=primaCanicola();tempo.impostaGiorno(c);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.CRESCIUTA});
  modifiche.imposta(tx+2,ty,{oggetto:OGGETTO.GERMOGLIO,bagnato:true});
  modifiche.imposta(tx+3,ty,{oggetto:OGGETTO.SEMINATO});
  // Il tasto lo dice anche alla pianta che stamattina non aveva sete.
  assert.equal(orto.seccaStanotte(modifiche.di(tx+1,ty)),true);
  assert.equal(orto.seccaStanotte(modifiche.di(tx+2,ty)),false,'innaffiata');
  assert.equal(orto.seccaStanotte(modifiche.di(tx+3,ty)),false,'il seme aspetta');
  assert.equal(azioni.azionePossibile(eroe,null).impedito,"canicola: senz'acqua stanotte secca");
  // E il giorno prima no: un giorno arido lascia la grazia di sempre.
  assert.equal(orto.seccaStanotte(modifiche.di(tx+1,ty),c-1),false);
  const esito=notte(c+1);
  assert.equal(esito.seccate,1);assert.equal(esito.assetate,0);
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.APPASSITA);
  assert.equal(mappa.oggettoDi(tx+2,ty),OGGETTO.CRESCIUTA,'chi ha bevuto cresce');
  assert.equal(mappa.oggettoDi(tx+3,ty),OGGETTO.SEMINATO);
  // Col secchio in mano il tasto innaffia, come sempre.
  tempo.impostaGiorno(c);modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.CRESCIUTA});
  for(const x of [tx+2,tx+3])modifiche.imposta(x,ty,{oggetto:OGGETTO.NESSUNO});
  inventario.aggiungi('secchio_pieno',1);
  assert.equal(azioni.azionePossibile(eroe,'secchio_pieno',0).verbo,'Innaffia');
  azioni.agisci(eroe,'secchio_pieno',0);
  assert.equal(notte(c+1).seccate,0);assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.MATURA);
});

test('la canicola si annuncia il giorno prima, il giorno stesso e all’alba',()=>{
  const hud=readFileSync(new URL('../interfaccia/hud.js',import.meta.url),'utf8');
  assert.match(hud,/canicola: "CANICOLA: INNAFFIA TUTTO"/);
  assert.match(hud,/domani === "canicola" \? "#e0704a"/,'la previsione in rosso caldo');
  const gioco=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  // Una volta al giorno e a schermo libero: la canicola è uno stato, e detta
  // a ogni fotogramma copriva per tutto il giorno ogni altra notizia.
  assert.match(gioco,/meteo\.evento\(\) === "canicola" && canicolaDetta !== tempo\.giornoCorrente\(\) && !messaggio && orto\.quante\(\) > 0\) \{\s*annuncia\("oggi canicola: chi non beve, secca", "#e0704a"\);\s*canicolaDetta = tempo\.giornoCorrente\(\);/);
  // La previsione del giorno prima dice proprio canicola.
  const c=primaCanicola();
  assert.equal(meteo.evento(c),'canicola');assert.notEqual(meteo.evento(c-1),'canicola');
});

// Una patata matura non ha sete e non va a seme: sta ferma e lascia vedere
// solo i parassiti.
function patata(x,y,giorno,extra={}) {
  modifiche.imposta(x,y,{oggetto:OGGETTO.MATURA,coltura:'patata',passo:5,maturata:giorno,...extra});
}
// Il primo giorno d'estate, d'autunno o di primavera dopo cui due notti di
// fila non scoppia niente: lì si guarda il contagio da solo.
function dueNottiTranquille() {
  for(let g=1;g<48;g++) {
    if(stagioni.stagioneDi(g)==='inverno'||stagioni.stagioneDi(g+1)==='inverno')continue;
    reset();orto.impostaParassiti(true);tempo.impostaGiorno(g);
    patata(tx-4,ty-4,g);
    const a=notte(g+1).parassitiNuovi,b=notte(g+2).parassitiNuovi;
    if(a===0&&b===0){reset();orto.impostaParassiti(true);tempo.impostaGiorno(g);return g;}
  }
  assert.fail('nessuna coppia di notti tranquille');
}

test('i parassiti passano alle quattro vicine, e la pianta infestata da una notte muore',()=>{
  const g=dueNottiTranquille();
  patata(tx+1,ty,g,{parassiti:1});     // A
  patata(tx+2,ty,g);                   // B, vicina
  patata(tx+1,ty+1,g,{sana:true});     // C, vicina ma protetta dalla cenere
  patata(tx+4,ty+3,g);                 // D, lontana
  patata(tx+3,ty,g);                   // F, vicina di B: stanotte no, B non contagia ancora
  modifiche.imposta(tx+1,ty-1,{oggetto:OGGETTO.SEMINATO}); // E, non ancora spuntata
  const prima=notte(g+1);
  assert.equal(prima.parassitiContagiate,1);assert.equal(prima.parassitiUccise,0);assert.equal(prima.parassitiNuovi,0);
  assert.equal(modifiche.di(tx+1,ty).parassiti,2);
  assert.equal(modifiche.di(tx+2,ty).parassiti,1);
  assert.equal(modifiche.di(tx+1,ty+1).parassiti,undefined);assert.equal(modifiche.di(tx+1,ty+1).sana,true);
  assert.equal(modifiche.di(tx+4,ty+3).parassiti,undefined);
  assert.equal(modifiche.di(tx+3,ty).parassiti,undefined,'un passo solo per notte');
  assert.deepEqual(modifiche.di(tx+1,ty-1),{oggetto:OGGETTO.SEMINATO});
  const seconda=notte(g+2);
  assert.equal(seconda.parassitiUccise,1);assert.equal(seconda.parassitiContagiate,1,'la F, dalla B');
  assert.equal(modifiche.di(tx+3,ty).parassiti,1);
  assert.deepEqual(modifiche.di(tx+1,ty),{oggetto:OGGETTO.APPASSITA},'morta, e la terra non si porta dietro i parassiti');
  assert.equal(modifiche.di(tx+2,ty).parassiti,2);
  assert.equal(modifiche.di(tx+1,ty+1).parassiti,undefined);
});

test('la pianta infestata lo dice al tasto, e quando muore',()=>{
  tempo.impostaGiorno(14);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.CRESCIUTA,parassiti:1,secco:1});
  assert.equal(azioni.azionePossibile(eroe,null).impedito,'parassiti: estirpa o spargi cenere','prima della sete');
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.CRESCIUTA,parassiti:2});
  assert.equal(azioni.azionePossibile(eroe,null).impedito,'parassiti: stanotte muore, estirpa o spargi cenere');
  // D'inverno il gelo li ferma, e il tasto non promette una morte che non viene.
  tempo.impostaGiorno(10);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.CRESCIUTA,coltura:'cavolo',passo:3,parassiti:2});
  assert.equal(azioni.azionePossibile(eroe,null).impedito,'parassiti: estirpa o spargi cenere');
  // La matura infestata si raccoglie: è il rimedio più semplice.
  tempo.impostaGiorno(14);patata(tx+1,ty,14,{parassiti:2});
  assert.equal(azioni.azionePossibile(eroe,null).tipo,'raccogli');
});

test('d’inverno i parassiti non scoppiano e non uccidono',()=>{
  orto.impostaParassiti(true);
  for(let anno=0;anno<4;anno++) for(const g of [10,11,12,13].map(g=>g+anno*16)) {
    tempo.impostaGiorno(g-1);
    for(let i=0;i<5;i++)modifiche.imposta(tx-2+i,ty+2,{oggetto:OGGETTO.MATURA,coltura:'cavolo',passo:4,maturata:g-1});
    modifiche.imposta(tx,ty+4,{oggetto:OGGETTO.MATURA,coltura:'cavolo',passo:4,maturata:g-1,parassiti:2});
    const esito=notte(g);
    assert.equal(esito.parassitiNuovi+esito.parassitiContagiate+esito.parassitiUccise,0,`notte ${g}`);
    assert.equal(modifiche.di(tx,ty+4).parassiti,2);
  }
});

test('lo scoppio: una notte su cinque, una pianta sola, sempre la stessa',()=>{
  orto.impostaParassiti(true);
  const campo=[];for(let y=0;y<3;y++)for(let x=0;x<3;x++)campo.push([tx-1+x,ty+2+y]);
  const semina=g=>{for(const [x,y] of campo)patata(x,y,g-1);};
  const infestate=()=>campo.filter(([x,y])=>modifiche.di(x,y).parassiti===1).map(p=>p.join(','));
  let notti=0,scoppi=[];
  for(let g=2;g<=16*10;g++) {
    if(stagioni.stagioneDi(g-1)==='inverno')continue;
    tempo.impostaGiorno(g-1);semina(g);notti++;
    const esito=notte(g);
    assert.ok(esito.parassitiNuovi<=1);
    assert.equal(infestate().length,esito.parassitiNuovi,'una pianta sola, per quante ce ne siano');
    if(esito.parassitiNuovi===1)scoppi.push({g,dove:infestate()[0]});
  }
  const frequenza=scoppi.length/notti;
  assert.ok(frequenza>0.1&&frequenza<0.3,`scoppi in ${scoppi.length} notti su ${notti}`);
  // La stessa notte nello stesso orto va sempre allo stesso modo.
  const {g,dove}=scoppi[0];
  tempo.impostaGiorno(g-1);semina(g);notte(g);
  assert.deepEqual(infestate(),[dove]);
  // E la cenere protegge: un orto tutto sano non si infesta.
  tempo.impostaGiorno(g-1);for(const [x,y] of campo)patata(x,y,g-1,{sana:true});
  assert.equal(notte(g).parassitiNuovi,0);
});

test('la cenere cura la pianta infestata e la protegge, anche sulla terra grassa; la pollina no',()=>{
  tempo.impostaGiorno(14);inventario.aggiungi('cenere',3);inventario.aggiungi('pollina',2);
  const cenere=casellaDi('cenere'),pollina=casellaDi('pollina');
  // Terra grassa: senza parassiti la cenere non servirebbe, con i parassiti sì.
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.CRESCIUTA,fertilita:3,bagnato:true,parassiti:1});
  const gesto=azioni.azionePossibile(eroe,'cenere',cenere);
  assert.equal(gesto.verbo,'Spargi la cenere sui parassiti');assert.equal(gesto.impedito,null);
  // La pollina concima e basta: sulla terra grassa non si sparge.
  assert.equal(azioni.azionePossibile(eroe,'pollina',pollina).impedito,'la terra è già grassa');
  const esito=azioni.agisci(eroe,'cenere',cenere);
  assert.equal(esito.tipo,'spargi');assert.equal(esito.cura,true);
  assert.deepEqual(modifiche.di(tx+1,ty),{oggetto:OGGETTO.CRESCIUTA,fertilita:3,bagnato:true,sana:true});
  assert.equal(inventario.quante('cenere'),2);
  // Sana resta sana: la vicina infestata non la contagia.
  modifiche.imposta(tx+2,ty,{oggetto:OGGETTO.GERMOGLIO,bagnato:true,parassiti:1});
  orto.impostaParassiti(true);notte(15);orto.impostaParassiti(false);
  assert.equal(modifiche.di(tx+1,ty).parassiti,undefined);assert.equal(modifiche.di(tx+1,ty).sana,true);
  // Sulla terra non grassa la cenere cura e concima insieme.
  tempo.impostaGiorno(14);modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.GERMOGLIO,fertilita:1,parassiti:2});
  azioni.agisci(eroe,'cenere',casellaDi('cenere'));
  assert.deepEqual(modifiche.di(tx+1,ty),{oggetto:OGGETTO.GERMOGLIO,fertilita:2,sana:true});
  // La pollina sulla terra magra concima, ma i parassiti restano.
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.GERMOGLIO,fertilita:1,parassiti:1});
  assert.equal(azioni.azionePossibile(eroe,'pollina',casellaDi('pollina')).verbo,'Spargi la pollina');
  const sparsa=azioni.agisci(eroe,'pollina',casellaDi('pollina'));
  assert.equal(sparsa.cura,false);
  assert.deepEqual(modifiche.di(tx+1,ty),{oggetto:OGGETTO.GERMOGLIO,fertilita:2,parassiti:1});
  // E all'alba del raccolto la protezione se ne va con la pianta.
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.MATURA,maturata:14,sana:true,fertilita:2});
  azioni.agisci(eroe,null);
  assert.equal(modifiche.di(tx+1,ty).sana,undefined);
});

test('estirpare la pianta infestata ferma il contagio',()=>{
  const g=dueNottiTranquille();
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.GERMOGLIO,bagnato:true,parassiti:1});
  patata(tx+2,ty,g);
  const x=azioni.smontaggioPossibile(eroe);
  assert.equal(x.verbo,'Estirpa la pianta');assert.equal(x.impedito,null);
  assert.equal(azioni.smontaDavanti(eroe).tipo,'smontato');
  assert.deepEqual(modifiche.di(tx+1,ty),{oggetto:OGGETTO.NESSUNO});
  assert.equal(notte(g+1).parassitiContagiate,0);
  assert.equal(modifiche.di(tx+2,ty).parassiti,undefined);
});

test('i parassiti e la cenere si salvano solo su una pianta, e solo com’erano',()=>{
  const stato=salvataggio.istantanea(eroe,0);
  stato.modifiche=[
    {tx:tx+1,ty,oggetto:OGGETTO.CRESCIUTA,parassiti:1},
    {tx:tx+2,ty,oggetto:OGGETTO.A_SEME,maturata:3,parassiti:2},
    {tx:tx+3,ty,oggetto:OGGETTO.GERMOGLIO,sana:true},
  ];
  assert.ok(salvataggio.valido(stato));
  for(const storto of [0,3,-1,1.5,'1',true]) {
    stato.modifiche=[{tx:tx+1,ty,oggetto:OGGETTO.CRESCIUTA,parassiti:storto}];
    assert.equal(salvataggio.valido(stato),false,String(storto));
  }
  for(const storto of [false,1,'sì']) {
    stato.modifiche=[{tx:tx+1,ty,oggetto:OGGETTO.CRESCIUTA,sana:storto}];
    assert.equal(salvataggio.valido(stato),false,String(storto));
  }
  stato.modifiche=[{tx:tx+1,ty,oggetto:OGGETTO.TERRA_ZAPPATA,parassiti:1}];
  assert.equal(salvataggio.valido(stato),false,'parassiti sulla terra nuda');
  stato.modifiche=[{tx:tx+1,ty,oggetto:OGGETTO.CESPUGLIO,sana:true}];
  assert.equal(salvataggio.valido(stato),false,'cenere su un cespuglio');
});

test('i parassiti si vedono sulla pianta, e l’alba li racconta',()=>{
  const d=decodifica(ortoArte.PARASSITI,tavolozzaDi('estate'));
  assert.equal(d.larghezza,16);assert.equal(ortoArte.PARASSITI.length,16);
  assert.ok(d.pixel.some(v=>v>0));
  const mappaSorgente=readFileSync(new URL('../mondo/mappa.js',import.meta.url),'utf8');
  assert.match(mappaSorgente,/if \(voce\.stadio && \(modifiche\.di\(tx, ty\)\?\.parassiti \?\? 0\) > 0\) \{\s*const puntini = cuoci\(ortoArte\.PARASSITI/);
  const gioco=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  for(const frase of ['i parassiti hanno ucciso delle piante: ${parassitiUccise}','i parassiti si allargano: ${parassitiContagiate}',
    "i parassiti sono nell'orto: estirpa o spargi cenere",'cenere sparsa: via i parassiti'])
    assert.ok(gioco.includes(frase),frase);
  // Il resoconto della notte li porta fino all'alba.
  const g=dueNottiTranquille();
  patata(tx+1,ty,g,{parassiti:2});patata(tx+1,ty+1,g,{parassiti:1});patata(tx+2,ty+1,g);
  tempo.impostaOra(23);simulazione.resoconto();simulazione.avanza(26);
  assert.equal(tempo.giornoCorrente(),g+1);
  const alba=simulazione.resoconto();
  assert.equal(alba.parassitiUccise,1);assert.equal(alba.parassitiContagiate,1);assert.equal(alba.parassitiNuovi,0);
});

// --- M7.18.43: il lino garantito ---------------------------------------------

// L'orto abbandonato più vicino alla partenza, cercato qui per conto proprio e
// su un raggio più largo di quello del gioco: se il gioco ne scegliesse un
// altro, o se il suo raggio non bastasse, lo si vedrebbe.
function ortoVicinoDaCapo() {
  const f=mappa.laFattoria(),px=f?.tx??0,py=f?.ty??0;
  let migliore=null,d=Infinity;
  for(let cy=Math.floor(py/64)-12;cy<=Math.floor(py/64)+12;cy++)for(let cx=Math.floor(px/64)-12;cx<=Math.floor(px/64)+12;cx++){
    const r=mappa.rovinaNellaCella(cx,cy);if(r?.luogo!=='orto')continue;
    const dd=Math.hypot(r.tx0+r.larghezza/2-px,r.ty0+r.altezza/2-py);if(dd<d){d=dd;migliore=r;}
  }
  return {orto:migliore,distanza:d};
}
function pianteDellOrto(r) {
  const viste=new Set();
  r.pianta.forEach((riga,y)=>[...riga].forEach((c,x)=>{if(c==='s'||c==='u')viste.add(mappa.oggettoDi(r.tx0+x,r.ty0+y));}));
  return viste;
}
function semiDiLinoNellaCassaDellaFattoria() {
  const a=mappa.rovinaNellaCella(0,0)?.annesso;if(!a)return 0;
  let n=0;
  a.pianta.forEach((riga,y)=>[...riga].forEach((c,x)=>{
    if(c==='c')n+=contenitori.contenutoDi(a.tx0+x,a.ty0+y).filter(p=>p?.cosa==='semi_lino').reduce((s,p)=>s+p.quantita,0);
  }));
  return n;
}

test('l’orto abbandonato più vicino alla partenza ha sempre il lino, e l’altra pianta resta a sorte',()=>{
  let sorteggio=1;
  for(let v=1;v<=40;v++){
    modifiche.svuota();mappa.inizializza('valle-'+v);
    const atteso=ortoVicinoDaCapo(),gioco=mappa.ortoPiuVicino();
    assert.deepEqual([gioco.orto.tx0,gioco.orto.ty0],[atteso.orto.tx0,atteso.orto.ty0],'valle-'+v);
    vicino(gioco.distanza,atteso.distanza);
    const altre=new Set();
    for(let s=0;s<12;s++){
      mappa.impostaOrti(sorteggio=(Math.imul(sorteggio,1664525)+1013904223)>>>0);
      const piante=pianteDellOrto(atteso.orto);
      assert.ok(piante.has(OGGETTO.LINO_SELVATICO),`valle-${v}, sorteggio ${sorteggio}`);
      assert.equal(piante.size,2,'due varietà, sempre diverse');
      for(const p of piante)if(p!==OGGETTO.LINO_SELVATICO)altre.add(p);
    }
    assert.ok(altre.size>=2,`valle-${v}: l’altra pianta cambia da una partita all’altra`);
  }
  // Gli altri orti restano al sorteggio: il lino c'è in circa due su cinque.
  mappa.inizializza('valle-1');
  const vicinissimo=mappa.ortoPiuVicino().orto;
  let orti=0,colLino=0;
  for(let s=1;s<=40;s++){
    mappa.impostaOrti(s*7919);
    for(let cy=-4;cy<=4;cy++)for(let cx=-4;cx<=4;cx++){
      const r=mappa.rovinaNellaCella(cx,cy);
      if(r?.luogo!=='orto'||(r.tx0===vicinissimo.tx0&&r.ty0===vicinissimo.ty0))continue;
      orti++;if(pianteDellOrto(r).has(OGGETTO.LINO_SELVATICO))colLino++;
    }
  }
  assert.ok(orti>=100&&colLino/orti>0.3&&colLino/orti<0.5,`lino in ${colLino} orti su ${orti}`);
});

test('se l’orto del lino è oltre 150 tasselli, la cassa dell’orto della fattoria ha tre semi di lino',()=>{
  assert.equal(mappa.LINO_ENTRO,150);
  let lontane=0,vicine=0;
  for(let v=1;v<=300;v++){
    modifiche.svuota();mappa.inizializza('valle-'+v);
    const {distanza}=mappa.ortoPiuVicino(),semi=semiDiLinoNellaCassaDellaFattoria();
    assert.equal(mappa.linoLontano(),distanza>150,'valle-'+v);
    if(!mappa.laFattoria()){assert.equal(semi,0,'senza fattoria non c’è la sua cassa');continue;}
    if(distanza>150){lontane++;assert.equal(semi,3,`valle-${v}: orto del lino a ${Math.round(distanza)}`);}
    else{vicine++;assert.equal(semi,0,`valle-${v}: orto del lino a ${Math.round(distanza)}`);}
  }
  // Una valle su quattro, circa: il ripiego c'è, ma non è la regola.
  assert.ok(lontane>40&&lontane<100&&vicine>lontane,`ripiego in ${lontane} valli su 300`);
  // Il seme dei collaudi è una valle lontana: i semi si prendono, e presi
  // restano presi.
  reset();
  assert.ok(mappa.linoLontano());
  const a=mappa.rovinaNellaCella(0,0).annesso;
  let cassa=null;a.pianta.forEach((riga,y)=>[...riga].forEach((c,x)=>{if(c==='c')cassa={tx:a.tx0+x,ty:a.ty0+y};}));
  mappa.cambiaTassello(cassa.tx,cassa.ty,null);
  const pile=contenitori.contenutoDi(cassa.tx,cassa.ty);
  assert.deepEqual(pile.filter(Boolean).at(-1),{cosa:'semi_lino',quantita:3},'dopo il bottino di sempre');
  contenitori.scrivi(cassa.tx,cassa.ty,pile.map(p=>p?.cosa==='semi_lino'?null:p));
  assert.equal(contenitori.contenutoDi(cassa.tx,cassa.ty).filter(p=>p?.cosa==='semi_lino').length,0);
});

test('il lino non è mai oltre 150 tasselli dalla partenza, in nessuna valle e in nessuna partita',()=>{
  let sorteggio=99;
  for(let v=1;v<=300;v++){
    modifiche.svuota();mappa.inizializza('valle-'+v);
    const {orto,distanza}=mappa.ortoPiuVicino();
    for(let s=0;s<3;s++){
      mappa.impostaOrti(sorteggio=(Math.imul(sorteggio,1664525)+1013904223)>>>0);
      const nellOrto=distanza<=150&&pianteDellOrto(mappa.rovinaNellaCella(Math.floor(orto.tx0/64),Math.floor(orto.ty0/64))).has(OGGETTO.LINO_SELVATICO);
      const nellaCassa=semiDiLinoNellaCassaDellaFattoria()>0;
      // L'unica eccezione è la valle senza fattoria (una su mille): lì resta l'orto più vicino all'origine.
      assert.ok(nellOrto||nellaCassa||!mappa.laFattoria(),`valle-${v}, sorteggio ${sorteggio}`);
    }
  }
  // La valle senza fattoria si misura dall'origine, dove comincia la partita.
  mappa.inizializza('valle-289');assert.equal(mappa.laFattoria(),null);
  const {orto}=mappa.ortoPiuVicino();
  assert.ok(pianteDellOrto(mappa.rovinaNellaCella(Math.floor(orto.tx0/64),Math.floor(orto.ty0/64))).has(OGGETTO.LINO_SELVATICO));
  assert.match(readFileSync(new URL('../gioco.js',import.meta.url),'utf8'),/puntoDiPartenza\(fattoria\?\.tx \?\? 0, fattoria\?\.ty \?\? 0\)/);
});

// --- M7.18.44: la luce e l'aria ------------------------------------------------

// Il modulo si chiede dentro ogni prova: così, sul codice di prima, cadono
// queste e non tutto il file.
const effettiDi=()=>import('../arte/effetti.js');

test('il colore dell’ora: rosato all’alba, caldo la sera, niente a mezzogiorno e di notte',async()=>{
  const e=await effettiDi();
  for(const ora of [0,3,9,12,15,16.4,21,23.5])assert.equal(e.coloreDellOra(ora).forza,0,'ora '+ora);
  const alba=e.coloreDellOra(6.3),sera=e.coloreDellOra(18.8);
  assert.ok(alba.forza>0.3&&alba.forza<=0.4);assert.equal(alba.colore,'rgb(255 178 132)');
  assert.ok(sera.forza>0.45&&sera.forza<=0.5);assert.equal(sera.colore,'rgb(255 146 64)');
  // Senza scalini: minuto per minuto cambia poco.
  for(let m=0;m<24*60;m++){
    const a=e.coloreDellOra(m/60).forza,b=e.coloreDellOra((m+1)/60).forza;
    assert.ok(Math.abs(a-b)<0.02,`scalino alle ${m/60}`);
  }
  // Il gioco lo stende sopra il mondo e sotto il buio.
  const gioco=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  const i=(s)=>{const k=gioco.indexOf(s);assert.ok(k>0,s);return k;};
  assert.ok(i('effetti.disegnaColoreDellOra(p, tempo.oraCorrente());')<i('disegnaBuio(secondi, chiaroDiLuna, lampo);'));
});

// Un disegno finto con getImageData: basta per contare i pixel pieni.
function disegnoFinto(righe){
  const w=righe[0].length,h=righe.length,data=new Uint8ClampedArray(w*h*4);
  righe.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.')data[(y*w+x)*4+3]=255;}));
  return {width:w,height:h,getContext:()=>({getImageData:()=>({data})})};
}
const SASSO_FINTO=["......dddd......","....ddeeeedd....","...deeeffeeed...","..deeffffffeed..","..deeffffffeed..",
  ".ddeeeffffeeedd.",".deeeeeeeeeeeed.","..dddeeeeeeddd..","....dddddddd....","......dddd......"];

test('le ombre: sotto chi cammina e sotto le cose in piedi, non sotto i muri; il sole le sposta e la notte le toglie',async()=>{
  const e=await effettiDi();
  const disegno=disegnoFinto(SASSO_FINTO),limiti=e.limitiDi(disegno);
  // Il sasso è largo quattordici pixel su sedici e finisce alla decima riga.
  assert.deepEqual(limiti,{sinistra:1,larghezza:14,sotto:9});
  assert.equal(e.limitiDi(disegno),limiti,'si conta una volta sola');
  const sasso={tipo:OGGETTO.SASSO,x:0,y:6,base:16,sprite:disegno};
  const mezzogiorno=e.ombraDi(sasso,12.5,1,limiti),mattina=e.ombraDi(sasso,8,1,limiti),sera=e.ombraDi(sasso,17,1,limiti);
  // Centrata sotto il sasso, appena sotto la sua ultima riga: la metà alta finisce dietro.
  assert.equal(mezzogiorno.dx+mezzogiorno.rx,8);assert.equal(mezzogiorno.dy+mezzogiorno.ry,11);
  assert.ok(mezzogiorno.rx*2<=14,'non più larga del sasso');
  assert.ok(mattina.dx+mattina.rx<8&&sera.dx+sera.rx>8,'la mattina a ovest, la sera a est');
  assert.ok(mattina.rx>mezzogiorno.rx&&sera.rx>mezzogiorno.rx,'più lunghe col sole basso');
  for(const o of [mezzogiorno,mattina,sera])for(const k of ['dx','dy','rx','ry'])assert.ok(Number.isInteger(o[k]),k+' intero');
  assert.equal(e.ombraDi(sasso,23,0.1,limiti),null,'di notte niente ombre del sole');
  assert.ok(e.ombraDi(sasso,20,0.5,limiti).forza<mezzogiorno.forza,'al tramonto sbiadiscono');
  assert.equal(e.ombraDi(sasso,12,1,e.limitiDi(disegnoFinto(['....','....']))),null,'un disegno vuoto non ha ombra');
  for(const tipo of [OGGETTO.MURO,OGGETTO.MURO_ROTTO,OGGETTO.PORTA,OGGETTO.STECCATO,OGGETTO.CANCELLO])
    assert.equal(e.ombraDi({tipo,x:0,y:0,base:16,sprite:{width:16,height:16}},12,1),null,'tipo '+tipo);
  // Chi cammina non si misura (il suo disegno cambia a ogni passo): impronta fissa ai piedi.
  for(const tipo of ['giocatore','infetto',undefined]){
    const o=e.ombraDi({tipo,x:0,y:0,base:24,sprite:{width:16,height:24}},12.5,1);
    assert.ok(o,'chi cammina: '+tipo);assert.equal(o.dx+o.rx,8);assert.equal(o.dy+o.ry,25);
  }
  // Il gioco le disegna prima delle cose in piedi.
  const gioco=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  assert.ok(gioco.indexOf('effetti.disegnaOmbre(p, inPiedi')<gioco.indexOf('for (const cosa of inPiedi) {'));
});

test('un’ombra sta ferma rispetto alla sua cosa mentre la vista scorre, ed è a pixel pieni',async()=>{
  // In M7.18.44 si disegnava in posizioni frazionarie mentre la cosa va sul
  // pixel intero più vicino: camminando, ombra e cosa ballavano di un pixel.
  const effetti=readFileSync(new URL('../arte/effetti.js',import.meta.url),'utf8');
  const schermo=readFileSync(new URL('../motore/schermo.js',import.meta.url),'utf8');
  assert.match(schermo,/drawImage\(immagine, Math\.round\(x - camera\.x\), Math\.round\(y - camera\.y\)\)/);
  assert.match(effetti,/Math\.round\(cosa\.x - camera\.x\) \+ o\.dx, Math\.round\(cosa\.y - camera\.y\) \+ o\.dy/);
  assert.doesNotMatch(effetti,/p\.ellipse\(/,'niente ovali sfumati');
  // Per ogni scarto della vista, la distanza fra cosa e ombra sullo schermo è la stessa.
  const e=await effettiDi();
  const cosa={tipo:OGGETTO.SASSO,x:176,y:134,base:144,sprite:disegnoFinto(SASSO_FINTO)};
  const o=e.ombraDi(cosa,15.3,1,e.limitiDi(cosa.sprite));
  const scarti=new Set();
  for(let c=0;c<3;c+=0.07){const cosaX=Math.round(cosa.x-c),ombraX=Math.round(cosa.x-c)+o.dx;scarti.add(ombraX-cosaX);}
  assert.equal(scarti.size,1);
});

test('la fiamma trema nel disegno, e la luce vera resta quella del catalogo',async()=>{
  const e=await effettiDi();e.imposta(true);
  const fuoco={x:120,y:88,raggio:64},altro={x:300,y:40,raggio:64};
  const valori=[];for(let t=0;t<20;t+=0.05)valori.push(e.tremolio(fuoco,t));
  assert.ok(Math.min(...valori)>0.88&&Math.max(...valori)<1.12);
  assert.ok(Math.max(...valori)-Math.min(...valori)>0.1,'trema davvero');
  assert.equal(e.tremolio(fuoco,3.2),e.tremolio({...fuoco},3.2),'stesso posto, stessa fiamma');
  assert.notEqual(e.tremolio(fuoco,3.2),e.tremolio(altro,3.2),'due fuochi non tremano insieme');
  assert.equal(e.tremolio({x:1,y:2,inMano:true},5),e.tremolio({x:90,y:7,inMano:true},5),'la torcia in mano non cambia ritmo camminando');
  e.imposta(false);assert.equal(e.tremolio(fuoco,3.2),1,'spenti, niente tremolio');e.imposta(true);
  // Il tremolio passa al buio come scala del disegno, e non tocca la luce.
  const buio=readFileSync(new URL('../motore/oscurita.js',import.meta.url),'utf8');
  assert.match(buio,/const raggio = luce\.raggio \* tremolio\(luce\);/);
  assert.doesNotMatch(buio,/luce\.raggio\s*=[^=]/);
  const gioco=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  assert.match(gioco,/\(luce\) => effetti\.tremolio\(luce, secondi\)/);
  assert.ok(gioco.indexOf('disegnaBuio(secondi, chiaroDiLuna, lampo);')<gioco.indexOf('effetti.disegnaBagliori(p, camera, lumi, luce, secondi);'),'il calore sopra il buio');
  // Il calore a metà di M7.18.44, che faceva la notte troppo chiara.
  assert.match(readFileSync(new URL('../arte/effetti.js',import.meta.url),'utf8'),/const CALORE = \{ pozza: 0\.2, bordo: 0\.1, cuore: 0\.3 \};/);
});

test('fumo e scintille: il falò fa tutti e due, la torcia solo scintille, e c’è un tetto',async()=>{
  const e=await effettiDi();e.imposta(true);
  const corri=(lumi,secondi,da=0)=>{for(let t=da;t<=da+secondi;t+=1/60)e.aggiorna(t,lumi);return da+secondi;};
  e.seminaParticelle(7);
  corri([{x:100,y:100,raggio:64,intensita:1}],3);
  // Circa tre scintille vive per volta (tre al secondo, un secondo di vita) e
  // qualche sbuffo di fumo, che dura di più.
  assert.ok(e.quanteParticelle('scintilla')>=2&&e.quanteParticelle('fumo')>=3,`scintille ${e.quanteParticelle('scintilla')}, fumo ${e.quanteParticelle('fumo')}`);
  e.seminaParticelle(7);
  corri([{x:100,y:100,raggio:46,intensita:0.9,inMano:true}],3);
  assert.ok(e.quanteParticelle('scintilla')>0);assert.equal(e.quanteParticelle('fumo'),0,'la torcia non fuma');
  e.seminaParticelle(7);
  const trenta=[...Array(30)].map((_,i)=>({x:i*20,y:50,raggio:80}));
  const fine=corri(trenta,10);
  assert.ok(e.quanteParticelle()<=260,'tetto');
  // Spento il fuoco, fumo e scintille finiscono.
  corri([],6,fine);assert.equal(e.quanteParticelle(),0);
  // Effetti spenti: niente particelle.
  e.imposta(false);corri([{x:0,y:0,raggio:64}],2);assert.equal(e.quanteParticelle(),0);e.imposta(true);
});

test('l’acqua luccica solo a metà giornata in primavera e d’estate, rada, e solo sull’acqua',async()=>{
  const e=await effettiDi();e.imposta(true);
  const q={sinistra:0,sopra:0,destra:384,sotto:216};
  // Il sole sull'acqua: dalle dieci alle sedici, con mezz'ora per accendersi e spegnersi.
  assert.equal(e.soleSullAcqua(12,'estate'),1);assert.equal(e.soleSullAcqua(13,'primavera'),1);
  assert.equal(e.soleSullAcqua(10,'estate'),0.5);assert.equal(e.soleSullAcqua(16,'primavera'),0.5);
  for(const [ora,stagione] of [[9.5,'estate'],[8,'estate'],[16.5,'primavera'],[18,'estate'],[12,'autunno'],[12,'inverno']])
    assert.equal(e.soleSullAcqua(ora,stagione),0,`${ora} ${stagione}`);
  let chieste=0;const sempre=()=>{chieste++;return true;};
  let visti=0,campioni=0;
  for(let t=0;t<30;t+=0.1){const l=e.luccichii(q,t,{ora:12,stagione:'estate'},sempre);visti+=l.length;campioni++;
    for(const p of l){assert.ok(p.forza>=0&&p.forza<=1);}
  }
  // Su una vista tutta d'acqua sei o sette per volta: la metà di M7.18.44.
  const media=visti/campioni;
  assert.ok(media>4&&media<10,`luccichii per fotogramma: ${media.toFixed(1)}`);
  assert.ok(chieste/campioni<24*14*0.15,'la domanda sull’acqua solo ai candidati');
  assert.equal(e.luccichii(q,2,{ora:12,stagione:'estate'},()=>false).length,0,'sulla terra niente');
  for(const stato of [{ora:17,stagione:'estate'},{ora:12,stagione:'autunno'},{ora:12,stagione:'inverno'},{ora:23,stagione:'estate'}])
    assert.equal(e.luccichii(q,2,stato,sempre).length,0,JSON.stringify(stato));
  // Alle dieci il lampo è a metà forza.
  let forte=0;for(let t=0;t<30;t+=0.1)for(const p of e.luccichii(q,t,{ora:10,stagione:'primavera'},sempre))forte=Math.max(forte,p.forza);
  assert.ok(forte<=0.5+1e-9&&forte>0.4);
  // Un luccichio sta dentro il suo tassello.
  for(let t=0;t<3;t+=0.1)for(const p of e.luccichii(q,t,{ora:12,stagione:'estate'},sempre)){assert.ok(p.x%16>=3&&p.x%16<=12&&p.y%16>=3&&p.y%16<=12);}
});

test('le lucciole: solo nelle notti d’estate, all’aperto e senza pioggia, ferme nel mondo',async()=>{
  const e=await effettiDi();e.imposta(true);
  const q={sinistra:0,sopra:0,destra:384,sotto:216};
  const estate={stagione:'estate',luce:0.1};
  // Sei per volta su tutta la vista, la metà di M7.18.44.
  let quante=0,campioni=0;for(let t=0;t<60;t+=0.25){quante+=e.lucciole(q,t,estate).length;campioni++;}
  const media=quante/campioni;
  assert.ok(media>3&&media<9,`lucciole per fotogramma: ${media.toFixed(1)}`);
  for(const stato of [{stagione:'autunno',luce:0.1},{stagione:'estate',luce:0.9},{...estate,alChiuso:true},{...estate,piove:true}])
    assert.equal(e.lucciole(q,4,stato).length,0,JSON.stringify(stato));
  // Spostando la vista di poco, quelle che restano in vista sono le stesse.
  const a=e.lucciole(q,7,estate),b=e.lucciole({sinistra:10,sopra:6,destra:394,sotto:222},7,estate);
  const chiave=(l)=>`${l.x.toFixed(3)},${l.y.toFixed(3)}`;
  const inB=new Set(b.map(chiave));
  const dentro=a.filter(l=>l.x>=10+60&&l.x<=384-60&&l.y>=6+60&&l.y<=216-60);
  assert.ok(dentro.every(l=>inB.has(chiave(l))));
});

test('gli effetti si accendono e si spengono con L, e la scelta resta nel browser',async()=>{
  const e=await effettiDi();
  const archivio=new Map();const prima=globalThis.localStorage;
  globalThis.localStorage={getItem:(k)=>archivio.get(k)??null,setItem:(k,v)=>archivio.set(k,v)};
  try{
    e.imposta(true);assert.equal(e.attivi(),true);assert.equal(archivio.get('ultimo-raccolto/effetti'),'accesi');
    assert.equal(e.alterna(),false);assert.equal(archivio.get('ultimo-raccolto/effetti'),'spenti');
    assert.equal(e.coloreDellOra(18.8).forza>0,true,'il conto resta, è il disegno che si spegne');
    assert.equal(e.alterna(),true);
  }finally{globalThis.localStorage=prima;e.imposta(true);}
  assert.match(readFileSync(new URL('../motore/comandi.js',import.meta.url),'utf8'),/KeyL: "luci"/);
  const hud=await import('../interfaccia/hud.js');
  assert.ok(hud.COMANDI.some(([t,c])=>t==='L'&&/EFFETTI DI LUCE/.test(c)));
  const gioco=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  assert.match(gioco,/comandi\.appenaPremuto\("luci"\)[\s\S]{0,80}effetti\.alterna\(\)/);
  assert.match(readFileSync(new URL('../sw.js',import.meta.url),'utf8'),/"\.\/arte\/effetti\.js"/);
});

// --- M7.18.46: il vento --------------------------------------------------------

test('il vento: a raffiche, sempre da ovest, più forte con la pioggia, e passa da un albero all’altro',async()=>{
  const e=await effettiDi();
  let prima=e.vento(0,'sereno'),sereno=0,pioggia=0,n=0;
  for(let t=0;t<600;t+=0.1){
    const v=e.vento(t,'sereno');
    assert.ok(v>=0&&v<=1.0001,`sereno ${v}`);
    assert.ok(Math.abs(v-prima)<0.02,'cambia piano');prima=v;
    const w=e.vento(t,'pioggia');assert.ok(w>=0&&w<=1.61);
    sereno+=v;pioggia+=w;n++;
    // Sempre sottovento: non piega mai controvento.
    assert.ok(e.piega(v,t,t*37%400,50)>=0);
  }
  assert.ok(pioggia>sereno*1.4,'con la pioggia tira di più');
  // L'onda corre: due alberi lontani non piegano insieme.
  let diversi=0;for(let t=0;t<30;t+=0.5)if(Math.abs(e.piega(1,t,0,0)-e.piega(1,t,100,0))>0.1)diversi++;
  assert.ok(diversi>20);
});

test('alberi, cespugli e piante selvatiche piegano la parte alta di pixel interi; il tronco e il resto stanno fermi',async()=>{
  const e=await effettiDi();e.imposta(true);
  const albero={tipo:OGGETTO.ALBERO,x:0,y:0,base:23,sprite:{width:16,height:23}};
  const fasce=e.fasceMosse(albero,1.2);
  assert.deepEqual(fasce.map(f=>[f[0],f[1]]),[[0,8],[8,15],[15,23]],'chioma in due fasce, tronco fermo');
  assert.deepEqual(fasce.map(f=>f[2]),[2,1,0]);
  assert.deepEqual(e.fasceMosse(albero,5).map(f=>f[2]),[2,1,0],'al più due pixel');
  assert.deepEqual(e.fasceMosse(albero,0).map(f=>f[2]),[0,0,0]);
  const cespuglio={tipo:OGGETTO.CESPUGLIO,x:0,y:0,base:12,sprite:{width:16,height:12}};
  assert.deepEqual(e.fasceMosse(cespuglio,3),[[0,6,1],[6,12,0]],'un cespuglio al più un pixel');
  for(const tipo of [OGGETTO.SPIGHE_SELVATICHE,OGGETTO.LINO_SELVATICO,OGGETTO.CAVOLO_SELVATICO,OGGETTO.PATATA_SELVATICA,OGGETTO.FAGIOLI_SELVATICI])
    assert.ok(e.fasceMosse({tipo,sprite:{width:16,height:16}},1),'tipo '+tipo);
  for(const tipo of [OGGETTO.SASSO,OGGETTO.CASSA,OGGETTO.MURO,OGGETTO.SPAVENTAPASSERI,'giocatore',undefined])
    assert.equal(e.fasceMosse({tipo,sprite:{width:16,height:16}},1),null,'fermo: '+tipo);
  // Col tempo sereno la chioma si muove a raffiche, non sempre; con la pioggia di più.
  const quota=(evento)=>{let mossi=0,n=0;for(let t=0;t<120;t+=0.1){n++;if(e.fasceMosse(albero,e.piega(e.vento(t,evento),t,0,23))[0][2]>0)mossi++;}return mossi/n;};
  const sereno=quota('sereno'),pioggia=quota('pioggia');
  assert.ok(sereno>0.25&&sereno<0.6,`sereno ${sereno.toFixed(2)}`);assert.ok(pioggia>sereno);
  // Il disegno a fasce copre tutte le righe, una volta sola, alla posizione arrotondata come quella del gioco.
  const chiamate=[];const p={drawImage:(...a)=>chiamate.push(a)};
  assert.equal(e.disegnaMosso(p,albero,100.4,{x:10.7,y:3.2},0,1),true);
  const righe=chiamate.map(c=>[c[2],c[2]+c[4]]);assert.deepEqual(righe,[[0,8],[8,15],[15,23]]);
  for(const c of chiamate){assert.equal(c[6]-c[2],Math.round(0-3.2)+0*0);assert.ok(Number.isInteger(c[5]));}
  assert.equal(chiamate.at(-1)[5],Math.round(100.4-10.7),'il tronco dove sta il disegno');
  assert.equal(e.disegnaMosso(p,{tipo:OGGETTO.SASSO,sprite:{width:16,height:10}},0,{x:0,y:0},0,1),false,'il resto lo disegna il gioco');
  e.imposta(false);assert.equal(e.disegnaMosso(p,albero,0,{x:0,y:0},0,1),false,'spenti, fermi');e.imposta(true);
  const gioco=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  assert.match(gioco,/if \(!effetti\.disegnaMosso\(p, cosa, x, camera, secondi, aria\)\) schermo\.disegna\(cosa\.sprite, x, cosa\.y\);/);
});

test('i ciuffi d’erba: uno ogni quattro tasselli di prato libero, e si chiede il prato solo a quelli',async()=>{
  const e=await effettiDi();e.imposta(true);
  const q={sinistra:0,sopra:0,destra:384,sotto:216};
  let chieste=0;const prato=()=>{chieste++;return true;};
  const lista=e.ciuffi(q,3,1,prato),tasselli=24*15;
  assert.ok(lista.length>tasselli*0.18&&lista.length<tasselli*0.32,`ciuffi ${lista.length}`);
  assert.equal(chieste,lista.length,'solo ai candidati');
  for(const c of lista){assert.ok(c.x%16>=3&&c.x%16<=12&&c.y%16>=6&&c.y%16<=14);assert.ok(c.piega>=0&&c.piega<=2);assert.ok(c.alto===3||c.alto===4);}
  assert.deepEqual(e.ciuffi(q,3,1,()=>true).map(c=>[c.x,c.y]),lista.map(c=>[c.x,c.y]),'stanno fermi al loro posto');
  assert.equal(e.ciuffi(q,3,1,()=>false).length,0,'niente fuori dal prato');
  // Piegano col vento: senza vento dritti, con la raffica piegati.
  assert.ok(e.ciuffi(q,3,0,()=>true).every(c=>c.piega===0));
  assert.ok(e.ciuffi(q,3,1.5,()=>true).some(c=>c.piega>0));
  const gioco=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  assert.match(gioco,/mappa\.terrenoDi\(tx, ty\) === TERRENO\.ERBA && mappa\.oggettoDi\(tx, ty\) === OGGETTO\.NESSUNO/);
  const i=(s)=>{const k=gioco.indexOf(s);assert.ok(k>0,s);return k;};
  assert.ok(i('effetti.disegnaCiuffi(')<i('effetti.disegnaOmbre(')&&i('effetti.disegnaOmbre(')<i('for (const cosa of inPiedi) {'));
});

test('d’autunno cadono le foglie, e il vento le porta; il fumo va col vento',async()=>{
  const e=await effettiDi();e.imposta(true);
  const alberi=[0,1,2,3,4].map(i=>({tipo:OGGETTO.ALBERO,x:i*40,y:0,base:23,sprite:{width:16,height:23}}));
  const corri=(secondi,opzioni,da=0)=>{for(let t=da;t<=da+secondi;t+=1/30)e.aggiorna(t,[],opzioni);return da+secondi;};
  e.seminaParticelle(3);corri(20,{alberi,stagione:'estate',aria:1});
  assert.equal(e.quanteParticelle('foglia'),0,'d’estate no');
  e.seminaParticelle(3);let t=corri(20,{alberi,stagione:'autunno',aria:1});
  const quante=e.quanteParticelle('foglia');assert.ok(quante>=3&&quante<=60,`foglie ${quante}`);
  // Tante foglie, ma un tetto.
  const bosco=[...Array(40)].map((_,i)=>({tipo:OGGETTO.ALBERO,x:i*20,y:0,base:23,sprite:{width:16,height:23}}));
  t=corri(40,{alberi:bosco,stagione:'autunno',aria:1.6},t);assert.ok(e.quanteParticelle('foglia')<=60);
  // Senza alberi in vista cadono, si posano e spariscono.
  corri(30,{alberi:[],stagione:'autunno',aria:1},t);assert.equal(e.quanteParticelle('foglia'),0);
  // Il fumo: col vento finisce sottovento.
  const fuoco=[{x:100,y:100,raggio:64}];
  const media=(aria)=>{e.seminaParticelle(9);for(let s=0;s<=6;s+=1/30)e.aggiorna(s,fuoco,{aria});return e.posizioniParticelle('fumo').reduce((a,p)=>a+p.x,0)/e.quanteParticelle('fumo');};
  assert.ok(media(1.5)>media(0)+3,'il vento porta il fumo a est');
  const gioco=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  assert.ok(gioco.indexOf('effetti.disegnaFoglie(p, camera);')<gioco.indexOf('disegnaBuio(secondi, chiaroDiLuna, lampo);'));
});

// --- M7.18.47: il secondo livello grafico, terreno e alberi ---------------------

test('il terreno è a pixel pieni: sei varianti per terreno, più toni, e nessuna figura sul bordo',async()=>{
  const terreno=await import('../arte/sprite-terreno.js');
  const BASE={ERBA:'7',STERPAGLIA:'9',SABBIA:'5',TERRA:'b',ROCCIA:'e'};
  const NUOVE={ERBA:['P','Q'],STERPAGLIA:['R','S'],SABBIA:['T','U'],TERRA:['V','W'],ROCCIA:['X','Y']};
  for(const [nome,base] of Object.entries(BASE)){
    const varianti=terreno[nome];
    assert.equal(varianti.length,6,nome);
    const toni=new Set();
    for(const v of varianti){
      assert.equal(v.length,16);assert.ok(v.every(r=>r.length===16));
      for(const r of v)for(const c of r){assert.ok(c in TAVOLOZZA,`${nome}: ${c}`);toni.add(c);}
      // Il bordo è tutto del colore di fondo: affiancati, i tasselli non si cuciono.
      const bordo=v[0]+v[15]+v.map(r=>r[0]+r[15]).join('');
      assert.equal(new Set(bordo).size,1,nome);assert.equal(bordo[0],base);
      // Non più a blocchi di due: le righe non vanno a coppie uguali.
      let coppie=0;for(let y=0;y<16;y+=2)if(v[y]===v[y+1])coppie++;
      assert.ok(coppie<8,`${nome} ancora a blocchi`);
    }
    assert.ok(toni.size>=4,`${nome}: ${[...toni].join('')}`);
    for(const k of NUOVE[nome])assert.ok(toni.has(k),`${nome} usa ${k}`);
  }
  // Tutte le varianti diverse fra loro.
  for(const nome of Object.keys(BASE))assert.equal(new Set(terreno[nome].map(v=>v.join(''))).size,6,nome);
});

test('i toni nuovi esistono in ogni stagione, e quelli dei prati e delle chiome cambiano con lei',async()=>{
  const estate=tavolozzaDi('estate');
  for(const k of ['P','Q','R','S','T','U','V','W','X','Y','Z'])
    for(const stagione of ['estate','autunno','inverno','primavera'])assert.match(tavolozzaDi(stagione)[k]??'',/^#[0-9a-f]{6}$/,`${k} ${stagione}`);
  for(const k of ['P','Q','R','S','Z'])
    for(const stagione of ['autunno','inverno','primavera'])assert.notEqual(tavolozzaDi(stagione)[k],estate[k],`${k} ${stagione}`);
  for(const k of ['T','U','V','W','X','Y'])assert.equal(tavolozzaDi('inverno')[k],estate[k],'sabbia, terra e roccia non si vestono');
});

test('gli alberi hanno tre forme, con la stessa misura e lo stesso tronco, e la forma sta ferma al suo posto',async()=>{
  const forme=arteOggetti.ALBERI;
  assert.equal(forme.length,3);assert.equal(arteOggetti.ALBERO,forme[0]);
  for(const f of forme){
    assert.equal(f.length,23);assert.ok(f.every(r=>r.length===16));
    assert.deepEqual(f.slice(15),forme[0].slice(15),'stesso tronco e stessa base');
    assert.ok(f.slice(0,15).join('').includes('Z'),'la luce sulla chioma');
    for(const r of f)for(const c of r)assert.ok(c in TAVOLOZZA,c);
    for(const stagione of ['estate','autunno','inverno','primavera'])decodifica(f,tavolozzaDi(stagione));
  }
  assert.equal(new Set(forme.map(f=>f.join(''))).size,3);
  mappa.inizializza('valle-1');
  const viste=new Map();
  for(let y=0;y<30;y++)for(let x=0;x<30;x++){
    const f=mappa.formaDellAlbero(x,y);assert.equal(mappa.formaDellAlbero(x,y),f,'stabile');
    viste.set(f,(viste.get(f)??0)+1);
  }
  assert.equal(viste.size,3);for(const n of viste.values())assert.ok(n>200,'tutte e tre, più o meno alla pari');
  const sorgente=readFileSync(new URL('../mondo/mappa.js',import.meta.url),'utf8');
  assert.match(sorgente,/: FORME\[oggetto\] \? formaDi\(oggetto, tx, ty\)/);
  // Il vento e le ombre non se ne accorgono: stessa altezza, stessa chioma di quindici righe.
  const e=await effettiDi();
  for(const f of forme)assert.deepEqual(e.fasceMosse({tipo:OGGETTO.ALBERO,sprite:{width:16,height:f.length}},1).map(x=>[x[0],x[1]]),[[0,8],[8,15],[15,23]]);
});

// --- M7.18.48: sassi, cespugli e piante selvatiche ------------------------------

test('sassi e cespugli hanno tre forme ciascuno, con la luce, la stessa misura, e la forma ferma al suo posto',async()=>{
  for(const [nome,forme,uno,alto,luce] of [['sassi',arteOggetti.SASSI,arteOggetti.SASSO,10,'Y'],['cespugli',arteOggetti.CESPUGLI,arteOggetti.CESPUGLIO,12,'Z']]){
    assert.equal(forme.length,3,nome);assert.equal(uno,forme[0]);
    assert.equal(new Set(forme.map(f=>f.join(''))).size,3);
    for(const f of forme){
      assert.equal(f.length,alto,nome);assert.ok(f.every(r=>r.length===16));
      assert.ok(f.join('').includes(luce),`${nome}: la luce`);
      assert.ok(/[^.]/.test(f[alto-1]),`${nome}: poggia sull'ultima riga`);
      for(const stagione of ['estate','autunno','inverno','primavera'])decodifica(f,tavolozzaDi(stagione));
    }
  }
  mappa.inizializza('valle-1');
  for(const [oggetto,forme] of [[OGGETTO.SASSO,arteOggetti.SASSI],[OGGETTO.CESPUGLIO,arteOggetti.CESPUGLI],[OGGETTO.ALBERO,arteOggetti.ALBERI]]){
    const viste=new Map();
    for(let y=0;y<30;y++)for(let x=0;x<30;x++){const f=mappa.formaDi(oggetto,x,y);assert.equal(mappa.formaDi(oggetto,x,y),f);assert.ok(forme.includes(f));viste.set(f,(viste.get(f)??0)+1);}
    assert.equal(viste.size,3);
  }
  // Scarti diversi: sassi e alberi non scelgono la stessa forma negli stessi posti.
  let uguali=0;for(let x=0;x<300;x++)if(arteOggetti.SASSI.indexOf(mappa.formaDi(OGGETTO.SASSO,x,7))===arteOggetti.ALBERI.indexOf(mappa.formaDi(OGGETTO.ALBERO,x,7)))uguali++;
  assert.ok(uguali<160,`${uguali} su 300`);
  // Il vento piega i cespugli nuovi come il vecchio.
  const e=await effettiDi();
  for(const f of arteOggetti.CESPUGLI)assert.deepEqual(e.fasceMosse({tipo:OGGETTO.CESPUGLIO,sprite:{width:16,height:f.length}},3),[[0,6,1],[6,12,0]]);
});

test('le piante selvatiche degli orti hanno l’ombra',async()=>{
  const e=await effettiDi();
  for(const tipo of [OGGETTO.SPIGHE_SELVATICHE,OGGETTO.LINO_SELVATICO,OGGETTO.CAVOLO_SELVATICO,OGGETTO.PATATA_SELVATICA,OGGETTO.FAGIOLI_SELVATICI])
    assert.ok(e.ombraDi({tipo,x:0,y:0,base:16,sprite:{width:16,height:12}},12.5,1),'tipo '+tipo);
});

// --- M7.18.49: acqua e riva ------------------------------------------------------

test('l’acqua ridisegnata: onde e fondo invece del rumore, e il bassofondo più chiaro dell’acqua',async()=>{
  const t=await import('../arte/sprite-terreno.js');
  const chiaro=(k)=>{const c=TAVOLOZZA[k];return parseInt(c.slice(1,3),16)+parseInt(c.slice(3,5),16)+parseInt(c.slice(5,7),16);};
  const media=(varianti)=>{let s=0,n=0;for(const v of varianti)for(const r of v)for(const c of r){s+=chiaro(c);n++;}return s/n;};
  for(const [nome,quante,base] of [['ACQUA',6,'1'],['ACQUA_BASSA',6,'3'],['GHIACCIO',4,'G']]){
    const varianti=t[nome];assert.equal(varianti.length,quante,nome);
    for(const v of varianti){
      assert.equal(v.length,16);assert.ok(v.every(r=>r.length===16));
      for(const r of v)for(const c of r)assert.ok(c in TAVOLOZZA,`${nome}: ${c}`);
      const bordo=v[0]+v[15]+v.map(r=>r[0]+r[15]).join('');assert.equal(new Set(bordo).size,1);assert.equal(bordo[0],base);
      // Niente più rumore: pochi pixel senza un vicino uguale.
      let soli=0;for(let y=1;y<15;y++)for(let x=1;x<15;x++){const c=v[y][x];if(c!==base&&v[y-1][x]!==c&&v[y+1][x]!==c&&v[y][x-1]!==c&&v[y][x+1]!==c)soli++;}
      assert.ok(soli<=6,`${nome}: ${soli} pixel isolati`);
    }
  }
  assert.ok(t.ACQUA.some(v=>v.join('').includes('H')));assert.ok(t.ACQUA_BASSA.some(v=>v.join('').includes('I')));
  assert.ok(media(t.ACQUA_BASSA)>media(t.ACQUA)+60,'il bassofondo si distingue a colpo d’occhio');
});

test('la riva: la mappa sa dove la terra tocca l’acqua, e la schiuma respira sul confine vero',async()=>{
  const e=await effettiDi();e.imposta(true);
  mappa.inizializza('valle-1');
  // Un tassello d'acqua sul lago con un lato di terra.
  let trovato=null;
  for(let y=50;y<90&&!trovato;y++)for(let x=-10;x<30&&!trovato;x++){const r=mappa.rivaDi(x,y);if(r)trovato={x,y,r};}
  assert.ok(trovato);
  const {x,y,r}=trovato;
  assert.equal(mappa.rivaDi(x,y),r,'ricordata');
  for(let q=0;q<4;q++){
    const vicino=mappa.terrenoDi(x+[0,1,0,-1][q],y+[-1,0,1,0][q]);
    const terra=![TERRENO.ACQUA,TERRENO.ACQUA_BASSA,TERRENO.GHIACCIO].includes(vicino);
    assert.equal(Boolean(r[q]),terra,`lato ${q}`);
    if(r[q]){assert.equal(r[q].length,16);assert.ok(r[q].every(d=>d>=3&&d<=10),r[q].join(','));}
  }
  // Sulla terra e sull'acqua aperta niente riva.
  assert.equal(mappa.rivaDi(11,5),null);
  // La schiuma: dentro il tassello, a pixel interi, sul confine o fino a due pixel in acqua, e si muove.
  const q=r.findIndex(Boolean),profilo=r[q];
  const dentro=(px,py)=>{const lx=px-x*16,ly=py-y*16;return [lx,ly];};
  const profondita=(lx,ly)=>q===0?ly:q===1?15-lx:q===2?15-ly:lx;
  const lungo=(lx,ly)=>q===0||q===2?lx:ly;
  const viste=new Map();
  for(let s=0;s<12;s+=0.25){
    for(const [px,py,tipo] of e.schiumaDi(r,x,y,s)){
      assert.ok(Number.isInteger(px)&&Number.isInteger(py));
      const [lx,ly]=dentro(px,py);assert.ok(lx>=0&&lx<16&&ly>=0&&ly<16);
      if(tipo!=='schiuma'||!r[q])continue;
      const k=lungo(lx,ly),d=profondita(lx,ly);
      if(profondita(lx,ly)===undefined)continue;
      if(r.filter(Boolean).length===1){assert.ok(d>=profilo[k]&&d<=profilo[k]+2,`schiuma a ${d}, confine ${profilo[k]}`);}
      viste.set(k,(viste.get(k)??new Set()).add(d));
    }
  }
  assert.ok([...viste.values()].some(s=>s.size>=2),'avanza e si ritira');
  assert.ok(e.schiumaDi(r,x,y,1).some(p=>p[2]==='bagnato'),'la terra bagnata');
  assert.deepEqual(e.schiumaDi(null,x,y,1),[]);
  // Col gelo il bassofondo diventa ghiaccio e la riva si ricalcola.
  const bassi=[];for(let yy=50;yy<90;yy++)for(let xx=-10;xx<30;xx++)if(mappa.terrenoDi(xx,yy)===TERRENO.ACQUA_BASSA&&mappa.rivaDi(xx,yy))bassi.push([xx,yy]);
  assert.ok(bassi.length>0);
  mappa.impostaGelo(true);
  try{for(const [xx,yy] of bassi)assert.equal(mappa.rivaDi(xx,yy),null,'ghiacciato, niente riva');}
  finally{mappa.impostaGelo(false);}
  assert.ok(mappa.rivaDi(...bassi[0]),'tornata col disgelo');
  const gioco=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  assert.match(gioco,/effetti\.disegnaRiva\(p, camera, secondi, mappa\.rivaDi, mappa\.gelato\(\)\);/);
  assert.ok(gioco.indexOf('effetti.disegnaRiva(')<gioco.indexOf('for (const cosa of inPiedi) {'));
  assert.match(readFileSync(new URL('../arte/effetti.js',import.meta.url),'utf8'),/if \(!accesi \|\| gelato\) return;/);
});

// --- M7.18.50: muri e case ---------------------------------------------------------

test('cinque muri in pietra: tre puliti e due in rovina col muschio, tutti 16×20 col coronamento',()=>{
  const {MURI,MURI_PULITI,MURO}=arteOggetti;
  assert.equal(MURI.length,5);assert.equal(MURO,MURI[0]);
  assert.equal(new Set(MURI.map(f=>f.join(''))).size,5);
  assert.deepEqual(MURI_PULITI,MURI.slice(0,3));
  for(const f of MURI){
    assert.equal(f.length,20);assert.ok(f.every(r=>r.length===16));
    assert.ok(!f.join('').includes('.'),'pieno');
    // Coronamento: la prima riga è la più chiara, la seconda il corpo, la
    // terza il giunto scuro che lo separa dalla muratura.
    assert.ok(/^[fYkj]+$/.test(f[0]),f[0]);assert.ok(/^[ed]+$/.test(f[1]),f[1]);assert.ok(/^[Xkj]+$/.test(f[2]),f[2]);
    for(const c of 'XYfed')assert.ok(f.join('').includes(c),c);
    for(const stagione of ['estate','autunno','inverno','primavera'])decodifica(f,tavolozzaDi(stagione));
  }
  for(const f of MURI_PULITI)assert.ok(!/[jk]/.test(f.join('')),'un muro pulito non ha muschio');
  for(const f of MURI.slice(3))assert.ok(/k/.test(f.join(''))&&/j/.test(f.join('')),'la rovina ha il muschio');
});

test('i muri delle rovine pescano fra tutti e cinque, quelli costruiti solo fra i puliti',()=>{
  mappa.inizializza('valle-1');modifiche.svuota();
  const generati=[];
  for(let y=-200;y<200&&generati.length<200;y++)for(let x=-200;x<200;x++)if(mappa.oggettoGenerato(x,y)===OGGETTO.MURO)generati.push([x,y]);
  assert.ok(generati.length>=100);
  const viste=new Set();
  for(const [x,y] of generati){const f=mappa.formaDi(OGGETTO.MURO,x,y);assert.equal(mappa.formaDi(OGGETTO.MURO,x,y),f);viste.add(f);}
  assert.equal(viste.size,5,'compaiono anche le rovine');
  // Un muro delle rovine preso a colpi resta com'era.
  const [gx,gy]=generati[0];const prima=mappa.formaDi(OGGETTO.MURO,gx,gy);
  mappa.annotaTassello(gx,gy,{colpi:2});
  assert.equal(mappa.formaDi(OGGETTO.MURO,gx,gy),prima);
  // Un muro alzato dove non c'era: solo i tre puliti, e tutti e tre.
  const nuovi=new Set();
  for(let x=0;x<60;x++){const y=500;if(mappa.oggettoGenerato(x,y)===OGGETTO.MURO)continue;
    mappa.cambiaTassello(x,y,{oggetto:OGGETTO.MURO});
    const f=mappa.formaDi(OGGETTO.MURO,x,y);assert.ok(arteOggetti.MURI_PULITI.includes(f));nuovi.add(f);}
  assert.equal(nuovi.size,3);
  modifiche.svuota();mappa.inizializza('valle-1');
});

test('il muro crollato ha tre forme 16×8 in pietra; porta, porta aperta e pavimento restano della loro misura',()=>{
  const {MURI_ROTTI,MURO_ROTTO}=arteOggetti;
  assert.equal(MURI_ROTTI.length,3);assert.equal(MURO_ROTTO,MURI_ROTTI[0]);
  assert.equal(new Set(MURI_ROTTI.map(f=>f.join(''))).size,3);
  for(const f of MURI_ROTTI){
    assert.equal(f.length,8);assert.ok(f.every(r=>r.length===16));
    for(const c of 'XYed')assert.ok(f.join('').includes(c),c);
    assert.ok(/[^.]/.test(f[7]),'poggia a terra');
    for(const stagione of ['estate','autunno','inverno','primavera'])decodifica(f,tavolozzaDi(stagione));
  }
  mappa.inizializza('valle-1');
  const viste=new Set();for(let y=0;y<30;y++)for(let x=0;x<30;x++)viste.add(mappa.formaDi(OGGETTO.MURO_ROTTO,x,y));
  assert.equal(viste.size,3);
  const {PORTA,PORTA_APERTA,PAVIMENTO_LEGNO}=arteCose;
  for(const f of [PORTA,PORTA_APERTA]){assert.equal(f.length,20);assert.ok(f.every(r=>r.length===16));
    for(const stagione of ['estate','inverno'])decodifica(f,tavolozzaDi(stagione));}
  // Gli stipiti in pietra come il muro, le assi con la venatura, il ferro.
  assert.deepEqual(PORTA.slice(0,3),PORTA_APERTA.slice(0,3));
  for(const c of 'XYhgws')assert.ok(PORTA.join('').includes(c),c);
  assert.ok(!PORTA.join('').includes('.'));
  // La porta aperta è vuota dove lo era prima (colonne 5–13 dalla riga 4 in giù).
  for(let y=4;y<20;y++)assert.equal(PORTA_APERTA[y].slice(5,14),'.........',`riga ${y}`);
  assert.ok(PORTA_APERTA.every((r,y)=>y<3||(r[0]!=='.'&&r[15]!=='.')),'gli stipiti restano');
  assert.equal(PAVIMENTO_LEGNO.length,16);assert.ok(PAVIMENTO_LEGNO.every(r=>r.length===16&&!r.includes('.')));
  decodifica(PAVIMENTO_LEGNO,tavolozzaDi('estate'));
});

// --- M7.18.51: il superstite e gli infetti -------------------------------------------

const personaggiDi=()=>import('../arte/sprite-personaggi.js');
// giocatore.js e infetto.js cuociono i disegni: basta una tela finta.
async function conTelaFinta(fai){
  const prima=globalThis.document,primaImmagine=globalThis.ImageData;
  globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({putImageData(){},drawImage(){},translate(){},scale(){}})})};
  globalThis.ImageData=class{constructor(d,w,h){this.data=d;this.width=w;this.height=h;}};
  try{return await fai();}finally{globalThis.document=prima;globalThis.ImageData=primaImmagine;}
}
// Quanti piedi toccano terra: i pezzi di contorno nell'ultima riga.
const piediATerra=f=>f[23].split('.').filter(Boolean).length;

test('il superstite: tre direzioni per quattro passi, con luce e ombra, e gli appoggi dove li sente l’udito',async()=>{
  const a=await personaggiDi();
  for(const d of ['GIU','SU','LATO']){
    assert.equal(a[d].length,4);
    a[d].forEach((f,i)=>{
      assert.equal(f.length,24);assert.ok(f.every(r=>r.length===16));
      decodifica(f,TAVOLOZZA);decodifica(f,TAVOLOZZA_INFETTO);
      // Appoggi 0 e 2 con due piedi a terra, falcate 1 e 3 con uno alzato.
      assert.equal(piediATerra(f),i%2===0?2:1,`${d} ${i}`);
    });
    const tutto=a[d].join('');
    for(const c of 'rqKmpnohJFg')assert.ok(tutto.includes(c),`${d}: ${c}`);
    // Le braccia oscillano: le falcate non hanno il busto uguale all'appoggio.
    assert.notDeepEqual(a[d][1].slice(9,16),a[d][0].slice(9,16),d);
    assert.notDeepEqual(a[d][1].slice(9,16),a[d][3].slice(9,16),d);
  }
  for(const c of 'KJF')assert.ok(c in TAVOLOZZA&&c in TAVOLOZZA_INFETTO,c);
});

test('le pose del superstite: respiro, colpo, chino, con i piedi fermi a terra',async()=>{
  const a=await personaggiDi();
  for(const d of ['giu','su','lato']){
    const p=a.POSE[d];
    assert.equal(p.fermo.length,2);assert.equal(p.colpo.length,2);
    for(const f of [...p.fermo,...p.colpo,p.chino]){
      assert.equal(f.length,24);assert.ok(f.every(r=>r.length===16));
      decodifica(f,TAVOLOZZA);
      assert.equal(f[23],a[d.toUpperCase()][0][23],'i piedi non si muovono');
    }
    assert.deepEqual(p.fermo[0],a[d.toUpperCase()][0]);
    // Il respiro abbassa la testa di un pixel, il chinarsi di due.
    const cima=f=>f.findIndex(r=>/[^.]/.test(r.slice(3,12)));
    assert.equal(cima(p.fermo[1]),cima(p.fermo[0])+1,d);
    assert.equal(cima(p.chino),cima(p.fermo[0])+2,d);
    assert.notDeepEqual(p.colpo[0],p.colpo[1]);
  }
});

test('l’infetto ha una sagoma sua: più basso, curvo, zoppo, e i suoi passi cadono come quelli del superstite',async()=>{
  const a=await personaggiDi();
  for(const d of ['GIU','SU','LATO']){
    const f=a['INFETTO_'+d];assert.equal(f.length,4);
    f.forEach((x,i)=>{
      assert.equal(x.length,24);assert.ok(x.every(r=>r.length===16));decodifica(x,TAVOLOZZA_INFETTO);
      assert.notDeepEqual(x,a[d][i],'non è il superstite ricolorato');
      assert.ok(x[0]===''.padEnd(16,'.')&&x[1]===''.padEnd(16,'.'),'la testa più bassa di due pixel');
      assert.equal(piediATerra(x),i%2===0?2:1,`${d} ${i}`);
    });
    // Zoppo: le due falcate non sono una lo specchio dell'altra.
    assert.notDeepEqual(f[1].slice(17),f[3].slice(17));
    const p=a.POSE_INFETTO[d.toLowerCase()];
    assert.equal(p.fermo.length,2);assert.deepEqual(p.fermo[0],f[0]);
    for(const x of [...p.fermo,p.morso]){assert.equal(x.length,24);decodifica(x,TAVOLOZZA_INFETTO);}
    assert.notDeepEqual(p.morso,f[0]);
  }
  // Sangue alla bocca, di fronte e di profilo.
  assert.ok(a.INFETTO_GIU[0].join('').includes('A')&&a.INFETTO_LATO[0].join('').includes('A'));
  const sorgente=readFileSync(new URL('../entita/infetto.js',import.meta.url),'utf8');
  assert.match(sorgente,/arte\.INFETTO_GIU/);assert.match(sorgente,/arte\.POSE_INFETTO/);
});

test('i gesti del superstite: colpo e chino durano un attimo, il respiro da fermo, e niente si muove',async()=>{
  await conTelaFinta(async()=>{
    const g=await import('../entita/giocatore.js');
    assert.equal(g.gestoDi({tipo:'colpo',voce:'legno'}),'colpo');
    assert.equal(g.gestoDi({tipo:'combattuto'}),'colpo');
    assert.equal(g.gestoDi({tipo:'raccolto',voce:'legno'}),'colpo');
    assert.equal(g.gestoDi({tipo:'raccolto'}),'chino');
    for(const tipo of ['zappa','semina','innaffia','preso','frugato','posa'])assert.equal(g.gestoDi({tipo}),'chino',tipo);
    for(const tipo of ['bevi','dormi','zainoPieno','impedito'])assert.equal(g.gestoDi({tipo}),null,tipo);
    assert.equal(g.gestoDi(null),null);
    const e=g.crea(100,100);
    assert.equal(g.posaDi(e),'fermo0');
    g.gesto(e,'colpo');assert.equal(g.posaDi(e),'colpo0');
    g.aggiorna(e,0.15);assert.equal(e.posa,'colpo1');assert.equal(e.px,100);assert.equal(e.py,100);assert.equal(e.passo,0);
    g.aggiorna(e,0.15);assert.equal(e.gesto,null);assert.match(e.posa,/^fermo/);
    g.gesto(e,'chino');g.aggiorna(e,0.1);assert.equal(e.posa,'chino');
    g.aggiorna(e,0.3);assert.notEqual(e.posa,'chino');
    // Il respiro: fermo si alternano le due pose, e il passo resta a zero.
    const viste=new Set();for(let i=0;i<40;i++){g.aggiorna(e,0.1);viste.add(e.posa);assert.equal(e.passo,0);}
    assert.deepEqual([...viste].sort(),['fermo0','fermo1']);
    // Il morso: un lampo breve.
    g.morso(e);g.aggiorna(e,0.05);assert.ok(e.morso>0);g.aggiorna(e,0.2);assert.equal(e.morso,0);
    // Col braccio alzato l'attrezzo sporge sopra la testa, e la figura resta
    // ancorata ai piedi.
    e.impugnato=CATALOGO.ascia.impugnato;g.gesto(e,'colpo');g.aggiorna(e,0.01);
    assert.equal(e.y+e.sprite.height,e.py);assert.ok(e.sprite.height>24);
    // Le figure composte restano poche anche con tutti gli attrezzi.
    for(const cosa of ['ascia','torcia','zappa','lancia','canna',null]){
      e.impugnato=cosa?CATALOGO[cosa].impugnato:null;
      for(const guarda of ['giu','su','sinistra','destra']){e.guarda=guarda;
        for(const gesto of ['colpo','chino',null]){if(gesto)g.gesto(e,gesto);for(let i=0;i<8;i++)g.aggiorna(e,0.07);}}
    }
    assert.ok(g.figureComposte()<150,`${g.figureComposte()} figure`);
    const i=await import('../entita/infetto.js');
    const n=i.crea(0,0);assert.equal(i.posaDi(n),'fermo0');
    n.scatto=0.2;assert.equal(i.posaDi(n),'morso');
  });
  const gioco=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  assert.match(gioco,/giocatore\.gesto\(eroe, giocatore\.gestoDi\(esito\)\);/);
  assert.match(gioco,/giocatore\.morso\(eroe\);/);
});

// --- M7.18.52: animali e polli ----------------------------------------------------------

// Quanti pezzi toccano terra nell'ultima riga.
const aTerra=f=>f[f.length-1].split('.').filter(Boolean).length;

test('le bestie hanno quattro passi, luce e ombra, e una posa ferma: brucare o fiutare',()=>{
  for(const [specie,passi] of Object.entries(arteFauna.ANIMALI)){
    assert.equal(passi.length,4,specie);
    const pascolo=arteFauna.PASCOLO[specie];
    for(const f of [...passi,pascolo]){
      assert.equal(f.length,passi[0].length,specie);assert.ok(f.every(r=>r.length===26),specie);
      for(const stagione of ['estate','inverno'])decodifica(f,tavolozzaDi(stagione));
    }
    // Appoggi uguali, con le quattro zampe a terra ben staccate; falcate
    // diverse fra loro, coi piedi altrove.
    assert.deepEqual(passi[0],passi[2]);assert.notDeepEqual(passi[1],passi[3]);assert.notDeepEqual(passi[0],passi[1]);
    assert.equal(aTerra(passi[0]),4,specie);
    for(const i of [1,3])assert.notEqual(passi[i].at(-1),passi[0].at(-1),specie);
    // Almeno quattro toni: luce, corpo, ombra, contorno.
    assert.ok(new Set(passi[0].join('').replaceAll('.','')).size>=4,specie);
    // A testa bassa: la testa scende sotto la linea del dorso.
    assert.notDeepEqual(pascolo,passi[0]);
    const primaRiga=f=>f.findIndex(r=>/[^.]/.test(r.slice(20)));
    assert.ok(primaRiga(pascolo)>primaRiga(passi[0]),specie);
  }
  assert.ok('N' in TAVOLOZZA&&'O' in TAVOLOZZA&&'M' in TAVOLOZZA);
});

test('le bestie camminano quando si muovono e brucano quando sono calme e ferme',async()=>{
  fauna.reimposta();
  const e=animale('cervo',200,3);e.stato='calmo';
  const pose=new Set();
  for(let t=0;t<10;t+=0.25)pose.add(fauna.posaDi(e,t));
  assert.ok(pose.has('pascolo')&&pose.has('passo0'),[...pose].join());
  // Si muove: il passo cresce, e il disegno segue i quattro fotogrammi.
  const viste=new Set();
  for(let i=0;i<8;i++){e.passo+=0.5;viste.add(fauna.posaDi(e,20));}
  assert.deepEqual([...viste].sort(),['passo0','passo1','passo2','passo3']);
  // In allerta e fermo tiene la testa alta.
  e.stato='allerta';fauna.posaDi(e,1);assert.equal(fauna.posaDi(e,1.5),'passo0');
  e.vita=0;assert.equal(fauna.posaDi(e,2),'carcassa');e.vita=6;
  // Il disegno non cambia niente di quello che si salva.
  const prima=JSON.stringify(fauna.istantanea());
  await conTelaFinta(()=>fauna.daDisegnare(3));
  assert.equal(JSON.stringify(fauna.istantanea()),prima);
  fauna.reimposta();
});

test('i polli: quattro passi, beccano da fermi, dormono di notte; bianchi e bruni',async()=>{
  for(const [passi,becca,dorme] of [[arteCose.POLLO,arteCose.POLLO_BECCA,arteCose.POLLO_DORME],
    [arteCose.POLLO_SELVATICO,arteCose.POLLO_SELVATICO_BECCA,arteCose.POLLO_SELVATICO_DORME],
    [arteCose.GALLO,arteCose.GALLO_BECCA_SPRITE,arteCose.GALLO_DORME_SPRITE],
    [arteCose.GALLO_SELVATICO,arteCose.GALLO_SELVATICO_BECCA,arteCose.GALLO_SELVATICO_DORME],
    [arteCose.PULCINO,arteCose.PULCINO_BECCA,arteCose.PULCINO_DORME]]){
    assert.equal(passi.length,4);
    for(const f of [...passi,becca,dorme]){assert.equal(f.length,passi[0].length);assert.ok(f.every(r=>r.length===passi[0][0].length));decodifica(f,TAVOLOZZA);}
    assert.notDeepEqual(passi[1],passi[3]);assert.notDeepEqual(becca,passi[0]);
    // Becca con la testa giù: le prime righe restano vuote.
    assert.equal(becca[0].replaceAll('.',''),'');
  }
  assert.ok(arteCose.POLLO[0].join('').includes('O'),'l’ombra delle piume');
  assert.ok(!arteCose.POLLO_SELVATICO[0].join('').includes('z'),'la selvatica è bruna');
  // La posa: di notte dorme, camminando passa i fotogrammi, ferma becca a tratti.
  polli.reimposta();tempo.impostaOra(12);
  const p={px:0,py:0,domestico:true,seme:9,dx:0,dy:0,giro:3,destra:true,passo:0,fame:0,gallo:false,eta:null,deposto:null};
  const pose=new Set();for(let t=0;t<3;t+=0.05)pose.add(polli.posaDi(p,t));
  assert.ok(pose.has('becca')&&pose.has('passo0'),[...pose].join());
  const passi=new Set();for(let i=0;i<8;i++){p.passo+=0.5;passi.add(polli.posaDi(p));}
  assert.deepEqual([...passi].sort(),['passo0','passo1','passo2','passo3']);
  tempo.impostaOra(23);assert.equal(polli.posaDi(p),'dorme');tempo.impostaOra(12);
  const gioco=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  assert.match(gioco,/fauna\.daDisegnare\(adesso\), \.\.\.polli\.daDisegnare\(adesso\)/);
});

// --- M7.18.53: il cervo rifatto --------------------------------------------------------

test('il cervo ha un palco vero: ramificato, attaccato alla testa, con le punte color osso',()=>{
  const {ANIMALI,PASCOLO}=arteFauna;
  for(const f of [...ANIMALI.cervo,PASCOLO.cervo]){
    // Più alto degli altri: c'è posto per il palco sopra la testa.
    assert.equal(f.length,26);assert.ok(f.every(r=>r.length===26));
    decodifica(f,TAVOLOZZA);
    // Niente grigio: il palco è bruno (h) con le punte chiare (z).
    assert.ok(!f.join('').includes('Y'));
  }
  const f=ANIMALI.cervo[0];
  // Almeno quattro punte (pugnale, mezzo, forcella), tutte sopra la testa.
  const punte=[];f.forEach((r,y)=>[...r].forEach((c,x)=>{if(c==='z'&&x>12)punte.push([x,y]);}));
  assert.ok(punte.length>=4,`${punte.length} punte`);
  // Il palco è un pezzo solo, attaccato alla testa: dalle punte si arriva al
  // contorno del capo passando solo per il palco.
  const palco=(x,y)=>'hz'.includes(f[y]?.[x]);
  for(const [x0,y0] of punte){
    const visti=new Set([`${x0},${y0}`]),coda=[[x0,y0]];let testa=false;
    while(coda.length){const [x,y]=coda.pop();
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
        const nx=x+dx,ny=y+dy,k=`${nx},${ny}`;if(visti.has(k))continue;visti.add(k);
        if(palco(nx,ny))coda.push([nx,ny]);else if('gNw'.includes(f[ny]?.[nx]??'.')&&f[ny]?.[nx]!==undefined&&f[ny][nx]!=='.')testa=true;}}
    assert.ok(testa,`la punta ${x0},${y0} non arriva alla testa`);
  }
});

// --- M7.18.54: la luna ----------------------------------------------------------------------

const lunaDi=()=>import('../regole/luna.js');

test('il calendario della luna: sei notti, stabile per valle, piena anche d’inverno negli anni',async()=>{
  const l=await lunaDi();
  mappa.inizializza('valle-1');
  const fasi=[];for(let g=1;g<=48;g++){fasi.push(l.fase(g));assert.equal(l.fase(g),l.fase(g));assert.equal(l.fase(g+l.CICLO),l.fase(g));}
  assert.deepEqual(new Set(fasi.slice(0,6)).size,6);
  // In tre anni la piena cade in tutte e quattro le stagioni.
  const stagioniDellaPiena=new Set(fasi.map((f,i)=>f===l.PIENA?stagioni.stagioneDi(i+1):null).filter(Boolean));
  assert.equal(stagioniDellaPiena.size,4,[...stagioniDellaPiena].join());
  assert.deepEqual([0,1,2,3,4,5].map(l.illuminata),[0,0.25,0.75,1,0.75,0.25]);
  assert.equal(l.NOMI[l.PIENA],'piena');assert.equal(l.NOMI[l.NUOVA],'nuova');
  // Ogni valle ha il suo sfasamento.
  const sfasamenti=new Set();for(const v of ['valle-1','valle-2','valle-3','valle-4','valle-5','valle-6']){mappa.inizializza(v);sfasamenti.add(l.fase(1));}
  assert.ok(sfasamenti.size>=2);
  mappa.inizializza('valle-1');
  // Fino alle sette è ancora la notte del giorno prima.
  assert.equal(l.notteDi(5,3),4);assert.equal(l.notteDi(5,6.9),4);assert.equal(l.notteDi(5,7),5);assert.equal(l.notteDi(5,23),5);
});

test('la luna si nasconde dietro le nuvole, e non tocca le regole degli infetti',async()=>{
  const l=await lunaDi();
  mappa.inizializza('valle-1');
  const coperte=[];for(let g=1;g<=16;g++){const e=meteo.evento(g);assert.equal(l.nascosta(g),e==='pioggia'||e==='neve',`giorno ${g}`);if(l.nascosta(g))coperte.push(g);}
  assert.ok(coperte.length>0);
  tempo.impostaGiorno(coperte[0]);tempo.impostaOra(23);
  assert.equal(l.stanotte().luce,0);assert.equal(l.luceAdesso(),0);
  // Luce del sole e notte identiche con la piena e con la nuova: è quella
  // luce che decide quanti infetti escono, e la luna non la sposta.
  const piena=[...Array(16).keys()].map(i=>i+1).find(g=>l.fase(g)===l.PIENA&&!l.nascosta(g));
  const nuova=[...Array(16).keys()].map(i=>i+1).find(g=>l.fase(g)===l.NUOVA&&!l.nascosta(g));
  const misura=g=>{tempo.impostaGiorno(g);return [0,3,6,19.5,21,23].map(o=>{tempo.impostaOra(o);return [tempo.luceAmbiente(),tempo.eNotte()];});};
  assert.deepEqual(misura(piena),misura(nuova));
  tempo.impostaGiorno(piena);tempo.impostaOra(23);assert.equal(l.luceAdesso(),1);
  tempo.impostaGiorno(nuova);tempo.impostaOra(23);assert.equal(l.luceAdesso(),0);
  for(const f of ['infetti.js','tempo.js','polli.js','freddo.js','riposo.js'])
    assert.doesNotMatch(readFileSync(new URL('../regole/'+f,import.meta.url),'utf8'),/luna\.js/,f);
  tempo.impostaGiorno(1);tempo.impostaOra(12);
});

test('il buio della luna: nero a luna nuova, aperto a luna piena, e in media come prima',async()=>{
  const o=await import('../motore/oscurita.js');
  const notte=0.1,prima=(1-notte)*0.82;
  assert.ok(Math.abs(o.coperturaDi(notte,0)-0.82)<0.01,`${o.coperturaDi(notte,0)}`);
  assert.ok(Math.abs(o.coperturaDi(notte,1)-0.60)<0.01,`${o.coperturaDi(notte,1)}`);
  assert.equal(o.coperturaDi(1,0),0);assert.equal(o.coperturaDi(1,1),0);
  const media=[0,0.25,0.75,1,0.75,0.25].reduce((s,x)=>s+o.coperturaDi(notte,x),0)/6;
  assert.ok(Math.abs(media-prima)<0.01,`media ${media} contro ${prima}`);
  // Più luna, meno buio, sempre.
  for(let x=0;x<1;x+=0.1)assert.ok(o.coperturaDi(notte,x+0.1)<o.coperturaDi(notte,x));
  // La tinta: senza luna quella di prima, con la luna più chiara.
  tempo.impostaOra(0);
  assert.equal(tempo.tintaOscurita(),'rgb(14 20 44)');assert.equal(tempo.tintaOscurita(0),'rgb(14 20 44)');
  const somma=t=>t.match(/\d+/g).map(Number).reduce((a,b)=>a+b,0);
  assert.ok(somma(tempo.tintaOscurita(1))>somma(tempo.tintaOscurita(0))+50);
  tempo.impostaOra(12);
  const gioco=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  assert.match(gioco,/tempo\.tintaOscurita\(chiaroDiLuna\), lumi,\n\s+\(luce\) => effetti\.tremolio\(luce, secondi\), chiaroDiLuna\);/);
  assert.match(gioco,/const chiaroDiLuna = luna\.luceAdesso\(\);/);
});

test('sotto la luna: riflessi d’argento sull’acqua e ombre tenui, solo quando c’è',async()=>{
  const e=await effettiDi();
  const q={sinistra:0,destra:32*16,sopra:0,sotto:20*16},acqua=()=>true;
  const conta=(stato,a=acqua)=>{let n=0;for(let t=0;t<8;t+=0.25)n+=e.riflessiLunari(q,t,stato,a).length;return n;};
  assert.ok(conta({luna:1,luce:0.1})>0);
  assert.equal(conta({luna:0,luce:0.1}),0,'luna nuova');
  assert.equal(conta({luna:0.25,luce:0.1}),0,'falce');
  assert.equal(conta({luna:1,luce:1}),0,'di giorno');
  assert.equal(conta({luna:1,luce:0.1},()=>false),0,'niente acqua (o ghiaccio)');
  assert.ok(conta({luna:1,luce:0.1})>conta({luna:0.75,luce:0.1}));
  e.imposta(false);try{assert.equal(conta({luna:1,luce:0.1}),0,'effetti spenti');}finally{e.imposta(true);}
  for(const r of e.riflessiLunari(q,1,{luna:1,luce:0.1},acqua))assert.ok(r.forza>=0&&r.forza<=1);
  const gioco=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  assert.ok(gioco.indexOf('disegnaBuio(secondi, chiaroDiLuna, lampo);')<gioco.indexOf('effetti.disegnaRiflessiLunari('),'sopra il buio');
  // Le ombre: di notte senza luna niente, con la piena un'ombra tenue; di
  // giorno quella di sempre, con o senza luna.
  const chi={tipo:'giocatore',x:0,y:0,base:24,sprite:{width:16,height:24}};
  assert.equal(e.ombraDi(chi,23,0.1,null,0),null);
  assert.equal(e.ombraDi(chi,23,0.1,null,0.25),null);
  const lunare=e.ombraDi(chi,23,0.1,null,1);assert.ok(lunare&&lunare.forza>0&&lunare.forza<=0.2);
  assert.deepEqual(e.ombraDi(chi,12,1,null,1),e.ombraDi(chi,12,1,null,0));
  assert.deepEqual(e.ombraDi(chi,12,1),e.ombraDi(chi,12,1,null,0));
  // Gira con la luna: la sera da una parte, all'alba dall'altra.
  assert.notEqual(e.ombraDi(chi,20,0.1,null,1).dx,e.ombraDi(chi,5,0.1,null,1).dx);
  assert.match(gioco,/effetti\.disegnaOmbre\(p, inPiedi, camera, tempo\.oraCorrente\(\), luce, chiaroDiLuna\);/);
});

test('la luna nell’orologio e nelle previsioni',async()=>{
  const ind=await import('../arte/sprite-indicatori.js');
  assert.equal(ind.LUNE.length,6);
  for(const f of [...ind.LUNE,ind.LUNA_COPERTA]){assert.equal(f.length,7);assert.ok(f.every(r=>r.length===7));decodifica(f,TAVOLOZZA);}
  assert.ok(!ind.LUNE[0].join('').includes('z'),'la nuova è tutta al buio');
  assert.ok(!ind.LUNE[3].join('').includes('e'),'la piena è tutta chiara');
  assert.equal(ind.LUNE[1][3][6],'z');assert.equal(ind.LUNE[1][3][0],'e');   // crescente: chiara a destra
  assert.equal(ind.LUNE[5][3][0],'z');assert.equal(ind.LUNE[5][3][6],'e');   // calante: a sinistra
  const hud=readFileSync(new URL('../interfaccia/hud.js',import.meta.url),'utf8');
  assert.match(hud,/indicatori\.LUNA_COPERTA : indicatori\.LUNE\[luna\.fase\]/);
  for(const s of ['STANOTTE LUNA PIENA','STANOTTE LUNA NUOVA: BUIO FITTO','DOMANI LUNA PIENA','DOMANI LUNA NUOVA'])assert.ok(hud.includes(s),s);
  const gioco=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  assert.match(gioco,/luna: luna\.stanotte\(\),/);
  assert.match(gioco,/luna: \{ stanotte: luna\.stanotte\(\), domani: luna\.domani\(\) \}/);
  // Il modulo nuovo è nella cache e nella mappa degli import.
  assert.ok(readFileSync(new URL('../sw.js',import.meta.url),'utf8').includes('"./regole/luna.js"'));
  assert.match(readFileSync(new URL('../index.html',import.meta.url),'utf8'),/"\.\/regole\/luna\.js": "\.\/regole\/luna\.js\?v=/);
});

// --- M7.18.55: il meteo che si vede ---------------------------------------------------------

const cieloDi=()=>import('../regole/cielo.js');

test('la neve si posa nel giorno di neve e si scioglie il giorno dopo',async()=>{
  const c=await cieloDi();mappa.inizializza('valle-1');
  // Una nevicata di un giorno solo: né il giorno prima né quello dopo.
  const neve=[...Array(160).keys()].map(i=>i+1).find(g=>meteo.evento(g)==='neve'&&meteo.evento(g+1)!=='neve'&&meteo.evento(g-1)!=='neve');
  assert.ok(neve);
  assert.equal(c.neveAPosa(neve,0),0);assert.ok(c.neveAPosa(neve,4)>0&&c.neveAPosa(neve,4)<1);assert.equal(c.neveAPosa(neve,9),1);
  assert.equal(c.neveAPosa(neve+1,6),1);assert.ok(c.neveAPosa(neve+1,13)>0&&c.neveAPosa(neve+1,13)<1);assert.equal(c.neveAPosa(neve+1,20),0);
  for(let g=1;g<=48;g++)for(const o of [0,6,12,18,23]){const v=c.neveAPosa(g,o);assert.ok(v>=0&&v<=1);
    if(meteo.evento(g)!=='neve'&&meteo.evento(g-1)!=='neve')assert.equal(v,0,`giorno ${g}`);}
});

test('le chiazze di neve: più neve più terreno bianco, mai tutto, e passano da un tassello all’altro',async()=>{
  const a=await import('../arte/atmosfera.js');
  const coperti=q=>{let n=0;for(let y=0;y<160;y++)for(let x=0;x<160;x++)if(a.innevato(x,y,q))n++;return n/25600;};
  const poca=coperti(0.3),piena=coperti(1);
  assert.ok(poca>0.01&&poca<piena,`${poca} ${piena}`);
  assert.ok(piena>0.4&&piena<0.9,`piena ${piena}: fra le chiazze resta il terreno`);
  assert.equal(coperti(0),0);
  // Continua: un pixel innevato ha quasi sempre un vicino innevato, anche
  // oltre il bordo del tassello.
  let soli=0,tot=0;for(let y=1;y<159;y++)for(let x=1;x<159;x++)if(a.innevato(x,y,1)){tot++;if(![[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>a.innevato(x+dx,y+dy,1)))soli++;}
  assert.ok(soli/tot<0.02);
  let attraverso=0;for(let y=0;y<160;y++)if(a.innevato(15,y,1)&&a.innevato(16,y,1))attraverso++;assert.ok(attraverso>10);
  // Né nella stanza né su acqua e roccia: lo decide chi disegna.
  const gioco=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  assert.match(gioco,/TERRENI_DI_NEVE = new Set\(\[TERRENO\.ERBA, TERRENO\.STERPAGLIA, TERRENO\.TERRA, TERRENO\.SABBIA\]\)/);
  assert.match(gioco,/atmosfera\.tasselliCoperti\(riparo\.stanza\(\)\)/);
  assert.ok(gioco.indexOf('atmosfera.disegnaNevePosata(')<gioco.indexOf('for (const cosa of inPiedi) {'),'sotto le cose in piedi');
});

test('i temporali: giorni di pioggia d’autunno e di primavera, lampi irregolari, tuono',async()=>{
  const c=await cieloDi();mappa.inizializza('valle-1');
  const temporali=[];
  for(let g=1;g<=48;g++){if(c.temporale(g)){temporali.push(g);assert.equal(meteo.evento(g),'pioggia');assert.ok(['autunno','primavera'].includes(stagioni.stagioneDi(g)));}
    assert.equal(c.temporale(g),c.temporale(g));}
  assert.ok(temporali.length>=1);
  const g=temporali[0];
  assert.ok(!c.temporaleAdesso(g,10));assert.ok(c.temporaleAdesso(g,16));assert.ok(!c.temporaleAdesso(g,23.5));
  // Lampi: fra uno e l'altro da 7 a 18 secondi.
  const inizi=[];let prima=null;
  for(let t=0;t<600;t+=0.01){const l=c.lampoDi(t);if(l.forza>0&&l.numero!==prima){prima=l.numero;inizi.push(l.inizio);}}
  assert.ok(inizi.length>30);
  for(let i=1;i<inizi.length;i++){const d=inizi[i]-inizi[i-1];assert.ok(d>=6.99&&d<=18.01,`${d}`);}
  const l=c.lampoDi(inizi[3]+0.02);assert.ok(l.forza>0&&l.tuonoDopo>=0.4&&l.tuonoDopo<=2);
  assert.equal(c.lampoDi(inizi[3]+1).forza,0);
  const voci=await import('../arte/voci.js');assert.equal(voci.TUONO.onda,'rumore');assert.ok(voci.TUONO.coda>2);
  const hud=readFileSync(new URL('../interfaccia/hud.js',import.meta.url),'utf8');
  assert.ok(hud.includes('"TEMPORALE"')&&hud.includes('"TEMPORALE"'));
  const gioco=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  assert.ok(gioco.indexOf('disegnaBuio(secondi, chiaroDiLuna, lampo);')<gioco.indexOf('atmosfera.disegnaLampo(p, lampo);'));
  assert.match(gioco,/suono\.suona\(TUONO,/);
  // Il lampo non tocca le regole: la luce del sole resta quella.
  assert.match(gioco,/luce \+ \(1 - luce\) \* 0\.85 \* lampo/);
});

test('la foschia dell’alba: d’autunno e dopo la pioggia, mai d’estate né col cielo coperto',async()=>{
  const c=await cieloDi();mappa.inizializza('valle-1');
  for(let g=1;g<=48;g++){
    const st=stagioni.stagioneDi(g);
    if(st==='estate'||c.coperto(g))assert.equal(c.foschia(g,6),0,`giorno ${g}`);
    assert.equal(c.foschia(g,10),0);assert.equal(c.foschia(g,2),0);
    if(st==='autunno'&&!c.coperto(g))assert.equal(c.foschia(g,6),1);
    if((st==='primavera'||st==='inverno')&&!c.coperto(g))assert.equal(c.foschia(g,6),meteo.evento(g-1)==='pioggia'?1:0,`giorno ${g}`);
  }
  const a=await import('../arte/atmosfera.js');
  const q={sinistra:0,destra:384,sopra:0,sotto:216};
  const f1=a.fasceDiFoschia(q,0,0.5),f2=a.fasceDiFoschia(q,10,0.5);
  assert.ok(f1.length>=6);assert.ok(f2[0].x!==f1[0].x,'oscilla piano');
});

test('la pioggia migliore: schizzi fuori dall’acqua, cerchi solo sull’acqua, e le regole del meteo non cambiano',async()=>{
  const a=await import('../arte/atmosfera.js');
  const q={sinistra:0,destra:384,sopra:0,sotto:216},acqua=(tx)=>tx<10;
  for(const s of a.schizzi(q,3.3,acqua))assert.ok(Math.floor(s.x/16)>=10);
  const c=[];for(let t=0;t<6;t+=0.5)c.push(...a.cerchi(q,t,acqua));
  assert.ok(c.length>0);for(const x of c)assert.ok(Math.floor(x.x/16)<10&&x.raggio>=1&&x.raggio<=4);
  assert.deepEqual(a.cerchi(q,1,null),[]);
  for(const f of ['meteo.js','infetti.js','orto.js','freddo.js'])
    assert.doesNotMatch(readFileSync(new URL('../regole/'+f,import.meta.url),'utf8'),/cielo\.js/,f);
  assert.ok(readFileSync(new URL('../sw.js',import.meta.url),'utf8').includes('"./regole/cielo.js"'));
  assert.match(readFileSync(new URL('../index.html',import.meta.url),'utf8'),/"\.\/regole\/cielo\.js": "\.\/regole\/cielo\.js\?v=/);
});

// M7.18.56 — i luoghi unici: le regioni, la torre, la cava e il piccone.
const uniciDi=(tipo,quante=2)=>{const f=mappa.laFattoria();return generazione.uniciAttorno(f.tx,f.ty,quante).filter(u=>!tipo||u.unico===tipo);};
test('i luoghi unici: uno per regione, a rotazione, e la regione della fattoria ha la torre',()=>{
  // Il tipo va a rotazione: due regioni vicine mai uguali, e in ogni blocco
  // di 2×2 ci sono tutti e quattro.
  for(let ry=-4;ry<=4;ry++)for(let rx=-4;rx<=4;rx++){
    const t=rovine.tipoDellaRegione(rx,ry);
    assert.notEqual(t,rovine.tipoDellaRegione(rx+1,ry));assert.notEqual(t,rovine.tipoDellaRegione(rx,ry+1));
    const blocco=new Set([t,rovine.tipoDellaRegione(rx+1,ry),rovine.tipoDellaRegione(rx,ry+1),rovine.tipoDellaRegione(rx+1,ry+1)]);
    assert.equal(blocco.size,4);
  }
  assert.equal(rovine.tipoDellaRegione(0,0),'torre');
  let regioni=0,conIlLuogo=0;
  for(const seme of ['valle-1','prova','review','12345']){
    mappa.inizializza(seme);
    const f=mappa.laFattoria(),r0=rovine.regioneDi(Math.floor(f.tx/64),Math.floor(f.ty/64));
    assert.deepEqual(r0,{rx:0,ry:0},'la fattoria sta nella regione di mezzo');
    const torre=uniciDi('torre',0)[0];
    assert.ok(torre,'la torre della fattoria, '+seme);
    assert.ok(Math.hypot(torre.tx0-f.tx,torre.ty0-f.ty)<200,'non lontana: '+seme);
    // Contati sulle celle: ogni regione ne ha al massimo uno, del suo tipo.
    const perRegione=new Map();
    for(let cy=-10;cy<=9;cy++)for(let cx=-10;cx<=9;cx++){
      const r=mappa.rovinaNellaCella(cx,cy);if(!r?.unico)continue;
      const {rx,ry}=rovine.regioneDi(cx,cy),k=rx+','+ry;
      assert.equal(perRegione.has(k),false,'uno solo per regione: '+k);perRegione.set(k,r);
      assert.equal(r.unico,rovine.tipoDellaRegione(rx,ry));
      assert.ok(r.nome&&r.iscrizione);assert.equal(r.luogo,r.unico);
    }
    for(let ry=-2;ry<=2;ry++)for(let rx=-2;rx<=2;rx++){
      regioni++;if(perRegione.has(rx+','+ry))conIlLuogo++;
    }
    // Stabili: ricalcolati da capo sono gli stessi.
    const prima=uniciDi().map(u=>[u.unico,u.tx0,u.ty0]);
    mappa.inizializza(seme);assert.deepEqual(uniciDi().map(u=>[u.unico,u.tx0,u.ty0]),prima);
  }
  // Misurato: quante regioni trovano posto per il loro luogo.
  assert.ok(conIlLuogo/regioni>0.9,`${conIlLuogo} su ${regioni}`);
});
test('le piante della torre e della cava: la torre sul pavimento, la cava tutta roccia e chiusa da pareti',()=>{
  const torre=uniciDi('torre',0)[0],cava=uniciDi('cava')[0];
  assert.ok(cava,'una cava entro due regioni');
  const t=segnoNelLuogo(torre,'T');
  assert.equal(mappa.oggettoGenerato(t.tx,t.ty),OGGETTO.TORRE);
  assert.equal(mappa.oggettoGenerato(segnoNelLuogo(torre,'c').tx,segnoNelLuogo(torre,'c').ty),OGGETTO.CASSA);
  let pareti=0;
  for(let y=0;y<cava.altezza;y++)for(let x=0;x<cava.larghezza;x++){
    if(cava.pianta[y][x]===' ')continue;
    const tx0=cava.tx0+x,ty0=cava.ty0+y;
    assert.equal(generazione.terrenoIn(tx0,ty0,mappa.semeCorrente().valore),TERRENO.ROCCIA,`${x},${y}`);
    if(cava.pianta[y][x]==='k'){pareti++;assert.equal(mappa.oggettoGenerato(tx0,ty0),OGGETTO.PARETE_CAVA);}
  }
  assert.ok(pareti>=20,'pareti: '+pareti);
  // La parete ferma anche lo sguardo, come un muro: da una parte all'altra
  // di una parete non ci si vede, e tolta sì.
  const k=segnoNelLuogo(cava,'k');
  assert.equal(mappa.vedeDa(k.tx,k.ty-1,k.tx,k.ty+1),false);
  modifiche.imposta(k.tx,k.ty,{oggetto:OGGETTO.NESSUNO});
  assert.equal(mappa.vedeDa(k.tx,k.ty-1,k.tx,k.ty+1),true);
});
test('salire sulla torre: un’ora e fiato, la valle per centosessanta tasselli e i luoghi unici di due regioni; di notte no',()=>{
  const torre=uniciDi('torre',0)[0],t=segnoNelLuogo(torre,'T');
  const sotto={...pos(t.tx,t.ty+1),guarda:'su'};
  tempo.impostaOra(23);
  const notte=azioni.azionePossibile(sotto,null);
  assert.equal(notte.tipo,'sali');assert.match(notte.impedito,/notte/);
  assert.equal(azioni.agisci(sotto,null),null);assert.equal(esplorato.quanti(),0);
  tempo.impostaOra(10);
  const giorno=azioni.azionePossibile(sotto,null);
  assert.equal(giorno.verbo,'Sali sulla torre');assert.equal(giorno.impedito,null);
  const esito=azioni.agisci(sotto,null);
  assert.equal(esito.tipo,'salito');
  vicino(tempo.oraCorrente(),11,1e-6);
  assert.ok(bisogni.livello('stanchezza')<=0.9);
  // Il raggio: dentro sì, fuori no.
  const sx=Math.floor(t.tx/16),sy=Math.floor(t.ty/16);
  assert.ok(esplorato.eVisto(sx+9,sy));assert.ok(esplorato.eVisto(sx,sy-9));
  assert.equal(esplorato.eVisto(sx+11,sy),false);assert.equal(esplorato.eVisto(sx+8,sy+8),false);
  assert.equal(esito.scoperti.length/2,esplorato.quanti());
  // Tutti i luoghi unici entro due regioni sono avvistati, anche quelli
  // fuori dal raggio: è la ragione per salire.
  const vicini=uniciDi();
  assert.ok(vicini.length>=6,'luoghi: '+vicini.length);
  for(const u of vicini)assert.ok(esplorato.eAvvistato(u),u.nome+' '+u.tx0);
  assert.ok(vicini.some(u=>Math.hypot(u.tx0-t.tx,u.ty0-t.ty)>200));
  assert.equal(esito.avvistati.length,vicini.length-1,'la torre su cui si sta non si conta');
  // Risalire non mostra niente di nuovo, ma costa lo stesso.
  const fiato=bisogni.livello('stanchezza');
  const ancora=azioni.agisci(sotto,null);
  assert.deepEqual([ancora.scoperti.length,ancora.avvistati.length],[0,0]);
  assert.ok(bisogni.livello('stanchezza')<=fiato-0.1+1e-9);
  // Stanchi non si sale.
  bisogni.consuma('stanchezza',1);
  assert.match(azioni.azionePossibile(sotto,null).impedito,/stanco/);
});
test('i luoghi avvistati si salvano; un salvataggio di prima si apre senza, uno storto si rifiuta',()=>{
  const [a,b]=uniciDi();
  esplorato.avvista(a);
  const stato=salvataggio.istantanea(eroe,0);
  assert.deepEqual(stato.avvistati,[`${a.tx0},${a.ty0}`]);
  esplorato.avvista(b);assert.ok(salvataggio.applica(stato));
  assert.ok(esplorato.eAvvistato(a));assert.equal(esplorato.eAvvistato(b),false);
  const vecchio={...stato};delete vecchio.avvistati;
  assert.ok(salvataggio.valido(vecchio));assert.ok(salvataggio.applica(vecchio));assert.equal(esplorato.eAvvistato(a),false);
  assert.equal(salvataggio.valido({...stato,avvistati:['a,b']}),false);
  assert.equal(salvataggio.valido({...stato,avvistati:'1,2'}),false);
});
test('la cassa della cava ha sempre il piccone, già usato, e la pietra; quella della torre torce e provviste',()=>{
  let cave=0;
  for(const seme of ['valle-1','prova','review','12345']){
    mappa.inizializza(seme);
    for(const cava of uniciDi('cava')){
      cave++;
      const c=segnoNelLuogo(cava,'c'),dentro=contenitori.contenutoDi(c.tx,c.ty).filter(Boolean);
      const piccone=dentro.find(v=>v.cosa==='piccone');
      assert.ok(piccone,'il piccone c’è sempre');
      assert.ok(piccone.usi>=1&&piccone.usi<CATALOGO.piccone.durata,'usato: '+piccone.usi);
      const pietra=dentro.find(v=>v.cosa==='pietra');assert.ok(pietra.quantita>=3&&pietra.quantita<=5);
      assert.deepEqual(contenitori.contenutoDi(c.tx,c.ty),contenitori.contenutoDi(c.tx,c.ty),'sempre lo stesso');
    }
    const torre=uniciDi('torre',0)[0],c=segnoNelLuogo(torre,'c');
    assert.deepEqual(contenitori.contenutoDi(c.tx,c.ty).filter(Boolean).map(v=>v.cosa).sort(),['bacche_secche','fibra','torcia']);
  }
  assert.ok(cave>=8,'cave: '+cave);
  // Si fabbrica solo dopo averlo trovato (M7.18.56.1), e al banco si ripara.
  assert.ok(ricette.RICETTE.filter(r=>r.produce?.cosa==='piccone').every(r=>r.richiede==='piccone'));
  const ripara=ricette.RICETTE.find(r=>r.id==='ripara_piccone');
  assert.ok(ripara?.banco);assert.deepEqual(ripara.costo,[{cosa:'pietra',quante:1},{cosa:'fibra',quante:2}]);
});
test('il piccone: il muro in due colpi invece di cinque, la parete in due invece di quattro, e come arma vale meno dell’ascia',async()=>{
  const {colpiNecessari,dannoDi}=await import('../regole/oggetti.js');
  assert.deepEqual([OGGETTO.SASSO,OGGETTO.MURO,OGGETTO.MURO_ROTTO,OGGETTO.PARETE_CAVA].map(o=>colpiNecessari(o,'piccone')),[1,2,1,2]);
  assert.deepEqual([OGGETTO.SASSO,OGGETTO.MURO,OGGETTO.MURO_ROTTO,OGGETTO.PARETE_CAVA].map(o=>colpiNecessari(o,null)),[2,5,1,4]);
  assert.equal(colpiNecessari(OGGETTO.PARETE_CAVA,'ascia'),4,'l’ascia non aiuta sulla pietra');
  assert.equal(colpiNecessari(OGGETTO.ALBERO,'piccone'),4,'né il piccone sul legno');
  assert.equal(dannoDi('piccone'),2);assert.ok(dannoDi('piccone')<dannoDi('ascia'));
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.PARETE_CAVA});
  inventario.aggiungi('piccone',1);
  assert.equal(azioni.agisci(eroe,'piccone').tipo,'colpo');
  const esito=azioni.agisci(eroe,'piccone');
  assert.equal(esito.tipo,'raccolto');assert.equal(inventario.quante('pietra'),3);
  assert.equal(mappa.oggettoDi(tx+1,ty),OGGETTO.NESSUNO);
  assert.equal(inventario.attrezzo('piccone').usi,48,'si consuma come gli altri');
  // Sul legno il piccone non è l'attrezzo del gesto, ma per la raccolta sì:
  // si consuma lo stesso, come l'ascia su un sasso.
  const imp=await import('../arte/sprite-impugnati.js');
  assert.ok(imp.PICCONE.every(r=>r.length===imp.PICCONE[0].length));
  assert.equal(CATALOGO.piccone.impugnato.righe,imp.PICCONE);
});
test('la parete della cava torna all’inizio di ogni stagione, anche d’inverno; il sasso no',()=>{
  const cava=uniciDi('cava')[0],k=segnoNelLuogo(cava,'k');
  const tornati=[];
  modifiche.imposta(k.tx,k.ty,{oggetto:OGGETTO.NESSUNO});
  for(let g=2;g<=17;g++){
    tempo.impostaGiorno(g);ricrescita.nuovoGiorno();
    if(mappa.oggettoDi(k.tx,k.ty)===OGGETTO.PARETE_CAVA){tornati.push(g);modifiche.imposta(k.tx,k.ty,{oggetto:OGGETTO.NESSUNO});}
  }
  assert.deepEqual(tornati,[5,9,13,17]);
  // Il sasso resta finito.
  let sasso=null;
  for(let y=-60;y<60&&!sasso;y++)for(let x=-60;x<60&&!sasso;x++)if(mappa.oggettoGenerato(x,y)===OGGETTO.SASSO)sasso={x,y};
  modifiche.imposta(sasso.x,sasso.y,{oggetto:OGGETTO.NESSUNO});
  for(let g=2;g<=40;g++){tempo.impostaGiorno(g);ricrescita.nuovoGiorno();}
  assert.equal(mappa.oggettoDi(sasso.x,sasso.y),OGGETTO.NESSUNO);
});
test('arrivando a un luogo unico si legge l’iscrizione, e il carattere ha tutte le sue lettere',async()=>{
  const {UNICI}=await import('../arte/luoghi.js');
  const {GLIFI}=await import('../arte/sprite-testo.js');
  for(const u of UNICI){
    assert.match(u.iscrizione,/^«.+»$/);
    for(const ch of (u.nome+u.iscrizione).toUpperCase())assert.ok(GLIFI[ch],`manca il glifo «${ch}» (${u.id})`);
  }
  const gioco=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  assert.match(gioco,/annuncia\(luogo\.nome, [^)]*luogo\.iscrizione\)/);
  assert.match(gioco,/messaggio\.vita -= passo \/ messaggio\.durata/);
  const hud=readFileSync(new URL('../interfaccia/hud.js',import.meta.url),'utf8');
  assert.match(hud,/messaggio\.sotto/);
  const carta=readFileSync(new URL('../interfaccia/mappa.js',import.meta.url),'utf8');
  assert.match(carta,/\["torre", "TORRE"\], \["cava", "CAVA"\]/);
  assert.match(carta.slice(carta.indexOf('function confini'),carta.indexOf('function confini')+900),/tuttiGliAvvistati/);
});

// M7.18.56.1 — il piccone si impara alla cava.
const visibile=id=>ricette.visibili().some(r=>r.id===id);
function prendiDallaCava(){
  const cava=uniciDi('cava')[0],c=segnoNelLuogo(cava,'c');
  const i=contenitori.contenutoDi(c.tx,c.ty).findIndex(v=>v?.cosa==='piccone');
  return contenitori.sposta(c.tx,c.ty,false,i);
}
test('il piccone non compare fra le ricette finché non lo si trova nella cava; poi si fa al banco',()=>{
  assert.equal(visibile('piccone'),false);assert.equal(visibile('ripara_piccone'),false);
  assert.ok(visibile('ascia')&&visibile('ripara_ascia'),'le altre sì');
  // La cassa della torre non insegna niente.
  const torre=uniciDi('torre',0)[0],ct=segnoNelLuogo(torre,'c');
  assert.equal(contenitori.sposta(ct.tx,ct.ty,false,0).imparato,null);
  assert.equal(visibile('piccone'),false);
  const esito=prendiDallaCava();
  assert.equal(esito.cosa,'piccone');assert.equal(esito.imparato,'piccone');
  assert.ok(visibile('piccone')&&visibile('ripara_piccone'));
  assert.equal(ricette.impara('piccone'),false,'si impara una volta sola');
  const r=ricette.RICETTE.find(r=>r.id==='piccone');
  assert.deepEqual(r.costo,[{cosa:'pietra',quante:4},{cosa:'ramo',quante:2},{cosa:'fibra',quante:3}]);
  inventario.svuota();
  inventario.aggiungi('pietra',4);inventario.aggiungi('ramo',2);inventario.aggiungi('fibra',3);
  assert.equal(ricette.fai(r,false).perche,'banco');
  assert.equal(ricette.fai(r,true).fatto,true);
  assert.equal(inventario.quante('piccone'),1);assert.equal(inventario.usiRimasti(inventario.attrezzo('piccone')),50);
  assert.equal(inventario.quante('pietra'),0);
});
test('il piccone imparato si salva e resta al superstite dopo; un salvataggio di prima col piccone lo sa',()=>{
  prendiDallaCava();
  const stato=salvataggio.istantanea(eroe,0);
  assert.deepEqual(stato.imparate,['piccone']);
  ricette.reimposta();inventario.svuota();assert.ok(salvataggio.applica(stato));
  assert.ok(ricette.sa('piccone'));
  // Senza il campo e senza piccone: non lo sa.
  const vecchio={...stato};delete vecchio.imparate;vecchio.inventario=stato.inventario.map(c=>c?.cosa==='piccone'?null:c);
  assert.ok(salvataggio.valido(vecchio));assert.ok(salvataggio.applica(vecchio));assert.equal(ricette.sa('piccone'),false);
  // Senza il campo ma col piccone nello zaino: l'aveva già trovato.
  const colPiccone={...stato};delete colPiccone.imparate;
  assert.ok(salvataggio.applica(colPiccone));assert.ok(ricette.sa('piccone'));
  assert.equal(salvataggio.valido({...stato,imparate:['ascia']}),false);
  assert.equal(salvataggio.valido({...stato,imparate:'piccone'}),false);
  // Il superstite nuovo non tocca quello che si sa: nuovoSuperstite non lo azzera.
  const gioco=readFileSync(new URL('../gioco.js',import.meta.url),'utf8');
  const nuovo=gioco.slice(gioco.indexOf('function nuovoSuperstite'),gioco.indexOf('function nuovoSuperstite')+3000);
  assert.doesNotMatch(nuovo,/ricette\.reimposta|ripristinaImparate/);
  assert.match(gioco,/ricetteVisibili\(\)/);
  assert.match(readFileSync(new URL('../interfaccia/hud.js',import.meta.url),'utf8'),/const elenco = visibili\(\);/);
});

// M7.18.56.2 — la neve cade come la pioggia, piano e sempre dalla stessa parte.
test('la neve scende come la pioggia: il vento non la sposta, e i fiocchi non cambiano strada',()=>{
  const fiocchi=(secondi,aria)=>{const r=[];const p={save(){},restore(){},fillRect(x,y,w,h){r.push([x,y,w,h]);}};
    atmosfera.disegna(p,'neve',secondi,null,{aria});return r;};
  const t=4000.37;
  assert.deepEqual(fiocchi(t,0),fiocchi(t,1.8),'la raffica non tocca i fiocchi');
  // Fotogramma per fotogramma, per quattro secondi: ogni fiocco scende e va
  // verso est, al più di un pixel di lato, mai indietro.
  let prima=fiocchi(t,0.5);
  for(let k=1;k<=240;k++){
    const dopo=fiocchi(t+k/60,0.5+0.5*Math.sin(k));
    assert.equal(dopo.length,prima.length);
    dopo.forEach(([x,y],i)=>{
      const dx=x-prima[i][0],dy=y-prima[i][1];
      if(Math.abs(dy)>100||Math.abs(dx)>100)return; // rientra dall'altro bordo
      assert.ok(dx>=0&&dx<=1,`fiocco ${i}: dx ${dx}`);assert.ok(dy>=0&&dy<=1,`fiocco ${i}: dy ${dy}`);
    });
    prima=dopo;
  }
  // Due piani: grandi e piccoli, più lenti della pioggia.
  const lati=new Set(fiocchi(t,0).map(f=>f[2]));assert.deepEqual([...lati].sort(),[1,2]);
  assert.ok(atmosfera.PENDENZA_NEVE>0&&atmosfera.PENDENZA_NEVE<=0.3);
});
test('con la neve il vento è più calmo che in un giorno sereno',async()=>{
  const effetti=await import('../arte/effetti.js');
  for(let s=0;s<200;s+=7.3){assert.ok(effetti.vento(s,'neve')<effetti.vento(s,'sereno'));assert.ok(effetti.vento(s,'neve')<effetti.vento(s,'pioggia'));}
});

// M7.18.56.3 — la foschia ferma: oscilla appena, e il vento non la porta.
test('i banchi di foschia stanno fermi: oscillano piano attorno alla loro casa, e il vento non li sposta',()=>{
  const q={sinistra:5000,destra:5384,sopra:-300,sotto:-84},t=4100.2;
  assert.deepEqual(atmosfera.fasceDiFoschia(q,t,0),atmosfera.fasceDiFoschia(q,t,1.8),'la raffica non conta');
  let prima=atmosfera.fasceDiFoschia(q,t,0.5);
  for(let k=1;k<=600;k++){
    const dopo=atmosfera.fasceDiFoschia(q,t+k/60,0.5+0.5*Math.sin(k));
    assert.equal(dopo.length,prima.length);
    dopo.forEach((f,i)=>{assert.ok(Math.abs(f.x-prima[i].x)<=0.05,`${f.x-prima[i].x}`);assert.equal(f.y,prima[i].y);});
    prima=dopo;
  }
  const A=atmosfera.OSCILLA_FOSCHIA.ampiezza;
  for(let s=0;s<200;s+=0.7)for(const f of atmosfera.fasceDiFoschia(q,t+s,1))assert.ok(Math.abs(f.x-f.casa)<=A+1e-9);
  const scarti=atmosfera.fasceDiFoschia(q,t,0).map(f=>Math.round((f.x-f.casa)*100));
  assert.ok(new Set(scarti).size>scarti.length/2,'non tutti all’unisono');
});

// M7.18.57 — il mulino e la chiesa.
function davantiA(luogo,segno){const t=segnoNelLuogo(luogo,segno);return {t,eroe:{...pos(t.tx,t.ty+1),guarda:'su'}};}
test('le piante del mulino e della chiesa: macina e campana raggiungibili, una cassa, e le iscrizioni scritte',async()=>{
  const {UNICI}=await import('../arte/luoghi.js');
  const {GLIFI}=await import('../arte/sprite-testo.js');
  assert.deepEqual(UNICI.map(u=>u.id).sort(),['cava','chiesa','mulino','torre']);
  for(const id of ['mulino','chiesa']){
    const u=UNICI.find(x=>x.id===id),w=u.pianta[0].length;
    assert.ok(u.pianta.every(r=>r.length===w));
    assert.equal(u.pianta.join('').split('c').length-1,1,'una cassa');
    for(const ch of (u.nome+u.iscrizione).toUpperCase())assert.ok(GLIFI[ch],ch);
    // Dal bordo si arriva sotto la macina o la campana camminando sul vuoto.
    const h=u.pianta.length,dentro=(x,y)=>x>=0&&y>=0&&x<w&&y<h,cammina=(x,y)=>!dentro(x,y)||'. '.includes(u.pianta[y][x]);
    const visti=new Set(),coda=[[-1,-1]];
    for(let i=0;i<coda.length;i++){const [x,y]=coda[i],k=x+','+y;if(x<-1||y<-1||x>w||y>h||visti.has(k)||!cammina(x,y))continue;visti.add(k);coda.push([x-1,y],[x+1,y],[x,y-1],[x,y+1]);}
    const segno=id==='mulino'?'m':'B';
    const y=u.pianta.findIndex(r=>r.includes(segno)),x=u.pianta[y].indexOf(segno);
    assert.ok(visti.has(`${x},${y+1}`),'si arriva sotto: '+id);
    const yc=u.pianta.findIndex(r=>r.includes('c')),xc=u.pianta[yc].indexOf('c');
    assert.ok([[xc-1,yc],[xc+1,yc],[xc,yc-1],[xc,yc+1]].some(p=>visti.has(p.join(','))),'cassa raggiungibile: '+id);
  }
  const mulino=uniciDi('mulino')[0],chiesa=uniciDi('chiesa')[0];
  assert.ok(mulino&&chiesa,'tutti e due entro due regioni');
  const m=segnoNelLuogo(mulino,'m'),b=segnoNelLuogo(chiesa,'B');
  assert.equal(mappa.oggettoGenerato(m.tx,m.ty),OGGETTO.MACINA);assert.equal(mappa.oggettoGenerato(b.tx,b.ty),OGGETTO.CAMPANA);
});
test('al mulino tre grano fanno una farina, solo alla macina; la farina al fuoco diventa pane',()=>{
  const {t,eroe:e}=davantiA(uniciDi('mulino')[0],'m');
  inventario.aggiungi('grano',2);
  const a=azioni.azionePossibile(e,null);
  assert.equal(a.verbo,'Macina il grano');assert.match(a.impedito,/servono 3 grano/);
  assert.equal(azioni.agisci(e,null),null);
  inventario.aggiungi('grano',5);
  const fiato=bisogni.livello('stanchezza');
  assert.equal(azioni.agisci(e,null).tipo,'macinato');
  assert.equal(inventario.quante('grano'),4);assert.equal(inventario.quante('farina'),1);
  assert.ok(bisogni.livello('stanchezza')<=fiato-0.03+1e-9);
  // Altrove il grano resta grano.
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.NESSUNO});
  assert.notEqual(azioni.azionePossibile(eroe,null)?.tipo,'macina');
  // La farina non si mangia; al fuoco diventa pane.
  assert.equal(CATALOGO.farina.commestibile,undefined);assert.equal(CATALOGO.farina.cuoce,'pane');
  assert.deepEqual([CATALOGO.pane.commestibile.fame,CATALOGO.pane.dura],[0.5,8]);
  modifiche.imposta(tx+1,ty,{oggetto:OGGETTO.FALO_ACCESO,legna:2});
  const cucina=azioni.azionePossibile(eroe,'farina');
  assert.equal(cucina.tipo,'cucina');assert.equal(cucina.diventa,'pane');
  assert.equal(azioni.agisci(eroe,'farina').tipo,'cotto');assert.equal(inventario.quante('pane'),1);
  // La cassa ha sempre farina e grano.
  const c=segnoNelLuogo(uniciDi('mulino')[0],'c');
  assert.deepEqual(contenitori.contenutoDi(c.tx,c.ty).filter(Boolean).map(v=>v.cosa).sort(),['farina','grano']);
});
test('la campana: di giorno no, di notte una volta sola, e fino all’alba gli infetti vanno alla chiesa',()=>{
  const chiesa=uniciDi('chiesa')[0],{t,eroe:e}=davantiA(chiesa,'B');
  tempo.impostaGiorno(3);tempo.impostaOra(12);
  const giorno=azioni.azionePossibile(e,null);
  assert.equal(giorno.verbo,'Suona la campana');assert.match(giorno.impedito,/giorno/);
  assert.equal(azioni.agisci(e,null),null);assert.equal(campana.richiamo(),null);
  // Un infetto lontano, che non vede e non sente niente: vaga.
  const lontano=entita.aggiungi(infettoEntita.crea(e.px+900,e.py+900));
  infetti.percepisci(lontano,0.1,e,0,false);assert.equal(lontano.richiamo,null);
  tempo.impostaOra(22);
  assert.equal(azioni.agisci(e,null).tipo,'suonata');
  assert.ok(chiasso.raggio()>=40*16,'si sente da quaranta tasselli');
  infetti.percepisci(lontano,0.1,e,0,false);
  vicino(lontano.richiamo.x,(t.tx+0.5)*16);vicino(lontano.richiamo.y,(t.ty+0.5)*16);
  // Anche uno nato dopo.
  const nuovo=entita.aggiungi(infettoEntita.crea(e.px-900,e.py+900));
  infetti.percepisci(nuovo,0.1,e,0,false);assert.ok(nuovo.richiamo);
  // Chi ti vede ti insegue lo stesso.
  const vicinissimo=entita.aggiungi(infettoEntita.crea(e.px+20,e.py));
  infetti.percepisci(vicinissimo,0.1,e,0,false);assert.equal(vicinissimo.preda,e);
  // Una volta per notte: anche dopo mezzanotte è la stessa notte.
  assert.match(azioni.azionePossibile(e,null).impedito,/stanotte/);
  tempo.impostaGiorno(4);tempo.impostaOra(3);
  assert.match(azioni.azionePossibile(e,null).impedito,/stanotte/);assert.ok(campana.richiamo());
  // All'alba piena finisce.
  tempo.impostaOra(7.5);assert.equal(campana.richiamo(),null);
  const altro=entita.aggiungi(infettoEntita.crea(e.px+900,e.py-900));
  infetti.percepisci(altro,0.1,e,0,false);assert.equal(altro.richiamo,null);
  // La notte dopo si può di nuovo.
  tempo.impostaOra(22);assert.equal(azioni.azionePossibile(e,null).impedito,null);
});
test('la campana suonata si salva; un salvataggio di prima si apre senza, uno storto si rifiuta',()=>{
  tempo.impostaGiorno(3);tempo.impostaOra(22);
  campana.suona(100,200);
  const stato=salvataggio.istantanea(eroe,0);
  assert.equal(stato.campana.notte,3);
  campana.reimposta();assert.ok(salvataggio.applica(stato));assert.deepEqual(campana.richiamo(),{x:100,y:200});
  const vecchio={...stato};delete vecchio.campana;
  assert.ok(salvataggio.valido(vecchio));assert.ok(salvataggio.applica(vecchio));assert.equal(campana.richiamo(),null);
  assert.equal(salvataggio.valido({...stato,campana:{notte:'3',x:1,y:2}}),false);
  assert.equal(salvataggio.valido({...stato,campana:{notte:3,x:NaN,y:2}}),false);
  assert.ok(readFileSync(new URL('../sw.js',import.meta.url),'utf8').includes('"./regole/campana.js"'));
  assert.match(readFileSync(new URL('../index.html',import.meta.url),'utf8'),/"\.\/regole\/campana\.js": "\.\/regole\/campana\.js\?v=/);
});

// M7.18.58 — il meteo a probabilità: la neve di più giorni resta posata.
test('quando nevica più giorni di fila la neve resta, e si scioglie il giorno dopo l’ultimo',async()=>{
  const c=await cieloDi();mappa.inizializza('valle-1');
  let g=2;while(g<16*30&&!(meteo.evento(g)==='neve'&&meteo.evento(g+1)==='neve'&&meteo.evento(g-1)!=='neve'))g++;
  assert.ok(g<16*30);
  let ultimo=g+1;while(meteo.evento(ultimo+1)==='neve')ultimo++;
  assert.equal(c.neveAPosa(g,0),0);assert.equal(c.neveAPosa(g,9),1);
  for(let d=g+1;d<=ultimo;d++)for(const o of [0,6,12,23])assert.equal(c.neveAPosa(d,o),1,`giorno ${d} ore ${o}`);
  assert.equal(c.neveAPosa(ultimo+1,6),1);assert.equal(c.neveAPosa(ultimo+1,20),0);
});

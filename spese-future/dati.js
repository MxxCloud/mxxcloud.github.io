// Motore dati di Budget futuro: archiviazione nel browser e regole di calcolo.
// L'interfaccia in app.js parla solo con questo modulo.
//
// La differenza con il tracker delle spese passate è il verso del tempo: qui le
// voci descrivono movimenti che devono ancora arrivare — uscite da pagare ed
// entrate da incassare — quindi si programmano su un anno intero, si copiano da
// un mese all'altro e si spostano quando la data cambia. Il registro di ciò che
// è già stato speso resta l'altra applicazione.

// Anche il nome dell'archivio resta invariato: rinominarlo farebbe
// ripartire la app da vuota su ogni dispositivo dove è già in uso.
const NOME_ARCHIVIO = "spese-future";
// Versione 2: le voci hanno un tipo (uscita o entrata) e lo stato si chiama
// "saldata", perché "pagata" non si dice di un'entrata.
const VERSIONE_ARCHIVIO = 2;

// Il deposito si chiama ancora "spese" anche ora che contiene pure le entrate:
// rinominarlo costringerebbe a una migrazione che non darebbe nulla in cambio.
const DEPOSITI = ["spese", "categorie"];

export const TIPI = ["uscita", "entrata"];

export const CATEGORIE_INIZIALI = {
  uscita: ["Casa", "Auto", "Tasse", "Assicurazioni", "Viaggi", "Altro"],
  entrata: ["Stipendio", "Rimborsi", "Affitti", "Altro"],
};

const IMPORTO_MASSIMO = 1_000_000;
const LUNGHEZZA_MASSIMA_NOME = 40;
const FORMATO_MESE = /^\d{4}-\d{2}$/;
const ANNO_MINIMO = 2000;
const ANNO_MASSIMO = 2100;
const BOM_UTF8 = "﻿";

const DIALETTI_CSV = {
  excel: { separatore: ";", decimale: ",", data: "italiana", bom: true },
  standard: { separatore: ",", decimale: ".", data: "iso", bom: false },
};

// I dati stanno in memoria e vengono riscritti su IndexedDB a ogni modifica:
// l'insieme è piccolo, e così filtri e aggregati restano codice sincrono.
const memoria = { voci: [], categorie: [] };
let archivio = null;

// --- archiviazione -------------------------------------------------------

function richiesta(operazione) {
  return new Promise((risolvi, rifiuta) => {
    operazione.onsuccess = () => risolvi(operazione.result);
    operazione.onerror = () => rifiuta(operazione.error);
  });
}

function apriArchivio() {
  return new Promise((risolvi, rifiuta) => {
    const apertura = indexedDB.open(NOME_ARCHIVIO, VERSIONE_ARCHIVIO);
    apertura.onupgradeneeded = () => {
      const db = apertura.result;
      for (const nome of DEPOSITI) {
        if (!db.objectStoreNames.contains(nome)) {
          db.createObjectStore(nome, { keyPath: "id", autoIncrement: true });
        }
      }
    };
    apertura.onsuccess = () => risolvi(apertura.result);
    apertura.onerror = () => rifiuta(apertura.error);
  });
}

async function leggiTutto(deposito) {
  const transazione = archivio.transaction(deposito, "readonly");
  return richiesta(transazione.objectStore(deposito).getAll());
}

async function scrivi(deposito, record) {
  const transazione = archivio.transaction(deposito, "readwrite");
  return richiesta(transazione.objectStore(deposito).put(record));
}

async function rimuovi(deposito, id) {
  const transazione = archivio.transaction(deposito, "readwrite");
  await richiesta(transazione.objectStore(deposito).delete(id));
}

function tipoValido(grezzo) {
  return TIPI.includes(grezzo) ? grezzo : null;
}

/**
 * Porta i record scritti prima delle entrate al formato attuale: erano tutti
 * uscite, e lo stato si chiamava "pagata". La conversione è scritta su disco,
 * così avviene una volta sola.
 */
async function migraDallaVersione1() {
  for (const voce of memoria.voci) {
    if (voce.tipo && "saldata" in voce) continue;
    voce.tipo = voce.tipo ?? "uscita";
    voce.saldata = voce.saldata ?? voce.pagata === true;
    delete voce.pagata;
    await scrivi("spese", voce);
  }
  for (const categoria of memoria.categorie) {
    if (categoria.tipo) continue;
    categoria.tipo = "uscita";
    await scrivi("categorie", categoria);
  }
}

export async function inizializza() {
  archivio = await apriArchivio();
  memoria.voci = await leggiTutto("spese");
  memoria.categorie = await leggiTutto("categorie");

  await migraDallaVersione1();

  // Le categorie predefinite arrivano per tipo: chi usava già la app senza
  // entrate non deve inventarsele a mano la prima volta che ne registra una.
  for (const tipo of TIPI) {
    if (memoria.categorie.some((c) => c.tipo === tipo)) continue;
    for (const nome of CATEGORIE_INIZIALI[tipo]) {
      const id = await scrivi("categorie", { nome, tipo });
      memoria.categorie.push({ id, nome, tipo });
    }
  }

  // Nessuna voce deve restare orfana di una categoria non più in elenco.
  const presenti = new Set(memoria.categorie.map((c) => `${c.tipo}\n${c.nome.toLowerCase()}`));
  for (const voce of memoria.voci) {
    const chiave = `${voce.tipo}\n${voce.categoria.toLowerCase()}`;
    if (presenti.has(chiave)) continue;
    const id = await scrivi("categorie", { nome: voce.categoria, tipo: voce.tipo });
    memoria.categorie.push({ id, nome: voce.categoria, tipo: voce.tipo });
    presenti.add(chiave);
  }
}

// --- date, mesi e anni ---------------------------------------------------

export function isoLocale(data) {
  const scostamento = data.getTimezoneOffset() * 60000;
  return new Date(data - scostamento).toISOString().slice(0, 10);
}

export function oggiIso() {
  return isoLocale(new Date());
}

export function meseCorrente() {
  return oggiIso().slice(0, 7);
}

export function annoCorrente() {
  return oggiIso().slice(0, 4);
}

export function meseDi(iso) {
  return iso.slice(0, 7);
}

export function annoDi(iso) {
  return iso.slice(0, 4);
}

export function mesiTra(primo, ultimo) {
  const mesi = [];
  let [anno, mese] = primo.split("-").map(Number);
  let corrente = primo;
  while (corrente <= ultimo) {
    mesi.push(corrente);
    [anno, mese] = mese === 12 ? [anno + 1, 1] : [anno, mese + 1];
    corrente = `${String(anno).padStart(4, "0")}-${String(mese).padStart(2, "0")}`;
  }
  return mesi;
}

export function mesiDellAnno(anno) {
  return Array.from({ length: 12 }, (_, indice) => `${anno}-${String(indice + 1).padStart(2, "0")}`);
}

export function estremiDelMese(mese) {
  const [anno, numero] = mese.split("-").map(Number);
  // Giorno 0 del mese successivo è l'ultimo di questo, senza aritmetica sulle ore.
  return [`${mese}-01`, isoLocale(new Date(anno, numero, 0))];
}

export function giorniNelMese(mese) {
  const [anno, numero] = mese.split("-").map(Number);
  return new Date(anno, numero, 0).getDate();
}

export function meseSpostato(mese, passo) {
  const [anno, numero] = mese.split("-").map(Number);
  const data = new Date(anno, numero - 1 + passo, 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Sposta una data in un altro mese conservando il giorno quando esiste.
 * Il 31 gennaio spostato a febbraio diventa il 28 (o il 29): inventare il
 * 31 febbraio darebbe una data che il resto del programma rifiuta.
 */
export function giornoNelMese(iso, mese) {
  const giorno = Number(iso.slice(8, 10));
  const ultimo = giorniNelMese(mese);
  return `${mese}-${String(Math.min(giorno, ultimo)).padStart(2, "0")}`;
}

function dataValida(grezzo) {
  const testo = String(grezzo ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(testo)) return null;
  const anno = Number(testo.slice(0, 4));
  if (anno < ANNO_MINIMO || anno > ANNO_MASSIMO) return null;
  const data = new Date(`${testo}T00:00:00`);
  return Number.isNaN(data.getTime()) || isoLocale(data) !== testo ? null : testo;
}

export function meseValido(grezzo) {
  const mese = String(grezzo ?? "").trim();
  if (!FORMATO_MESE.test(mese)) return null;
  const anno = Number(mese.slice(0, 4));
  const numero = Number(mese.slice(5));
  if (anno < ANNO_MINIMO || anno > ANNO_MASSIMO) return null;
  return numero >= 1 && numero <= 12 ? mese : null;
}

// --- validazione ---------------------------------------------------------

export function importoInCentesimi(grezzo) {
  const testo = String(grezzo ?? "").trim().replace(",", ".");
  const importo = testo === "" ? NaN : Number(testo);
  if (!Number.isFinite(importo)) return [null, "L'importo deve essere un numero."];
  if (!(importo > 0)) return [null, "L'importo deve essere maggiore di zero."];
  if (importo > IMPORTO_MASSIMO) {
    return [null, `L'importo non può superare ${IMPORTO_MASSIMO} euro.`];
  }
  return [Math.round(importo * 100), null];
}

export function valida(payload) {
  const errori = [];

  const tipo = tipoValido(payload.tipo);
  if (tipo === null) errori.push("Indica se la voce è un'uscita o un'entrata.");

  const data = dataValida(payload.data);
  if (data === null) errori.push("Indica una data valida nel formato AAAA-MM-GG.");

  const [importoCent, erroreImporto] = importoInCentesimi(payload.importo);
  if (erroreImporto) errori.push(erroreImporto);

  const categoria = tipo ? nomeCategoriaCanonico(payload.categoria, tipo) : null;
  if (categoria === null) errori.push("Scegli una categoria tra quelle disponibili.");

  const descrizione = String(payload.descrizione ?? "").trim().slice(0, 200);
  if (!descrizione) errori.push("Indica una descrizione: è il nome della voce.");

  if (errori.length) return [null, errori];
  return [
    { tipo, data, importoCent, categoria, descrizione, saldata: payload.saldata === true },
    [],
  ];
}

function validaNomeCategoria(grezzo) {
  const nome = String(grezzo ?? "").trim();
  if (!nome) return [null, ["Il nome della categoria non può essere vuoto."]];
  if (nome.length > LUNGHEZZA_MASSIMA_NOME) {
    return [null, [`Il nome non può superare ${LUNGHEZZA_MASSIMA_NOME} caratteri.`]];
  }
  return [nome, []];
}

// --- categorie -----------------------------------------------------------

// Uscite ed entrate hanno elenchi separati: "Stipendio" fra le spese non vuole
// dire nulla, e lo stesso nome può servire da entrambe le parti.
function nomeCategoriaCanonico(grezzo, tipo) {
  const cercato = String(grezzo ?? "").trim().toLowerCase();
  const trovata = memoria.categorie.find(
    (c) => c.tipo === tipo && c.nome.toLowerCase() === cercato
  );
  return trovata ? trovata.nome : null;
}

export function nomiCategorie(tipo) {
  return memoria.categorie
    .filter((c) => c.tipo === tipo)
    .map((c) => c.nome)
    .sort((a, b) => a.localeCompare(b, "it", { sensitivity: "base" }));
}

export function elencaCategorie(tipo) {
  return memoria.categorie
    .filter((categoria) => !tipo || categoria.tipo === tipo)
    .map((categoria) => ({
      id: categoria.id,
      nome: categoria.nome,
      tipo: categoria.tipo,
      usi: memoria.voci.filter((v) => v.tipo === categoria.tipo && v.categoria === categoria.nome)
        .length,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it", { sensitivity: "base" }));
}

export async function aggiungiCategoria(grezzo, grezzoTipo) {
  const tipo = tipoValido(grezzoTipo);
  if (tipo === null) return ["Indica se la categoria è di uscite o di entrate."];

  const [nome, errori] = validaNomeCategoria(grezzo);
  if (errori.length) return errori;
  if (nomeCategoriaCanonico(nome, tipo) !== null) {
    return ["Esiste già una categoria con questo nome."];
  }
  const id = await scrivi("categorie", { nome, tipo });
  memoria.categorie.push({ id, nome, tipo });
  return [];
}

export async function rinominaCategoria(id, grezzo) {
  const [nome, errori] = validaNomeCategoria(grezzo);
  if (errori.length) return errori;

  const categoria = memoria.categorie.find((c) => c.id === id);
  if (!categoria) return ["La categoria non esiste."];

  const omonima = memoria.categorie.find(
    (c) => c.id !== id && c.tipo === categoria.tipo && c.nome.toLowerCase() === nome.toLowerCase()
  );
  if (omonima) return ["Esiste già una categoria con questo nome."];

  const precedente = categoria.nome;
  categoria.nome = nome;
  await scrivi("categorie", { id, nome, tipo: categoria.tipo });

  // Rinominare senza aggiornare i riferimenti lascerebbe voci senza categoria.
  for (const voce of memoria.voci.filter(
    (v) => v.tipo === categoria.tipo && v.categoria === precedente
  )) {
    voce.categoria = nome;
    await scrivi("spese", voce);
  }
  return [];
}

export async function eliminaCategoria(id) {
  const categoria = memoria.categorie.find((c) => c.id === id);
  if (!categoria) return ["La categoria non esiste."];

  const usi = memoria.voci.filter(
    (v) => v.tipo === categoria.tipo && v.categoria === categoria.nome
  ).length;
  if (usi) {
    return [
      `«${categoria.nome}» è usata da ${usi} ${usi === 1 ? "voce" : "voci"}: riassegnale prima di eliminarla.`,
    ];
  }

  await rimuovi("categorie", id);
  memoria.categorie = memoria.categorie.filter((c) => c.id !== id);
  return [];
}

// --- voci ----------------------------------------------------------------

function inEuro(voce) {
  return {
    id: voce.id,
    tipo: voce.tipo,
    data: voce.data,
    mese: meseDi(voce.data),
    importo: voce.importoCent / 100,
    categoria: voce.categoria,
    descrizione: voce.descrizione,
    saldata: voce.saldata === true,
  };
}

function superaFiltri(voce, filtri = {}) {
  if (filtri.tipo && voce.tipo !== filtri.tipo) return false;
  if (filtri.mese && voce.mese !== filtri.mese) return false;
  if (filtri.anno && annoDi(voce.data) !== filtri.anno) return false;
  if (filtri.da && voce.data < filtri.da) return false;
  if (filtri.a && voce.data > filtri.a) return false;
  if (filtri.categoria && voce.categoria !== filtri.categoria) return false;
  if (filtri.stato === "saldate" && !voce.saldata) return false;
  if (filtri.stato === "da-saldare" && voce.saldata) return false;
  if (filtri.testo && !voce.descrizione.toLowerCase().includes(filtri.testo.toLowerCase())) {
    return false;
  }
  return true;
}

export function elencaVoci(filtri = {}) {
  return memoria.voci
    .map(inEuro)
    .filter((voce) => superaFiltri(voce, filtri))
    .sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id);
}

export function vociDelMese(mese, filtri = {}) {
  return elencaVoci({ ...filtri, mese });
}

export async function aggiungiVoce(payload) {
  const [voce, errori] = valida(payload);
  if (errori.length) return errori;
  const id = await scrivi("spese", voce);
  memoria.voci.push({ id, ...voce });
  return [];
}

export async function aggiornaVoce(id, payload) {
  const [voce, errori] = valida(payload);
  if (errori.length) return errori;
  const esistente = memoria.voci.find((v) => v.id === id);
  if (!esistente) return ["La voce da modificare non esiste."];
  Object.assign(esistente, voce);
  await scrivi("spese", esistente);
  return [];
}

export async function eliminaVoce(id) {
  if (!memoria.voci.some((v) => v.id === id)) return ["La voce da eliminare non esiste."];
  await rimuovi("spese", id);
  memoria.voci = memoria.voci.filter((v) => v.id !== id);
  return [];
}

export async function segnaSaldata(id, saldata) {
  const voce = memoria.voci.find((v) => v.id === id);
  if (!voce) return ["La voce non esiste."];
  voce.saldata = saldata === true;
  await scrivi("spese", voce);
  return [];
}

// --- clonazione e spostamento -------------------------------------------

function copiaIn(voce, mese) {
  return {
    tipo: voce.tipo,
    data: giornoNelMese(voce.data, mese),
    importoCent: voce.importoCent,
    categoria: voce.categoria,
    descrizione: voce.descrizione,
    // Le copie nascono da saldare: sono impegni futuri, ed ereditare lo stato
    // dall'originale le darebbe per già pagate o già incassate.
    saldata: false,
  };
}

export async function clonaVoce(id, mesi) {
  const voce = memoria.voci.find((v) => v.id === id);
  if (!voce) return ["La voce da clonare non esiste."];

  const destinazioni = [...new Set(mesi.map(meseValido).filter(Boolean))];
  if (!destinazioni.length) return ["Indica almeno un mese di destinazione valido."];

  for (const mese of destinazioni) {
    const copia = copiaIn(voce, mese);
    const nuovoId = await scrivi("spese", copia);
    memoria.voci.push({ id: nuovoId, ...copia });
  }
  return [];
}

/** Copia tutte le voci di un mese nei mesi indicati. */
export async function clonaMese(origine, mesi) {
  const partenza = meseValido(origine);
  if (partenza === null) return ["Il mese di partenza non è valido."];

  const voci = memoria.voci.filter((v) => meseDi(v.data) === partenza);
  if (!voci.length) return ["Questo mese non ha voci da copiare."];

  const destinazioni = [...new Set(mesi.map(meseValido).filter(Boolean))].filter(
    (mese) => mese !== partenza
  );
  if (!destinazioni.length) {
    return ["Indica almeno un mese di destinazione diverso da quello di partenza."];
  }

  for (const mese of destinazioni) {
    for (const voce of voci) {
      const copia = copiaIn(voce, mese);
      const nuovoId = await scrivi("spese", copia);
      memoria.voci.push({ id: nuovoId, ...copia });
    }
  }
  return [];
}

/** Sposta una voce in un altro mese conservandone il giorno quando esiste. */
export async function spostaVoce(id, mese) {
  const destinazione = meseValido(mese);
  if (destinazione === null) return ["Indica il mese di destinazione nel formato AAAA-MM."];

  const voce = memoria.voci.find((v) => v.id === id);
  if (!voce) return ["La voce da spostare non esiste."];

  voce.data = giornoNelMese(voce.data, destinazione);
  await scrivi("spese", voce);
  return [];
}

/** Sposta tutte le voci di un mese in un altro. */
export async function spostaMese(origine, destinazione) {
  const partenza = meseValido(origine);
  const arrivo = meseValido(destinazione);
  if (partenza === null || arrivo === null) return ["Indica mesi validi nel formato AAAA-MM."];
  if (partenza === arrivo) return ["Il mese di destinazione coincide con quello di partenza."];

  const voci = memoria.voci.filter((v) => meseDi(v.data) === partenza);
  if (!voci.length) return ["Questo mese non ha voci da spostare."];

  for (const voce of voci) {
    voce.data = giornoNelMese(voce.data, arrivo);
    await scrivi("spese", voce);
  }
  return [];
}

// --- riepiloghi ----------------------------------------------------------

function somma(voci) {
  return voci.reduce((totale, voce) => totale + Math.round(voce.importo * 100), 0) / 100;
}

function perCategoria(voci) {
  const totali = new Map();
  let totale = 0;
  for (const voce of voci) {
    const centesimi = Math.round(voce.importo * 100);
    totale += centesimi;
    totali.set(voce.categoria, (totali.get(voce.categoria) ?? 0) + centesimi);
  }
  return [...totali.entries()]
    .sort((x, y) => y[1] - x[1])
    .map(([categoria, valore]) => ({
      categoria,
      totale: valore / 100,
      quota: totale ? valore / totale : 0,
    }));
}

/** Il conto di un insieme di voci: entrate, uscite, saldo e stato di ciascuno. */
export function aggrega(voci) {
  const entrate = voci.filter((v) => v.tipo === "entrata");
  const uscite = voci.filter((v) => v.tipo === "uscita");
  const totaleEntrate = somma(entrate);
  const totaleUscite = somma(uscite);

  return {
    numero: voci.length,
    numeroEntrate: entrate.length,
    numeroUscite: uscite.length,
    entrate: totaleEntrate,
    uscite: totaleUscite,
    saldo: Math.round((totaleEntrate - totaleUscite) * 100) / 100,
    entrateSaldate: somma(entrate.filter((v) => v.saldata)),
    entrateDaSaldare: somma(entrate.filter((v) => !v.saldata)),
    usciteSaldate: somma(uscite.filter((v) => v.saldata)),
    usciteDaSaldare: somma(uscite.filter((v) => !v.saldata)),
    numeroDaSaldare: voci.filter((v) => !v.saldata).length,
    numeroSaldate: voci.filter((v) => v.saldata).length,
    perCategoria: { uscita: perCategoria(uscite), entrata: perCategoria(entrate) },
  };
}

export function riepilogo(filtri = {}) {
  return aggrega(elencaVoci(filtri));
}

export function riepilogoMese(mese, filtri = {}) {
  return { mese, ...aggrega(elencaVoci({ ...filtri, mese })) };
}

/**
 * Il riepilogo di un periodo qualsiasi, con la ripartizione per mese:
 * è quello che serve per vedere in una volta tutto ciò che è stato
 * programmato fra due date.
 */
export function riepilogoPeriodo(filtri = {}) {
  const voci = elencaVoci(filtri);
  const mesi = [...new Set(voci.map((v) => v.mese))].sort();
  return {
    ...aggrega(voci),
    voci,
    perMese: mesi.map((mese) => ({ mese, ...aggrega(voci.filter((v) => v.mese === mese)) })),
  };
}

export function anniConVoci() {
  const anni = new Set(memoria.voci.map((v) => annoDi(v.data)));
  anni.add(annoCorrente());
  return [...anni].sort();
}

/**
 * Il quadro dell'anno: dodici mesi sempre presenti, anche vuoti, perché il
 * calendario deve mostrare i buchi quanto i mesi impegnati.
 */
export function riepilogoAnno(anno, filtri = {}) {
  const voci = elencaVoci({ ...filtri, anno });
  const perMese = mesiDellAnno(anno).map((mese) => ({
    mese,
    ...aggrega(voci.filter((v) => v.mese === mese)),
  }));

  const impegnati = perMese.filter((m) => m.numero > 0);
  const piuCaro = impegnati.reduce((max, m) => (max && max.uscite >= m.uscite ? max : m), null);
  const peggiore = impegnati.reduce((min, m) => (min && min.saldo <= m.saldo ? min : m), null);

  // "Ancora da affrontare" guarda avanti da oggi: le scadenze già passate,
  // saldate o no, non sono più programmazione ma storia.
  const oggi = oggiIso();
  const residue = voci.filter((v) => v.data >= oggi && !v.saldata);

  return {
    anno,
    ...aggrega(voci),
    perMese,
    mesiImpegnati: impegnati.length,
    piuCaro,
    peggiore,
    mediaMensileUscite: somma(voci.filter((v) => v.tipo === "uscita")) / 12,
    residuo: aggrega(residue),
  };
}

/** Le prossime voci ancora da saldare a partire da oggi. */
export function prossimeScadenze(quante = 5) {
  const oggi = oggiIso();
  return elencaVoci()
    .filter((voce) => voce.data >= oggi && !voce.saldata)
    .slice(0, quante);
}

// --- esportazione CSV ----------------------------------------------------

function campoCsv(valore, separatore) {
  const testo = String(valore);
  // Virgolette, separatore e a capo obbligano a racchiudere il campo.
  if (!/["\r\n]/.test(testo) && !testo.includes(separatore)) return testo;
  return `"${testo.replaceAll('"', '""')}"`;
}

function dataNelDialetto(iso, dialetto) {
  if (dialetto.data === "iso") return iso;
  const [anno, mese, giorno] = iso.split("-");
  return `${giorno}/${mese}/${anno}`;
}

export function vociInCsv(filtri = {}, formato = "excel") {
  const dialetto = DIALETTI_CSV[formato] ?? DIALETTI_CSV.excel;

  const righe = [["Data", "Tipo", "Importo", "Categoria", "Descrizione", "Stato"]];
  for (const voce of elencaVoci(filtri)) {
    righe.push([
      dataNelDialetto(voce.data, dialetto),
      voce.tipo === "entrata" ? "Entrata" : "Uscita",
      voce.importo.toFixed(2).replace(".", dialetto.decimale),
      voce.categoria,
      voce.descrizione,
      voce.saldata ? "Saldata" : "Da saldare",
    ]);
  }

  const testo = righe
    .map((riga) => riga.map((campo) => campoCsv(campo, dialetto.separatore)).join(dialetto.separatore))
    .join("\r\n");

  // Senza BOM Excel legge l'UTF-8 come ANSI e storpia le lettere accentate.
  return (dialetto.bom ? BOM_UTF8 : "") + testo + "\r\n";
}

export function nomeFileCsv(filtri = {}) {
  if (filtri.mese) return `budget-futuro_${filtri.mese}.csv`;
  if (filtri.anno) return `budget-futuro_${filtri.anno}.csv`;
  if (filtri.da || filtri.a) {
    return `budget-futuro_${filtri.da ?? "inizio"}_${filtri.a ?? "fine"}.csv`;
  }
  return `budget-futuro_${oggiIso()}.csv`;
}

// --- backup completo -----------------------------------------------------

// Il marchio dentro i file di backup resta quello di prima del nuovo nome:
// cambiarlo renderebbe illeggibili i backup già scaricati.
const FORMATO_BACKUP = "spese-future";
const VERSIONE_BACKUP = 2;

export function esportaBackup() {
  return {
    formato: FORMATO_BACKUP,
    versione: VERSIONE_BACKUP,
    esportato: new Date().toISOString(),
    categorie: memoria.categorie.map((c) => ({ nome: c.nome, tipo: c.tipo })),
    voci: memoria.voci.map((v) => ({
      tipo: v.tipo,
      data: v.data,
      importo: v.importoCent / 100,
      categoria: v.categoria,
      descrizione: v.descrizione,
      saldata: v.saldata === true,
    })),
  };
}

export function nomeFileBackup() {
  return `backup-budget-futuro_${oggiIso()}.json`;
}

async function svuotaTutto() {
  const transazione = archivio.transaction(DEPOSITI, "readwrite");
  for (const deposito of DEPOSITI) {
    await richiesta(transazione.objectStore(deposito).clear());
  }
  memoria.voci = [];
  memoria.categorie = [];
}

/**
 * Riporta un backup al formato attuale. I file scritti prima delle entrate
 * contengono solo uscite, sotto la chiave "spese" e con lo stato "pagata":
 * restano leggibili, altrimenti un backup vecchio diventerebbe carta straccia.
 */
function normalizzaBackup(contenuto) {
  const grezzeVoci = Array.isArray(contenuto.voci)
    ? contenuto.voci
    : Array.isArray(contenuto.spese)
      ? contenuto.spese
      : [];

  const voci = grezzeVoci.map((voce) => ({
    tipo: voce?.tipo ?? "uscita",
    data: voce?.data,
    importo: voce?.importo,
    categoria: voce?.categoria,
    descrizione: voce?.descrizione,
    saldata: voce?.saldata ?? voce?.pagata ?? false,
  }));

  const categorie = (Array.isArray(contenuto.categorie) ? contenuto.categorie : [])
    .map((categoria) =>
      typeof categoria === "string"
        ? { nome: categoria.trim(), tipo: "uscita" }
        : { nome: String(categoria?.nome ?? "").trim(), tipo: tipoValido(categoria?.tipo) ?? "uscita" }
    )
    .filter((categoria) => categoria.nome);

  return { voci, categorie };
}

/**
 * Sostituisce l'intero archivio con il contenuto del backup.
 * Il file arriva dall'esterno, quindi ogni record passa dalle stesse
 * validazioni dell'inserimento manuale: restituisce l'elenco degli errori,
 * e in tal caso non tocca nulla.
 */
export async function importaBackup(contenuto) {
  if (!contenuto || typeof contenuto !== "object") {
    return ["Il file non contiene un backup leggibile."];
  }
  if (contenuto.formato !== FORMATO_BACKUP) {
    return ["Questo file non è un backup di Budget futuro."];
  }
  if (contenuto.versione !== VERSIONE_BACKUP && contenuto.versione !== 1) {
    return [`Il backup è in versione ${contenuto.versione}, non riconosciuta.`];
  }

  const { voci, categorie } = normalizzaBackup(contenuto);

  // Le categorie citate dalle voci devono esistere, altrimenti la validazione
  // le rifiuterebbe: si ricavano dal backup stesso prima di controllare il resto.
  const nomi = new Map(categorie.map((c) => [`${c.tipo}\n${c.nome}`, c]));
  for (const voce of voci) {
    const nome = String(voce.categoria ?? "").trim();
    const tipo = tipoValido(voce.tipo) ?? "uscita";
    if (nome) nomi.set(`${tipo}\n${nome}`, { nome, tipo });
  }

  const precedenti = memoria.categorie;
  memoria.categorie = [...nomi.values()].map((categoria, indice) => ({
    id: -1 - indice,
    ...categoria,
  }));

  const errori = [];
  const valide = [];
  voci.forEach((grezza, indice) => {
    const [voce, suoi] = valida(grezza);
    if (suoi.length) errori.push(`Voce ${indice + 1}: ${suoi.join(" ")}`);
    else valide.push(voce);
  });

  if (errori.length) {
    memoria.categorie = precedenti;
    return errori.slice(0, 10);
  }

  await svuotaTutto();
  for (const categoria of nomi.values()) {
    const id = await scrivi("categorie", categoria);
    memoria.categorie.push({ id, ...categoria });
  }
  for (const voce of valide) {
    const id = await scrivi("spese", voce);
    memoria.voci.push({ id, ...voce });
  }
  return [];
}

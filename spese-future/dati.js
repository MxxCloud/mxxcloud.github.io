// Motore dati del pianificatore: archiviazione nel browser e regole di calcolo.
// L'interfaccia in app.js parla solo con questo modulo.
//
// La differenza con il tracker delle spese passate è il verso del tempo: qui le
// voci descrivono impegni che devono ancora arrivare, quindi si programmano su
// un anno intero, si copiano da un mese all'altro e si spostano quando la data
// cambia. Il registro di ciò che è già stato speso resta l'altra applicazione.

const NOME_ARCHIVIO = "spese-future";
const VERSIONE_ARCHIVIO = 1;

export const CATEGORIE_INIZIALI = [
  "Casa",
  "Auto",
  "Tasse",
  "Assicurazioni",
  "Viaggi",
  "Altro",
];

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
const memoria = { spese: [], categorie: [] };
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
      for (const nome of ["spese", "categorie"]) {
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

export async function inizializza() {
  archivio = await apriArchivio();
  memoria.spese = await leggiTutto("spese");
  memoria.categorie = await leggiTutto("categorie");

  if (memoria.categorie.length === 0) {
    for (const nome of CATEGORIE_INIZIALI) {
      const id = await scrivi("categorie", { nome });
      memoria.categorie.push({ id, nome });
    }
  }

  // Nessuna spesa deve restare orfana di una categoria non più in elenco.
  const presenti = new Set(memoria.categorie.map((c) => c.nome.toLowerCase()));
  for (const spesa of memoria.spese) {
    if (!presenti.has(spesa.categoria.toLowerCase())) {
      const id = await scrivi("categorie", { nome: spesa.categoria });
      memoria.categorie.push({ id, nome: spesa.categoria });
      presenti.add(spesa.categoria.toLowerCase());
    }
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

  const data = dataValida(payload.data);
  if (data === null) errori.push("Indica una data valida nel formato AAAA-MM-GG.");

  const [importoCent, erroreImporto] = importoInCentesimi(payload.importo);
  if (erroreImporto) errori.push(erroreImporto);

  const categoria = nomeCategoriaCanonico(payload.categoria);
  if (categoria === null) errori.push("Scegli una categoria tra quelle disponibili.");

  const descrizione = String(payload.descrizione ?? "").trim().slice(0, 200);
  if (!descrizione) errori.push("Indica una descrizione: è il nome dell'impegno.");

  if (errori.length) return [null, errori];
  return [{ data, importoCent, categoria, descrizione, pagata: payload.pagata === true }, []];
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

function nomeCategoriaCanonico(grezzo) {
  const cercato = String(grezzo ?? "").trim().toLowerCase();
  const trovata = memoria.categorie.find((c) => c.nome.toLowerCase() === cercato);
  return trovata ? trovata.nome : null;
}

export function nomiCategorie() {
  return memoria.categorie
    .map((c) => c.nome)
    .sort((a, b) => a.localeCompare(b, "it", { sensitivity: "base" }));
}

export function elencaCategorie() {
  return memoria.categorie
    .map((categoria) => ({
      id: categoria.id,
      nome: categoria.nome,
      usi: memoria.spese.filter((s) => s.categoria === categoria.nome).length,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it", { sensitivity: "base" }));
}

export async function aggiungiCategoria(grezzo) {
  const [nome, errori] = validaNomeCategoria(grezzo);
  if (errori.length) return errori;
  if (nomeCategoriaCanonico(nome) !== null) {
    return ["Esiste già una categoria con questo nome."];
  }
  const id = await scrivi("categorie", { nome });
  memoria.categorie.push({ id, nome });
  return [];
}

export async function rinominaCategoria(id, grezzo) {
  const [nome, errori] = validaNomeCategoria(grezzo);
  if (errori.length) return errori;

  const categoria = memoria.categorie.find((c) => c.id === id);
  if (!categoria) return ["La categoria non esiste."];

  const omonima = memoria.categorie.find(
    (c) => c.id !== id && c.nome.toLowerCase() === nome.toLowerCase()
  );
  if (omonima) return ["Esiste già una categoria con questo nome."];

  const precedente = categoria.nome;
  categoria.nome = nome;
  await scrivi("categorie", { id, nome });

  // Rinominare senza aggiornare i riferimenti lascerebbe spese senza categoria.
  for (const spesa of memoria.spese.filter((s) => s.categoria === precedente)) {
    spesa.categoria = nome;
    await scrivi("spese", spesa);
  }
  return [];
}

export async function eliminaCategoria(id) {
  const categoria = memoria.categorie.find((c) => c.id === id);
  if (!categoria) return ["La categoria non esiste."];

  const usi = memoria.spese.filter((s) => s.categoria === categoria.nome).length;
  if (usi) {
    return [
      `«${categoria.nome}» è usata da ${usi} ${usi === 1 ? "spesa" : "spese"}: riassegnale prima di eliminarla.`,
    ];
  }

  await rimuovi("categorie", id);
  memoria.categorie = memoria.categorie.filter((c) => c.id !== id);
  return [];
}

// --- spese programmate ---------------------------------------------------

function inEuro(spesa) {
  return {
    id: spesa.id,
    data: spesa.data,
    mese: meseDi(spesa.data),
    importo: spesa.importoCent / 100,
    categoria: spesa.categoria,
    descrizione: spesa.descrizione,
    pagata: spesa.pagata === true,
  };
}

function superaFiltri(voce, filtri = {}) {
  if (filtri.mese && voce.mese !== filtri.mese) return false;
  if (filtri.anno && annoDi(voce.data) !== filtri.anno) return false;
  if (filtri.da && voce.data < filtri.da) return false;
  if (filtri.a && voce.data > filtri.a) return false;
  if (filtri.categoria && voce.categoria !== filtri.categoria) return false;
  if (filtri.stato === "pagate" && !voce.pagata) return false;
  if (filtri.stato === "da-pagare" && voce.pagata) return false;
  if (filtri.testo && !voce.descrizione.toLowerCase().includes(filtri.testo.toLowerCase())) {
    return false;
  }
  return true;
}

export function elencaSpese(filtri = {}) {
  return memoria.spese
    .map(inEuro)
    .filter((spesa) => superaFiltri(spesa, filtri))
    .sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id);
}

export function speseDelMese(mese, filtri = {}) {
  return elencaSpese({ ...filtri, mese });
}

export async function aggiungiSpesa(payload) {
  const [spesa, errori] = valida(payload);
  if (errori.length) return errori;
  const id = await scrivi("spese", spesa);
  memoria.spese.push({ id, ...spesa });
  return [];
}

export async function aggiornaSpesa(id, payload) {
  const [spesa, errori] = valida(payload);
  if (errori.length) return errori;
  const esistente = memoria.spese.find((s) => s.id === id);
  if (!esistente) return ["La spesa da modificare non esiste."];
  Object.assign(esistente, spesa);
  await scrivi("spese", esistente);
  return [];
}

export async function eliminaSpesa(id) {
  if (!memoria.spese.some((s) => s.id === id)) return ["La spesa da eliminare non esiste."];
  await rimuovi("spese", id);
  memoria.spese = memoria.spese.filter((s) => s.id !== id);
  return [];
}

export async function segnaPagata(id, pagata) {
  const spesa = memoria.spese.find((s) => s.id === id);
  if (!spesa) return ["La spesa non esiste."];
  spesa.pagata = pagata === true;
  await scrivi("spese", spesa);
  return [];
}

// --- clonazione e spostamento -------------------------------------------

/**
 * Copia una spesa nei mesi indicati. Le copie nascono da pagare: sono impegni
 * futuri, e ereditare "pagata" dall'originale le darebbe per saldate.
 */
export async function clonaSpesa(id, mesi) {
  const spesa = memoria.spese.find((s) => s.id === id);
  if (!spesa) return ["La spesa da clonare non esiste."];

  const destinazioni = [...new Set(mesi.map(meseValido).filter(Boolean))];
  if (!destinazioni.length) return ["Indica almeno un mese di destinazione valido."];

  for (const mese of destinazioni) {
    const copia = {
      data: giornoNelMese(spesa.data, mese),
      importoCent: spesa.importoCent,
      categoria: spesa.categoria,
      descrizione: spesa.descrizione,
      pagata: false,
    };
    const nuovoId = await scrivi("spese", copia);
    memoria.spese.push({ id: nuovoId, ...copia });
  }
  return [];
}

/** Copia tutte le spese di un mese nei mesi indicati. */
export async function clonaMese(origine, mesi) {
  const partenza = meseValido(origine);
  if (partenza === null) return ["Il mese di partenza non è valido."];

  const voci = memoria.spese.filter((s) => meseDi(s.data) === partenza);
  if (!voci.length) return ["Questo mese non ha spese da copiare."];

  const destinazioni = [...new Set(mesi.map(meseValido).filter(Boolean))].filter(
    (mese) => mese !== partenza
  );
  if (!destinazioni.length) return ["Indica almeno un mese di destinazione diverso da quello di partenza."];

  for (const mese of destinazioni) {
    for (const spesa of voci) {
      const copia = {
        data: giornoNelMese(spesa.data, mese),
        importoCent: spesa.importoCent,
        categoria: spesa.categoria,
        descrizione: spesa.descrizione,
        pagata: false,
      };
      const nuovoId = await scrivi("spese", copia);
      memoria.spese.push({ id: nuovoId, ...copia });
    }
  }
  return [];
}

/** Sposta una spesa in un altro mese conservandone il giorno quando esiste. */
export async function spostaSpesa(id, mese) {
  const destinazione = meseValido(mese);
  if (destinazione === null) return ["Indica il mese di destinazione nel formato AAAA-MM."];

  const spesa = memoria.spese.find((s) => s.id === id);
  if (!spesa) return ["La spesa da spostare non esiste."];

  spesa.data = giornoNelMese(spesa.data, destinazione);
  await scrivi("spese", spesa);
  return [];
}

/** Sposta tutte le spese di un mese in un altro. */
export async function spostaMese(origine, destinazione) {
  const partenza = meseValido(origine);
  const arrivo = meseValido(destinazione);
  if (partenza === null || arrivo === null) return ["Indica mesi validi nel formato AAAA-MM."];
  if (partenza === arrivo) return ["Il mese di destinazione coincide con quello di partenza."];

  const voci = memoria.spese.filter((s) => meseDi(s.data) === partenza);
  if (!voci.length) return ["Questo mese non ha spese da spostare."];

  for (const spesa of voci) {
    spesa.data = giornoNelMese(spesa.data, arrivo);
    await scrivi("spese", spesa);
  }
  return [];
}

// --- riepiloghi ----------------------------------------------------------

function perCategoria(voci) {
  const totali = new Map();
  let somma = 0;
  for (const voce of voci) {
    const centesimi = Math.round(voce.importo * 100);
    somma += centesimi;
    totali.set(voce.categoria, (totali.get(voce.categoria) ?? 0) + centesimi);
  }
  return [...totali.entries()]
    .sort((x, y) => y[1] - x[1])
    .map(([categoria, valore]) => ({
      categoria,
      totale: valore / 100,
      quota: somma ? valore / somma : 0,
    }));
}

function sommaDi(voci) {
  return voci.reduce((somma, voce) => somma + Math.round(voce.importo * 100), 0) / 100;
}

export function riepilogoMese(mese, filtri = {}) {
  const voci = elencaSpese({ ...filtri, mese });
  const pagate = voci.filter((v) => v.pagata);
  return {
    mese,
    totale: sommaDi(voci),
    numero: voci.length,
    pagato: sommaDi(pagate),
    daPagare: sommaDi(voci.filter((v) => !v.pagata)),
    perCategoria: perCategoria(voci),
  };
}

export function anniConSpese() {
  const anni = new Set(memoria.spese.map((s) => annoDi(s.data)));
  anni.add(annoCorrente());
  return [...anni].sort();
}

/**
 * Il quadro dell'anno: dodici mesi sempre presenti, anche vuoti, perché il
 * calendario deve mostrare i buchi quanto le spese.
 */
export function riepilogoAnno(anno, filtri = {}) {
  const voci = elencaSpese({ ...filtri, anno });
  const mesi = mesiDellAnno(anno).map((mese) => {
    const suoi = voci.filter((v) => v.mese === mese);
    return {
      mese,
      totale: sommaDi(suoi),
      numero: suoi.length,
      pagato: sommaDi(suoi.filter((v) => v.pagata)),
      daPagare: sommaDi(suoi.filter((v) => !v.pagata)),
      perCategoria: perCategoria(suoi),
    };
  });

  const conSpese = mesi.filter((m) => m.numero > 0);
  const piuCaro = conSpese.reduce((max, m) => (max && max.totale >= m.totale ? max : m), null);
  const totale = sommaDi(voci);

  // "Ancora da affrontare" guarda avanti da oggi: le scadenze già passate,
  // pagate o no, non sono più programmazione ma storia.
  const oggi = oggiIso();
  const residue = voci.filter((v) => v.data >= oggi && !v.pagata);

  return {
    anno,
    totale,
    numero: voci.length,
    pagato: sommaDi(voci.filter((v) => v.pagata)),
    daPagare: sommaDi(voci.filter((v) => !v.pagata)),
    residuo: sommaDi(residue),
    numeroResidue: residue.length,
    media: conSpese.length ? totale / conSpese.length : 0,
    mediaMensile: totale / 12,
    mesiConSpese: conSpese.length,
    piuCaro,
    perMese: mesi,
    perCategoria: perCategoria(voci),
  };
}

/** Le prossime scadenze a partire da oggi, per la vista dell'anno. */
export function prossimeScadenze(quante = 5) {
  const oggi = oggiIso();
  return elencaSpese()
    .filter((spesa) => spesa.data >= oggi && !spesa.pagata)
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

export function speseInCsv(filtri = {}, formato = "excel") {
  const dialetto = DIALETTI_CSV[formato] ?? DIALETTI_CSV.excel;

  const righe = [["Data", "Importo", "Categoria", "Descrizione", "Stato"]];
  for (const spesa of elencaSpese(filtri)) {
    righe.push([
      dataNelDialetto(spesa.data, dialetto),
      spesa.importo.toFixed(2).replace(".", dialetto.decimale),
      spesa.categoria,
      spesa.descrizione,
      spesa.pagata ? "Pagata" : "Da pagare",
    ]);
  }

  const testo = righe
    .map((riga) => riga.map((campo) => campoCsv(campo, dialetto.separatore)).join(dialetto.separatore))
    .join("\r\n");

  // Senza BOM Excel legge l'UTF-8 come ANSI e storpia le lettere accentate.
  return (dialetto.bom ? BOM_UTF8 : "") + testo + "\r\n";
}

export function nomeFileCsv(filtri = {}) {
  if (filtri.mese) return `spese-future_${filtri.mese}.csv`;
  if (filtri.anno) return `spese-future_${filtri.anno}.csv`;
  return `spese-future_${oggiIso()}.csv`;
}

// --- backup completo -----------------------------------------------------

const FORMATO_BACKUP = "spese-future";
const VERSIONE_BACKUP = 1;

export function esportaBackup() {
  return {
    formato: FORMATO_BACKUP,
    versione: VERSIONE_BACKUP,
    esportato: new Date().toISOString(),
    categorie: memoria.categorie.map((c) => c.nome),
    spese: memoria.spese.map((s) => ({
      data: s.data,
      importo: s.importoCent / 100,
      categoria: s.categoria,
      descrizione: s.descrizione,
      pagata: s.pagata === true,
    })),
  };
}

export function nomeFileBackup() {
  return `backup-spese-future_${oggiIso()}.json`;
}

async function svuotaTutto() {
  const transazione = archivio.transaction(["spese", "categorie"], "readwrite");
  for (const deposito of ["spese", "categorie"]) {
    await richiesta(transazione.objectStore(deposito).clear());
  }
  memoria.spese = [];
  memoria.categorie = [];
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
    return ["Questo file non è un backup del pianificatore di spese future."];
  }
  if (contenuto.versione !== VERSIONE_BACKUP) {
    return [`Il backup è in versione ${contenuto.versione}, non riconosciuta.`];
  }

  const categorie = Array.isArray(contenuto.categorie) ? contenuto.categorie : [];
  const spese = Array.isArray(contenuto.spese) ? contenuto.spese : [];

  // Le categorie citate dalle voci devono esistere, altrimenti la validazione
  // le rifiuterebbe: si ricavano dal backup stesso prima di controllare il resto.
  const nomi = new Set(categorie.map((n) => String(n).trim()).filter(Boolean));
  for (const voce of spese) {
    const nome = String(voce?.categoria ?? "").trim();
    if (nome) nomi.add(nome);
  }

  const precedenti = memoria.categorie;
  memoria.categorie = [...nomi].map((nome, indice) => ({ id: -1 - indice, nome }));

  const errori = [];
  const valide = [];
  spese.forEach((voce, indice) => {
    const [spesa, suoi] = valida(voce ?? {});
    if (suoi.length) errori.push(`Spesa ${indice + 1}: ${suoi.join(" ")}`);
    else valide.push(spesa);
  });

  if (errori.length) {
    memoria.categorie = precedenti;
    return errori.slice(0, 10);
  }

  await svuotaTutto();
  for (const nome of nomi) {
    const id = await scrivi("categorie", { nome });
    memoria.categorie.push({ id, nome });
  }
  for (const spesa of valide) {
    const id = await scrivi("spese", spesa);
    memoria.spese.push({ id, ...spesa });
  }
  return [];
}

import * as dati from "./dati.js";

// --- elementi ------------------------------------------------------------

const elencoErrori = document.getElementById("errori");
const barraInferiore = document.querySelector(".barra-inferiore");

const annoPrecedente = document.getElementById("anno-precedente");
const annoSuccessivo = document.getElementById("anno-successivo");
const etichettaAnno = document.getElementById("anno-corrente");
const saldoAnno = document.getElementById("saldo-anno");
const flussiAnno = document.getElementById("flussi-anno");
const statoAnno = document.getElementById("stato-anno");
const calendario = document.getElementById("calendario");
const graficoMesi = document.getElementById("grafico-mesi");
const graficoUscite = document.getElementById("grafico-uscite");
const graficoEntrate = document.getElementById("grafico-entrate");
const pilaUscite = document.getElementById("pila-uscite");
const pilaEntrate = document.getElementById("pila-entrate");
const prossime = document.getElementById("prossime");
const kpiEntrate = document.getElementById("kpi-entrate");
const kpiUscite = document.getElementById("kpi-uscite");
const kpiPeggiore = document.getElementById("kpi-peggiore");

const mesePrecedente = document.getElementById("mese-precedente");
const meseSuccessivo = document.getElementById("mese-successivo");
const etichettaMese = document.getElementById("mese-corrente");
const saldoMese = document.getElementById("saldo-mese");
const flussiMese = document.getElementById("flussi-mese");
const statoMese = document.getElementById("stato-mese");
const confrontoMese = document.getElementById("confronto-mese");
const tipoMese = document.getElementById("tipo-mese");
const statoFiltroMese = document.getElementById("stato-filtro-mese");
const bottoneClonaMese = document.getElementById("clona-mese");
const bottoneSpostaMese = document.getElementById("sposta-mese");
const elencoMese = document.getElementById("elenco-mese");
const vuotoMese = document.getElementById("vuoto-mese");

const scorciatoiePeriodo = document.getElementById("scorciatoie-periodo");
const periodoDa = document.getElementById("periodo-da");
const periodoA = document.getElementById("periodo-a");
const periodoTesto = document.getElementById("periodo-testo");
const tipoPeriodo = document.getElementById("tipo-periodo");
const statoPeriodo = document.getElementById("stato-periodo");
const etichettaPeriodo = document.getElementById("etichetta-periodo");
const saldoPeriodo = document.getElementById("saldo-periodo");
const flussiPeriodo = document.getElementById("flussi-periodo");
const kpiDaIncassare = document.getElementById("kpi-da-incassare");
const kpiDaPagare = document.getElementById("kpi-da-pagare");
const kpiSaldate = document.getElementById("kpi-saldate");
const elencoPeriodo = document.getElementById("elenco-periodo");
const vuotoPeriodo = document.getElementById("vuoto-periodo");

const form = document.getElementById("form-voce");
const titoloForm = document.getElementById("titolo-form");
const tipoVoce = document.getElementById("tipo-voce");
const campoData = document.getElementById("data");
const campoImporto = document.getElementById("importo");
const campoDescrizione = document.getElementById("descrizione");
const campoSaldata = document.getElementById("saldata");
const etichettaSaldata = document.getElementById("etichetta-saldata");
const selectCategoria = document.getElementById("categoria");
const bottoneInvia = document.getElementById("bottone-invia");
const bottoneAnnulla = document.getElementById("bottone-annulla");
const apriNuova = document.getElementById("apri-nuova");

const formCategoria = document.getElementById("form-categoria");
const campoNuovaCategoria = document.getElementById("nuova-categoria");
const tipoCategoria = document.getElementById("tipo-categoria");
const elencoCategorie = document.getElementById("elenco-categorie");

const dialogoConferma = document.getElementById("dialogo-conferma");
const titoloConferma = document.getElementById("titolo-conferma");
const dettaglioConferma = document.getElementById("dettaglio-conferma");

const dialogoMesi = document.getElementById("dialogo-mesi");
const titoloMesi = document.getElementById("titolo-mesi");
const dettaglioMesi = document.getElementById("dettaglio-mesi");
const meseDestinazione = document.getElementById("mese-destinazione");
const meseRipetizione = document.getElementById("mese-ripetizione");
const campoRipetizione = document.getElementById("campo-ripetizione");
const confermaMesi = document.getElementById("conferma-mesi");

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
const euroCorto = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
// Il saldo si legge dal segno prima che dal numero: va mostrato sempre.
const euroSegnato = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  signDisplay: "exceptZero",
});
const euroSegnatoCorto = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  signDisplay: "exceptZero",
  maximumFractionDigits: 0,
});
const percentuale = new Intl.NumberFormat("it-IT", { style: "percent", maximumFractionDigits: 0 });
const meseLungo = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" });
const meseNome = new Intl.DateTimeFormat("it-IT", { month: "long" });
const meseBreve = new Intl.DateTimeFormat("it-IT", { month: "short" });
const giornoEsteso = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long" });
const giornoCorto = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" });

let vistaAttiva = "anno";
let annoVisualizzato = dati.annoCorrente();
let meseVisualizzato = dati.meseCorrente();
let filtriMese = { tipo: "", stato: "" };
let idInModifica = null;
let idVoceAperta = null;

// --- colori e formati ----------------------------------------------------

// L'assegnazione segue l'ordine stabile delle categorie del tipo, così un
// colore resta legato alla stessa categoria anche quando un filtro ne toglie
// altre di mezzo. Oltre la sesta si usa un neutro invece di riciclare una tinta.
function coloreCategoria(nome, tipo) {
  const posizione = dati.nomiCategorie(tipo).indexOf(nome);
  return posizione >= 0 && posizione < 6 ? `var(--cat-${posizione + 1})` : "var(--cat-oltre)";
}

function creaPunto(voce) {
  const punto = document.createElement("i");
  punto.className = "punto";
  punto.style.background = coloreCategoria(voce.categoria, voce.tipo);
  return punto;
}

function classeSaldo(valore) {
  if (valore > 0) return "positivo";
  return valore < 0 ? "negativo" : "";
}

function scriviSaldo(elemento, valore, formato = euroSegnato) {
  elemento.textContent = formato.format(valore);
  elemento.classList.remove("positivo", "negativo");
  const classe = classeSaldo(valore);
  if (classe) elemento.classList.add(classe);
}

function importoConSegno(voce) {
  return `${voce.tipo === "entrata" ? "+" : "−"}${euro.format(voce.importo)}`;
}

/** Un'uscita si paga, un'entrata si incassa: le etichette seguono il tipo. */
function verboSaldo(tipo, saldata) {
  if (tipo === "entrata") return saldata ? "Incassata" : "Da incassare";
  return saldata ? "Pagata" : "Da pagare";
}

// --- utilità di interfaccia ---------------------------------------------

function mostraErrori(messaggi) {
  elencoErrori.replaceChildren(
    ...messaggi.map((messaggio) => {
      const voce = document.createElement("li");
      voce.textContent = messaggio;
      return voce;
    })
  );
  elencoErrori.hidden = messaggi.length === 0;
}

function dataLocale(iso) {
  return new Date(`${iso}T00:00:00`);
}

function meseLeggibile(mese) {
  return meseLungo.format(dataLocale(`${mese}-01`));
}

function nomeDelMese(mese) {
  return meseNome.format(dataLocale(`${mese}-01`));
}

/** «a aprile» non si dice: davanti a vocale la preposizione prende la d. */
function aDavanti(nome) {
  return /^[aeiou]/i.test(nome) ? `ad ${nome}` : `a ${nome}`;
}

function creaBottone(testo, classe, azione) {
  const bottone = document.createElement("button");
  bottone.type = "button";
  bottone.className = classe;
  bottone.textContent = testo;
  bottone.addEventListener("click", azione);
  return bottone;
}

function messaggioAssente(testo) {
  const voce = document.createElement("li");
  voce.className = "senza-dati";
  voce.textContent = testo;
  return voce;
}

function creaSotto(testo) {
  const piccolo = document.createElement("small");
  piccolo.textContent = testo;
  return piccolo;
}

/** Elenca solo le quote che esistono: «0,00 € da pagare» è rumore. */
function daSaldare(riepilogo) {
  const parti = [];
  if (riepilogo.entrateDaSaldare) {
    parti.push(`${euro.format(riepilogo.entrateDaSaldare)} da incassare`);
  }
  if (riepilogo.usciteDaSaldare) {
    parti.push(`${euro.format(riepilogo.usciteDaSaldare)} da pagare`);
  }
  return parti.length ? parti.join(" · ") : "tutto saldato";
}

function scriviTessera(elemento, valore, sotto, formato = euroCorto) {
  elemento.replaceChildren(document.createTextNode(formato.format(valore)), creaSotto(sotto));
  elemento.classList.remove("positivo", "negativo");
}

/** Barra impilata delle categorie: le quote diventano larghezze proporzionali. */
function riempiPila(contenitore, perCategoria, tipo) {
  contenitore.replaceChildren(
    ...perCategoria.map((voce) => {
      const segmento = document.createElement("span");
      segmento.style.flex = `${Math.max(voce.quota, 0.005)}`;
      segmento.style.background = coloreCategoria(voce.categoria, tipo);
      segmento.title = `${voce.categoria}: ${euro.format(voce.totale)}`;
      return segmento;
    })
  );
}

function aggiornaChip(gruppo, chiave, valore) {
  for (const chip of gruppo.querySelectorAll(".chip")) {
    chip.setAttribute("aria-pressed", String((chip.dataset[chiave] ?? "") === valore));
  }
}

function mostraVista(nome) {
  vistaAttiva = nome;
  document.body.dataset.vista = nome;
  for (const vista of document.querySelectorAll(".vista")) {
    vista.classList.toggle("attiva", vista.id === `vista-${nome}`);
  }
  for (const voce of barraInferiore.querySelectorAll(".voce-nav")) {
    const attiva = voce.dataset.vista === nome;
    voce.toggleAttribute("aria-current", attiva);
    if (attiva) voce.setAttribute("aria-current", "page");
  }
  window.scrollTo({ top: 0 });
}

/** Le viste guardano lo stesso tempo: aprire un mese sposta anche l'anno. */
function apriMese(mese) {
  meseVisualizzato = mese;
  annoVisualizzato = mese.slice(0, 4);
  idVoceAperta = null;
  tornaANuovaVoce();
  disegna();
  mostraVista("mese");
}

function chiediConferma(titolo, dettaglio) {
  titoloConferma.textContent = titolo;
  dettaglioConferma.textContent = dettaglio;
  dialogoConferma.showModal();
  return new Promise((risolvi) => {
    dialogoConferma.addEventListener(
      "close",
      () => risolvi(dialogoConferma.returnValue === "conferma"),
      { once: true }
    );
  });
}

/**
 * Chiede uno o più mesi di destinazione.
 * Restituisce l'elenco dei mesi scelti, oppure null se si annulla.
 */
function chiediMesi({ titolo, dettaglio, conferma, predefinito, conRipetizione }) {
  titoloMesi.textContent = titolo;
  dettaglioMesi.textContent = dettaglio;
  confermaMesi.textContent = conferma;
  meseDestinazione.value = predefinito;
  meseRipetizione.value = "";
  campoRipetizione.hidden = !conRipetizione;
  dialogoMesi.showModal();

  return new Promise((risolvi) => {
    dialogoMesi.addEventListener(
      "close",
      () => {
        if (dialogoMesi.returnValue !== "conferma") return risolvi(null);
        const da = meseDestinazione.value;
        if (!da) return risolvi(null);
        const a = conRipetizione ? meseRipetizione.value : "";
        risolvi(a && a >= da ? dati.mesiTra(da, a) : [da]);
      },
      { once: true }
    );
  });
}

/** Applica il risultato di una modifica: mostra gli errori oppure ridisegna. */
async function applica(errori) {
  mostraErrori(errori);
  disegna();
  return errori.length === 0;
}

// --- righe delle voci ----------------------------------------------------

function azioniComplete(voce) {
  const azioni = document.createElement("div");
  azioni.className = "azioni-voce";

  azioni.append(
    creaBottone(verboSaldo(voce.tipo, !voce.saldata), "minimo", async (evento) => {
      evento.stopPropagation();
      await applica(await dati.segnaSaldata(voce.id, !voce.saldata));
    }),
    creaBottone("Modifica", "minimo", (evento) => {
      evento.stopPropagation();
      avviaModifica(voce);
    }),
    creaBottone("Clona", "minimo", (evento) => {
      evento.stopPropagation();
      clonaVoce(voce);
    }),
    creaBottone("Sposta", "minimo", (evento) => {
      evento.stopPropagation();
      spostaVoce(voce);
    }),
    creaBottone("Elimina", "minimo pericolo", async (evento) => {
      evento.stopPropagation();
      const confermato = await chiediConferma(
        "Eliminare la voce?",
        `«${voce.descrizione}» da ${euro.format(voce.importo)} verrà cancellata.`
      );
      if (confermato) await applica(await dati.eliminaVoce(voce.id));
    })
  );

  return azioni;
}

function azioniRidotte(voce) {
  const azioni = document.createElement("div");
  azioni.className = "azioni-voce";
  azioni.append(
    creaBottone(verboSaldo(voce.tipo, !voce.saldata), "minimo", async (evento) => {
      evento.stopPropagation();
      await applica(await dati.segnaSaldata(voce.id, !voce.saldata));
    }),
    creaBottone("Apri il mese", "minimo", (evento) => {
      evento.stopPropagation();
      apriMese(voce.mese);
    })
  );
  return azioni;
}

function creaRigaVoce(voce, { conData, azioni }) {
  const elemento = document.createElement("li");
  elemento.className = `voce voce-${voce.tipo}`;
  if (voce.saldata) elemento.classList.add("saldata");
  if (voce.id === idInModifica) elemento.classList.add("in-modifica");
  if (voce.id === idVoceAperta) elemento.classList.add("aperta");

  const corpo = document.createElement("div");
  corpo.className = "corpo-voce";
  const nome = document.createElement("b");
  nome.textContent = voce.descrizione;
  const dettaglio = document.createElement("small");
  const parti = [voce.categoria];
  if (conData) parti.unshift(giornoCorto.format(dataLocale(voce.data)));
  if (voce.saldata) parti.push(verboSaldo(voce.tipo, true).toLowerCase());
  dettaglio.textContent = parti.join(" · ");
  corpo.append(nome, dettaglio);

  const importo = document.createElement("span");
  importo.className = "importo-voce";
  importo.textContent = importoConSegno(voce);

  elemento.append(creaPunto(voce), corpo, importo, azioni(voce));
  elemento.addEventListener("click", () => {
    idVoceAperta = idVoceAperta === voce.id ? null : voce.id;
    disegna();
  });
  return elemento;
}

// --- vista anno ----------------------------------------------------------

function disegnaCalendario(riepilogo) {
  const massimo = Math.max(...riepilogo.perMese.flatMap((m) => [m.entrate, m.uscite]), 0);
  const meseReale = dati.meseCorrente();

  calendario.replaceChildren(
    ...riepilogo.perMese.map((voce) => {
      const elemento = document.createElement("li");
      const scheda = document.createElement("button");
      scheda.type = "button";
      scheda.className = "mese-scheda";
      scheda.dataset.mese = voce.mese;
      if (voce.mese === meseReale) scheda.classList.add("mese-reale");
      if (voce.mese === meseVisualizzato) scheda.classList.add("mese-aperto");
      if (!voce.numero) scheda.classList.add("mese-vuoto");
      scheda.setAttribute(
        "aria-label",
        voce.numero
          ? `${nomeDelMese(voce.mese)}: entrate ${euro.format(voce.entrate)}, uscite ${euro.format(voce.uscite)}, saldo ${euro.format(voce.saldo)}`
          : `${nomeDelMese(voce.mese)}: nessuna voce`
      );

      const nome = document.createElement("span");
      nome.className = "nome-mese";
      nome.textContent = nomeDelMese(voce.mese);

      const saldo = document.createElement("strong");
      saldo.className = "saldo-mese-scheda";
      if (voce.numero) scriviSaldo(saldo, voce.saldo, euroSegnatoCorto);
      else saldo.textContent = "—";

      const dettaglio = document.createElement("span");
      dettaglio.className = "dettaglio-mese";
      dettaglio.textContent = voce.numero
        ? `${voce.numero} ${voce.numero === 1 ? "voce" : "voci"}`
        : "libero";

      // Due barre sulla stessa scala: il confronto fra entrate e uscite si
      // legge senza passare dai numeri, e vale anche fra un mese e l'altro.
      const barre = document.createElement("span");
      barre.className = "barre-mese";
      for (const [valore, classe] of [
        [voce.entrate, "verso-entrata"],
        [voce.uscite, "verso-uscita"],
      ]) {
        const traccia = document.createElement("span");
        traccia.className = "traccia traccia-mese";
        const riempimento = document.createElement("span");
        riempimento.className = `riempimento ${classe}`;
        riempimento.style.width = massimo ? `${(valore / massimo) * 100}%` : "0";
        traccia.append(riempimento);
        barre.append(traccia);
      }

      scheda.append(nome, saldo, dettaglio, barre);
      elemento.append(scheda);
      return elemento;
    })
  );
}

function disegnaColonneMesi(riepilogo) {
  const massimo = Math.max(...riepilogo.perMese.map((m) => Math.abs(m.saldo)), 0);

  graficoMesi.replaceChildren(
    ...riepilogo.perMese.map((voce) => {
      const elemento = document.createElement("li");
      if (voce.mese === meseVisualizzato) elemento.className = "mese-mostrato";

      const valore = document.createElement("span");
      valore.className = "valore-colonna";
      valore.textContent = voce.numero ? euroSegnatoCorto.format(voce.saldo) : "";

      // Le due metà condividono la linea dello zero: sopra i mesi in attivo,
      // sotto quelli in passivo, con la stessa scala.
      const doppia = document.createElement("span");
      doppia.className = "asta-doppia";
      const altezza = massimo ? `${Math.max((Math.abs(voce.saldo) / massimo) * 100, 2)}%` : "0";

      const sopra = document.createElement("span");
      sopra.className = "meta-sopra";
      const sotto = document.createElement("span");
      sotto.className = "meta-sotto";

      const asta = document.createElement("span");
      asta.className = `asta ${voce.saldo >= 0 ? "verso-entrata" : "verso-uscita"}`;
      asta.style.height = voce.numero ? altezza : "0";
      (voce.saldo >= 0 ? sopra : sotto).append(asta);
      doppia.append(sopra, sotto);

      const etichetta = document.createElement("span");
      etichetta.className = "etichetta-colonna";
      etichetta.textContent = meseBreve.format(dataLocale(`${voce.mese}-01`));

      elemento.append(valore, doppia, etichetta);
      elemento.addEventListener("click", () => apriMese(voce.mese));
      return elemento;
    })
  );
}

function disegnaBarreCategorie(contenitore, pila, perCategoria, tipo, assente) {
  riempiPila(pila, perCategoria, tipo);
  contenitore.closest(".scheda").hidden = perCategoria.length === 0 && tipo === "entrata";

  if (!perCategoria.length) {
    contenitore.replaceChildren(messaggioAssente(assente));
    return;
  }

  const massimo = Math.max(...perCategoria.map((v) => v.totale));
  contenitore.replaceChildren(
    ...perCategoria.map((voce) => {
      const elemento = document.createElement("li");

      const etichetta = document.createElement("span");
      etichetta.className = "etichetta-barra";
      const punto = document.createElement("i");
      punto.className = "punto";
      punto.style.background = coloreCategoria(voce.categoria, tipo);
      etichetta.append(punto, voce.categoria);

      const traccia = document.createElement("span");
      traccia.className = "traccia";
      const riempimento = document.createElement("span");
      riempimento.className = "riempimento";
      riempimento.style.width = `${(voce.totale / massimo) * 100}%`;
      riempimento.style.background = coloreCategoria(voce.categoria, tipo);
      traccia.append(riempimento);

      const valore = document.createElement("span");
      valore.className = "valore-barra";
      valore.textContent = `${euro.format(voce.totale)} · ${percentuale.format(voce.quota)}`;

      elemento.append(etichetta, traccia, valore);
      return elemento;
    })
  );
}

function giorniDaOggi(iso) {
  return Math.round((dataLocale(iso) - dataLocale(dati.oggiIso())) / 86400000);
}

function quandoArriva(iso) {
  const giorni = giorniDaOggi(iso);
  if (giorni === 0) return "oggi";
  if (giorni === 1) return "domani";
  if (giorni < 30) return `fra ${giorni} giorni`;
  const mesi = Math.round(giorni / 30);
  return mesi === 1 ? "fra circa un mese" : `fra circa ${mesi} mesi`;
}

function disegnaProssime() {
  const voci = dati.prossimeScadenze(5);
  if (!voci.length) {
    prossime.replaceChildren(messaggioAssente("Niente da saldare da qui in avanti."));
    return;
  }

  prossime.replaceChildren(
    ...voci.map((voce) => {
      const elemento = document.createElement("li");
      elemento.className = `prossima voce-${voce.tipo}`;

      const corpo = document.createElement("span");
      corpo.className = "corpo-voce";
      const nome = document.createElement("b");
      nome.textContent = voce.descrizione;
      const dettaglio = document.createElement("small");
      dettaglio.textContent = `${giornoEsteso.format(dataLocale(voce.data))} · ${quandoArriva(voce.data)}`;
      corpo.append(nome, dettaglio);

      const importo = document.createElement("span");
      importo.className = "importo-voce";
      importo.textContent = importoConSegno(voce);

      elemento.append(creaPunto(voce), corpo, importo);
      elemento.addEventListener("click", () => apriMese(voce.mese));
      return elemento;
    })
  );
}

function disegnaAnno() {
  const riepilogo = dati.riepilogoAnno(annoVisualizzato);

  etichettaAnno.textContent = annoVisualizzato;
  annoPrecedente.disabled = Number(annoVisualizzato) <= 2000;
  annoSuccessivo.disabled = Number(annoVisualizzato) >= 2100;

  scriviSaldo(saldoAnno, riepilogo.saldo);
  flussiAnno.textContent = `Entrate ${euro.format(riepilogo.entrate)} · Uscite ${euro.format(riepilogo.uscite)}`;
  statoAnno.textContent = riepilogo.numero
    ? `${riepilogo.numero} ${riepilogo.numero === 1 ? "voce" : "voci"} · ${daSaldare(riepilogo)}`
    : "Niente di programmato in questo anno.";

  // Senza nulla in programma non c'è niente di «tutto incassato»: la riga
  // sotto il numero lo dice invece di vantare un saldo che non esiste.
  scriviTessera(
    kpiEntrate,
    riepilogo.entrate,
    riepilogo.numeroEntrate === 0
      ? "niente in programma"
      : riepilogo.entrateDaSaldare
        ? `${euroCorto.format(riepilogo.entrateDaSaldare)} da incassare`
        : "tutto incassato"
  );
  scriviTessera(
    kpiUscite,
    riepilogo.uscite,
    riepilogo.numeroUscite === 0
      ? "niente in programma"
      : riepilogo.usciteDaSaldare
        ? `${euroCorto.format(riepilogo.usciteDaSaldare)} da pagare`
        : "tutto pagato"
  );

  if (riepilogo.peggiore) {
    scriviSaldo(kpiPeggiore, riepilogo.peggiore.saldo, euroSegnatoCorto);
    kpiPeggiore.append(creaSotto(nomeDelMese(riepilogo.peggiore.mese)));
  } else {
    kpiPeggiore.replaceChildren(document.createTextNode("—"), creaSotto("nessun mese impegnato"));
    kpiPeggiore.classList.remove("positivo", "negativo");
  }

  disegnaCalendario(riepilogo);
  disegnaColonneMesi(riepilogo);
  disegnaBarreCategorie(
    graficoUscite,
    pilaUscite,
    riepilogo.perCategoria.uscita,
    "uscita",
    "Nessuna uscita programmata in questo anno."
  );
  disegnaBarreCategorie(
    graficoEntrate,
    pilaEntrate,
    riepilogo.perCategoria.entrata,
    "entrata",
    "Nessuna entrata programmata in questo anno."
  );
  disegnaProssime();
}

// --- vista mese ----------------------------------------------------------

function confronto(riepilogo) {
  const precedente = dati.riepilogoMese(dati.meseSpostato(meseVisualizzato, -1));
  const nome = aDavanti(nomeDelMese(precedente.mese));

  if (!precedente.numero && !riepilogo.numero) return "";
  if (!precedente.numero) return `Niente era programmato ${nome}.`;

  const differenza = Math.round((riepilogo.saldo - precedente.saldo) * 100) / 100;
  if (differenza === 0) return `Stesso saldo ${nome}.`;
  const verso = differenza > 0 ? "meglio" : "peggio";
  return `${euro.format(Math.abs(differenza))} ${verso} ${nome} (${euroSegnato.format(precedente.saldo)}).`;
}

function disegnaMese() {
  const riepilogo = dati.riepilogoMese(meseVisualizzato);
  const voci = dati.vociDelMese(meseVisualizzato, filtriMese);

  etichettaMese.textContent = meseLeggibile(meseVisualizzato);
  scriviSaldo(saldoMese, riepilogo.saldo);
  flussiMese.textContent = `Entrate ${euro.format(riepilogo.entrate)} · Uscite ${euro.format(riepilogo.uscite)}`;
  statoMese.textContent = riepilogo.numero
    ? `${riepilogo.numero} ${riepilogo.numero === 1 ? "voce" : "voci"} · ${daSaldare(riepilogo)}`
    : "Niente di programmato in questo mese.";
  confrontoMese.textContent = confronto(riepilogo);

  aggiornaChip(tipoMese, "tipo", filtriMese.tipo);
  aggiornaChip(statoFiltroMese, "stato", filtriMese.stato);
  bottoneClonaMese.disabled = riepilogo.numero === 0;
  bottoneSpostaMese.disabled = riepilogo.numero === 0;

  elencoMese.replaceChildren();
  vuotoMese.hidden = voci.length > 0;
  if (!voci.length) {
    vuotoMese.textContent =
      filtriMese.tipo || filtriMese.stato
        ? "Nessuna voce con questi filtri."
        : "Niente di programmato in questo mese.";
    return;
  }

  let giornoScritto = null;
  for (const voce of voci) {
    if (voce.data !== giornoScritto) {
      giornoScritto = voce.data;
      const intestazione = document.createElement("li");
      intestazione.className = "giorno";
      intestazione.textContent = giornoEsteso.format(dataLocale(voce.data));
      elencoMese.append(intestazione);
    }
    elencoMese.append(creaRigaVoce(voce, { conData: false, azioni: azioniComplete }));
  }
}

// --- vista periodo -------------------------------------------------------

function filtriDelPeriodo() {
  const filtri = {};
  if (periodoDa.value) filtri.da = periodoDa.value;
  if (periodoA.value) filtri.a = periodoA.value;
  if (periodoTesto.value.trim()) filtri.testo = periodoTesto.value.trim();
  const tipo = tipoPeriodo.querySelector('.chip[aria-pressed="true"]')?.dataset.tipo;
  if (tipo) filtri.tipo = tipo;
  const stato = statoPeriodo.querySelector('.chip[aria-pressed="true"]')?.dataset.stato;
  if (stato) filtri.stato = stato;
  return filtri;
}

function descriviPeriodo(filtri) {
  if (filtri.da && filtri.a) {
    return `Dal ${giornoCorto.format(dataLocale(filtri.da))} al ${giornoCorto.format(dataLocale(filtri.a))}`;
  }
  if (filtri.da) return `Dal ${giornoCorto.format(dataLocale(filtri.da))} in poi`;
  if (filtri.a) return `Fino al ${giornoCorto.format(dataLocale(filtri.a))}`;
  return "Tutto l'archivio";
}

function disegnaPeriodo() {
  const filtri = filtriDelPeriodo();
  const riepilogo = dati.riepilogoPeriodo(filtri);

  etichettaPeriodo.textContent = descriviPeriodo(filtri);
  scriviSaldo(saldoPeriodo, riepilogo.saldo);
  flussiPeriodo.textContent = `${riepilogo.numero} ${riepilogo.numero === 1 ? "voce" : "voci"} · Entrate ${euro.format(riepilogo.entrate)} · Uscite ${euro.format(riepilogo.uscite)}`;

  scriviTessera(
    kpiDaIncassare,
    riepilogo.entrateDaSaldare,
    `${riepilogo.numeroEntrate} ${riepilogo.numeroEntrate === 1 ? "entrata" : "entrate"} nel periodo`
  );
  scriviTessera(
    kpiDaPagare,
    riepilogo.usciteDaSaldare,
    `${riepilogo.numeroUscite} ${riepilogo.numeroUscite === 1 ? "uscita" : "uscite"} nel periodo`
  );
  scriviSaldo(
    kpiSaldate,
    Math.round((riepilogo.entrateSaldate - riepilogo.usciteSaldate) * 100) / 100,
    euroSegnatoCorto
  );
  kpiSaldate.append(
    creaSotto(
      `${riepilogo.numeroSaldate} ${riepilogo.numeroSaldate === 1 ? "voce saldata" : "voci saldate"}`
    )
  );

  elencoPeriodo.replaceChildren();
  vuotoPeriodo.hidden = riepilogo.numero > 0;
  if (!riepilogo.numero) return;

  // Il raggruppamento per mese è ciò che rende leggibile un periodo lungo:
  // senza, dodici mesi di voci diventano un elenco piatto.
  for (const mese of riepilogo.perMese) {
    const intestazione = document.createElement("li");
    intestazione.className = "mese-gruppo";

    const nome = document.createElement("span");
    nome.textContent = meseLeggibile(mese.mese);
    const totale = document.createElement("strong");
    scriviSaldo(totale, mese.saldo, euroSegnato);
    const dettaglio = document.createElement("small");
    const parti = [];
    if (mese.entrate) parti.push(`+${euro.format(mese.entrate)}`);
    if (mese.uscite) parti.push(`−${euro.format(mese.uscite)}`);
    dettaglio.textContent = parti.join(" · ");

    intestazione.append(nome, dettaglio, totale);
    elencoPeriodo.append(intestazione);

    for (const voce of riepilogo.voci.filter((v) => v.mese === mese.mese)) {
      elencoPeriodo.append(creaRigaVoce(voce, { conData: true, azioni: azioniRidotte }));
    }
  }
}

function impostaPeriodo(periodo) {
  const oggi = new Date();
  const anno = oggi.getFullYear();
  const mese = oggi.getMonth();

  if (periodo === "mese") {
    periodoDa.value = dati.isoLocale(new Date(anno, mese, 1));
    periodoA.value = dati.isoLocale(new Date(anno, mese + 1, 0));
  } else if (periodo === "anno") {
    periodoDa.value = `${anno}-01-01`;
    periodoA.value = `${anno}-12-31`;
  } else if (periodo === "dodici") {
    periodoDa.value = dati.oggiIso();
    periodoA.value = dati.isoLocale(new Date(anno, mese + 12, oggi.getDate()));
  } else {
    periodoDa.value = "";
    periodoA.value = "";
  }
  disegnaPeriodo();
}

// --- inserimento e modifica ---------------------------------------------

function tipoScelto() {
  return tipoVoce.querySelector("input:checked")?.value ?? "uscita";
}

function riempiCategorie() {
  const tipo = tipoScelto();
  const nomi = dati.nomiCategorie(tipo);
  const scelta = selectCategoria.value;
  selectCategoria.replaceChildren(
    ...nomi.map((nome) => {
      const opzione = document.createElement("option");
      opzione.value = nome;
      opzione.textContent = nome;
      return opzione;
    })
  );
  if (nomi.includes(scelta)) selectCategoria.value = scelta;
  etichettaSaldata.textContent = tipo === "entrata" ? "Già incassata" : "Già pagata";
  campoDescrizione.placeholder = tipo === "entrata" ? "es. Stipendio" : "es. Bollo auto";
}

/** La data proposta cade nel mese aperto: è lì che si sta programmando. */
function dataPredefinita() {
  const oggi = dati.oggiIso();
  return dati.meseDi(oggi) === meseVisualizzato ? oggi : `${meseVisualizzato}-01`;
}

function tornaANuovaVoce() {
  idInModifica = null;
  form.reset();
  campoData.value = dataPredefinita();
  campoSaldata.checked = false;
  titoloForm.textContent = "Nuova voce";
  bottoneInvia.textContent = "Aggiungi voce";
  riempiCategorie();
  form.hidden = true;
}

function avviaModifica(voce) {
  idInModifica = voce.id;
  tipoVoce.querySelector(`input[value="${voce.tipo}"]`).checked = true;
  riempiCategorie();
  campoData.value = voce.data;
  campoImporto.value = voce.importo.toFixed(2);
  campoDescrizione.value = voce.descrizione;
  campoSaldata.checked = voce.saldata;
  selectCategoria.value = voce.categoria;
  titoloForm.textContent = voce.tipo === "entrata" ? "Modifica entrata" : "Modifica uscita";
  bottoneInvia.textContent = "Salva modifiche";
  form.hidden = false;
  disegna();
  campoImporto.focus();
}

tipoVoce.addEventListener("change", riempiCategorie);

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const payload = {
    tipo: tipoScelto(),
    data: campoData.value,
    importo: campoImporto.value,
    categoria: selectCategoria.value,
    descrizione: campoDescrizione.value,
    saldata: campoSaldata.checked,
  };

  const errori = idInModifica
    ? await dati.aggiornaVoce(idInModifica, payload)
    : await dati.aggiungiVoce(payload);

  if (errori.length) {
    mostraErrori(errori);
    return;
  }

  // Chi registra una voce in un altro mese si aspetta di vederla: la vista
  // segue la data appena inserita.
  meseVisualizzato = dati.meseDi(campoData.value);
  annoVisualizzato = meseVisualizzato.slice(0, 4);

  mostraErrori([]);
  tornaANuovaVoce();
  disegna();
});

bottoneAnnulla.addEventListener("click", () => {
  tornaANuovaVoce();
  disegna();
});

apriNuova.addEventListener("click", () => {
  tornaANuovaVoce();
  form.hidden = false;
  campoImporto.focus();
  form.scrollIntoView({ block: "nearest" });
});

// --- clonazione e spostamento -------------------------------------------

async function clonaVoce(voce) {
  const mesi = await chiediMesi({
    titolo: voce.tipo === "entrata" ? "Clonare l'entrata" : "Clonare l'uscita",
    dettaglio: `«${voce.descrizione}» da ${euro.format(voce.importo)} verrà copiata nei mesi scelti. Le copie nascono da saldare.`,
    conferma: "Clona",
    predefinito: dati.meseSpostato(voce.mese, 1),
    conRipetizione: true,
  });
  if (!mesi) return;
  await applica(await dati.clonaVoce(voce.id, mesi));
}

async function spostaVoce(voce) {
  const mesi = await chiediMesi({
    titolo: voce.tipo === "entrata" ? "Spostare l'entrata" : "Spostare l'uscita",
    dettaglio: `«${voce.descrizione}» lascerà ${nomeDelMese(voce.mese)}. Il giorno resta lo stesso, se il mese di arrivo lo contiene.`,
    conferma: "Sposta",
    predefinito: dati.meseSpostato(voce.mese, 1),
    conRipetizione: false,
  });
  if (!mesi) return;
  await applica(await dati.spostaVoce(voce.id, mesi[0]));
}

bottoneClonaMese.addEventListener("click", async () => {
  const riepilogo = dati.riepilogoMese(meseVisualizzato);
  const mesi = await chiediMesi({
    titolo: "Clonare il mese",
    dettaglio: `Le ${riepilogo.numero} voci di ${meseLeggibile(meseVisualizzato)} (saldo ${euroSegnato.format(riepilogo.saldo)}) verranno copiate nei mesi scelti.`,
    conferma: "Clona",
    predefinito: dati.meseSpostato(meseVisualizzato, 1),
    conRipetizione: true,
  });
  if (!mesi) return;
  await applica(await dati.clonaMese(meseVisualizzato, mesi));
});

bottoneSpostaMese.addEventListener("click", async () => {
  const riepilogo = dati.riepilogoMese(meseVisualizzato);
  const mesi = await chiediMesi({
    titolo: "Spostare il mese",
    dettaglio: `Le ${riepilogo.numero} voci di ${meseLeggibile(meseVisualizzato)} verranno spostate, lasciando il mese vuoto.`,
    conferma: "Sposta",
    predefinito: dati.meseSpostato(meseVisualizzato, 1),
    conRipetizione: false,
  });
  if (!mesi) return;

  const destinazione = mesi[0];
  if (await applica(await dati.spostaMese(meseVisualizzato, destinazione))) {
    apriMese(destinazione);
  }
});

// --- navigazione e filtri ------------------------------------------------

barraInferiore.addEventListener("click", (evento) => {
  const voce = evento.target.closest(".voce-nav");
  if (voce) mostraVista(voce.dataset.vista);
});

calendario.addEventListener("click", (evento) => {
  const scheda = evento.target.closest(".mese-scheda");
  if (scheda) apriMese(scheda.dataset.mese);
});

annoPrecedente.addEventListener("click", () => {
  annoVisualizzato = String(Number(annoVisualizzato) - 1);
  disegnaAnno();
});

annoSuccessivo.addEventListener("click", () => {
  annoVisualizzato = String(Number(annoVisualizzato) + 1);
  disegnaAnno();
});

function cambiaMese(passo) {
  meseVisualizzato = dati.meseSpostato(meseVisualizzato, passo);
  annoVisualizzato = meseVisualizzato.slice(0, 4);
  idVoceAperta = null;
  if (!idInModifica) campoData.value = dataPredefinita();
  disegna();
}

mesePrecedente.addEventListener("click", () => cambiaMese(-1));
meseSuccessivo.addEventListener("click", () => cambiaMese(1));

tipoMese.addEventListener("click", (evento) => {
  const chip = evento.target.closest(".chip");
  if (!chip) return;
  filtriMese = { ...filtriMese, tipo: chip.dataset.tipo };
  disegnaMese();
});

statoFiltroMese.addEventListener("click", (evento) => {
  const chip = evento.target.closest(".chip");
  if (!chip) return;
  filtriMese = { ...filtriMese, stato: chip.dataset.stato };
  disegnaMese();
});

scorciatoiePeriodo.addEventListener("click", (evento) => {
  const chip = evento.target.closest(".chip");
  if (chip) impostaPeriodo(chip.dataset.periodo);
});

for (const gruppo of [tipoPeriodo, statoPeriodo]) {
  gruppo.addEventListener("click", (evento) => {
    const chip = evento.target.closest(".chip");
    if (!chip) return;
    const chiave = gruppo === tipoPeriodo ? "tipo" : "stato";
    aggiornaChip(gruppo, chiave, chip.dataset[chiave] ?? "");
    disegnaPeriodo();
  });
}

for (const campo of [periodoDa, periodoA, periodoTesto]) {
  campo.addEventListener("input", disegnaPeriodo);
}

// --- categorie -----------------------------------------------------------

function avviaRinomina(voce, categoria) {
  const campo = document.createElement("input");
  campo.type = "text";
  campo.className = "campo-rinomina";
  campo.maxLength = 40;
  campo.value = categoria.nome;

  const salva = creaBottone("Salva", "minimo", async () => {
    await applica(await dati.rinominaCategoria(categoria.id, campo.value));
  });
  const annulla = creaBottone("Annulla", "minimo", () => disegnaGestioneCategorie());

  voce.replaceChildren(campo, salva, annulla);
  campo.focus();
  campo.select();
}

function disegnaGestioneCategorie() {
  const elementi = [];

  for (const tipo of dati.TIPI) {
    const intestazione = document.createElement("li");
    intestazione.className = "gruppo-categorie";
    intestazione.textContent = tipo === "entrata" ? "Entrate" : "Uscite";
    elementi.push(intestazione);

    for (const categoria of dati.elencaCategorie(tipo)) {
      const voce = document.createElement("li");

      const nome = document.createElement("span");
      nome.className = "nome-categoria";
      const punto = document.createElement("i");
      punto.className = "punto";
      punto.style.background = coloreCategoria(categoria.nome, tipo);
      nome.append(punto, categoria.nome);

      const usi = document.createElement("span");
      usi.className = "usi-categoria";
      usi.textContent = categoria.usi
        ? `${categoria.usi} ${categoria.usi === 1 ? "voce" : "voci"}`
        : "non usata";

      voce.append(
        nome,
        usi,
        creaBottone("Rinomina", "minimo", () => avviaRinomina(voce, categoria)),
        creaBottone("Elimina", "minimo pericolo", async () => {
          await applica(await dati.eliminaCategoria(categoria.id));
        })
      );
      elementi.push(voce);
    }
  }

  elencoCategorie.replaceChildren(...elementi);
}

formCategoria.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (await applica(await dati.aggiungiCategoria(campoNuovaCategoria.value, tipoCategoria.value))) {
    campoNuovaCategoria.value = "";
  }
});

// --- esportazione, backup e ripristino ----------------------------------

function scarica(testo, nomeFile, tipo) {
  const indirizzo = URL.createObjectURL(new Blob([testo], { type: tipo }));
  const collegamento = document.createElement("a");
  collegamento.href = indirizzo;
  collegamento.download = nomeFile;
  collegamento.click();
  URL.revokeObjectURL(indirizzo);
}

function scaricaCsv(formato) {
  const filtri = filtriDelPeriodo();
  scarica(dati.vociInCsv(filtri, formato), dati.nomeFileCsv(filtri), "text/csv;charset=utf-8");
}

document.getElementById("esporta-excel").addEventListener("click", () => scaricaCsv("excel"));
document.getElementById("esporta-standard").addEventListener("click", () => scaricaCsv("standard"));

const scaricaBackup = document.getElementById("scarica-backup");
const caricaBackup = document.getElementById("carica-backup");

scaricaBackup.addEventListener("click", () => {
  scarica(
    JSON.stringify(dati.esportaBackup(), null, 2),
    dati.nomeFileBackup(),
    "application/json"
  );
});

caricaBackup.addEventListener("change", async () => {
  const file = caricaBackup.files?.[0];
  if (!file) return;

  const confermato = await chiediConferma(
    "Ripristinare dal backup?",
    `«${file.name}» sostituirà tutte le voci e le categorie registrate ora.`
  );
  if (!confermato) {
    caricaBackup.value = "";
    return;
  }

  let contenuto = null;
  try {
    contenuto = JSON.parse(await file.text());
  } catch {
    mostraErrori(["Il file non è leggibile: non contiene dati in formato JSON."]);
    caricaBackup.value = "";
    return;
  }

  const errori = await dati.importaBackup(contenuto);
  caricaBackup.value = "";
  tornaANuovaVoce();
  await applica(errori);
});

// --- disegno complessivo -------------------------------------------------

function disegna() {
  disegnaGestioneCategorie();
  disegnaAnno();
  disegnaMese();
  disegnaPeriodo();
}

// --- installazione e funzionamento offline -------------------------------

const bottoneInstalla = document.getElementById("installa");
const istruzioniInstalla = document.getElementById("istruzioni-installa");
let invitoInstallazione = null;
let statoOffline = "non supportato da questo browser";

// La registrazione va tentata subito: aspettare il caricamento completo la
// ritarda senza motivo, e il browser valuta l'idoneità all'installazione solo
// dopo che un service worker è attivo.
if ("serviceWorker" in navigator) {
  statoOffline = "registrazione in corso";
  navigator.serviceWorker
    .register("./sw.js")
    .then((registrazione) => {
      statoOffline = registrazione.active ? "attivo" : "in attivazione";
    })
    .catch((errore) => {
      // L'errore va mostrato: silenziarlo rende impossibile capire perché la
      // app non risulta installabile né funziona offline.
      statoOffline = `non riuscita (${errore.message})`;
    });
}

// Alcuni browser non lanciano mai l'invito automatico. Il pulsante resta
// comunque visibile e spiega la strada manuale, invece di sparire in silenzio.
window.addEventListener("beforeinstallprompt", (evento) => {
  evento.preventDefault();
  invitoInstallazione = evento;
  istruzioniInstalla.hidden = true;
});

bottoneInstalla.addEventListener("click", async () => {
  if (invitoInstallazione) {
    bottoneInstalla.hidden = true;
    invitoInstallazione.prompt();
    await invitoInstallazione.userChoice;
    invitoInstallazione = null;
    return;
  }

  istruzioniInstalla.textContent =
    'Dal menu del browser scegli "Installa app" oppure "Aggiungi a schermata Home". ' +
    `Se la voce non c'è, riporta questa riga: ${await diagnosi()}`;
  istruzioniInstalla.hidden = false;
});

/** Stato dei requisiti che il browser controlla prima di offrire l'installazione. */
async function diagnosi() {
  const voci = [`offline ${statoOffline}`];

  voci.push(
    navigator.serviceWorker?.controller ? "pagina controllata" : "pagina NON controllata"
  );

  try {
    const nomi = await caches.keys();
    const deposito = nomi.length ? await caches.open(nomi[0]) : null;
    const quante = deposito ? (await deposito.keys()).length : 0;
    voci.push(`cache ${nomi.join(",") || "assente"} con ${quante} risorse`);
  } catch (errore) {
    voci.push(`cache non leggibile (${errore.name})`);
  }

  try {
    const risposta = await fetch("manifest.webmanifest");
    const manifest = await risposta.json();
    voci.push(`manifesto ${risposta.status}, ${manifest.icons.length} icone`);
  } catch (errore) {
    voci.push(`manifesto non leggibile (${errore.name})`);
  }

  voci.push(`invito automatico ${invitoInstallazione ? "ricevuto" : "mai arrivato"}`);
  return voci.join(" · ");
}

function nascondiSeGiaInstallata() {
  const avviata = window.matchMedia("(display-mode: standalone)").matches;
  bottoneInstalla.hidden = avviata;
  if (avviata) istruzioniInstalla.hidden = true;
}

window.addEventListener("appinstalled", () => {
  bottoneInstalla.hidden = true;
  istruzioniInstalla.hidden = true;
  invitoInstallazione = null;
});

nascondiSeGiaInstallata();

// --- avvio ---------------------------------------------------------------

await dati.inizializza();
mostraVista("anno");
tornaANuovaVoce();
impostaPeriodo("anno");
disegna();

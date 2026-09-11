import * as dati from "./dati.js";

// --- elementi ------------------------------------------------------------

const elencoErrori = document.getElementById("errori");

const annoPrecedente = document.getElementById("anno-precedente");
const annoSuccessivo = document.getElementById("anno-successivo");
const etichettaAnno = document.getElementById("anno-corrente");
const totaleAnno = document.getElementById("totale-anno");
const scomposizioneAnno = document.getElementById("scomposizione-anno");
const calendario = document.getElementById("calendario");
const graficoMesi = document.getElementById("grafico-mesi");
const graficoCategorie = document.getElementById("grafico-categorie");
const pilaCategorie = document.getElementById("pila-categorie");
const prossime = document.getElementById("prossime");
const kpiMedia = document.getElementById("kpi-media");
const kpiPicco = document.getElementById("kpi-picco");
const kpiResiduo = document.getElementById("kpi-residuo");

const mesePrecedente = document.getElementById("mese-precedente");
const meseSuccessivo = document.getElementById("mese-successivo");
const etichettaMese = document.getElementById("mese-corrente");
const totaleMese = document.getElementById("totale-mese");
const scomposizioneMese = document.getElementById("scomposizione-mese");
const confrontoMese = document.getElementById("confronto-mese");
const filtriStato = document.getElementById("filtri-stato");
const bottoneClonaMese = document.getElementById("clona-mese");
const bottoneSpostaMese = document.getElementById("sposta-mese");
const elencoSpese = document.getElementById("elenco-spese");
const vuotoEl = document.getElementById("vuoto");

const form = document.getElementById("form-spesa");
const titoloForm = document.getElementById("titolo-form");
const campoData = document.getElementById("data");
const campoImporto = document.getElementById("importo");
const campoDescrizione = document.getElementById("descrizione");
const campoPagata = document.getElementById("pagata");
const selectCategoria = document.getElementById("categoria");
const bottoneInvia = document.getElementById("bottone-invia");
const bottoneAnnulla = document.getElementById("bottone-annulla");
const apriNuova = document.getElementById("apri-nuova");

const formCategoria = document.getElementById("form-categoria");
const campoNuovaCategoria = document.getElementById("nuova-categoria");
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

const barraInferiore = document.querySelector(".barra-inferiore");

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
const euroCorto = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const percentuale = new Intl.NumberFormat("it-IT", { style: "percent", maximumFractionDigits: 0 });
const meseLungo = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" });
const meseNome = new Intl.DateTimeFormat("it-IT", { month: "long" });
const meseBreve = new Intl.DateTimeFormat("it-IT", { month: "short" });
const meseEsteso = new Intl.DateTimeFormat("it-IT", { month: "short", year: "numeric" });
const giornoEsteso = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long" });

let vistaAttiva = "anno";
let annoVisualizzato = dati.annoCorrente();
let meseVisualizzato = dati.meseCorrente();
let statoFiltro = "tutte";
let idInModifica = null;
let idSpesaAperta = null;

// --- colori delle categorie ----------------------------------------------

// L'assegnazione segue l'ordine stabile delle categorie, così un colore resta
// legato alla stessa categoria anche quando un filtro ne toglie altre di mezzo.
// Oltre la sesta si usa un neutro invece di riciclare una tinta già in uso.
function coloreCategoria(nome) {
  const posizione = dati.nomiCategorie().indexOf(nome);
  return posizione >= 0 && posizione < 6 ? `var(--cat-${posizione + 1})` : "var(--cat-oltre)";
}

function creaPunto(categoria) {
  const punto = document.createElement("i");
  punto.className = "punto";
  punto.style.background = coloreCategoria(categoria);
  return punto;
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

/** Barra impilata delle categorie: le quote diventano larghezze proporzionali. */
function riempiPila(contenitore, perCategoria) {
  contenitore.replaceChildren(
    ...perCategoria.map((voce) => {
      const segmento = document.createElement("span");
      segmento.style.flex = `${Math.max(voce.quota, 0.005)}`;
      segmento.style.background = coloreCategoria(voce.categoria);
      segmento.title = `${voce.categoria}: ${euro.format(voce.totale)}`;
      return segmento;
    })
  );
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

/** Le due viste guardano lo stesso tempo: aprire un mese sposta anche l'anno. */
function apriMese(mese) {
  meseVisualizzato = mese;
  annoVisualizzato = mese.slice(0, 4);
  idSpesaAperta = null;
  tornaANuovaSpesa();
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

// --- vista anno ----------------------------------------------------------

function disegnaCalendario(riepilogo) {
  const massimo = Math.max(...riepilogo.perMese.map((m) => m.totale), 0);
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
          ? `${nomeDelMese(voce.mese)}: ${voce.numero} ${voce.numero === 1 ? "spesa" : "spese"}, ${euro.format(voce.totale)}`
          : `${nomeDelMese(voce.mese)}: nessuna spesa`
      );

      const nome = document.createElement("span");
      nome.className = "nome-mese";
      nome.textContent = nomeDelMese(voce.mese);

      const importo = document.createElement("strong");
      importo.className = "totale-mese";
      importo.textContent = voce.numero ? euroCorto.format(voce.totale) : "—";

      const conteggio = document.createElement("span");
      conteggio.className = "conteggio-mese";
      conteggio.textContent = voce.numero
        ? `${voce.numero} ${voce.numero === 1 ? "spesa" : "spese"}`
        : "libero";

      const pila = document.createElement("span");
      pila.className = "pila pila-piccola";
      riempiPila(pila, voce.perCategoria);

      // La barra sotto la scheda dà il confronto fra mesi senza leggere i numeri.
      const traccia = document.createElement("span");
      traccia.className = "traccia traccia-mese";
      const riempimento = document.createElement("span");
      riempimento.className = "riempimento";
      riempimento.style.width = massimo ? `${(voce.totale / massimo) * 100}%` : "0";
      traccia.append(riempimento);

      scheda.append(nome, importo, conteggio, pila, traccia);
      elemento.append(scheda);
      return elemento;
    })
  );
}

function disegnaColonneMesi(riepilogo) {
  const massimo = Math.max(...riepilogo.perMese.map((m) => m.totale), 0);

  graficoMesi.replaceChildren(
    ...riepilogo.perMese.map((voce) => {
      const elemento = document.createElement("li");
      if (voce.mese === meseVisualizzato) elemento.className = "mese-mostrato";

      const valore = document.createElement("span");
      valore.className = "valore-colonna";
      valore.textContent = voce.totale ? euroCorto.format(voce.totale) : "";

      const contenitore = document.createElement("span");
      contenitore.className = "contenitore-asta";
      const asta = document.createElement("span");
      asta.className = "asta";
      asta.style.height = massimo ? `${Math.max((voce.totale / massimo) * 100, 2)}%` : "2%";
      contenitore.append(asta);

      const etichetta = document.createElement("span");
      etichetta.className = "etichetta-colonna";
      etichetta.textContent = meseBreve.format(dataLocale(`${voce.mese}-01`));

      elemento.append(valore, contenitore, etichetta);
      elemento.addEventListener("click", () => apriMese(voce.mese));
      return elemento;
    })
  );
}

function disegnaCategorie(riepilogo) {
  riempiPila(pilaCategorie, riepilogo.perCategoria);

  if (!riepilogo.perCategoria.length) {
    graficoCategorie.replaceChildren(messaggioAssente("Nessuna spesa programmata in questo anno."));
    return;
  }

  const massimo = Math.max(...riepilogo.perCategoria.map((v) => v.totale));
  graficoCategorie.replaceChildren(
    ...riepilogo.perCategoria.map((voce) => {
      const elemento = document.createElement("li");

      const etichetta = document.createElement("span");
      etichetta.className = "etichetta-barra";
      etichetta.append(creaPunto(voce.categoria), voce.categoria);

      const traccia = document.createElement("span");
      traccia.className = "traccia";
      const riempimento = document.createElement("span");
      riempimento.className = "riempimento";
      riempimento.style.width = `${(voce.totale / massimo) * 100}%`;
      riempimento.style.background = coloreCategoria(voce.categoria);
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
  const oggi = dataLocale(dati.oggiIso());
  return Math.round((dataLocale(iso) - oggi) / 86400000);
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
    prossime.replaceChildren(messaggioAssente("Nessuna scadenza da qui in avanti."));
    return;
  }

  prossime.replaceChildren(
    ...voci.map((spesa) => {
      const elemento = document.createElement("li");
      elemento.className = "prossima";

      const corpo = document.createElement("span");
      corpo.className = "corpo-spesa";
      const nome = document.createElement("b");
      nome.textContent = spesa.descrizione;
      const dettaglio = document.createElement("small");
      dettaglio.textContent = `${giornoEsteso.format(dataLocale(spesa.data))} · ${quandoArriva(spesa.data)}`;
      corpo.append(nome, dettaglio);

      const importo = document.createElement("span");
      importo.className = "importo-spesa";
      importo.textContent = euro.format(spesa.importo);

      elemento.append(creaPunto(spesa.categoria), corpo, importo);
      elemento.addEventListener("click", () => apriMese(spesa.mese));
      return elemento;
    })
  );
}

function disegnaAnno() {
  const riepilogo = dati.riepilogoAnno(annoVisualizzato);

  etichettaAnno.textContent = annoVisualizzato;
  annoPrecedente.disabled = Number(annoVisualizzato) <= 2000;
  annoSuccessivo.disabled = Number(annoVisualizzato) >= 2100;
  totaleAnno.textContent = euro.format(riepilogo.totale);

  scomposizioneAnno.textContent = riepilogo.numero
    ? `${riepilogo.numero} ${riepilogo.numero === 1 ? "spesa" : "spese"} · ${euro.format(riepilogo.pagato)} già pagate · ${euro.format(riepilogo.daPagare)} da pagare`
    : "Nessuna spesa programmata in questo anno.";

  kpiMedia.replaceChildren(
    document.createTextNode(euroCorto.format(riepilogo.mediaMensile)),
    creaSotto(
      riepilogo.mesiConSpese
        ? `${euroCorto.format(riepilogo.media)} nei mesi impegnati`
        : "su dodici mesi"
    )
  );

  kpiPicco.replaceChildren(
    document.createTextNode(riepilogo.piuCaro ? euroCorto.format(riepilogo.piuCaro.totale) : "—"),
    creaSotto(riepilogo.piuCaro ? nomeDelMese(riepilogo.piuCaro.mese) : "nessun mese impegnato")
  );

  kpiResiduo.replaceChildren(
    document.createTextNode(euroCorto.format(riepilogo.residuo)),
    creaSotto(
      riepilogo.numeroResidue
        ? `${riepilogo.numeroResidue} ${riepilogo.numeroResidue === 1 ? "scadenza" : "scadenze"} da qui in poi`
        : "niente in sospeso"
    )
  );

  disegnaCalendario(riepilogo);
  disegnaColonneMesi(riepilogo);
  disegnaCategorie(riepilogo);
  disegnaProssime();
}

// --- vista mese ----------------------------------------------------------

function meseSpostato(mese, passo) {
  const [anno, numero] = mese.split("-").map(Number);
  const data = new Date(anno, numero - 1 + passo, 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

/** «a aprile» non si dice: davanti a vocale la preposizione prende la d. */
function aDavanti(nome) {
  return /^[aeiou]/i.test(nome) ? `ad ${nome}` : `a ${nome}`;
}

function confronto(riepilogo) {
  const precedente = dati.riepilogoMese(meseSpostato(meseVisualizzato, -1));
  const nome = aDavanti(nomeDelMese(precedente.mese));

  if (!precedente.numero && !riepilogo.numero) return "";
  if (!precedente.numero) return `Niente era programmato ${nome}.`;

  const differenza = riepilogo.totale - precedente.totale;
  if (Math.abs(differenza) < 0.005) return `Come ${nome}.`;
  const verso = differenza > 0 ? "in più" : "in meno";
  return `${euro.format(Math.abs(differenza))} ${verso} rispetto ${nome} (${euro.format(precedente.totale)}).`;
}

function azioniDellaSpesa(spesa) {
  const azioni = document.createElement("div");
  azioni.className = "azioni-spesa";

  azioni.append(
    creaBottone(spesa.pagata ? "Da pagare" : "Pagata", "minimo", async (evento) => {
      evento.stopPropagation();
      await applica(await dati.segnaPagata(spesa.id, !spesa.pagata));
    }),
    creaBottone("Modifica", "minimo", (evento) => {
      evento.stopPropagation();
      avviaModifica(spesa);
    }),
    creaBottone("Clona", "minimo", (evento) => {
      evento.stopPropagation();
      clonaSpesa(spesa);
    }),
    creaBottone("Sposta", "minimo", (evento) => {
      evento.stopPropagation();
      spostaSpesa(spesa);
    }),
    creaBottone("Elimina", "minimo pericolo", async (evento) => {
      evento.stopPropagation();
      const confermato = await chiediConferma(
        "Eliminare la spesa?",
        `«${spesa.descrizione}» da ${euro.format(spesa.importo)} verrà cancellata.`
      );
      if (confermato) await applica(await dati.eliminaSpesa(spesa.id));
    })
  );

  return azioni;
}

function disegnaElencoMese(voci) {
  elencoSpese.replaceChildren();
  vuotoEl.hidden = voci.length > 0;
  if (!voci.length) {
    vuotoEl.textContent =
      statoFiltro === "tutte"
        ? "Nessuna spesa programmata in questo mese."
        : "Nessuna spesa in questo stato.";
    return;
  }

  let giornoScritto = null;
  for (const spesa of voci) {
    if (spesa.data !== giornoScritto) {
      giornoScritto = spesa.data;
      const intestazione = document.createElement("li");
      intestazione.className = "giorno";
      intestazione.textContent = giornoEsteso.format(dataLocale(spesa.data));
      elencoSpese.append(intestazione);
    }

    const elemento = document.createElement("li");
    elemento.className = "spesa";
    if (spesa.pagata) elemento.classList.add("pagata");
    if (spesa.id === idInModifica) elemento.classList.add("in-modifica");
    if (spesa.id === idSpesaAperta) elemento.classList.add("aperta");

    const corpo = document.createElement("div");
    corpo.className = "corpo-spesa";
    const nome = document.createElement("b");
    nome.textContent = spesa.descrizione;
    const dettaglio = document.createElement("small");
    dettaglio.textContent = spesa.pagata ? `${spesa.categoria} · pagata` : spesa.categoria;
    corpo.append(nome, dettaglio);

    const importo = document.createElement("span");
    importo.className = "importo-spesa";
    importo.textContent = euro.format(spesa.importo);

    elemento.append(creaPunto(spesa.categoria), corpo, importo, azioniDellaSpesa(spesa));
    elemento.addEventListener("click", () => {
      idSpesaAperta = idSpesaAperta === spesa.id ? null : spesa.id;
      disegnaMese();
    });
    elencoSpese.append(elemento);
  }
}

function disegnaMese() {
  const filtri = statoFiltro === "tutte" ? {} : { stato: statoFiltro };
  const riepilogo = dati.riepilogoMese(meseVisualizzato);
  const voci = dati.speseDelMese(meseVisualizzato, filtri);

  etichettaMese.textContent = meseLeggibile(meseVisualizzato);
  totaleMese.textContent = euro.format(riepilogo.totale);
  scomposizioneMese.textContent = riepilogo.numero
    ? `${riepilogo.numero} ${riepilogo.numero === 1 ? "spesa" : "spese"} · ${euro.format(riepilogo.daPagare)} ancora da pagare`
    : "Nessuna spesa programmata in questo mese.";
  confrontoMese.textContent = confronto(riepilogo);

  for (const chip of filtriStato.querySelectorAll(".chip")) {
    chip.setAttribute("aria-pressed", String(chip.dataset.stato === statoFiltro));
  }
  bottoneClonaMese.disabled = riepilogo.numero === 0;
  bottoneSpostaMese.disabled = riepilogo.numero === 0;

  disegnaElencoMese(voci);
}

// --- inserimento e modifica ---------------------------------------------

function riempiCategorie() {
  const nomi = dati.nomiCategorie();
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
}

/** La data proposta cade nel mese aperto: è lì che si sta programmando. */
function dataPredefinita() {
  const oggi = dati.oggiIso();
  return dati.meseDi(oggi) === meseVisualizzato ? oggi : `${meseVisualizzato}-01`;
}

function tornaANuovaSpesa() {
  idInModifica = null;
  form.reset();
  campoData.value = dataPredefinita();
  campoPagata.checked = false;
  titoloForm.textContent = "Nuova spesa";
  bottoneInvia.textContent = "Aggiungi spesa";
  form.hidden = true;
}

function avviaModifica(spesa) {
  idInModifica = spesa.id;
  campoData.value = spesa.data;
  campoImporto.value = spesa.importo.toFixed(2);
  campoDescrizione.value = spesa.descrizione;
  campoPagata.checked = spesa.pagata;
  riempiCategorie();
  selectCategoria.value = spesa.categoria;
  titoloForm.textContent = "Modifica spesa";
  bottoneInvia.textContent = "Salva modifiche";
  form.hidden = false;
  disegnaMese();
  campoImporto.focus();
}

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const payload = {
    data: campoData.value,
    importo: campoImporto.value,
    categoria: selectCategoria.value,
    descrizione: campoDescrizione.value,
    pagata: campoPagata.checked,
  };

  const errori = idInModifica
    ? await dati.aggiornaSpesa(idInModifica, payload)
    : await dati.aggiungiSpesa(payload);

  if (errori.length) {
    mostraErrori(errori);
    return;
  }

  // Chi inserisce una spesa in un altro mese si aspetta di vederla:
  // la vista segue la data appena registrata.
  const mese = dati.meseDi(campoData.value);
  meseVisualizzato = mese;
  annoVisualizzato = mese.slice(0, 4);

  mostraErrori([]);
  tornaANuovaSpesa();
  disegna();
});

bottoneAnnulla.addEventListener("click", () => {
  tornaANuovaSpesa();
  disegnaMese();
});

apriNuova.addEventListener("click", () => {
  tornaANuovaSpesa();
  riempiCategorie();
  form.hidden = false;
  campoImporto.focus();
  form.scrollIntoView({ block: "nearest" });
});

// --- clonazione e spostamento -------------------------------------------

async function clonaSpesa(spesa) {
  const mesi = await chiediMesi({
    titolo: "Clonare la spesa",
    dettaglio: `«${spesa.descrizione}» da ${euro.format(spesa.importo)} verrà copiata nei mesi scelti. Le copie nascono da pagare.`,
    conferma: "Clona",
    predefinito: meseSpostato(spesa.mese, 1),
    conRipetizione: true,
  });
  if (!mesi) return;
  await applica(await dati.clonaSpesa(spesa.id, mesi));
}

async function spostaSpesa(spesa) {
  const mesi = await chiediMesi({
    titolo: "Spostare la spesa",
    dettaglio: `«${spesa.descrizione}» lascerà ${nomeDelMese(spesa.mese)}. Il giorno resta lo stesso, se il mese di arrivo lo contiene.`,
    conferma: "Sposta",
    predefinito: meseSpostato(spesa.mese, 1),
    conRipetizione: false,
  });
  if (!mesi) return;
  await applica(await dati.spostaSpesa(spesa.id, mesi[0]));
}

bottoneClonaMese.addEventListener("click", async () => {
  const riepilogo = dati.riepilogoMese(meseVisualizzato);
  const mesi = await chiediMesi({
    titolo: "Clonare il mese",
    dettaglio: `Le ${riepilogo.numero} spese di ${meseLeggibile(meseVisualizzato)} (${euro.format(riepilogo.totale)}) verranno copiate nei mesi scelti.`,
    conferma: "Clona",
    predefinito: meseSpostato(meseVisualizzato, 1),
    conRipetizione: true,
  });
  if (!mesi) return;
  await applica(await dati.clonaMese(meseVisualizzato, mesi));
});

bottoneSpostaMese.addEventListener("click", async () => {
  const riepilogo = dati.riepilogoMese(meseVisualizzato);
  const mesi = await chiediMesi({
    titolo: "Spostare il mese",
    dettaglio: `Le ${riepilogo.numero} spese di ${meseLeggibile(meseVisualizzato)} verranno spostate, lasciando il mese vuoto.`,
    conferma: "Sposta",
    predefinito: meseSpostato(meseVisualizzato, 1),
    conRipetizione: false,
  });
  if (!mesi) return;

  const destinazione = mesi[0];
  if (await applica(await dati.spostaMese(meseVisualizzato, destinazione))) {
    apriMese(destinazione);
  }
});

// --- navigazione ---------------------------------------------------------

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

mesePrecedente.addEventListener("click", () => {
  apriMeseSenzaCambiareVista(meseSpostato(meseVisualizzato, -1));
});

meseSuccessivo.addEventListener("click", () => {
  apriMeseSenzaCambiareVista(meseSpostato(meseVisualizzato, 1));
});

function apriMeseSenzaCambiareVista(mese) {
  meseVisualizzato = mese;
  annoVisualizzato = mese.slice(0, 4);
  idSpesaAperta = null;
  if (!idInModifica) campoData.value = dataPredefinita();
  disegna();
}

filtriStato.addEventListener("click", (evento) => {
  const chip = evento.target.closest(".chip");
  if (!chip) return;
  statoFiltro = chip.dataset.stato;
  disegnaMese();
});

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
  elencoCategorie.replaceChildren(
    ...dati.elencaCategorie().map((categoria) => {
      const voce = document.createElement("li");

      const nome = document.createElement("span");
      nome.className = "nome-categoria";
      nome.append(creaPunto(categoria.nome), categoria.nome);

      const usi = document.createElement("span");
      usi.className = "usi-categoria";
      usi.textContent = categoria.usi
        ? `${categoria.usi} ${categoria.usi === 1 ? "spesa" : "spese"}`
        : "non usata";

      voce.append(
        nome,
        usi,
        creaBottone("Rinomina", "minimo", () => avviaRinomina(voce, categoria)),
        creaBottone("Elimina", "minimo pericolo", async () => {
          await applica(await dati.eliminaCategoria(categoria.id));
        })
      );
      return voce;
    })
  );
}

formCategoria.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (await applica(await dati.aggiungiCategoria(campoNuovaCategoria.value))) {
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
  const filtri = { anno: annoVisualizzato };
  scarica(dati.speseInCsv(filtri, formato), dati.nomeFileCsv(filtri), "text/csv;charset=utf-8");
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
    `«${file.name}» sostituirà tutte le spese e le categorie registrate ora.`
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
  tornaANuovaSpesa();
  await applica(errori);
});

// --- disegno complessivo -------------------------------------------------

function disegna() {
  riempiCategorie();
  disegnaGestioneCategorie();
  disegnaAnno();
  disegnaMese();
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
tornaANuovaSpesa();
disegna();

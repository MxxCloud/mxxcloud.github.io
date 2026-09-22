// Le colture: che cosa si pianta, quando, quanto beve e che cosa rende.
//
// Fino a M7.16 l'orto sapeva fare una cosa sola, la rapa, e le regole erano
// scritte per lei dentro orto.js. Adesso ce ne sono cinque, e ognuna è la
// stessa macchina con numeri diversi: gli stadi sono gli stessi oggetti per
// tutte — seminato, germoglio, cresciuta, matura, a seme — e quello che
// cambia sta qui. Un tassello si ricorda la sua coltura nel campo "coltura";
// senza, è una rapa, così un campo di un salvataggio di prima resta quello
// che era.
//
// Le cinque non sono cinque versioni della stessa cosa. Ognuna risponde a una
// domanda diversa, ed è per questo che vale la pena scegliere:
//
// - la rapa è la tuttofare: tre stagioni, quattro giorni, i semi a parte;
// - la patata è la scorta: lenta, si pianta una patata e ne rendono tre, dura
//   due settimane nello zaino e sopporta la sete meglio di tutte;
// - i fagioli sono l'estate: rendono più di tutti, si ripiantano da sé, ma
//   bevono tanto che un giorno d'estate dimenticato li secca;
// - il cavolo regge il gelo: d'inverno non muore, si ferma, e quello maturo è
//   l'unica cosa fresca di gennaio;
// - il lino non si mangia: rende fibra, cioè bende e giacigli, e contende al
//   cibo lo spazio dell'orto.

import { OGGETTO } from "../mondo/generazione.js";

const { SEMINATO: S, GERMOGLIO: G, CRESCIUTA: C, MATURA: M } = OGGETTO;

// Per ciascuna:
// - seme: la cosa dello zaino che la pianta. Per la patata e i fagioli è il
//   raccolto stesso, e mangiarlo o ripiantarlo è la stessa scelta che la rapa
//   fa fra la matura e quella a seme;
// - stagioni: quando si semina. D'inverno non si semina niente;
// - stadi: la fila dalla semina alla matura, un passo per giorno innaffiato.
//   Uno stadio che si ripete è una coltura più lenta con gli stessi disegni;
// - sete: quanti giorni asciutti di fila la seccano (vedi orto.js);
// - raccolto: cosa rende la matura;
// - aSeme: cosa rende andata a seme, o null se non ci va: una patata lasciata
//   nella terra non fa semi, marcisce;
// - gelo: se d'inverno si ferma invece di morire.
export const COLTURE = {
  rapa: {
    nome: "rapa", seme: "semi", verbo: "Semina",
    stagioni: ["primavera", "estate", "autunno"],
    stadi: [S, G, C, M],
    sete: 3,
    raccolto: [{ cosa: "rapa", quante: 1 }],
    aSeme: [{ cosa: "semi", quante: 3 }],
    gelo: false,
    quando: "le rape si seminano in primavera, d'estate e d'autunno",
  },
  // Sei stadi, cioè cinque innaffiature: è la coltura che chiede più giorni.
  // In cambio una patata ne rende tre e la sete la sopporta: d'estate regge un
  // giorno dimenticato, nelle altre stagioni tre.
  patata: {
    nome: "patata", seme: "patata", verbo: "Pianta",
    stagioni: ["primavera", "estate"],
    stadi: [S, G, G, C, C, M],
    sete: 4,
    raccolto: [{ cosa: "patata", quante: 3 }],
    aSeme: null,
    gelo: false,
    quando: "le patate si piantano in primavera e d'estate",
  },
  // Tre fagioli da uno, e il seme è un fagiolo: nessuna rende di più, perché
  // non c'è da lasciarne una a seme. Ma solo d'estate, e con la sete a due,
  // che d'estate vuol dire che un giorno senz'acqua li secca.
  fagioli: {
    nome: "fagioli", seme: "fagioli", verbo: "Semina",
    stagioni: ["estate"],
    stadi: [S, G, C, C, M],
    sete: 2,
    raccolto: [{ cosa: "fagioli", quante: 3 }],
    aSeme: null,
    gelo: false,
    quando: "i fagioli si seminano d'estate",
  },
  cavolo: {
    nome: "cavolo", seme: "semi_cavolo", verbo: "Semina",
    stagioni: ["primavera", "autunno"],
    stadi: [S, G, C, C, M],
    sete: 3,
    raccolto: [{ cosa: "cavolo", quante: 1 }],
    aSeme: [{ cosa: "semi_cavolo", quante: 3 }],
    gelo: true,
    quando: "il cavolo si semina in primavera e d'autunno",
  },
  lino: {
    nome: "lino", seme: "semi_lino", verbo: "Semina",
    stagioni: ["primavera", "estate"],
    stadi: [S, G, C, C, M],
    sete: 3,
    raccolto: [{ cosa: "fibra", quante: 4 }],
    aSeme: [{ cosa: "semi_lino", quante: 3 }],
    gelo: false,
    quando: "il lino si semina in primavera e d'estate",
  },
};

export const RAPA = "rapa";

// La coltura di un tassello. Senza il campo, o con un nome che non esiste, è
// la rapa: è quello che c'era prima che ce ne fossero altre.
export function di(id) {
  return COLTURE[id] ?? COLTURE[RAPA];
}

export function esiste(id) {
  return Object.hasOwn(COLTURE, id);
}

// Che coltura pianta questa cosa, o null se non pianta niente.
export function dalSeme(cosa) {
  for (const [id, coltura] of Object.entries(COLTURE)) {
    if (coltura.seme === cosa) return id;
  }
  return null;
}

// A che punto della fila sta il tassello. Il passo è scritto sul tassello per
// le colture che ripetono uno stadio — due germogli di fila sono lo stesso
// disegno, e dal disegno non si capirebbe quale dei due è; per la rapa di un
// salvataggio vecchio, che il passo non l'ha mai scritto, lo dice lo stadio.
export function passoDi(cambio) {
  const coltura = di(cambio.coltura);
  if (Number.isInteger(cambio.passo)) return cambio.passo;
  return Math.max(0, coltura.stadi.indexOf(cambio.oggetto));
}

// Quello che la raccolta rende da questo tassello: la voce della tavola delle
// raccolte, con la resa della sua coltura al posto di quella della rapa.
export function raccolta(base, oggetto, cambio) {
  const coltura = di(cambio?.coltura);
  if (oggetto === OGGETTO.A_SEME) return { ...base, resa: coltura.aSeme ?? [] };
  if (oggetto === OGGETTO.MATURA) return { ...base, resa: coltura.raccolto };
  return base;
}

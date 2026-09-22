// Sagome laterali nello stesso vocabolario di pixel del resto della valle.
const sagome = {
  cervo: [
    '...................w...w..',
    '...................ww.ww..',
    '....................www..',
    '....................w....',
    '...................ww....',
    '..................ccl....',
    '..................clrl...',
    '.................cclll...',
    '.....cccccccc...cccll....',
    '...ccwwwwwwwwcccccll.....',
    '..ccwwwwwwwwwwccccl......',
    '..cwwwwwwwwwwwwcccl......',
    '..cwwwwwwwwwwwwcccl......',
    '...cwwwwwwwwwwcccl.......',
    '....ccccccccccccl........',
    '....cc..cc...cc.cc.......',
    '....cc..cc...cc.cc.......',
    '....cc..cc...cc.cc.......',
    '....gg..gg...gg.gg.......',
  ],
  cavallo: [
    '..................g.g....',
    '.................ggcl....',
    '.................gccll...',
    '................ggclrl...',
    '................gccllll..',
    '...............ggcclllg..',
    '...............gccllgg...',
    '....ccccccccccggccll.....',
    '..ggcllllllllccgccll.....',
    '.gggcllllllllccccll......',
    '.gg.cllllllllccccll......',
    '.g..cllllllllccccll......',
    '.g...ccccccccccccl.......',
    '.....cc.cc....cc.cc......',
    '.....cc.cc....cc.cc......',
    '.....cc.cc....cc.cc......',
    '.....gg.gg....gg.gg......',
  ],
  bufalo: [
    '..........gggggg.........',
    '........ggghhhhhh........',
    '......ggghhhhhhhhgg...z..',
    '....gggghhhhhhhhhhg.zzz..',
    '..ggghhhhhhhhhhhhhggz....',
    '.ggghhhhhhhhhhhhhhhgggg..',
    '.gghhhhhhhhhhhhhhhhghrg..',
    '.gghhhhhhhhhhhhhhhhghhg..',
    '.gghhhhhhhhhhhhhhhhgggg..',
    '..gghhhhhhhhhhhhhhgggg...',
    '...ggggggggggggggggg....',
    '....gg.gg.....gg.gg.....',
    '....gg.gg.....gg.gg.....',
    '....rr.rr.....rr.rr.....',
  ],
  orso: [
    '...............gg..gg....',
    '...............gchhcg....',
    '....hhhhhhhhhhhccccc.....',
    '..hhcccccccccccccrcll....',
    '.hhccccccccccccccccllr...',
    '.hccccccccccccccccccl....',
    '.hcccccccccccccccccc.....',
    '.hhccccccccccccccchh.....',
    '..hhcccccccccccchhh......',
    '...hhhhhhhhhhhhhhh.......',
    '...hhh.hhh...hhh.hh......',
    '...hhh.hhh...hhh.hh......',
    '...ggg.ggg...ggg.gg......',
  ],
};

// Telaio comune: l'animazione sposta le zampe alternate di un pixel.
export const ANIMALI = Object.fromEntries(Object.entries(sagome).map(([specie, righe]) => {
  const fermo = righe.map(r => r.padEnd(26, '.'));
  const passo = fermo.map((r,y) => y >= fermo.length-3 ? '.'+r.slice(0,-1) : r);
  return [specie, [fermo, passo]];
}));
export const CARCASSE = Object.fromEntries(Object.entries(sagome).map(([specie]) => {
  const colore = specie === 'bufalo' ? 'h' : specie === 'orso' ? 'c' : 'l';
  return [specie, [
    '..........................',
    '......gggggggggg..........',
    '...ggg'+colore.repeat(12)+'gg......',
    '..gg'+colore.repeat(14)+'gggg....',
    '..g'+colore.repeat(6)+'AA'+colore.repeat(8)+'ggg....',
    '...ggggggggggggggggggg....',
    '.....gg..gg....gg..gg.....',
  ]];
}));
export const CARNE_CRUDA = [
  '............','....AAAA....','..AAttttA...','.AtttttttA..',
  '.AttmtttttA.','.AtttmttttA.','..AtttmtttA.','...AtttttA..',
  '....AAAAA...','............','............','............',
];
export const CARNE_ARROSTITA = CARNE_CRUDA.map(r=>r.replaceAll('t','c').replaceAll('m','w').replaceAll('A','g'));
// La carne seccata: la stessa forma di quella cruda, scurita e raggrinzita.
// Derivata invece che ridisegnata, come l'arrostita: sono la stessa carne in
// tre momenti, e tre disegni indipendenti l'avrebbero fatta sembrare tre
// alimenti diversi.
export const CARNE_SECCA = CARNE_CRUDA.map(r=>r.replaceAll('m','g').replaceAll('t','A').replaceAll('A','A'));

export const PELLICCIA = [
  '............','...cccccc...','..cwwwwwwc..','.cwwwhhwwwc.',
  '.cwwwhhwwwc.','.cwwwhhwwwc.','.cwwwhhwwwc.','.cwwwhhwwwc.',
  '.cwwwhhwwwc.','..cwwwwwwc..','...cccccc...','............',
];
export const PELLE = [
  '..cc....cc..','..cww..wwc..','...cwwwwc...','..cwwwwwwc..',
  '.cwwwwwwwwc.','.cwwwwwwwwc.','..cwwwwwwc..','..cwwwwwwc..',
  '...cwwwwc...','..cc....cc..','..c......c..','............',
];

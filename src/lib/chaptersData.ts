export interface AccordionSection {
  title: string;
  content: string;
}

export interface GlosariumEntry {
  tembung: string;
  ngoko: string;
  krama: string;
  tegese: string;
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'text' | 'matching';
  question: string;
  options?: string[]; // For multiple-choice
  correctAnswer: string | string[]; // For matching it can be array or string
  matchingPairs?: { left: string; right: string }[]; // For matching type
}

export interface DhongengAnalysisRow {
  aspect: string;
  explanation: string;
}

export interface DhongengPage {
  pageIndex: number;
  text: string;
  illustrationPrompt: string; // Used to generate image
  analysisTable?: DhongengAnalysisRow[];
}

export interface Chapter {
  id: number;
  title: string;
  description: string;
  icon: string;
  materi: {
    title: string;
    sections: AccordionSection[];
  };
  dhongeng: {
    title: string;
    pages: DhongengPage[];
    question?: string;
    options?: string[];
    correctAnswer?: string;
  };
  lkpd: {
    title: string;
    questions: Question[];
  };
  game: {
    type: 'aksara-drag' | 'word-guess' | 'picture-quiz' | 'memory-match' | 'bubble-pop' | 'speed-run' | 'line-match';
    title: string;
    description: string;
    config: any;
  };
  glosarium?: GlosariumEntry[];
  mapConfig?: {
    materi?: boolean;
    dhongeng?: boolean;
    lkpdPilgan?: boolean;
    lkpdUraian?: boolean;
    game?: boolean;
  };
}

export const chaptersData: Chapter[] = [
];


export const kamisMateri = {
  title: "Wulangan Dinå Kamis: Unggah-Ungguh Basa",
  intro: "Saben dinå Kamis, kabeh warga sekolah kaajap nggunakake basa Jawa Krama kanggo nguri-uri kabudayan Javanese sarta njaga tata krama.",
  rules: [
    {
      title: "1. Unggah-Ungguh Micara",
      content: "Yen matur karo Bapak/Ibu guru kudu madhep, tangan ngapurancang (ditangkepake ing ngarep bangkekan), lan swara sing lirih nanging cetha."
    },
    {
      title: "2. Basa Ngoko vs Krama Alus",
      content: "Ngoko digunakake karo kanca sapadha-padha. Krama Alus digunakake marang wong sing luwih tuwa utawa diajeni (Guru, Kepala Sekolah, Wong Tuwa)."
    }
  ],
  dialogues: [
    {
      context: "Siswa nyuwun izin menyang jedhing (permisi ke kamar mandi):",
      speakers: [
        { name: "Siswa (Krama Alus)", text: "Nyuwun sewu Ibu Guru, kepareng kula badhe dhateng wingking sekedhap." },
        { name: "Ibu Guru (Ngoko/Krama Lugu)", text: "Oh iya, le. Aja suwe-suwe ya." }
      ]
    },
    {
      context: "Siswa ngaturake tugas sekolah marang guru:",
      speakers: [
        { name: "Siswa (Krama Alus)", text: "Sugeng siang Pak Guru. Menika kula badhe ngaturaken buku tugas basa Jawi." },
        { name: "Pak Guru (Ngoko/Krama Lugu)", text: "Matur nuwun, le. Selehna kene, mengko tak biji." }
      ]
    }
  ],
  vocab: [
    { ngoko: 'mangan', krama: 'nedha / dahar' },
    { ngoko: 'lunga', krama: 'tindak / kesah' },
    { ngoko: 'turu', krama: 'sare / tilem' },
    { ngoko: 'omah', krama: 'griya / dalem' },
    { ngoko: 'aku', krama: 'kula / kawula' },
    { ngoko: 'kowe', krama: 'panjenengan / sampeyan' },
  ]
};

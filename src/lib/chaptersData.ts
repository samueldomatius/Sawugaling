export interface AccordionSection {
  title: string;
  content: string;
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'text' | 'matching';
  question: string;
  options?: string[]; // For multiple-choice
  correctAnswer: string | string[]; // For matching it can be array or string
  matchingPairs?: { left: string; right: string }[]; // For matching type
}

export interface DhongengPage {
  pageIndex: number;
  text: string;
  illustrationPrompt: string; // Used to generate image
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
  };
  lkpd: {
    title: string;
    questions: Question[];
  };
  game: {
    type: 'aksara-drag' | 'word-guess' | 'picture-quiz' | 'memory-match' | 'bubble-pop' | 'speed-run';
    title: string;
    description: string;
    config: any;
  };
}

export const chaptersData: Chapter[] = [
  {
    id: 1,
    title: "Cerita Rakyat: Sawunggaling",
    description: "Sinau babagan crita rakyat Sawunggaling, tokoh pemuda gagah prakosa saka Surabaya, lan mangerteni tegese tembung ing crita.",
    icon: "📜",
    materi: {
      title: "Materi Cerita Rakyat & Tembung Jawa",
      sections: [
        {
          title: "1. Apa iku Crita Rakyat (Dongeng)?",
          content: "Crita rakyat yaiku crita kang sumebar ing masyarakat wiwit jaman biyen lan diwarisake kanthi turun-temurun lewat gethok tular (secara lisan). Crita rakyat biasane nduweni nilai moral, budi pekerti, lan asal-usul sawijining papan panggonan (legenda)."
        },
        {
          title: "2. Tokoh Utama: Sawunggaling",
          content: "Sawunggaling iku pemuda sakti kang asale saka tlatah Surabaya (Kampung Donowati). Biyen dheweke jenenge Jaka Kendhil, putra saka Dewi Sangkrah lan adipati Jayengrana. Sawunggaling dikenal amarga watake kang bakoh, kendel, tresna marang ibune, lan belani bebener."
        },
        {
          title: "3. Tembung Sesulih lan Tegese",
          content: "Ing crita Sawunggaling, ana tembung-tembung kuna utawa klasik Jawa sing kudu dimangerteni, tuladhane: \n- *Kasekten* tegese kakuwatan gaib / kesaktian.\n- *Gagah Prakosa* tegese santosa banget / gagah perkasa.\n- *Kadurakan* tegese kanisthan / tindak ala."
        }
      ]
    },
    dhongeng: {
      title: "Dhongeng Jaka Kendhil & Sawunggaling",
      pages: [
        {
          pageIndex: 1,
          text: "Ing sawijining dina ing Dusun Donowati, Surabaya, urip pemuda jenenge Jaka Kendhil karo ibune, Dewi Sangkrah. Sanadyan urip prasaja, Jaka Kendhil sregep tetanen lan sinau olah kanuragan. Nanging dheweke kepengin banget ngerti sapa sejatine bapake, amarga ibune tansah nyimpen wewadi.",
          illustrationPrompt: "Javanese youth Jaka Kendhil meditating under a large banyan tree in a Javanese village, traditional clothing, brown tones, perkamen texture, watercolor batik style"
        },
        {
          pageIndex: 2,
          text: "Dewi Sangkrah pungkasane crita menawa bapake Jaka Kendhil yaiku Adipati Jayengrana saka Kadipaten Surabaya. Menawi kepengin nemoni, Jaka Kendhil kudu nggawa selendang cinde pusaka lan ganti jeneng dadi Sawunggaling. Sawunggaling banjur pamit budhal menyang kuthakrajan.",
          illustrationPrompt: "An elderly Javanese woman Dewi Sangkrah handing a sacred golden batik sash (selendang cinde) to a young warrior Sawunggaling, ancient wooden house interior, batik warm aesthetic"
        },
        {
          pageIndex: 3,
          text: "Ing Surabaya, Sawunggaling kudu ndherek sayembara panahan lan olah sodor kanggo mbuktekake kasektene. Amarga kasekten lan ketangkasane, Sawunggaling bisa ngalahake kabeh musuh lan diakoni minangka putra Adipati Jayengrana, banjur dadi Adipati Surabaya sabanjure kang adil lan micara.",
          illustrationPrompt: "Young Javanese prince Sawunggaling drawing a bow string in an archery tournament before a traditional Javanese palace (pendopo), crowd watching, red and gold batik style"
        }
      ]
    },
    lkpd: {
      title: "E-LKPD 1 — Pemahaman Crita Sawunggaling",
      questions: [
        {
          id: "q1_1",
          type: "multiple-choice",
          question: "Sapa sejatine ibune Sawunggaling?",
          options: [
            "Dewi Sekartaji",
            "Dewi Sangkrah",
            "Dewi Kilisuci",
            "Nyi Roro Kidul"
          ],
          correctAnswer: "Dewi Sangkrah"
        },
        {
          id: "q1_2",
          type: "text",
          question: "Sebutna pusaka apa sing digawa Sawunggaling kanggo mbuktekake menawa dheweke putrane Adipati Jayengrana!",
          correctAnswer: "selendang cinde"
        },
        {
          id: "q1_3",
          type: "multiple-choice",
          question: "Ing ngendi dusun papan panggonane Jaka Kendhil (Sawunggaling) cilik urip karo ibune?",
          options: [
            "Dusun Wonokromo",
            "Dusun Donowati",
            "Dusun Jayengranan",
            "Dusun Kertajaya"
          ],
          correctAnswer: "Dusun Donowati"
        },
        {
          id: "q1_4",
          type: "matching",
          question: "Jodohna tembung-tembung ing ngisor iki karo tegese sing bener!",
          correctAnswer: [
            "Kasekten:Kesaktian",
            "Kendel:Berani",
            "Gagah Prakosa:Gagah perkasa"
          ],
          matchingPairs: [
            { left: "Kasekten", right: "Kesaktian" },
            { left: "Kendel", right: "Berani" },
            { left: "Gagah Prakosa", right: "Gagah perkasa" }
          ]
        }
      ]
    },
    game: {
      type: "aksara-drag",
      title: "Cocokkan Aksara Jawa: Sawunggaling",
      description: "Tarik sandhangan utawa aksara Jawa ing ngisor iki menyang panggonan latin sing trep!",
      config: {
        pairs: [
          { aksara: "ꦱ", latin: "sa" },
          { aksara: "ꦦꦸ", latin: "wu" },
          { aksara: "ꦒ", latin: "ga" },
          { aksara: "ꦭꦶ", latin: "li" }
        ]
      }
    }
  },
  {
    id: 2,
    title: "Dewi Sangkrah & Unggah-Ungguh",
    description: "Sinau babagan kasetyan lan budi pekerti Dewi Sangkrah, sarta tata krama guneman marang wong tuwa (Krama Alus).",
    icon: "🌸",
    materi: {
      title: "Materi Unggah-Ungguh Basa Jawa",
      sections: [
        {
          title: "1. Undha-Usuk Basa Jawa",
          content: "Basa Jawa nduweni tata krama guneman sing diarani undha-usuk basa. Secara garis besar dibagi dadi loro: Basa Ngoko (kanggo kanca sabrayat/sing luwih enom) lan Basa Krama (kanggo wong tuwa/sing diajeni)."
        },
        {
          title: "2. Krama Lugu lan Krama Alus",
          content: "Krama Alus digunakake dening anak marang wong tuwa, murid marang guru, utawa andhahan marang pimpinan. Tembung-tembunge nganggo krama alus murni, tuladhane:\n- Ngoko: *Aku mangan* $\\rightarrow$ Krama Alus: *Kula dhahar* (salah, kudu *kula nedha* yen awake dhewe, nanging yen wong tuwa mangan dadi *bapak dhahar*).\n- Ngoko: *Kowe lunga* $\\rightarrow$ Krama Alus: *Panjenengan tindak*."
        },
        {
          title: "3. Tuladha Dialog Krama Alus",
          content: "Siswa marang Guru:\n- Siswa: 'Sugeng enjang Bu Guru, badhe nyuwun pirsa.'\n- Guru: 'Sugeng enjang, iya le, arep takon apa?'"
        }
      ]
    },
    dhongeng: {
      title: "Kasetyan & Budi Pekerti Dewi Sangkrah",
      pages: [
        {
          pageIndex: 1,
          text: "Dewi Sangkrah iku wanita utama sing sabar banget. Sanadyan ditinggal dening Adipati Jayengrana amarga kahanan politik krajan, dheweke ora tau nggresula utawa dendam. Dheweke nggedhekake Sawunggaling kanthi piwulang budi pekerti sing luhur lan ngajari tata krama unggah-ungguh basa.",
          illustrationPrompt: "A patient Javanese mother Dewi Sangkrah spinning yarn inside a cozy traditional wooden house (limasan), gentle sunlight entering, warm watercolor perkamen texture"
        },
        {
          pageIndex: 2,
          text: "Saben sore, Dewi Sangkrah ngajari Sawunggaling cara matur sing sopan marang wong tuwa. 'Le, menawa kowe guneman marang wong tuwa, kudu nggunakake basa Krama Alus. Iku wujud pakurmatanmu,' pangendikane Dewi Sangkrah kanthi alus lan kebak katresnan.",
          illustrationPrompt: "Javanese mother teaching her young son manners, sitting on a bamboo mat, warm expressions, classic Javanese illustration"
        }
      ]
    },
    lkpd: {
      title: "E-LKPD 2 — Unggah-Ungguh Basa",
      questions: [
        {
          id: "q2_1",
          type: "multiple-choice",
          question: "Guneman anak marang wong tuwane kudu nggunakake basa...",
          options: [
            "Ngoko Lugu",
            "Ngoko Alus",
            "Krama Alus",
            "Krama Lugu"
          ],
          correctAnswer: "Krama Alus"
        },
        {
          id: "q2_2",
          type: "text",
          question: "Ubahna ukara ngoko iki dadi Krama Alus: 'Ibu tuku sega ing pasar.'",
          correctAnswer: "ibu mundhut sekul wonten peken"
        },
        {
          id: "q2_3",
          type: "multiple-choice",
          question: "Tembung 'Mangan' ing Ngoko, yen diowahi dadi Krama Alus kanggo wong tuwa yaiku...",
          options: [
            "Nedha",
            "Dhahar",
            "Mundhut",
            "Kondur"
          ],
          correctAnswer: "Dhahar"
        },
        {
          id: "q2_4",
          type: "matching",
          question: "Jodohna tembung Ngoko karo Krama Aluse!",
          correctAnswer: [
            "Lunga:Tindak",
            "Turu:Sare",
            "Mangan:Dhahar"
          ],
          matchingPairs: [
            { left: "Lunga", right: "Tindak" },
            { left: "Turu", right: "Sare" },
            { left: "Mangan", right: "Dhahar" }
          ]
        }
      ]
    },
    game: {
      type: "word-guess",
      title: "Tebak Kata Unggah-Ungguh",
      description: "Tebak tembung Krama Alus sing trep manut pitunjuk ing ngisor iki!",
      config: {
        clue: "Basa Krama Alus saka tembung 'Lunga'",
        correctWord: "TINDAK",
        letters: ["T", "I", "N", "D", "A", "K", "R", "U", "L", "S"]
      }
    }
  },
  {
    id: 3,
    title: "Paribasan lan Bebasan",
    description: "Mangerteni unpen-unpen Jawa awujud paribasan lan bebasan kang ngandhut piwulang luhur.",
    icon: "🌟",
    materi: {
      title: "Materi Paribasan lan Bebasan Jawa",
      sections: [
        {
          title: "1. Tegese Paribasan",
          content: "Paribasan yaike unen-unen kang ajeg panganggone, mawa teges entar (kiasan), nanging ora ngemu pepindhan (tidak mengandung perumpamaan orang/barang)."
        },
        {
          title: "2. Tegese Bebasan",
          content: "Bebasan yaiku unen-unen kang ajeg panganggone, mawa teges entar, lan ngemu pepindhan. Sing dipindhanake yaiku kahanan utawa tindak tanduk sifate manungsa."
        },
        {
          title: "3. Tuladha Paribasan & Bebasan Terkenal",
          content: "- *Ana catur mungkur* tegese ora gelem ngrungokake guneman ala.\n- *Becik ketitik ala ketara* tegese tumindak becik lan ala bakal ketara ing tembe mburine.\n- *Adigang adigung adiguna* tegese ngendel-endelake kakuwatan, kaluhuran, lan kepinterane."
        }
      ]
    },
    dhongeng: {
      title: "Piwulang Becik Ketitik Ala Ketara",
      pages: [
        {
          pageIndex: 1,
          text: "Ing krajan Surabaya, ana sedulur kuwalone Sawunggaling sing meri marang kesuksesane Sawunggaling. Dheweke nyoba nggawe pitnah lan racun ing ombene Sawunggaling nalika pahargyan Krajan. Nanging amarga kawicaksanan lan pitulungane Gusti, racun iku konangan lan si sedulur kuwalo malah kena piwalese dhewe. Paribasan 'Becik ketitik ala ketara' kabukten.",
          illustrationPrompt: "Javanese royal feast scene inside a wooden palace (pendopo), evil brother trying to poison a golden goblet, dramatic shadow, batik aesthetic"
        }
      ]
    },
    lkpd: {
      title: "E-LKPD 3 — Paribasan lan Bebasan",
      questions: [
        {
          id: "q3_1",
          type: "multiple-choice",
          question: "Unen-unen 'becik ketitik ala ketara' nduweni teges...",
          options: [
            "Wong tumindak becik mesthi uripe sengsara",
            "Tindak becik lan ala bakal ketara ing tembe mburi",
            "Sapa sing salah bakal dadi pimpinan krajan",
            "Wong sing pinter mesthi bakal menang"
          ],
          correctAnswer: "Tindak becik lan ala bakal ketara ing tembe mburi"
        },
        {
          id: "q3_2",
          type: "text",
          question: "Sebutna bebasan sing tegese 'ngendel-endelake kakuwatan, kaluhuran, lan kepintaran'!",
          correctAnswer: "adigang adigung adiguna"
        },
        {
          id: "q3_3",
          type: "multiple-choice",
          question: "Apa tegese paribasan 'Ana catur mungkur'?",
          options: [
            "Ora gelem ngrungokake guneman ala",
            "Tansah percaya marang pitnah",
            "Seneng rerasani karo tangga",
            "Kudu ngadoh saka kerameyan"
          ],
          correctAnswer: "Ora gelem ngrungokake guneman ala"
        },
        {
          id: "q3_4",
          type: "matching",
          question: "Jodohna paribasan iki karo tegese!",
          correctAnswer: [
            "Becik ketitik:Ala ketara",
            "Ana catur:Mungkur",
            "Jer basuki:Mawa beya"
          ],
          matchingPairs: [
            { left: "Becik ketitik", right: "Ala ketara" },
            { left: "Ana catur", right: "Mungkur" },
            { left: "Jer basuki", right: "Mawa beya" }
          ]
        }
      ]
    },
    game: {
      type: "picture-quiz",
      title: "Kuis Tebak Wayang Paribasan",
      description: "Gambar wayang lan lambang ing ngisor iki mujudake paribasan Jawa sing endi?",
      config: {
        imagePrompt: "Wayang gunungan golden batik standing proud, symbol of power and nobility, high resolution watercolor paper texture",
        options: [
          "Becik ketitik ala ketara",
          "Adigang adigung adiguna",
          "Ana catur mungkur",
          "Jer basuki mawa beya"
        ],
        correctAnswer: "Adigang adigung adiguna"
      }
    }
  },
  {
    id: 4,
    title: "Kasekten Sawunggaling & Aksara Murda",
    description: "Sinau babagan Aksara Murda (aksara kapital Jawa) kang digunakake kanggo nulis jeneng tokoh, gelar, lan papan panggonan sing dihurmati.",
    icon: "🔱",
    materi: {
      title: "Materi Aksara Murda Jawa",
      sections: [
        {
          title: "1. Apa iku Aksara Murda?",
          content: "Aksara Murda iku aksara kapital ing aksara Jawa. Aksara iki digunakake kanggo nulis jeneng wong sing dihurmati (tuladha: adipati, ratu, pahlawan), gelar pangkat, lan jeneng papan panggonan (kutha, nagara) minangka wujud pakurmatan."
        },
        {
          title: "2. Wujud lan Pasangan Aksara Murda",
          content: "Ora kabeh aksara Jawa nduweni wujud Murda. Sing nduwe mung ana 8 aksara:\n- Na $\\rightarrow$ ꦟ\n- Ka $\\rightarrow$ ꦑ\n- Ta $\\rightarrow$ ꦡ\n- Sa $\\rightarrow$ ꦯ\n- Pa $\\rightarrow$ ꦦ\n- Nya $\\rightarrow$ ꦘ\n- Ga $\\rightarrow$ ꦕ (kadang dianggo, nanging sing umum Ga Murda iku ꦓ)\n- Ba $\\rightarrow$  Bh ( get / ꦨ)"
        },
        {
          title: "3. Aturan Panganggone",
          content: "Saben tembung cukup ditulis aksara murda siji wae ing ngarep. Yen aksara ngarep ora nduweni wujud murda, mula aksara burine sing ditulis murda. Yen ora ana kabeh, ditulis nganggo aksara biasa."
        }
      ]
    },
    dhongeng: {
      title: "Kasekten lan Gelar Sawunggaling",
      pages: [
        {
          pageIndex: 1,
          text: "Sawise menang sayembara, Jaka Kendhil diparingi gelar Raden Tumenggung Sawunggaling dening ramane, Adipati Jayengrana. Panulisan gelar lan jeneng iki kudu nggunakake Aksara Murda minangka pakurmatan marang kasekten lan keluhurane.",
          illustrationPrompt: "Sawunggaling receiving a royal crest from the Adipati, traditional Javanese palace inner court, gold ornaments, batik aesthetic"
        }
      ]
    },
    lkpd: {
      title: "E-LKPD 4 — Aksara Murda",
      questions: [
        {
          id: "q4_1",
          type: "multiple-choice",
          question: "Aksara Murda digunakake kanggo nulis...",
          options: [
            "Tembung kriya / kata kerja",
            "Jeneng wong sing diajeni utawa papan panggonan",
            "Sato kewan lan tetumbuhan",
            "Ukara pitakon / kalimat tanya"
          ],
          correctAnswer: "Jeneng wong sing diajeni utawa papan panggonan"
        },
        {
          id: "q4_2",
          type: "text",
          question: "Sebutna aksara Murda saka aksara 'Sa'!",
          correctAnswer: "ꦯ"
        },
        {
          id: "q4_3",
          type: "matching",
          question: "Jodohna Aksara Jawa Murda karo latin sing bener!",
          correctAnswer: [
            "ꦟ:Na",
            "ꦑ:Ka",
            "ꦦ:Pa"
          ],
          matchingPairs: [
            { left: "ꦟ", right: "Na" },
            { left: "ꦑ", right: "Ka" },
            { left: "ꦦ", right: "Pa" }
          ]
        }
      ]
    },
    game: {
      type: "memory-match",
      title: "Kertu Memori Aksara Murda",
      description: "Klik lan walik kertu ing ngisor iki kanggo nggoleki pasangan Aksara Murda karo latin sing trep!",
      config: {
        pairs: [
          { aksara: "ꦟ", latin: "Na" },
          { aksara: "ꦑ", latin: "Ka" },
          { aksara: "ꦡ", latin: "Ta" },
          { aksara: "ꦯ", latin: "Sa" },
          { aksara: "ꦦ", latin: "Pa" },
          { aksara: "ꦘ", latin: "Nya" }
        ]
      }
    }
  },
  {
    id: 5,
    title: "Adipati Jayengrana & Parikan Jawa",
    description: "Sinau babagan parikan Jawa (pantun Jawa) minangka sarana piwulang luhur, guyonan, lan tata krama ing masyarakat.",
    icon: "🎭",
    materi: {
      title: "Materi Parikan Jawa",
      sections: [
        {
          title: "1. Apa iku Parikan?",
          content: "Parikan iku unen-unen kang dumadi saka rong gatra (baris) utawa patang gatra. Gatra kapisan minangka purwaka (sampiran) dene gatra kapindho minangka wosing parikan (isi)."
        },
        {
          title: "2. Ciri-ciri Parikan",
          content: "Ciri utamane parikan yaiku anane purwakanthi (persamaan bunyi/sajak) ing pungkasan gatra. Tuladhane sajak a-a utawa a-b-a-b. Parikan biasane nduweni paugeran cacahing wanda (suku kata)."
        },
        {
          title: "3. Tuladha Parikan",
          content: "- *Wajik kletik gula jawa, luwih becik sing prasaja.* (Artinya: Lebih baik bersikap sederhana)\n- *Kembang jagung, dipetik kancane. Ora usah bingung, kabeh ana dalane.*"
        }
      ]
    },
    dhongeng: {
      title: "Parikan lan Guyonan ing Pendopo",
      pages: [
        {
          pageIndex: 1,
          text: "Ing pendopo, Adipati Jayengrana kerep ngawontenake patemon warga. Kanggo nguri-uri swasana lan menehi pitutur kanthi alus, para abdi dalem asring ngaturake parikan Jawa sing ngandhut teges rukun lan gotong royong.",
          illustrationPrompt: "Javanese pendopo with royal court listening to storytellers, warm oil-lamp illumination, traditional instruments in background, watercolor texture"
        }
      ]
    },
    lkpd: {
      title: "E-LKPD 5 — Parikan Jawa",
      questions: [
        {
          id: "q5_1",
          type: "multiple-choice",
          question: "Gatra kapisan ing parikan iku diarani...",
          options: [
            "Wose / isi",
            "Purwaka / sampiran",
            "Bebasan",
            "Geguritan"
          ],
          correctAnswer: "Purwaka / sampiran"
        },
        {
          id: "q5_2",
          type: "text",
          question: "Lengkapi parikan iki: 'Wajik kletik gula jawa, luwih becik sing...'",
          correctAnswer: "prasaja"
        }
      ]
    },
    game: {
      type: "bubble-pop",
      title: "Letuskan Balon: J-A-Y-A",
      description: "Letusna balon aksara sing melayang manut urutan aksara Latin kanggo mbentuk tembung 'JAYA' (ꦗ - ꦪ)!",
      config: {
        targetWord: "JAYA",
        sequence: [
          { aksara: "ꦗ", latin: "JA" },
          { aksara: "ꦪ", latin: "YA" }
        ],
        distractors: ["ꦲ", "ꦤ", "ꦕ", "ꦫ", "ꦱ"]
      }
    }
  },
  {
    id: 6,
    title: "Perjalanan Surabaya & Aksara Swara",
    description: "Sinau babagan Aksara Swara (vokal mandiri: A, I, U, E, O) sing digunakake kanggo nulis tembung serapan basa manca.",
    icon: "🗺️",
    materi: {
      title: "Materi Aksara Swara",
      sections: [
        {
          title: "1. Pangertene Aksara Swara",
          content: "Aksara Swara yaiku aksara kanggo nulis vokal utama (A, I, U, E, O) sing dadi wanda utawa suku kata ing wiwitan tembung. Biasane digunakake kanggo nulis tembung serapan basa Arab, Inggris, utawa basa manca liyane."
        },
        {
          title: "2. Wujud Aksara Swara",
          content: "Wujude yaiku:\n- A $\\rightarrow$ ꦄ\n- I $\\rightarrow$ ꦆ\n- U $\\rightarrow$ ꦈ\n- E $\\rightarrow$ ꦌ\n- O $\\rightarrow$ ꦎ"
        },
        {
          title: "3. Paugeran Penting",
          content: "Aksara Swara ora kena diwenehi sandhangan swara (wulu, suku, pepet, taling, taling tarung). Nanging aksara swara bisa diwenehi sandhangan panyigeg gatra (layang, wignyan, cecak)."
        }
      ]
    },
    dhongeng: {
      title: "Seratan Sejarah Surabaya",
      pages: [
        {
          pageIndex: 1,
          text: "Nalika Sawunggaling mimpin, Surabaya dadi kutha pelabuhan sing rame banget. Akeh pedagang saka manca nagara teka, saengga panulisan dokumen perdagangan nggunakake Aksara Swara kanggo negasake jeneng pedagang asing.",
          illustrationPrompt: "Ancient Javanese port city Surabaya, wooden merchant ships, busy harbor scene, old paper texture, vintage drawing"
        }
      ]
    },
    lkpd: {
      title: "E-LKPD 6 — Aksara Swara",
      questions: [
        {
          id: "q6_1",
          type: "multiple-choice",
          question: "Aksara Swara digunakake kanggo nulis...",
          options: [
            "Aksara rekan",
            "Tembung serapan saka basa manca",
            "Angka jawa",
            "Aksara murda"
          ],
          correctAnswer: "Tembung serapan saka basa manca"
        },
        {
          id: "q6_2",
          type: "text",
          question: "Tulisna wujud Aksara Swara kanggo vokal 'U'!",
          correctAnswer: "ꦈ"
        }
      ]
    },
    game: {
      type: "speed-run",
      title: "Aksara Swara Kebut",
      description: "Pilih jawaban Latin sing bener saka Aksara Swara sing muncul sakdurunge wektune entek! Kudu bener 5 kali berturut-turut!",
      config: {
        pool: [
          { aksara: "ꦄ", latin: "A" },
          { aksara: "ꦆ", latin: "I" },
          { aksara: "ꦈ", latin: "U" },
          { aksara: "ꦌ", latin: "E" },
          { aksara: "ꦎ", latin: "O" }
        ]
      }
    }
  }
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
  ]
};

export interface VIPMapping {
  instagram: string;
  code: string;
  qrFile: string;
}

export const vipMappings: VIPMapping[] = [
  { instagram: "mashashatrova", code: "VNVNC-2025-03Q2AA", qrFile: "qr-VNVNC-2025-03Q2AA.png" },
  { instagram: "isakovapolina", code: "VNVNC-2025-1FKBOD", qrFile: "qr-VNVNC-2025-1FKBOD.png" },
  { instagram: "fialcapeg", code: "VNVNC-2025-2FYNFS", qrFile: "qr-VNVNC-2025-2FYNFS.png" },
  { instagram: "alisa.abramovich", code: "VNVNC-2025-5ZM6N8", qrFile: "qr-VNVNC-2025-5ZM6N8.png" },
  { instagram: "daria_pingvi", code: "VNVNC-2025-9UBRW5", qrFile: "qr-VNVNC-2025-9UBRW5.png" },
  { instagram: "jaaane13", code: "VNVNC-2025-A40F7Q", qrFile: "qr-VNVNC-2025-A40F7Q.png" },
  { instagram: "olechka__chernysheva", code: "VNVNC-2025-BCDVC5", qrFile: "qr-VNVNC-2025-BCDVC5.png" },
  { instagram: "marianne_vo", code: "VNVNC-2025-BXJABN", qrFile: "qr-VNVNC-2025-BXJABN.png" },
  { instagram: "tatavlasyk", code: "VNVNC-2025-E0FSHR", qrFile: "qr-VNVNC-2025-E0FSHR.png" },
  { instagram: "lebedpolly", code: "VNVNC-2025-EEYIKN", qrFile: "qr-VNVNC-2025-EEYIKN.png" },
  { instagram: "valerichurkina", code: "VNVNC-2025-EVYYZD", qrFile: "qr-VNVNC-2025-EVYYZD.png" },
  { instagram: "iamulyachu", code: "VNVNC-2025-GFNWLI", qrFile: "qr-VNVNC-2025-GFNWLI.png" },
  { instagram: "firssveta", code: "VNVNC-2025-GSEODG", qrFile: "qr-VNVNC-2025-GSEODG.png" },
  { instagram: "by_aalina", code: "VNVNC-2025-IFFGXL", qrFile: "qr-VNVNC-2025-IFFGXL.png" },
  { instagram: "polkasmart", code: "VNVNC-2025-JKWU5P", qrFile: "qr-VNVNC-2025-JKWU5P.png" },
  { instagram: "ekaterina.caxap", code: "VNVNC-2025-JW8QJK", qrFile: "qr-VNVNC-2025-JW8QJK.png" },
  { instagram: "mikhailova_maria", code: "VNVNC-2025-KFDT02", qrFile: "qr-VNVNC-2025-KFDT02.png" },
  { instagram: "valeriapetrovskaya", code: "VNVNC-2025-KVADG4", qrFile: "qr-VNVNC-2025-KVADG4.png" },
  { instagram: "ellstark", code: "VNVNC-2025-L6I5IN", qrFile: "qr-VNVNC-2025-L6I5IN.png" },
  { instagram: "moorkoovkaa", code: "VNVNC-2025-M23JPQ", qrFile: "qr-VNVNC-2025-M23JPQ.png" },
  { instagram: "stomadarya", code: "VNVNC-2025-M2O3FG", qrFile: "qr-VNVNC-2025-M2O3FG.png" },
  { instagram: "mvladda", code: "VNVNC-2025-MT2H2J", qrFile: "qr-VNVNC-2025-MT2H2J.png" },
  { instagram: "nesterrrrrrrrr", code: "VNVNC-2025-NBUTXR", qrFile: "qr-VNVNC-2025-NBUTXR.png" },
  { instagram: "leeeeeerockk", code: "VNVNC-2025-PWO2IY", qrFile: "qr-VNVNC-2025-PWO2IY.png" },
  { instagram: "nastya.zhuravlik", code: "VNVNC-2025-SKZ549", qrFile: "qr-VNVNC-2025-SKZ549.png" },
  { instagram: "missmilkaa", code: "VNVNC-2025-TCKF6Z", qrFile: "qr-VNVNC-2025-TCKF6Z.png" },
  { instagram: "kkkatelin_", code: "VNVNC-2025-TYI90L", qrFile: "qr-VNVNC-2025-TYI90L.png" },
  { instagram: "svetlana_smoky", code: "VNVNC-2025-UMKM0O", qrFile: "qr-VNVNC-2025-UMKM0O.png" },
  { instagram: "cr1ngerl", code: "VNVNC-2025-VGR2I1", qrFile: "qr-VNVNC-2025-VGR2I1.png" },
  { instagram: "darina_rebel", code: "VNVNC-2025-VYZKGK", qrFile: "qr-VNVNC-2025-VYZKGK.png" }
];

// Helper function for case-insensitive lookup
export function findVIPByInstagram(instagram: string): VIPMapping | undefined {
  const cleanInput = instagram.toLowerCase().trim().replace('@', '');
  return vipMappings.find(vip => vip.instagram.toLowerCase() === cleanInput);
}
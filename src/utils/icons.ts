// src/utils/icons.ts
import Vocal from "@/assets/icons/Vocal.png";
import Bass from "@/assets/icons/Bass.png";
import Biola from "@/assets/icons/Biola.png";
import Drum from "@/assets/icons/Drum.png";
import Flute from "@/assets/icons/Flute.png";
import Guitar from "@/assets/icons/Guitar.png";
// PERHATIAN: kamu tulis "Pionau.png". Kalau file aslinya memang "Pionau.png", import itu.
// Kalau sebenarnya "Piano.png", ganti importnya ke Piano.png agar tidak 404.
import Pionau from "@/assets/icons/Pionau.png";
import Keyboard from "@/assets/icons/Keyboard.png";
import Saxophone from "@/assets/icons/Saxophone.png";
// (opsional) fallback:

export const icons = [
  { url: Vocal,      type: "vocal",     alt: "Vocal Icon" },
  { url: Bass,       type: "bass",      alt: "Bass Icon" },
  { url: Biola,      type: "biola",     alt: "Biola Icon" },
  { url: Drum,       type: "drum",      alt: "Drum Icon" },
  { url: Flute,      type: "flute",     alt: "Flute Icon" },
  { url: Guitar,     type: "guitar",    alt: "Guitar Icon" },
  // Mappingnya tetap "piano" walau nama filenya "Pionau.png"
  { url: Pionau,     type: "piano",     alt: "Piano Icon" },
  { url: Keyboard,   type: "keyboard",  alt: "Keyboard Icon" },
  { url: Saxophone,  type: "saxophone", alt: "Saxophone Icon" },
] as const;


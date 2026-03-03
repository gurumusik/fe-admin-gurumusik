import { languages } from './languages';

const normalizeLanguageKey = (value: string) => value.trim().toLowerCase();

const normalizeNameToCode = (value: string) => {
  const v = normalizeLanguageKey(value);
  if (v.includes('indonesia') || v.includes('indonesian')) return 'id';
  if (v.includes('jepang') || v.includes('japan') || v.includes('japanese')) return 'ja';
  if (v.includes('korea') || v.includes('korean')) return 'ko';
  if (v.includes('inggris') || v.includes('english') || v === 'en') return 'en';
  if (v.includes('china') || v.includes('tiongkok') || v.includes('mandarin') || v === 'ch' || v === 'cn') return 'ch';
  return v;
};

export const getLanguageIcon = (type: string) => {
  const key = normalizeNameToCode(type);
  const item = languages.find((i) => {
    const t = i.type.toLowerCase();
    return key === t || key.includes(t) || t.includes(key);
  });
  return item?.url || '/assets/icons/default.png';
};

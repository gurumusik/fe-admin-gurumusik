import { languages } from './languages';

export const getLanguageIcon = (type: string) => {
    const item = languages.find((i) => type.toLowerCase().includes(i.type));
  return item?.url || "/assets/icons/default.png";
};
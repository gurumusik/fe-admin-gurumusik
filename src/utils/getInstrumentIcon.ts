import { icons } from './icons';

export const getInstrumentIcon = (type: string) => {
    const item = icons.find((i) => type.toLowerCase().includes(i.type));
  return item?.url || "/assets/icons/default.png";
};
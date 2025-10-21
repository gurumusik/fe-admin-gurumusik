const stripTrailing = (s: string = ''): string => s.replace(/\/+$/, '');
const stripLeading  = (s: string = ''): string => s.replace(/^\/+/, '');

// const API_IMG: string = stripTrailing(process.env.NEXT_PUBLIC_API_IMG_URL ?? ''); test
const API_IMG: string = stripTrailing('');

export type ImgUrlInput = string | null | undefined;

export function imgUrl(p?: ImgUrlInput): string {
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;
  if (!API_IMG) return `/${stripLeading(p)}`; // fallback relative ke origin
  return `${API_IMG}/${stripLeading(p)}`;
}

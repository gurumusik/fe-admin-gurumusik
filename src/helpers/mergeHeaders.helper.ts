export function mergeHeaders(base: HeadersInit, extra?: HeadersInit): Headers {
  const h = new Headers(base);
  if (extra) {
    new Headers(extra).forEach((v, k) => h.set(k, v));
  }
  return h;
}
export async function parseResponse(res: Response): Promise<any> {
  const ct = res.headers.get('content-type')?.toLowerCase() ?? '';
  if (res.status === 204) return {};                 // no content
  if (ct.includes('application/json')) return res.json();
  // fallback: coba JSON, kalau gagal balikin string mentah di { raw }
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}
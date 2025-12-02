import type { Query } from "@/utils/url";
import type { HttpMethod } from "./THttpMethod";

export interface ApiFetchOptions<B = unknown> {
  method?: HttpMethod;
  token?: string;
  body?: B | FormData;
  headers?: HeadersInit;
  query?: Query;
  cache?: RequestCache;          // default: 'no-store'
  revalidate?: number;           // default: 0 (Next.js)
  signal?: AbortSignal;          // optional external signal
  timeoutMs?: number;            // optional auto-abort timeout
}
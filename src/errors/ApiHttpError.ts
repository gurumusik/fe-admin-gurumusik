import type { HttpMethod } from "@/types/THttpMethod";

export class ApiHttpError<T = unknown> extends Error {
  status: number;
  data: T;
  url: string;
  method: HttpMethod;

  constructor(message: string, data: T, status: number, url: string, method: HttpMethod) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
    this.data = data;
    this.url = url;
    this.method = method;
  }
}

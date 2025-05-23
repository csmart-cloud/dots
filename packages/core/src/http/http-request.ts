import { HttpMethod } from "./http-method";

export interface IHttpRequest {
  body?: any; // Body có thể đã được parse
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
  readonly method: HttpMethod;
  readonly path: string;
  readonly query: Readonly<Record<string, string | string[] | undefined>>;
  readonly params: Readonly<Record<string, string>>; // Route parameters
  readonly raw: any; // Đối tượng request gốc từ server (ví dụ: Hono's c.req)
}

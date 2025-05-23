import type { IHttpRequest } from "./http-request.js";
import type { IHttpResponse } from "./http-response.js";
import type { IServiceProvider } from "../di/service-provider.js";

export interface IHttpContext {
  readonly request: IHttpRequest;
  readonly response: IHttpResponse;
  readonly services: IServiceProvider; // Request-scoped service provider
  readonly honoContext?: any; // Optional: Hono's Context 'c' để truy cập trực tiếp nếu cần
}

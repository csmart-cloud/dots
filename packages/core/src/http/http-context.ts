import { IHttpRequest } from "./http-request";
import { IHttpResponse } from "./http-response";
import { IServiceProvider } from "../di/service-provider";

export interface IHttpContext {
  readonly request: IHttpRequest;
  readonly response: IHttpResponse;
  readonly services: IServiceProvider; // Request-scoped service provider
  readonly honoContext?: any; // Optional: Hono's Context 'c' để truy cập trực tiếp nếu cần
}

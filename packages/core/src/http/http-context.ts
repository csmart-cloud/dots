import type { IHttpRequest } from "./http-request.js";
import type { IHttpResponse } from "./http-response.js";
import type { IServiceProvider } from "../di/service-provider.js";

/**
 * Represents the context for an HTTP request/response cycle
 * Provides access to the request, response, and services
 */
export interface IHttpContext {
  /**
   * The HTTP request being processed
   */
  readonly request: IHttpRequest;
  
  /**
   * The HTTP response being generated
   */
  readonly response: IHttpResponse;
  
  /**
   * The request-scoped service provider
   * Used to resolve services within the current request's scope
   */
  readonly services: IServiceProvider;
  
  /**
   * Optional access to the underlying web framework's context
   * For direct access when needed for framework-specific functionality
   */
  readonly honoContext?: any;
}

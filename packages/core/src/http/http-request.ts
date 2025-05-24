import { HttpMethod } from "./http-method.js";

/**
 * Interface representing an HTTP request
 * Provides a framework-agnostic abstraction for HTTP request data
 */
export interface IHttpRequest {
  /**
   * The parsed request body
   * Will be populated based on Content-Type after body parsing
   */
  body?: any;
  
  /**
   * HTTP headers with case-insensitive access
   * Headers are read-only to prevent mutation after request processing starts
   */
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
  
  /**
   * HTTP method (GET, POST, etc.)
   */
  readonly method: HttpMethod;
  
  /**
   * Request path without query string
   */
  readonly path: string;
  
  /**
   * Query parameters parsed from the URL
   * Keys may have single values or arrays of values
   */
  readonly query: Readonly<Record<string, string | string[] | undefined>>;
  
  /**
   * Route parameters extracted from the URL path
   * For example, in route '/users/:id', params.id would contain the value
   */
  readonly params: Readonly<Record<string, string>>;
  
  /**
   * The underlying framework's raw request object
   * Provided for access to framework-specific features
   */
  readonly raw: any;
}

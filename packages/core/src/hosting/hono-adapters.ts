import { HttpMethod } from "../http/http-method.js";
import type { Context as HonoContext } from "hono";
import type { IHttpRequest } from "../http/http-request.js";
import type { IHttpResponse } from "../http/http-response.js";

/**
 * Adapter pattern implementations to bridge between Hono's HTTP handling 
 * and the framework's HTTP abstractions
 */

/**
 * Adapts Hono's request handling to implement the IHttpRequest interface
 */
export class HonoHttpRequestAdapter implements IHttpRequest {
  /**
   * Request body, parsed based on Content-Type
   */
  public body?: any;
  
  /**
   * HTTP headers as a case-insensitive read-only record
   */
  public readonly headers: Readonly<
    Record<string, string | string[] | undefined>
  >;
  
  /**
   * HTTP method (GET, POST, etc.)
   */
  public readonly method: HttpMethod;
  
  /**
   * Request path without query string
   */
  public readonly path: string;
  
  /**
   * Query parameters from URL
   */
  public readonly query: Readonly<
    Record<string, string | string[] | undefined>
  >;
  
  /**
   * Route parameters extracted from URL patterns
   */
  public readonly params: Readonly<Record<string, string>>;
  
  /**
   * Original Hono request object
   */
  public readonly raw: HonoContext["req"];

  /**
   * Creates a new Hono HTTP request adapter
   * @param c The Hono context
   */
  constructor(private c: HonoContext) {
    this.raw = c.req;
    this.method = c.req.method.toUpperCase() as HttpMethod;
    this.path = new URL(c.req.url).pathname;

    // Extract and normalize query parameters
    const queryParams: Record<string, string | string[]> = {};
    const queriesFromHono = c.req.query();
    for (const key in queriesFromHono) {
      queryParams[key] = queriesFromHono[key];
    }
    this.query = queryParams;

    // Extract and normalize headers to lowercase keys
    const headersFromHono = c.req.header();
    const tempHeaders: Record<string, string | string[]> = {};
    for (const key in headersFromHono) {
      tempHeaders[key.toLowerCase()] = headersFromHono[key];
    }
    this.headers = tempHeaders;
    
    // Extract route parameters
    this.params = c.req.param() as Readonly<Record<string, string>>;
  }

  /**
   * Parses the request body based on Content-Type
   * Only attempts to parse for POST, PUT, and PATCH requests
   */
  async parseBody(): Promise<void> {
    // Only parse body for methods that typically have a body
    if (
      this.method === HttpMethod.POST ||
      this.method === HttpMethod.PUT ||
      this.method === HttpMethod.PATCH
    ) {
      // Skip parsing if Content-Length is 0
      if (this.c.req.header("Content-Length") === "0") {
        this.body = undefined;
        return;
      }
      
      const contentType = this.headers["content-type"]
        ?.toString()
        .toLowerCase();
        
      try {
        // Handle JSON content
        if (contentType?.includes("application/json")) {
          this.body = await this.c.req.json();
        } 
        // Handle form data
        else if (
          contentType?.includes("application/x-www-form-urlencoded") ||
          contentType?.includes("multipart/form-data")
        ) {
          this.body = await this.c.req.parseBody();
        } 
        // Default to text for other content types
        else {
          this.body = await this.c.req.text();
        }
      } catch (error) {
        console.warn(`Error parsing request body: ${error instanceof Error ? error.message : String(error)}`);
        this.body = undefined;
      }
    }
  }
}

/**
 * Adapts Hono's response handling to implement the IHttpResponse interface
 */
export class HonoHttpResponseAdapter implements IHttpResponse {
  private _statusCode: number = 200;
  private _isSent = false;
  private _contentType?: string;

  /**
   * Gets whether the response has been sent
   */
  get isSent(): boolean {
    return this._isSent;
  }

  /**
   * Gets or sets the response content type
   */
  get contentType(): string | undefined {
    return this._contentType;
  }

  set contentType(value: string | undefined) {
    this._contentType = value;
    if (value) {
      this.setHeader('Content-Type', value);
    }
  }

  /**
   * Creates a new Hono HTTP response adapter
   * @param c The Hono context
   */
  constructor(private c: HonoContext) {}

  /**
   * Gets the HTTP status code
   */
  get statusCode(): number {
    return this._statusCode;
  }

  /**
   * Sets the HTTP status code
   */
  set statusCode(value: number) {
    this._statusCode = value;
    // Status will be applied when generating the response
  }

  /**
   * Sets an HTTP header
   * @param name Header name
   * @param value Header value
   */
  setHeader(name: string, value: string | number | string[]): void {
    if (this._isSent) {
      console.warn(`Attempted to set header "${name}" after the response was sent`);
      return;
    }
    
    if (Array.isArray(value)) {
      value.forEach((v) => this.c.header(name, String(v), { append: true }));
    } else {
      this.c.header(name, String(value));
    }
  }

  /**
   * Ends the response without sending content
   */
  async end(): Promise<void> {
    if (this._isSent) return;
    this.c.res = this.c.body("", this._statusCode as any);
    this._isSent = true;
  }

  /**
   * Sends a response with optional data
   * @param data Optional data to send
   */
  async send(data?: any): Promise<void> {
    if (this._isSent) return;

    if (data === undefined || data === null) {
      await this.end();
    } else if (typeof data === "string") {
      if (!this._contentType) {
        this.setHeader('Content-Type', 'text/plain; charset=utf-8');
      }
      this.c.res = this.c.text(data, this._statusCode as any);
    } else if (Buffer.isBuffer(data)) {
      if (!this._contentType) {
        this.setHeader('Content-Type', 'application/octet-stream');
      }
      this.c.res = this.c.body(data, this._statusCode as any);
    } else {
      // Default to JSON for objects, arrays, etc.
      if (!this._contentType) {
        this.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      this.c.res = this.c.json(data, this._statusCode as any);
    }
    this._isSent = true;
  }

  /**
   * Sends a JSON response
   * @param data Data to serialize as JSON
   */
  async json(data: any): Promise<void> {
    if (this._isSent) return;
    if (!this._contentType) {
      this.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    this.c.res = this.c.json(data, this._statusCode as any);
    this._isSent = true;
  }

  /**
   * Sends an HTML response
   * @param htmlContent HTML content to send
   */
  async html(htmlContent: string): Promise<void> {
    if (this._isSent) return;
    if (!this._contentType) {
      this.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
    this.c.res = this.c.html(htmlContent, this._statusCode as any);
    this._isSent = true;
  }

  /**
   * Sets the status code and returns the response for chaining
   * @param code HTTP status code
   */
  status(code: number): IHttpResponse {
    this.statusCode = code;
    return this;
  }
}

import { HttpMethod } from "../http/http-method.js";
import type { Context as HonoContext } from "hono";
import type { IHttpRequest } from "../http/http-request.js";
import type { IHttpResponse } from "../http/http-response.js";

export class HonoHttpRequestAdapter implements IHttpRequest {
  public body?: any;
  public readonly headers: Readonly<
    Record<string, string | string[] | undefined>
  >;
  public readonly method: HttpMethod;
  public readonly path: string;
  public readonly query: Readonly<
    Record<string, string | string[] | undefined>
  >;
  public readonly params: Readonly<Record<string, string>>;
  public readonly raw: HonoContext["req"];

  constructor(private c: HonoContext) {
    this.raw = c.req;
    this.method = c.req.method.toUpperCase() as HttpMethod;
    this.path = new URL(c.req.url).pathname;

    const queryParams: Record<string, string | string[]> = {};
    const queriesFromHono = c.req.query();
    for (const key in queriesFromHono) {
      queryParams[key] = queriesFromHono[key];
    }
    this.query = queryParams;

    const headersFromHono = c.req.header();
    const tempHeaders: Record<string, string | string[]> = {};
    for (const key in headersFromHono) {
      tempHeaders[key.toLowerCase()] = headersFromHono[key];
    }
    this.headers = tempHeaders;
    this.params = c.req.param() as Readonly<Record<string, string>>;
  }

  async parseBody(): Promise<void> {
    if (
      this.method === HttpMethod.POST ||
      this.method === HttpMethod.PUT ||
      this.method === HttpMethod.PATCH
    ) {
      if (this.c.req.header("Content-Length") === "0") {
        this.body = undefined;
        return;
      }
      const contentType = this.headers["content-type"]
        ?.toString()
        .toLowerCase();
      if (contentType?.includes("application/json")) {
        try {
          this.body = await this.c.req.json();
        } catch (e) {
          this.body = undefined;
        }
      } else if (
        contentType?.includes("application/x-www-form-urlencoded") ||
        contentType?.includes("multipart/form-data")
      ) {
        try {
          this.body = await this.c.req.parseBody();
        } catch (e) {
          this.body = undefined;
        }
      } else {
        try {
          this.body = await this.c.req.text();
        } catch (e) {
          this.body = undefined;
        }
      }
    }
  }
}

export class HonoHttpResponseAdapter implements IHttpResponse {
  private _statusCode: number = 200;
  private _isSent = false; // SỬA LỖI: Thêm cờ isSent

  get isSent(): boolean {
    return this._isSent;
  }

  constructor(private c: HonoContext) {}

  get statusCode(): number {
    return this._statusCode;
  }
  set statusCode(value: number) {
    this._statusCode = value;
    this.c.status(value as any);
  }

  setHeader(name: string, value: string | number | string[]): void {
    if (Array.isArray(value)) {
      value.forEach((v) => this.c.header(name, v, { append: true }));
    } else {
      this.c.header(name, String(value));
    }
  }

  async send(data?: any): Promise<void> {
    if (this._isSent) return;
    this.c.status(this._statusCode as any);
    this._isSent = true;

    if (data === undefined) {
      this.c.body(null);
      return;
    }

    if (typeof data === "string") {
      if (!this.c.res.headers.get("Content-Type")) {
        this.c.header("Content-Type", "text/plain; charset=utf-8");
      }
      this.c.body(data);
    } else if (Buffer.isBuffer(data)) {
      if (!this.c.res.headers.get("Content-Type")) {
        this.c.header("Content-Type", "application/octet-stream");
      }
      this.c.body(data);
    } else {
      if (!this.c.res.headers.get("Content-Type")) {
        this.c.header("Content-Type", "application/json; charset=utf-8");
      }
      this.c.json(data);
    }
  }

  async json(data: any): Promise<void> {
    if (this._isSent) return;
    this.c.status(this._statusCode as any);
    this._isSent = true;
    this.c.json(data);
  }

  async html(htmlContent: string): Promise<void> {
    if (this._isSent) return;
    this.c.status(this._statusCode as any);
    this._isSent = true;
    this.c.html(htmlContent);
  }

  status(code: number): IHttpResponse {
    this.statusCode = code;
    return this;
  }
}

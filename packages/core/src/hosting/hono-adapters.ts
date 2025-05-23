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
  private _isSent = false;
  // private honoContext: HonoContext; // Không cần lưu trữ riêng nếu truyền vào constructor

  get isSent(): boolean {
    return this._isSent;
  }

  constructor(private c: HonoContext) {
    // Nhận HonoContext trực tiếp
    // this.honoContext = c; // Không cần gán nếu dùng this.c trực tiếp
  }

  get statusCode(): number {
    return this._statusCode;
  }
  set statusCode(value: number) {
    this._statusCode = value;
    // Không cần gọi c.status(value) ở đây nữa,
    // vì các hàm send/json/html sẽ tạo Response với status này.
  }

  setHeader(name: string, value: string | number | string[]): void {
    // Các header sẽ được áp dụng khi c.res được tạo bởi c.text, c.json, c.html
    if (Array.isArray(value)) {
      value.forEach((v) => this.c.header(name, v, { append: true }));
    } else {
      this.c.header(name, String(value));
    }
  }

  async send(data?: any): Promise<void> {
    if (this._isSent) return;

    if (data === undefined || data === null) {
      this.c.res = this.c.body(null, this._statusCode as any);
    } else if (typeof data === "string") {
      // Không cần set Content-Type ở đây nếu c.text sẽ làm
      this.c.res = this.c.text(data, this._statusCode as any);
    } else if (Buffer.isBuffer(data)) {
      // Không cần set Content-Type ở đây nếu c.body với Buffer sẽ làm
      this.c.res = this.c.body(data, this._statusCode as any);
    } else {
      // object, array, etc. -> default to JSON
      this.c.res = this.c.json(data, this._statusCode as any);
    }
    this._isSent = true;
  }

  async json(data: any): Promise<void> {
    if (this._isSent) return;
    this.c.res = this.c.json(data, this._statusCode as any);
    this._isSent = true;
  }

  async html(htmlContent: string): Promise<void> {
    if (this._isSent) return;
    this.c.res = this.c.html(htmlContent, this._statusCode as any);
    this._isSent = true;
  }

  status(code: number): IHttpResponse {
    this.statusCode = code;
    return this;
  }
}

import { type IHttpContext } from "../http/http-context.js";

export interface IActionResult {
  executeResult(context: IHttpContext): Promise<void> | void;
}

export class JsonResult implements IActionResult {
  constructor(
    private data: any,
    private _statusCode: number = 200
  ) {}

  async executeResult(context: IHttpContext): Promise<void> {
    context.response.statusCode = this._statusCode;
    await context.response.json(this.data);
  }
}

export class OkObjectResult extends JsonResult {
  constructor(data: any) {
    super(data, 200);
  }
}
export class OkResult implements IActionResult {
  async executeResult(context: IHttpContext): Promise<void> {
    context.response.statusCode = 200;
    await context.response.send();
  }
}

export class NotFoundResult implements IActionResult {
  async executeResult(context: IHttpContext): Promise<void> {
    context.response.statusCode = 404;
    await context.response.send(); // Hono thường tự gửi response khi status được set và không có body
  }
}
export class NotFoundObjectResult extends JsonResult {
  constructor(errorData: any) {
    super(errorData, 404);
  }
}

export class BadRequestResult implements IActionResult {
  async executeResult(context: IHttpContext): Promise<void> {
    context.response.statusCode = 400;
    await context.response.send();
  }
}
export class BadRequestObjectResult extends JsonResult {
  constructor(errorData: any) {
    super(errorData, 400);
  }
}

export class NoContentResult implements IActionResult {
  async executeResult(context: IHttpContext): Promise<void> {
    context.response.statusCode = 204;
    await context.response.send();
  }
}

export class HtmlResult implements IActionResult {
  constructor(
    private htmlContent: string,
    private _statusCode: number = 200
  ) {}
  async executeResult(context: IHttpContext): Promise<void> {
    context.response.statusCode = this._statusCode;
    await context.response.html(this.htmlContent);
  }
}

export class RedirectResult implements IActionResult {
  constructor(
    private url: string,
    private _statusCode: number = 302
  ) {}
  async executeResult(context: IHttpContext): Promise<void> {
    context.response.statusCode = this._statusCode;
    context.response.setHeader("Location", this.url);
    await context.response.send(); // Hono's redirect thường xử lý việc này
  }
}

// Một lớp cơ sở tùy chọn cho controllers, cung cấp các helper methods.
import type { IHttpContext } from "../http/http-context.js";
import {
  OkObjectResult,
  NotFoundResult,
  JsonResult,
  BadRequestObjectResult,
  NoContentResult,
  OkResult,
  NotFoundObjectResult,
  BadRequestResult,
  RedirectResult,
  HtmlResult,
} from "./action-results.js";

export abstract class ControllerBase {
  private _httpContext?: IHttpContext;

  constructor() {
    console.log("ControllerBase: Constructor called");
  }

  // Property để framework inject HttpContext
  public get httpContext(): IHttpContext | undefined {
    return this._httpContext;
  }
  public set httpContext(value: IHttpContext | undefined) {
    this._httpContext = value;
  }

  protected ok(data?: any): OkObjectResult | OkResult {
    const response = data === undefined ? new OkResult() : new OkObjectResult(data);
    return response
  }

  protected notFound(data?: any): NotFoundObjectResult | NotFoundResult {
    return data === undefined
      ? new NotFoundResult()
      : new NotFoundObjectResult(data);
  }

  protected badRequest(
    errorData?: any
  ): BadRequestObjectResult | BadRequestResult {
    return errorData === undefined
      ? new BadRequestResult()
      : new BadRequestObjectResult(errorData);
  }

  protected noContent(): NoContentResult {
    return new NoContentResult();
  }

  protected json(data: any, statusCode: number = 200): JsonResult {
    return new JsonResult(data, statusCode);
  }

  protected html(content: string, statusCode: number = 200): HtmlResult {
    return new HtmlResult(content, statusCode);
  }

  protected redirect(url: string, statusCode: number = 302): RedirectResult {
    return new RedirectResult(url, statusCode);
  }
}

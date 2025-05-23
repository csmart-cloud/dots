// Một lớp cơ sở tùy chọn cho controllers, cung cấp các helper methods.
// Tương tự ControllerBase trong ASP.NET Core.
import { IHttpContext } from "../http/http-context";
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
} from "./action-results";

export abstract class ControllerBase {
  private _httpContext?: IHttpContext;

  // Property để framework inject HttpContext
  public get httpContext(): IHttpContext | undefined {
    return this._httpContext;
  }
  public set httpContext(value: IHttpContext | undefined) {
    this._httpContext = value;
  }

  protected ok(data?: any): OkObjectResult | OkResult {
    return data === undefined ? new OkResult() : new OkObjectResult(data);
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

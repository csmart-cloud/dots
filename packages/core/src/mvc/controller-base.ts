/**
 * Base class for all controllers, providing helper methods for returning action results.
 * Similar to ASP.NET Core's ControllerBase class.
 */
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
  UnauthorizedResult,
  UnauthorizedObjectResult,
  ForbiddenResult,
  ForbiddenObjectResult,
  ConflictResult,
  ConflictObjectResult,
  CreatedResult,
  CreatedAtResult,
  StatusCodeResult,
  FileResult,
  type IActionResult
} from "./action-results.js";

/**
 * Abstract base class for all controllers.
 * Provides common functionality and helper methods for returning various HTTP responses.
 */
export abstract class ControllerBase {
  private _httpContext?: IHttpContext;
  private _logger?: Console = console;

  /**
   * Gets the HTTP context for the current request.
   */
  public get httpContext(): IHttpContext | undefined {
    return this._httpContext;
  }

  /**
   * Sets the HTTP context for the current request.
   * This is called automatically by the framework.
   */
  public set httpContext(value: IHttpContext | undefined) {
    this._httpContext = value;
  }

  /**
   * Gets the request object from the HTTP context.
   * Throws an error if the context is not available.
   */
  protected get request() {
    if (!this._httpContext) {
      throw new Error('HttpContext not available in this controller. This usually means the controller is being used outside of a request.');
    }
    return this._httpContext.request;
  }

  /**
   * Gets the response object from the HTTP context.
   * Throws an error if the context is not available.
   */
  protected get response() {
    if (!this._httpContext) {
      throw new Error('HttpContext not available in this controller. This usually means the controller is being used outside of a request.');
    }
    return this._httpContext.response;
  }

  /**
   * Gets the service provider from the HTTP context.
   * Throws an error if the context is not available.
   */
  protected get services() {
    if (!this._httpContext) {
      throw new Error('HttpContext not available in this controller. This usually means the controller is being used outside of a request.');
    }
    return this._httpContext.services;
  }

  /**
   * Returns a 200 OK response with an optional data payload.
   * @param data Optional data to include in the response
   */
  protected ok<T = any>(data?: T): OkObjectResult | OkResult {
    return data === undefined ? new OkResult() : new OkObjectResult(data);
  }

  /**
   * Returns a 201 Created response with a URI to the newly created resource and an optional representation.
   * @param uri The URI of the newly created resource
   * @param data Optional data representing the newly created resource
   */
  protected created<T = any>(uri: string, data?: T): CreatedResult {
    return new CreatedResult(uri, data);
  }

  /**
   * Returns a 201 Created response with a URI to the newly created resource and an optional representation.
   * @param actionName The name of the action that will handle the resource
   * @param routeValues The route values for the action
   * @param data Optional data representing the newly created resource
   */
  protected createdAt<T = any>(actionName: string, routeValues: Record<string, any>, data?: T): CreatedAtResult {
    return new CreatedAtResult(actionName, routeValues, data);
  }

  /**
   * Returns a 404 Not Found response with an optional data payload.
   * @param data Optional data to include in the response
   */
  protected notFound<T = any>(data?: T): NotFoundObjectResult | NotFoundResult {
    return data === undefined
      ? new NotFoundResult()
      : new NotFoundObjectResult(data);
  }

  /**
   * Returns a 400 Bad Request response with an optional error data payload.
   * @param errorData Optional error data to include in the response
   */
  protected badRequest<T = any>(errorData?: T): BadRequestObjectResult | BadRequestResult {
    return errorData === undefined
      ? new BadRequestResult()
      : new BadRequestObjectResult(errorData);
  }

  /**
   * Returns a 204 No Content response.
   */
  protected noContent(): NoContentResult {
    return new NoContentResult();
  }

  /**
   * Returns a 200 OK response with a JSON payload.
   * @param data The data to include in the response
   * @param statusCode Optional status code (defaults to 200)
   */
  protected json<T = any>(data: T, statusCode: number = 200): JsonResult {
    return new JsonResult(data, statusCode);
  }

  /**
   * Returns a response with HTML content.
   * @param content The HTML content to include in the response
   * @param statusCode Optional status code (defaults to 200)
   */
  protected html(content: string, statusCode: number = 200): HtmlResult {
    return new HtmlResult(content, statusCode);
  }

  /**
   * Returns a redirect response.
   * @param url The URL to redirect to
   * @param statusCode Optional status code (defaults to 302)
   */
  protected redirect(url: string, statusCode: number = 302): RedirectResult {
    return new RedirectResult(url, statusCode);
  }

  /**
   * Returns a 401 Unauthorized response with an optional data payload.
   * @param data Optional data to include in the response
   */
  protected unauthorized<T = any>(data?: T): UnauthorizedObjectResult | UnauthorizedResult {
    return data === undefined
      ? new UnauthorizedResult()
      : new UnauthorizedObjectResult(data);
  }

  /**
   * Returns a 403 Forbidden response with an optional data payload.
   * @param data Optional data to include in the response
   */
  protected forbidden<T = any>(data?: T): ForbiddenObjectResult | ForbiddenResult {
    return data === undefined
      ? new ForbiddenResult()
      : new ForbiddenObjectResult(data);
  }

  /**
   * Returns a 409 Conflict response with an optional data payload.
   * @param data Optional data to include in the response
   */
  protected conflict<T = any>(data?: T): ConflictObjectResult | ConflictResult {
    return data === undefined
      ? new ConflictResult()
      : new ConflictObjectResult(data);
  }

  /**
   * Returns a response with the specified status code.
   * @param statusCode The HTTP status code
   */
  protected statusCode(statusCode: number): StatusCodeResult {
    return new StatusCodeResult(statusCode);
  }

  /**
   * Returns a file result.
   * @param content The file content
   * @param contentType The content type
   * @param fileName Optional file name for download
   */
  protected file(content: Buffer | string, contentType: string, fileName?: string): FileResult {
    return new FileResult(content, contentType, fileName);
  }
}

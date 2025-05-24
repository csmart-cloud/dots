import { type IHttpContext } from "../http/http-context.js";

/**
 * Interface for all action results
 */
export interface IActionResult {
  /**
   * Legacy method for executing the action result
   * @deprecated Use executeAsync instead
   */
  executeResult(context: IHttpContext): void | Promise<void>;
  
  /**
   * Executes the action result asynchronously
   * @param context The HTTP context
   */
  executeAsync?(context: IHttpContext): Promise<void>;
}

/**
 * Base class for action results that return a status code without content
 */
export class StatusCodeResult implements IActionResult {
  constructor(protected statusCode: number) {}

  async executeResult(context: IHttpContext): Promise<void> {
    context.response.statusCode = this.statusCode;
    await context.response.send();
  }
  
  /**
   * Executes the action result asynchronously
   * @param context The HTTP context
   */
  async executeAsync(context: IHttpContext): Promise<void> {
    return this.executeResult(context);
  }
}

/**
 * Result that serializes the given object to JSON and returns it with the specified status code
 */
export class JsonResult implements IActionResult {
  constructor(
    protected data: any,
    protected _statusCode: number = 200
  ) {}

  executeResult(context: IHttpContext): void | Promise<void> {
    context.response.statusCode = this._statusCode;
    return context.response.json(this.data);
  }
  
  /**
   * Executes the action result asynchronously
   * @param context The HTTP context
   */
  async executeAsync(context: IHttpContext): Promise<void> {
    context.response.statusCode = this._statusCode;
    if (context.response.contentType === undefined) {
      context.response.contentType = "application/json";
    }
    return context.response.json(this.data);
  }
}

/**
 * Returns a 200 OK response with JSON content
 */
export class OkObjectResult extends JsonResult {
  constructor(data: any) {
    super(data, 200);
  }
}

/**
 * Returns a 200 OK response with no content
 */
export class OkResult extends StatusCodeResult {
  constructor() {
    super(200);
  }
}

/**
 * Returns a 404 Not Found response with no content
 */
export class NotFoundResult extends StatusCodeResult {
  constructor() {
    super(404);
  }
}

/**
 * Returns a 404 Not Found response with JSON content
 */
export class NotFoundObjectResult extends JsonResult {
  constructor(errorData: any) {
    super(errorData, 404);
  }
}

/**
 * Returns a 400 Bad Request response with no content
 */
export class BadRequestResult extends StatusCodeResult {
  constructor() {
    super(400);
  }
}

/**
 * Returns a 400 Bad Request response with JSON content
 */
export class BadRequestObjectResult extends JsonResult {
  constructor(errorData: any) {
    super(errorData, 400);
  }
}

/**
 * Returns a 401 Unauthorized response with no content
 */
export class UnauthorizedResult extends StatusCodeResult {
  constructor() {
    super(401);
  }
}

/**
 * Returns a 401 Unauthorized response with JSON content
 */
export class UnauthorizedObjectResult extends JsonResult {
  constructor(errorData: any) {
    super(errorData, 401);
  }
}

/**
 * Returns a 403 Forbidden response with no content
 */
export class ForbiddenResult extends StatusCodeResult {
  constructor() {
    super(403);
  }
}

/**
 * Returns a 403 Forbidden response with JSON content
 */
export class ForbiddenObjectResult extends JsonResult {
  constructor(errorData: any) {
    super(errorData, 403);
  }
}

/**
 * Returns a 409 Conflict response with no content
 */
export class ConflictResult extends StatusCodeResult {
  constructor() {
    super(409);
  }
}

/**
 * Returns a 409 Conflict response with JSON content
 */
export class ConflictObjectResult extends JsonResult {
  constructor(errorData: any) {
    super(errorData, 409);
  }
}

/**
 * Returns a 204 No Content response
 */
export class NoContentResult extends StatusCodeResult {
  constructor() {
    super(204);
  }
}

/**
 * Returns a 201 Created response with a URI to the newly created resource
 */
export class CreatedResult extends JsonResult {
  constructor(private uri: string, data?: any) {
    super(data, 201);
  }

  async executeResult(context: IHttpContext): Promise<void> {
    context.response.statusCode = 201;
    context.response.setHeader("Location", this.uri);
    await context.response.json(this.data);
  }
}

/**
 * Returns a 201 Created response with a URI generated from action and route values
 */
export class CreatedAtResult extends JsonResult {
  constructor(
    private actionName: string,
    private routeValues: Record<string, any>,
    data?: any
  ) {
    super(data, 201);
  }

  async executeResult(context: IHttpContext): Promise<void> {
    // Build the URI from action name and route values
    // This is a simplified implementation - in a real app, you'd use a URL generator
    const uri = `/${this.actionName}?${Object.entries(this.routeValues)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join("&")}`;

    context.response.statusCode = 201;
    context.response.setHeader("Location", uri);
    await context.response.json(this.data);
  }
}

/**
 * Returns an HTML response with the specified status code
 */
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

/**
 * Returns a redirect response with the specified status code
 */
export class RedirectResult implements IActionResult {
  constructor(
    private url: string,
    private _statusCode: number = 302
  ) {}

  async executeResult(context: IHttpContext): Promise<void> {
    context.response.statusCode = this._statusCode;
    context.response.setHeader("Location", this.url);
    await context.response.send();
  }
}

/**
 * Returns a file download response
 */
export class FileResult implements IActionResult {
  constructor(
    private content: Buffer | string,
    private contentType: string,
    private fileName?: string
  ) {}

  async executeResult(context: IHttpContext): Promise<void> {
    context.response.statusCode = 200;
    context.response.setHeader("Content-Type", this.contentType);
    
    if (this.fileName) {
      context.response.setHeader(
        "Content-Disposition",
        `attachment; filename="${this.fileName}"`
      );
    }
    
    // If content is a Buffer, send it as is
    if (Buffer.isBuffer(this.content)) {
      await context.response.send(this.content);
    } else {
      // If content is a string, send it as text
      await context.response.send(this.content);
    }
  }
}

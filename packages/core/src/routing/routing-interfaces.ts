import { HttpMethod } from "../http/http-method.js";
import type { IHttpContext } from "../http/http-context.js";
import type { Constructor } from "../common/types.js";

/**
 * Interface for route handler functions
 */
export interface IRouteHandler {
  (context: IHttpContext): Promise<any> | any;
}

/**
 * Options for route matching and processing
 */
export interface RouteMatchOptions {
  /** Whether route matching is case-sensitive */
  caseSensitive?: boolean;
  /** Priority order for route matching (lower values have higher priority) */
  order?: number;
}

/**
 * Data structure containing information about a registered route
 */
export interface RouteData {
  /** The HTTP method this route responds to */
  method: HttpMethod;
  /** Template path pattern, e.g., /users/:id */
  path: string;
  /** Controller class that handles this route */
  controller: Constructor;
  /** Name of the action method in the controller */
  actionName: string;
  /** Optional route name for URL generation */
  name?: string;
  /** Additional options for route matching and processing */
  options?: RouteMatchOptions;
}

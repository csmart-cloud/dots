/**
 * Routing decorators for controller-based routing
 * Similar to ASP.NET Core attribute routing system
 */
import "reflect-metadata";
import { HttpMethod } from "../http/http-method.js";
import type { Constructor } from "../common/types.js";

/**
 * Metadata keys for route information
 */
export const ROUTE_PREFIX_METADATA = Symbol("RoutePrefix");
export const ACTION_ROUTES_METADATA = Symbol("ActionRoutes");
export const ROUTE_OPTIONS_METADATA = Symbol("RouteOptions");
export const PARAM_BINDING_METADATA_KEY_PREFIX = "custom:route_param_bindings_";

/**
 * Metadata for a controller action route
 */
export interface ActionRouteMetadata {
  /** The route path pattern */
  path: string;
  /** The HTTP method */
  method: HttpMethod;
  /** The name of the action method */
  actionName: string;
  /** Optional route name for URL generation */
  name?: string;
  /** Optional route order for route matching priority */
  order?: number;
}

/**
 * Route options for configuring route behavior
 */
export interface RouteOptions {
  /** Route name for URL generation */
  name?: string;
  /** Route order for matching priority (lower values have higher priority) */
  order?: number;
  /** Whether to match case-sensitively */
  caseSensitive?: boolean;
}

/**
 * Parameter binding metadata for controller action parameters
 */
export interface ParameterBindingMetadata {
  /** The type of parameter binding */
  type:
    | "body"     // Bind from request body
    | "query"    // Bind from query string
    | "route"    // Bind from route parameters
    | "header"   // Bind from HTTP headers
    | "context"  // Inject the HttpContext
    | "request"  // Inject the HttpRequest
    | "response" // Inject the HttpResponse
    | "service"; // Inject a service from DI container
  /** Optional name of the parameter to bind from */
  name?: string;
  /** The position of the parameter in the function signature */
  paramIndex: number;
  /** The expected type of the parameter */
  paramType?: Constructor;
  /** Whether the parameter is required */
  required?: boolean;
  /** Optional default value if parameter is not present */
  defaultValue?: any;
}

/**
 * Decorator to define a controller with an optional route prefix.
 * Similar to [Route("[controller]")] or [ApiController] in ASP.NET Core.
 * 
 * @param prefix Optional route prefix for all actions in this controller
 * @param options Optional route configuration options
 */
export function Controller(prefix: string = "", options?: RouteOptions): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(ROUTE_PREFIX_METADATA, prefix, target);
    if (options) {
      Reflect.defineMetadata(ROUTE_OPTIONS_METADATA, options, target);
    }
  };
}

/**
 * Helper function to create route method decorators
 * 
 * @param method The HTTP method to handle
 * @param path The route path pattern
 * @param options Additional route options
 */
function createActionDecorator(
  method: HttpMethod,
  path: string = "",
  options?: RouteOptions
): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const controllerConstructor = target.constructor;
    const existingRoutes: ActionRouteMetadata[] =
      Reflect.getOwnMetadata(ACTION_ROUTES_METADATA, controllerConstructor) ||
      [];

    existingRoutes.push({
      path,
      method,
      actionName: String(propertyKey),
      name: options?.name,
      order: options?.order
    });
    
    Reflect.defineMetadata(
      ACTION_ROUTES_METADATA,
      existingRoutes,
      controllerConstructor
    );

    // Make sure the method is bound correctly to maintain 'this' context
    if (descriptor && typeof descriptor.value === 'function') {
      const originalMethod = descriptor.value;
      descriptor.value = function(...args: any[]) {
        return originalMethod.apply(this, args);
      };
    }
  };
}

/**
 * Decorator for HTTP GET routes
 * @param path The route path pattern
 * @param options Optional route configuration
 */
export function Get(path: string = "", options?: RouteOptions): MethodDecorator {
  return createActionDecorator(HttpMethod.GET, path, options);
}

/**
 * Decorator for HTTP POST routes
 * @param path The route path pattern
 * @param options Optional route configuration
 */
export function Post(path: string = "", options?: RouteOptions): MethodDecorator {
  return createActionDecorator(HttpMethod.POST, path, options);
}

/**
 * Decorator for HTTP PUT routes
 * @param path The route path pattern
 * @param options Optional route configuration
 */
export function Put(path: string = "", options?: RouteOptions): MethodDecorator {
  return createActionDecorator(HttpMethod.PUT, path, options);
}

/**
 * Decorator for HTTP DELETE routes
 * @param path The route path pattern
 * @param options Optional route configuration
 */
export function Delete(path: string = "", options?: RouteOptions): MethodDecorator {
  return createActionDecorator(HttpMethod.DELETE, path, options);
}

/**
 * Decorator for HTTP PATCH routes
 * @param path The route path pattern
 * @param options Optional route configuration
 */
export function Patch(path: string = "", options?: RouteOptions): MethodDecorator {
  return createActionDecorator(HttpMethod.PATCH, path, options);
}

/**
 * Decorator for HTTP OPTIONS routes
 * @param path The route path pattern
 * @param options Optional route configuration
 */
export function HttpOptions(path: string = "", options?: RouteOptions): MethodDecorator {
  return createActionDecorator(HttpMethod.OPTIONS, path, options);
}

/**
 * Decorator for HTTP HEAD routes
 * @param path The route path pattern
 * @param options Optional route configuration
 */
export function Head(path: string = "", options?: RouteOptions): MethodDecorator {
  return createActionDecorator(HttpMethod.HEAD, path, options);
}

/**
 * Decorator for any HTTP method routes
 * @param path The route path pattern
 * @param options Optional route configuration
 */
export function Route(path: string, options?: RouteOptions): MethodDecorator {
  return createActionDecorator(HttpMethod.ALL, path, options);
}

/**
 * Decorator for HTTP method-specific routes
 * @param method The HTTP method to handle
 * @param path The route path pattern
 * @param options Optional route configuration
 */
export function HttpMethodRoute(method: HttpMethod, path: string = "", options?: RouteOptions): MethodDecorator {
  return createActionDecorator(method, path, options);
}

/**
 * Parameter decorators for binding action parameters to request data
 */

/**
 * Creates a parameter binding decorator with enhanced features
 * @param type The type of binding
 * @param name Optional name to bind from
 * @param options Additional binding options
 */
function createParameterBindingDecorator(
  bindingType: ParameterBindingMetadata["type"],
  paramName?: string,
  options?: { required?: boolean, defaultValue?: any }
): ParameterDecorator {
  return (target: Object, propertyKey: string | symbol | undefined, paramIndex: number) => {
    // Skip if decorating constructor parameters - we don't support that for controller actions
    if (propertyKey === undefined) return;
    const metadataKey = `${PARAM_BINDING_METADATA_KEY_PREFIX}${String(propertyKey)}`;
    // Get existing bindings or initialize new array
    const existingBindings: ParameterBindingMetadata[] =
      Reflect.getOwnMetadata(metadataKey, target.constructor) || [];

    // Get the parameter type using reflect-metadata if available
    const paramTypes = Reflect.getMetadata("design:paramtypes", target, propertyKey);
    const paramType = paramTypes ? paramTypes[paramIndex] : undefined;

    existingBindings.push({
      type: bindingType,
      name: paramName,
      paramIndex: paramIndex,
      paramType,
      required: options?.required,
      defaultValue: options?.defaultValue
    });

    Reflect.defineMetadata(metadataKey, existingBindings, target.constructor);
  };
}

/**
 * Binds a parameter to the request body
 * @param options Optional binding options
 */
export function FromBody(options?: { required?: boolean }): ParameterDecorator {
  return createParameterBindingDecorator("body", undefined, { required: options?.required ?? true });
}

/**
 * Binds a parameter to a query string parameter
 * @param paramName Optional name of the query parameter (defaults to parameter name)
 * @param options Optional binding options
 */
export function FromQuery(paramName?: string, options?: { required?: boolean, defaultValue?: any }): ParameterDecorator {
  return createParameterBindingDecorator("query", paramName, options);
}

/**
 * Binds a parameter to a route parameter
 * @param paramName Optional name of the route parameter (defaults to parameter name)
 * @param options Optional binding options
 */
export function FromRoute(paramName?: string, options?: { required?: boolean }): ParameterDecorator {
  return createParameterBindingDecorator("route", paramName, { required: options?.required ?? true });
}

/**
 * Binds a parameter to an HTTP header
 * @param headerName Name of the header
 * @param options Optional binding options
 */
export function FromHeader(headerName: string, options?: { required?: boolean, defaultValue?: any }): ParameterDecorator {
  return createParameterBindingDecorator("header", headerName, options);
}

/**
 * Injects the HTTP context into a parameter
 */
export function Context(): ParameterDecorator {
  return createParameterBindingDecorator("context");
}

/**
 * Injects the HTTP request into a parameter
 */
export function Request(): ParameterDecorator {
  return createParameterBindingDecorator("request");
}

/**
 * Injects the HTTP response into a parameter
 */
export function Response(): ParameterDecorator {
  return createParameterBindingDecorator("response");
}

/**
 * Injects a service from the DI container
 * @param serviceType Optional service type token (defaults to parameter type)
 */
export function ServiceParam(serviceType?: any): ParameterDecorator {
  return (target: any, propertyKey: string | symbol | undefined, paramIndex: number) => {
    // Skip if decorating constructor parameters - we don't support that for controller actions
    if (propertyKey === undefined) return;
    const metadataKey = `${PARAM_BINDING_METADATA_KEY_PREFIX}${String(
      propertyKey
    )}`;
    const existingBindings: ParameterBindingMetadata[] =
      Reflect.getOwnMetadata(metadataKey, target.constructor) || [];

    // Use the parameter type as the service type if not provided
    if (!serviceType) {
      const paramTypes = Reflect.getMetadata(
        "design:paramtypes",
        target,
        propertyKey
      );
      serviceType = paramTypes ? paramTypes[paramIndex] : undefined;
    }

    existingBindings.push({
      type: "service",
      name: String(serviceType),
      paramIndex: paramIndex,
      paramType: serviceType,
    });

    Reflect.defineMetadata(metadataKey, existingBindings, target.constructor);
  };
}

// Export aliases for backward compatibility
export const HttpGet = Get;
export const HttpPost = Post;
export const HttpPut = Put;
export const HttpDelete = Delete;
export const HttpPatch = Patch;

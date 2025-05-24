import type { Middleware } from "../common/types.js";
import type { IHttpContext } from "../http/http-context.js";
import type { Constructor } from "../common/types.js";
import {
  ACTION_ROUTES_METADATA,
  PARAM_BINDING_METADATA_KEY_PREFIX,
  ROUTE_PREFIX_METADATA,
  type ActionRouteMetadata,
  type ParameterBindingMetadata
} from "../routing/decorators.js";
import type { RouteData } from "../routing/routing-interfaces.js";
import type { IActionResult } from "./action-results.js";
import { ControllerBase } from "./controller-base.js";
import { HttpMethod } from "../http/http-method.js";

/**
 * Creates MVC middleware for handling controller routes
 * @param controllers Array of controller types to register
 */
export function createMvcMiddleware(controllers: Constructor<ControllerBase>[]): Middleware {
  const routes: RouteData[] = [];
  
  // Register all controller routes
  controllers.forEach((controller) => {
    const prefix = Reflect.getMetadata(ROUTE_PREFIX_METADATA, controller) || "";
    const actionRoutesMeta: ActionRouteMetadata[] =
      Reflect.getMetadata(ACTION_ROUTES_METADATA, controller) || [];

    actionRoutesMeta.forEach((routeMeta) => {
      let fullPath =
        (prefix.startsWith("/") ? prefix : "/" + prefix) +
        (routeMeta.path.startsWith("/") ? routeMeta.path : "/" + routeMeta.path);
      fullPath = fullPath.replace(/\/\//g, "/");
      
      if (fullPath !== "/" && fullPath.endsWith("/")) {
        fullPath = fullPath.slice(0, -1);
      }
      
      if (fullPath === "") fullPath = "/";

      routes.push({
        method: routeMeta.method,
        path: fullPath,
        controller: controller,
        actionName: routeMeta.actionName,
      });
      
      console.log(
        `[MVC] Mapped [${routeMeta.method}] ${fullPath} to ${controller.name}.${routeMeta.actionName}`
      );
    });
  });

  // Return the middleware function
  return async (context: IHttpContext, next: () => Promise<void>) => {
    const { path, method } = context.request;
    const matchedRoute = findMatchedRoute(method, path, routes);

    if (matchedRoute) {
      const scope = context.services;
      const controllerInstance = scope.getService(
        matchedRoute.controller
      ) as ControllerBase;

      const actionMethod = controllerInstance
        ? (controllerInstance as any)[matchedRoute.actionName]
        : undefined;

      if (!controllerInstance || typeof actionMethod !== "function") {
        console.error(
          `Controller or action not found: ${matchedRoute.controller.name}.${matchedRoute.actionName}`
        );
        context.response.statusCode = 500;
        await context.response.send(
          "Internal Server Error: Controller or action method not found."
        );
        return;
      }

      controllerInstance.httpContext = context;

      try {
        const paramBindingMetadataKey = `${PARAM_BINDING_METADATA_KEY_PREFIX}${matchedRoute.actionName}`;
        const paramBindings: ParameterBindingMetadata[] =
          Reflect.getOwnMetadata(
            paramBindingMetadataKey,
            matchedRoute.controller
          ) || [];

        const actionArgs = await bindActionArguments(
          paramBindings,
          context,
          matchedRoute.routeParams || {}
        );

        const result = await actionMethod.apply(controllerInstance, actionArgs);

        if (
          result &&
          typeof (result as IActionResult).executeResult === "function"
        ) {
          await (result as IActionResult).executeResult(context);
        } else if (result !== undefined) {
          await context.response.json(result);
        } else {
          if (context.response.statusCode === 200 && !context.response.isSent) {
            context.response.statusCode = 204;
            await context.response.send();
          }
        }
      } catch (error: any) {
        console.error(
          `Error executing action ${matchedRoute.controller.name}.${matchedRoute.actionName}:`,
          error
        );
        if (!context.response.isSent) {
          context.response.statusCode = 500;
          await context.response.send(error.message || "Internal Server Error");
        }
      }
    } else {
      await next();
    }
  };
}

/**
 * Finds a matching route for a request
 * @param httpMethod The HTTP method
 * @param requestPath The request path
 * @param routes The available routes
 * @returns The matched route with any route parameters
 */
function findMatchedRoute(
  httpMethod: HttpMethod,
  requestPath: string,
  routes: RouteData[]
): (RouteData & { routeParams?: Record<string, string> }) | null {
  const normalizedRequestPath =
    requestPath.endsWith("/") && requestPath.length > 1
      ? requestPath.slice(0, -1)
      : requestPath;

  for (const route of routes) {
    if (route.method !== httpMethod) continue;

    const paramNames: string[] = [];
    const routeRegexPattern =
      "^" +
      route.path.replace(/:(\w+)/g, (_, paramName) => {
        paramNames.push(paramName);
        return "([^/]+)";
      }) +
      "$";
    const routeRegex = new RegExp(routeRegexPattern);

    const match = normalizedRequestPath.match(routeRegex);

    if (match) {
      const params: Record<string, string> = {};
      paramNames.forEach((name, index) => {
        params[name] = decodeURIComponent(match[index + 1]);
      });
      return { ...route, routeParams: params };
    }
  }
  return null;
}

/**
 * Binds parameters for a controller action
 * @param paramBindings Parameter binding metadata
 * @param context HTTP context
 * @param routeParams Route parameters
 * @returns The bound arguments
 */
async function bindActionArguments(
  paramBindings: ParameterBindingMetadata[],
  context: IHttpContext,
  routeParams: Record<string, string>
): Promise<any[]> {
  const args: any[] = [];

  const sortedBindings: ParameterBindingMetadata[] = [...paramBindings].sort(
    (a: ParameterBindingMetadata, b: ParameterBindingMetadata) =>
      a.paramIndex - b.paramIndex
  );

  for (const binding of sortedBindings) {
    if (binding) {
      switch (binding.type) {
        case "body":
          args[binding.paramIndex] = context.request.body;
          break;
        case "query":
          const queryParamName =
            binding.name ||
            (binding.paramType
              ? binding.paramType.name.toLowerCase()
              : `param${binding.paramIndex}`);
          const queryValue = context.request.query[queryParamName];
          args[binding.paramIndex] = convertToType(
            queryValue,
            binding.paramType
          );
          break;
        case "route":
          const routeParamName =
            binding.name ||
            (binding.paramType
              ? binding.paramType.name.toLowerCase()
              : `param${binding.paramIndex}`);
          const routeValue = routeParams[routeParamName];
          args[binding.paramIndex] = convertToType(
            routeValue,
            binding.paramType
          );
          break;
        case "header":
          const headerName = (
            binding.name ||
            (binding.paramType
              ? binding.paramType.name.toLowerCase()
              : `param${binding.paramIndex}`)
          ).toLowerCase();
          const headerValue = context.request.headers[headerName];
          args[binding.paramIndex] = convertToType(
            headerValue,
            binding.paramType
          );
          break;
        case "context":
          args[binding.paramIndex] = context;
          break;
        case "request":
          args[binding.paramIndex] = context.request;
          break;
        case "response":
          args[binding.paramIndex] = context.response;
          break;
        case "service":
          const serviceToken = binding.name || binding.paramType;
          if (!serviceToken)
            throw new Error(
              `Service token not specified for parameter ${binding.paramIndex}`
            );
          args[binding.paramIndex] = context.services.getService(serviceToken);
          break;
        default:
          args[binding.paramIndex] = undefined;
      }
    }
  }
  return args;
}

/**
 * Converts a value to the specified type
 * @param value The value to convert
 * @param targetType The target type
 * @returns The converted value
 */
function convertToType(value: any, targetType?: Constructor): any {
  if (value === undefined || targetType === undefined) return value;
  if (targetType === String) return String(value);
  if (targetType === Number) {
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  }
  if (targetType === Boolean)
    return value === "true" || value === true || value === "1" || value === 1;

  if (typeof value === "string") {
    if (
      targetType === Object ||
      targetType === Array ||
      (targetType.prototype &&
        typeof targetType.prototype === "object" &&
        !(
          targetType === String ||
          targetType === Number ||
          targetType === Boolean
        ))
    ) {
      try {
        return JSON.parse(value);
      } catch (e) {
        /* ignore */
      }
    }
  }
  return value;
}

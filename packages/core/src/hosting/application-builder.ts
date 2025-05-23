import { ControllerBase } from "../mvc/controller-base.js";
import { HttpMethod } from "../http/http-method.js";
import {
  ACTION_ROUTES_METADATA,
  PARAM_BINDING_METADATA_KEY_PREFIX,
  ROUTE_PREFIX_METADATA,
  type ActionRouteMetadata,
  type ParameterBindingMetadata,
} from "../routing/decorators.js";
import type { IHttpContext } from "../http/http-context.js";
import type { Middleware } from "../common/types.js";
import type { IServiceProvider } from "../di/service-provider.js";
import type { RouteData } from "../routing/routing-interfaces.js";
import type { IActionResult } from "../mvc/action-results.js";
import type { Constructor } from "../common/types.js";

export interface IApplicationBuilder {
  use(middleware: Middleware): IApplicationBuilder;
  build(): (context: IHttpContext) => Promise<void>;
  useRouting(controllers: Constructor<ControllerBase>[]): IApplicationBuilder;
}

export class DefaultApplicationBuilder implements IApplicationBuilder {
  private middlewares: Middleware[] = [];
  private routes: RouteData[] = [];

  constructor(private readonly appServices: IServiceProvider) {}

  use(middleware: Middleware): IApplicationBuilder {
    this.middlewares.push(middleware);
    return this;
  }

  useRouting(controllers: Constructor<ControllerBase>[]): IApplicationBuilder {
    controllers.forEach((controller) => {
      const prefix =
        Reflect.getMetadata(ROUTE_PREFIX_METADATA, controller) || "";
      const actionRoutesMeta: ActionRouteMetadata[] =
        Reflect.getMetadata(ACTION_ROUTES_METADATA, controller) || [];

      actionRoutesMeta.forEach((routeMeta) => {
        let fullPath =
          (prefix.startsWith("/") ? prefix : "/" + prefix) +
          (routeMeta.path.startsWith("/")
            ? routeMeta.path
            : "/" + routeMeta.path);
        fullPath = fullPath.replace(/\/\//g, "/");
        if (fullPath !== "/" && fullPath.endsWith("/")) {
          fullPath = fullPath.slice(0, -1);
        }
        if (fullPath === "") fullPath = "/";

        this.routes.push({
          method: routeMeta.method,
          path: fullPath,
          controller: controller,
          actionName: routeMeta.actionName,
        });
        console.log(
          `Mapped [${routeMeta.method}] ${fullPath} to ${controller.name}.${routeMeta.actionName}`
        );
      });
    });
    this.use(this.routerMiddleware.bind(this));
    return this;
  }

  private async routerMiddleware(
    context: IHttpContext,
    next: () => Promise<void>
  ): Promise<void> {
    const { path, method } = context.request;
    const matchedRoute = this.findMatchedRoute(method, path);

    if (matchedRoute) {
      const scope = context.services;
      const controllerInstance = scope.getService(
        matchedRoute.controller
      ) as ControllerBase;

      // SỬA LỖI #2: Gán method vào biến và dùng .apply() để gọi
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

        const actionArgs = await this.bindActionArguments(
          paramBindings,
          context,
          matchedRoute.routeParams || {},
          scope
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
  }

  private async bindActionArguments(
    paramBindings: ParameterBindingMetadata[],
    context: IHttpContext,
    routeParams: Record<string, string>,
    scope: IServiceProvider
  ): Promise<any[]> {
    const args: any[] = [];

    // Thêm type annotation để giúp TypeScript inference
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
            args[binding.paramIndex] = this.convertToType(
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
            args[binding.paramIndex] = this.convertToType(
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
            args[binding.paramIndex] = this.convertToType(
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
            args[binding.paramIndex] = scope.getService(serviceToken);
            break;
          default:
            args[binding.paramIndex] = undefined;
        }
      }
    }
    return args;
  }

  private convertToType(value: any, targetType?: Constructor): any {
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

  private findMatchedRoute(
    httpMethod: HttpMethod,
    requestPath: string
  ): (RouteData & { routeParams?: Record<string, string> }) | null {
    const normalizedRequestPath =
      requestPath.endsWith("/") && requestPath.length > 1
        ? requestPath.slice(0, -1)
        : requestPath;

    for (const route of this.routes) {
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

      // SỬA LỖI #4: Loại bỏ ternary operator không hợp lệ
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

  build(): (context: IHttpContext) => Promise<void> {
    let app: (context: IHttpContext) => Promise<void> = async (_context) => {
      if (!_context.response.isSent) {
        _context.response.statusCode = 404;
        await _context.response.send(
          "Not Found by CoreTSApiFramework fallback."
        );
      }
    };

    for (let i = this.middlewares.length - 1; i >= 0; i--) {
      const currentMiddleware = this.middlewares[i];
      const nextApp = app;
      app = async (context) => {
        await currentMiddleware(context, () => nextApp(context));
      };
    }
    return app;
  }
}

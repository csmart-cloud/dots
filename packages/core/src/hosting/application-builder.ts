import { ControllerBase } from "../mvc/controller-base.js";
import { HttpMethod } from "../http/http-method.js";
import {
  ACTION_ROUTES_METADATA,
  PARAM_BINDING_METADATA_KEY_PREFIX,
  ROUTE_OPTIONS_METADATA,
  ROUTE_PREFIX_METADATA,
  type ActionRouteMetadata,
  type ParameterBindingMetadata,
  type RouteOptions,
} from "../routing/decorators.js";
import type { IHttpContext } from "../http/http-context.js";
import type { Middleware } from "../common/types.js";
import type { IServiceProvider } from "../di/service-provider.js";
import type { RouteData } from "../routing/routing-interfaces.js";
import type { IActionResult } from "../mvc/action-results.js";
import type { Constructor } from "../common/types.js";
import {
  createCorsMiddleware,
  type CorsOptions,
} from "../middleware/cors.middleware.js";
import type { ILogger } from "../logging/logger.interface.js";

/**
 * Configuration options for the application
 */
export interface ApplicationOptions {
  /**
   * Enables case-sensitive routing
   * @default false
   */
  caseSensitive?: boolean;
  
  /**
   * Enables trailing slash matching
   * @default false
   */
  enableTrailingSlash?: boolean;
  
  /**
   * Enables automatic HEAD request handling based on GET routes
   * @default true
   */
  enableHeadForGetRequests?: boolean;
  
  /**
   * Enables detailed logging for routes and middleware execution
   * @default false
   */
  enableDetailedLogging?: boolean;
}

/**
 * Interface for building the application request pipeline
 * Similar to ASP.NET Core's IApplicationBuilder
 */
export interface IApplicationBuilder {
  /**
   * Adds a middleware to the request pipeline
   * @param middleware The middleware to add
   * @returns The application builder for chaining
   */
  use(middleware: Middleware): IApplicationBuilder;
  
  /**
   * Builds the application request pipeline
   * @returns A function that processes HTTP requests
   */
  build(): (context: IHttpContext) => Promise<void>;
  
  /**
   * Adds routing middleware with the specified controllers
   * @param controllers Array of controller types to register
   * @returns The application builder for chaining
   */
  useRouting(controllers: Constructor<ControllerBase>[]): IApplicationBuilder;
  
  /**
   * Adds CORS middleware to the request pipeline
   * @param options CORS configuration options
   * @returns The application builder for chaining
   */
  useCors(options?: CorsOptions): IApplicationBuilder;
  
  /**
   * Maps a middleware to a specific path prefix
   * @param pathPrefix The path prefix to match
   * @param middleware The middleware to execute for matching paths
   * @returns The application builder for chaining
   */
  map(pathPrefix: string, middleware: Middleware): IApplicationBuilder;
  
  /**
   * Creates a branch in the middleware pipeline that only executes for matching requests
   * @param predicate A function that determines if the branch should execute
   * @param configure A function that configures the branch middleware
   * @returns The application builder for chaining
   */
  branch(
    predicate: (context: IHttpContext) => boolean,
    configure: (builder: IApplicationBuilder) => void
  ): IApplicationBuilder;
}

/**
 * Default implementation of IApplicationBuilder for configuring the application's request pipeline
 */
export class DefaultApplicationBuilder implements IApplicationBuilder {
  private middlewares: Middleware[] = [];
  private routes: RouteData[] = [];
  private options: ApplicationOptions = {
    caseSensitive: false,
    enableTrailingSlash: false,
    enableHeadForGetRequests: true,
    enableDetailedLogging: false
  };
  private logger?: ILogger;

  /**
   * Creates a new DefaultApplicationBuilder
   * @param appServices The root service provider
   * @param options Application configuration options
   */
  constructor(
    private readonly appServices: IServiceProvider,
    options?: Partial<ApplicationOptions>
  ) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
    this.logger = appServices.getService<ILogger>("ILogger") || undefined;
  }

  /**
   * Adds a middleware to the request pipeline
   * @param middleware The middleware to add
   * @returns The application builder for chaining
   */
  use(middleware: Middleware): IApplicationBuilder {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Adds CORS middleware to the request pipeline
   * @param options CORS configuration options
   * @returns The application builder for chaining
   */
  useCors(options?: CorsOptions): IApplicationBuilder {
    this.use(createCorsMiddleware(options));
    return this;
  }

  /**
   * Maps a middleware to a specific path prefix
   * @param pathPrefix The path prefix to match
   * @param middleware The middleware to execute for matching paths
   * @returns The application builder for chaining
   */
  map(pathPrefix: string, middleware: Middleware): IApplicationBuilder {
    const mapMiddleware: Middleware = async (context, next) => {
      const requestPath = context.request.path;
      if (requestPath.startsWith(pathPrefix)) {
        await middleware(context, next);
      } else {
        await next();
      }
    };
    this.use(mapMiddleware);
    return this;
  }

  /**
   * Creates a branch in the middleware pipeline that only executes for matching requests
   * @param predicate A function that determines if the branch should execute
   * @param configure A function that configures the branch middleware
   * @returns The application builder for chaining
   */
  branch(
    predicate: (context: IHttpContext) => boolean,
    configure: (builder: IApplicationBuilder) => void
  ): IApplicationBuilder {
    // Create a new builder for the branch
    const branchBuilder = new DefaultApplicationBuilder(this.appServices, this.options);
    
    // Configure the branch
    configure(branchBuilder);
    
    // Build the branch middleware pipeline
    const branchApp = branchBuilder.build();
    
    // Create a middleware that conditionally executes the branch
    const branchMiddleware: Middleware = async (context, next) => {
      if (predicate(context)) {
        await branchApp(context);
      } else {
        await next();
      }
    };
    
    this.use(branchMiddleware);
    return this;
  }

  /**
   * Adds routing middleware with the specified controllers
   * @param controllers Array of controller types to register
   * @returns The application builder for chaining
   */
  useRouting(controllers: Constructor<ControllerBase>[]): IApplicationBuilder {
    controllers.forEach((controller) => {
      const prefix =
        Reflect.getMetadata(ROUTE_PREFIX_METADATA, controller) || "";
      const routeOptions = 
        Reflect.getMetadata(ROUTE_OPTIONS_METADATA, controller) as RouteOptions || {};
      const actionRoutesMeta: ActionRouteMetadata[] =
        Reflect.getMetadata(ACTION_ROUTES_METADATA, controller) || [];

      // Sort by route order if specified
      actionRoutesMeta.sort((a, b) => {
        // Lower order values have higher priority
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        // Routes with order specified come first
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return 0;
      });

      actionRoutesMeta.forEach((routeMeta) => {
        let fullPath =
          (prefix.startsWith("/") ? prefix : "/" + prefix) +
          (routeMeta.path.startsWith("/")
            ? routeMeta.path
            : "/" + routeMeta.path);
        fullPath = fullPath.replace(/\/\//g, "/");
        
        // Handle trailing slashes
        if (!this.options.enableTrailingSlash && fullPath !== "/" && fullPath.endsWith("/")) {
          fullPath = fullPath.slice(0, -1);
        }
        if (fullPath === "") fullPath = "/";

        // Register the route
        this.routes.push({
          method: routeMeta.method,
          path: fullPath,
          controller: controller,
          actionName: routeMeta.actionName,
          name: routeMeta.name,
          options: {
            caseSensitive: routeOptions.caseSensitive ?? this.options.caseSensitive,
            order: routeMeta.order
          }
        });
        
        // Generate HEAD routes for GET routes if enabled
        if (this.options.enableHeadForGetRequests && routeMeta.method === HttpMethod.GET) {
          this.routes.push({
            method: HttpMethod.HEAD,
            path: fullPath,
            controller: controller,
            actionName: routeMeta.actionName,
            name: routeMeta.name ? `${routeMeta.name}_HEAD` : undefined,
            options: {
              caseSensitive: routeOptions.caseSensitive ?? this.options.caseSensitive,
              order: routeMeta.order ? routeMeta.order + 100 : undefined // Lower priority than the GET route
            }
          });
        }

        if (this.logger || this.options.enableDetailedLogging) {
          const message = `Mapped [${routeMeta.method}] ${fullPath} to ${controller.name}.${routeMeta.actionName}`;
          this.logger?.debug?.(message) ?? console.log(message);
        }
      });
    });
    
    // Add the router middleware to handle routes
    this.use(this.routerMiddleware.bind(this));
    return this;
  }

  /**
   * Middleware that handles routing requests to controller actions
   * @param context The HTTP context
   * @param next The next middleware in the pipeline
   */
  private async routerMiddleware(
    context: IHttpContext,
    next: () => Promise<void>
  ): Promise<void> {
    const { path, method } = context.request;
    const matchedRoute = this.findMatchedRoute(method, path);

    if (matchedRoute) {
      if (this.options.enableDetailedLogging) {
        this.logger?.debug?.(`Processing route match: ${method} ${path} → ${matchedRoute.controller.name}.${matchedRoute.actionName}`) ?? 
          console.log(`Processing route match: ${method} ${path} → ${matchedRoute.controller.name}.${matchedRoute.actionName}`);
      }
      
      const scope = context.services;
      const controllerInstance = scope.getService(
        matchedRoute.controller
      ) as ControllerBase;

      // Get the action method from the controller instance
      const actionMethod = controllerInstance
        ? (controllerInstance as any)[matchedRoute.actionName]
        : undefined;

      if (!controllerInstance || typeof actionMethod !== "function") {
        const errorMessage = `Controller or action not found: ${matchedRoute.controller.name}.${matchedRoute.actionName}`;
        this.logger?.error?.(errorMessage) ?? console.error(errorMessage);
        context.response.statusCode = 500;
        await context.response.send(
          "Internal Server Error: Controller or action method not found."
        );
        return;
      }

      // Set the HTTP context on the controller
      controllerInstance.httpContext = context;

      try {
        // Get parameter binding metadata
        const paramBindingMetadataKey = `${PARAM_BINDING_METADATA_KEY_PREFIX}${matchedRoute.actionName}`;
        const paramBindings: ParameterBindingMetadata[] =
          Reflect.getOwnMetadata(
            paramBindingMetadataKey,
            matchedRoute.controller
          ) || [];

        // Bind action method arguments from various sources
        const args = await this.bindActionArguments(
          paramBindings,
          context,
          matchedRoute.routeParams || {},
          scope
        );

        // Call the action method with the bound arguments
        const result = await actionMethod.apply(controllerInstance, args);

        // Handle the result if response hasn't been sent yet
        if (!context.response.isSent) {
          try {
            if (result === undefined || result === null) {
              // No content result - set status 204 if not already set
              if (context.response.statusCode === 200) {
                context.response.statusCode = 204;
              }
              await context.response.end();
            } else if (result && typeof result === "object") {
              // Check if it's an IActionResult by duck typing
              const maybeActionResult = result as Partial<IActionResult>;
              
              if (typeof maybeActionResult.executeAsync === 'function') {
                // Use the new async method if available
                await maybeActionResult.executeAsync(context);
              } else if (typeof maybeActionResult.executeResult === 'function') {
                // Fall back to the legacy method
                await Promise.resolve(maybeActionResult.executeResult(context));
              } else {
                // Not an action result - send as JSON
                if (!context.response.contentType) {
                  context.response.contentType = "application/json";
                }
                await context.response.send(JSON.stringify(result));
              }
            } else {
              // Primitive result (string, number, boolean) - send as JSON
              if (!context.response.contentType) {
                context.response.contentType = "application/json";
              }
              await context.response.send(JSON.stringify(result));
            }
          } catch (innerError) {
            // Handle errors during result processing
            const errorMessage = `Error processing action result: ${innerError instanceof Error ? innerError.message : String(innerError)}`;
            this.logger?.error?.(errorMessage, { error: innerError }) ?? console.error(errorMessage, innerError);
            
            if (!context.response.isSent) {
              context.response.statusCode = 500;
              await context.response.send("Internal Server Error: Failed to process action result.");
            }
          }
        }
      } catch (error) {
        // Log and handle errors
        const errorMessage = `Error executing controller action ${matchedRoute.controller.name}.${matchedRoute.actionName}: ${error instanceof Error ? error.message : String(error)}`;
        this.logger?.error?.(errorMessage, { error }) ?? console.error(errorMessage, error);
        
        if (!context.response.isSent) {
          context.response.statusCode = 500;
          await context.response.send(
            "Internal Server Error: An error occurred while processing your request."
          );
        }
      }
      return;
    }

    // No matching route - continue to next middleware
    await next();
  }

  /**
   * Binds controller action parameters from various sources
   * @param paramBindings Parameter binding metadata for the action
   * @param context The HTTP context
   * @param routeParams Route parameters extracted from the URL
   * @param scope Service provider scope for resolving dependencies
   * @returns Array of bound parameters for the action method
   */
  public async bindActionArguments(
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

  /**
   * Converts a value to the specified target type
   * @param value The value to convert
   * @param targetType The target type to convert to
   * @returns The converted value
   */
  public convertToType(value: any, targetType?: Constructor): any {
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

  /**
   * Finds a route that matches the HTTP method and request path
   * @param httpMethod The HTTP method of the request
   * @param requestPath The path of the request
   * @returns The matched route data with route parameters, or null if no match
   */
  public findMatchedRoute(
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
        await _context.response.send("Not Found fallback.");
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

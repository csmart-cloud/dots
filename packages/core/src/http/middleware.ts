/**
 * Middleware system implementation similar to ASP.NET Core's middleware pipeline.
 * This file defines interfaces and classes for building a middleware pipeline
 * that processes HTTP requests in a chained manner.
 */
import { type IHttpContext } from './http-context.js';

/**
 * Represents a function that can process an HTTP request and either call the next middleware
 * in the pipeline or terminate the request.
 */
export type RequestDelegate = (context: IHttpContext) => Promise<void>;

/**
 * Represents a middleware in the pipeline.
 */
export interface IMiddleware {
  /**
   * Process an HTTP request.
   * @param context The HTTP context for the request
   * @param next The next middleware in the pipeline
   */
  invoke(context: IHttpContext, next: RequestDelegate): Promise<void>;
}

/**
 * Function that configures a middleware with additional services or options.
 */
export type MiddlewareConfigureDelegate<TOptions = any> = (options: TOptions) => IMiddleware;

/**
 * Represents a class that can be used as middleware.
 */
export interface IMiddlewareFactory {
  /**
   * Creates a middleware instance.
   */
  create(): IMiddleware;
}

/**
 * Represents the application's request pipeline.
 */
export interface IApplicationBuilder {
  /**
   * Adds a middleware to the application's request pipeline.
   * @param middleware The middleware to add
   */
  use(middleware: IMiddleware): IApplicationBuilder;

  /**
   * Adds a middleware function to the application's request pipeline.
   * @param handler The middleware function to add
   */
  use(handler: (context: IHttpContext, next: RequestDelegate) => Promise<void>): IApplicationBuilder;

  /**
   * Creates a new IApplicationBuilder that shares the same service provider
   * but has a separate middleware pipeline.
   */
  createBranch(): IApplicationBuilder;

  /**
   * Builds the request delegate that represents the middleware pipeline.
   */
  build(): RequestDelegate;
}

/**
 * Default implementation of IApplicationBuilder.
 */
export class ApplicationBuilder implements IApplicationBuilder {
  private readonly middlewares: IMiddleware[] = [];

  /**
   * Creates a new ApplicationBuilder.
   */
  constructor() {}

  /**
   * Adds a middleware to the application's request pipeline.
   * @param middleware The middleware to add or middleware function
   */
  use(middleware: IMiddleware | ((context: IHttpContext, next: RequestDelegate) => Promise<void>)): IApplicationBuilder {
    if (typeof middleware === 'function') {
      // Convert function to IMiddleware
      this.middlewares.push({
        invoke: middleware,
      });
    } else {
      this.middlewares.push(middleware);
    }
    return this;
  }

  /**
   * Creates a new IApplicationBuilder that has a separate middleware pipeline.
   */
  createBranch(): IApplicationBuilder {
    return new ApplicationBuilder();
  }

  /**
   * Builds the request delegate that represents the middleware pipeline.
   */
  build(): RequestDelegate {
    return (context: IHttpContext) => {
      return this.executeMiddlewareChain(context, 0);
    };
  }

  /**
   * Executes the middleware chain starting at the specified index.
   * @param context The HTTP context
   * @param index The index of the middleware to execute
   */
  private executeMiddlewareChain(context: IHttpContext, index: number): Promise<void> {
    if (index >= this.middlewares.length) {
      // End of the pipeline, return a resolved promise
      return Promise.resolve();
    }

    const middleware = this.middlewares[index];
    const next: RequestDelegate = (ctx) => {
      return this.executeMiddlewareChain(ctx, index + 1);
    };

    return middleware.invoke(context, next);
  }
}

/**
 * Creates a new application builder.
 */
export function createApplicationBuilder(): IApplicationBuilder {
  return new ApplicationBuilder();
}

/**
 * A middleware that simply calls the next middleware in the pipeline.
 */
export class PassThroughMiddleware implements IMiddleware {
  async invoke(context: IHttpContext, next: RequestDelegate): Promise<void> {
    await next(context);
  }
}

/**
 * Creates a middleware that runs a function before and after the next middleware.
 * @param beforeNext Function to run before calling next
 * @param afterNext Function to run after calling next
 */
export function createDelegateMiddleware(
  beforeNext?: (context: IHttpContext) => Promise<void> | void,
  afterNext?: (context: IHttpContext) => Promise<void> | void
): IMiddleware {
  return {
    async invoke(context: IHttpContext, next: RequestDelegate): Promise<void> {
      if (beforeNext) {
        await beforeNext(context);
      }

      await next(context);

      if (afterNext) {
        await afterNext(context);
      }
    }
  };
}

/**
 * Creates a middleware that conditionally executes a branch of middleware.
 * @param predicate A function that determines whether the branch should be executed
 * @param branch The branch to execute if the predicate returns true
 */
export function createBranchMiddleware(
  predicate: (context: IHttpContext) => boolean,
  branch: RequestDelegate
): IMiddleware {
  return {
    async invoke(context: IHttpContext, next: RequestDelegate): Promise<void> {
      if (predicate(context)) {
        await branch(context);
      } else {
        await next(context);
      }
    }
  };
}

/**
 * Creates a middleware that maps a specific path to a branch of middleware.
 * @param pathMatch The path to match
 * @param branch The branch to execute if the path matches
 */
export function createMapMiddleware(pathMatch: string, branch: RequestDelegate): IMiddleware {
  return createBranchMiddleware(
    (context) => {
      // Simple path matching - a more robust implementation would use a proper router
      const path = context.request.path;
      return path === pathMatch || path.startsWith(`${pathMatch}/`);
    },
    branch
  );
}

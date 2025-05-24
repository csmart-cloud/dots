/**
 * Extensions for the middleware system that provide convenient methods for
 * registering common middleware patterns.
 */
import { type IHttpContext } from './http-context.js';
import {
  type IApplicationBuilder,
  type IMiddleware,
  type RequestDelegate,
  createBranchMiddleware,
  createDelegateMiddleware,
  createMapMiddleware
} from './middleware.js';

/**
 * Adds a middleware that logs incoming requests.
 * @param builder The application builder
 * @param loggerFactory Optional factory to create a logger
 */
export function useRequestLogging(
  builder: IApplicationBuilder,
  loggerFactory?: (context: IHttpContext) => Console
): IApplicationBuilder {
  const logger = loggerFactory || (() => console);
  
  return builder.use({
    async invoke(context: IHttpContext, next: RequestDelegate): Promise<void> {
      const start = Date.now();
      const requestLogger = logger(context);
      
      // Log the incoming request
      requestLogger.log(`[${new Date().toISOString()}] Request: ${context.request.method} ${context.request.path}`);
      
      try {
        // Execute the rest of the pipeline
        await next(context);
        
        // Log the completion
        const duration = Date.now() - start;
        requestLogger.log(
          `[${new Date().toISOString()}] Response: ${context.response.statusCode} (${duration}ms) - ${context.request.method} ${context.request.path}`
        );
      } catch (error) {
        // Log any errors
        const duration = Date.now() - start;
        requestLogger.error(
          `[${new Date().toISOString()}] ERROR: ${context.response.statusCode} (${duration}ms) - ${context.request.method} ${context.request.path}`,
          error
        );
        throw error;
      }
    }
  });
}

/**
 * Adds a middleware that executes different middleware based on the request path.
 * @param builder The application builder
 * @param pathMatch The path to match
 * @param configuration A function that configures the branch middleware
 */
export function useMap(
  builder: IApplicationBuilder,
  pathMatch: string,
  configuration: (branchBuilder: IApplicationBuilder) => void
): IApplicationBuilder {
  // Create a new branch builder
  const branchBuilder = builder.createBranch();
  
  // Configure the branch
  configuration(branchBuilder);
  
  // Build the branch
  const branch = branchBuilder.build();
  
  // Add the map middleware
  return builder.use(createMapMiddleware(pathMatch, branch));
}

/**
 * Adds a middleware that catches exceptions and converts them to appropriate responses.
 * @param builder The application builder
 * @param errorHandler Function that handles errors
 */
export function useExceptionHandler(
  builder: IApplicationBuilder,
  errorHandler?: (context: IHttpContext, error: Error) => Promise<void>
): IApplicationBuilder {
  return builder.use({
    async invoke(context: IHttpContext, next: RequestDelegate): Promise<void> {
      try {
        await next(context);
      } catch (error) {
        // Handle the error
        if (errorHandler) {
          await errorHandler(context, error as Error);
        } else {
          // Default error handler
          context.response.statusCode = 500;
          context.response.json({
            error: {
              message: 'An unexpected error occurred',
              status: 500,
              // Only include error details in development
              details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
              stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
            }
          });
        }
      }
    }
  });
}

/**
 * Adds a middleware that sets common security headers.
 * @param builder The application builder
 */
export function useSecurityHeaders(builder: IApplicationBuilder): IApplicationBuilder {
  return builder.use({
    async invoke(context: IHttpContext, next: RequestDelegate): Promise<void> {
      // Add security headers
      context.response.setHeader('X-Content-Type-Options', 'nosniff');
      context.response.setHeader('X-Frame-Options', 'DENY');
      context.response.setHeader('Content-Security-Policy', "default-src 'self'");
      context.response.setHeader('X-XSS-Protection', '1; mode=block');
      context.response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      await next(context);
    }
  });
}

/**
 * Options for CORS middleware
 */
export interface CorsOptions {
  allowOrigins?: string[];
  allowMethods?: string[];
  allowHeaders?: string[];
  allowCredentials?: boolean;
  maxAge?: number;
}

/**
 * Adds a middleware that sets CORS headers.
 * @param builder The application builder
 * @param options CORS options
 */
export function useCors(
  builder: IApplicationBuilder,
  options: CorsOptions = {}
): IApplicationBuilder {
  // Set default values
  const allowOrigins = options.allowOrigins || ['*'];
  const allowMethods = options.allowMethods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
  const allowHeaders = options.allowHeaders || ['Content-Type', 'Authorization'];
  const allowCredentials = options.allowCredentials || false;
  const maxAge = options.maxAge || 86400; // 24 hours
  
  return builder.use({
    async invoke(context: IHttpContext, next: RequestDelegate): Promise<void> {
      const origin = context.request.headers.origin;
      
      // Set CORS headers
      if (origin) {
        // Check if the origin is allowed
        let allowOrigin = '';
        if (allowOrigins.includes('*') || (typeof origin === 'string' && allowOrigins.includes(origin))) {
          allowOrigin = typeof origin === 'string' ? origin : '';
        }
          
        if (allowOrigin) {
          context.response.setHeader('Access-Control-Allow-Origin', allowOrigin);
          context.response.setHeader('Access-Control-Allow-Methods', allowMethods.join(', '));
          context.response.setHeader('Access-Control-Allow-Headers', allowHeaders.join(', '));
          
          if (allowCredentials) {
            context.response.setHeader('Access-Control-Allow-Credentials', 'true');
          }
          
          context.response.setHeader('Access-Control-Max-Age', maxAge.toString());
        }
      }
      
      // Handle preflight requests
      if (context.request.method === 'OPTIONS') {
        context.response.statusCode = 204;
        await context.response.send();
        return;
      }
      
      await next(context);
    }
  });
}

/**
 * Options for static files middleware
 */
export interface StaticFileOptions {
  defaultFile?: string;
  cacheControl?: string;
}

/**
 * Adds a middleware that serves static files from the specified directory.
 * @param builder The application builder
 * @param rootDirectory The root directory for static files
 * @param options Static file options
 */
export function useStaticFiles(
  builder: IApplicationBuilder,
  rootDirectory: string,
  options: StaticFileOptions = {}
): IApplicationBuilder {
  // TODO: Implement static file serving middleware
  // This would require file system access and path resolution
  // For now, just return a placeholder middleware
  return builder.use({
    async invoke(context: IHttpContext, next: RequestDelegate): Promise<void> {
      // Placeholder for static file middleware
      // In a real implementation, this would check if the requested path
      // corresponds to a file in the rootDirectory and serve it if it exists
      await next(context);
    }
  });
}

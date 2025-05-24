import { type IHttpContext } from "../http/http-context.js";
import { type NextFunction } from "../common/types.js";

/**
 * Configuration options for CORS middleware
 */
export interface CorsOptions {
  /**
   * Configures the Access-Control-Allow-Origin CORS header
   * 
   * Possible values:
   * - Boolean: true to reflect the request origin or false to disable CORS
   * - String: a single origin to allow
   * - Array: an array of allowed origins
   * - Function: a function that dynamically evaluates the origin
   * 
   * @default "*" (allows all origins)
   */
  origin?:
    | string
    | string[]
    | ((
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void
      ) => void)
    | true;

  /**
   * Configures the Access-Control-Allow-Methods CORS header
   * @default "GET,HEAD,PUT,PATCH,POST,DELETE"
   */
  methods?: string | string[];
  
  /**
   * Configures the Access-Control-Allow-Headers CORS header
   * @default "Content-Type,Authorization,X-Requested-With,Accept"
   */
  allowedHeaders?: string | string[];
  
  /**
   * Configures the Access-Control-Expose-Headers CORS header
   * @default undefined
   */
  exposedHeaders?: string | string[];
  
  /**
   * Configures the Access-Control-Allow-Credentials CORS header
   * @default false
   */
  credentials?: boolean;
  
  /**
   * Configures the Access-Control-Max-Age CORS header
   * @default undefined
   */
  maxAge?: number;
  
  /**
   * Pass the CORS preflight response to the next handler
   * @default false
   */
  preflightContinue?: boolean;
  
  /**
   * Provides a status code to use for successful OPTIONS requests
   * @default 204
   */
  optionsSuccessStatus?: number;
}

/**
 * Creates a CORS middleware for handling Cross-Origin Resource Sharing
 * 
 * @param options CORS configuration options
 * @returns Middleware function that handles CORS headers
 */
export function createCorsMiddleware(
  options?: CorsOptions
): (context: IHttpContext, next: NextFunction) => Promise<void> {
  // Default CORS options
  const defaults: CorsOptions = {
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization,X-Requested-With,Accept",
    optionsSuccessStatus: 204, // Some legacy browsers (IE11, various SmartTVs) choke on 204
  };

  const corsOptions = { ...defaults, ...options };

  /**
   * Helper function to normalize header values
   * @param value Header value(s) as string or array
   * @returns Comma-separated string of header values
   */
  const normalizeHeaderValue = (value: string | string[]): string => {
    return Array.isArray(value) ? value.join(",") : value;
  };

  /**
   * CORS middleware implementation
   */
  return async (context: IHttpContext, next: NextFunction): Promise<void> => {
    const { request, response } = context;
    const requestOrigin = request.headers["origin"] as string | undefined;
    let originHeader = "";

    // Handle Origin header based on configuration
    if (typeof corsOptions.origin === "boolean" && corsOptions.origin === true) {
      // Reflect request origin when true
      originHeader = requestOrigin || "*";
    } else if (typeof corsOptions.origin === "string") {
      // Use specific origin string
      originHeader = corsOptions.origin;
    } else if (Array.isArray(corsOptions.origin)) {
      // Check if request origin is in allowed list
      if (requestOrigin && corsOptions.origin.includes(requestOrigin)) {
        originHeader = requestOrigin;
      } else if (corsOptions.origin.includes("*")) {
        originHeader = "*";
      }
    } else if (typeof corsOptions.origin === "function") {
      // Handle function-based origin determination
      try {
        await new Promise<void>((resolve, reject) => {
          const originCallback = corsOptions.origin as (
            origin: string | undefined, 
            callback: (err: Error | null, allow?: boolean) => void
          ) => void;
          
          originCallback(requestOrigin, (err: Error | null, allow?: boolean) => {
            if (err) return reject(err);
            if (allow && requestOrigin) originHeader = requestOrigin;
            else if (allow) originHeader = "*";
            resolve();
          });
        });
      } catch (error) {
        // If origin function fails, default to safe behavior
        console.error("CORS origin function error:", error);
      }
    }

    // Set CORS headers
    if (originHeader) {
      response.setHeader("Access-Control-Allow-Origin", originHeader);
    }

    // Vary origin is important for caching with multiple origins
    if (originHeader !== "*") {
      response.setHeader("Vary", "Origin");
    }
    
    // Set credentials header if enabled
    if (corsOptions.credentials) {
      response.setHeader("Access-Control-Allow-Credentials", "true");
    }

    // Set exposed headers if provided
    if (corsOptions.exposedHeaders) {
      response.setHeader(
        "Access-Control-Expose-Headers",
        normalizeHeaderValue(corsOptions.exposedHeaders)
      );
    }

    // Handle preflight OPTIONS requests
    if (request.method === "OPTIONS") {
      // Set allowed methods
      if (corsOptions.methods) {
        response.setHeader(
          "Access-Control-Allow-Methods",
          normalizeHeaderValue(corsOptions.methods)
        );
      }
      
      // Set allowed headers
      if (corsOptions.allowedHeaders) {
        response.setHeader(
          "Access-Control-Allow-Headers",
          normalizeHeaderValue(corsOptions.allowedHeaders)
        );
      } else if (requestOrigin) {
        // If no allowed headers specified, mirror request headers
        const requestHeaders = request.headers["access-control-request-headers"];
        if (requestHeaders) {
          response.setHeader("Access-Control-Allow-Headers", requestHeaders);
          response.setHeader("Vary", "Access-Control-Request-Headers");
        }
      }
      
      // Set max age if provided
      if (corsOptions.maxAge !== undefined) {
        response.setHeader("Access-Control-Max-Age", String(corsOptions.maxAge));
      }

      // Handle preflight response
      if (corsOptions.preflightContinue) {
        return next();
      } else {
        response.statusCode = corsOptions.optionsSuccessStatus || 204;
        await response.send();
        return;
      }
    }

    // Continue with regular request handling
    await next();
  };
}

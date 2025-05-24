# Middleware

Middleware components in DOTS Core form a processing pipeline that handles HTTP requests and responses. Each middleware can inspect and modify the request and response objects, execute additional logic, and decide whether to pass control to the next middleware in the pipeline.

## Core Concepts

### Middleware Pipeline

The middleware pipeline in DOTS Core follows the same pattern as Express.js and ASP.NET Core:

1. Incoming request enters the pipeline
2. Middleware components process the request in order
3. After reaching the endpoint (controller action), the response flows back through the same middleware components in reverse order
4. Outgoing response leaves the pipeline

```
Client → [Middleware 1] → [Middleware 2] → [Route Handler] → [Middleware 2] → [Middleware 1] → Client
```

### Middleware Function

A middleware function in DOTS Core has the following signature:

```typescript
type Middleware = (
  context: IHttpContext,
  next: NextFunction
) => Promise<void>;
```

Where:
- `context` is the HTTP context containing the request and response
- `next` is a function that calls the next middleware in the pipeline

## Built-in Middleware

### CORS Middleware

The Cross-Origin Resource Sharing (CORS) middleware adds necessary headers to support cross-origin requests:

```typescript
// CORS middleware options
interface CorsOptions {
  /**
   * Configures the Access-Control-Allow-Origin CORS header
   */
  origin?: string | string[] | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void) | true;
  
  /**
   * Configures the Access-Control-Allow-Methods CORS header
   */
  methods?: string | string[];
  
  /**
   * Configures the Access-Control-Allow-Headers CORS header
   */
  allowedHeaders?: string | string[];
  
  /**
   * Configures the Access-Control-Expose-Headers CORS header
   */
  exposedHeaders?: string | string[];
  
  /**
   * Configures the Access-Control-Allow-Credentials CORS header
   */
  credentials?: boolean;
  
  /**
   * Configures the Access-Control-Max-Age CORS header
   */
  maxAge?: number;
  
  /**
   * Pass the CORS preflight response to the next handler
   */
  preflightContinue?: boolean;
  
  /**
   * Provides a status code to use for successful OPTIONS requests
   */
  optionsSuccessStatus?: number;
}

// Creating CORS middleware
const corsMiddleware = createCorsMiddleware({
  origin: ["http://localhost:3000", "https://example.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
});

// Adding CORS middleware to the pipeline
app.use(corsMiddleware);
```

### Body Parser Middleware

The body parser middleware parses the request body based on the Content-Type header:

```typescript
// Body parser options
interface BodyParserOptions {
  /**
   * Maximum request body size in bytes
   */
  limit?: number;
  
  /**
   * Enable JSON parsing
   */
  json?: boolean;
  
  /**
   * Enable URL-encoded form parsing
   */
  urlencoded?: boolean;
  
  /**
   * Enable multipart/form-data parsing
   */
  multipart?: boolean;
  
  /**
   * Enable text parsing
   */
  text?: boolean;
}

// Creating body parser middleware
const bodyParserMiddleware = createBodyParserMiddleware({
  limit: 1024 * 1024 * 10, // 10MB
  json: true,
  urlencoded: true
});

// Adding body parser middleware to the pipeline
app.use(bodyParserMiddleware);
```

### Authentication Middleware

The authentication middleware validates user credentials and attaches user information to the request:

```typescript
// Authentication options
interface AuthOptions {
  /**
   * Authentication schemes to support
   */
  schemes: string[];
  
  /**
   * Function to validate a token
   */
  validateToken: (token: string, scheme: string) => Promise<User | null>;
  
  /**
   * Whether to require authentication for all requests
   */
  requireAuth?: boolean;
}

// Creating authentication middleware
const authMiddleware = createAuthMiddleware({
  schemes: ["bearer"],
  validateToken: async (token, scheme) => {
    // Validate token and return user if valid
    return userService.validateToken(token, scheme);
  }
});

// Adding authentication middleware to the pipeline
app.use(authMiddleware);
```

## Creating Custom Middleware

You can create custom middleware functions to perform specific tasks:

### Logging Middleware Example

```typescript
// Creating a logging middleware
function createLoggingMiddleware(options?: LoggingOptions): Middleware {
  return async (context: IHttpContext, next: NextFunction): Promise<void> => {
    const logger = context.services.getRequiredService("ILogger");
    const { method, path } = context.request;
    
    logger.info(`Request: ${method} ${path}`);
    
    const start = Date.now();
    try {
      // Call the next middleware in the pipeline
      await next();
      
      const duration = Date.now() - start;
      logger.info(`Response: ${method} ${path} - ${context.response.statusCode} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`Error: ${method} ${path} - ${error.message} (${duration}ms)`, error);
      throw error;
    }
  };
}

// Adding the logging middleware to the pipeline
app.use(createLoggingMiddleware());
```

### Error Handling Middleware Example

```typescript
// Creating an error handling middleware
function createErrorHandlerMiddleware(options?: ErrorHandlerOptions): Middleware {
  return async (context: IHttpContext, next: NextFunction): Promise<void> => {
    try {
      // Call the next middleware in the pipeline
      await next();
    } catch (error) {
      const logger = context.services.getRequiredService("ILogger");
      logger.error("Unhandled error", error);
      
      // Set response status and content
      context.response.statusCode = error.statusCode || 500;
      await context.response.json({
        error: {
          message: options?.exposeErrors ? error.message : "An error occurred",
          code: error.code || "INTERNAL_ERROR"
        }
      });
    }
  };
}

// Adding the error handler middleware to the pipeline
// This should be one of the first middleware added so it catches all errors
app.use(createErrorHandlerMiddleware({
  exposeErrors: process.env.NODE_ENV !== "production"
}));
```

## Middleware Order

The order in which middleware is added to the pipeline is important:

1. **Error handling middleware** should be added first
2. **Logging middleware** should be added early in the pipeline
3. **Security middleware** (CORS, authentication) should be added before processing middleware
4. **Body parsing middleware** should be added before routing
5. **Routing middleware** should be added after preprocessing middleware
6. **Authorization middleware** should be added after routing but before endpoints

Example of a well-ordered middleware pipeline:

```typescript
// Configure middleware pipeline
hostBuilder.configure((app) => {
  // Error handling (first)
  app.use(createErrorHandlerMiddleware());
  
  // Logging (early)
  app.use(createLoggingMiddleware());
  
  // Security (before processing)
  app.use(createCorsMiddleware());
  app.use(createHelmetMiddleware());
  
  // Body parsing (before routing)
  app.use(createBodyParserMiddleware());
  
  // Authentication (before routing)
  app.use(createAuthMiddleware());
  
  // Routing (middle)
  app.useRouting();
  
  // Authorization (after routing, before endpoints)
  app.use(createAuthorizationMiddleware());
  
  // Endpoints (last)
  app.useEndpoints((endpoints) => {
    endpoints.mapControllers();
  });
  
  return true;
});
```

## Best Practices

1. **Keep middleware focused** - Each middleware should have a single responsibility
2. **Order middleware correctly** - Consider the order of execution when adding middleware
3. **Use middleware factories** - Create factory functions that return middleware with specific configurations
4. **Handle errors properly** - Add error handling middleware early in the pipeline
5. **Pass control properly** - Always call `next()` unless you want to short-circuit the pipeline
6. **Be mindful of async/await** - All middleware should be async functions or return Promises
7. **Consider performance** - Keep middleware lightweight and efficient
8. **Use middleware for cross-cutting concerns** - Logging, error handling, authentication, etc.
9. **Test middleware independently** - Write unit tests for middleware functions

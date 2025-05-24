# API Reference

This document provides a reference for the key interfaces, classes, and types in the DOTS Core framework.

## Common Types

```typescript
/**
 * Represents a class constructor type with optional type parameter
 */
type Constructor<T = any> = new (...args: any[]) => T;

/**
 * Represents a generic function type with specified arguments and return type
 */
type Func<TArgs extends any[], TResult> = (...args: TArgs) => TResult;

/**
 * Represents an asynchronous function that continues the middleware pipeline
 */
type NextFunction = () => Promise<void>;

/**
 * Represents an HTTP middleware function that processes a request/response context
 */
type Middleware = (
  context: IHttpContext,
  next: NextFunction
) => Promise<void>;

/**
 * Represents a type that can be either a value or a Promise of that value
 */
type MaybePromise<T> = T | Promise<T>;

/**
 * Extracts the return type of a function, unwrapping promises if necessary
 */
type UnwrappedReturnType<T extends (...args: any[]) => any> = T extends (...args: any[]) => Promise<infer R> ? R : ReturnType<T>;

/**
 * Represents a Dictionary/Record type with string keys and values of type T
 */
type Dictionary<T = any> = Record<string, T>;

/**
 * Makes all properties in T optional and nullable
 */
type Nullable<T> = { [P in keyof T]?: T[P] | null };

/**
 * Type for objects with any string keys
 */
type AnyObject = { [key: string]: any };

/**
 * Type for simple primitive types
 */
type Primitive = string | number | boolean | bigint | symbol | null | undefined;
```

## Hosting

### IHost

```typescript
/**
 * Represents a configured application host that can be started and stopped
 */
interface IHost {
  /**
   * Root service provider for resolving application services
   */
  readonly services: IServiceProvider;
  
  /**
   * Information about the host environment
   */
  readonly info: HostInfo;
  
  /**
   * Starts the host and begins handling requests
   */
  start(): Promise<void>;
  
  /**
   * Stops the host and releases resources
   */
  stop(): Promise<void>;
}
```

### HostInfo

```typescript
/**
 * Information about the host environment
 */
interface HostInfo {
  /**
   * The environment the host is running in (development, production, etc.)
   */
  environment: string;
  
  /**
   * The host port
   */
  port: number;
  
  /**
   * The host address
   */
  address?: string;
  
  /**
   * Host startup timestamp
   */
  startedAt?: Date;
}
```

### IHostBuilder

```typescript
/**
 * Builder for creating and configuring an IHost
 */
interface IHostBuilder {
  /**
   * Configure services for the application
   */
  configureServices(configureServices: (services: IServiceCollection) => void): this;
  
  /**
   * Configure the application's request processing pipeline
   */
  configure(configure: (app: IApplicationBuilder) => boolean): this;
  
  /**
   * Add a hosted service that starts and stops with the application
   */
  addHostedService<T>(serviceType: Constructor<T>): this;
  
  /**
   * Use a specific configuration source
   */
  useConfiguration(configuration: IConfiguration): this;
  
  /**
   * Build the configured host
   */
  build(): IHost;
}
```

### IHostedService

```typescript
/**
 * Represents a long-running service that starts and stops with the application
 */
interface IHostedService {
  /**
   * Start the service
   */
  start(): Promise<void>;
  
  /**
   * Stop the service
   */
  stop(): Promise<void>;
}
```

## Dependency Injection

### IServiceCollection

```typescript
/**
 * Collection of service descriptors used to build a service provider
 */
interface IServiceCollection {
  /**
   * Register a singleton service
   */
  addSingleton(serviceType: symbol | string, implementationType: Constructor): this;
  addSingleton(serviceType: symbol | string, implementationFactory: (provider: IServiceProvider) => any): this;
  addSingleton(serviceType: symbol | string, implementationInstance: any): this;
  
  /**
   * Register a scoped service
   */
  addScoped(serviceType: symbol | string, implementationType: Constructor): this;
  addScoped(serviceType: symbol | string, implementationFactory: (provider: IServiceProvider) => any): this;
  
  /**
   * Register a transient service
   */
  addTransient(serviceType: symbol | string, implementationType: Constructor): this;
  addTransient(serviceType: symbol | string, implementationFactory: (provider: IServiceProvider) => any): this;
  
  /**
   * Try adding a service if it hasn't been registered already
   */
  tryAdd(descriptor: ServiceDescriptor): boolean;
  
  /**
   * Add a hosted service
   */
  addHostedService<T>(serviceType: Constructor<T>): this;
  
  /**
   * Build a service provider from the registered services
   */
  buildServiceProvider(): IServiceProvider;
}
```

### IServiceProvider

```typescript
/**
 * Provider for resolving services
 */
interface IServiceProvider {
  /**
   * Get a service of the specified type
   */
  getService<T = any>(serviceType: symbol | string): T | null;
  
  /**
   * Get a service of the specified type, throwing an error if not found
   */
  getRequiredService<T = any>(serviceType: symbol | string): T;
  
  /**
   * Create a new scope for scoped services
   */
  createScope(): IServiceScope;
}
```

## HTTP

### IHttpContext

```typescript
/**
 * Represents the context for an HTTP request/response cycle
 */
interface IHttpContext {
  /**
   * The HTTP request being processed
   */
  readonly request: IHttpRequest;
  
  /**
   * The HTTP response being generated
   */
  readonly response: IHttpResponse;
  
  /**
   * The request-scoped service provider
   */
  readonly services: IServiceProvider;
  
  /**
   * Optional access to the underlying web framework's context
   */
  readonly honoContext?: any;
}
```

### IHttpRequest

```typescript
/**
 * Interface representing an HTTP request
 */
interface IHttpRequest {
  /**
   * The parsed request body
   */
  body?: any;
  
  /**
   * HTTP headers with case-insensitive access
   */
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
  
  /**
   * HTTP method (GET, POST, etc.)
   */
  readonly method: HttpMethod;
  
  /**
   * Request path without query string
   */
  readonly path: string;
  
  /**
   * Query parameters parsed from the URL
   */
  readonly query: Readonly<Record<string, string | string[] | undefined>>;
  
  /**
   * Route parameters extracted from the URL path
   */
  readonly params: Readonly<Record<string, string>>;
  
  /**
   * The underlying framework's raw request object
   */
  readonly raw: any;
}
```

### IHttpResponse

```typescript
/**
 * Interface representing an HTTP response
 */
interface IHttpResponse {
  /**
   * HTTP status code
   */
  statusCode: number;
  
  /**
   * HTTP headers
   */
  readonly headers: Record<string, string | string[]>;
  
  /**
   * Set a response header
   */
  setHeader(name: string, value: string | string[]): void;
  
  /**
   * Send a response with optional body
   */
  send(body?: any): Promise<void>;
  
  /**
   * Send a JSON response
   */
  json(data: any): Promise<void>;
  
  /**
   * Send a text response
   */
  text(text: string): Promise<void>;
  
  /**
   * Send a HTML response
   */
  html(html: string): Promise<void>;
  
  /**
   * Redirect to another URL
   */
  redirect(url: string, statusCode?: number): Promise<void>;
}
```

## Logging

### LogLevel

```typescript
/**
 * Log levels enumeration
 */
enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly'
}
```

### ILogger

```typescript
/**
 * Interface for application logging
 */
interface ILogger {
  /**
   * Log informational message
   */
  info(message: string, ...meta: any[]): void;
  
  /**
   * Log warning message
   */
  warn(message: string, ...meta: any[]): void;
  
  /**
   * Log error message
   */
  error(message: string | Error, ...meta: any[]): void;
  
  /**
   * Log debug message
   */
  debug(message: string, ...meta: any[]): void;
  
  /**
   * Log message with custom level
   */
  log(level: string, message: string, ...meta: any[]): void;
  
  /**
   * Log HTTP request details
   */
  http?(message: string, ...meta: any[]): void;
  
  /**
   * Log verbose details
   */
  verbose?(message: string, ...meta: any[]): void;
  
  /**
   * Log detailed diagnostic information
   */
  silly?(message: string, ...meta: any[]): void;
}
```

## MVC

### IActionResult

```typescript
/**
 * Represents the result of a controller action
 */
interface IActionResult {
  /**
   * Execute the result and write to the HTTP response
   */
  executeAsync(context: IHttpContext): Promise<void>;
}
```

### Controller Decorators

```typescript
/**
 * Mark a class as a controller with an optional route prefix
 */
function Controller(routePrefix?: string): ClassDecorator;

/**
 * Mark a method as handling HTTP GET requests
 */
function Get(route?: string): MethodDecorator;

/**
 * Mark a method as handling HTTP POST requests
 */
function Post(route?: string): MethodDecorator;

/**
 * Mark a method as handling HTTP PUT requests
 */
function Put(route?: string): MethodDecorator;

/**
 * Mark a method as handling HTTP DELETE requests
 */
function Delete(route?: string): MethodDecorator;

/**
 * Mark a parameter as coming from the request body
 */
function FromBody(): ParameterDecorator;

/**
 * Mark a parameter as coming from the route parameters
 */
function FromRoute(paramName?: string): ParameterDecorator;

/**
 * Mark a parameter as coming from the query string
 */
function FromQuery(paramName?: string): ParameterDecorator;
```

## Database

### IMongoConnectionService

```typescript
/**
 * Service for managing MongoDB connections
 */
interface IMongoConnectionService {
  /**
   * Connects to MongoDB using the provided options
   */
  connect(): Promise<void>;
  
  /**
   * Disconnects from MongoDB
   */
  disconnect(): Promise<void>;
  
  /**
   * Gets the current Mongoose instance
   */
  getMongooseInstance(): typeof mongoose | undefined;
}
```

### MongoConnectionOptions

```typescript
/**
 * Options for connecting to MongoDB
 */
interface MongoConnectionOptions {
  /**
   * MongoDB connection URI
   */
  uri: string;
  
  /**
   * Mongoose connection options
   */
  options?: mongoose.ConnectOptions;
}
```

## Configuration

### IConfiguration

```typescript
/**
 * Interface for accessing application configuration
 */
interface IConfiguration {
  /**
   * Get a configuration value by key
   */
  get<T = any>(key: string, defaultValue?: T): T;
  
  /**
   * Set a configuration value
   */
  set(key: string, value: any): void;
  
  /**
   * Check if a configuration key exists
   */
  has(key: string): boolean;
  
  /**
   * Get all configuration as a nested object
   */
  getAll(): Record<string, any>;
}
```

### IConfigurationSource

```typescript
/**
 * Interface for a configuration source
 */
interface IConfigurationSource {
  /**
   * Load configuration values from the source
   */
  load(): Promise<Record<string, any>>;
}
```

## Health Checks

### IHealthCheck

```typescript
/**
 * Interface for a health check
 */
interface IHealthCheck {
  /**
   * Name of the health check
   */
  readonly name: string;
  
  /**
   * Check the health of a component
   */
  checkHealth(): Promise<HealthCheckResult>;
}
```

### HealthCheckResult

```typescript
/**
 * Result of a health check
 */
interface HealthCheckResult {
  /**
   * Status of the health check
   */
  status: HealthStatus;
  
  /**
   * Description of the health check result
   */
  description?: string;
  
  /**
   * Additional data about the health check
   */
  data?: Record<string, any>;
}
```

### HealthStatus

```typescript
/**
 * Possible health statuses
 */
enum HealthStatus {
  Healthy = "Healthy",
  Degraded = "Degraded",
  Unhealthy = "Unhealthy"
}
```

This API reference covers the key interfaces, classes, and types in the DOTS Core framework. For more detailed information, refer to the component-specific documentation.

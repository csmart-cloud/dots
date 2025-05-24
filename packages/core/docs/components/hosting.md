# Hosting

The hosting system in DOTS Core provides a structured way to build, configure, and run applications. It handles application lifecycle, dependency management, and environment integration.

## Key Components

### IHost

The `IHost` interface represents a configured application host that can be started and stopped.

```typescript
interface IHost {
  // Root service provider for resolving application services
  readonly services: IServiceProvider;
  
  // Information about the host environment
  readonly info: HostInfo;
  
  // Starts the host and begins handling requests
  start(): Promise<void>;
  
  // Stops the host and releases resources
  stop(): Promise<void>;
}
```

### HostInfo

The `HostInfo` interface provides information about the host environment:

```typescript
interface HostInfo {
  // The environment the host is running in (development, production, etc.)
  environment: string;
  
  // The host port
  port: number;
  
  // The host address (optional)
  address?: string;
  
  // Host startup timestamp (optional)
  startedAt?: Date;
}
```

### DefaultHostBuilder

The `DefaultHostBuilder` class allows you to configure and build an application host:

```typescript
class DefaultHostBuilder implements IHostBuilder {
  // Configure services using a callback function
  configureServices(configureServices: (services: IServiceCollection) => void): this;
  
  // Configure the application's request processing pipeline
  configure(configure: (app: IApplicationBuilder) => boolean): this;
  
  // Add a hosted service that starts and stops with the application
  addHostedService<T>(serviceType: Constructor<T>): this;
  
  // Use a specific configuration source
  useConfiguration(configuration: IConfiguration): this;
  
  // Build the configured host
  build(): IHost;
}
```

## Hosted Services

Hosted services are components that have their own lifecycle within the application, starting when the host starts and stopping when the host stops. They are useful for background tasks, resource management, and long-running operations.

### IHostedService

```typescript
interface IHostedService {
  start(): Promise<void>;
  stop(): Promise<void>;
}
```

### Example: Database Connection Service

```typescript
class MongoDbHostedService implements IHostedService {
  constructor(private mongoService: IMongoConnectionService) {}
  
  async start() {
    // Connect to the database when the application starts
    await this.mongoService.connect();
  }
  
  async stop() {
    // Disconnect from the database when the application stops
    await this.mongoService.disconnect();
  }
}
```

## Application Startup

The `IStartup` interface defines the application's configuration and service registration logic:

```typescript
interface IStartup {
  // Configure the application's services
  configureServices(services: IServiceCollection): void;
  
  // Configure the application's request processing pipeline
  configure(app: IApplicationBuilder): boolean;
}
```

## Example: Building and Running a Host

```typescript
// Create a host builder
const hostBuilder = new DefaultHostBuilder();

// Configure services
hostBuilder.configureServices((services) => {
  // Add logging
  services.addSingleton("ILogger", createAppLogger());
  
  // Add MongoDB connection
  services.addSingleton("IMongoConnectionService", createMongoConnectionService({
    uri: "mongodb://localhost:27017/myapp"
  }));
  
  // Add hosted services
  services.addHostedService(MongoDbHostedService);
});

// Configure middleware pipeline
hostBuilder.configure((app) => {
  // Add middleware
  app.use(createCorsMiddleware());
  app.use(createBodyParserMiddleware());
  
  // Add routing
  app.useRouting();
  app.useEndpoints((endpoints) => {
    endpoints.mapControllers();
  });
  
  return true;
});

// Build and start the host
const host = hostBuilder.build();
host.start()
  .then(() => {
    console.log(`Server started at ${host.info.address}:${host.info.port}`);
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
  });

// Handle shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await host.stop();
  process.exit(0);
});
```

## Environment Integration

The hosting system integrates with the environment through:

- Environment variables
- Command-line arguments
- Configuration files
- External service discovery

This allows applications to adapt to different deployment environments (development, staging, production) without code changes.

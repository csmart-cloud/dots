# Getting Started with DOTS Core

## Installation

```bash
npm install @csmart-cloud/dots-core
```

## Creating a Basic Application

Here's a simple example of how to create and start a DOTS Core application:

```typescript
import { 
  DefaultHostBuilder, 
  createCorsMiddleware,
  createAppLogger
} from "@csmart-cloud/dots-core";

// Create a host builder
const hostBuilder = new DefaultHostBuilder();

// Configure services
hostBuilder.configureServices((services) => {
  // Add logging
  services.addSingleton("ILogger", createAppLogger());
  
  // Add other services
  services.addScoped("IUserService", UserService);
});

// Configure middleware pipeline
hostBuilder.configure((app) => {
  // Add CORS middleware
  app.use(createCorsMiddleware({
    origin: ["http://localhost:3000"],
    credentials: true
  }));
  
  // Add routing middleware
  app.useRouting();
  
  // Configure endpoints
  app.useEndpoints((endpoints) => {
    endpoints.mapControllers();
  });
  
  return true; // Controllers are valid
});

// Build and start the host
const host = hostBuilder.build();
host.start()
  .then(() => {
    console.log(`Server started on ${host.info.address}:${host.info.port}`);
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
  });
```

## Creating a Controller

```typescript
import { Controller, Get, Post, FromBody, FromQuery, IActionResult } from "@csmart-cloud/dots-core";

@Controller("api/users")
export class UserController {
  constructor(private userService: IUserService) {}
  
  @Get()
  async getUsers(@FromQuery() filter: string): Promise<IActionResult> {
    const users = await this.userService.getUsers(filter);
    return this.ok(users);
  }
  
  @Get("{id}")
  async getUserById(id: string): Promise<IActionResult> {
    const user = await this.userService.getUserById(id);
    if (!user) {
      return this.notFound();
    }
    return this.ok(user);
  }
  
  @Post()
  async createUser(@FromBody() user: User): Promise<IActionResult> {
    const newUser = await this.userService.createUser(user);
    return this.created(`/api/users/${newUser.id}`, newUser);
  }
}
```

## Configuration

```typescript
import { ConfigurationBuilder, EnvironmentVariablesSource, JsonFileSource } from "@csmart-cloud/dots-core";

// Create a configuration builder
const configBuilder = new ConfigurationBuilder();

// Add configuration sources
configBuilder
  .add(new JsonFileSource("appsettings.json"))
  .add(new JsonFileSource(`appsettings.${env}.json`))
  .add(new EnvironmentVariablesSource());

// Build the configuration
const config = configBuilder.build();

// Use the configuration
const port = config.get("server:port", 3000);
const mongoUri = config.get("database:mongoUri");

// Add configuration to the host
hostBuilder.useConfiguration(config);
```

## MongoDB Integration

```typescript
import { MongoConnectionService, IMongoConnectionService } from "@csmart-cloud/dots-core";

// Configure MongoDB in the host builder
hostBuilder.configureServices((services) => {
  // Register MongoDB connection service
  services.addSingleton("IMongoConnectionService", (provider) => {
    const config = provider.getRequiredService("IConfiguration");
    return new MongoConnectionService({
      uri: config.get("database:mongoUri"),
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    });
  });
  
  // Add MongoDB connection as a hosted service
  services.addHostedService(MongoDbHostedService);
});

// Create a hosted service to manage MongoDB connection lifecycle
class MongoDbHostedService {
  constructor(private mongoService: IMongoConnectionService) {}
  
  async start() {
    await this.mongoService.connect();
  }
  
  async stop() {
    await this.mongoService.disconnect();
  }
}
```

## Adding Middleware

```typescript
import { createCorsMiddleware, createBodyParserMiddleware, createAuthMiddleware } from "@csmart-cloud/dots-core";

hostBuilder.configure((app) => {
  // Add logging middleware
  app.use(async (context, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    const logger = context.services.getRequiredService("ILogger");
    logger.info(`${context.request.method} ${context.request.path} - ${ms}ms`);
  });
  
  // Add CORS middleware
  app.use(createCorsMiddleware());
  
  // Add body parser middleware
  app.use(createBodyParserMiddleware());
  
  // Add authentication middleware
  app.use(createAuthMiddleware({
    schemes: ["bearer"],
    validateToken: async (token) => {
      // Token validation logic
    }
  }));
  
  // Use routing
  app.useRouting();
  
  // Add authorization middleware (after routing)
  app.use(createAuthorizationMiddleware());
  
  // Configure endpoints
  app.useEndpoints((endpoints) => {
    endpoints.mapControllers();
  });
  
  return true;
});
```

This should help you get started with the DOTS Core framework. For more detailed information, check the component-specific documentation.

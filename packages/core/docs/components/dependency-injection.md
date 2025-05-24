# Dependency Injection

The Dependency Injection (DI) system in DOTS Core provides a structured approach to managing dependencies between components, making your application more modular, testable, and maintainable.

## Core Concepts

### Service Registration

Services are registered with the DI container during application startup, specifying their lifetime and implementation:

```typescript
// In the host builder or startup configuration
hostBuilder.configureServices((services) => {
  // Register services
  services.addSingleton("ILogger", WinstonLogger);
  services.addScoped("IUserRepository", MongoUserRepository);
  services.addTransient("IEmailService", SmtpEmailService);
});
```

### Service Resolution

Services are resolved from the DI container at runtime:

```typescript
// In a controller or service
constructor(private services: IServiceProvider) {
  const logger = services.getRequiredService("ILogger");
  logger.info("Service initialized");
}
```

### Service Lifetimes

- **Singleton** - A single instance is created and shared throughout the application's lifetime
- **Scoped** - A new instance is created for each request/scope
- **Transient** - A new instance is created each time the service is requested

## Key Components

### IServiceCollection

The `IServiceCollection` interface is used to register services during application startup:

```typescript
interface IServiceCollection {
  // Register a singleton service
  addSingleton(serviceType: symbol | string, implementationType: Constructor): this;
  addSingleton(serviceType: symbol | string, implementationFactory: (provider: IServiceProvider) => any): this;
  addSingleton(serviceType: symbol | string, implementationInstance: any): this;
  
  // Register a scoped service
  addScoped(serviceType: symbol | string, implementationType: Constructor): this;
  addScoped(serviceType: symbol | string, implementationFactory: (provider: IServiceProvider) => any): this;
  
  // Register a transient service
  addTransient(serviceType: symbol | string, implementationType: Constructor): this;
  addTransient(serviceType: symbol | string, implementationFactory: (provider: IServiceProvider) => any): this;
  
  // Try adding a service if it hasn't been registered already
  tryAdd(descriptor: ServiceDescriptor): boolean;
  
  // Add a hosted service
  addHostedService<T>(serviceType: Constructor<T>): this;
  
  // Build a service provider from the registered services
  buildServiceProvider(): IServiceProvider;
}
```

### IServiceProvider

The `IServiceProvider` interface is used to resolve services at runtime:

```typescript
interface IServiceProvider {
  // Get a service of the specified type
  getService<T = any>(serviceType: symbol | string): T | null;
  
  // Get a service of the specified type, throwing an error if not found
  getRequiredService<T = any>(serviceType: symbol | string): T;
  
  // Create a new scope for scoped services
  createScope(): IServiceScope;
}
```

### IServiceScope

The `IServiceScope` interface represents a scope for scoped services:

```typescript
interface IServiceScope {
  // Service provider for this scope
  readonly serviceProvider: IServiceProvider;
  
  // Dispose the scope and release resources
  dispose(): void;
}
```

## Decorators

DOTS Core provides decorators for dependency injection:

### @Injectable

Marks a class as injectable, automatically registering its dependencies:

```typescript
@Injectable()
export class UserService {
  constructor(
    @Inject("IUserRepository") private userRepository: IUserRepository,
    @Inject("ILogger") private logger: ILogger
  ) {}
  
  async getUsers(): Promise<User[]> {
    this.logger.info("Getting all users");
    return this.userRepository.findAll();
  }
}
```

### @Inject

Specifies the dependency to inject into a constructor parameter:

```typescript
constructor(
  @Inject("IUserRepository") private userRepository: IUserRepository
) {}
```

## Examples

### Basic Service Registration

```typescript
// Register services
services.addSingleton("ILogger", WinstonLogger);
services.addScoped("IUserRepository", MongoUserRepository);
services.addTransient("IEmailService", SmtpEmailService);

// Register a singleton instance
const config = new Configuration();
services.addSingleton("IConfiguration", config);

// Register with a factory function
services.addSingleton("IDatabase", (provider) => {
  const config = provider.getRequiredService("IConfiguration");
  return new Database(config.get("connectionString"));
});
```

### Controller with Injected Dependencies

```typescript
@Controller("api/users")
export class UserController {
  constructor(
    @Inject("IUserService") private userService: IUserService,
    @Inject("ILogger") private logger: ILogger
  ) {}
  
  @Get()
  async getUsers(): Promise<IActionResult> {
    this.logger.info("Processing request to get all users");
    const users = await this.userService.getUsers();
    return this.ok(users);
  }
}
```

### Creating a Scope

```typescript
// Create a scope for a request
const scope = serviceProvider.createScope();
try {
  const requestServices = scope.serviceProvider;
  const userService = requestServices.getRequiredService("IUserService");
  await userService.processRequest();
} finally {
  scope.dispose();
}
```

## Best Practices

1. **Use interfaces** for service registration to make implementations interchangeable
2. **Choose the appropriate lifetime** for each service:
   - Singleton for stateless services that can be shared
   - Scoped for services that need request-specific state
   - Transient for services that should be created anew each time
3. **Avoid circular dependencies** between services
4. **Register services early** in the application lifecycle
5. **Dispose services properly** when they implement IDisposable
6. **Use factory functions** for services with complex initialization requirements
7. **Keep services focused** on a single responsibility

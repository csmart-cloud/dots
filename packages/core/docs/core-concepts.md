# Core Concepts

## Hosting

The DOTS Core framework uses a hosting model similar to ASP.NET Core, where applications are built and run using a host. The host is responsible for application startup and lifetime management, as well as setting up the services required by the application.

### Host Lifecycle

1. **Building** - Configure services, middleware, and routing
2. **Starting** - Initialize services and begin accepting requests
3. **Running** - Process requests and execute application logic
4. **Stopping** - Gracefully shut down the application and dispose of resources

## Dependency Injection

The framework implements a robust dependency injection (DI) system that manages the creation and lifetime of services used by your application.

### Service Lifetimes

- **Singleton** - Created once and shared throughout the application
- **Scoped** - Created once per request/scope
- **Transient** - Created each time they are requested

### Registration Patterns

```typescript
// Service registration
services.addSingleton(ILogger, WinstonLogger);
services.addScoped(IRepository, MongoRepository);
services.addTransient(IEmailSender, SmtpEmailSender);

// Instance registration
services.addSingleton(IConfiguration, configInstance);

// Factory registration
services.addSingleton(IDatabase, (provider) => {
  const config = provider.getRequiredService(IConfiguration);
  return new Database(config.get("connectionString"));
});
```

## Middleware

Middleware components form a pipeline that handles HTTP requests and responses. Each middleware can:

1. Process an incoming request
2. Produce an outgoing response
3. Call the next middleware in the pipeline
4. Perform operations after the next middleware completes

### Middleware Pipeline

```
Client → [Middleware 1] → [Middleware 2] → [Route Handler] → [Middleware 2] → [Middleware 1] → Client
```

## Controllers and Routing

The MVC pattern is implemented through controllers, which are classes containing methods (actions) that handle requests.

### Route Matching

Routes define URL patterns that map to controller actions. Routes can include:

- Fixed segments (`/api/users`)
- Parameter segments (`/api/users/{id}`)
- Optional segments (`/api/users/{id?}`)
- Constraint segments (`/api/users/{id:int}`)

### Controller Actions

Actions are methods within controllers that process requests and return results:

```typescript
@Controller("api/users")
class UsersController {
  @Get("{id}")
  async getUser(id: string): Promise<IActionResult> {
    // ...handle request
    return this.ok(user);
  }
  
  @Post()
  async createUser(@FromBody() user: User): Promise<IActionResult> {
    // ...handle request
    return this.created(`/api/users/${userId}`, newUser);
  }
}
```

## Configuration

The configuration system allows for loading application settings from various sources, including:

- Environment variables
- JSON files
- Command-line arguments
- In-memory collections

Configuration values are accessed through a strongly-typed options pattern, allowing for validation and default values.

## Logging

The logging system provides a consistent way to record application events, errors, and diagnostic information. It supports multiple output targets and log levels.

## Database Integration

The framework provides abstractions for database operations, with built-in support for MongoDB through Mongoose.

## Health Checks

Health checks monitor the status of application dependencies and report on the overall health of the system, which is useful for container orchestration and monitoring systems.

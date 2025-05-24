# Logging

The logging system in DOTS Core provides a standardized way to record application events, errors, and diagnostic information. It is designed to be flexible, configurable, and integrate with various logging backends.

## Core Components

### LogLevel

The `LogLevel` enum defines the available logging levels, ordered from most severe to least severe:

```typescript
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

The `ILogger` interface defines the methods for logging messages at different levels:

```typescript
interface ILogger {
  /**
   * Log informational message
   * @param message Message to log
   * @param meta Additional data to include in the log
   */
  info(message: string, ...meta: any[]): void;
  
  /**
   * Log warning message
   * @param message Message to log
   * @param meta Additional data to include in the log
   */
  warn(message: string, ...meta: any[]): void;
  
  /**
   * Log error message
   * @param message Error message or Error object
   * @param meta Additional data to include in the log
   */
  error(message: string | Error, ...meta: any[]): void;
  
  /**
   * Log debug message
   * @param message Message to log
   * @param meta Additional data to include in the log
   */
  debug(message: string, ...meta: any[]): void;
  
  /**
   * Log message with custom level
   * @param level Log level
   * @param message Message to log
   * @param meta Additional data to include in the log
   */
  log(level: string, message: string, ...meta: any[]): void;
  
  /**
   * Log HTTP request details
   * @param message HTTP request information
   * @param meta Additional request details
   */
  http?(message: string, ...meta: any[]): void;
  
  /**
   * Log verbose details
   * @param message Verbose information
   * @param meta Additional details
   */
  verbose?(message: string, ...meta: any[]): void;
  
  /**
   * Log detailed diagnostic information
   * @param message Detailed diagnostic information
   * @param meta Additional diagnostics
   */
  silly?(message: string, ...meta: any[]): void;
}
```

## Winston Integration

DOTS Core provides built-in integration with Winston, a popular logging library for Node.js.

### LoggerOptions

The `LoggerOptions` interface defines configuration options for the Winston logger:

```typescript
interface LoggerOptions {
  /**
   * Minimum log level to record (e.g., 'info', 'debug', 'error')
   * @default 'info'
   */
  level?: string;
  
  /**
   * Directory where log files are stored
   * @default 'logs'
   */
  logDir?: string;
  
  /**
   * Pattern for log filenames, e.g. '%DATE%.txt'
   * The %DATE% placeholder will be replaced by the pattern specified in datePattern
   * @default '%DATE%.txt'
   */
  filenamePattern?: string;
  
  /**
   * Date pattern for organizing log files and directories
   * @default 'YYYYMMDD/HH_mm'
   */
  datePattern?: string;
  
  /**
   * Whether to compress archived log files
   * @default true
   */
  zippedArchive?: boolean;
  
  /**
   * Maximum size of each log file before rotation
   * @default '20m'
   */
  maxSize?: string;
  
  /**
   * Maximum number of log files to keep
   * @default '14d'
   */
  maxFiles?: string;
  
  /**
   * Log level for console output (can be different from file logging level)
   * @default 'debug'
   */
  consoleLogLevel?: string;
  
  /**
   * Whether to format logs as JSON
   * @default false
   */
  jsonFormat?: boolean;
}
```

### Creating a Logger

The `createAppLogger` function creates a configured logger instance:

```typescript
// Create a logger with default options
const logger = createAppLogger();

// Create a logger with custom options
const logger = createAppLogger({
  level: LogLevel.DEBUG,
  logDir: 'app-logs',
  datePattern: 'YYYY-MM-DD',
  consoleLogLevel: LogLevel.INFO,
  jsonFormat: true
});
```

## Integration with Dependency Injection

Logging is integrated with the DOTS Core dependency injection system:

```typescript
// Register logger service
hostBuilder.configureServices((services) => {
  services.addSingleton("ILogger", createAppLogger({
    level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG
  }));
});

// Use logger in a service or controller
class UserService {
  constructor(@Inject("ILogger") private logger: ILogger) {}
  
  async getUsers(): Promise<User[]> {
    this.logger.info("Fetching users");
    try {
      const users = await this.userRepository.findAll();
      this.logger.debug(`Found ${users.length} users`);
      return users;
    } catch (error) {
      this.logger.error("Failed to fetch users", error);
      throw error;
    }
  }
}
```

## Logging Middleware

DOTS Core includes middleware for logging HTTP requests:

```typescript
// Add request logging middleware
app.use(async (context, next) => {
  const logger = context.services.getRequiredService("ILogger");
  const { method, path } = context.request;
  
  logger.info(`Request: ${method} ${path}`);
  
  const start = Date.now();
  try {
    await next();
    const duration = Date.now() - start;
    logger.info(`Response: ${method} ${path} - ${context.response.statusCode} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`Error: ${method} ${path} - ${error.message} (${duration}ms)`, error);
    throw error;
  }
});
```

## Log File Management

DOTS Core supports log file rotation and management through Winston's DailyRotateFile transport:

- Log files are organized by date
- Files can be automatically compressed
- Old log files can be automatically deleted
- Maximum file size can be specified

Example log directory structure:
```
logs/
  20250520/
    08_00.txt
    09_00.txt
    10_00.txt
  20250521/
    08_00.txt
    09_00.txt
    10_00.txt
```

## Structured Logging

The logging system supports structured logging with metadata:

```typescript
// Log with metadata
logger.info("User created", { userId: "123", username: "johndoe" });

// Log error with details
try {
  // Some operation that might fail
} catch (error) {
  logger.error("Operation failed", {
    operation: "createUser",
    params: { username: "johndoe", email: "john@example.com" },
    error
  });
}
```

## Configuration

Logging configuration can be managed through the application's configuration system:

```typescript
// Configuration in appsettings.json
{
  "logging": {
    "level": "info",
    "consoleLogLevel": "debug",
    "logDir": "logs",
    "datePattern": "YYYYMMDD/HH_mm",
    "maxSize": "20m",
    "maxFiles": "14d",
    "jsonFormat": false
  }
}

// Using the configuration
const config = provider.getRequiredService("IConfiguration");
const logger = createAppLogger(config.get("logging"));
```

## Best Practices

1. **Use appropriate log levels** - Reserve ERROR for exceptional conditions, INFO for significant events, and DEBUG for detailed diagnostic information
2. **Include context in logs** - Add relevant metadata to logs to make them more useful for debugging
3. **Log structured data** - Use objects for metadata rather than concatenating strings
4. **Log at application boundaries** - Log incoming requests, outgoing responses, and integration points
5. **Log sensitive data carefully** - Avoid logging sensitive information like passwords or personal data
6. **Use a consistent format** - Maintain a consistent logging format across the application
7. **Configure log retention** - Set appropriate retention periods based on compliance requirements and disk space constraints

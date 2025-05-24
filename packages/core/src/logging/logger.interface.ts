/**
 * Log levels enumeration
 * Ordered from most severe to least severe
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',  // For HTTP request logging
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly'  // Most detailed logging
}

/**
 * Dependency injection token for logger service
 */
export const ILogger = Symbol("ILogger");

/**
 * Interface for application logging
 * Follows a similar pattern to Winston logger
 */
export interface ILogger {
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

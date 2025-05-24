import "winston-daily-rotate-file";
import winston, { format, Logger as WinstonLogger } from "winston";
import { ILogger, LogLevel } from "./logger.interface.js";

/**
 * Configuration options for Winston logger
 */
export interface LoggerOptions {
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

/**
 * Winston implementation of the ILogger interface
 */
class Logger implements ILogger {
  /**
   * Winston logger instance
   */
  private logger: WinstonLogger;

  /**
   * Creates a new Winston logger adapter
   * @param loggerInstance Configured Winston logger instance
   */
  constructor(loggerInstance: WinstonLogger) {
    this.logger = loggerInstance;
  }

  /**
   * Log informational message
   * @param message Message to log
   * @param meta Additional data to include in the log
   */
  public info(message: string, ...meta: any[]): void {
    this.logger.info(message, { meta: meta.length === 1 ? meta[0] : meta });
  }

  /**
   * Log warning message
   * @param message Message to log
   * @param meta Additional data to include in the log
   */
  public warn(message: string, ...meta: any[]): void {
    this.logger.warn(message, { meta: meta.length === 1 ? meta[0] : meta });
  }

  /**
   * Log error message
   * @param message Error message or Error object
   * @param meta Additional data to include in the log
   */
  public error(message: string | Error, ...meta: any[]): void {
    if (message instanceof Error) {
      this.logger.error(message.message, { 
        stack: message.stack, 
        meta: meta.length === 1 ? meta[0] : meta 
      });
    } else {
      this.logger.error(message, { meta: meta.length === 1 ? meta[0] : meta });
    }
  }

  /**
   * Log debug message
   * @param message Message to log
   * @param meta Additional data to include in the log
   */
  public debug(message: string, ...meta: any[]): void {
    this.logger.debug(message, { meta: meta.length === 1 ? meta[0] : meta });
  }
  
  /**
   * Log HTTP request details
   * @param message HTTP request information
   * @param meta Additional request details
   */
  public http(message: string, ...meta: any[]): void {
    this.logger.http(message, { meta: meta.length === 1 ? meta[0] : meta });
  }
  
  /**
   * Log verbose details
   * @param message Verbose information
   * @param meta Additional details
   */
  public verbose(message: string, ...meta: any[]): void {
    this.logger.verbose(message, { meta: meta.length === 1 ? meta[0] : meta });
  }
  
  /**
   * Log detailed diagnostic information
   * @param message Detailed diagnostic information
   * @param meta Additional diagnostics
   */
  public silly(message: string, ...meta: any[]): void {
    this.logger.silly(message, { meta: meta.length === 1 ? meta[0] : meta });
  }

  /**
   * Log message with custom level
   * @param level Log level
   * @param message Message to log
   * @param meta Additional data to include in the log
   */
  public log(level: string, message: string, ...meta: any[]): void {
    this.logger.log(level, message, { meta: meta.length === 1 ? meta[0] : meta });
  }
}

/**
 * Creates and configures a logger instance
 * @param options Logger configuration options
 * @returns Configured ILogger instance
 */
export function createAppLogger(options?: LoggerOptions): ILogger {
  const defaultOptions: Required<LoggerOptions> = {
    level: options?.level || process.env.LOG_LEVEL || LogLevel.INFO,
    logDir: options?.logDir || process.env.LOG_DIR || "logs",
    // The %DATE% placeholder will be replaced according to datePattern
    filenamePattern: options?.filenamePattern || "%DATE%.txt",
    datePattern: options?.datePattern || "YYYYMMDD/HH_mm",
    zippedArchive: options?.zippedArchive ?? true,
    maxSize: options?.maxSize || "20m",
    maxFiles: options?.maxFiles || "14d",
    consoleLogLevel: options?.consoleLogLevel || process.env.CONSOLE_LOG_LEVEL || LogLevel.DEBUG,
    jsonFormat: options?.jsonFormat ?? false
  };

  const config = { ...defaultOptions, ...options };

  // Define log format for human-readable output
  const humanReadableFormat = format.printf(
    ({ level, message, timestamp, stack, meta, ...rest }) => {
      let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
      
      // Add stack trace for errors
      if (stack) {
        log += `\nStack: ${stack}`;
      }
      
      // Process metadata
      const metadata = { ...rest };
      if (meta) {
        metadata.meta = meta;
      }
      
      // Add formatted metadata if present
      const metaString = Object.keys(metadata).length
        ? JSON.stringify(metadata, null, 2)
        : "";
        
      if (metaString && metaString !== "{}") {
        log += `\nMeta: ${metaString}`;
      }
      
      return log;
    }
  );

  const transportsList = [];

  // Console transport with colors
  transportsList.push(
    new winston.transports.Console({
      level: config.consoleLogLevel,
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        humanReadableFormat
      ),
    })
  );

  // File transport with daily rotation
  // Example: logs/20250524/02_30.txt
  const fileTransport = new winston.transports.DailyRotateFile({
    level: config.level,
    dirname: config.logDir,
    filename: config.filenamePattern,
    datePattern: config.datePattern,
    zippedArchive: config.zippedArchive,
    maxSize: config.maxSize,
    maxFiles: config.maxFiles,
    format: format.combine(
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.errors({ stack: true }),
      config.jsonFormat ? format.json() : humanReadableFormat
    ),
  });
  transportsList.push(fileTransport);

  // Create Winston logger instance
  const winstonInstance = winston.createLogger({
    level: config.level,
    levels: winston.config.npm.levels, // Use npm levels which match our LogLevel enum
    format: format.combine(
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.errors({ stack: true }),
      config.jsonFormat ? format.json() : format.simple()
    ),
    transports: transportsList,
    exitOnError: false, // Don't exit on logging errors
  });

  return new Logger(winstonInstance);
}

import "winston-daily-rotate-file";
import winston, { format, Logger as WinstonLogger } from "winston";
import { ILogger } from "./logger.interface.js";

// Định nghĩa các tùy chọn cho logger
export interface LoggerOptions {
  level?: string; // e.g., 'info', 'debug', 'error'
  logDir?: string; // Thư mục lưu log, ví dụ: 'logs'
  filenamePattern?: string; // Mẫu tên file, ví dụ: '%DATE%.txt'
  datePattern?: string; // Mẫu ngày tháng cho tên file và thư mục xoay vòng
  zippedArchive?: boolean;
  maxSize?: string;
  maxFiles?: string;
  consoleLogLevel?: string;
}

// Lớp triển khai ILogger sử dụng Winston
class Logger implements ILogger {
  private logger: WinstonLogger;

  constructor(loggerInstance: WinstonLogger) {
    this.logger = loggerInstance;
  }

  public info(message: string, ...meta: any[]): void {
    this.logger.info(message, meta);
  }

  public warn(message: string, ...meta: any[]): void {
    this.logger.warn(message, meta);
  }

  public error(message: string | Error, ...meta: any[]): void {
    if (message instanceof Error) {
      this.logger.error(message.message, { stack: message.stack, ...meta });
    } else {
      this.logger.error(message, meta);
    }
  }

  public debug(message: string, ...meta: any[]): void {
    this.logger.debug(message, meta);
  }

  public log(level: string, message: string, ...meta: any[]): void {
    this.logger.log(level, message, meta);
  }
}

export function createAppLogger(options?: LoggerOptions): ILogger {
  const defaultOptions: Required<LoggerOptions> = {
    level: options?.level || process.env.LOG_LEVEL || "info",
    logDir: options?.logDir || process.env.LOG_DIR || "logs", // Thư mục gốc cho logs
    // %DATE% sẽ được thay thế bởi datePattern.
    // Ví dụ: nếu datePattern là 'YYYYMMDD/HH_mm', filename sẽ là 'logs/YYYYMMDD/HH_mm.txt'
    filenamePattern: options?.filenamePattern || "%DATE%.txt",
    datePattern: options?.datePattern || "YYYYMMDD/HH_mm", // Đây là phần quan trọng cho định dạng thư mục/file
    zippedArchive: options?.zippedArchive || true,
    maxSize: options?.maxSize || "20m",
    maxFiles: options?.maxFiles || "14d",
    consoleLogLevel:
      options?.consoleLogLevel || process.env.CONSOLE_LOG_LEVEL || "debug",
  };

  const config = { ...defaultOptions, ...options };

  const logFormat = format.printf(
    ({ level, message, timestamp, stack, ...metadata }) => {
      let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
      if (stack) {
        log += `\nStack: ${stack}`;
      }
      // Nối thêm metadata nếu có
      const metaString = Object.keys(metadata).length
        ? JSON.stringify(metadata, null, 2)
        : "";
      if (metaString && metaString !== "{}") {
        log += ` \nMeta: ${metaString}`;
      }
      return log;
    }
  );

  const transportsList = [];

  // Console transport
  transportsList.push(
    new winston.transports.Console({
      level: config.consoleLogLevel,
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        logFormat
      ),
    })
  );

  // File transport (Daily Rotate File)
  // Filename sẽ được tạo trong thư mục con dựa trên datePattern
  // Ví dụ: logs/20250524/02_30.txt
  const fileTransport = new winston.transports.DailyRotateFile({
    level: config.level,
    dirname: config.logDir, // Thư mục gốc
    filename: config.filenamePattern, // Mẫu tên file, %DATE% sẽ được thay thế
    datePattern: config.datePattern, // Mẫu này định nghĩa cách %DATE% được thay thế và tạo thư mục con
    zippedArchive: config.zippedArchive,
    maxSize: config.maxSize,
    maxFiles: config.maxFiles,
    format: format.combine(
      format.timestamp({ format: config.datePattern || "YYYY-MM-DD HH:mm:ss" }),
      format.errors({ stack: true }), // Log stack trace cho errors
      logFormat
    ),
  });
  transportsList.push(fileTransport);

  const winstonInstance = winston.createLogger({
    level: config.level, // Mức log thấp nhất sẽ được xử lý
    format: format.combine(
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.errors({ stack: true }),
      format.json() // Có thể dùng format.json() nếu muốn log dạng JSON ra file
    ),
    transports: transportsList,
    exitOnError: false, // Không thoát nếu có lỗi khi ghi log
  });

  return new Logger(winstonInstance);
}

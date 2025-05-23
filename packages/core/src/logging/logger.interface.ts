export const ILogger = Symbol("ILogger");

export interface ILogger {
  info(message: string, ...meta: any[]): void;
  warn(message: string, ...meta: any[]): void;
  error(message: string | Error, ...meta: any[]): void;
  debug(message: string, ...meta: any[]): void;
  log(level: string, message: string, ...meta: any[]): void;
}

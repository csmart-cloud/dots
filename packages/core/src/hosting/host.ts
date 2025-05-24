import type { IServiceProvider } from "../di/service-provider.js";

/**
 * Represents a configured application host that can be started and stopped
 */
export interface IHost {
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
   * @returns A promise that resolves when the host has started
   */
  start(): Promise<void>;
  
  /**
   * Stops the host and releases resources
   * @returns A promise that resolves when the host has stopped
   */
  stop(): Promise<void>;
}

/**
 * Information about the host environment
 */
export interface HostInfo {
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

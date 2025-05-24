import type { IConfiguration } from "../configuration/configuration.interface.js";
import type { IHost, HostInfo } from "./host.js";
import type { IHostEnvironment } from "./environment.js";
import type { IServiceProvider } from "../di/service-provider.js";

/**
 * Represents a generic host for a web application
 */
export interface IGenericHost extends IHost {
  /**
   * Gets the service provider for the host
   */
  readonly services: IServiceProvider;
  
  /**
   * Gets the configuration for the host
   */
  readonly configuration: IConfiguration;
  
  /**
   * Gets the host environment
   */
  readonly environment: IHostEnvironment;
  
  /**
   * Starts the host
   */
  start(): Promise<void>;
  
  /**
   * Stops the host
   */
  stop(): Promise<void>;
}

/**
 * Default implementation of the generic host
 */
export class GenericHost implements IGenericHost {
  /**
   * Host information
   */
  public readonly info: HostInfo;
  
  /**
   * Creates a new instance of GenericHost
   * @param services The service provider
   * @param configuration The configuration
   * @param environment The host environment
   * @param appHost The application host implementation
   */
  constructor(
    public readonly services: IServiceProvider,
    public readonly configuration: IConfiguration,
    public readonly environment: IHostEnvironment,
    private readonly appHost: IHost
  ) {
    // Use appHost.info as the base and add additional environment information
    this.info = {
      ...appHost.info,
      environment: environment.environmentName
    };
  }

  /**
   * Starts the host
   */
  public async start(): Promise<void> {
    await this.appHost.start();
    console.log(`Application ${this.environment.applicationName} started in ${this.environment.environmentName} environment`);
  }

  /**
   * Stops the host
   */
  public async stop(): Promise<void> {
    await this.appHost.stop();
    console.log(`Application ${this.environment.applicationName} stopped`);
  }
}

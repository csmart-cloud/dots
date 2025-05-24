import path from "path";
import { ConfigurationBuilder } from "../configuration/configuration-builder.js";
import { DefaultApplicationBuilder } from "./application-builder.js";
import { DefaultServiceCollection } from "../di/service-collection.js";
import { DefaultServiceProvider } from "../di/service-provider.js";
import { GenericHost } from "./generic-host.js";
import { HostEnvironment } from "./environment.js";
import { OptionsServiceCollectionExtensions } from "../options/options-service-collection-extensions.js";
import type { IApplicationBuilder } from "./application-builder.js";
import type { IGenericHost } from "./generic-host.js";
import type { IHost } from "./host.js";
import type { IHostEnvironment } from "./environment.js";
import type { IServiceCollection } from "../di/service-collection.js";
import type { IServiceProvider } from "../di/service-provider.js";

/**
 * Builder for creating a generic host
 */
export interface IGenericHostBuilder {
  /**
   * Configures the application services
   * @param configureDelegate The delegate to configure services
   */
  configureServices(
    configureDelegate: (services: IServiceCollection) => void
  ): IGenericHostBuilder;

  /**
   * Configures the application
   * @param configureDelegate The delegate to configure the application
   */
  configureApp(
    configureDelegate: (
      app: IApplicationBuilder,
      hostServices: IServiceProvider
    ) => void
  ): IGenericHostBuilder;

  /**
   * Configures the host environment
   * @param configureDelegate The delegate to configure the environment
   */
  configureHostEnvironment(
    configureDelegate: (env: IHostEnvironment) => void
  ): IGenericHostBuilder;

  /**
   * Configures the application configuration
   * @param configureDelegate The delegate to configure the configuration
   */
  configureAppConfiguration(
    configureDelegate: (
      builder: ConfigurationBuilder,
      env: IHostEnvironment
    ) => void
  ): IGenericHostBuilder;

  /**
   * Builds the generic host
   */
  build(): Promise<IGenericHost>;
}

/**
 * Default implementation of the generic host builder
 */
export class GenericHostBuilder implements IGenericHostBuilder {
  private readonly serviceCollection: IServiceCollection;
  private readonly configureServicesDelegates: ((services: IServiceCollection) => void)[];
  private readonly configureAppDelegates: ((app: IApplicationBuilder, services: IServiceProvider) => void)[];
  private readonly configureHostEnvironmentDelegates: ((env: IHostEnvironment) => void)[];
  private readonly configureAppConfigurationDelegates: ((builder: ConfigurationBuilder, env: IHostEnvironment) => void)[];
  private readonly environment: IHostEnvironment;

  /**
   * Creates a new instance of GenericHostBuilder
   */
  constructor() {
    this.serviceCollection = new DefaultServiceCollection();
    this.configureServicesDelegates = [];
    this.configureAppDelegates = [];
    this.configureHostEnvironmentDelegates = [];
    this.configureAppConfigurationDelegates = [];
    this.environment = new HostEnvironment();

    // Set default configuration for environment
    this.configureHostEnvironment((env) => {
      env.applicationName = process.env.npm_package_name || "Application";
      env.contentRootPath = process.cwd();
    });

    // Set default configuration for app configuration
    this.configureAppConfiguration((builder, env) => {
      // Add appsettings.json
      builder.addJsonFile(path.join(env.contentRootPath, "appsettings.json"), true);
      
      // Add environment-specific settings
      builder.addJsonFile(
        path.join(env.contentRootPath, `appsettings.${env.environmentName}.json`),
        true
      );
      
      // Add environment variables
      builder.addEnvironmentVariables();
    });

    // Add options services by default
    this.configureServices((services) => {
      OptionsServiceCollectionExtensions.addOptionsServices(services);
    });
  }

  /**
   * Configures the application services
   * @param configureDelegate The delegate to configure services
   */
  public configureServices(
    configureDelegate: (services: IServiceCollection) => void
  ): IGenericHostBuilder {
    this.configureServicesDelegates.push(configureDelegate);
    return this;
  }

  /**
   * Configures the application
   * @param configureDelegate The delegate to configure the application
   */
  public configureApp(
    configureDelegate: (
      app: IApplicationBuilder,
      hostServices: IServiceProvider
    ) => void
  ): IGenericHostBuilder {
    this.configureAppDelegates.push(configureDelegate);
    return this;
  }

  /**
   * Configures the host environment
   * @param configureDelegate The delegate to configure the environment
   */
  public configureHostEnvironment(
    configureDelegate: (env: IHostEnvironment) => void
  ): IGenericHostBuilder {
    this.configureHostEnvironmentDelegates.push(configureDelegate);
    return this;
  }

  /**
   * Configures the application configuration
   * @param configureDelegate The delegate to configure the configuration
   */
  public configureAppConfiguration(
    configureDelegate: (
      builder: ConfigurationBuilder,
      env: IHostEnvironment
    ) => void
  ): IGenericHostBuilder {
    this.configureAppConfigurationDelegates.push(configureDelegate);
    return this;
  }

  /**
   * Builds the generic host
   */
  public async build(): Promise<IGenericHost> {
    // Configure environment
    for (const configureDelegate of this.configureHostEnvironmentDelegates) {
      configureDelegate(this.environment);
    }

    // Build configuration
    const configBuilder = new ConfigurationBuilder();
    for (const configureDelegate of this.configureAppConfigurationDelegates) {
      configureDelegate(configBuilder, this.environment);
    }
    const configuration = await configBuilder.build();

    // Register core services
    this.serviceCollection.addSingletonInstance("IConfiguration", configuration);
    this.serviceCollection.addSingletonInstance("IHostEnvironment", this.environment);

    // Configure services
    for (const configureDelegate of this.configureServicesDelegates) {
      configureDelegate(this.serviceCollection);
    }

    // Build service provider
    const serviceProvider = new DefaultServiceProvider(
      this.serviceCollection.getDescriptors()
    );

    // Build application
    const appBuilder = new DefaultApplicationBuilder(serviceProvider);
    for (const configureDelegate of this.configureAppDelegates) {
      configureDelegate(appBuilder, serviceProvider);
    }
    const app = appBuilder.build();

    // Create application host
    const appHost: IHost = {
      services: serviceProvider,
      info: {
        environment: process.env.NODE_ENV || 'development',
        port: Number(configuration.get("Server:Port")) || 5000,
        address: `http://localhost:${Number(configuration.get("Server:Port")) || 5000}`
      },
      start: async () => {
        // Start the application
        const port = Number(configuration.get("Server:Port")) || 5000;
        
        // Use the request handler from app builder
        // Note: In a real implementation, you would use a server like Hono or Express here
        console.log(`Starting web server on port ${port}...`);
        
        // Simplified server initialization for this example
        // In a real implementation, you would create an actual HTTP server
      },
      stop: async () => {
        console.log("Stopping web server...");
        // Close the server in a real implementation
      }
    };

    // Create generic host
    return new GenericHost(
      serviceProvider,
      configuration,
      this.environment,
      appHost
    );
  }
}

import type { IServiceCollection } from "../di/service-collection.js";
import type { IApplicationBuilder } from "./application-builder.js";
import type { IServiceProvider } from "../di/service-provider.js";
import type { ControllerBase } from "../mvc/controller-base.js";
import type { Constructor } from "../common/types.js";

/**
 * Interface for application startup configuration
 * Follows a pattern similar to ASP.NET Core's Startup class
 */
export interface IStartup {
  /**
   * Configures the service collection
   * @param services The service collection to configure
   */
  configureServices(services: IServiceCollection): void;
  
  /**
   * Configures the application request pipeline
   * @param app The application builder to configure
   * @param hostServices The host service provider for accessing configuration and services
   * @returns Optional array of controllers that should be validated during startup
   */
  configure(app: IApplicationBuilder, hostServices: IServiceProvider): void | Constructor<ControllerBase>[];
}

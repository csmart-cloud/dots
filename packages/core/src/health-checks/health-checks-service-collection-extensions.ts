import type { IServiceCollection } from "../di/service-collection.js";
import { 
  DefaultHealthChecksService 
} from "./health-checks-service.js";
import type { IHealthChecksService } from "./health-checks-service.js";
import { 
  HealthStatus, 
  registerHealthCheck 
} from "./health-check.interface.js";
import type { IHealthCheck } from "./health-check.interface.js";
import { ServiceLifetime } from "../di/service-lifetime.js";

/**
 * Builder for configuring health check services
 */
export interface IHealthChecksBuilder {
  /**
   * Adds a health check with the specified name and implementation
   * @param name The health check name
   * @param healthCheck The health check implementation
   * @param failureStatus The status to report when the health check fails
   * @param tags A list of tags that can be used to filter health checks
   */
  addCheck(
    name: string,
    healthCheck: IHealthCheck,
    failureStatus?: HealthStatus,
    tags?: string[]
  ): IHealthChecksBuilder;

  /**
   * Gets the service collection where the health check services are being registered
   */
  readonly services: IServiceCollection;
}

/**
 * Default implementation of IHealthChecksBuilder
 */
class HealthChecksBuilder implements IHealthChecksBuilder {
  /**
   * Creates a new instance of HealthChecksBuilder
   * @param services The service collection
   */
  constructor(public readonly services: IServiceCollection) {}

  /**
   * Adds a health check with the specified name and implementation
   * @param name The health check name
   * @param healthCheck The health check implementation
   * @param failureStatus The status to report when the health check fails
   * @param tags A list of tags that can be used to filter health checks
   */
  public addCheck(
    name: string,
    healthCheck: IHealthCheck,
    failureStatus: HealthStatus = HealthStatus.Unhealthy,
    tags: string[] = []
  ): IHealthChecksBuilder {
    const registration = registerHealthCheck(
      name,
      healthCheck,
      failureStatus,
      tags
    );

    this.services.addFactory(
      `HealthCheck_${name}`,
      (provider) => registration,
      ServiceLifetime.Singleton
    );

    return this;
  }
}

/**
 * Extension methods for IServiceCollection to add health check services
 */
export class HealthChecksServiceCollectionExtensions {
  /**
   * Adds health checks services to the service collection
   * @param services The service collection
   * @param configureHealthChecksBuilder A delegate to configure the provided health checks builder
   */
  public static addHealthChecks(
    services: IServiceCollection,
    configureHealthChecksBuilder?: (builder: IHealthChecksBuilder) => void
  ): IServiceCollection {
    // Register health checks service
    services.addFactory<IHealthChecksService>(
      "IHealthChecksService",
      (provider: any) => {
        // Create the health checks service
        const healthChecksService = new DefaultHealthChecksService();
        
        // Find all health check registrations by prefix
        // Note: In a real implementation we would need to enhance the service provider to support prefix matching
        // For now, we'll assume this would work in a complete implementation
        
        // This is a simplified version - in a real implementation we would need to
        // add support for wildcard service resolution to the service provider
        const healthCheckServices = Object.keys(provider)
          .filter(key => key.startsWith('HealthCheck_'))
          .map(key => provider[key]);
        
        // Add registrations to the service
        for (const registration of healthCheckServices) {
          healthChecksService.addHealthCheck(registration);
        }
        
        return healthChecksService;
      },
      ServiceLifetime.Singleton
    );

    // Configure builder if callback provided
    if (configureHealthChecksBuilder) {
      const builder = new HealthChecksBuilder(services);
      configureHealthChecksBuilder(builder);
    }

    return services;
  }
}

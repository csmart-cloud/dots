import { type IServiceProvider } from "../di/service-provider.js";
import { type IHostedService } from "./hosted-service.interface.js";

/**
 * Interface for a service that manages the lifetime of hosted services.
 */
export interface IHostedServiceManager {
  /**
   * Starts all hosted services.
   */
  startAllAsync(): Promise<void>;

  /**
   * Stops all hosted services.
   */
  stopAllAsync(): Promise<void>;
}

/**
 * Default implementation of IHostedServiceManager.
 */
export class HostedServiceManager implements IHostedServiceManager {
  private _services: IHostedService[] = [];
  private _serviceProvider: IServiceProvider;

  /**
   * Creates a new instance of HostedServiceManager.
   * @param serviceProvider The service provider to resolve hosted services from.
   */
  constructor(serviceProvider: IServiceProvider) {
    this._serviceProvider = serviceProvider;
    this.discoverHostedServices();
  }

  /**
   * Discovers all IHostedService implementations registered in the service container.
   */
  private discoverHostedServices(): void {
    // We try to resolve all hosted services from the service provider
    try {
      // First, check if an array of IHostedService is registered
      const hostedServices = this._serviceProvider.getService<IHostedService[]>(Array);
      
      if (hostedServices && Array.isArray(hostedServices)) {
        this._services.push(...hostedServices);
        return;
      }
    } catch (error) {
      // If we can't resolve an array, we'll try to resolve individual services
      console.debug('No array of IHostedService registered, trying individual services');
    }

    // Try to resolve IHostedService directly
    try {
      const hostedService = this._serviceProvider.getService<IHostedService>(IHostedService);
      if (hostedService) {
        this._services.push(hostedService);
      }
    } catch (error) {
      console.warn('No hosted services found in the service provider');
    }
  }

  /**
   * Starts all hosted services.
   */
  async startAllAsync(): Promise<void> {
    console.log(`Starting ${this._services.length} hosted services...`);
    
    // Start services sequentially
    for (const service of this._services) {
      try {
        await service.startAsync();
      } catch (error) {
        console.error('Error starting hosted service:', error);
        throw error; // Re-throw to prevent application startup if a critical service fails
      }
    }

    console.log('All hosted services started successfully');
  }

  /**
   * Stops all hosted services.
   */
  async stopAllAsync(): Promise<void> {
    console.log(`Stopping ${this._services.length} hosted services...`);
    
    // Stop services in reverse order
    const reverseServices = [...this._services].reverse();
    
    // Track any errors that occur during stopping
    const errors: Error[] = [];
    
    // Stop all services, collecting errors but not short-circuiting
    for (const service of reverseServices) {
      try {
        await service.stopAsync();
      } catch (error) {
        console.error('Error stopping hosted service:', error);
        errors.push(error as Error);
      }
    }
    
    // If there were any errors, throw an aggregated error
    if (errors.length > 0) {
      console.error(`Failed to stop ${errors.length} hosted services`);
      throw new Error(`Failed to stop ${errors.length} hosted services: ${errors.map(e => e.message).join('; ')}`);
    }
    
    console.log('All hosted services stopped successfully');
  }
}

/**
 * Extension method for IHostBuilder to add hosted service manager support.
 */
export function addHostedServiceManager(builder: any): any { // Using any for flexibility
  // Register the hosted service manager
  builder.configureServices(services => {
    services.addSingleton(HostedServiceManager);
    services.addSingleton(IHostedServiceManager, sp => sp.getRequiredService(HostedServiceManager));
  });
  
  // Configure the host to start and stop hosted services
  builder.configure((app, services) => {
    const originalStart = builder.build().start;
    const originalStop = builder.build().stop;
    
    // Override the start method to start hosted services
    builder.build().start = async () => {
      await originalStart();
      const manager = services.getRequiredService<IHostedServiceManager>(IHostedServiceManager);
      await manager.startAllAsync();
    };
    
    // Override the stop method to stop hosted services
    builder.build().stop = async () => {
      const manager = services.getRequiredService<IHostedServiceManager>(IHostedServiceManager);
      await manager.stopAllAsync();
      await originalStop();
    };
  });
  
  return builder;
}

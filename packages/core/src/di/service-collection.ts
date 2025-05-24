import { ServiceDescriptor } from "./service-descriptor.js";
import { ServiceLifetime } from "./service-lifetime.js";
import type { Constructor } from "../common/types.js";
import type { IServiceProvider } from "./service-provider.js";

/**
 * Interface for registering services in the dependency injection container.
 * Similar to the IServiceCollection in ASP.NET Core.
 */
export interface IServiceCollection {
  /**
   * Adds a service descriptor to the collection
   * @param descriptor The service descriptor to add
   */
  add(descriptor: ServiceDescriptor): void;

  /**
   * Adds a transient service of the type specified in implementationType
   * @param implementationType The type of the service to register and the implementation to use
   * @returns The same service collection to enable method chaining
   */
  addTransient<TService>(
    implementationType: Constructor<TService>
  ): IServiceCollection;

  /**
   * Adds a transient service of the type specified in serviceType with an implementation of the type specified in implementationType
   * @param serviceType The type of the service to register
   * @param implementationType The implementation type of the service
   * @returns The same service collection to enable method chaining
   */
  addTransient<TService, TImplementation extends TService>(
    serviceType: Constructor<TService> | symbol | string,
    implementationType: Constructor<TImplementation>
  ): IServiceCollection;

  /**
   * Adds a scoped service of the type specified in implementationType
   * @param implementationType The type of the service to register and the implementation to use
   * @returns The same service collection to enable method chaining
   */
  addScoped<TService>(
    implementationType: Constructor<TService>
  ): IServiceCollection;

  /**
   * Adds a scoped service of the type specified in serviceType with an implementation of the type specified in implementationType
   * @param serviceType The type of the service to register
   * @param implementationType The implementation type of the service
   * @returns The same service collection to enable method chaining
   */
  addScoped<TService, TImplementation extends TService>(
    serviceType: Constructor<TService> | symbol | string,
    implementationType: Constructor<TImplementation>
  ): IServiceCollection;

  /**
   * Adds a singleton service of the type specified in implementationType
   * @param implementationType The type of the service to register and the implementation to use
   * @returns The same service collection to enable method chaining
   */
  addSingleton<TService>(
    implementationType: Constructor<TService>
  ): IServiceCollection;

  /**
   * Adds a singleton service of the type specified in serviceType with an implementation of the type specified in implementationType
   * @param serviceType The type of the service to register
   * @param implementationType The implementation type of the service
   * @returns The same service collection to enable method chaining
   */
  addSingleton<TService, TImplementation extends TService>(
    serviceType: Constructor<TService> | symbol | string,
    implementationType: Constructor<TImplementation>
  ): IServiceCollection;

  /**
   * Adds a singleton service of the type specified in serviceType with an instance specified in instance
   * @param serviceType The type of the service to register
   * @param instance The instance of the service
   * @returns The same service collection to enable method chaining
   */
  addSingletonInstance<TService>(
    serviceType: Constructor<TService> | symbol | string,
    instance: TService
  ): IServiceCollection;

  /**
   * Adds a service using a factory function with the specified lifetime
   * @param serviceType The type of the service to register
   * @param factory The factory function that creates the service instance
   * @param lifetime The lifetime of the service
   * @returns The same service collection to enable method chaining
   */
  addFactory<TService>(
    serviceType: Constructor<TService> | symbol | string,
    factory: (provider: IServiceProvider) => TService,
    lifetime: ServiceLifetime
  ): IServiceCollection;
  
  /**
   * Gets all the service descriptors registered in the collection
   * @returns A readonly array of service descriptors
   */
  getDescriptors(): ReadonlyArray<ServiceDescriptor>;
  
  /**
   * Checks if a service type is registered in the collection
   * @param serviceType The service type to check
   * @returns True if the service is registered, false otherwise
   */
  contains(serviceType: Constructor<any> | symbol | string): boolean;
  
  /**
   * Tries to get the service descriptor for the specified service type
   * @param serviceType The service type to get the descriptor for
   * @returns The service descriptor if found, null otherwise
   */
  tryGetDescriptor(serviceType: Constructor<any> | symbol | string): ServiceDescriptor | null;
}

/**
 * Default implementation of IServiceCollection for registering services.
 */
export class DefaultServiceCollection implements IServiceCollection {
  private descriptors: ServiceDescriptor[] = [];

  /**
   * Adds a service descriptor to the collection
   * @param descriptor The service descriptor to add
   */
  add(descriptor: ServiceDescriptor): void {
    this.descriptors.push(descriptor);
  }

  /**
   * Adds a transient service to the collection
   * @param serviceOrImplementation The service type or implementation type
   * @param implementationType Optional implementation type
   * @returns The same service collection for method chaining
   */
  addTransient<TService, TImplementation extends TService>(
    serviceOrImplementation: Constructor<TService> | symbol | string,
    implementationType?: Constructor<TImplementation>
  ): IServiceCollection {
    if (implementationType) {
      // Two parameter version: services.addTransient(IToken, ServiceImpl)
      this.add(
        ServiceDescriptor.transient(serviceOrImplementation, implementationType)
      );
    } else {
      // One parameter version: services.addTransient(ServiceImpl)
      const implementation = serviceOrImplementation as Constructor<TService>;
      this.add(ServiceDescriptor.transient(implementation, implementation));
    }
    return this;
  }

  /**
   * Adds a scoped service to the collection
   * @param serviceOrImplementation The service type or implementation type
   * @param implementationType Optional implementation type
   * @returns The same service collection for method chaining
   */
  addScoped<TService, TImplementation extends TService>(
    serviceOrImplementation: Constructor<TService> | symbol | string,
    implementationType?: Constructor<TImplementation>
  ): IServiceCollection {
    if (implementationType) {
      // Two parameter version: services.addScoped(IToken, ServiceImpl)
      this.add(
        ServiceDescriptor.scoped(serviceOrImplementation, implementationType)
      );
    } else {
      // One parameter version: services.addScoped(ServiceImpl)
      const implementation = serviceOrImplementation as Constructor<TService>;
      this.add(ServiceDescriptor.scoped(implementation, implementation));
    }
    return this;
  }

  /**
   * Adds a singleton service to the collection
   * @param serviceOrImplementation The service type or implementation type
   * @param implementationType Optional implementation type
   * @returns The same service collection for method chaining
   */
  addSingleton<TService, TImplementation extends TService>(
    serviceOrImplementation: Constructor<TService> | symbol | string,
    implementationType?: Constructor<TImplementation>
  ): IServiceCollection {
    if (implementationType) {
      // Two parameter version: services.addSingleton(IToken, ServiceImpl)
      this.add(
        ServiceDescriptor.singleton(serviceOrImplementation, implementationType)
      );
    } else {
      // One parameter version: services.addSingleton(ServiceImpl)
      const implementation = serviceOrImplementation as Constructor<TService>;
      this.add(ServiceDescriptor.singleton(implementation, implementation));
    }
    return this;
  }

  /**
   * Adds a singleton instance to the collection
   * @param serviceType The service type
   * @param instance The instance to use
   * @returns The same service collection for method chaining
   */
  addSingletonInstance<TService>(
    serviceType: Constructor<TService> | symbol | string,
    instance: TService
  ): IServiceCollection {
    this.add(ServiceDescriptor.singletonInstance(serviceType, instance));
    return this;
  }

  /**
   * Adds a service factory to the collection
   * @param serviceType The service type
   * @param factory The factory function
   * @param lifetime The service lifetime
   * @returns The same service collection for method chaining
   */
  addFactory<TService>(
    serviceType: Constructor<TService> | symbol | string,
    factory: (provider: IServiceProvider) => TService,
    lifetime: ServiceLifetime
  ): IServiceCollection {
    this.add(ServiceDescriptor.factory(serviceType, factory, lifetime));
    return this;
  }

  /**
   * Gets all service descriptors in the collection
   * @returns A readonly array of service descriptors
   */
  getDescriptors(): ReadonlyArray<ServiceDescriptor> {
    return this.descriptors;
  }
  
  /**
   * Checks if a service type is registered in the collection
   * @param serviceType The service type to check
   * @returns True if the service is registered, false otherwise
   */
  contains(serviceType: Constructor<any> | symbol | string): boolean {
    return this.descriptors.some(d => d.serviceType === serviceType);
  }
  
  /**
   * Tries to get the service descriptor for the specified service type
   * @param serviceType The service type to get the descriptor for
   * @returns The service descriptor if found, null otherwise
   */
  tryGetDescriptor(serviceType: Constructor<any> | symbol | string): ServiceDescriptor | null {
    const descriptor = this.descriptors.find(d => d.serviceType === serviceType);
    return descriptor || null;
  }
  
  /**
   * Replaces a service registration with a new descriptor
   * @param serviceType The service type to replace
   * @param descriptor The new service descriptor
   * @returns The same service collection for method chaining
   */
  replace(serviceType: Constructor<any> | symbol | string, descriptor: ServiceDescriptor): IServiceCollection {
    const index = this.descriptors.findIndex(d => d.serviceType === serviceType);
    if (index >= 0) {
      this.descriptors[index] = descriptor;
    } else {
      this.add(descriptor);
    }
    return this;
  }
  
  /**
   * Removes a service registration
   * @param serviceType The service type to remove
   * @returns The same service collection for method chaining
   */
  remove(serviceType: Constructor<any> | symbol | string): IServiceCollection {
    const index = this.descriptors.findIndex(d => d.serviceType === serviceType);
    if (index >= 0) {
      this.descriptors.splice(index, 1);
    }
    return this;
  }
}

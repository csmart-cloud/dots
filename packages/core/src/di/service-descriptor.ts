import { ServiceLifetime } from "./service-lifetime.js";
import type { Constructor } from "../common/types.js";
import type { IServiceProvider } from "./service-provider.js";

/**
 * Describes a registered service in the dependency injection container.
 * Similar to the ServiceDescriptor in ASP.NET Core.
 */
export class ServiceDescriptor {
  /**
   * Creates a new service descriptor.
   * @param serviceType The service type being registered
   * @param implementationType The implementation type (optional)
   * @param implementationInstance The implementation instance (optional)
   * @param implementationFactory The implementation factory (optional)
   * @param lifetime The service lifetime
   */
  constructor(
    public readonly serviceType: Constructor<any> | symbol | string,
    public readonly implementationType: Constructor<any> | undefined,
    public readonly implementationInstance: any | undefined,
    public readonly implementationFactory:
      | ((provider: IServiceProvider) => any)
      | undefined,
    public readonly lifetime: ServiceLifetime
  ) {}

  /**
   * Creates a transient service descriptor.
   * @param serviceType The service type
   * @param implementationType The implementation type
   * @returns A new ServiceDescriptor with Transient lifetime
   */
  static transient<TService, TImplementation extends TService>(
    serviceType: Constructor<TService> | symbol | string,
    implementationType: Constructor<TImplementation>
  ): ServiceDescriptor {
    return new ServiceDescriptor(
      serviceType,
      implementationType,
      undefined,
      undefined,
      ServiceLifetime.Transient
    );
  }

  /**
   * Creates a scoped service descriptor.
   * @param serviceType The service type
   * @param implementationType The implementation type
   * @returns A new ServiceDescriptor with Scoped lifetime
   */
  static scoped<TService, TImplementation extends TService>(
    serviceType: Constructor<TService> | symbol | string,
    implementationType: Constructor<TImplementation>
  ): ServiceDescriptor {
    return new ServiceDescriptor(
      serviceType,
      implementationType,
      undefined,
      undefined,
      ServiceLifetime.Scoped
    );
  }

  /**
   * Creates a singleton service descriptor.
   * @param serviceType The service type
   * @param implementationType The implementation type
   * @returns A new ServiceDescriptor with Singleton lifetime
   */
  static singleton<TService, TImplementation extends TService>(
    serviceType: Constructor<TService> | symbol | string,
    implementationType: Constructor<TImplementation>
  ): ServiceDescriptor {
    return new ServiceDescriptor(
      serviceType,
      implementationType,
      undefined,
      undefined,
      ServiceLifetime.Singleton
    );
  }

  /**
   * Creates a singleton instance service descriptor.
   * @param serviceType The service type
   * @param instance The instance to use
   * @returns A new ServiceDescriptor with Singleton lifetime and pre-configured instance
   */
  static singletonInstance<TService>(
    serviceType: Constructor<TService> | symbol | string,
    instance: TService
  ): ServiceDescriptor {
    return new ServiceDescriptor(
      serviceType,
      undefined,
      instance,
      undefined,
      ServiceLifetime.Singleton
    );
  }

  /**
   * Creates a service descriptor with a factory function.
   * @param serviceType The service type
   * @param factory The factory function to create instances
   * @param lifetime The service lifetime
   * @returns A new ServiceDescriptor with the specified lifetime and factory
   */
  static factory<TService>(
    serviceType: Constructor<TService> | symbol | string,
    factory: (provider: IServiceProvider) => TService,
    lifetime: ServiceLifetime
  ): ServiceDescriptor {
    return new ServiceDescriptor(
      serviceType,
      undefined,
      undefined,
      factory,
      lifetime
    );
  }
  
  /**
   * Determines if this descriptor represents a singleton service.
   * @returns True if the service lifetime is Singleton
   */
  get isSingleton(): boolean {
    return this.lifetime === ServiceLifetime.Singleton;
  }
  
  /**
   * Determines if this descriptor represents a scoped service.
   * @returns True if the service lifetime is Scoped
   */
  get isScoped(): boolean {
    return this.lifetime === ServiceLifetime.Scoped;
  }
  
  /**
   * Determines if this descriptor represents a transient service.
   * @returns True if the service lifetime is Transient
   */
  get isTransient(): boolean {
    return this.lifetime === ServiceLifetime.Transient;
  }
  
  /**
   * Converts the descriptor to a string representation.
   * @returns String representation of the service descriptor
   */
  toString(): string {
    let typeName = typeof this.serviceType === 'string' 
      ? this.serviceType 
      : (this.serviceType as any).name || String(this.serviceType);
      
    let impl = "";
    if (this.implementationType) {
      impl = ` => ${(this.implementationType as any).name}`;
    } else if (this.implementationInstance) {
      impl = " => [Instance]";
    } else if (this.implementationFactory) {
      impl = " => [Factory]";
    }
    
    return `${typeName}${impl} (${ServiceLifetime[this.lifetime]})`;
  }
}

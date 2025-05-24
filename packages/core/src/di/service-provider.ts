import "reflect-metadata";
import { ServiceDescriptor } from "./service-descriptor.js";
import { ServiceLifetime } from "./service-lifetime.js";
import { INJECT_PARAMS_METADATA, INJECT_PROPERTY_METADATA } from "./decorators.js";
import type { Constructor } from "../common/types.js";

/**
 * Interface for resolving services from the dependency injection container.
 * Similar to IServiceProvider in Microsoft.Extensions.DependencyInjection.
 */
export interface IServiceProvider {
  /**
   * Gets a service of the specified type.
   * @param serviceType The type or token of the service to get
   * @returns The service instance, or null if the service is not registered
   */
  getService<T>(serviceType: Constructor<T> | symbol | string): T | null;
  
  /**
   * Creates a new scope from this service provider.
   * @returns A new scoped service provider
   */
  createScope(): IServiceProvider;
  
  /**
   * Attempts to get a service of the specified type from the service provider.
   * @param serviceType The type or token of the service to get
   * @param defaultValue A default value to return if the service is not found
   * @returns The service instance, or the default value if not found
   */
  getServiceOrDefault<T>(serviceType: Constructor<T> | symbol | string, defaultValue: T): T;
  
  /**
   * Gets a required service of the specified type from the service provider.
   * @param serviceType The type or token of the service to get
   * @returns The service instance
   * @throws If the service is not registered
   */
  getRequiredService<T>(serviceType: Constructor<T> | symbol | string): T;
}

export class DefaultServiceProvider implements IServiceProvider {
  private readonly singletonInstances: Map<any, any> = new Map();
  private readonly scopedInstances: Map<any, any> = new Map();

  constructor(
    private descriptors: ReadonlyArray<ServiceDescriptor>,
    private parentScopeProvider?: DefaultServiceProvider
  ) {
    if (!parentScopeProvider) {
      descriptors.forEach((descriptor) => {
        if (
          descriptor.lifetime === ServiceLifetime.Singleton &&
          descriptor.implementationInstance
        ) {
          this.singletonInstances.set(
            descriptor.serviceType,
            descriptor.implementationInstance
          );
        }
      });
    }
  }

  /**
   * Gets a service of the specified type.
   * @param serviceType The type or token of the service to get
   * @returns The service instance, or null if the service is not registered
   */
  getService<T>(serviceType: Constructor<T> | symbol | string): T | null {
    const descriptor = this.descriptors.find(
      (d) => d.serviceType === serviceType
    );

    if (!descriptor) {
      if (this.parentScopeProvider) {
        return this.parentScopeProvider.getService(serviceType);
      }
      return null;
    }

    try {
      switch (descriptor.lifetime) {
        case ServiceLifetime.Singleton:
          const rootProvider = this.parentScopeProvider || this;
          // Must get service from the root provider for singletons
          if (rootProvider === this) {
            // If this is the root provider
            if (!this.singletonInstances.has(serviceType)) {
              const instance = this.createInstance(descriptor, this);
              this.singletonInstances.set(serviceType, instance);
            }
            return this.singletonInstances.get(serviceType) as T;
          } else {
            // If this is a scoped provider, delegate to root
            return rootProvider.getService(serviceType);
          }

        case ServiceLifetime.Scoped:
          if (!this.scopedInstances.has(serviceType)) {
            const instance = this.createInstance(descriptor, this);
            this.scopedInstances.set(serviceType, instance);
          }
          return this.scopedInstances.get(serviceType) as T;

        case ServiceLifetime.Transient:
          return this.createInstance(descriptor, this) as T;

        default:
          throw new Error(
            `Unsupported service lifetime: ${descriptor.lifetime}`
          );
      }
    } catch (error: any) {
      const serviceName =
        typeof descriptor.serviceType === "function"
          ? descriptor.serviceType.name
          : String(descriptor.serviceType);
      throw new Error(
        `DI Error: Failed to create service "${serviceName}".\n  ---> ${error.message}`
      );
    }
  }
  
  /**
   * Attempts to get a service of the specified type from the service provider.
   * @param serviceType The type or token of the service to get
   * @param defaultValue A default value to return if the service is not found
   * @returns The service instance, or the default value if not found
   */
  getServiceOrDefault<T>(serviceType: Constructor<T> | symbol | string, defaultValue: T): T {
    const service = this.getService<T>(serviceType);
    return service !== null ? service : defaultValue;
  }
  
  /**
   * Gets a required service of the specified type from the service provider.
   * @param serviceType The type or token of the service to get
   * @returns The service instance
   * @throws If the service is not registered
   */
  getRequiredService<T>(serviceType: Constructor<T> | symbol | string): T {
    const service = this.getService<T>(serviceType);
    if (service === null) {
      const serviceName =
        typeof serviceType === "function"
          ? serviceType.name
          : String(serviceType);
      throw new Error(
        `No service for type "${serviceName}" has been registered.`
      );
    }
    return service;
  }

  /**
   * Creates a new scope from this service provider.
   * @returns A new scoped service provider
   */
  createScope(): IServiceProvider {
    return new DefaultServiceProvider(this.descriptors, this);
  }

  /**
   * Creates an instance of a service using its descriptor.
   * @param descriptor The service descriptor
   * @param resolvingProvider The provider used to resolve dependencies
   * @returns The created instance
   */
  private createInstance(
    descriptor: ServiceDescriptor,
    resolvingProvider: IServiceProvider
  ): any {
    if (descriptor.implementationInstance) {
      return descriptor.implementationInstance;
    }

    if (descriptor.implementationFactory) {
      return descriptor.implementationFactory(resolvingProvider);
    }

    if (descriptor.implementationType) {
      const constructorFunc = descriptor.implementationType;

      // Check metadata and actual parameter count
      const actualParamsLength = constructorFunc.length;
      const designParamTypes: Constructor[] =
        Reflect.getMetadata("design:paramtypes", constructorFunc) || [];
      const injectedParamTokens: (Constructor | symbol | string)[] =
        Reflect.getOwnMetadata(INJECT_PARAMS_METADATA, constructorFunc) || [];

      // If constructor has parameters but we couldn't get metadata types
      // AND we don't have enough @Inject tokens, that's a potential error
      if (
        actualParamsLength > 0 &&
        designParamTypes.length === 0 &&
        injectedParamTokens.filter((t) => t !== undefined).length <
          actualParamsLength
      ) {
        console.warn(
          `DI Warning: Reflect.getMetadata("design:paramtypes", ${constructorFunc.name}) returned an empty array or insufficient types.`
        );
        console.warn(
          `  This usually means 'emitDecoratorMetadata' is not true in tsconfig.json, 'reflect-metadata' is not imported early enough, or there's a circular dependency.`
        );
        console.warn(
          `  Constructor for ${constructorFunc.name} expects ${actualParamsLength} arguments.`
        );
      }

      // Resolve constructor parameters
      const params: any[] = [];
      for (let i = 0; i < actualParamsLength; i++) {
        const designParamType = designParamTypes[i]; // May be undefined if designParamTypes is empty
        const injectedToken = injectedParamTokens[i]; // May be undefined
        const injectionToken = injectedToken || designParamType;

        if (!injectionToken) {
          throw new Error(
            `Cannot resolve parameter at index ${i} of "${constructorFunc.name}" because its type could not be determined and no @Inject token was provided. Ensure 'emitDecoratorMetadata' is enabled and 'reflect-metadata' is imported, or use @Inject().`
          );
        }

        const dependency = resolvingProvider.getService(injectionToken);

        if (dependency === null || dependency === undefined) {
          let tokenName =
            typeof injectionToken === "function"
              ? injectionToken.name
              : String(injectionToken);
          throw new Error(
            `Could not resolve dependency for token "${tokenName}" (parameter ${i} of "${constructorFunc.name}"). Make sure this dependency is registered in the service collection.`
          );
        }
        params.push(dependency);
      }
      
      // Create the instance
      const instance = new constructorFunc(...params);
      
      // Handle property injection
      this.injectProperties(instance, constructorFunc, resolvingProvider);
      
      return instance;
    }
    throw new Error(
      `Cannot create instance for service type: ${String(descriptor.serviceType)}`
    );
  }
  
  /**
   * Injects dependencies into object properties based on metadata.
   * @param instance The object instance to inject properties into
   * @param constructor The constructor function of the instance
   * @param resolvingProvider The provider to resolve dependencies from
   */
  private injectProperties(instance: any, constructor: Constructor, resolvingProvider: IServiceProvider): void {
    const propertyInjections = Reflect.getOwnMetadata(INJECT_PROPERTY_METADATA, constructor) as Record<string | symbol, any>;
    
    if (!propertyInjections) {
      return;
    }
    
    for (const propertyKey in propertyInjections) {
      const token = propertyInjections[propertyKey];
      
      try {
        const dependency = resolvingProvider.getService(token);
        
        if (dependency === null) {
          const tokenName = typeof token === "function" ? token.name : String(token);
          console.warn(`Property injection failed for property ${String(propertyKey)} in ${constructor.name}. Service not found for token: ${tokenName}`);
          continue;
        }
        
        instance[propertyKey] = dependency;
      } catch (error: any) {
        console.warn(
          `Property injection failed for property ${String(propertyKey)} in ${constructor.name}: ${error.message}`
        );
      }
    }
  }
}

import { ServiceDescriptor } from "./service-descriptor.js";
import { ServiceLifetime } from "./service-lifetime.js";
import type { Constructor } from "../common/types.js";
import type { IServiceProvider } from "./service-provider.js";

/**
 * Interface cho việc đăng ký các services.
 */
export interface IServiceCollection {
  add(descriptor: ServiceDescriptor): void;
  addTransient<TService>(
    serviceType: Constructor<TService> | symbol | string,
    implementationType: Constructor<TService>
  ): IServiceCollection;
  addTransient<TService, TImplementation extends TService>(
    serviceType: Constructor<TService> | symbol | string,
    implementationType: Constructor<TImplementation>
  ): IServiceCollection;

  addScoped<TService>(
    serviceType: Constructor<TService> | symbol | string,
    implementationType: Constructor<TService>
  ): IServiceCollection;
  addScoped<TService, TImplementation extends TService>(
    serviceType: Constructor<TService> | symbol | string,
    implementationType: Constructor<TImplementation>
  ): IServiceCollection;

  addSingleton<TService>(
    serviceType: Constructor<TService> | symbol | string,
    implementationType: Constructor<TService>
  ): IServiceCollection;
  addSingleton<TService, TImplementation extends TService>(
    serviceType: Constructor<TService> | symbol | string,
    implementationType: Constructor<TImplementation>
  ): IServiceCollection;

  addSingletonInstance<TService>(
    serviceType: Constructor<TService> | symbol | string,
    instance: TService
  ): IServiceCollection;
  addFactory<TService>(
    serviceType: Constructor<TService> | symbol | string,
    factory: (provider: IServiceProvider) => TService,
    lifetime: ServiceLifetime
  ): IServiceCollection;
  getDescriptors(): ReadonlyArray<ServiceDescriptor>;
}

export class DefaultServiceCollection implements IServiceCollection {
  private descriptors: ServiceDescriptor[] = [];

  add(descriptor: ServiceDescriptor): void {
    this.descriptors.push(descriptor);
  }

  addTransient<TService, TImplementation extends TService>(
    serviceType: Constructor<TService> | symbol | string,
    implementationType: Constructor<TImplementation>
  ): IServiceCollection {
    this.add(ServiceDescriptor.transient(serviceType, implementationType));
    return this;
  }

  addScoped<TService, TImplementation extends TService>(
    serviceType: Constructor<TService> | symbol | string,
    implementationType: Constructor<TImplementation>
  ): IServiceCollection {
    this.add(ServiceDescriptor.scoped(serviceType, implementationType));
    return this;
  }

  addSingleton<TService, TImplementation extends TService>(
    serviceType: Constructor<TService> | symbol | string,
    implementationType: Constructor<TImplementation>
  ): IServiceCollection {
    this.add(ServiceDescriptor.singleton(serviceType, implementationType));
    return this;
  }

  addSingletonInstance<TService>(
    serviceType: Constructor<TService> | symbol | string,
    instance: TService
  ): IServiceCollection {
    this.add(ServiceDescriptor.singletonInstance(serviceType, instance));
    return this;
  }

  addFactory<TService>(
    serviceType: Constructor<TService> | symbol | string,
    factory: (provider: IServiceProvider) => TService,
    lifetime: ServiceLifetime
  ): IServiceCollection {
    this.add(ServiceDescriptor.factory(serviceType, factory, lifetime));
    return this;
  }

  getDescriptors(): ReadonlyArray<ServiceDescriptor> {
    return this.descriptors;
  }
}

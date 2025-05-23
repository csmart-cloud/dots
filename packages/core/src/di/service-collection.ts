import { ServiceDescriptor } from "./service-descriptor.js";
import { ServiceLifetime } from "./service-lifetime.js";
import type { Constructor } from "../common/types.js";
import type { IServiceProvider } from "./service-provider.js";

/**
 * Interface cho việc đăng ký các services.
 */
export interface IServiceCollection {
  add(descriptor: ServiceDescriptor): void;

  // Overloads cho addTransient
  addTransient<TService>(
    implementationType: Constructor<TService>
  ): IServiceCollection;
  addTransient<TService, TImplementation extends TService>(
    serviceType: Constructor<TService> | symbol | string,
    implementationType: Constructor<TImplementation>
  ): IServiceCollection;

  // Overloads cho addScoped
  addScoped<TService>(
    implementationType: Constructor<TService>
  ): IServiceCollection;
  addScoped<TService, TImplementation extends TService>(
    serviceType: Constructor<TService> | symbol | string,
    implementationType: Constructor<TImplementation>
  ): IServiceCollection;

  // Overloads cho addSingleton
  addSingleton<TService>(
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

  // Triển khai logic cho overloads
  addTransient<TService, TImplementation extends TService>(
    serviceOrImplementation: Constructor<TService> | symbol | string,
    implementationType?: Constructor<TImplementation>
  ): IServiceCollection {
    if (implementationType) {
      // Version 2 tham số: services.addTransient(IToken, ServiceImpl)
      this.add(
        ServiceDescriptor.transient(serviceOrImplementation, implementationType)
      );
    } else {
      // Version 1 tham số: services.addTransient(ServiceImpl)
      const implementation = serviceOrImplementation as Constructor<TService>;
      this.add(ServiceDescriptor.transient(implementation, implementation));
    }
    return this;
  }

  // SỬA ĐỔI: Triển khai logic cho overloads
  addScoped<TService, TImplementation extends TService>(
    serviceOrImplementation: Constructor<TService> | symbol | string,
    implementationType?: Constructor<TImplementation>
  ): IServiceCollection {
    if (implementationType) {
      // Version 2 tham số: services.addScoped(IToken, ServiceImpl)
      this.add(
        ServiceDescriptor.scoped(serviceOrImplementation, implementationType)
      );
    } else {
      // Version 1 tham số: services.addScoped(ServiceImpl)
      const implementation = serviceOrImplementation as Constructor<TService>;
      this.add(ServiceDescriptor.scoped(implementation, implementation));
    }
    return this;
  }

  // SỬA ĐỔI: Triển khai logic cho overloads
  addSingleton<TService, TImplementation extends TService>(
    serviceOrImplementation: Constructor<TService> | symbol | string,
    implementationType?: Constructor<TImplementation>
  ): IServiceCollection {
    if (implementationType) {
      // Version 2 tham số: services.addSingleton(IToken, ServiceImpl)
      this.add(
        ServiceDescriptor.singleton(serviceOrImplementation, implementationType)
      );
    } else {
      // Version 1 tham số: services.addSingleton(ServiceImpl)
      const implementation = serviceOrImplementation as Constructor<TService>;
      this.add(ServiceDescriptor.singleton(implementation, implementation));
    }
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

import { ServiceLifetime } from "./service-lifetime";
import { Constructor } from "../common/types";
import { IServiceProvider } from "./service-provider";

/**
 * Mô tả một service đã được đăng ký.
 */
export class ServiceDescriptor {
  constructor(
    public serviceType: any,
    public implementationType: Constructor | undefined,
    public implementationInstance: any | undefined,
    public implementationFactory:
      | ((provider: IServiceProvider) => any)
      | undefined,
    public lifetime: ServiceLifetime
  ) {}

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
}

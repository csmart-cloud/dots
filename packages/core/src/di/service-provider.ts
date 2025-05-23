import "reflect-metadata";
import { ServiceDescriptor } from "./service-descriptor.js";
import { ServiceLifetime } from "./service-lifetime.js";
import { INJECT_PARAMS_METADATA } from "./decorators.js";
import type { Constructor } from "../common/types.js";

/**
 * Interface cho việc resolve các services.
 * Tương tự IServiceProvider trong Microsoft.Extensions.DependencyInjection.
 */
export interface IServiceProvider {
  getService<T>(serviceType: Constructor<T> | symbol | string): T | null;
  createScope(): IServiceProvider;
}

export class DefaultServiceProvider implements IServiceProvider {
  private readonly singletonInstances: Map<any, any> = new Map();
  private readonly scopedInstances: Map<any, any> = new Map();

  constructor(
    private descriptors: ReadonlyArray<ServiceDescriptor>,
    private parentScopeProvider?: DefaultServiceProvider
  ) {
    // Pre-instantiate singletons if they are instance-based from root provider
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

  getService<T>(serviceType: Constructor<T> | symbol | string): T | null {
    const descriptor = this.descriptors.find(
      (d) => d.serviceType === serviceType
    );

    if (!descriptor) {
      // Nếu không tìm thấy trong scope hiện tại, và có parent scope, thử tìm ở parent.
      // Điều này quan trọng cho scoped services tìm singleton services.
      return this.parentScopeProvider
        ? this.parentScopeProvider.getService(serviceType)
        : null;
    }

    switch (descriptor.lifetime) {
      case ServiceLifetime.Singleton:
        // Singleton luôn được resolve từ root provider (hoặc provider không có parent)
        if (this.parentScopeProvider) {
          return this.parentScopeProvider.getService(serviceType);
        }
        if (!this.singletonInstances.has(serviceType)) {
          const instance = this.createInstance(descriptor);
          this.singletonInstances.set(serviceType, instance);
        }
        return this.singletonInstances.get(serviceType) as T;

      case ServiceLifetime.Scoped:
        // Scoped instances được quản lý bởi scope provider hiện tại (hoặc root nếu không có parent)
        const providerForScoped = this.parentScopeProvider || this;
        if (!providerForScoped.scopedInstances.has(serviceType)) {
          const instance = this.createInstance(descriptor, providerForScoped);
          providerForScoped.scopedInstances.set(serviceType, instance);
        }
        return providerForScoped.scopedInstances.get(serviceType) as T;

      case ServiceLifetime.Transient:
        // Transient luôn tạo instance mới, sử dụng provider của scope hiện tại để resolve dependencies
        return this.createInstance(
          descriptor,
          this.parentScopeProvider || this
        ) as T;

      default:
        throw new Error(`Unsupported service lifetime: ${descriptor.lifetime}`);
    }
  }

  private createInstance(
    descriptor: ServiceDescriptor,
    resolvingProvider: IServiceProvider = this
  ): any {
    if (descriptor.implementationInstance) {
      return descriptor.implementationInstance;
    }

    if (descriptor.implementationFactory) {
      return descriptor.implementationFactory(resolvingProvider);
    }

    if (descriptor.implementationType) {
      const constructor = descriptor.implementationType;
      const designParamTypes: Constructor[] =
        Reflect.getMetadata("design:paramtypes", constructor) || [];
      const injectedParamTokens: (Constructor | symbol | string)[] =
        Reflect.getOwnMetadata(INJECT_PARAMS_METADATA, constructor) || [];

      const params = designParamTypes.map((designParamType, index) => {
        const injectionToken = injectedParamTokens[index] || designParamType;
        if (!injectionToken) {
          throw new Error(
            `Cannot resolve dependency for parameter ${index} of ${constructor.name} without a type or @Inject token.`
          );
        }
        const dependency = resolvingProvider.getService(injectionToken);
        if (dependency === null && injectionToken !== undefined) {
          // Kiểm tra null thay vì !dependency để cho phép inject giá trị falsy
          // Option: throw error if dependency is not found, or allow optional dependencies
          console.warn(
            `Could not resolve dependency for token "${String(injectionToken)}" (parameter ${index} of ${constructor.name}). Returning null.`
          );
          // throw new Error(`Failed to resolve dependency for token "${String(injectionToken)}" (parameter ${index} of ${constructor.name})`);
        }
        return dependency;
      });
      return new constructor(...params);
    }
    throw new Error(
      `Cannot create instance for service type: ${String(descriptor.serviceType)}`
    );
  }

  createScope(): IServiceProvider {
    // Scope mới kế thừa descriptors, nhưng có map scopedInstances riêng.
    // Nó trỏ về root provider (this.parentScopeProvider || this) để resolve singletons.
    return new DefaultServiceProvider(
      this.descriptors,
      this.parentScopeProvider || this
    );
  }
}

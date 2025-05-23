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
      if (this.parentScopeProvider) {
        return this.parentScopeProvider.getService(serviceType);
      }
      return null;
    }

    try {
      switch (descriptor.lifetime) {
        case ServiceLifetime.Singleton:
          const rootProvider = this.parentScopeProvider || this;
          // Sửa lỗi nhỏ: Phải getService từ rootProvider, không phải this.getService() nếu this là scope
          if (rootProvider === this) {
            // Nếu this là root provider
            if (!this.singletonInstances.has(serviceType)) {
              const instance = this.createInstance(descriptor, this);
              this.singletonInstances.set(serviceType, instance);
            }
            return this.singletonInstances.get(serviceType) as T;
          } else {
            // Nếu this là scope provider, delegate cho root
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
      const constructorFunc = descriptor.implementationType; // Đổi tên biến để tránh nhầm lẫn

      // SỬA LỖI QUAN TRỌNG: Kiểm tra metadata và số lượng tham số thực tế
      const actualParamsLength = constructorFunc.length;
      const designParamTypes: Constructor[] =
        Reflect.getMetadata("design:paramtypes", constructorFunc) || [];
      const injectedParamTokens: (Constructor | symbol | string)[] =
        Reflect.getOwnMetadata(INJECT_PARAMS_METADATA, constructorFunc) || [];

      // Nếu constructor có tham số nhưng không lấy được metadata kiểu
      // VÀ cũng không có đủ @Inject token, thì đó là lỗi
      if (
        actualParamsLength > 0 &&
        designParamTypes.length === 0 &&
        injectedParamTokens.filter((t) => t !== undefined).length <
          actualParamsLength
      ) {
        console.error(
          `DI Warning: Reflect.getMetadata("design:paramtypes", ${constructorFunc.name}) returned an empty array or insufficient types.`
        );
        console.error(
          `  This usually means 'emitDecoratorMetadata' is not true in tsconfig.json, 'reflect-metadata' is not imported early enough, or there's a circular dependency.`
        );
        console.error(
          `  Constructor for ${constructorFunc.name} expects ${actualParamsLength} arguments.`
        );
        // Ném lỗi ở đây nếu muốn chặt chẽ hơn, hoặc cố gắng tiếp tục nếu có injectedParamTokens
        // Hiện tại, chúng ta sẽ để vòng lặp map xử lý và ném lỗi nếu token không xác định được.
      }

      // Nếu designParamTypes rỗng nhưng constructor thực sự có tham số,
      // và không có đủ injectedParamTokens, chúng ta cần cẩn thận.
      // Logic hiện tại sẽ cố gắng resolve dựa trên injectedParamTokens trước, sau đó là designParamTypes.
      // Số lượng params cần resolve phải dựa trên số lượng tham số thực tế của constructor,
      // hoặc số lượng lớn nhất giữa designParamTypes và injectedParamTokens nếu có.
      // Tuy nhiên, nếu designParamTypes rỗng, việc map nó sẽ không làm gì cả.
      // Chúng ta cần một mảng để lặp có độ dài bằng số tham số thực tế của constructor.

      const params: any[] = [];
      for (let i = 0; i < actualParamsLength; i++) {
        const designParamType = designParamTypes[i]; // Có thể là undefined nếu designParamTypes rỗng
        const injectedToken = injectedParamTokens[i]; // Có thể là undefined
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
      return new constructorFunc(...params);
    }
    throw new Error(
      `Cannot create instance for service type: ${String(descriptor.serviceType)}`
    );
  }

  createScope(): IServiceProvider {
    return new DefaultServiceProvider(this.descriptors, this);
  }
}

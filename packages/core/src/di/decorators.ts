import "reflect-metadata";
import { ServiceLifetime } from "./service-lifetime.js";
import type { Constructor } from "../common/types.js";

/**
 * Metadata key for marking a class as injectable.
 */
export const INJECTABLE_METADATA = Symbol("Injectable");

/**
 * Metadata key for constructor parameter injection.
 */
export const INJECT_PARAMS_METADATA = Symbol("InjectParams");

/**
 * Metadata key for property injection.
 */
export const INJECT_PROPERTY_METADATA = Symbol("InjectProperty");

/**
 * Options for the Injectable decorator.
 */
export interface InjectableOptions {
  /**
   * The lifetime of the service (defaults to Transient).
   */
  lifetime?: ServiceLifetime;
  
  /**
   * Optional token to register the service as.
   * If not provided, the class itself will be used as the token.
   */
  token?: any;
}

/**
 * Marks a class as injectable, allowing it to be resolved through dependency injection.
 * @param options Options for configuring the injectable service
 */
export function Injectable(options?: InjectableOptions): ClassDecorator {
  return function (target: Function) {
    Reflect.defineMetadata(
      INJECTABLE_METADATA,
      options || { lifetime: ServiceLifetime.Transient },
      target
    );
  };
}

/**
 * Specifies the dependency to inject into a constructor parameter or property.
 * @param token The dependency token to inject
 */
export function Inject(token: any): ParameterDecorator & PropertyDecorator {
  return function (
    target: Object,
    propertyKey: string | symbol | undefined,
    parameterIndex?: number
  ) {
    if (typeof parameterIndex === "number") {
      // Constructor parameter injection
      const existingInjectedParams: any[] =
        Reflect.getOwnMetadata(INJECT_PARAMS_METADATA, target) || [];
      existingInjectedParams[parameterIndex] = token;
      Reflect.defineMetadata(
        INJECT_PARAMS_METADATA,
        existingInjectedParams,
        target
      );
    } else {
      // Property injection
      const properties: Record<string | symbol, any> =
        Reflect.getOwnMetadata(INJECT_PROPERTY_METADATA, target.constructor) ||
        {};
      properties[propertyKey!] = token;
      Reflect.defineMetadata(
        INJECT_PROPERTY_METADATA,
        properties,
        target.constructor
      );
    }
  };
}

/**
 * Decorator factory that allows a class to be registered with a specific lifetime.
 * @param lifetime The service lifetime
 */
export function Singleton(): ClassDecorator {
  return Injectable({ lifetime: ServiceLifetime.Singleton });
}

/**
 * Decorator factory that allows a class to be registered with Scoped lifetime.
 * @param lifetime The service lifetime
 */
export function Scoped(): ClassDecorator {
  return Injectable({ lifetime: ServiceLifetime.Scoped });
}

/**
 * Decorator factory that allows a class to be registered with Transient lifetime.
 * @param lifetime The service lifetime
 */
export function Transient(): ClassDecorator {
  return Injectable({ lifetime: ServiceLifetime.Transient });
}

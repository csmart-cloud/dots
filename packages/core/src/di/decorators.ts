import "reflect-metadata";
import { ServiceLifetime } from "./service-lifetime.js";

export const INJECTABLE_METADATA = Symbol("Injectable");
export const INJECT_PARAMS_METADATA = Symbol("InjectParams");
export const INJECT_PROPERTY_METADATA = Symbol("InjectProperty");

interface InjectableOptions {
  lifetime?: ServiceLifetime;
}
export function Injectable(options?: InjectableOptions): ClassDecorator {
  return function (target: Function) {
    Reflect.defineMetadata(
      INJECTABLE_METADATA,
      options || { lifetime: ServiceLifetime.Transient },
      target
    );
  };
}

export function Inject(token: any): ParameterDecorator & PropertyDecorator {
  return function (
    target: Object,
    propertyKey: string | symbol | undefined,
    parameterIndex?: number
  ) {
    if (typeof parameterIndex === "number") {
      const existingInjectedParams: any[] =
        Reflect.getOwnMetadata(INJECT_PARAMS_METADATA, target) || [];
      existingInjectedParams[parameterIndex] = token;
      Reflect.defineMetadata(
        INJECT_PARAMS_METADATA,
        existingInjectedParams,
        target
      );
    } else {
      const properties =
        Reflect.getOwnMetadata(INJECT_PROPERTY_METADATA, target.constructor) ||
        {};
      properties[propertyKey!] = token;
      Reflect.defineMetadata(
        INJECT_PROPERTY_METADATA,
        properties,
        target.constructor
      );
      console.warn(
        `@Inject for property ${String(propertyKey)} is noted, but property injection is not yet fully supported by DefaultServiceProvider.`
      );
    }
  };
}

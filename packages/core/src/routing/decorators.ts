import "reflect-metadata";
import { HttpMethod } from "../http/http-method.js";
import type { Constructor } from "../common/types.js";

export const ROUTE_PREFIX_METADATA = Symbol("RoutePrefix");
export const ACTION_ROUTES_METADATA = Symbol("ActionRoutes");
export const PARAM_BINDING_METADATA_KEY_PREFIX = "custom:route_param_bindings_";

export interface ActionRouteMetadata {
  path: string;
  method: HttpMethod;
  actionName: string;
}

export interface ParameterBindingMetadata {
  type:
    | "body"
    | "query"
    | "route"
    | "header"
    | "context"
    | "request"
    | "response"
    | "service";
  name?: string;
  paramIndex: number;
  paramType?: Constructor;
}

/**
 * Decorator để định nghĩa một controller với một tiền tố route (tùy chọn).
 * Tương tự [Route("[controller]")] hoặc [ApiController] trong ASP.NET Core.
 */
export function Controller(prefix: string = ""): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(ROUTE_PREFIX_METADATA, prefix, target);
  };
}

function createActionDecorator(
  method: HttpMethod,
  path: string = ""
): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const controllerConstructor = target.constructor;
    const existingRoutes: ActionRouteMetadata[] =
      Reflect.getOwnMetadata(ACTION_ROUTES_METADATA, controllerConstructor) ||
      [];

    existingRoutes.push({
      path,
      method,
      actionName: String(propertyKey),
    });
    Reflect.defineMetadata(
      ACTION_ROUTES_METADATA,
      existingRoutes,
      controllerConstructor
    );
  };
}

export function HttpGet(path: string = ""): MethodDecorator {
  return createActionDecorator(HttpMethod.GET, path);
}

export function HttpPost(path: string = ""): MethodDecorator {
  return createActionDecorator(HttpMethod.POST, path);
}

export function HttpPut(path: string = ""): MethodDecorator {
  return createActionDecorator(HttpMethod.PUT, path);
}

export function HttpDelete(path: string = ""): MethodDecorator {
  return createActionDecorator(HttpMethod.DELETE, path);
}

export function HttpPatch(path: string = ""): MethodDecorator {
  return createActionDecorator(HttpMethod.PATCH, path);
}

function createParameterBindingDecorator(
  bindingType: ParameterBindingMetadata["type"],
  name?: string
): ParameterDecorator {
  return (
    target: Object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) return; // Không áp dụng cho constructor của class

    const actionName = String(propertyKey);
    const metadataKey = `${PARAM_BINDING_METADATA_KEY_PREFIX}${actionName}`;

    const existingParamBindings: ParameterBindingMetadata[] =
      Reflect.getOwnMetadata(metadataKey, target.constructor) || [];
    const designParamTypes = Reflect.getMetadata(
      "design:paramtypes",
      target,
      propertyKey
    );

    existingParamBindings[parameterIndex] = {
      type: bindingType,
      name: name,
      paramIndex: parameterIndex,
      paramType: designParamTypes
        ? designParamTypes[parameterIndex]
        : undefined,
    };
    Reflect.defineMetadata(
      metadataKey,
      existingParamBindings,
      target.constructor
    );
  };
}

export function FromBody(): ParameterDecorator {
  return createParameterBindingDecorator("body");
}

export function FromQuery(queryParamName?: string): ParameterDecorator {
  return createParameterBindingDecorator("query", queryParamName);
}

export function FromRoute(routeParamName?: string): ParameterDecorator {
  return createParameterBindingDecorator("route", routeParamName);
}

export function FromHeader(headerName?: string): ParameterDecorator {
  return createParameterBindingDecorator("header", headerName);
}

// Decorators đặc biệt để inject các đối tượng của request pipeline
export function Context(): ParameterDecorator {
  return createParameterBindingDecorator("context");
}
export function Req(): ParameterDecorator {
  return createParameterBindingDecorator("request");
}
export function Res(): ParameterDecorator {
  return createParameterBindingDecorator("response");
}
// Decorator để inject service vào action method (ít phổ biến hơn constructor injection)
export function FromServices(token?: any): ParameterDecorator {
  return createParameterBindingDecorator("service", token);
}

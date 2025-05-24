import { type IHttpContext } from "../http/http-context.js";

/**
 * Represents a class constructor type with optional type parameter
 * @template T The instance type of the constructed object
 */
export type Constructor<T = any> = new (...args: any[]) => T;

/**
 * Represents a generic function type with specified arguments and return type
 * @template TArgs Array of argument types
 * @template TResult Return type of the function
 */
export type Func<TArgs extends any[], TResult> = (...args: TArgs) => TResult;

/**
 * Represents an asynchronous function that continues the middleware pipeline
 * Used in middleware to call the next middleware in the chain
 */
export type NextFunction = () => Promise<void>;

/**
 * Represents an HTTP middleware function that processes a request/response context
 * @param context The HTTP context containing request and response
 * @param next Function to invoke the next middleware in the chain
 */
export type Middleware = (
  context: IHttpContext,
  next: NextFunction
) => Promise<void>;

/**
 * Represents a type that can be either a value or a Promise of that value
 * @template T The type of the value
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * Extracts the return type of a function, unwrapping promises if necessary
 * @template T The function type
 */
export type UnwrappedReturnType<T extends (...args: any[]) => any> = T extends (...args: any[]) => Promise<infer R> ? R : ReturnType<T>;

/**
 * Represents a Dictionary/Record type with string keys and values of type T
 * @template T The type of the values
 */
export type Dictionary<T = any> = Record<string, T>;

/**
 * Makes all properties in T optional and nullable
 * @template T The type to transform
 */
export type Nullable<T> = { [P in keyof T]?: T[P] | null };

/**
 * Type for objects with any string keys
 */
export type AnyObject = { [key: string]: any };

/**
 * Type for simple primitive types
 */
export type Primitive = string | number | boolean | bigint | symbol | null | undefined;

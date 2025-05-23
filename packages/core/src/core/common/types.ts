import { IHttpContext } from "../../http/http-context.js";

export type Constructor<T = any> = new (...args: any[]) => T;
export type Func<TArgs extends any[], TResult> = (...args: TArgs) => TResult;
export type NextFunction = () => Promise<void>;
export type Middleware = (
  context: IHttpContext,
  next: NextFunction
) => Promise<void>;

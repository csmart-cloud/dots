import { HttpMethod } from "../http/http-method.js";
import type { IHttpContext } from "../http/http-context.js";
import type { Constructor } from "../common/types.js";

export interface IRouteHandler {
  (context: IHttpContext): Promise<any> | any;
}

export interface RouteData {
  method: HttpMethod;
  path: string; // Template path, e.g., /users/:id
  controller: Constructor;
  actionName: string; // Tên của method trong controller
  // Thêm metadata khác nếu cần (ví dụ: parameter binding info)
}

import { IHttpContext } from "../http/http-context";
import { HttpMethod } from "../http/http-method";
import { Constructor } from "../common/types";

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

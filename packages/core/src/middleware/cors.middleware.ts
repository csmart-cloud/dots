import { type IHttpContext } from "../http/http-context.js";
import { type NextFunction } from "../common/types.js";

export interface CorsOptions {
  origin?:
    | string
    | string[]
    | ((
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void
      ) => void)
    | true;
  methods?: string | string[]; // e.g., 'GET,HEAD,PUT,PATCH,POST,DELETE'
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

export function createCorsMiddleware(
  options?: CorsOptions
): (context: IHttpContext, next: NextFunction) => Promise<void> {
  const defaults: CorsOptions = {
    origin: "*", // Mặc định cho phép tất cả các origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization,X-Requested-With,Accept",
    optionsSuccessStatus: 204, // Some legacy browsers (IE11, various SmartTVs) choke on 204
  };

  const corsOptions = { ...defaults, ...options };

  return async (context: IHttpContext, next: NextFunction): Promise<void> => {
    const requestOrigin = context.request.headers["origin"] as
      | string
      | undefined;
    let originHeader = "";

    // Xử lý origin
    if (
      typeof corsOptions.origin === "boolean" &&
      corsOptions.origin === true
    ) {
      originHeader = "*";
    } else if (typeof corsOptions.origin === "string") {
      originHeader = corsOptions.origin;
    } else if (Array.isArray(corsOptions.origin)) {
      if (requestOrigin && corsOptions.origin.includes(requestOrigin)) {
        originHeader = requestOrigin;
      } else if (corsOptions.origin.includes("*")) {
        originHeader = "*";
      }
    } else if (typeof corsOptions.origin === "function") {
      // Xử lý origin function (nâng cao, tương tự thư viện 'cors' của Express)
      // Tạm thời, nếu là function, chúng ta sẽ cho phép origin hiện tại nếu có
      if (requestOrigin) originHeader = requestOrigin;
      else originHeader = "*"; // Hoặc một giá trị mặc định an toàn hơn
      // Để sử dụng callback style:
      // await new Promise<void>((resolve, reject) => {
      //   corsOptions.origin(requestOrigin, (err, allow) => {
      //     if (err) return reject(err);
      //     if (allow && requestOrigin) originHeader = requestOrigin;
      //     resolve();
      //   });
      // });
    }

    if (originHeader) {
      context.response.setHeader("Access-Control-Allow-Origin", originHeader);
    }

    if (corsOptions.credentials) {
      context.response.setHeader("Access-Control-Allow-Credentials", "true");
    }

    if (corsOptions.exposedHeaders) {
      context.response.setHeader(
        "Access-Control-Expose-Headers",
        Array.isArray(corsOptions.exposedHeaders)
          ? corsOptions.exposedHeaders.join(",")
          : corsOptions.exposedHeaders
      );
    }

    // Xử lý Preflight Request (OPTIONS)
    if (context.request.method === "OPTIONS") {
      if (corsOptions.methods) {
        context.response.setHeader(
          "Access-Control-Allow-Methods",
          Array.isArray(corsOptions.methods)
            ? corsOptions.methods.join(",")
            : corsOptions.methods
        );
      }
      if (corsOptions.allowedHeaders) {
        context.response.setHeader(
          "Access-Control-Allow-Headers",
          Array.isArray(corsOptions.allowedHeaders)
            ? corsOptions.allowedHeaders.join(",")
            : corsOptions.allowedHeaders
        );
      }
      if (corsOptions.maxAge !== undefined) {
        context.response.setHeader(
          "Access-Control-Max-Age",
          String(corsOptions.maxAge)
        );
      }

      if (corsOptions.preflightContinue) {
        return next();
      } else {
        context.response.statusCode = corsOptions.optionsSuccessStatus || 204;
        await context.response.send(); // Gửi response rỗng
        return;
      }
    }

    await next();
  };
}

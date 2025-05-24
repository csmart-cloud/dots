import { serve } from "@hono/node-server";
import { Hono, type Context as HonoContext } from "hono";
import {
  type IServiceCollection,
  DefaultServiceCollection,
} from "../di/service-collection.js";
import type { IHost } from "./host.js";
import {
  type IApplicationBuilder,
  DefaultApplicationBuilder,
} from "./application-builder.js";
import type { IHttpContext } from "../http/http-context.js";
import {
  DefaultServiceProvider,
  type IServiceProvider,
} from "../di/service-provider.js";
import type { Constructor } from "../common/types.js";
import type { IStartup } from "./startup.interface.js";

import {
  HonoHttpRequestAdapter,
  HonoHttpResponseAdapter,
} from "./hono-adapters.js";
import type { ControllerBase } from "../mvc/controller-base.js";
import { IMongoConnectionService } from "../database/mongoose/mongo-connection.service.js";
import { ILogger } from "../logging/logger.interface.js";

export interface IHostBuilder {
  configureServices(
    configureDelegate: (services: IServiceCollection) => void
  ): IHostBuilder;
  configure(
    configureApp: (
      app: IApplicationBuilder,
      hostServices: IServiceProvider
    ) => void
  ): IHostBuilder;
  build(): IHost;
  useStartup<TStartup extends IStartup>(
    startupClass: Constructor<TStartup>
  ): IHostBuilder;
  withStartupValidation(enabled: boolean): IHostBuilder;
}

export class DefaultHostBuilder implements IHostBuilder {
  private serviceCollection: IServiceCollection =
    new DefaultServiceCollection();
  private configureAppDelegates: ((
    app: IApplicationBuilder,
    hostServices: IServiceProvider
  ) => void)[] = [];
  private startupInstance?: IStartup;
  private startupValidationEnabled: boolean = true; // Thêm cờ cho validation. Mặc định là bật

  constructor() {}

  useStartup<TStartup extends IStartup>(
    startupClass: Constructor<TStartup>
  ): IHostBuilder {
    this.startupInstance = new startupClass();
    if (this.startupInstance.configureServices) {
      this.startupInstance.configureServices(this.serviceCollection);
    }
    return this;
  }

  withStartupValidation(enabled: boolean): IHostBuilder {
    this.startupValidationEnabled = enabled;
    return this;
  }

  configureServices(
    configureDelegate: (services: IServiceCollection) => void
  ): IHostBuilder {
    configureDelegate(this.serviceCollection);
    return this;
  }

  configure(
    configureApp: (
      app: IApplicationBuilder,
      hostServices: IServiceProvider
    ) => void
  ): IHostBuilder {
    this.configureAppDelegates.push(configureApp);
    return this;
  }

  build(): IHost {
    const rootServiceProvider = new DefaultServiceProvider(
      this.serviceCollection.getDescriptors()
    );
    const appBuilder = new DefaultApplicationBuilder(rootServiceProvider);

    let controllersToValidate: Constructor<ControllerBase>[] = [];

    if (this.startupInstance && this.startupInstance.configure) {
      const result = this.startupInstance.configure(
        appBuilder,
        rootServiceProvider
      );
      if (Array.isArray(result)) {
        controllersToValidate = result;
      }
    }
    this.configureAppDelegates.forEach((delegate) =>
      delegate(appBuilder, rootServiceProvider)
    );

    if (this.startupValidationEnabled && controllersToValidate.length > 0) {
      console.log("Performing startup DI validation...");
      try {
        // Tạo một scope tạm thời để resolve các service scoped (như controllers)
        const validationScope = rootServiceProvider.createScope();
        controllersToValidate.forEach((controller) => {
          console.log(`  - Validating controller: ${controller.name}`);
          const instance = validationScope.getService(controller);
          if (!instance) {
            // Mặc dù getService sẽ ném lỗi trước đó, đây là một bước kiểm tra dự phòng
            throw new Error(
              `Failed to resolve controller "${controller.name}". It might not be registered correctly.`
            );
          }
        });
        console.log(
          "DI validation successful. All controllers and their dependencies can be resolved."
        );
      } catch (error) {
        console.error("DI validation failed. Application will not start.");
        // Ném lỗi ra ngoài để dừng hoàn toàn quá trình khởi động
        throw error;
      }
    } else if (this.startupValidationEnabled) {
      console.warn(
        "Startup DI validation is enabled, but no controllers were provided for validation from Startup.configure()."
      );
    }

    const coreRequestHandler = appBuilder.build();
    const honoApp = new Hono();

    honoApp.use("*", async (c: HonoContext) => {
      // Không dùng honoNext ở đây, pipeline của chúng ta sẽ xử lý hoặc trả 404
      const requestScopeProvider = rootServiceProvider.createScope();

      const adaptedRequest = new HonoHttpRequestAdapter(c);
      await adaptedRequest.parseBody();

      const adaptedResponse = new HonoHttpResponseAdapter(c);

      const httpContext: IHttpContext = {
        request: adaptedRequest,
        response: adaptedResponse,
        services: requestScopeProvider,
        honoContext: c,
      };

      try {
        await coreRequestHandler(httpContext);
        // SỬA LỖI #5, #6: Dùng cờ isSent thay cho headersSent.
        // Nếu response chưa được gửi bởi pipeline, Hono sẽ tự động xử lý (thường là trả 404).
        if (!httpContext.response.isSent) {
          console.log("Response not sent by pipeline. Letting Hono handle it.");
          // Hono sẽ tự động xử lý not found nếu không có handler nào trả về response.
          // Không cần làm gì thêm ở đây.
        }
      } catch (error) {
        console.error("Unhandled error in pipeline:", error);
        if (!httpContext.response.isSent) {
          c.status(500);
          return c.text("Internal Server Error from Host");
        }
      }
      // Trả về c.res để Hono biết response đã được xử lý
      return c.res;
    });

    let serverInstance: any;

    const nodeHttpHost: IHost = {
      services: rootServiceProvider,
      start: async () => {
        // Kết nối MongoDB khi host start
        const mongoService =
          rootServiceProvider.getService<IMongoConnectionService>(
            IMongoConnectionService
          );
        if (mongoService) {
          try {
            await mongoService.connect();
          } catch (dbError) {
            const logger = rootServiceProvider.getService<ILogger>(ILogger);
            logger?.error(
              "Failed to connect to MongoDB during host startup. Application might not function correctly.",
              dbError
            );
            // Quyết định có nên dừng ứng dụng ở đây không tùy thuộc vào yêu cầu
            // throw dbError; // Ném lỗi để dừng hoàn toàn nếu DB là bắt buộc
          }
        } else {
          const logger = rootServiceProvider.getService<ILogger>(ILogger);
          logger?.warn(
            "MongoConnectionService not found in DI container. MongoDB will not be connected."
          );
        }

        const port = Number(process.env.PORT) || 5000;
        serverInstance = serve(
          {
            fetch: honoApp.fetch,
            port: port,
          },
          (info) => {
            console.log(`Host is running on http://localhost:${info.port}`);
          }
        );
      },
      stop: async () => {
        console.log("Host is stopping...");
        if (
          serverInstance &&
          typeof (serverInstance as any).close === "function"
        ) {
          await (serverInstance as any).close();
          console.log("Server stopped.");
        }
      },
    };
    return nodeHttpHost;
  }
}

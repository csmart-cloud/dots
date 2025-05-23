import {
  IServiceCollection,
  DefaultServiceCollection,
} from "../di/service-collection";
import { IHost } from "./host";
import {
  IApplicationBuilder,
  DefaultApplicationBuilder,
} from "./application-builder";
import { IHttpContext } from "../http/http-context";
import {
  DefaultServiceProvider,
  IServiceProvider,
} from "../di/service-provider";
import { Constructor } from "../common/types";
import { IStartup } from "./startup.interface";

import { Hono, Context as HonoContext } from "hono";
import { serve } from "@hono/node-server";
import {
  HonoHttpRequestAdapter,
  HonoHttpResponseAdapter,
} from "./hono-adapters";

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
}

export class DefaultHostBuilder implements IHostBuilder {
  private serviceCollection: IServiceCollection =
    new DefaultServiceCollection();
  private configureAppDelegates: ((
    app: IApplicationBuilder,
    hostServices: IServiceProvider
  ) => void)[] = [];
  private startupInstance?: IStartup;

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

    if (this.startupInstance && this.startupInstance.configure) {
      this.startupInstance.configure(appBuilder, rootServiceProvider);
    }
    this.configureAppDelegates.forEach((delegate) =>
      delegate(appBuilder, rootServiceProvider)
    );

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
          // Hono sẽ tự động xử lý not found nếu không có handler nào trả về response.
          // Không cần làm gì thêm ở đây.
        }
      } catch (error) {
        console.error("Unhandled error in CoreTSApiFramework pipeline:", error);
        if (!httpContext.response.isSent) {
          c.status(500);
          return c.text("Internal Server Error from CoreTSApiFramework Host");
        }
      }
      // Trả về c.res để Hono biết response đã được xử lý
      return c.res;
    });

    let serverInstance: any;

    const nodeHttpHost: IHost = {
      services: rootServiceProvider,
      start: async () => {
        const port = Number(process.env.PORT) || 3000;
        serverInstance = serve(
          {
            fetch: honoApp.fetch,
            port: port,
          },
          (info) => {
            console.log(
              `CoreTSApiFramework Host (Hono) is running on http://localhost:${info.port}`
            );
          }
        );
      },
      stop: async () => {
        console.log("CoreTSApiFramework Host (Hono) is stopping...");
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

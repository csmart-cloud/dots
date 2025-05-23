import {
  type IStartup,
  type IServiceCollection,
  type IApplicationBuilder,
  type IServiceProvider,
  DefaultHostBuilder,
} from "@dots/core";
import { IdentityService } from "./services/identity.service.js";

class Startup implements IStartup {
  configureServices(services: IServiceCollection): void {
    console.log("Startup: Configuring services...");
    // Register services and controllers
    // ITodoService is a symbol, TodoService is the concrete class
    services.addScoped(IdentityService, IdentityService);

    // Controllers are typically Scoped or Transient
    // services.addScoped(TodosController, TodosController);
    // services.addScoped(HomeController, HomeController);
    console.log("Startup: Services configured.");
  }

  configure(app: IApplicationBuilder, hostServices: IServiceProvider): void {
    console.log("Startup: Configuring application pipeline...");
    // Example of a simple logging middleware
    app.use(async (context, next) => {
      const start = Date.now();
      console.log(
        `[REQ] ${context.request.method} ${context.request.path} - Incoming`
      );
      await next(); // Call the next middleware or router
      const duration = Date.now() - start;
      console.log(
        `[RES] ${context.request.method} ${context.request.path} - Status: ${context.response.statusCode} (${duration}ms)`
      );
    });

    // Register controllers for routing
    // app.useRouting([TodosController, HomeController]);
    console.log("Startup: Application pipeline configured.");
  }
}

async function bootstrap() {
  console.log("Application bootstrapping...");
  const host = new DefaultHostBuilder()
    .useStartup(Startup) // Register the Startup class
    .build();

  await host.start(); // Start the Hono server
  console.log("Application started successfully. Press Ctrl+C to stop.");
}

bootstrap().catch((error) => {
  console.error("Failed to bootstrap the application:", error);
  process.exit(1);
});

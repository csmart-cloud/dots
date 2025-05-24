// Common Types
export * from "./common/types.js";

// Configuration System
export * from "./configuration/configuration.interface.js";
export * from "./configuration/configuration-builder.js";
export * from "./configuration/configuration-provider.js";
export * from "./configuration/configuration-root.js";
export * from "./configuration/configuration-section.js";
export * from "./configuration/sources/configuration-source.interface.js";
export * from "./configuration/sources/environment-variables-source.js";
export * from "./configuration/sources/json-configuration-source.js";
export * from "./configuration/sources/memory-configuration-source.js";

// Database
export * from "./database/mongoose/mongo-connection.service.js";
export * from "./database/mongoose/mongoose.types.js";

// Dependency Injection
export * from "./di/decorators.js";
export * from "./di/service-collection.js";
export * from "./di/service-descriptor.js";
export * from "./di/service-lifetime.js";
export * from "./di/service-provider.js";

// Hosting & Application Lifecycle
export * from "./hosting/application-builder.js";
export * from "./hosting/hono-adapters.js";
export * from "./hosting/host-builder.js";
export * from "./hosting/host.js";
export * from "./hosting/startup.interface.js";
export * from "./hosting/environment.js";
export * from "./hosting/generic-host.js";
export * from "./hosting/generic-host-builder.js";
// Re-export host environment types with explicit names to avoid conflicts
export { HostEnvironment as HostingEnvironment, EnvironmentName } from "./hosting/host-environment.js";
export type { IHostEnvironment as IHostingEnvironment } from "./hosting/host-environment.js";
export * from "./hosting/hosted-service.interface.js";
export * from "./hosting/hosted-service-manager.js";

// HTTP
export * from "./http/http-context.js";
export * from "./http/http-method.js";
export * from "./http/http-request.js";
export * from "./http/http-response.js";
// Re-export middleware types with explicit imports to avoid conflicts
export { 
  createApplicationBuilder,
  ApplicationBuilder,
  createBranchMiddleware,
  createDelegateMiddleware,
  createMapMiddleware,
  PassThroughMiddleware,
  type RequestDelegate,
  type MiddlewareConfigureDelegate,
  type IMiddlewareFactory
} from "./http/middleware.js";
export type { IApplicationBuilder as IHttpApplicationBuilder } from "./http/middleware.js";

// Export middleware extensions
export * from "./http/middleware-extensions.js";

// Logging
export * from "./logging/logger.interface.js";
export * from "./logging/winston.config.js";

// MVC Pattern
export * from "./mvc/action-results.js";
export * from "./mvc/controller-base.js";
export * from "./mvc/mvc-middleware.js";

// Options Pattern
export * from "./options/options.interface.js";
export * from "./options/options.js";
export * from "./options/options-configuration-binding.js";
export * from "./options/options-service-collection-extensions.js";

// Health Checks
export * from "./health-checks/health-check.interface.js";
export * from "./health-checks/health-checks-service.js";
export * from "./health-checks/health-checks-middleware.js";
export * from "./health-checks/health-checks-service-collection-extensions.js";
export * from "./health-checks/built-in-health-checks.js";

// Routing
// Re-export routing decorators with explicit imports to avoid conflicts
export {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  HttpOptions,
  Head,
  Route,
  HttpMethodRoute,
  FromBody,
  FromQuery,
  FromRoute,
  FromHeader,
  Context,
  Request,
  Response,
  ServiceParam,
  HttpGet,
  HttpPost,
  HttpPut,
  HttpDelete,
  HttpPatch,
  // Export interfaces
} from "./routing/decorators.js";
export type {
  ActionRouteMetadata,
  RouteOptions,
  ParameterBindingMetadata
} from "./routing/decorators.js";
export * from "./routing/routing-interfaces.js";

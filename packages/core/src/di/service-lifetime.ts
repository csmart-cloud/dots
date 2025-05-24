/**
 * Defines the lifetime of a service in the DI container.
 * Similar to ServiceLifetime in Microsoft.Extensions.DependencyInjection.
 */
export enum ServiceLifetime {
  /**
   * A single instance for the entire application lifetime.
   * The service is created the first time it's requested and then reused for all subsequent requests.
   */
  Singleton = 0,
  
  /**
   * A new instance for each scope (e.g., per HTTP request).
   * Within the same scope, the same instance is returned for all requests.
   */
  Scoped = 1,
  
  /**
   * A new instance each time the service is requested.
   * This is useful for lightweight, stateless services.
   */
  Transient = 2
}

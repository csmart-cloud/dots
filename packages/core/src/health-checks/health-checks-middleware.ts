import type { Middleware } from "../common/types.js";
import type { IHttpContext } from "../http/http-context.js";
import { HealthStatus } from "./health-check.interface.js";
import type { IHealthChecksService } from "./health-checks-service.js";

/**
 * Options for the health checks middleware
 */
export interface HealthChecksOptions {
  /**
   * Gets or sets the path where the health check middleware will respond
   * Default: "/health"
   */
  path?: string;
  
  /**
   * Gets or sets a predicate that is used to filter health checks
   */
  predicate?: (registrationName: string, tags: string[]) => boolean;
  
  /**
   * Gets or sets a value indicating whether or not to write detailed health check information in the response
   * Default: false
   */
  detailed?: boolean;
  
  /**
   * Gets or sets the status codes that will be used for responses
   */
  resultStatusCodes?: {
    /**
     * The status code to use for Healthy results (default: 200)
     */
    healthy?: number;
    
    /**
     * The status code to use for Degraded results (default: 200)
     */
    degraded?: number;
    
    /**
     * The status code to use for Unhealthy results (default: 503)
     */
    unhealthy?: number;
  };
}

/**
 * The default options for the health checks middleware
 */
const defaultOptions: HealthChecksOptions = {
  path: "/health",
  detailed: false,
  resultStatusCodes: {
    healthy: 200,
    degraded: 200,
    unhealthy: 503
  }
};

/**
 * Creates middleware for handling health check requests
 * @param healthChecksService The health checks service
 * @param options Options for customizing the middleware behavior
 */
export function createHealthChecksMiddleware(
  healthChecksService: IHealthChecksService,
  options: HealthChecksOptions = {}
): Middleware {
  const resolvedOptions = { ...defaultOptions, ...options };
  const path = resolvedOptions.path || "/health";
  
  return async (context: IHttpContext, next: () => Promise<void>) => {
    // Only process requests to the health check path
    if (context.request.path.toLowerCase() !== path.toLowerCase()) {
      return next();
    }
    
    // Perform health checks
    const report = await healthChecksService.checkHealthAsync();
    
    // Determine status code based on health status
    let statusCode: number;
    switch (report.status) {
      case HealthStatus.Healthy:
        statusCode = resolvedOptions.resultStatusCodes?.healthy || 200;
        break;
      case HealthStatus.Degraded:
        statusCode = resolvedOptions.resultStatusCodes?.degraded || 200;
        break;
      case HealthStatus.Unhealthy:
        statusCode = resolvedOptions.resultStatusCodes?.unhealthy || 503;
        break;
      default:
        statusCode = 500;
    }
    
    context.response.statusCode = statusCode;
    
    // Format response based on detailed flag
    if (resolvedOptions.detailed) {
      // Detailed response with all entries
      await context.response.json({
        status: HealthStatus[report.status],
        totalDuration: `${report.totalDuration}ms`,
        entries: Object.entries(report.entries).reduce((acc, [name, entry]) => {
          acc[name] = {
            status: HealthStatus[entry.status],
            duration: `${entry.duration}ms`,
            description: entry.description,
            data: entry.data,
            tags: entry.tags,
            error: entry.exception?.message
          };
          return acc;
        }, {} as Record<string, any>)
      });
    } else {
      // Simple response with just status
      await context.response.json({
        status: HealthStatus[report.status]
      });
    }
  };
}

/**
 * Represents the result of a health check
 */
export enum HealthStatus {
  /**
   * The component is healthy
   */
  Healthy = 0,
  
  /**
   * The component is degraded but still functioning
   */
  Degraded = 1,
  
  /**
   * The component is unhealthy
   */
  Unhealthy = 2
}

/**
 * Health check context passed to health checks during execution
 */
export interface HealthCheckContext {
  /**
   * Gets the registration information for the health check
   */
  readonly registration: HealthCheckRegistration;
}

/**
 * Represents the result of a health check execution
 */
export interface HealthCheckResult {
  /**
   * Gets the health check status
   */
  readonly status: HealthStatus;
  
  /**
   * Gets a description of the health check result
   */
  readonly description?: string;
  
  /**
   * Gets the exception that was thrown when checking for health (if any)
   */
  readonly exception?: Error;
  
  /**
   * Gets additional data about the health check
   */
  readonly data: Record<string, any>;
}

/**
 * Interface for a health check that can be executed to determine health status
 */
export interface IHealthCheck {
  /**
   * Executes the health check
   * @param context The health check context
   * @returns The result of the health check
   */
  checkHealth(context: HealthCheckContext): Promise<HealthCheckResult>;
}

/**
 * Registration information for a health check
 */
export interface HealthCheckRegistration {
  /**
   * Gets the health check name
   */
  readonly name: string;
  
  /**
   * Gets the health check instance
   */
  readonly healthCheck: IHealthCheck;
  
  /**
   * Gets the tags associated with this health check
   */
  readonly tags: string[];
  
  /**
   * Gets the failure status to use when the health check fails
   */
  readonly failureStatus: HealthStatus;
}

/**
 * Factory for creating health check registrations
 */
export function registerHealthCheck(
  name: string,
  healthCheck: IHealthCheck,
  failureStatus: HealthStatus = HealthStatus.Unhealthy,
  tags: string[] = []
): HealthCheckRegistration {
  return {
    name,
    healthCheck,
    failureStatus,
    tags
  };
}

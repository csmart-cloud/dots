import {
  HealthStatus,
  type HealthCheckContext,
  type HealthCheckRegistration,
  type HealthCheckResult,
  type IHealthCheck
} from "./health-check.interface.js";

/**
 * Service that manages and executes health checks
 */
export interface IHealthChecksService {
  /**
   * Adds a health check to the service
   * @param registration The health check registration
   */
  addHealthCheck(registration: HealthCheckRegistration): IHealthChecksService;
  
  /**
   * Checks the health of all registered components
   * @returns The results of all health checks
   */
  checkHealthAsync(): Promise<HealthReport>;
}

/**
 * Report containing the results of executing a series of health checks
 */
export interface HealthReport {
  /**
   * Gets the overall status of the health checks
   */
  readonly status: HealthStatus;
  
  /**
   * Gets the results of the health checks, indexed by name
   */
  readonly entries: Record<string, HealthReportEntry>;
  
  /**
   * Gets the total duration of all checks in milliseconds
   */
  readonly totalDuration: number;
}

/**
 * A single entry in a health report
 */
export interface HealthReportEntry {
  /**
   * Gets the health check status
   */
  readonly status: HealthStatus;
  
  /**
   * Gets a description of the health check result
   */
  readonly description?: string;
  
  /**
   * Gets the duration of the check in milliseconds
   */
  readonly duration: number;
  
  /**
   * Gets the exception that was thrown when checking for health (if any)
   */
  readonly exception?: Error;
  
  /**
   * Gets additional data about the health check
   */
  readonly data: Record<string, any>;
  
  /**
   * Gets the tags associated with this health check
   */
  readonly tags: string[];
}

/**
 * Default implementation of IHealthChecksService
 */
export class DefaultHealthChecksService implements IHealthChecksService {
  private readonly registrations: HealthCheckRegistration[] = [];
  
  /**
   * Adds a health check to the service
   * @param registration The health check registration
   */
  public addHealthCheck(registration: HealthCheckRegistration): IHealthChecksService {
    this.registrations.push(registration);
    return this;
  }
  
  /**
   * Checks the health of all registered components
   * @returns The results of all health checks
   */
  public async checkHealthAsync(): Promise<HealthReport> {
    const entries: Record<string, HealthReportEntry> = {};
    let totalStatus = HealthStatus.Healthy;
    const startTime = Date.now();
    
    await Promise.all(
      this.registrations.map(async (registration) => {
        const entryStartTime = Date.now();
        let healthCheckResult: HealthCheckResult;
        
        try {
          const context: HealthCheckContext = {
            registration
          };
          
          healthCheckResult = await registration.healthCheck.checkHealth(context);
        } catch (error) {
          healthCheckResult = {
            status: registration.failureStatus,
            exception: error as Error,
            data: {},
            description: `Exception during health check: ${(error as Error).message}`
          };
        }
        
        const duration = Date.now() - entryStartTime;
        
        const entry: HealthReportEntry = {
          status: healthCheckResult.status,
          description: healthCheckResult.description,
          duration,
          exception: healthCheckResult.exception,
          data: healthCheckResult.data,
          tags: registration.tags
        };
        
        // Update overall status (worst case wins)
        if (entry.status > totalStatus) {
          totalStatus = entry.status;
        }
        
        entries[registration.name] = entry;
      })
    );
    
    const totalDuration = Date.now() - startTime;
    
    return {
      status: totalStatus,
      entries,
      totalDuration
    };
  }
}

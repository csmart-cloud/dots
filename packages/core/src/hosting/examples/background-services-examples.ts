/**
 * Example implementations of background services using the hosted service framework.
 * These examples demonstrate how to implement different types of background tasks.
 */

import { ILogger } from "../../logging/logger.interface.js";
import type { IConfiguration } from "../../configuration/configuration.interface.js";
import { TimedBackgroundService, BackgroundService } from "../hosted-service.interface.js";

/**
 * A simple background service that logs a message every few seconds.
 */
export class HeartbeatService extends TimedBackgroundService {
  private readonly _logger: ILogger;
  private _counter: number = 0;

  /**
   * Creates a new instance of HeartbeatService.
   * @param logger The logger service
   * @param heartbeatInterval The interval in milliseconds between heartbeats
   */
  constructor(logger: ILogger, heartbeatInterval: number = 10000) {
    super(heartbeatInterval);
    this._logger = logger;
  }

  /**
   * The work to perform on each tick.
   */
  protected async doWorkAsync(): Promise<void> {
    this._counter++;
    this._logger.info(`Heartbeat #${this._counter} at ${new Date().toISOString()}`);
  }
}

/**
 * A background service that monitors system metrics and logs them.
 */
export class SystemMonitorService extends TimedBackgroundService {
  private readonly _logger: ILogger;
  private readonly _configuration: IConfiguration;

  /**
   * Creates a new instance of SystemMonitorService.
   * @param logger The logger service
   * @param configuration The configuration service
   */
  constructor(logger: ILogger, configuration: IConfiguration) {
    // Get the interval from configuration or use default
    const interval = parseInt(configuration.get('SystemMonitor:Interval') || '60000', 10);
    super(interval);
    
    this._logger = logger;
    this._configuration = configuration;
  }

  /**
   * The work to perform on each tick.
   */
  protected async doWorkAsync(): Promise<void> {
    const memoryUsage = process.memoryUsage();
    
    this._logger.info('System Monitor Report', {
      timestamp: new Date().toISOString(),
      metrics: {
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
        },
        uptime: `${Math.round(process.uptime())} seconds`,
      }
    });
    
    // Dynamically adjust the interval based on configuration (if changed)
    const newInterval = parseInt(this._configuration.get('SystemMonitor:Interval') || '60000', 10);
    if (newInterval !== this.interval) {
      this._logger.info(`Adjusting SystemMonitorService interval from ${this.interval}ms to ${newInterval}ms`);
      this.interval = newInterval;
    }
  }
}

/**
 * A background service that performs database maintenance tasks.
 */
export class DatabaseMaintenanceService extends BackgroundService {
  private readonly _logger: ILogger;
  private readonly _configuration: IConfiguration;
  private _timer?: NodeJS.Timeout;

  /**
   * Creates a new instance of DatabaseMaintenanceService.
   * @param logger The logger service
   * @param configuration The configuration service
   */
  constructor(logger: ILogger, configuration: IConfiguration) {
    super();
    this._logger = logger;
    this._configuration = configuration;
  }

  /**
   * Executes the background service.
   */
  protected async executeAsync(): Promise<void> {
    // Get the schedule time from configuration
    const scheduleTime = this._configuration.get('DatabaseMaintenance:ScheduleTime') || '03:00';
    this._logger.info(`Database maintenance scheduled for ${scheduleTime} daily`);
    
    while (!this.stopRequested) {
      try {
        // Calculate time until next run
        const nextRunTime = this.calculateNextRunTime(scheduleTime);
        const waitTime = nextRunTime.getTime() - Date.now();
        
        this._logger.info(`Next database maintenance scheduled in ${Math.round(waitTime / 1000 / 60)} minutes`);
        
        // Wait until the scheduled time
        await new Promise<void>((resolve) => {
          this._timer = setTimeout(() => {
            resolve();
          }, waitTime);
        });
        
        if (this.stopRequested) break;
        
        // Perform the maintenance
        await this.performMaintenanceAsync();
      } catch (error) {
        this._logger.error('Error in database maintenance service:', error);
        
        // Wait a bit before retrying in case of error
        await new Promise<void>((resolve) => {
          this._timer = setTimeout(() => {
            resolve();
          }, 60000); // 1 minute
        });
      }
    }
    
    if (this._timer) {
      clearTimeout(this._timer);
    }
  }
  
  /**
   * Performs the database maintenance tasks.
   */
  private async performMaintenanceAsync(): Promise<void> {
    this._logger.info('Starting database maintenance...');
    
    // Simulate some maintenance tasks
    await this.simulateTask('Vacuum database', 2000);
    await this.simulateTask('Clean up expired data', 1500);
    await this.simulateTask('Optimize indexes', 3000);
    
    this._logger.info('Database maintenance completed successfully');
  }
  
  /**
   * Simulates a maintenance task with a delay.
   * @param taskName The name of the task
   * @param duration The duration in milliseconds
   */
  private async simulateTask(taskName: string, duration: number): Promise<void> {
    this._logger.info(`Performing task: ${taskName}`);
    await new Promise<void>((resolve) => setTimeout(resolve, duration));
    this._logger.info(`Completed task: ${taskName}`);
  }
  
  /**
   * Calculates the next run time based on the scheduled time.
   * @param scheduleTime The scheduled time in HH:MM format
   * @returns The next run time
   */
  private calculateNextRunTime(scheduleTime: string): Date {
    const [hours, minutes] = scheduleTime.split(':').map(Number);
    const now = new Date();
    const nextRun = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0,
      0
    );
    
    // If the scheduled time has already passed today, schedule for tomorrow
    if (nextRun.getTime() <= now.getTime()) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    return nextRun;
  }
  
  /**
   * Stops the background service.
   */
  async stopAsync(): Promise<void> {
    this._logger.info('Stopping database maintenance service...');
    this.stopRequested = true;
    
    if (this._timer) {
      clearTimeout(this._timer);
    }
    
    if (this.executeTask) {
      await this.executeTask;
    }
    
    this._logger.info('Database maintenance service stopped');
  }
}

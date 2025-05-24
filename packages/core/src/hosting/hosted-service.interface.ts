/**
 * Interface for a service that is started and stopped with the application.
 * Similar to ASP.NET Core's IHostedService interface.
 */
export interface IHostedService {
  /**
   * Triggered when the application host is ready to start the service.
   * @returns A Promise that represents the asynchronous start operation.
   */
  startAsync(): Promise<void>;

  /**
   * Triggered when the application host is performing a graceful shutdown.
   * @returns A Promise that represents the asynchronous stop operation.
   */
  stopAsync(): Promise<void>;
}

/**
 * Base class for implementing a hosted service.
 * Provides empty implementations of startAsync and stopAsync methods.
 */
export abstract class BackgroundService implements IHostedService {
  /**
   * Triggered when the application host is ready to start the service.
   * @returns A Promise that represents the asynchronous start operation.
   */
  async startAsync(): Promise<void> {
    await this.executeAsync();
  }

  /**
   * Triggered when the application host is performing a graceful shutdown.
   * @returns A Promise that represents the asynchronous stop operation.
   */
  async stopAsync(): Promise<void> {
    this.stopRequested = true;
    if (this.executeTask) {
      await this.executeTask;
    }
  }

  /**
   * Gets a value indicating whether stop was requested.
   */
  protected stopRequested: boolean = false;

  /**
   * The task representing the execution of the background service.
   */
  protected executeTask?: Promise<void>;

  /**
   * This method is called when the IHostedService starts.
   * The implementation should return a task that represents the lifetime of the long-running operation(s).
   */
  protected abstract executeAsync(): Promise<void>;
}

/**
 * Base class for implementing a background task that runs periodically.
 */
export abstract class TimedBackgroundService extends BackgroundService {
  private _interval: number;
  private _timer?: NodeJS.Timeout;

  /**
   * Creates a new instance of TimedBackgroundService.
   * @param interval The interval in milliseconds at which to run the task.
   */
  constructor(interval: number) {
    super();
    this._interval = interval;
  }

  /**
   * Runs the background task according to the specified interval.
   */
  protected async executeAsync(): Promise<void> {
    await this.doWorkAsync();

    // Create a self-cancelling loop
    while (!this.stopRequested) {
      this.executeTask = new Promise<void>((resolve) => {
        this._timer = setTimeout(async () => {
          if (!this.stopRequested) {
            try {
              await this.doWorkAsync();
            } catch (error) {
              console.error('Error in timed background service:', error);
            }
          }
          resolve();
        }, this._interval);
      });

      await this.executeTask;
    }

    if (this._timer) {
      clearTimeout(this._timer);
    }
  }

  /**
   * The work to perform on each tick.
   */
  protected abstract doWorkAsync(): Promise<void>;

  /**
   * Override to change the interval at runtime.
   */
  protected set interval(value: number) {
    this._interval = value;
  }

  /**
   * Gets the current interval.
   */
  protected get interval(): number {
    return this._interval;
  }
}

/**
 * Extension methods for IServiceCollection to add hosted services.
 */
export class HostedServiceExtensions {
  /**
   * Adds a hosted service of the specified type to the service collection.
   * @param services The service collection to add the hosted service to.
   * @param hostedServiceType The type of the hosted service to add.
   */
  public static addHostedService<T extends IHostedService>(
    services: any, // IServiceCollection
    hostedServiceType: any // Constructor<T>
  ): any {
    // Register the hosted service
    services.addSingleton(hostedServiceType);
    
    // Register the hosted service as IHostedService
    services.addSingleton(IHostedService, (sp: any) => sp.getRequiredService(hostedServiceType));
    
    return services;
  }
}

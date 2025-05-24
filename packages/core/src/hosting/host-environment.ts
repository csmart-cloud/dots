/**
 * Provides information about the hosting environment an application is running in.
 * Similar to ASP.NET Core's IHostingEnvironment interface.
 */

/**
 * Defines common environment names used in hosting.
 */
export enum EnvironmentName {
  Development = 'Development',
  Staging = 'Staging',
  Production = 'Production',
  Test = 'Test'
}

/**
 * Interface for providing information about the hosting environment.
 */
export interface IHostEnvironment {
  /**
   * Gets the name of the environment. This is typically set to 'Development', 'Staging', or 'Production'.
   */
  environmentName: string;

  /**
   * Gets the name of the application.
   */
  applicationName: string;

  /**
   * Gets the absolute path to the directory that contains application content files.
   */
  contentRootPath: string;

  /**
   * Checks if the current host environment name is the specified environment.
   * @param envName The environment name to check
   */
  isEnvironment(envName: string): boolean;

  /**
   * Checks if the current host environment name is 'Development'.
   */
  isDevelopment(): boolean;

  /**
   * Checks if the current host environment name is 'Staging'.
   */
  isStaging(): boolean;

  /**
   * Checks if the current host environment name is 'Production'.
   */
  isProduction(): boolean;
}

/**
 * Default implementation of IHostEnvironment.
 */
export class HostEnvironment implements IHostEnvironment {
  private _environmentName: string;
  private _applicationName: string;
  private _contentRootPath: string;

  /**
   * Creates a new instance of HostEnvironment.
   * @param environmentName The name of the environment
   * @param applicationName The name of the application
   * @param contentRootPath The absolute path to the content root
   */
  constructor(
    environmentName: string = process.env.NODE_ENV || EnvironmentName.Production,
    applicationName: string = process.env.APP_NAME || 'Application',
    contentRootPath: string = process.cwd()
  ) {
    this._environmentName = environmentName;
    this._applicationName = applicationName;
    this._contentRootPath = contentRootPath;
  }

  /**
   * Gets the name of the environment. This is typically set to 'Development', 'Staging', or 'Production'.
   */
  get environmentName(): string {
    return this._environmentName;
  }

  /**
   * Sets the name of the environment.
   */
  set environmentName(value: string) {
    this._environmentName = value;
  }

  /**
   * Gets the name of the application.
   */
  get applicationName(): string {
    return this._applicationName;
  }

  /**
   * Sets the name of the application.
   */
  set applicationName(value: string) {
    this._applicationName = value;
  }

  /**
   * Gets the absolute path to the directory that contains application content files.
   */
  get contentRootPath(): string {
    return this._contentRootPath;
  }

  /**
   * Sets the absolute path to the directory that contains application content files.
   */
  set contentRootPath(value: string) {
    this._contentRootPath = value;
  }

  /**
   * Checks if the current host environment name is the specified environment.
   * @param envName The environment name to check
   */
  isEnvironment(envName: string): boolean {
    return this._environmentName.toLowerCase() === envName.toLowerCase();
  }

  /**
   * Checks if the current host environment name is 'Development'.
   */
  isDevelopment(): boolean {
    return this.isEnvironment(EnvironmentName.Development);
  }

  /**
   * Checks if the current host environment name is 'Staging'.
   */
  isStaging(): boolean {
    return this.isEnvironment(EnvironmentName.Staging);
  }

  /**
   * Checks if the current host environment name is 'Production'.
   */
  isProduction(): boolean {
    return this.isEnvironment(EnvironmentName.Production);
  }
}

/**
 * Interface for accessing environment information
 */
export interface IHostEnvironment {
  /**
   * Gets or sets the name of the environment (Development, Production, etc.)
   */
  environmentName: string;
  
  /**
   * Gets or sets the application name
   */
  applicationName: string;
  
  /**
   * Gets or sets the content root path
   */
  contentRootPath: string;
  
  /**
   * Checks if the current environment is Development
   */
  isDevelopment(): boolean;
  
  /**
   * Checks if the current environment is Production
   */
  isProduction(): boolean;
  
  /**
   * Checks if the current environment matches the specified name
   * @param environmentName The environment name to check
   */
  isEnvironment(environmentName: string): boolean;
}

/**
 * Default implementation of IHostEnvironment
 */
export class HostEnvironment implements IHostEnvironment {
  /**
   * Gets or sets the name of the environment
   */
  public environmentName: string;
  
  /**
   * Gets or sets the application name
   */
  public applicationName: string;
  
  /**
   * Gets or sets the content root path
   */
  public contentRootPath: string;
  
  /**
   * Creates a new instance of HostEnvironment
   */
  constructor() {
    this.environmentName = process.env.NODE_ENV || 'Production';
    this.applicationName = process.env.APPLICATION_NAME || '';
    this.contentRootPath = process.cwd();
  }
  
  /**
   * Checks if the current environment is Development
   */
  public isDevelopment(): boolean {
    return this.isEnvironment('Development');
  }
  
  /**
   * Checks if the current environment is Production
   */
  public isProduction(): boolean {
    return this.isEnvironment('Production');
  }
  
  /**
   * Checks if the current environment matches the specified name
   * @param environmentName The environment name to check
   */
  public isEnvironment(environmentName: string): boolean {
    return this.environmentName.toLowerCase() === environmentName.toLowerCase();
  }
}

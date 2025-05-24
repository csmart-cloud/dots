/**
 * Interface for accessing configuration values
 */
export interface IConfiguration {
  /**
   * Gets a configuration value by key
   * @param key The configuration key
   * @returns The configuration value or undefined if not found
   */
  get(key: string): string | undefined;
  
  /**
   * Gets a configuration section
   * @param key The section key
   * @returns A configuration object for the section
   */
  getSection(key: string): IConfiguration;
  
  /**
   * Gets all key-value pairs in the configuration
   * @returns Record of all configuration values
   */
  getAll(): Record<string, string>;
}

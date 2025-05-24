/**
 * Interface for a provider that supplies configuration key-values
 */
export interface IConfigurationProvider {
  /**
   * Gets a configuration value for the specified key
   * @param key The key to look up
   * @returns The configuration value or undefined if not found
   */
  get(key: string): string | undefined;
  
  /**
   * Tries to get a configuration value for the specified key
   * @param key The key to look up
   * @param value The out parameter to receive the value
   * @returns True if the key was found, false otherwise
   */
  tryGet(key: string, value: { value: string | undefined }): boolean;
  
  /**
   * Gets all configuration key-value pairs
   * @returns Dictionary of key-value pairs
   */
  getAll(): Record<string, string>;
  
  /**
   * Loads configuration values from the source
   */
  load(): Promise<void>;
}

/**
 * Default implementation of IConfigurationProvider
 */
export class DefaultConfigurationProvider implements IConfigurationProvider {
  protected data: Record<string, string> = {};
  
  /**
   * Gets a configuration value for the specified key
   * @param key The key to look up
   * @returns The configuration value or undefined if not found
   */
  public get(key: string): string | undefined {
    return this.data[key];
  }
  
  /**
   * Tries to get a configuration value for the specified key
   * @param key The key to look up
   * @param value The out parameter to receive the value
   * @returns True if the key was found, false otherwise
   */
  public tryGet(key: string, value: { value: string | undefined }): boolean {
    if (key in this.data) {
      value.value = this.data[key];
      return true;
    }
    value.value = undefined;
    return false;
  }
  
  /**
   * Gets all configuration key-value pairs
   * @returns Dictionary of key-value pairs
   */
  public getAll(): Record<string, string> {
    return { ...this.data };
  }
  
  /**
   * Sets a configuration value
   * @param key The key to set
   * @param value The value to set
   */
  public set(key: string, value: string): void {
    this.data[key] = value;
  }
  
  /**
   * Loads configuration values from the source
   */
  public async load(): Promise<void> {
    // Default implementation does nothing
  }
}

import { ConfigurationSection } from "./configuration-section.js";
import type { IConfiguration } from "./configuration.interface.js";
import type { IConfigurationProvider } from "./configuration-provider.js";

/**
 * Represents the root of a configuration hierarchy
 */
export class ConfigurationRoot implements IConfiguration {
  /**
   * Creates a new instance of ConfigurationRoot
   * @param providers The providers that supply configuration values
   */
  constructor(private readonly providers: IConfigurationProvider[]) {}

  /**
   * Gets a configuration value by key
   * @param key The configuration key
   * @returns The configuration value or undefined if not found
   */
  public get(key: string): string | undefined {
    // Search in reverse order (last added provider has highest precedence)
    for (let i = this.providers.length - 1; i >= 0; i--) {
      const value = this.providers[i].get(key);
      if (value !== undefined) {
        return value;
      }
    }
    return undefined;
  }

  /**
   * Gets a configuration section
   * @param key The section key
   * @returns A configuration object for the section
   */
  public getSection(key: string): IConfiguration {
    return new ConfigurationSection(this, key);
  }

  /**
   * Gets all key-value pairs in the configuration
   * @returns Record of all configuration values
   */
  public getAll(): Record<string, string> {
    const result: Record<string, string> = {};
    
    // Start with lowest priority provider
    for (const provider of this.providers) {
      const all = provider.getAll();
      for (const key in all) {
        result[key] = all[key];
      }
    }
    
    return result;
  }
}

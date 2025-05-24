import type { IConfiguration } from "./configuration.interface.js";

/**
 * Represents a section of configuration values
 */
export class ConfigurationSection implements IConfiguration {
  /**
   * Creates a new instance of ConfigurationSection
   * @param root The root configuration 
   * @param path The path to this section
   */
  constructor(
    private readonly root: IConfiguration,
    private readonly path: string
  ) {}

  /**
   * Gets a configuration value by key
   * @param key The configuration key relative to this section
   * @returns The configuration value or undefined if not found
   */
  public get(key: string): string | undefined {
    const fullKey = this.getFullKey(key);
    return this.root.get(fullKey);
  }

  /**
   * Gets a configuration section
   * @param key The section key relative to this section
   * @returns A configuration object for the section
   */
  public getSection(key: string): IConfiguration {
    const fullPath = this.getFullKey(key);
    return new ConfigurationSection(this.root, fullPath);
  }

  /**
   * Gets all key-value pairs in this section
   * @returns Record of all configuration values in this section
   */
  public getAll(): Record<string, string> {
    const all = this.root.getAll();
    const result: Record<string, string> = {};
    const prefix = this.path + ":";
    
    for (const key in all) {
      if (key.startsWith(prefix)) {
        const sectionKey = key.substring(prefix.length);
        result[sectionKey] = all[key];
      }
    }
    
    return result;
  }

  /**
   * Gets the full configuration key by combining the section path with a relative key
   * @param key The relative key
   * @returns The full configuration key
   */
  private getFullKey(key: string): string {
    if (!key) return this.path;
    return this.path ? `${this.path}:${key}` : key;
  }
}

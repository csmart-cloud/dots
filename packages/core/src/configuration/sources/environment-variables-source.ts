import { DefaultConfigurationProvider } from "../configuration-provider.js";
import type { IConfigurationProvider } from "../configuration-provider.js";
import type { IConfigurationSource } from "./configuration-source.interface.js";

/**
 * Configuration source that reads from environment variables
 */
export class EnvironmentVariablesConfigurationSource
  implements IConfigurationSource
{
  /**
   * Creates a new instance of EnvironmentVariablesConfigurationSource
   * @param prefix Optional prefix to filter environment variables
   */
  constructor(private readonly prefix?: string) {}

  /**
   * Builds the configuration provider for this source
   * @returns The configuration provider
   */
  public build(): IConfigurationProvider {
    return new EnvironmentVariablesConfigurationProvider(this.prefix);
  }
}

/**
 * Configuration provider that reads from environment variables
 */
class EnvironmentVariablesConfigurationProvider extends DefaultConfigurationProvider {
  /**
   * Creates a new instance of EnvironmentVariablesConfigurationProvider
   * @param prefix Optional prefix to filter environment variables
   */
  constructor(private readonly prefix?: string) {
    super();
  }

  /**
   * Loads configuration values from environment variables
   */
  public async load(): Promise<void> {
    const env = process.env;

    for (const key in env) {
      if (!this.prefix || key.startsWith(this.prefix)) {
        let configKey = key;

        // Remove prefix if it exists
        if (this.prefix && key.startsWith(this.prefix)) {
          configKey = key.substring(this.prefix.length);

          // Remove leading separator if present
          if (configKey.startsWith("_") || configKey.startsWith(":")) {
            configKey = configKey.substring(1);
          }
        }

        // Replace common environment variable separators with configuration delimiter
        configKey = configKey.replace(/__(.*)/g, ":$1").replace(/_/g, ":");

        // Store in normalized form (lowercase)
        if (env[key] !== undefined) {
          this.set(configKey, env[key] as string);
        }
      }
    }
  }
}

import { ConfigurationRoot } from "./configuration-root.js";
import { EnvironmentVariablesConfigurationSource } from "./sources/environment-variables-source.js";
import { InMemoryConfigurationSource } from "./sources/memory-configuration-source.js";
import { JsonConfigurationSource } from "./sources/json-configuration-source.js";
import type { IConfiguration } from "./configuration.interface.js";
import type { IConfigurationProvider } from "./configuration-provider.js";
import type { IConfigurationSource } from "./sources/configuration-source.interface.js";

/**
 * Builder for creating configuration objects
 */
export class ConfigurationBuilder {
  private sources: IConfigurationSource[] = [];
  private providers: IConfigurationProvider[] = [];

  /**
   * Add a configuration source to the builder
   * @param source The configuration source to add
   */
  public add(source: IConfigurationSource): ConfigurationBuilder {
    this.sources.push(source);
    return this;
  }

  /**
   * Add environment variables as a configuration source
   * @param prefix Optional prefix to filter environment variables
   */
  public addEnvironmentVariables(prefix?: string): ConfigurationBuilder {
    return this.add(new EnvironmentVariablesConfigurationSource(prefix));
  }

  /**
   * Add a JSON file as a configuration source
   * @param path Path to the JSON file
   * @param optional Whether the file is optional (won't throw if missing)
   */
  public addJsonFile(path: string, optional: boolean = false): ConfigurationBuilder {
    return this.add(new JsonConfigurationSource(path, optional));
  }

  /**
   * Add in-memory values as a configuration source
   * @param initialData Initial key-value data
   */
  public addInMemoryCollection(initialData?: Record<string, string>): ConfigurationBuilder {
    return this.add(new InMemoryConfigurationSource(initialData));
  }

  /**
   * Build the configuration from all added sources
   */
  public async build(): Promise<IConfiguration> {
    // Create providers from sources
    this.providers = this.sources.map(source => source.build());
    
    // Load all providers
    for (const provider of this.providers) {
      await provider.load();
    }

    return new ConfigurationRoot(this.providers);
  }
}

import { DefaultConfigurationProvider } from "../configuration-provider.js";
import type { IConfigurationProvider } from "../configuration-provider.js";
import type { IConfigurationSource } from "./configuration-source.interface.js";

/**
 * Configuration source that uses in-memory key-value pairs
 */
export class InMemoryConfigurationSource implements IConfigurationSource {
  /**
   * Creates a new instance of InMemoryConfigurationSource
   * @param initialData Initial key-value data
   */
  constructor(private readonly initialData?: Record<string, string>) {}

  /**
   * Builds the configuration provider for this source
   * @returns The configuration provider
   */
  public build(): IConfigurationProvider {
    return new InMemoryConfigurationProvider(this.initialData);
  }
}

/**
 * Configuration provider that uses in-memory key-value pairs
 */
class InMemoryConfigurationProvider extends DefaultConfigurationProvider {
  /**
   * Creates a new instance of InMemoryConfigurationProvider
   * @param initialData Initial key-value data
   */
  constructor(private readonly initialData?: Record<string, string>) {
    super();
  }

  /**
   * Loads configuration values from the initial data
   */
  public async load(): Promise<void> {
    if (!this.initialData) {
      return;
    }

    for (const key in this.initialData) {
      this.set(key, this.initialData[key]);
    }
  }
}

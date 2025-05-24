import type { IConfigurationProvider } from "../configuration-provider.js";

/**
 * Interface for a source of configuration values
 */
export interface IConfigurationSource {
  /**
   * Builds the configuration provider for this source
   * @returns The configuration provider
   */
  build(): IConfigurationProvider;
}

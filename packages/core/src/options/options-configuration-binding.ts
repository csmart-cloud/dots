import type { IConfiguration } from "../configuration/configuration.interface.js";

/**
 * Provides methods for binding configuration to options
 */
export class OptionsConfigurationBinding {
  /**
   * Binds a configuration section to an options instance
   * @param configuration The configuration section
   * @param instance The options instance
   */
  public static bind<T extends object>(
    configuration: IConfiguration,
    instance: T
  ): T {
    const allSettings = configuration.getAll();

    for (const key in allSettings) {
      const value = allSettings[key];
      if (value === undefined) continue;

      // Parse the hierarchical key (e.g., 'server:port' => { server: { port: value } })
      const parts = key.split(':');
      let currentObj: any = instance;
      
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        
        if (!(part in currentObj) || typeof currentObj[part] !== 'object') {
          currentObj[part] = {};
        }
        
        currentObj = currentObj[part];
      }

      const lastPart = parts[parts.length - 1];
      const propertyType = typeof currentObj[lastPart];

      // Set the value with the appropriate type conversion
      if (propertyType === 'undefined' || propertyType === 'string') {
        currentObj[lastPart] = value;
      } else if (propertyType === 'number') {
        currentObj[lastPart] = Number(value);
      } else if (propertyType === 'boolean') {
        currentObj[lastPart] = value.toLowerCase() === 'true';
      } else if (propertyType === 'object') {
        try {
          currentObj[lastPart] = JSON.parse(value);
        } catch {
          currentObj[lastPart] = value;
        }
      }
    }

    return instance;
  }

  /**
   * Creates a new options instance from configuration
   * @param configuration The configuration section
   * @param optionsType The options type constructor
   */
  public static create<T extends object>(
    configuration: IConfiguration,
    optionsType: new () => T
  ): T {
    const instance = new optionsType();
    return OptionsConfigurationBinding.bind(configuration, instance);
  }
}

import { Options, OptionsMonitor, OptionsSnapshot } from "./options.js";
import { OptionsConfigurationBinding } from "./options-configuration-binding.js";
import { ServiceLifetime } from "../di/service-lifetime.js";
import type { Constructor } from "../common/types.js";
import type { IConfiguration } from "../configuration/configuration.interface.js";
import type { IOptions, IOptionsMonitor, IOptionsSnapshot } from "./options.interface.js";
import type { IServiceCollection } from "../di/service-collection.js";
import type { IServiceProvider } from "../di/service-provider.js";

/**
 * Interface for configuring options
 */
export interface IConfigureOptions<T> {
  configure(options: T): void;
}

/**
 * Gets the registration name for configure options
 * @param optionsType The options type
 */
function getConfigureOptionsName<T>(optionsType: Constructor<T>): string {
  return `IConfigureOptions<${optionsType.name}>`;
}

/**
 * Extension methods for IServiceCollection to add options services
 */
export class OptionsServiceCollectionExtensions {
  /**
   * Adds core options infrastructure services to the service collection
   * @param services The service collection
   */
  public static addOptionsServices(services: IServiceCollection): IServiceCollection {
    // Add the core options services
    services.addSingleton(OptionsConfigurationBinding);
    
    return services;
  }

  /**
   * Configures an options instance from configuration
   * @param services The service collection
   * @param configSectionPath The configuration section path
   * @param optionsType The options type
   */
  public static configure<T extends object>(
    services: IServiceCollection,
    configSectionPath: string,
    optionsType: Constructor<T>
  ): IServiceCollection {
    // Add setup action for the options type
    services.addFactory<IConfigureOptions<T>>(
      getConfigureOptionsName(optionsType),
      (provider: IServiceProvider) => {
        return {
          configure: (options: T) => {
            // Use string token for IConfiguration
            const configuration = provider.getService<IConfiguration>("IConfiguration");
            if (configuration) {
              const section = configuration.getSection(configSectionPath);
              OptionsConfigurationBinding.bind(section, options);
            }
          }
        };
      },
      ServiceLifetime.Singleton
    );
    
    return services;
  }

  /**
   * Registers and configures TOptions instance with the dependency injection container
   * @param services The service collection
   * @param optionsType The options type
   */
  public static configureOptions<T extends object>(
    services: IServiceCollection,
    optionsType: Constructor<T>
  ): IServiceCollection {
    // Register the options instance
    services.addFactory<IOptions<T>>(
      "IOptions" as any,
      (provider) => {
        const options = new optionsType();
        // Since getServices is missing in the interface, we'll use a workaround
        // Get the configurator directly with known token
        const configurator = provider.getService<IConfigureOptions<T>>(
          getConfigureOptionsName(optionsType)
        );
        
        // Apply configuration if available
        if (configurator) {
          configurator.configure(options);
        }
        
        return new Options<T>(options);
      },
      ServiceLifetime.Singleton
    );
    
    // Register the options monitor
    services.addFactory<IOptionsMonitor<T>>(
      "IOptionsMonitor" as any,
      (provider) => {
        const factory = (name: string) => {
          const options = new optionsType();
          // Get the configurator directly with known token
          const configurator = provider.getService<IConfigureOptions<T>>(
            getConfigureOptionsName(optionsType)
          );
          
          // Apply configuration if available
          if (configurator) {
            configurator.configure(options);
          }
          
          return options;
        };
        
        return new OptionsMonitor<T>(factory);
      },
      ServiceLifetime.Singleton
    );
    
    // Register the options snapshot
    services.addFactory<IOptionsSnapshot<T>>(
      "IOptionsSnapshot" as any,
      (provider) => {
        const factory = (name: string) => {
          const options = new optionsType();
          // Get the configurator directly with known token
          const configurator = provider.getService<IConfigureOptions<T>>(
            getConfigureOptionsName(optionsType)
          );
          
          // Apply configuration if available
          if (configurator) {
            configurator.configure(options);
          }
          
          return options;
        };
        
        return new OptionsSnapshot<T>(factory);
      },
      ServiceLifetime.Scoped
    );
    
    return services;
  }
}

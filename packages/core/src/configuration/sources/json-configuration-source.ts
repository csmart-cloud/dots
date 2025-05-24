import fs from "fs";
import { DefaultConfigurationProvider } from "../configuration-provider.js";
import type { IConfigurationProvider } from "../configuration-provider.js";
import type { IConfigurationSource } from "./configuration-source.interface.js";

/**
 * Configuration source that reads from a JSON file
 */
export class JsonConfigurationSource implements IConfigurationSource {
  /**
   * Creates a new instance of JsonConfigurationSource
   * @param path Path to the JSON file
   * @param optional Whether the file is optional (won't throw if missing)
   */
  constructor(
    private readonly filePath: string,
    private readonly optional: boolean = false
  ) {}

  /**
   * Builds the configuration provider for this source
   * @returns The configuration provider
   */
  public build(): IConfigurationProvider {
    return new JsonConfigurationProvider(this.filePath, this.optional);
  }
}

/**
 * Configuration provider that reads from a JSON file
 */
class JsonConfigurationProvider extends DefaultConfigurationProvider {
  /**
   * Creates a new instance of JsonConfigurationProvider
   * @param path Path to the JSON file
   * @param optional Whether the file is optional (won't throw if missing)
   */
  constructor(
    private readonly filePath: string,
    private readonly optional: boolean = false
  ) {
    super();
  }

  /**
   * Loads configuration values from the JSON file
   */
  public async load(): Promise<void> {
    try {
      // Check if file exists
      if (!fs.existsSync(this.filePath)) {
        if (!this.optional) {
          throw new Error(`Configuration file not found: ${this.filePath}`);
        }
        return;
      }

      // Read and parse the file
      const content = fs.readFileSync(this.filePath, "utf8");
      const json = JSON.parse(content);

      // Flatten the JSON object into key-value pairs
      this.flattenJson(json, "");
    } catch (error) {
      if (!this.optional) {
        throw error;
      }
      console.warn(
        `Failed to load optional configuration file: ${this.filePath}`,
        error
      );
    }
  }

  /**
   * Flattens a JSON object into key-value pairs
   * @param obj The JSON object to flatten
   * @param prefix The prefix for keys
   */
  private flattenJson(obj: any, prefix: string): void {
    if (typeof obj !== "object" || obj === null) {
      return;
    }

    for (const key in obj) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}:${key}` : key;

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        // Recursively flatten nested objects
        this.flattenJson(value, newKey);
      } else {
        // Convert value to string
        this.set(newKey, this.convertValueToString(value));
      }
    }
  }

  /**
   * Converts a value to string representation
   * @param value The value to convert
   * @returns The string representation
   */
  private convertValueToString(value: any): string {
    if (value === null || value === undefined) {
      return "";
    }

    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  }
}

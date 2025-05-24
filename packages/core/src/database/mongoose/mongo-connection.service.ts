import mongoose from "mongoose";
import { Injectable, Inject } from "../../di/decorators.js";
import { ServiceLifetime } from "../../di/service-lifetime.js";
import { ILogger } from "../../logging/logger.interface.js";
import {
  MongoConnectionOptionsToken,
  type IMongoConnectionOptions,
} from "./mongoose.types.js";

/**
 * Dependency injection token for MongoDB connection service
 */
export const IMongoConnectionService = Symbol("IMongoConnectionService");

/**
 * Service interface for managing MongoDB connections
 */
export interface IMongoConnectionService {
  /**
   * Establishes a connection to MongoDB
   * @returns Promise that resolves when connection is established
   * @throws Error if connection fails
   */
  connect(): Promise<void>;
  
  /**
   * Disconnects from MongoDB
   * @returns Promise that resolves when disconnected
   */
  disconnect(): Promise<void>;
  
  /**
   * Gets the mongoose instance if connected
   * @returns Mongoose instance or undefined if not connected
   */
  getMongooseInstance(): typeof mongoose | undefined;
}

@Injectable({ lifetime: ServiceLifetime.Singleton })
export class MongoConnectionService implements IMongoConnectionService {
  private mongooseInstance?: typeof mongoose;
  private isConnected = false;

  /**
   * Creates a new MongoDB connection service
   * @param options MongoDB connection options
   * @param logger Logger instance
   */
  constructor(
    @Inject(MongoConnectionOptionsToken)
    private readonly options: IMongoConnectionOptions,
    @Inject(ILogger) private readonly logger: ILogger
  ) {
    if (!options || !options.uri) {
      throw new Error("MongoDB URI is required in MongoConnectionOptions.");
    }
    if (!logger) {
      // Safety check in case DI fails to provide a logger
      console.warn(
        "MongoConnectionService: ILogger was not injected. Using console for logging."
      );
      this.logger = console as any; // Simple fallback, not recommended for production
    }
  }

  /**
   * Establishes a connection to MongoDB
   * Sets up event listeners for connection state changes
   * @returns Promise that resolves when connection is established
   * @throws Error if connection fails
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.mongooseInstance) {
      this.logger.info("MongoDB connection already established.");
      return;
    }
    try {
      // Mask sensitive information when logging the URI
      const uriToLog =
        this.options.uri.substring(0, this.options.uri.indexOf("//") + 2) +
        "******";
      this.logger.info(`Attempting to connect to MongoDB at ${uriToLog}...`);

      // Connect to MongoDB
      // Note: Mongoose 6+ no longer requires options like useNewUrlParser, useUnifiedTopology
      this.mongooseInstance = await mongoose.connect(
        this.options.uri,
        this.options.options
      );
      this.isConnected = true;
      this.logger.info("MongoDB connected successfully.");

      // Set up event listeners for connection state changes
      mongoose.connection.on("error", (err) => {
        this.logger.error(
          "MongoDB connection error after initial connection:",
          err
        );
      });
      
      mongoose.connection.on("disconnected", () => {
        this.logger.warn("MongoDB disconnected.");
        this.isConnected = false;
      });
      
      mongoose.connection.on("reconnected", () => {
        this.logger.info("MongoDB reconnected.");
        this.isConnected = true;
      });
    } catch (error) {
      this.logger.error("Failed to connect to MongoDB:", error);
      this.isConnected = false;
      this.mongooseInstance = undefined;
      throw error;
    }
  }

  /**
   * Disconnects from MongoDB
   * Cleans up resources and resets connection state
   * @returns Promise that resolves when disconnected
   */
  async disconnect(): Promise<void> {
    if (this.mongooseInstance && this.isConnected) {
      try {
        await this.mongooseInstance.disconnect();
        this.logger.info("MongoDB disconnected successfully.");
      } catch (error) {
        this.logger.error("Error disconnecting MongoDB:", error);
        // Even if there's an error, we'll reset the state
      } finally {
        this.isConnected = false;
        this.mongooseInstance = undefined;
      }
    } else {
      this.logger.info(
        "MongoDB connection not established or already disconnected."
      );
    }
  }

  /**
   * Gets the mongoose instance if connected
   * @returns Mongoose instance or undefined if not connected
   */
  getMongooseInstance(): typeof mongoose | undefined {
    return this.mongooseInstance;
  }
}

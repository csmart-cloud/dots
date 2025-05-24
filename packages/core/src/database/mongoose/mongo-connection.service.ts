import mongoose from "mongoose";
import { Injectable, Inject } from "../../di/decorators.js";
import { ServiceLifetime } from "../../di/service-lifetime.js";
import { ILogger } from "../../logging/logger.interface.js";
import {
  MongoConnectionOptionsToken,
  type IMongoConnectionOptions,
} from "./mongoose.types.js";

export const IMongoConnectionService = Symbol("IMongoConnectionService");

export interface IMongoConnectionService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getMongooseInstance(): typeof mongoose | undefined;
}

@Injectable({ lifetime: ServiceLifetime.Singleton })
export class MongoConnectionService implements IMongoConnectionService {
  private mongooseInstance?: typeof mongoose;
  private isConnected = false;

  constructor(
    @Inject(MongoConnectionOptionsToken)
    private readonly options: IMongoConnectionOptions,
    @Inject(ILogger) private readonly logger: ILogger // Sửa lại token inject cho ILogger
  ) {
    if (!options || !options.uri) {
      throw new Error("MongoDB URI is required in MongoConnectionOptions.");
    }
    if (!logger) {
      // Mặc dù DI nên xử lý việc này, nhưng kiểm tra thêm để an toàn
      console.warn(
        "MongoConnectionService: ILogger was not injected. Using console for logging."
      );
      this.logger = console as any; // Fallback đơn giản, không khuyến khích cho production
    }
  }

  async connect(): Promise<void> {
    if (this.isConnected && this.mongooseInstance) {
      this.logger.info("MongoDB connection already established.");
      return;
    }
    try {
      // Giấu thông tin nhạy cảm khi log URI
      const uriToLog =
        this.options.uri.substring(0, this.options.uri.indexOf("//") + 2) +
        "******";
      this.logger.info(`Attempting to connect to MongoDB at ${uriToLog}...`);

      // Mongoose 6+ không yêu cầu các tùy chọn như useNewUrlParser, useUnifiedTopology nữa
      this.mongooseInstance = await mongoose.connect(
        this.options.uri,
        this.options.options
      );
      this.isConnected = true;
      this.logger.info("MongoDB connected successfully.");

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

  async disconnect(): Promise<void> {
    if (this.mongooseInstance && this.isConnected) {
      try {
        await this.mongooseInstance.disconnect();
        this.logger.info("MongoDB disconnected successfully.");
      } catch (error) {
        this.logger.error("Error disconnecting MongoDB:", error);
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

  getMongooseInstance(): typeof mongoose | undefined {
    return this.mongooseInstance;
  }
}

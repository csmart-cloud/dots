import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Type definition for Mongoose models to simplify dependency injection
 * Makes it easier to inject and work with strongly-typed models
 */
export type MongooseModel<T extends Document> = Model<T>;

/**
 * Options for configuring MongoDB connection
 */
export interface IMongoConnectionOptions {
  /**
   * MongoDB connection URI
   * Format: mongodb://[username:password@]host[:port]/database
   */
  uri: string;
  
  /**
   * Additional mongoose connection options
   */
  options?: mongoose.ConnectOptions;
}

/**
 * Dependency injection token for MongoDB connection options
 * Use this token to inject connection options into services
 */
export const MongoConnectionOptionsToken = Symbol("MongoConnectionOptions");

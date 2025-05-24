import mongoose, { Schema, Document, Model } from "mongoose";

// Type cho Mongoose Model (để tiện dùng khi inject)
export type MongooseModel<T extends Document> = Model<T>;

// Interface cho các tùy chọn kết nối MongoDB
export interface IMongoConnectionOptions {
  uri: string;
  options?: mongoose.ConnectOptions;
}
// Symbol token cho việc inject connection options
export const MongoConnectionOptionsToken = Symbol("MongoConnectionOptions");

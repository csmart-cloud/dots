import type { IServiceCollection } from "../di/service-collection.js";
import type { IApplicationBuilder } from "./application-builder.js";
import type { IServiceProvider } from "../di/service-provider.js";

export interface IStartup {
  configureServices(services: IServiceCollection): void;
  configure(app: IApplicationBuilder, hostServices: IServiceProvider): void; // Thêm hostServices để có thể lấy config,...
}

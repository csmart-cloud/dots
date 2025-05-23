import { IServiceCollection } from "../di/service-collection";
import { IApplicationBuilder } from "./application-builder";
import { IServiceProvider } from "../di/service-provider";

export interface IStartup {
  configureServices(services: IServiceCollection): void;
  configure(app: IApplicationBuilder, hostServices: IServiceProvider): void; // Thêm hostServices để có thể lấy config,...
}

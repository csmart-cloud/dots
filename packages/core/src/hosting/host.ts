import type { IServiceProvider } from "../di/service-provider.js";

export interface IHost {
  readonly services: IServiceProvider;
  start(): Promise<void>;
  stop(): Promise<void>;
}

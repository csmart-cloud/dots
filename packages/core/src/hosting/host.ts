import { IServiceProvider } from "../di/service-provider";

export interface IHost {
  readonly services: IServiceProvider;
  start(): Promise<void>;
  stop(): Promise<void>;
}

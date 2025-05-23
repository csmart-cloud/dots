import { Injectable, ServiceLifetime } from "@dots/core";

export interface IIdentityService {
  login(): string;
}

@Injectable({ lifetime: ServiceLifetime.Scoped })
export class IdentityService implements IIdentityService {
  login() {
    return "Login";
  }
}

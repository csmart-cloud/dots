import { Controller, ControllerBase, HttpGet, Inject } from "@dots/core";
import {
  type IIdentityService,
  IdentityService,
} from "../services/identity.service.js";
import { ILogger } from "@dots/core";

@Controller("api/identity")
export class IdentityController extends ControllerBase {
  constructor(
    @Inject(IdentityService) private identityService: IdentityService,
    @Inject(ILogger) private logger: ILogger
  ) {
    super();
  }

  @HttpGet("login")
  login() {
    this.logger.info("Login called");
    return this.ok(this.identityService.login());
  }
}

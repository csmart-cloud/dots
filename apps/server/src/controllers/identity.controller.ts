import { Controller, ControllerBase, HttpGet, Inject } from "@dots/core";
import {
  type IIdentityService,
  IdentityService,
} from "../services/identity.service.js";

@Controller("api/identity")
export class IdentityController extends ControllerBase {
  constructor(@Inject(IdentityService) private identityService: IdentityService) {
    super();
  }

  @HttpGet("/login")
  login() {
    return this.ok(this.identityService.login());
  }
}

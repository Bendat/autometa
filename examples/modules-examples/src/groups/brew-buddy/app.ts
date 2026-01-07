import { BrewBuddyService } from "./services/brew-buddy-service";

export class BrewBuddyApp {
  readonly id = "brew-buddy-app";

  constructor(public readonly service: BrewBuddyService) {}
}

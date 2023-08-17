import { Property } from "@autometa/dto-builder";
import { StatusType } from "@autometa/types";

export class HookReport {
  @Property
  name: string;
  @Property
  description?: string;
  @Property
  status: StatusType;
  @Property
  error?: Error;
}

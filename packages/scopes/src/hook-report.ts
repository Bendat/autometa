import { StatusType } from "@autometa/types";

export class HookReport {
  name: string;
  description?: string;
  status: StatusType;
  error?: Error;
}

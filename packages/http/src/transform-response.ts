import { AutomationError } from "@autometa/errors";
import isJson from "@stdlib/assert-is-json";
import { highlight } from "cli-highlight";

export function transformResponse(
  allowPlainText: boolean,
  data: string | undefined | null
) {
  if (data === null) {
    return null;
  }
  if (data === undefined) {
    return undefined;
  }
  if (isJson(data)) {
    return JSON.parse(data);
  }
  if (["true", "false"].includes(data)) {
    return JSON.parse(data);
  }
  if (/^\d*\.?\d+$/.test(data)) {
    return JSON.parse(data);
  }

  if (allowPlainText) {
    return data;
  }
  const response = highlight(data, { language: "html" });
  const message = [
    `Could not parse a response as json, and this request was not configured to allow plain text responses.`,
    `To allow plain text responses, use the 'allowPlainText' method on the HTTP client.`,
    " ",
    response
  ];
  throw new AutomationError(message.join("\n"));
}

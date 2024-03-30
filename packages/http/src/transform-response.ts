import { AutomationError } from "@autometa/errors";
import isJson from "@stdlib/assert-is-json";
import { highlight } from "cli-highlight";

export function transformResponse(
  allowPlainText: boolean,
  data: null | undefined | string
) {
  if (data === null) {
    return null;
  }
  if (data === undefined) {
    return undefined;
  }
  if (data === "") {
    return data;
  }
  if (isJson(data)) {
    return JSON.parse(data);
  }
  if (typeof data === "string" && ["true", "false"].includes(data)) {
    return JSON.parse(data);
  }
  if (typeof data === "string" && /^\d*\.?\d+$/.test(data)) {
    return JSON.parse(data);
  }

  if (typeof data === "object") {
    return data;
  }
  if (allowPlainText) {
    return data;
  }
  const dataStr = typeof data === "string" ? data : JSON.stringify(data);
  const response = highlight(dataStr, { language: "html" });
  const message = [
    `Could not parse a response as json, and this request was not configured to allow plain text responses.`,
    `To allow plain text responses, use the 'allowPlainText' method on the HTTP client.`,
    "",
    response,
  ];
  throw new AutomationError(message.join("\n"));
}

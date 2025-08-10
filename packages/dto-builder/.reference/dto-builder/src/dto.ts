import { DefaultValueDecorators, Default } from "./dto-default.decorator";
import { Class } from "./types";

export function DTOWrapper<T extends object>() {
  return class {} as Class<T>;
}

export const DTO: typeof DTOWrapper & Default = Object.assign(DTOWrapper, DefaultValueDecorators);

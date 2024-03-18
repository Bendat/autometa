import { NullTimeout, Timeout } from "@autometa/scopes";
import { Config } from "@autometa/config";
export function getTimeout(target: Timeout | undefined, config: Config) {
  if (target && !(target instanceof NullTimeout)) {
    return target;
  }
  return Timeout.from(config?.current?.test?.timeout);
}

export function chooseTimeout(
  timeout1: Timeout | undefined,
  timeout2: Timeout | undefined
) {
  if (timeout2 instanceof Timeout && !(timeout2 instanceof NullTimeout)) {
    return {
      getTimeout: getTimeout.bind(null, timeout2),
    };
  }
  if (timeout1 instanceof Timeout && !(timeout1 instanceof NullTimeout)) {
    return {
      getTimeout: getTimeout.bind(null, timeout1),
    };
  }
  return {
    getTimeout: getTimeout.bind(null, Timeout.from(0)),
  };
}

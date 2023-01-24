type StandardFunction = (...args: unknown[]) => void;
export default class Bag {
  #innerArray: ((...args: StandardFunction[]) => void)[] = [];
  constructor(...defaultCallbacks: StandardFunction[]) {
    defaultCallbacks.forEach(this.subscribe);
  }

  subscribe = (callback: TrackingCallback) => {
    this.#innerArray.push(callback);
  };

  forEach = (action: (...args: StandardFunction[]) => void) => {
    this.#innerArray.forEach((it) => {
      action(it);
    });
  };
}

type TrackingCallback = (...args: unknown[]) => void;

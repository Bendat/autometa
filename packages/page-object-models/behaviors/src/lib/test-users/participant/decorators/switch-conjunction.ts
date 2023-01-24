import { Participant } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AssignActionMethod(ctr: any): any {
  class ParticipantDriver extends ctr {
    constructor(name: string) {
      super(name);
      this.will['see'] = this.see.bind(this);
    }
  }
  return ParticipantDriver as unknown as Participant;
}
export function SwitchConjunction(): MethodDecorator {
  return (
    _targetIgnored: unknown,
    propertyKey: string | symbol,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor: TypedPropertyDescriptor<any>
  ) => {
    const originalValue = descriptor.value;
    const fnWrapper = {
      [propertyKey]: function (...args: unknown[]) {
        this.and = this[propertyKey].bind(this);
        this.and.see = this.see.bind(this);
        this.and.will = this.will.bind(this);
        this.and.will.and = this.will.bind(this);
        this.and.will.see = this.see.bind(this);
        const result = originalValue.apply(this, args);
        return result;
      },
    };
    descriptor.value = fnWrapper[propertyKey as string];
  };
}

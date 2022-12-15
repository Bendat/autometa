import { constructor } from 'tsyringe/dist/typings/types';
import { WindowStartContext, Switcher, Which } from '../../subplot';
import { Story } from './story';

export function beginsWith<T extends Story>(
  story: constructor<T>
): ClassDecorator;
export function beginsWith(context: WindowStartContext): ClassDecorator;
export function beginsWith<T extends Story | undefined = undefined>(
  context: WindowStartContext | constructor<T>
): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata('metadata:beginsWith', context, target.constructor);
  };
}

export function endsThen(then: Switcher, name: string) {
  return (target) => {
    Which;
    Reflect.defineMetadata(
      'metadata:endsThen',
      Which(then, name),
      target.constructor
    );
  };
}

export function continuesFrom(story: constructor<Story>) {
  return (target) => {
    Reflect.defineMetadata('metadata:continuesFrom', story, target.constructor);
  };
}

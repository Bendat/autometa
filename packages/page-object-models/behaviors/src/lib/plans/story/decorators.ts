import { constructor } from 'tsyringe/dist/typings/types';
import { WindowContext, Switcher, Which } from '../../subplot';
import { Plans } from '../plans';
import { Story } from './story';

// @beginsWith(Tab('jennies', Return))
export function beginsWith<T extends Plans>(story: constructor<Story>);
export function beginsWith<T extends Plans>(context: WindowContext);
export function beginsWith<T extends Plans | undefined = undefined>(
  context: WindowContext | constructor<Story>
) {
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
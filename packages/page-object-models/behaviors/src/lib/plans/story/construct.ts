import { constructor } from 'tsyringe/dist/typings/types';
import { Story } from '.';
import { Plans } from '..';
import { WindowContext } from '../../subplot';

export function construct(target: constructor<Story>) {
  const beginsWith = Reflect.getMetadata('metadata:beginsWith', target);
  const context = getContext(target.name, beginsWith);
  //'metadata:endsThen'
  const endsThen = Reflect.getMetadata('metadata:endsThen', target);
  const continuesFrom = Reflect.getMetadata('metadata:continuesFrom', target);


}

function getContext(
  story: string,
  current: WindowContext | constructor<Story>
): WindowContext {
  if (!current) {
    throw new Error(`No setup configured for Story ${story} `);
  }
  if (current instanceof WindowContext) {
    return current;
  }
  return getContext(current.name, current);
}

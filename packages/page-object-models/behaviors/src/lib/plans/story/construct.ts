import { constructor } from 'tsyringe/dist/typings/types';
import { Story } from '.';
import { Plans } from '..';
import { WindowStartContext } from '../../subplot';

export function construct(target: constructor<Story>) {
  const beginsWith = Reflect.getMetadata('metadata:beginsWith', target);
  const context = getContext(target.name, beginsWith);
  //'metadata:endsThen'
  const endsThen = Reflect.getMetadata('metadata:endsThen', target);
  const continuesFrom = Reflect.getMetadata('metadata:continuesFrom', target);


}

function getContext(
  story: string,
  current: WindowStartContext | constructor<Story>
): WindowStartContext {
  if (!current) {
    throw new Error(`No setup configured for Story ${story} `);
  }
  if (current instanceof WindowStartContext) {
    return current;
  }
  return getContext(current.name, current);
}

import { constructor } from 'tsyringe/dist/typings/types';
import { Community, User } from '../performers';
import { ContextHandler, WindowContext } from '../subplot';
import {
  ActionMetadata,
  ObservationMetadata,
  PlanMetaStructure,
  ThoughtMetadata,
} from './decorators';
import { NoPlans, Plans } from './plans';

export function constructPlans<T extends Plans>(
  plans: constructor<T>,
  user: User
) {
  const metadata: PlanMetaStructure = Reflect.getMetadata(
    'plan-structure',
    plans
  );
  const instance = new plans() as any;
  if (!metadata && !(instance instanceof NoPlans)) {
    throw new Error(
      `Plan ${plans.name} does not have metadata. Make sure to decorate fields with '@action', '@observation' and that a reflect-poly fill like 'reflect-metadata' is added as a dependency and imported early in your project.`
    );
  }
  instance.then = user.then;
  const keys = metadata?.steps?.map((it) => it.key) ?? [];
  for (const key of keys) {
    const behaviors = metadata.steps.filter((it) => it.key === key);
    instance.trigger = <T extends Community>(
      context: WindowContext,
      plans: Plans,
      handler: ContextHandler
    ) => {
      user.meanwhile(
        async () => {
          await plans;
          return user;
        },
        context,
        handler
      );
    };
    instance[key] = () => {
      behaviors.forEach((behavior) => {
        if (behavior instanceof ActionMetadata) {
          user.will(behavior.action);
        }
        if (behavior instanceof ObservationMetadata) {
          user.see(behavior.observer, behavior.assertion);
        }
        if (behavior instanceof ThoughtMetadata) {
          user.think(behavior.condition, behavior.reason);
        }
      });
      return instance;
    };
  }

  return instance;
}

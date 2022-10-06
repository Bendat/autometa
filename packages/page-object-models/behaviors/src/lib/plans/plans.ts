import { Community, Thenable, ThenMethod, User } from '../performers';
import { ContextHandler, WindowContext } from '../subplot';

type SchemeEvents<T extends Plans, K extends Plans> = {
  [J in keyof K]: K[J] extends StepOf<K> ? StepOf<K & Recomposable<T>> : K[J];
};

interface Recomposable<K> {
  recompose: K & { andAgain: K };
}

export type ComposedOf<
  TBasePlan extends Plans,
  TSubPlan extends Plans
> = SchemeEvents<TBasePlan, TSubPlan> & Recomposable<TSubPlan>;

export interface ProcedureOf<TBasePlan extends Plans, TSubPlan extends Plans>
  extends Recomposable<TSubPlan> {
  (action: (has: TBasePlan) => TBasePlan): TSubPlan;
}

export interface StepOf<T extends Plans> {
  (): T;
}

export abstract class Plans implements Thenable {
  [planName: string]:
    | StepOf<Plans>
    | ProcedureOf<Plans, Plans>
    | ComposedOf<Plans, Plans>
    | ThenMethod
    | (<TPlans extends Plans, TUser extends User<TPlans>>(
        context: WindowContext,
        user: TPlans,
        handler: ContextHandler
      ) => this);

  then = (_: (value: any) => any): Promise<never> => {
    throw new Error('Method not implemented.');
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  trigger = <TPlans extends Plans, TUser extends User<TPlans>>(
    context: WindowContext,
    user: TPlans,
    handler: ContextHandler
  ): this => {
    throw new Error('Method not implemented.');
  };
}

export class NoPlans extends Plans {}

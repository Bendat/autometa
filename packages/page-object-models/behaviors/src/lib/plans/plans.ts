type SchemeEvents<T extends Plans, K extends Plans> = {
  [J in keyof K]: K[J] extends StepOf<K>
    ? StepOf<K & Recomposable<T>>
    : K[J] extends ComposedOf<T, K>
    ? ComposedOf<T, K>
    : ProcedureOf<T, K>;
};

interface Recomposable<K> {
  recompose: K & { andAgain: K };
}

export type ComposedOf<TBasePlan extends Plans, TSubPlan extends Plans> = SchemeEvents<TBasePlan, TSubPlan> &
  Recomposable<TSubPlan>;


export interface ProcedureOf<TBasePlan extends Plans, TSubPlan extends Plans> extends Recomposable<TSubPlan> {
  (action: (has: TBasePlan) => TBasePlan): TSubPlan;
}

export interface StepOf<T extends Plans> {
  (): T;
}

export abstract class Plans {
  [planName: string]:
    | StepOf<Plans>
    | ProcedureOf<Plans, Plans>
    | ComposedOf<Plans, Plans>;
}
// import { Class } from '@autometa/shared-utilities';// import { Metadata } from '../../metadata';
// import { Plans } from '../../plans';

// export const PlansMetadata = 'focus-group:user:plans';
// export function plans<T extends Plans>(
//   plans: Class<T>
// ): PropertyDecorator {
//   return (target: Class<unknown>, key: string): void => {
//     Metadata.of(target, key).with(PlansMetadata).define(plans);
//   };
// }

// export function getPlansMetadata<T, K extends Plans>(
//   // eslint-disable-next-line @typescript-eslint/ban-types
//   target: Class<T> | Function,
//   user: string
// ) {
//   return Metadata.of(target.prototype ?? target.constructor, user)
//     .with(PlansMetadata)
//     .get<Class<K>>();
// }

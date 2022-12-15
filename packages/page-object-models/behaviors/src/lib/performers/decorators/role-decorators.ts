import { constructor } from 'tsyringe/dist/typings/types';
import { Metadata } from '../../metadata/metadata';

export const RoleMetadataId = 'focus-group:user:role';

export function role(title: string ): PropertyDecorator {
  return (target: constructor<unknown>, key: string): void => {
    const metaclass = Metadata.of(target).with(RoleMetadataId);
    metaclass.append(key, title);
  };
}

export function getRoleMetadata<T>(target: constructor<T> | (()=>unknown), key: string) {
  return Metadata.of(target.prototype).with(RoleMetadataId).get<string>(key);
}

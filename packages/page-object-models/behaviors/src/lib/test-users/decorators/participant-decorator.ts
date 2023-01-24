import { Class } from '@autometa/shared-utilities';
import { Metadata } from '../../metadata';

export const ParticipantMetadata = 'community:meta:user:participant';

export function getParticipants(target): string[] {
  return Metadata.of(target.prototype).with(ParticipantMetadata)
    .collection as string[];
}

export function addParticipantToFocusGroup(
  focusGroup: Class<unknown>,
  name: string
) {
  Metadata.of(focusGroup).with(ParticipantMetadata).collect(name);
}

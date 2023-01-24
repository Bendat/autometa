import { Metadata } from '../../metadata';

export const FacilitatorMetadataKey = 'community:meta:user:facilitator';
/**
 * Marks a participant as the facilitator of the focus group.
 * The facilitator is a special 'role' and is automatically loaded when the focus group begins,
 * and is the primary user for a test - their webdriver will be started with
 * the focus group.
 *
 * Non facilitators can be activated via subplots.
 */
export function Facilitator(target, key): void {
  Metadata.of(target)
    .with(FacilitatorMetadataKey)
    .define(key, 'Only one facilitator can be defined on a focus group');
}

export function getFacilitatorMetadata(target): string {
  return Metadata.of(target.prototype).with(FacilitatorMetadataKey).get();
}

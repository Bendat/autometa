import { Clickable, Readable, Writable } from '@autometa/page-components';

export const Click = <T extends Clickable>({ click }: T) => click();

export const Text = <T extends Readable>({ text }: T) => text;

export const Type =
  (text: string) =>
  <T extends Writable>({ type }: T) =>
    type(text);

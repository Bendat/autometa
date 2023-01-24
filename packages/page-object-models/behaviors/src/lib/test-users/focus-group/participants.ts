import { Participant } from '../participant';

export type Participants<T> = {
  [key in keyof T]: Participant;
};

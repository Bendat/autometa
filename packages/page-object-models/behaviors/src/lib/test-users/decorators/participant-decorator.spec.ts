import { Class } from '@autometa/shared-utilities';
import 'reflect-metadata';
import { addParticipantToFocusGroup, getParticipants } from '.';
import { Participant } from '../participant';

const makeTestClass = () => {
  class TestFocusGroup {
    John: Participant;
  }
  return TestFocusGroup;
};

describe('Attaching a users plans to a focus group objects metadata', () => {
  it("should extract John and Linda's roles from metadata", () => {
    const TestFocusGroup = makeTestClass();
    addParticipantToFocusGroup(TestFocusGroup.prototype as unknown as Class<unknown>, "John")
    const [john] = getParticipants(TestFocusGroup);
    expect(john).toEqual('John');
  });
});

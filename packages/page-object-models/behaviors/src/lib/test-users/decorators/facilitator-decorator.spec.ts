import 'reflect-metadata';
import { URL } from 'url';
import { Facilitator, getFacilitatorMetadata } from '.';
import { Participant } from '../participant';
import { Browses } from './browses-decorator';
const urlString = 'http://localhost:8080/';
const url = new URL(urlString);
const makeTestClass = () => {
  class TestFocusGroup {
    @Facilitator
    John: Participant;

    @Browses(url)
    Linda: Participant;
  }
  return TestFocusGroup;
};

describe('Attaching details about a users role to the focus group objects metadata', () => {
  it("should extract John and Linda's roles from metadata", () => {
    const TestFocusGroup = makeTestClass();
    const facilitator = getFacilitatorMetadata(TestFocusGroup);
    expect(facilitator).toEqual('John');
  });
});

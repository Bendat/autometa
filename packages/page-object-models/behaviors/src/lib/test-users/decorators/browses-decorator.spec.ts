import 'reflect-metadata';
import { URL } from 'url';
import { Participant } from '../participant';
import { getBrowsesMetadata, Browses } from './browses-decorator';
const urlString = 'http://localhost:8080/';
const url = new URL(urlString);
const makeTestClass = () => {
  class TestFocusGroup {
    @Browses(urlString)
    John: Participant;

    @Browses(url)
    Linda: Participant;
  }
  return TestFocusGroup;
};

describe('Attaching details about a users role to the focus group objects metadata', () => {
  it("should extract John and Linda's roles from metadata", () => {
    const TestFocusGroup = makeTestClass();
    const johnRole = getBrowsesMetadata(TestFocusGroup, 'John');
    const lindaRole = getBrowsesMetadata(TestFocusGroup, 'Linda');
    expect(johnRole.site).toEqual(url);
    expect(lindaRole.site).toEqual(url);
  });
});

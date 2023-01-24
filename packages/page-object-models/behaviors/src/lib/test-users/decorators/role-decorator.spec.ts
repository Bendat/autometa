import 'reflect-metadata';
import { Participant } from '../participant';
import { getRoleMetadata, Role } from './role-decorator';
export enum UserRole {
  Customer = 'Customer',
  Seller = 'Seller',
}
const makeTestClass = () => {
  class TestFocusGroup {
    @Role(UserRole.Customer)
    John: Participant;

    @Role('Seller')
    Linda: Participant;
  }
  return TestFocusGroup;
};

describe('Attaching details about a users role to the focus group objects metadata', () => {
  it("should extract John and Linda's roles from metadata", () => {
    const TestFocusGroup = makeTestClass();
    const johnRole = getRoleMetadata(TestFocusGroup, 'John');
    const lindaRole = getRoleMetadata(TestFocusGroup, 'Linda');
    expect(johnRole).toBe(UserRole.Customer);
    expect(lindaRole).toBe(UserRole.Seller);
  });
});

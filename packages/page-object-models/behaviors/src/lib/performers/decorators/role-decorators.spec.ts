import 'reflect-metadata';
import { User } from '../..';
import { getRoleMetadata, role } from './role-decorators';
export enum UserRole {
  Customer = 'Customer',
  Seller = 'Seller',
}
const makeTestClass = () => {
  class TestFocusGroup {
    @role(UserRole.Customer)
    John: User;

    @role('Seller')
    Linda: User;
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

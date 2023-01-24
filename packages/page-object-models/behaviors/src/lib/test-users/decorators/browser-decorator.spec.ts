import 'reflect-metadata';
import { Browser, getBrowserMetadata } from '.';
import {  Builder } from 'selenium-webdriver';
import { Vendor } from '../../environment';
const makeTestClass = () => {
  @Browser(new Builder().forBrowser(Vendor.FIREFOX))
  class TestFocusGroup {}
  return TestFocusGroup;
};

describe('Attaching details about a users role to the focus group objects metadata', () => {
  it("should extract John and Linda's roles from metadata", () => {
    const TestFocusGroup = makeTestClass();
    const browser = getBrowserMetadata(TestFocusGroup);
    const browserName = browser.getCapabilities().get('browserName');
    expect(browserName).toEqual(Vendor.FIREFOX);
  });
});

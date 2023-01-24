import { Website, WebPage, PageObject } from '@autometa/page-components';
import { Class } from '@autometa/shared-utilities';
import { Observation, Observe } from './';

jest.mock('@autometa/page-components', () => {
  return {
    Website: jest.fn().mockImplementation((returns: unknown) => {
      return Object.create(Website.prototype, {
        switch: {
          value: jest.fn().mockReturnValue(returns),
        },
      });
    }),
    WebPage: jest.fn().mockImplementation(() => {
      return Object.create(WebPage.prototype);
    }),
    PageObject: jest.fn().mockImplementation(() => {
      return Object.create(PageObject.prototype);
    }),
  };
});
const mockedWebsite = jest.mocked(Website, true);
const MockedWebsite = mockedWebsite as unknown as Class<Website>;
const mockedWebPage = jest.mocked(WebPage, true);
const MockedWebPage = mockedWebPage as unknown as Class<WebPage>;
const mockedPageObject = jest.mocked(PageObject, true);
const MockedPageObject = mockedPageObject as unknown as Class<PageObject>;
describe('Observation', () => {
  describe('selecting a Page Object from a website', () => {
    it('should select an element from an observation of a PageObject', async () => {
      const po = new MockedPageObject();
      const inner = new Observation(MockedWebPage, () => po);
      jest.spyOn(inner, 'select');

      const site = new MockedWebsite(po);
      const selector = jest.fn().mockReturnValue(po);
      const sut = new Observation<PageObject, PageObject>(inner, selector);
      const result = await sut.select(site);
      expect(inner.select).toHaveBeenCalledWith(site);
      expect(result).toEqual(po);
    });
    it('should select an element from an observation of a Web Page', async () => {
      const component = new MockedPageObject();
      const inner = new Observation(MockedWebPage, () => component);
      jest.spyOn(inner, 'select');

      const site = new MockedWebsite();
      const selector = jest.fn().mockReturnValue(MockedWebPage);
      const sut = new Observation(inner, selector);
      const result = await sut.select(site);
      expect(inner.select).toHaveBeenCalledWith(site);
      expect(result.prototype).toEqual(MockedPageObject.prototype);
    });
    it('should throw an error for an unrecognized type', async () => {
      const inner = new Observation(MockedWebPage, () => MockedWebPage);
      const cls = class {};
      const returns = Promise.resolve(cls as unknown as Class<WebPage>);
      jest.spyOn(inner, 'select').mockReturnValue(returns);

      const site = new MockedWebsite();
      const selector = jest.fn().mockReturnValue(MockedWebPage);
      const sut = new Observation(inner, selector);
      const action = () => sut.select(site);
      await expect(action).rejects.toThrow(
        `Unrecognized type '${cls}: function'`
      );
    });
  });
  describe('static members', () => {
    describe('wrapOrReturn', () => {
      it('should return a provided observation directly', () => {
        const po = new MockedPageObject();
        const inner = new Observation(MockedWebPage, () => po);
        const returned = Observation.wrapOrReturn(inner);
        expect(returned).toEqual(inner);
      });
      it('should return a provided observation constructed from a WebPage', async () => {
        const returned = Observation.wrapOrReturn(MockedWebPage);
        const site = new MockedWebsite(MockedWebPage);
        const page = await returned.select(site);
        expect(returned.type).toEqual(MockedWebPage);
        expect(page).toEqual(MockedWebPage);
      });
    });
  });
});

describe('Factory Functions', () => {
  describe('Observations', () => {
    it('should construct an Observation from a WebPage', () => {
      const fn: (page: WebPage) => number = jest.fn().mockReturnValue(2);
      const page = new MockedWebPage();
      const observation = Observe(MockedWebPage, fn);
      expect(observation.type).toEqual(MockedWebPage);
      expect(observation.selector(page)).toEqual(2);
    });
    it('should construct an Observation from an Observation', () => {
      const fn: (page: WebPage) => number = jest.fn().mockReturnValue(2);
      const page = new MockedWebPage();
      const po = new MockedPageObject();
      const inner = new Observation(MockedPageObject, () => po);
      const observation = Observe(inner, fn);
      expect(observation.type.constructor).toEqual(Observation);
      expect(observation.selector(page)).toEqual(2);
    });
  });
});

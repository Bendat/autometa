import { WebPage } from '@autometa/page-components';
import { Class } from '@autometa/shared-utilities';
import {
  HasTitle,
  HasURL,
  Is,
  IsApproximately,
  IsGreaterThan,
  IsNumber,
  TitleContains,
  TitleMatches,
  URLContains,
  URLMatches,
} from './assertion';

jest.mock('@autometa/page-components', () => {
  return {
    WebPage: jest.fn().mockImplementation(() => {
      return Object.create(WebPage.prototype, {
        waitForTitleIs: {
          value: jest.fn().mockImplementation((title: string) => {
            if (title !== 'My Page') {
              throw new Error(`${title} does not equal "My Page"`);
            }
          }),
        },
        waitForTitleContains: {
          value: jest.fn().mockImplementation((title: string) => {
            if (!'My Page'.includes(title)) {
              throw new Error(`"My Page" does not contain ${title}`);
            }
          }),
        },
        waitForTitleMatches: {
          value: jest.fn().mockImplementation((regex: RegExp) => {
            if (!'My Page'.match(regex)) {
              throw new Error(`"My Page" does not match ${regex}`);
            }
          }),
        },
        waitForURLIs: {
          value: jest.fn().mockImplementation((url: string) => {
            if ('http://localhost' !== url) {
              throw new Error(`"http://localhost" is not ${url}`);
            }
          }),
        },
        waitForURLContains: {
          value: jest.fn().mockImplementation((title: string) => {
            if (!'http://localhost'.includes(title)) {
              throw new Error(`"http://localhost" does not contain ${title}`);
            }
          }),
        },
        waitForURLMatches: {
          value: jest.fn().mockImplementation((url: RegExp) => {
            if (!'http://localhost'.match(url)) {
              throw new Error(`"http://localhost" does not match ${url}`);
            }
          }),
        },
      });
    }),
  };
});
const mockedWebPage = jest.mocked(WebPage, true);
const MockedWebPage = mockedWebPage as unknown as Class<WebPage>;
describe('Assertions', () => {
  describe('Is', () => {
    it('should assert that two values are equal', async () => {
      await Is(2)(2);
    });
    
    it('should assert that two arrays are equal', async () => {
      await Is([1])([1]);
    });
    it('should fail to assert that two values are equal', async () => {
      await expect(async () => await Is(2)(3)).rejects.toThrow();
    });
  });
  describe('IsNumber', () => {
    it('should assert that a value is a number', async () => {
      await IsNumber()('2');
    });
    it('should fail assert that a value is a number', async () => {
      await expect(async () => await IsNumber()('whoop')).rejects.toThrow();
    });
    it('should assert that a value is a number equal to 2', async () => {
      await IsNumber(2)('2');
    });
    it('should fail to assert that two values are equal', async () => {
      await expect(async () => await IsNumber(2)(3)).rejects.toThrow();
    });
    it('should fail due to non numeric parameter', async () => {
      await expect(async () => await IsNumber(2)('')).rejects.toThrow();
    });
  });
  describe('IsApproximately', () => {
    it('should assert that 2.05 is approximately 2, with a precision of 0.1', async () => {
      await IsApproximately(2, 0.1)('2.05');
    });
    it('should fail as 2.2 is not approximately 2 with a precision of .01', async () => {
      const action = () => IsApproximately(2, 0.1)('2.2');
      await expect(action).rejects.toThrow();
    });
  });
  describe('IsGreaterThan', () => {
    it('should assert that 3 is greater than 2', async () => {
      await IsGreaterThan(2)('3');
    });
    it('should fail as 1 is not greater than 2', async () => {
      const action = () => IsGreaterThan(2)('1');
      await expect(action).rejects.toThrow();
    });
  });
  describe('Page Assertions', () => {
    describe('Title', () => {
      describe('HasTitle', () => {
        it('should confirm a page has the title "My Page"', async () => {
          const page = new MockedWebPage();
          await HasTitle('My Page')(page);
          expect(page.waitForTitleIs).toBeCalledWith('My Page', 2000);
        });
        it('should throw an error when the title is not "My Page"', async () => {
          const page = new MockedWebPage();
          const action = () => HasTitle('My Pages')(page);
          await expect(action).rejects.toThrowError();
          expect(page.waitForTitleIs).toBeCalledWith('My Pages', 2000);
        });
      });
    });
    describe('TitleContains', () => {
      it('should confirm a page has contains "My Pa"', async () => {
        const page = new MockedWebPage();
        await TitleContains('My Pa')(page);
        expect(page.waitForTitleContains).toBeCalledWith('My Pa', 2000);
      });
      it('should throw an error when the title is not contained in "My Page"', async () => {
        const page = new MockedWebPage();
        const action = () => TitleContains('My Pat')(page);
        await expect(action).rejects.toThrowError();
        expect(page.waitForTitleContains).toBeCalledWith('My Pat', 2000);
      });
    });
    describe('TitleMatches', () => {
      it('should confirm a page has contains "My Pa"', async () => {
        const page = new MockedWebPage();
        await TitleMatches(/My Pa/)(page);
        expect(page.waitForTitleMatches).toBeCalledWith(/My Pa/, 2000);
      });
      it('should throw an error when the title is not contained in "My Page"', async () => {
        const page = new MockedWebPage();
        const action = () => TitleContains('My Pat')(page);
        await expect(action).rejects.toThrowError();
        expect(page.waitForTitleContains).toBeCalledWith('My Pat', 2000);
      });
    });
    describe('URL', () => {
      describe('HasURL', () => {
        it('should confirm a page has the url "http://localhost"', async () => {
          const page = new MockedWebPage();
          await HasURL('http://localhost')(page);
          expect(page.waitForURLIs).toBeCalledWith('http://localhost', 2000);
        });
        it('should throw an error when the title is not "http://localhost"', async () => {
          const page = new MockedWebPage();
          const action = () => HasURL('http://google.com')(page);
          await expect(action).rejects.toThrowError();
          expect(page.waitForURLIs).toBeCalledWith('http://google.com', 2000);
        });
      });
    });
    describe('URLContains', () => {
      it('should confirm a page has contains "My Pa"', async () => {
        const page = new MockedWebPage();
        await URLContains('local')(page);
        expect(page.waitForURLContains).toBeCalledWith('local', 2000);
      });
      it('should throw an error when the title is not contained in "http://localhost"', async () => {
        const page = new MockedWebPage();
        const action = () => URLContains('total')(page);
        await expect(action).rejects.toThrowError();
        expect(page.waitForURLContains).toBeCalledWith('total', 2000);
      });
    });
    describe('URLMatches', () => {
      it('should confirm a page has matches "local"', async () => {
        const page = new MockedWebPage();
        await URLMatches(/local/gm)(page);
        expect(page.waitForURLMatches).toBeCalledWith(/local/gm, 2000);
      });
      it('should throw an error when the title is not contained in "http://localhost"', async () => {
        const page = new MockedWebPage();
        const action = () => URLMatches(/total/)(page);
        await expect(action).rejects.toThrowError();
        expect(page.waitForURLMatches).toBeCalledWith(/total/, 2000);
      });
    });
  });
});

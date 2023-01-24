import 'reflect-metadata';

import { Browser, Builder } from 'selenium-webdriver';
import * as firefox from 'selenium-webdriver/firefox';
import { IndexPage } from './pages/index-page';
import { SimpleTypeDiv } from './components/simple-types-div';
import { CompoundTypesDiv } from './components/compound-types';
import { ContainerArticle } from './components/container-types';
import { FormDiv } from './components/form-div';
import { Site } from '@autometa/page-components';
jest.setTimeout(500_000);
const wbBuilder = new Builder()
  .forBrowser(Browser.FIREFOX)
  .setFirefoxOptions(new firefox.Options().headless());
const url = 'http://127.0.0.1:8080/packages/page-object-models/page-components-integration-tests/index.html';

describe('Integration test', () => {
  const site = Site(url, wbBuilder);
  let page: IndexPage;
  beforeEach(async () => {
    page = await site.browse(IndexPage);
  });
  afterEach(async () => {
    await site.leave();
  });
  describe.only('Simple Type Div', () => {
    let div: SimpleTypeDiv;
    beforeEach(async () => (div = page.grid.simpleTypes));
    it('should test the simple div', async () => {
      const { button, unorderedList, firstParagraph, secondParagraph } = div;
      await button.click();
      const includesUlItems = await unorderedList.includes(
        ['ul item 1', 'ul item 2'],
        (component) => component.text
      );
      const notIncludesUlItems = await unorderedList.includes(
        ['ul item 3'],
        (component) => component.text
      );
      expect(includesUlItems).toBe(true);
      expect(notIncludesUlItems).toBe(false);
      expect(await firstParagraph.text).toBe('this is a paragraph');
      expect(await secondParagraph.text).toBe(
        'this is a paragraph with a span'
      );
      expect(await button.text).toBe("Hark! I've been clicked");
    });

    it('Checks UnorderedList as a forEach loop', async () => {
      const expected = ['ul item 1', 'ul item 2'];

      await div.unorderedList.forEach(async (li) => {
        expect(await li.text).toBe(expected.shift());
      });

      expect(expected).toStrictEqual([]);
    });

    it('Checks OrderedList as a for...of loop', async () => {
      const expected = ['ol item 1', 'ol item 2'];

      for (const li of await div.orderedListAsCollection.values) {
        expect(await li.text).toBe(expected.shift());
      }

      expect(expected).toStrictEqual([]);
    });
  });

  describe('Compound type div', () => {
    let div: CompoundTypesDiv;
    beforeEach(() => (div = page.grid.compoundTypes));
    it('should choose the 3rd option', async () => {
      const { dropdown } = div;
      await dropdown.choose(2);
      const value = await dropdown.value;
      expect(value).toBe('third');
    });

    it('should select the 3rd option manually', async () => {
      const { dropdown } = div;
      await dropdown.click();
      const option = await dropdown.at(2);
      await option.click();
      const value = await dropdown.value;
      expect(value).toBe('third');
    });
  });

  describe('Container Div', () => {
    let div: ContainerArticle;
    beforeEach(() => (div = page.grid.containerTypes.article));
    it('should read the article', async () => {
      const {
        header: { heading, paragraph: headerParagraph },
        paragraph: articleParagraph,
        link,
      } = div;

      const headerHeadingTitle = await heading.text;
      const headerText = await headerParagraph.text;
      const articleText = await articleParagraph.text;
      const linkHref = await link.href;

      expect(headerHeadingTitle).toBe('this is an article');
      expect(headerText).toBe("isn't that just neat");
      expect(articleText).toBe('This is my article');
      expect(linkHref).toBe(url);
    });
  });

  describe('Form Div', () => {
    let div: FormDiv;
    beforeEach(() => (div = page.grid.formTypes));

    it('should enter text into textual inputs', async () => {
      const { textInput, textArea } = div;
      await textArea.write('Hello World');
      await textInput.write('Hello Mars');

      expect(await textArea.value).toBe('Hello World');
      expect(await textInput.value).toBe('Hello Mars');
    });

    it('should check the checkboxes', async () => {
      const {
        checkFieldSet: { hasBars, hasFoos },
      } = div;

      await hasBars.select();
      await hasFoos.select();

      expect(await hasBars.isSelected).toBe(true);
      expect(await hasFoos.isSelected).toBe(true);
    });
    it('should check the radio buttons', async () => {
      const {
        radioFieldSet: { hasBazs, HasBuzzes },
      } = div;

      await hasBazs.select();
      await HasBuzzes.select();

      expect(await hasBazs.isSelected).toBe(false);
      expect(await HasBuzzes.isSelected).toBe(true);
    });
  });
});

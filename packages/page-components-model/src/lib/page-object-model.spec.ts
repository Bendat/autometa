// import 'reflect-metadata';
// import { Builder, Browser, By, until } from 'selenium-webdriver';
// import { Site } from './browse';
// import { ShopperHomepage } from '../sample-site/homepage';
// import { MoisturizerDiv } from '../sample-site/components/moisturizer-div';
// jest.setTimeout(100000);
// test('foo', () => {
//   console.log(until.titleMatches);
// });

// describe('pageObjectModel', () => {
//   const driver = new Builder().forBrowser(Browser.CHROME).build();
//   const url = 'https://weathershopper.pythonanywhere.com/';

//   let site: ShopperHomepage;

//   beforeEach(async () => {
//     site = await Site(url, driver).Browse(ShopperHomepage);
//   });

//   it('might workd', async () => {
//     await site.buyMoisturizers.click();

//     const shop = site.moisturizerShop;

//     await shop.collection.forEach((component) => {
//       return component.add.click();
//     });

//     const selected = await shop.collection.at(0);
//     console.log(await shop.collection.class)

//     await selected.add.click();

//     await shop.cart.click();

//     await shop.driver.wait(until.titleContains('Cart Items'), 10000);
//   });

//   afterEach(async () => {
//     await driver.quit();
//   });
// });
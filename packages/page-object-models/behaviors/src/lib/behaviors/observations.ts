import { PageObject, WebPage } from '@autometa/page-components';
import { constructor } from 'tsyringe/dist/typings/types';
import { Observe } from './observation';

export const Page = <T extends WebPage>(page: constructor<T>) =>
  Observe(page, ({ title }) => title);

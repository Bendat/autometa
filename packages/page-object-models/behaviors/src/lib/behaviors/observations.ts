import { WebPage } from '@autometa/page-components';
import { Class } from '@autometa/shared-utilities';
import { Observe } from './observation';

export const Page = <T extends WebPage>(page: Class<T>) =>
  Observe(page, ({ title }) => title);

import { PageObject, WebPage, Website } from '@autometa/page-components';
import { Class } from '@autometa/shared-utilities';
import { AssertionFn, Observation } from '../../behaviors';
import { QueueablePerformance } from './performance';

export abstract class ObservationPerformance extends QueueablePerformance {
  static from<T extends WebPage>(
    observer: Class<T>,
    assertion: AssertionFn
  ): ObserveWebpagePerformance<T>;
  static from<T extends PageObject, K>(
    observer: Observation<T, K>,
    assertion: AssertionFn
  ): ObserverPerformance<T, K>;
  static from<T extends WebPage | PageObject, K>(
    observer: Class<T> | Observation<T, K>,
    assertion: AssertionFn
  ): ObserveWebpagePerformance<WebPage> | ObserverPerformance<T, K>;
  static from<T extends WebPage | PageObject, K>(
    observer: Class<T> | Observation<T, K>,
    assertion: AssertionFn
  ): ObserveWebpagePerformance<WebPage> | ObserverPerformance<T, K> {
    if (observer instanceof Observation) {
      return new ObserverPerformance(observer, assertion);
    }
    return new ObserveWebpagePerformance(
      observer as unknown as Class<WebPage>,
      assertion
    );
  }
}

export class ObserverPerformance<
  T extends PageObject,
  K
> extends ObservationPerformance {
  readonly behavior: string = 'sees';
  constructor(
    public readonly observer: Observation<T, K>,
    public readonly assertion: AssertionFn
  ) {
    super();
  }
  override performance = async (site: Website) => {
    const element = await this.observer.select(site);
    await this.assertion(element);
  };
}

export class ObserveWebpagePerformance<
  T extends WebPage
> extends ObservationPerformance {
  readonly behavior: string = 'sees';

  constructor(
    public readonly webpage: Class<T>,
    public readonly assertion: AssertionFn
  ) {
    super();
  }

  performance = async (site: Website) => {
    const page = site.switch(this.webpage);
    await this.assertion(page);
  };
}

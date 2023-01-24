import { PageObject, Website } from '@autometa/page-components';
import { Action } from '../../behaviors';
import { QueueablePerformance } from './performance';

export class ActionPerformance<
  T extends PageObject,
  K extends PageObject
> extends QueueablePerformance {
  readonly behavior = 'does';

  constructor(public readonly action: Action<T, K>) {
    super();
  }

  performance = async (site: Website): Promise<void> => {
    await this.action.execute(site);
  };
}

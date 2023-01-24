import { Website } from '@autometa/page-components';
import { QueueablePerformance } from './performance';

export class TechnicalPerformance extends QueueablePerformance {
  constructor(
    public behavior: string,
    public action: (site: Website) => Promise<unknown>
  ) {
    super();
  }
  performance = async (site: Website) => {
    await this.action(site);
  };
}

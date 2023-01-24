import { Website } from '@autometa/page-components';

export interface Performance {
  performance: (site: Website) => Promise<void>;
}

export abstract class QueueablePerformance implements Performance {
  abstract readonly behavior: string;
  abstract performance(site: Website): Promise<void>;
}

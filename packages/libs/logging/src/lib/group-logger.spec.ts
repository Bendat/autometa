import { GroupLogger } from './group-logger';

test('logging', () => {
  const logger = new GroupLogger();
  logger.group('My Group');
  logger.group('My Group 2');
  logger.log('My Log');
});

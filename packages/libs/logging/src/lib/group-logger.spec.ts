import { GroupLogger } from './group-logger';

test('logging', () => {
  const logger = new GroupLogger();
  logger.group('My Group');
  logger.group('My Group 2');
  logger.log('My Log');
});

describe('GroupLogger', ()=>{
  describe('error', ()=>{
    const logger = new GroupLogger()
    it('should render an error and stacktrace', ()=>{
      logger.error('my oh my error')
    })  
    it('should format an error and stacktrace', ()=>{
      logger.error('my oh my %s', 'error')
    })  
    it('should print a provided error and stacktrace', ()=>{
      logger.error('my oh my %s', 'error')
    })  
  })
  describe('trace', ()=>{
    const logger = new GroupLogger()
    it('should render an error and stacktrace', ()=>{
      console.log(new Error().stack)
      logger.trace('my oh trace')
    })  
  })
})
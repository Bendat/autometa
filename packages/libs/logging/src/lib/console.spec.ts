import { GroupLogger } from './group-logger';

import { useConsoleGroups, grouping, DefaultGroupLogger } from './console';

jest.mock('./group-logger', () => {
  return {
    GroupLogger: jest.fn().mockImplementation(() => {
      return Object.create(GroupLogger.prototype, {
        grouping: {
          value: jest.fn().mockReturnValue(true),
        },
        group: {
          value: jest.fn(),
        },
        ungroup: {
          value: jest.fn(),
        },
        log: {
          value: jest.fn(),
        },
        warn: {
          value: jest.fn(),
        },
        debug: {
          value: jest.fn(),
        },
        error: {
          value: jest.fn(),
        },
      });
    }),
  };
});
useConsoleGroups();

describe('console', () => {
  describe('group', () => {
    it('should start a new console group', () => {
      console.group('A group');
      console.groupEnd();
      expect(DefaultGroupLogger.group).toBeCalledTimes(1);
      expect(DefaultGroupLogger.ungroup).toBeCalledTimes(1);
    });
  });

  describe('grouping', () => {
    beforeEach(() => jest.clearAllMocks());
    it('Should successfully group an action', () => {
      const action = () => true;
      const result = grouping('a test group', action);
      expect(result).toBe(true);
      expect(DefaultGroupLogger.grouping).toHaveBeenCalledTimes(1);
    });
  });
});

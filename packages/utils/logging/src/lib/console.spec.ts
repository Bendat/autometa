import { bold } from 'ansi-colors';
import {
  endGroup,
  useConsoleGroups,
  startGroup,
  grouping,
} from './console';
import { ConsoleGroupToken } from './group-tokens';


useConsoleGroups();
describe('console', () => {
  describe('group', () => {
    it('should start a new console group', () => {
      const stdSpy = jest.spyOn(process.stdout, 'write');
      console.group('A group');
      console.groupEnd();
      const args: string = stdSpy.mock.calls[0][0] as unknown as string;
      expect(args.trim()).toEqual(bold('A group'));
    });

    it('should show a warning if end group is mismatched', () => {
      const warnSpy = jest.spyOn(console, 'warn');
      startGroup('Test Group' as unknown as ConsoleGroupToken);
      endGroup('Less Group' as unknown as ConsoleGroupToken);
      expect(warnSpy).toHaveBeenCalledWith(
        "Attempting to end console group 'Less Group', however currently active group is 'Test Group'. Make sure you end any open inner groups, and beware asynchronous grouping."
      );
    });
  });

  describe('grouping', () => {
    it('Should successfully group an action', () => {
      const groupSpy = jest.spyOn(console, 'group');
      const groupEndSpy = jest.spyOn(console, 'groupEnd');
      const action = () => true;
      const result = grouping('a test group', action);
      expect(result).toBe(true);
      expect(groupSpy).toHaveBeenCalled();
      expect(groupEndSpy).toHaveBeenCalled();
    });
    it('Should successfully group an action which errors', () => {
      const groupSpy = jest.spyOn(console, 'group');
      const groupEndSpy = jest.spyOn(console, 'groupEnd');
      const action = () => {
        throw new Error('bad error');
      };
      const result = () => grouping('a test group', action);
      expect(result).toThrow('grouping failed due to action throwing an error Error: bad error');
      expect(groupSpy).toHaveBeenCalled();
      expect(groupEndSpy).toHaveBeenCalled();
    });

    it('Should successfully group an action with a promise', async () => {
      const groupSpy = jest.spyOn(console, 'group');
      const groupEndSpy = jest.spyOn(console, 'groupEnd');

      const action = async () =>
        await new Promise((resolve) => setTimeout(resolve, 1000));
      const result = grouping('a test group', action);
      await expect(result).resolves.toBe(undefined);
      expect(groupSpy).toHaveBeenCalled();
      expect(groupEndSpy).toHaveBeenCalled();
    });
  });
});

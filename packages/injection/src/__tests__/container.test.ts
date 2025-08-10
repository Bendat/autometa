import { describe, it, expect, beforeEach } from 'vitest';
import { 
  Container, 
  createContainer, 
  Scope, 
  createToken,
  CircularDependencyError,
  UnregisteredDependencyError
} from '../index';

describe('Container', () => {
  let container: Container;

  beforeEach(() => {
    container = createContainer() as Container;
  });

  describe('Class Registration and Resolution', () => {
    it('should register and resolve a simple class', () => {
      class TestService {
        getValue() {
          return 'test';
        }
      }

      container.registerClass(TestService);
      const instance = container.resolve(TestService);

      expect(instance).toBeInstanceOf(TestService);
      expect(instance.getValue()).toBe('test');
    });

    it('should resolve transient instances by default', () => {
      class TestService {}

      container.registerClass(TestService);
      const instance1 = container.resolve(TestService);
      const instance2 = container.resolve(TestService);

      expect(instance1).toBeInstanceOf(TestService);
      expect(instance2).toBeInstanceOf(TestService);
      expect(instance1).not.toBe(instance2);
    });

    it('should resolve singleton instances when configured', () => {
      class TestService {}

      container.registerClass(TestService, { scope: Scope.SINGLETON });
      const instance1 = container.resolve(TestService);
      const instance2 = container.resolve(TestService);

      expect(instance1).toBeInstanceOf(TestService);
      expect(instance2).toBeInstanceOf(TestService);
      expect(instance1).toBe(instance2);
    });

    it('should handle REQUEST scoped instances', () => {
      class TestService {}

      container.registerClass(TestService, { scope: Scope.REQUEST });
      const instance1 = container.resolve(TestService);
      const instance2 = container.resolve(TestService);

      // REQUEST scoped instances should be cached within the same request context
      // For now they behave like singletons until we implement request contexts
      expect(instance1).toBeInstanceOf(TestService);
      expect(instance2).toBeInstanceOf(TestService);
      expect(instance1).toBe(instance2);
    });

    it('should handle SESSION scoped instances', () => {
      class TestService {}

      container.registerClass(TestService, { scope: Scope.SESSION });
      const instance1 = container.resolve(TestService);
      const instance2 = container.resolve(TestService);

      // SESSION scoped instances should be cached within the same session context
      // For now they behave like singletons until we implement session contexts
      expect(instance1).toBeInstanceOf(TestService);
      expect(instance2).toBeInstanceOf(TestService);
      expect(instance1).toBe(instance2);
    });
  });

  describe('Value Registration', () => {
    it('should register and resolve values', () => {
      const value = { message: 'hello world' };
      
      container.registerValue('config', value);
      const resolved = container.resolve('config');

      expect(resolved).toBe(value);
    });
  });

  describe('Factory Registration', () => {
    it('should register and resolve factory functions', () => {
      interface Config {
        apiUrl: string;
      }

      container.registerFactory<Config>('config', () => ({
        apiUrl: 'https://api.example.com'
      }));

      const config = container.resolve<Config>('config');
      expect(config.apiUrl).toBe('https://api.example.com');
    });

    it('should provide container to factory functions', () => {
      container.registerValue('baseUrl', 'https://api.example.com');
      
      container.registerFactory('fullUrl', (container) => {
        const baseUrl = container.resolve<string>('baseUrl');
        return `${baseUrl}/v1`;
      });

      const fullUrl = container.resolve<string>('fullUrl');
      expect(fullUrl).toBe('https://api.example.com/v1');
    });
  });

  describe('Token Registration', () => {
    it('should register and resolve token-based dependencies', () => {
      const CONFIG_TOKEN = createToken<{ apiUrl: string }>('config');
      
      container.registerToken(CONFIG_TOKEN, () => ({
        apiUrl: 'https://api.example.com'
      }));

      const config = container.resolve(CONFIG_TOKEN);
      expect(config.apiUrl).toBe('https://api.example.com');
    });
  });

  describe('Simple Dependency Injection', () => {
    it('should resolve dependencies for classes without constructor args', () => {
      class Database {
        connect() {
          return 'connected';
        }
      }

      class UserService {
        constructor() {
          // We'll manually inject dependencies for now
          this.db = new Database();
        }
        
        private db: Database;
        
        getUsers() {
          return `Users from ${this.db.connect()}`;
        }
      }

      container.registerClass(Database);
      container.registerClass(UserService);

      const userService = container.resolve(UserService);
      expect(userService.getUsers()).toBe('Users from connected');
    });
  });

  describe('Child Containers', () => {
    it('should create child containers', () => {
      const child = container.createChild();
      expect(child).toBeDefined();
      expect(child.parent).toBe(container);
    });

    it('should resolve from parent when not found in child', () => {
      class TestService {}
      
      container.registerClass(TestService);
      const child = container.createChild();
      
      const instance = child.resolve(TestService);
      expect(instance).toBeInstanceOf(TestService);
    });

    it('should prefer child registrations over parent', () => {
      class TestService {
        getValue() {
          return 'parent';
        }
      }

      class ChildTestService {
        getValue() {
          return 'child';
        }
      }

      container.registerClass(TestService);
      const child = container.createChild();
      child.registerFactory(TestService, () => new ChildTestService());

      const instance = child.resolve(TestService);
      expect(instance.getValue()).toBe('child');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unregistered dependencies', () => {
      class UnregisteredService {}

      expect(() => container.resolve(UnregisteredService))
        .toThrow(UnregisteredDependencyError);
    });

    it('should detect simple circular dependencies', () => {
      // We'll test this with factory functions to control the dependency graph
      container.registerFactory('serviceA', (container) => {
        container.resolve('serviceB'); // This will cause circular dependency
        return { name: 'A' };
      });

      container.registerFactory('serviceB', (container) => {
        container.resolve('serviceA'); // This will cause circular dependency
        return { name: 'B' };
      });

      expect(() => container.resolve('serviceA'))
        .toThrow(CircularDependencyError);
    });

    it('should provide helpful error messages for unregistered dependencies', () => {
      class UnregisteredService {}

      try {
        container.resolve(UnregisteredService);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(UnregisteredDependencyError);
        expect(error.message).toContain('UnregisteredService');
      }
    });

    it('should handle factory function errors gracefully', () => {
      container.registerFactory('brokenService', () => {
        throw new Error('Factory function failed');
      });
      
      expect(() => container.resolve('brokenService'))
        .toThrow('Factory function failed');
    });
  });

  describe('Introspection', () => {
    it('should check if identifier is registered', () => {
      class TestService {}
      
      expect(container.isRegistered(TestService)).toBe(false);
      
      container.registerClass(TestService);
      expect(container.isRegistered(TestService)).toBe(true);
    });

    it('should get binding information', () => {
      class TestService {}
      
      container.registerClass(TestService, { scope: Scope.SINGLETON });
      const binding = container.getBinding(TestService);

      expect(binding).toBeDefined();
      expect(binding?.type).toBe('class');
      expect(binding?.scope).toBe(Scope.SINGLETON);
    });
  });

  describe('Tagged Resolution', () => {
    it('should resolve dependencies by tag', () => {
      class Service1 {}
      class Service2 {}
      class Service3 {}

      container.registerClass(Service1, { tags: ['handler'] });
      container.registerClass(Service2, { tags: ['handler'] });
      container.registerClass(Service3, { tags: ['other'] });

      const handlers = container.resolveByTag('handler');
      expect(handlers).toHaveLength(2);
      expect(handlers[0]).toBeInstanceOf(Service1);
      expect(handlers[1]).toBeInstanceOf(Service2);
    });
  });

  describe('Lifecycle Management', () => {
    it('should dispose container and clean up instances', async () => {
      let disposed = false;
      
      class DisposableService {
        async dispose() {
          disposed = true;
        }
      }

      container.registerClass(DisposableService, { scope: Scope.SINGLETON });
      container.resolve(DisposableService);

      await container.dispose();
      expect(disposed).toBe(true);
    });
  });

  describe('Performance and Behavior', () => {
    it('should handle multiple rapid resolutions efficiently', () => {
      class FastService {
        value = Math.random();
      }

      container.registerClass(FastService, { scope: Scope.SINGLETON });

      // Resolve many times rapidly
      const results = Array.from({ length: 100 }, () => container.resolve(FastService));
      
      // All should be the same instance (singleton)
      expect(results.every(instance => instance === results[0])).toBe(true);
      expect(results[0]).toBeInstanceOf(FastService);
    });

    it('should handle tryResolve for optional dependencies', () => {
      class ExistingService {}
      class NonExistentService {}

      container.registerClass(ExistingService);

      const existing = container.tryResolve(ExistingService);
      const nonExistent = container.tryResolve(NonExistentService);

      expect(existing).toBeInstanceOf(ExistingService);
      expect(nonExistent).toBeUndefined();
    });

    it('should handle deep child container hierarchies', () => {
      interface Service {
        level: string;
      }

      container.registerFactory<Service>('service', () => ({ level: 'root' }));
      
      const child1 = container.createChild();
      child1.registerFactory<Service>('service', () => ({ level: 'child1' }));
      
      const child2 = child1.createChild();
      child2.registerFactory<Service>('service', () => ({ level: 'child2' }));

      const rootService = container.resolve<Service>('service');
      const child1Service = child1.resolve<Service>('service');
      const child2Service = child2.resolve<Service>('service');

      expect(rootService.level).toBe('root');
      expect(child1Service.level).toBe('child1');
      expect(child2Service.level).toBe('child2');
    });
  });
});

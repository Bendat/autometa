# Decorator Implementation Strategy

## Supporting Both Decorator Standards

### Current Situation
- **Experimental Decorators**: Legacy TypeScript system with `reflect-metadata`
- **ES Decorators**: New TC39 standard (Stage 3) supported in TypeScript 5.0+

### Recommended Approach: **Dual Export Pattern**

```typescript
// For Experimental Decorators users
import { injectable, inject } from '@autometa/injection/experimental';

// For ES Decorators users  
import { injectable, inject } from '@autometa/injection/es';

// For automatic detection
import { injectable, inject } from '@autometa/injection/decorators';
```

## Implementation Structure

```
src/
├── container.ts              # Core container (no decorators)
├── types.ts                  # Core types
├── index.ts                  # Main export
└── decorators/
    ├── index.ts              # Auto-detecting decorators
    ├── experimental.ts       # Experimental decorator impl
    ├── es.ts                 # ES decorator impl
    └── unified.ts            # Common abstractions
```

## Package.json Exports

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./container": "./dist/container.js",
    "./decorators": "./dist/decorators/index.js",
    "./decorators/experimental": "./dist/decorators/experimental.js",
    "./decorators/es": "./dist/decorators/es.js"
  }
}
```

## Benefits

1. **User Choice**: Explicit control over decorator system
2. **Gradual Migration**: Users can migrate from experimental to ES decorators
3. **Tree Shaking**: Only load the decorator system you use
4. **Core Independence**: Container works without any decorators
5. **Future Proof**: Easy to add new decorator systems

## Container Integration

The container would need minimal changes to support both:

```typescript
// Enhanced container method for decorator support
private instantiateClass<T>(constructor: Constructor<T>, context: ResolutionContext): T {
  // Try decorator-based injection first
  if (this.decoratorRegistry) {
    const metadata = this.decoratorRegistry.getParameterMetadata(constructor);
    if (metadata) {
      return this.instantiateWithMetadata(constructor, metadata, context);
    }
  }
  
  // Fall back to simple instantiation
  try {
    return new constructor();
  } catch (error) {
    throw new Error(`Cannot instantiate ${constructor.name}: Constructor requires parameters`);
  }
}
```

## Migration Path

1. **Phase 1**: Implement core container without decorators ✅ DONE
2. **Phase 2**: Add experimental decorator support
3. **Phase 3**: Add ES decorator support  
4. **Phase 4**: Add unified auto-detection layer

## Usage Examples

### Experimental Decorators
```typescript
import 'reflect-metadata';
import { Container } from '@autometa/injection';
import { injectable, inject } from '@autometa/injection/decorators/experimental';

@injectable
class UserService {
  constructor(
    @inject('database') private db: Database,
    @optional private logger?: Logger
  ) {}
}
```

### ES Decorators
```typescript
import { Container } from '@autometa/injection';
import { injectable, inject } from '@autometa/injection/decorators/es';

@injectable
class UserService {
  @inject('database')
  private db!: Database;
  
  @optional
  @inject('logger')  
  private logger?: Logger;
}
```

### Auto-Detection
```typescript
import { Container } from '@autometa/injection';
import { injectable, inject } from '@autometa/injection/decorators';

// Works with either decorator system based on tsconfig.json
@injectable
class UserService {
  // Implementation depends on decorator system detected
}
```

## Recommendation
Start with **experimental decorators** as they have better constructor parameter support and mature ecosystem, then add ES decorator support as the standard stabilizes.

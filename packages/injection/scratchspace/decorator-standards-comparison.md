# TypeScript Decorator Standards Comparison

## Two Standards Overview

### 1. **Experimental Decorators** (TypeScript Legacy)
- `experimentalDecorators: true` + `emitDecoratorMetadata: true`
- Uses `reflect-metadata` library
- Function-based decorators
- Runtime metadata emission
- Been around since TypeScript 1.5

### 2. **ES Decorators** (TC39 Stage 3)
- `experimentalDecorators: false` (default in TS 5.0+)
- New decorator proposal from TC39
- Context-based decorators
- No automatic metadata emission
- TypeScript 5.0+ support

## Key Differences

| Feature | Experimental | ES Decorators |
|---------|-------------|---------------|
| **Syntax** | `@decorator` | `@decorator` |
| **Implementation** | Function receives target | Function receives value + context |
| **Metadata** | Automatic via reflect-metadata | Manual via context.metadata |
| **Type Info** | `design:type`, `design:paramtypes` | Manual registration |
| **Composition** | Apply order matters | More predictable composition |
| **Performance** | Runtime metadata overhead | More efficient |

## Compatibility Strategy

### Option A: **Dual Export Pattern**
- Export both decorator implementations
- User chooses based on their TypeScript config

### Option B: **Runtime Detection**
- Detect which decorator system is active
- Adapt behavior accordingly

### Option C: **Abstraction Layer**
- Common decorator interface
- Implementation adapters for each standard

## Recommendation
Start with **Option A** (Dual Export) as it's:
- Explicit and clear
- Allows gradual migration
- Doesn't require runtime detection overhead
- Lets users choose based on their needs

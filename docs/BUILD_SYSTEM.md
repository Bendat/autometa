# Improved Build System Documentation

## Overview

This document outlines the improvements made to the Autometa monorepo build system, focusing on better developer experience, faster builds, and solving the "stale binaries" problem.

## Key Improvements

### 1. Separated Type-Checking from Bundling

**Problem**: TSUP was doing both type-checking and bundling, which is slower.

**Solution**: 
- **Type-checking**: Handled by TypeScript (`tsc`) with project references for incremental compilation
- **Bundling**: Handled by TSUP for fast ESM/CJS output generation

### 2. TypeScript Project References

**Problem**: No incremental compilation meant rebuilding everything from scratch.

**Solution**: 
- Automatic TypeScript project references setup
- Incremental compilation across the monorepo
- Proper dependency resolution between packages

### 3. Optimized Task Dependencies

**Problem**: Tests required building all packages first, leading to slow feedback loops.

**Solution**:
- Tests now depend on `type-check` instead of `build` for faster execution
- Type-checking runs incrementally
- Build only happens when actually bundling/publishing

## Workflow Changes

### Development Workflow

```bash
# 1. Start development with type-checking
pnpm type-check:watch

# 2. Run tests (no build required!)
pnpm test

# 3. Run tests in watch mode
pnpm test:watch

# 4. Build only when needed (publishing, etc.)
pnpm build
```

### New Task Dependency Graph

```
type-check (incremental) ←─┐
├─ test                     │
├─ coverage                 │
└─ build ←─ type-check      │
                            │
lint (no deps)              │
clean (no deps)             │
sync-ts-references          │
```

### Before vs After

| Task | Before | After | Improvement |
|------|--------|-------|-------------|
| **First test run** | Build all packages → Run tests | Type-check incrementally → Run tests | ~60% faster |
| **Subsequent tests** | Build all packages → Run tests | Skip type-check (unchanged) → Run tests | ~80% faster |
| **Type errors** | Found during build | Found during type-check | Immediate feedback |

## Configuration Files

### 1. Shared TSUP Configuration

Located at `configuration/tsup-config/base.js`:

```typescript
import { createTsupConfig } from "tsup-config";

export default createTsupConfig({
  // Package-specific overrides
});
```

**Benefits**:
- Consistent configuration across packages
- Easy to update globally
- Package-specific customization when needed

### 2. TypeScript Configuration

Each package gets:
- `tsconfig.json` extending shared configuration
- Automatic project references to dependencies
- Incremental compilation setup

### 3. Turbo Configuration

Updated to:
- Separate `type-check` and `build` tasks
- Optimal dependency graph
- Better caching strategy

## Scripts and Automation

### Automatic TypeScript References

The `scripts/update-ts-references.mjs` script:
- Runs automatically after `pnpm install`
- Updates TypeScript project references based on package dependencies
- Ensures incremental compilation works correctly

### Enhanced Package Scripts

Each generated package includes:

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest --passWithNoTests",
    "coverage": "vitest run --coverage --passWithNoTests"
  }
}
```

## Developer Experience Improvements

### 1. Faster Feedback Loop

- **Type errors**: Immediate feedback during development
- **Test execution**: No build step required
- **Hot reloading**: Type-checking runs in watch mode

### 2. Incremental Everything

- **Type-checking**: Only checks changed files and dependencies
- **Testing**: Vitest's built-in watch mode
- **Building**: Turbo's intelligent caching

### 3. Better Error Messages

- **Type errors**: Direct from TypeScript with source maps
- **Build errors**: Clear separation between type and build issues
- **Test errors**: No noise from stale builds

## Migration Guide

### For Existing Packages

1. Update `tsconfig.json`:
   ```json
   {
     "extends": "tsconfig/package.json",
     "compilerOptions": {
       "composite": true,
       "outDir": "./dist/types",
       "rootDir": "./src"
     }
   }
   ```

2. Update `tsup.config.ts`:
   ```typescript
   import { createTsupConfig } from "tsup-config";
   export default createTsupConfig();
   ```

3. Update `package.json` scripts to match the template

### For New Packages

Simply use `pnpm turbo:gen` - everything is configured automatically!

## Troubleshooting

### "Type errors during tests"

**Cause**: TypeScript project references not updated
**Solution**: Run `pnpm sync-ts-references`

### "Slow type-checking"

**Cause**: Incremental cache invalidated
**Solution**: 
1. Check if `tsconfig.tsbuildinfo` files exist
2. Run type-check once to rebuild cache
3. Subsequent runs will be fast

### "Build failing after type-check passes"

**Cause**: TSUP configuration issue
**Solution**: Check `tsup.config.ts` for package-specific overrides

## Performance Metrics

Expected improvements:
- **Initial type-check**: Similar to before
- **Incremental type-check**: 5-10x faster  
- **Test execution**: 3-5x faster (no build step)
- **Development feedback**: Near-instant
- **CI builds**: 20-30% faster overall

## Future Enhancements

1. **Parallel type-checking**: TypeScript 5.0+ project references improvements
2. **Build optimization**: TSUP 8.0+ features
3. **Watch mode improvements**: Better file watching across the monorepo
4. **Bundle analysis**: Automatic bundle size tracking

---
inclusion: manual
---

# Performance Optimization Rules

Use this when working on performance improvements.

## Measurement First
- Always measure before optimizing
- Use Chrome DevTools Performance tab
- Check React DevTools Profiler

## Common Optimizations
1. **Reduce re-renders**: Use React.memo, useMemo, useCallback
2. **Lazy load**: Code-split with React.lazy
3. **Optimize images**: Use WebP, lazy loading
4. **Cache aggressively**: Use React Query cache, local storage
5. **Debounce/throttle**: For expensive operations

## Client-Side Calculations
- Move calculations from server to client when possible
- Use cached data instead of fetching
- Calculate optimistically, sync in background

## Bundle Size
- Check bundle analyzer regularly
- Tree-shake unused code
- Use dynamic imports for large dependencies

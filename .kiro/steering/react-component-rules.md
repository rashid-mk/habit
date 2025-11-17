---
inclusion: fileMatch
fileMatchPattern: 'src/components/*.tsx'
---

# React Component Guidelines

## Component Structure
- Props interface at the top
- Component function
- Helper functions below
- Styles/constants at bottom

## State Management
- Use local state for UI-only state
- Use React Query for server state
- Lift state only when necessary

## Performance
- Use React.memo for expensive renders
- Memoize callbacks with useCallback
- Memoize computed values with useMemo

## Accessibility
- Always include ARIA labels
- Ensure keyboard navigation works
- Use semantic HTML elements

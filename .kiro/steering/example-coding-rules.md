# Coding Standards

## General Rules
- Write minimal, focused code
- Avoid over-engineering solutions
- Prioritize readability over cleverness

## React/TypeScript Specific
- Use functional components with hooks
- Always type props and state
- Prefer composition over inheritance
- Use React Query for server state management

## Performance
- Use optimistic updates for instant UI feedback
- Calculate analytics client-side when possible
- Minimize Firestore reads by using cache

## Testing
- Focus on core functionality tests
- Keep tests simple and maintainable
- Mock external dependencies appropriately

## Local Testing Rules
- **ALWAYS** run `npm run build` after making code changes
- Verify the build succeeds before considering the task complete
- Use `getDiagnostics` tool to check for TypeScript/lint errors
- If build fails, fix errors immediately before proceeding
- Local testing is mandatory - never skip this step

## Deployment Rules
- **NEVER** automatically push to GitHub or deploy to Firebase
- **ONLY** deploy when explicitly requested with phrases like:
  - "deploy this"
  - "push to GitHub"
  - "deploy to Firebase"
  - "commit and push"
- After making changes, always ask: "Would you like me to deploy these changes?"
- Build and test locally, but wait for explicit approval before deploying

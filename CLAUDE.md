# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack TypeScript monorepo with an Express backend and React frontend (Vite). The architecture supports both development (two separate servers) and production (single server serving everything).

## Development Commands
- Use comments sparingly unless there is an overly complex file or function
- Use `bd` commands from AGENTS.md to track TODOS and tasks
- Follow all guides in AGENTS.md and AGENTS-REFERENCE.md


### Workflow

1. **Check for ready work**: Run `bd ready` to see what's unblocked
2. **Claim your task**: `bd update <id> --status in_progress`
3. **Work on it**: Implement, test, document
4. **Discover new work**: If you find bugs or TODOs, create issues:
    - `bd create "Found bug in auth" -t bug -p 1 --json`
    - Link it: `bd dep add <new-id> <current-id> --type discovered-from`
5. **Complete**: `bd close <id> --reason "Implemented"`
6. **Export**: Run `bd export -o .beads/issues.jsonl` before committing

### Issue Types

- `bug` - Something broken that needs fixing
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature composed of multiple issues
- `chore` - Maintenance work (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (nice-to-have features, minor bugs)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)


### Full-Stack Development
```bash
npm run dev:all          # Run both backend (port 3000) and frontend (port 5173) concurrently
```

### Backend Only
```bash
npm run dev              # Start backend with auto-reload via nodemon + tsx
npm run build            # Compile TypeScript to dist/
npm start                # Run compiled production build
npm run type-check       # Check types without building
npm run lint             # Check ESLint errors
npm run lint:fix         # Auto-fix ESLint errors
npm run format           # Format code with Prettier
```

### Frontend Only
```bash
npm run client:dev       # Start Vite dev server (port 5173)
npm run client:build     # Build frontend to client/dist/
npm run client:type-check # Check frontend types
cd client && npm run lint      # Lint frontend
cd client && npm run lint:fix  # Auto-fix frontend linting
```

### Combined Operations
```bash
npm run build:all        # Build both backend and frontend
npm run lint:all         # Lint both codebases
npm run format:all       # Format both codebases
```

### Production Build & Deploy
```bash
npm run build:all
NODE_ENV=production npm start  # Serves frontend from Express on port 3000
```

## Architecture

### Monorepo Structure
- **Root**: Backend Express server (`src/`)
- **`client/`**: React frontend with Vite

### Backend Architecture (`src/`)

**Entry Point**: `src/server.ts`
- Express app with conditional behavior based on `NODE_ENV`
- **Development**: Enables CORS for frontend dev server (localhost:5173)
- **Production**: Serves static files from `client/dist/` with SPA fallback

**API Routes**: All routes are prefixed with `/api`
- Routes defined in `src/routes/index.ts`
- Example: `/api` and `/api/:id`

**Environment Configuration**: `src/config/environment.ts`
- Validates and exports typed environment variables
- Includes `clientDistPath` for production static serving
- Uses bracket notation for `process.env` access (strict TypeScript requirement)

**CORS Middleware**: `src/middleware/cors.ts`
- Only applied in development
- Allows requests from `http://localhost:5173` (Vite dev server)

### Frontend Architecture (`client/src/`)

**Framework**: React 18 + TypeScript + Vite

**Routing**: React Router v6 (`App.tsx`)
- Routes defined in `App.tsx`
- Uses `BrowserRouter` with `Layout` wrapper

**State Management**: React Query (TanStack Query)
- Configuration: `lib/queryClient.ts` (5-minute stale time, 1 retry)
- Custom hooks: `hooks/useApi.ts`
- API client: `lib/api.ts` (Axios-based)

**API Communication**:
- **Development**: Vite proxy forwards `/api/*` to `http://localhost:3000`
- **Production**: Frontend served from same origin, direct `/api` calls
- API base URL set via `import.meta.env.VITE_API_URL` or defaults to `/api`

**Styling**: TailwindCSS with PostCSS

**Path Aliases**: `@/*` resolves to `./src/*` (configured in `vite.config.ts` and `tsconfig.json`)

### TypeScript Configuration

**Backend** (`tsconfig.json`):
- **Strict mode**: All strict flags enabled
- Target: ES2022, CommonJS modules
- Outputs to `dist/` with source maps and declarations
- Key strict rules: `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`

**Frontend** (`client/tsconfig.json`):
- **Strict mode**: Matches backend strictness
- Target: ES2020, ESNext modules (Vite bundler mode)
- JSX: `react-jsx`
- No emit (Vite handles bundling)

### Environment Variables

**Backend** (`.env`):
```
PORT=3000
NODE_ENV=development
APP_NAME=express-hello-app
VITE_API_URL=http://localhost:3000
```

**Frontend**: Vite environment variables must be prefixed with `VITE_`
- Access via `import.meta.env.VITE_*`
- Type definitions in `client/src/vite-env.d.ts`

## Critical Architecture Patterns

### API Route Prefix Pattern
All backend API routes must use the `/api` prefix to avoid conflicts with React Router in production. This allows Express to:
1. Serve API routes at `/api/*`
2. Serve static files for everything else
3. Fallback to `index.html` for client-side routing

### Environment-Dependent Behavior
The server changes behavior based on `NODE_ENV`:
- **Development**: CORS enabled, separate frontend dev server
- **Production**: CORS disabled, serves built frontend from `client/dist/`

### Strict TypeScript Enforcement
Both codebases use identical strict TypeScript settings. When accessing indexed properties (like `process.env`), use bracket notation:
```typescript
// Correct
const value = process.env['MY_VAR']

// Incorrect (will fail type-check)
const value = process.env.MY_VAR
```

### React Query Data Fetching
API calls are abstracted through:
1. `lib/api.ts` - Axios client with typed methods
2. `hooks/useApi.ts` - React Query hooks wrapping API methods
3. Components consume hooks, never call API directly

## Common Gotchas

1. **Port conflicts**: Backend uses 3000, frontend uses 5173. Check for running processes if dev servers fail to start.

2. **CORS in production**: CORS is intentionally disabled in production since frontend is served from the same origin.

3. **Path aliases**: Frontend uses `@/*` for imports. Don't forget to update both `vite.config.ts` and `tsconfig.json` if changing.

4. **Vite proxy**: In development, `/api/*` requests from frontend are automatically proxied to backend. No need for absolute URLs.

5. **TypeScript strict mode**: Both codebases enforce strict null checks and indexed access checks. This may require type guards or optional chaining.

6. **Build order**: When building for production, backend must be built first, then frontend (handled by `npm run build:all`).


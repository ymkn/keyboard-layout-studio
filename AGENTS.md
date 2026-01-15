# AGENTS.md

## Build Commands

```bash
# Start development server (http://localhost:5173)
npm run dev

# Build for production (runs TypeScript typecheck first via vue-tsc)
npm run build

# Preview production build
npm run preview
```

**Note**: No lint or test scripts are configured. When adding features, always run `npm run build` to verify TypeScript compilation.

### Cloudflare Worker Commands

```bash
# Deploy OAuth token exchange worker
cd workers/oauth-token-exchange
npx wrangler deploy

# Set worker secrets
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
```

See `doc/WORKERS_DEPLOY.md` for detailed deployment instructions.

### Environment Variables

**SPA (Vite)** - Set in `.env.development` / `.env.production`:
- `VITE_GITHUB_CLIENT_ID` - GitHub OAuth App client ID
- `VITE_OAUTH_WORKER_URL` - Cloudflare Worker URL for OAuth token exchange

**Cloudflare Worker** - Set via `wrangler secret put`:
- `GITHUB_CLIENT_ID` - GitHub OAuth App client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth App client secret

**Note**: GitHub integration is optional. If env vars are not set, the feature is disabled gracefully.

## Code Style Guidelines

### Vue Components

- Use `<script setup lang="ts">` for all components
- Define imports in this order: Vue/external libraries → internal modules → components
- Use Composition API with `ref`, `computed`, `watch` from `vue`
- Define reactive state with `ref<T>()` for primitives/objects
- Use `computed<T>()` for derived state
- Define functions after reactive state, grouped logically

### Pinia Stores

- Use `defineStore` with Setup Store syntax (returns object from function)
- Define state first, then computed getters, then actions
- Use `ref` for mutable state, `computed` for getters
- All actions that modify state must call `saveHistory()` for undo/redo
- Group related actions together (selection, editing, history)

### TypeScript

- **No `any` types** - strict mode is enabled
- Use `interface` for object shapes, `type` for unions/primitives
- Prefer `Partial<T>` for updates, `Record<K, V>` for dynamic keys
- Type imports: `import type { X } from '...'` for type-only imports
- Function parameters: use descriptive names, prefix unused params with `_`

### Naming Conventions

- **Components**: PascalCase (e.g., `KeyboardCanvas.vue`, `KeyComponent.vue`)
- **Functions**: camelCase (e.g., `selectKey`, `updateKey`, `handleClick`)
- **Constants**: UPPER_SNAKE_CASE for config values (e.g., `MAX_HISTORY`, `keyUnit`)
- **Types/Interfaces**: PascalCase, descriptive names ending with Type for unions
- **State variables**: camelCase, usually with store prefix (e.g., `selectedKeyIds`)

### Imports

```typescript
// 1. Vue and external libraries
import { ref, computed, onMounted } from 'vue'
import { defineStore } from 'pinia'

// 2. Type-only imports
import type { Key, KeyboardLayout } from '../types/keyboard'

// 3. Internal utilities/services
import { exportToQMK } from '../utils/export'
import { GitHubService } from '../services/github'

// 4. Components (in .vue files)
import KeyComponent from './KeyComponent.vue'
```

### Styling

- Use Tailwind CSS utility classes for styling
- Use `<style scoped>` for component-specific styles
- Use `@apply` directive only when Tailwind utilities aren't sufficient
- Dynamic styles use inline `:style` with object syntax for reactivity

### Error Handling

- Use try/catch for async operations (localStorage, fetch, JSON.parse)
- Log errors with `console.error()` for debugging
- Show user-facing messages with `alert()` or custom dialogs for critical errors
- Return early or use guard clauses for validation

### Comments

- Comments are in **Japanese** to match the UI language
- Use JSDoc for utility functions (`/** ... */`) describing parameters and return values
- Keep comments minimal; let code be self-documenting
- No comments for obvious code (e.g., `// increment counter`)

### File Organization

```
src/
├── components/      # Vue components (.vue files)
├── stores/          # Pinia stores (single store per file)
├── types/           # TypeScript interfaces and types
│   ├── keyboard.ts  # Layout and key data types
│   └── github.ts    # GitHub API types (Gist, auth, etc.)
├── utils/           # Pure utility functions
├── services/        # External API integrations
│   └── github.ts    # GitHub API service (Gist CRUD, OAuth)
├── data/            # Static data (keycodes, labels, templates)
└── templates/       # JSON templates for export

doc/
└── WORKERS_DEPLOY.md  # Cloudflare Workers deployment guide

workers/
└── oauth-token-exchange/  # Cloudflare Worker for OAuth
    ├── src/
    │   ├── index.ts       # Worker entry point
    │   └── env.d.ts       # Environment type definitions
    ├── wrangler.toml      # Wrangler config
    └── package.json
```

### Data Model Conventions

- **Key coordinates/dimensions**: use "u" units (1u = 54px)
- **IDs**: generated with `Date.now()` or `Date.now() + index`
- **Timestamps**: use `new Date().toISOString()` format
- **Optional fields**: mark with `?` in interfaces
- **Default values**: define inline, not in types

### State Mutations

- Never mutate props directly; use `emit` events
- Store mutations go through action functions, never direct assignment
- For nested updates, use spread operator: `{ ...obj, field: newValue }`
- Update `metadata.modified` timestamp on all layout changes

### When to Create Components

- Extract to component if: >50 lines, used in multiple places, or has complex state
- Keep simple components in the same file as parent if only used once
- Shared components go in `src/components/`

### Adding Features

1. Read existing code to understand patterns (stores, types, components)
2. Add types to `src/types/` if new data structures needed
3. Add state/actions to stores in `src/stores/keyboard.ts`
4. Create/edit components with proper imports and typing
5. Run `npm run build` to verify TypeScript compilation
6. Test in dev server manually (no automated tests)

### GitHub Integration Notes

- GitHub API calls use `GitHubService` class in `src/services/github.ts`
- OAuth flow uses Cloudflare Worker to exchange code for token (CORS workaround)
- Auth state persisted in localStorage (`kls-github-auth`)
- OAuth state persisted in sessionStorage during redirect flow
- Gist files identified by `.kls.json` extension
- Error messages localized to Japanese via `getGitHubErrorMessage()`

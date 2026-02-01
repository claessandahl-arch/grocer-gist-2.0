# Code Style & Standards

Adhere strictly to these conventions to maintain codebase consistency.

## Formatting & Syntax
- **Indentation**: 2 spaces.
- **Semicolons**: No semicolons (Standard JS/TS style used in Vite projects usually, but follow existing file patterns. `eslint.config.js` uses no semicolons).
- **Quotes**: Single quotes `'` preferred for strings, unless avoiding escaping.
- **Trailing Commas**: ESPrettier style (objects, arrays, imports).
- **Files**: Ensure a trailing newline in all files.

## Naming Conventions
- **Files/Directories**: `kebab-case` (e.g., `user-profile.tsx`, `components/ui/button.tsx`).
- **Components**: `PascalCase` (e.g., `UserProfile`, `TransactionList`).
- **Variables/Functions**: `camelCase` (e.g., `getUserData`, `isValid`).
- **Constants**: `UPPER_SNAKE_CASE` for global constants; `camelCase` for locally scoped constants.
- **Interfaces/Types**: `PascalCase` (e.g., `Transaction`, `UserProps`).
- **Branches**: `type/description` (e.g., `feat/add-savings-goal`, `fix/login-error`, `chore/update-deps`).

## TypeScript Guidelines
- **Strictness**: `strict: true` is enabled in `tsconfig.json`.
- **Types**: Avoid `any`. Use `unknown` if ambiguous, then narrow. Use `interface` or `type` definitions explicitly.
- **Imports**: Use the `@` alias for the `src` directory.
- **Regex Safety**: When using brute-force regex for data extraction, always include a length-based safety break (e.g., `matrix.length < 5000`) to prevent browser hangs on massive/recursive files.
  - **Good**: `import { Button } from "@/components/ui/button"`
  - **Bad**: `import { Button } from "../../components/ui/button"`

## Import Order
Organize imports in the following order:
1.  **React / Built-in** (e.g., `import { useState } from 'react'`)
2.  **External Libraries** (e.g., `@tanstack/react-query`, `lucide-react`)
3.  **Internal Modules (Aliased)** (e.g., `@/components/...`, `@/lib/...`)
4.  **Relative Imports** (Sibling `./`)

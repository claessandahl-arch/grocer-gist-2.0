# Architecture & Patterns

## Context7 Integration
Use the following context files when generating code for specific domains:
- **Backend/Database**: Refer to `/supabase/supabase`
- **Server State**: Refer to `/tanstack/query`
- **Styling**: Refer to `/tailwindlabs/tailwindcss`

## Data Flow
- **Transaction-centric**: The core data model revolves around the `transactions` table.
- **State Management**:
  - Use **TanStack Query** for all asynchronous server state (fetching, updating DB).
  - Use **React Context** ONLY for global app state like Authentication or Theme.
  - Do NOT use Redux or other state libraries.

## UI Components
- Use **Shadcn/ui** components located in `@/components/ui`.
- Use **Lucide React** for icons.
- Ensure all text facing the user is in **Swedish**.

## Data Import & Safety
- **Resilient Parsing**: Banking exports (especially Handelsbanken) are often malformed. Always use a multi-strategy approach:
  1. Standard library parsing (ArrayBuffer).
  2. ZIP Repair: Scan for magic bytes (`PK\x03\x04`) to fix header offsets.
  3. Brute-Force Regex: Manually extract row/cell tags from raw text as a last resort.
- **Encoding**: Prioritize **UTF-8** for modern exports. Provide a fallback to **Windows-1252** for legacy Swedish bank files.

## AI Chatbot ("Spargransen")
- **Model**: `gemini-2.5-flash` (avoid 2.0/3.0)
- **Pattern**: Multi-function-call loop (up to 15 calls per question)
- **Deploy**: `supabase functions deploy chat --no-verify-jwt`

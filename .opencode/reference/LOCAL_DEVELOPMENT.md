# Local Development & Supabase

This guide details how to work with the local development environment, specifically the Supabase stack running via Docker.

## Prerequisites

1.  **Docker Desktop**: Must be installed and running.
2.  **Supabase CLI**: Install via `brew install supabase/tap/supabase` (macOS) or `npm install -g supabase`.

## Supabase Local Stack

The project allows running a full Supabase stack locally (Database, Auth, Edge Functions, Realtime, Storage, etc.) inside Docker containers.

### Starting the Stack
To start the local environment:
```bash
supabase start
```
*   This spins up the Docker containers.
*   It outputs the local API URL, Anon Key, and Service Role Key.
*   You can access the local Studio at `http://localhost:54323`.

### Stopping the Stack
```bash
supabase stop
```

## Connecting to Cloud (Production)

To sync your local environment with the production Supabase project:

1.  **Login**:
    ```bash
    supabase login
    ```
2.  **Link Project**:
    ```bash
    supabase link --project-ref <your-project-id>
    ```
    *   You will be asked for your database password.
    *   This enables you to push migrations and deploy functions.

## Edge Functions

The AI Chatbot ("Spargransen") runs on Supabase Edge Functions.

### Local Testing
To test functions locally without deploying:
```bash
supabase functions serve --no-verify-jwt
```
This serves the functions at `http://localhost:54321/functions/v1/`.

### Deployment
To deploy functions to the cloud:
```bash
supabase functions deploy chat --no-verify-jwt
```

## Troubleshooting

### Docker Errors
*   **Error**: `Is Docker running?`
    *   **Fix**: Ensure Docker Desktop is open and the engine is running.
*   **Error**: Port conflicts (e.g., `5432` already in use).
    *   **Fix**: Stop other Postgres services or check `supabase start` output for alternative ports.

### Config Missing
If `supabase/config.toml` is missing, you may need to run:
```bash
supabase init
```
*Note: Be careful not to overwrite existing `migrations` or `functions` folders.*

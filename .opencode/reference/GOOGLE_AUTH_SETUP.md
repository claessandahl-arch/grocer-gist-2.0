# Google Authentication Setup Guide

The code for Google OAuth is implemented, but it requires backend configuration to function. Follow these steps to enable it.

## 1. Google Cloud Console
1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a project (e.g., "Budget App").
3.  **OAuth Consent Screen**:
    -   Go to **APIs & Services > OAuth consent screen**.
    -   Type: **External**.
    -   Fill in App Name and emails.
    -   Save (skip scopes/test users).
4.  **Credentials**:
    -   Go to **Credentials > Create Credentials > OAuth client ID**.
    -   Type: **Web application**.
    -   **Authorized redirect URIs**: Add your Supabase Callback URL.
        -   Format: `https://<YOUR-PROJECT-ID>.supabase.co/auth/v1/callback`
        -   *Find this ID in Supabase > Settings > API.*
    -   **Important**: Copy the **Client ID** and **Client Secret**.

## 2. Supabase Configuration
1.  Go to [Supabase Dashboard](https://supabase.com/dashboard) > **Authentication > Providers**.
2.  Select **Google**.
3.  **Enable** the provider.
4.  Paste the **Client ID** and **Client Secret**.
5.  Save.

## 3. URL Whitelist
1.  Go to **Authentication > URL Configuration**.
2.  Add these to **Redirect URLs**:
    -   `http://localhost:5173/*`
    -   `https://<your-production-domain>.com/*`
    -   `https://<your-production-domain>.com/app`
    -   `https://<your-production-domain>.com/app/admin`
3.  Save.

## 4. Testing
1.  Start the app (`npm run dev`).
2.  Go to **Login** > Click "Logga in med Google".
3.  Or go to **Admin > Konto** > Click "Koppla konto".

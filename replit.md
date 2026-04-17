# AfuDesk Replit Setup

## Overview
AfuDesk is a Vite React live chat SaaS frontend running on Replit. The backend is Supabase: Supabase Auth, Postgres tables, Realtime, and Edge Functions handle authentication, data, live updates, and notifications.

## Architecture
- Frontend: React, TypeScript, Vite, shadcn/ui components in `src/`
- Backend: Supabase project `dzmfdfvundfxyejcunix`
- Supabase client: `src/integrations/supabase/client.ts` with the public anon key embedded in frontend code
- Widget: `public/widget.js` talks directly to Supabase REST, Realtime, and Edge Functions
- Supabase assets: migrations in `supabase/migrations/`, function in `supabase/functions/notify-new-message/`

## Commands
- Development: `npm run dev`
- Production build: `npm run build`

## Notes
- The app must not depend on Replit secrets or Replit database environment variables.
- Supabase service secrets, email provider secrets, and database credentials belong in Supabase, not Replit.

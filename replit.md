# AfuDesk Replit Setup

## Overview
AfuDesk is a Vite React live chat SaaS frontend running on Replit. The backend is Supabase: Supabase Auth, Postgres tables, Realtime, and Edge Functions handle authentication, data, live updates, and notifications.

## Architecture
- Frontend: React, TypeScript, Vite, shadcn/ui components in `src/`
- Backend: Supabase project `dzmfdfvundfxyejcunix`
- Supabase client: `src/integrations/supabase/client.ts` with the public anon key embedded in frontend code
- Widget: `public/widget.js` talks directly to Supabase REST, Realtime, and Edge Functions
- Supabase assets: migrations in `supabase/migrations/`, function in `supabase/functions/notify-new-message/`

## Design Direction
- Professional flat SaaS interface using a light neutral theme, subtle borders, small radii, and minimal shadow.
- Landing page presents a realistic support inbox preview instead of decorative marketing blocks.
- Demo and dashboard shell use the same flat product styling.
- Embedded widget should feel like a complete support center: neutral header, segmented tabs for Chat/Help/Tickets/News, refined forms, clear empty states, responsive sizing, and no gradients or playful effects.

## Commands
- Development: `npm run dev`
- Production build: `npm run build`

## Notes
- The app must not depend on Replit secrets or Replit database environment variables.
- Supabase service secrets, email provider secrets, and database credentials belong in Supabase, not Replit.

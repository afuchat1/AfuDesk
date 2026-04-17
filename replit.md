# AfuDesk Replit Migration

## Overview
AfuDesk is a Vite React live chat SaaS platform migrated from Lovable to Replit. The app now runs through an Express server on port 5000, serves the React frontend, and exposes API routes backed by Replit PostgreSQL.

## Architecture
- Frontend: React, TypeScript, Vite, shadcn/ui components in `src/`
- Backend: Express API in `server/index.ts`
- Database: Replit PostgreSQL with Drizzle schema in `shared/schema.ts`
- Widget: Embeddable script in `public/widget.js` using public API endpoints instead of direct database credentials

## Commands
- Development: `npm run dev`
- Database schema sync: `npm run db:push`
- Production build: `npm run build`
- Production start: `npm run start`

## Migration Notes
- Supabase browser access was removed for security; client code now calls server API routes.
- Authentication is handled by server-issued JWTs stored client-side.
- `RESEND_API_KEY` is optional and enables email notifications for visitor messages when configured.

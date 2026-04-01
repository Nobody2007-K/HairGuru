# Supabase Setup for HairGuru

This directory contains the SQL schema used to create the HairGuru database.

## Create the database

1. Create a new project in Supabase.
2. Copy `supabase/schema.sql` and run it in the SQL editor.
3. Set the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` values in `backend/.env`.

## Schema

- `users` stores end users.
- `recommendations` stores face-shape analyses and recommended hairstyles.

## Notes

The backend uses Supabase to persist recommendations, while the AI engine performs face shape detection and hairstyle selection.

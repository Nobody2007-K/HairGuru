-- Supabase schema for HairGuru

create extension if not exists "pgcrypto";

create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  created_at timestamptz not null default now()
);

create table recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  email text,
  face_shape text not null,
  hair_type text,
  recommended_styles jsonb not null,
  created_at timestamptz not null default now()
);

create table generated_images (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid references recommendations(id) on delete cascade,
  user_id uuid references users(id),
  hairstyle_name text not null,
  prompt text not null,
  image_url text,
  image_data bytea,
  gemini_response jsonb,
  status text default 'pending',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table hairstyle_catalog (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  face_shapes text[] not null,
  hair_types text[] not null,
  prompt_template text not null,
  created_at timestamptz not null default now()
);

create index on recommendations (face_shape);
create index on recommendations (created_at desc);
create index on generated_images (recommendation_id);
create index on generated_images (user_id);
create index on generated_images (status);
create index on generated_images (created_at desc);
create index on hairstyle_catalog (name);

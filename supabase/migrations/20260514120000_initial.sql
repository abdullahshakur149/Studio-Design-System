-- ============================================================
-- Studio — Initial schema
-- Tables: profiles, generation_logs, media (in dependency order)
-- ============================================================

-- ---------- ENUMS ----------
create type public.media_kind as enum ('photo', 'video');
create type public.generation_status as enum ('queued', 'running', 'succeeded', 'failed', 'timeout');

-- ---------- PROFILES ----------
create table public.profiles (
  id                        uuid primary key references auth.users(id) on delete cascade,
  display_name              text not null default '',
  plan                      text not null default 'free' check (plan in ('free','pro')),
  first_creation_emailed_at timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(split_part(new.email, '@', 1), ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row
  execute function public.touch_updated_at();

-- ---------- GENERATION LOGS ----------
create table public.generation_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  kind          public.media_kind not null,
  prompt        text not null,
  style         text not null,
  aspect_ratio  text,
  motion        text,
  status        public.generation_status not null default 'queued',
  provider      text not null default 'huggingface',
  model         text not null,
  duration_ms   int,
  http_status   int,
  error_code    text,
  error_message text,
  retry_count   int not null default 0,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz
);

create index generation_logs_user_started_idx on public.generation_logs (user_id, started_at desc);

-- ---------- MEDIA ----------
create table public.media (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  kind               public.media_kind not null,
  prompt             text not null,
  style              text not null,
  aspect_ratio       text,
  motion             text,
  source_image_path  text,
  storage_path       text not null,
  storage_bucket     text not null check (storage_bucket in ('media-photos', 'media-videos')),
  mime_type          text not null,
  size_bytes         bigint not null,
  width              int,
  height             int,
  duration_ms        int,
  generation_log_id  uuid references public.generation_logs(id) on delete set null,
  created_at         timestamptz not null default now(),

  constraint media_kind_shape check (
    (kind = 'photo' and aspect_ratio is not null and motion is null and storage_bucket = 'media-photos')
    or
    (kind = 'video' and motion is not null and storage_bucket = 'media-videos')
  )
);

create index media_user_created_idx       on public.media (user_id, created_at desc);
create index media_user_kind_created_idx  on public.media (user_id, kind, created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles        enable row level security;
alter table public.generation_logs enable row level security;
alter table public.media           enable row level security;

-- profiles: own row, read + update
create policy profiles_select_own
  on public.profiles for select
  using (auth.uid() = id);

create policy profiles_update_own
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- media: full CRUD for owner only (no UPDATE — rows are immutable)
create policy media_select_own
  on public.media for select
  using (auth.uid() = user_id);

create policy media_insert_own
  on public.media for insert
  with check (auth.uid() = user_id);

create policy media_delete_own
  on public.media for delete
  using (auth.uid() = user_id);

-- generation_logs: owner-read only (server-side service role bypasses RLS for writes)
create policy logs_select_own
  on public.generation_logs for select
  using (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS + POLICIES
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('media-photos', 'media-photos', false),
  ('media-videos', 'media-videos', false),
  ('user-uploads', 'user-uploads', false)
on conflict (id) do nothing;

-- One set of three policies per bucket: read, write, delete
-- Path convention: {user_id}/{file_id}.{ext}

-- media-photos
create policy "photos_owner_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'media-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos_owner_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- media-videos
create policy "videos_owner_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'media-videos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "videos_owner_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media-videos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "videos_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media-videos' and (storage.foldername(name))[1] = auth.uid()::text);

-- user-uploads
create policy "uploads_owner_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'user-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "uploads_owner_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'user-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "uploads_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'user-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

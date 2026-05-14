alter type public.generation_status rename value 'running' to 'processing';
alter type public.generation_status rename value 'succeeded' to 'completed';

create or replace function public.get_dashboard_stats()
returns table (
  total_photos bigint,
  total_videos bigint,
  storage_bytes bigint,
  plan text,
  member_since timestamptz,
  display_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(count(*) filter (where m.kind = 'photo'), 0)::bigint as total_photos,
    coalesce(count(*) filter (where m.kind = 'video'), 0)::bigint as total_videos,
    coalesce(sum(m.size_bytes), 0)::bigint as storage_bytes,
    p.plan,
    p.created_at as member_since,
    p.display_name
  from public.profiles p
  left join public.media m on m.user_id = p.id
  where p.id = auth.uid()
  group by p.id, p.plan, p.created_at, p.display_name;
$$;

grant execute on function public.get_dashboard_stats() to authenticated;

import { supabase } from '@/lib/supabase';
import { listMedia } from '@/features/library/api';
import type { DashboardStats, MediaListItem } from '@/types/api';

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const [{ count: photoCount }, { count: videoCount }, sizeResult, profileResult] = await Promise.all([
    supabase.from('media').select('id', { count: 'exact', head: true }).eq('kind', 'photo'),
    supabase.from('media').select('id', { count: 'exact', head: true }).eq('kind', 'video'),
    supabase.from('media').select('size_bytes'),
    supabase.from('profiles').select('display_name, plan, created_at').eq('id', user.id).single(),
  ]);

  const storageBytes = (sizeResult.data ?? []).reduce((sum, r) => sum + (r.size_bytes ?? 0), 0);

  const plan: 'free' | 'pro' = profileResult.data?.plan === 'pro' ? 'pro' : 'free';

  return {
    totalPhotos: photoCount ?? 0,
    totalVideos: videoCount ?? 0,
    storageBytes,
    plan,
    memberSince: profileResult.data?.created_at ?? user.created_at,
    displayName: profileResult.data?.display_name ?? user.email?.split('@')[0] ?? '',
    email: user.email ?? '',
  };
}

export async function getRecentMedia(): Promise<MediaListItem[]> {
  const page = await listMedia({ page: 0, filter: 'all', sort: 'newest' });
  return page.items.slice(0, 6);
}

import { supabase } from '@/lib/supabase';
import { listMedia } from '@/features/library/api';
import type { DashboardStats, MediaListItem } from '@/types/api';

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('get_dashboard_stats').single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Dashboard stats unavailable');

  const plan: 'free' | 'pro' = data.plan === 'pro' ? 'pro' : 'free';

  return {
    totalPhotos: Number(data.total_photos ?? 0),
    totalVideos: Number(data.total_videos ?? 0),
    storageBytes: Number(data.storage_bytes ?? 0),
    plan,
    memberSince: data.member_since ?? user.created_at,
    displayName: data.display_name ?? user.email?.split('@')[0] ?? '',
    email: user.email ?? '',
  };
}

export async function getRecentMedia(): Promise<MediaListItem[]> {
  const page = await listMedia({ page: 0, filter: 'all', sort: 'newest' });
  return page.items.slice(0, 6);
}

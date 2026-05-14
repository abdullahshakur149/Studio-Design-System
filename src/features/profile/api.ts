import { supabase } from '@/lib/supabase';
import { callFunction } from '@/lib/api';

export interface ProfileData {
  id: string;
  email: string;
  displayName: string;
  plan: 'free' | 'pro';
  memberSince: string;
  totalPhotos: number;
  totalVideos: number;
}

export async function getProfile(): Promise<ProfileData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const [profileResult, photoCount, videoCount] = await Promise.all([
    supabase.from('profiles').select('display_name, plan, created_at').eq('id', user.id).single(),
    supabase.from('media').select('id', { count: 'exact', head: true }).eq('kind', 'photo'),
    supabase.from('media').select('id', { count: 'exact', head: true }).eq('kind', 'video'),
  ]);

  if (profileResult.error) throw new Error(profileResult.error.message);

  const plan: 'free' | 'pro' = profileResult.data.plan === 'pro' ? 'pro' : 'free';

  return {
    id: user.id,
    email: user.email ?? '',
    displayName: profileResult.data.display_name,
    plan,
    memberSince: profileResult.data.created_at,
    totalPhotos: photoCount.count ?? 0,
    totalVideos: videoCount.count ?? 0,
  };
}

export async function updateDisplayName(displayName: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase.from('profiles').update({ display_name: displayName }).eq('id', user.id);
  if (error) throw new Error(error.message);
}

export async function deleteAccount(): Promise<void> {
  await callFunction<{ ok: true }>('profile-delete', { method: 'POST' });
}

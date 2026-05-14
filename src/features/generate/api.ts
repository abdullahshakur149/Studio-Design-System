import { supabase } from '@/lib/supabase';
import { callFunction } from '@/lib/api';
import type {
  GeneratePhotoRequest,
  GenerateVideoRequest,
  GenerateResponse,
  GenerateVideoResponse,
} from '@/types/api';

export async function generatePhoto(input: GeneratePhotoRequest): Promise<GenerateResponse> {
  return callFunction<GenerateResponse>('generate-photo', { method: 'POST', body: input });
}

export async function generateVideo(input: GenerateVideoRequest): Promise<GenerateVideoResponse> {
  return callFunction<GenerateVideoResponse>('generate-video', { method: 'POST', body: input });
}

export interface UploadedSource {
  path: string;
  signedUrl: string;
}

export async function uploadSourceImage(file: File): Promise<UploadedSource> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('user-uploads').upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data, error: signError } = await supabase.storage.from('user-uploads').createSignedUrl(path, 3600);
  if (signError || !data) throw new Error(signError?.message ?? 'Could not sign URL');

  return { path, signedUrl: data.signedUrl };
}

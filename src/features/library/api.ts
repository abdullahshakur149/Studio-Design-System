import { supabase } from '@/lib/supabase';
import type { MediaListItem, MediaKind } from '@/types/api';

export type LibraryFilter = 'all' | 'photo' | 'video';
export type LibrarySort = 'newest' | 'oldest';

const PAGE_SIZE = 12;
const SIGNED_URL_TTL = 60 * 60; // 1 hour

interface ListMediaParams {
  page: number;
  filter: LibraryFilter;
  sort: LibrarySort;
}

export interface MediaPage {
  items: MediaListItem[];
  nextPage: number | null;
  total: number;
}

export async function listMedia({ page, filter, sort }: ListMediaParams): Promise<MediaPage> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  let query = supabase
    .from('media')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: sort === 'oldest' })
    .range(from, to);

  if (filter !== 'all') {
    query = query.eq('kind', filter satisfies MediaKind);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  if (!data) return { items: [], nextPage: null, total: count ?? 0 };

  const items = await Promise.all(data.map(toListItem));
  const total = count ?? items.length;
  const nextPage = from + items.length < total ? page + 1 : null;
  return { items, nextPage, total };
}

async function toListItem(row: {
  id: string;
  kind: MediaKind;
  prompt: string;
  style: string;
  aspect_ratio: string | null;
  motion: string | null;
  storage_path: string;
  storage_bucket: string;
  mime_type: string;
  size_bytes: number;
  duration_ms: number | null;
  created_at: string;
}): Promise<MediaListItem> {
  const { data, error } = await supabase.storage
    .from(row.storage_bucket)
    .createSignedUrl(row.storage_path, SIGNED_URL_TTL);
  if (error || !data) {
    throw new Error(`Could not sign URL for ${row.storage_path}: ${error?.message ?? 'unknown'}`);
  }
  return {
    id: row.id,
    kind: row.kind,
    prompt: row.prompt,
    style: row.style,
    aspectRatio: row.aspect_ratio,
    motion: row.motion,
    storagePath: row.storage_path,
    storageBucket: row.storage_bucket,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    durationMs: row.duration_ms,
    createdAt: row.created_at,
    signedUrl: data.signedUrl,
  };
}

export async function deleteMedia(item: MediaListItem): Promise<void> {
  const { error: storageError } = await supabase.storage.from(item.storageBucket).remove([item.storagePath]);
  if (storageError) {
    // Don't block deletion of the row if storage object is already gone
    console.warn('Storage delete warning:', storageError.message);
  }
  const { error } = await supabase.from('media').delete().eq('id', item.id);
  if (error) throw new Error(error.message);
}

export async function getMediaCounts(): Promise<{ all: number; photo: number; video: number }> {
  const [{ count: all }, { count: photo }, { count: video }] = await Promise.all([
    supabase.from('media').select('id', { count: 'exact', head: true }),
    supabase.from('media').select('id', { count: 'exact', head: true }).eq('kind', 'photo'),
    supabase.from('media').select('id', { count: 'exact', head: true }).eq('kind', 'video'),
  ]);
  return { all: all ?? 0, photo: photo ?? 0, video: video ?? 0 };
}

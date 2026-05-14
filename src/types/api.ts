import type { Database } from './database';

export type MediaKind = Database['public']['Enums']['media_kind'];
export type GenerationStatus = Database['public']['Enums']['generation_status'];
export type Plan = 'free' | 'pro';

export const PHOTO_STYLES = ['Realistic', 'Cartoon', 'Oil Painting', 'Watercolour', 'Digital Art'] as const;
export type PhotoStyle = (typeof PHOTO_STYLES)[number];

export const PHOTO_ASPECT_RATIOS = ['1:1', '4:5', '16:9'] as const;
export type PhotoAspectRatio = (typeof PHOTO_ASPECT_RATIOS)[number];

export const VIDEO_STYLES = ['Cinematic', 'Animated', 'Documentary', 'Dramatic'] as const;
export type VideoStyle = (typeof VIDEO_STYLES)[number];

export const VIDEO_MOTIONS = ['Subtle', 'Medium', 'Dynamic'] as const;
export type VideoMotion = (typeof VIDEO_MOTIONS)[number];

export interface GeneratePhotoRequest {
  prompt: string;
  style: PhotoStyle;
  aspectRatio: PhotoAspectRatio;
}

export interface GenerateVideoRequest {
  prompt: string;
  style: VideoStyle;
  motion: VideoMotion;
  sourceImagePath?: string;
}

export interface GeneratePhotoResponse {
  sourceImageBase64: string;
  sourceMimeType: string;
  generationLogId: string;
  aspectRatio: PhotoAspectRatio;
  width: number;
  height: number;
}

export interface GenerateVideoResponse {
  sourceImageBase64: string;
  sourceMimeType: string;
  generationLogId: string;
  motion: VideoMotion;
}

export type GenerationErrorCode =
  | 'model_loading'
  | 'rate_limited'
  | 'timeout'
  | 'invalid_input'
  | 'storage_full'
  | 'unknown';

export interface GenerationErrorBody {
  error: GenerationErrorCode;
  message: string;
  estimatedSeconds?: number;
}

export interface MediaListItem {
  id: string;
  kind: MediaKind;
  prompt: string;
  style: string;
  aspectRatio: string | null;
  motion: string | null;
  storagePath: string;
  storageBucket: string;
  mimeType: string;
  sizeBytes: number;
  durationMs: number | null;
  createdAt: string;
  signedUrl: string;
}

export interface DashboardStats {
  totalPhotos: number;
  totalVideos: number;
  storageBytes: number;
  plan: 'free' | 'pro';
  memberSince: string;
  displayName: string;
  email: string;
}

export interface CheckEmailRequest {
  email: string;
}

export interface CheckEmailResponseBody {
  exists: boolean;
}

import { z } from 'zod';
import { PHOTO_STYLES, PHOTO_ASPECT_RATIOS, VIDEO_STYLES, VIDEO_MOTIONS } from '@/types/api';

export const photoFormSchema = z.object({
  prompt: z
    .string()
    .min(10, 'Prompt must be at least 10 characters.')
    .max(500, 'Prompt is too long.'),
  style: z.enum(PHOTO_STYLES),
  aspectRatio: z.enum(PHOTO_ASPECT_RATIOS),
});
export type PhotoFormValues = z.infer<typeof photoFormSchema>;

export const videoFormSchema = z.object({
  prompt: z
    .string()
    .min(15, 'Prompt must be at least 15 characters.')
    .max(300, 'Prompt is too long.'),
  style: z.enum(VIDEO_STYLES),
  motion: z.enum(VIDEO_MOTIONS),
  sourceImagePath: z.string().optional(),
});
export type VideoFormValues = z.infer<typeof videoFormSchema>;

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

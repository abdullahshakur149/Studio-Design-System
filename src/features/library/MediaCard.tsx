import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Download, MoreVertical, Copy, Trash2, Play } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import type { MediaListItem } from '@/types/api';
import { studioFilename } from '@/features/generate/filename';

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1).trim() + '…';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface MediaCardProps {
  item: MediaListItem;
  onDelete: (item: MediaListItem) => void;
}

export function MediaCard({ item, onDelete }: MediaCardProps): JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const isVideo = item.kind === 'video';
  const promptText = expanded ? item.prompt : truncate(item.prompt, 80);

  async function handleDownload(): Promise<void> {
    try {
      const res = await fetch(item.signedUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = item.mimeType.split('/')[1] ?? (isVideo ? 'mp4' : 'png');
      a.download = studioFilename(isVideo ? 'video' : 'photo', ext);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download failed');
    }
  }

  async function handleCopyPrompt(): Promise<void> {
    try {
      await navigator.clipboard.writeText(item.prompt);
      toast.success('Copied!', { description: 'Prompt copied to clipboard.' });
    } catch {
      toast.error('Could not copy to clipboard');
    }
  }

  const durationLabel = item.durationMs ? `${Math.round(item.durationMs / 1000)}s` : '10s';

  return (
    <div className="media-card">
      <div className="media-thumb">
        {isVideo ? (
          <video
            src={item.signedUrl}
            preload="metadata"
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <img
            src={item.signedUrl}
            alt={item.prompt}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <div className="media-badges">
          <Badge variant={isVideo ? 'video' : 'photo'}>{isVideo ? 'Video' : 'Photo'}</Badge>
        </div>
        {isVideo && (
          <>
            <div className="media-thumb-overlay">
              <div className="media-play">
                <Play size={18} />
              </div>
            </div>
            <div className="media-duration">
              <span className="badge badge-duration">{durationLabel}</span>
            </div>
          </>
        )}
      </div>
      <div className="media-body">
        <div
          className={`media-prompt ${expanded ? '' : 'truncate'}`}
          onClick={() => setExpanded((e) => !e)}
          style={{ cursor: 'pointer' }}
        >
          {promptText}
        </div>
        <div className="media-meta">
          <span>
            {formatDate(item.createdAt)} · {formatBytes(item.sizeBytes)}
          </span>
          <div className="media-actions">
            <button className="icon-btn" title="Download" onClick={handleDownload}>
              <Download size={14} />
            </button>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="icon-btn" title="More">
                  <MoreVertical size={14} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="menu-pop" align="end" sideOffset={6}>
                  <DropdownMenu.Item className="menu-item" onSelect={handleDownload}>
                    <Download size={14} /> Download
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className="menu-item" onSelect={handleCopyPrompt}>
                    <Copy size={14} /> Copy prompt
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className="menu-item danger" onSelect={() => onDelete(item)}>
                    <Trash2 size={14} /> Delete
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MediaSkeleton(): JSX.Element {
  return (
    <div className="media-card">
      <div className="media-thumb">
        <div className="skeleton" style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="media-body">
        <div className="skeleton" style={{ width: '90%', height: 12 }} />
        <div className="skeleton" style={{ width: '50%', height: 11, marginTop: 6 }} />
      </div>
    </div>
  );
}

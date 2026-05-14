import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Image as ImageIcon, Video, HardDrive, Sparkles, ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MediaCard, MediaSkeleton } from '@/features/library/MediaCard';
import { getDashboardStats, getRecentMedia } from './api';
import type { DashboardStats, MediaListItem } from '@/types/api';

function formatStorage(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

function StatCard({
  icon,
  label,
  value,
  meta,
}: {
  icon: JSX.Element;
  label: string;
  value: React.ReactNode;
  meta?: React.ReactNode;
}): JSX.Element {
  return (
    <div className="stat">
      <div className="stat-label">
        {icon}
        {label}
      </div>
      <div className="stat-value">{value}</div>
      {meta && <div className="stat-meta">{meta}</div>}
    </div>
  );
}

function StatSkeleton(): JSX.Element {
  return (
    <div className="stat">
      <div className="skeleton" style={{ width: '60%', height: 11, marginBottom: 14 }} />
      <div className="skeleton" style={{ width: '40%', height: 28 }} />
    </div>
  );
}

export function DashboardPage(): JSX.Element {
  const statsQuery = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
  });
  const recentQuery = useQuery<MediaListItem[]>({
    queryKey: ['recentMedia'],
    queryFn: getRecentMedia,
  });

  const stats = statsQuery.data;
  const recent = recentQuery.data ?? [];
  const showEmptyState = !recentQuery.isLoading && recent.length === 0;
  const memberSinceLabel = stats
    ? new Date(stats.memberSince).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1 className="page-h">Welcome back{stats?.displayName ? `, ${stats.displayName}` : ''}</h1>
          <p className="page-sub">Here's what you've made.</p>
        </div>
      </div>

      <div className="stats-grid">
        {statsQuery.isLoading || !stats ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard icon={<ImageIcon size={14} />} label="Photos created" value={stats.totalPhotos} />
            <StatCard icon={<Video size={14} />} label="Videos created" value={stats.totalVideos} />
            <StatCard
              icon={<HardDrive size={14} />}
              label="Storage used"
              value={formatStorage(stats.storageBytes)}
              meta="of 1 GB on Free"
            />
            <StatCard
              icon={<Sparkles size={14} />}
              label="Plan"
              value={<Badge variant="plan">{stats.plan === 'pro' ? 'Pro' : 'Free'}</Badge>}
              meta={`Member since ${memberSinceLabel}`}
            />
          </>
        )}
      </div>

      <div className="section-head">
        <h2 className="section-h">Create something new</h2>
      </div>
      <div className="create-grid">
        <div className="create-card">
          <div className="create-card-head">
            <div className="create-card-ic">
              <ImageIcon size={20} />
            </div>
            <h3 className="create-card-title">Generate photo</h3>
          </div>
          <p className="create-card-desc">Create an image from a text prompt.</p>
          <div className="create-card-foot">
            <Link to="/dashboard/create?type=photo">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14} />}>
                Create
              </Button>
            </Link>
          </div>
        </div>
        <div className="create-card">
          <div className="create-card-head">
            <div className="create-card-ic">
              <Video size={20} />
            </div>
            <h3 className="create-card-title">Generate video</h3>
          </div>
          <p className="create-card-desc">Create a short video from a prompt or image.</p>
          <div className="create-card-foot">
            <Link to="/dashboard/create?type=video">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14} />}>
                Create
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="section-head">
        <h2 className="section-h">Recent creations</h2>
        {!showEmptyState && (
          <Link to="/dashboard/library" className="section-link">
            View all <ChevronRight size={14} />
          </Link>
        )}
      </div>

      {recentQuery.isLoading ? (
        <div className="recent-grid">
          <MediaSkeleton />
          <MediaSkeleton />
          <MediaSkeleton />
        </div>
      ) : showEmptyState ? (
        <div className="empty">
          <img src="/empty-orb.svg" alt="" width={96} height={96} className="empty-orb" />
          <div className="empty-title">You have not created anything yet.</div>
          <div className="empty-text">Start creating!</div>
          <Link to="/dashboard/create?type=photo">
            <Button variant="primary" leftIcon={<Sparkles size={16} />}>
              Start creating
            </Button>
          </Link>
        </div>
      ) : (
        <div className="recent-grid">
          {recent.map((item) => (
            <MediaCard key={item.id} item={item} onDelete={() => undefined} />
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useLibrary, useMediaCounts, useDeleteMedia } from './useLibrary';
import { MediaCard, MediaSkeleton } from './MediaCard';
import type { MediaListItem } from '@/types/api';
import type { LibraryFilter, LibrarySort } from './api';
import { ROUTES } from '@/constants/routes';

export function LibraryPage(): JSX.Element {
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [sort, setSort] = useState<LibrarySort>('newest');
  const [confirmDelete, setConfirmDelete] = useState<MediaListItem | null>(null);

  const counts = useMediaCounts();
  const library = useLibrary({ filter, sort });
  const deleteMutation = useDeleteMedia();

  const allItems = library.data?.pages.flatMap((p) => p.items) ?? [];
  const total = library.data?.pages[0]?.total ?? 0;
  const isLoading = library.isLoading;
  const isEmpty = !isLoading && allItems.length === 0 && filter === 'all';

  function handleDelete(item: MediaListItem): void {
    deleteMutation.mutate(item, {
      onSuccess: () => {
        toast.success('Deleted');
        setConfirmDelete(null);
      },
      onError: (err) => {
        toast.error(err.message);
      },
    });
  }

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1 className="page-h">My library</h1>
          {!isLoading && !isEmpty && (
            <p className="page-sub">
              {total} creations total · {counts.data?.photo ?? 0} photos, {counts.data?.video ?? 0} videos.
            </p>
          )}
        </div>
      </div>

      {isEmpty ? (
        <div className="empty">
          <img src="/empty-orb.svg" alt="" width={96} height={96} className="empty-orb" />
          <div className="empty-title">Your library is empty</div>
          <div className="empty-text">Generate your first photo or video to fill it up.</div>
          <Link to={`${ROUTES.DASHBOARD_CREATE}?type=photo`}>
            <Button variant="primary" leftIcon={<Sparkles size={16} />}>
              Start creating
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="library-filters">
            <div className="lib-tabs">
              {(['all', 'photo', 'video'] as const).map((t) => (
                <button
                  key={t}
                  className={`lib-tab ${filter === t ? 'active' : ''}`}
                  onClick={() => setFilter(t)}
                >
                  {t === 'all' ? 'All' : t === 'photo' ? 'Photos' : 'Videos'}{' '}
                  <span className="count">
                    {t === 'all' ? counts.data?.all ?? 0 : t === 'photo' ? counts.data?.photo ?? 0 : counts.data?.video ?? 0}
                  </span>
                </button>
              ))}
            </div>
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as LibrarySort)}
              style={{ height: 34, padding: '0 12px', width: 'auto' }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </Select>
          </div>

          <div className="lib-grid">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => <MediaSkeleton key={i} />)
              : allItems.map((item) => <MediaCard key={item.id} item={item} onDelete={setConfirmDelete} />)}
          </div>

          {library.hasNextPage && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
              <Button
                variant="secondary"
                loading={library.isFetchingNextPage}
                onClick={() => library.fetchNextPage()}
              >
                Load more
              </Button>
            </div>
          )}
        </>
      )}

      <Modal
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete this creation?"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              loading={deleteMutation.isPending}
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              Delete
            </Button>
          </>
        }
      >
        Are you sure you want to delete this? This cannot be undone.
      </Modal>
    </div>
  );
}

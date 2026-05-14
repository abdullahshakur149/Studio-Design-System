import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listMedia, getMediaCounts, deleteMedia, type LibraryFilter, type LibrarySort, type MediaPage } from './api';
import type { MediaListItem } from '@/types/api';

interface UseLibraryParams {
  filter: LibraryFilter;
  sort: LibrarySort;
}

export function useLibrary({ filter, sort }: UseLibraryParams) {
  return useInfiniteQuery<MediaPage, Error>({
    queryKey: ['library', filter, sort],
    queryFn: ({ pageParam }) => listMedia({ page: pageParam as number, filter, sort }),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
  });
}

export function useMediaCounts() {
  return useQuery({
    queryKey: ['mediaCounts'],
    queryFn: getMediaCounts,
    staleTime: 10 * 1000,
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: MediaListItem) => deleteMedia(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['mediaCounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

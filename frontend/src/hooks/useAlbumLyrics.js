// src/hooks/useAlbumLyrics.js
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { albumService } from '../api/apiService';
import { queryKeys } from '../query/keys';

/**
 * Хук для получения списка песен конкретного альбома.
 * Используется на странице альбома (Album Page).
 *
 * @param {string | null | undefined} albumId - ID альбома
 * @returns {Object}
 * @returns {import('../types/models').Lyrics[]} lyrics - Массив песен
 * @returns {boolean} isLoading - Индикатор загрузки
 * @returns {boolean} isError - Индикатор ошибки
 * @returns {Function} invalidate - Функция для обновления кэша
 */
export const useAlbumLyrics = (albumId) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.albums.lyrics(albumId),
        queryFn: () => albumService.getLyrics(albumId).then((res) => res.data || []),
        enabled: !!albumId,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.albums.lyrics(albumId) });

    return {
        ...query,
        lyrics: query.data,
        invalidate,
    };
};
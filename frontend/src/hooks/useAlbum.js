// src/hooks/useAlbum.js
import { useQuery } from '@tanstack/react-query';
import { albumService } from '../api/apiService';
import { queryKeys } from '../query/keys';

/**
 * Хук для получения данных одного альбома по ID.
 * Используется на странице альбома (AlbumPage).
 *
 * @param {string | null | undefined} albumId - ID альбома
 * @returns {Object}
 * @returns {import('../types/models').Album | null} album - Данные альбома
 * @returns {boolean} isLoading - Индикатор загрузки
 * @returns {boolean} isError - Индикатор ошибки
 * @returns {Error | null} error - Объект ошибки
 */

export const useAlbum = (albumId) => {
    const query = useQuery({
        queryKey: queryKeys.albums.detail(albumId),
        queryFn: () => albumService.getById(albumId).then(res => res.data),
        enabled: !!albumId,
        staleTime: 5 * 60 * 1000,
    });

    return {
        ...query,
        album: query.data,
    };
};
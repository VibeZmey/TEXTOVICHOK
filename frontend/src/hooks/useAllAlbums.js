// src/hooks/useAllAlbums.js
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { albumService } from '../api/apiService';
import { queryKeys } from '../query/keys';

/**
 * Хук для получения ВСЕХ альбомов в системе (публичная лента).
 * Используется на главной странице (Home).
 *
 * @param {Object} [options] - Опции запроса
 * @param {number} [options.limit] - Лимит альбомов (если поддерживается бэкендом)
 * @returns {Object}
 * @returns {import('../types/models').Album[]} albums - Массив всех альбомов
 * @returns {boolean} isLoading - Индикатор загрузки
 * @returns {boolean} isError - Индикатор ошибки
 * @returns {Function} invalidate - Функция для обновления кэша
 */
export const useAllAlbums = (options = {}) => {
    const queryClient = useQueryClient();
    const { limit } = options;

    const query = useQuery({
        queryKey: queryKeys.albums.all,
        queryFn: () => albumService.getAll().then((res) => res.data || []),
        staleTime: 2 * 60 * 1000,
    });

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.albums.all });

    return {
        ...query,
        albums: query.data,
        invalidate,
    };
};
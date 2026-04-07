// src/hooks/useSearchAlbums.js
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { albumService } from '../api/apiService';
import { queryKeys } from '../query/keys';

/**
 * Хук для поиска альбомов по названию.
 * Используется в компоненте SearchBar (Navbar).
 *
 * @param {string} query - Поисковый запрос
 * @param {Object} [options] - Дополнительные опции
 * @param {number} [options.limit=10] - Максимальное количество результатов
 * @param {boolean} [options.enabled=true] - Включить ли автоматический запрос
 * @returns {Object}
 * @returns {import('../types/models').Album[]} albums - Найденные альбомы
 * @returns {boolean} isLoading - Индикатор загрузки
 * @returns {boolean} isError - Индикатор ошибки
 * @returns {Function} invalidate - Функция для обновления кэша
 */
export const useSearchAlbums = (query, options = {}) => {
    const queryClient = useQueryClient();
    const { limit = 10, enabled = true } = options;

    const query_ = useQuery({
        queryKey: queryKeys.albums.search(query),
        queryFn: async () => {

            const res = await albumService.getAll();
            const allAlbums = res.data || [];

            const filtered = allAlbums
                .filter((album) => {
                    const name = (album.name || '').toLowerCase();
                    return name.includes(query.toLowerCase());
                })
                .slice(0, limit);

            return filtered;
        },

        enabled: enabled && !!query && query.trim().length >= 1,
        staleTime: 1 * 60 * 1000,
        gcTime: 2 * 60 * 1000,
    });

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.albums.search(query) });

    return {
        ...query_,
        albums: query_.data,
        invalidate,
    };
};
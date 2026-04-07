// src/hooks/useUserAlbums.js
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../api/apiService';
import { queryKeys } from '../query/keys';

/**
 * Хук для получения альбомов конкретного пользователя.
 * Используется на странице профиля владельца.
 *
 * @param {string | null | undefined} userId - ID пользователя
 * @returns {Object}
 * @returns {import('../types/models').Album[]} albums - Массив альбомов
 * @returns {boolean} isLoading - Индикатор загрузки
 * @returns {Function} invalidate - Функция для обновления кэша
 */
export const useUserAlbums = (userId) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.albums.list(userId),
        queryFn: () => userService.getUserAlbums(userId).then((res) => res.data || []),
        enabled: !!userId,
    });

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.albums.list(userId) });

    return {
        ...query,
        albums: query.data,
        invalidate,
    };
};
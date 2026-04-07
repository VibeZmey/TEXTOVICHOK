// src/hooks/useUser.js
import { useQuery } from '@tanstack/react-query';
import { userService } from '../api/apiService';
import { queryKeys } from '../query/keys';

/**
 * Хук для получения данных пользователя по ID.
 * Используется для отображения имени артиста в карточке альбома.
 *
 * @param {string | null | undefined} userId - ID пользователя
 * @returns {Object}
 * @returns {import('../types/models').User | null} user - Данные пользователя
 * @returns {boolean} isLoading - Индикатор загрузки
 * @returns {boolean} isError - Индикатор ошибки
 */

export const useUser = (userId) => {
    const query = useQuery({
        queryKey: queryKeys.users.detail(userId),
        queryFn: () => userService.getUserById(userId).then((res) => res.data),
        enabled: !!userId,
        staleTime: 15 * 60 * 1000,
        retry: 1,
    });

    return {
        ...query,
        user: query.data,
    };
};
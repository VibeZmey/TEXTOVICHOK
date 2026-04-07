// src/hooks/useAllUsers.js
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../api/apiService';
import { queryKeys } from '../query/keys';

/**
 * Хук для получения всех пользователей системы.
 * Используется в админ-панели.
 *
 * @returns {Object}
 * @returns {import('../types/models').User[]} users - Массив пользователей
 * @returns {boolean} isLoading - Индикатор загрузки
 * @returns {boolean} isError - Индикатор ошибки
 * @returns {Function} invalidate - Функция для обновления кэша
 */

export const useAllUsers = () => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.users.all,
        queryFn: () => userService.getAllUsers().then((res) => res.data || []),
        staleTime: 1 * 60 * 1000,
    });

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all });

    return {
        ...query,
        users: query.data,
        invalidate,
    };
};
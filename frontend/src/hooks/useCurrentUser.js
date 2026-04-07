// src/hooks/useCurrentUser.js
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../api/apiService';
import { queryKeys } from '../query/keys';

/**
 * Хук для получения данных текущего авторизованного пользователя.
 * Используется на странице профиля, в хедере, для проверки прав.
 *
 * @returns {Object}
 * @returns {import('../types/models').User | null} user - Данные пользователя
 * @returns {boolean} isLoading - Индикатор загрузки
 * @returns {boolean} isError - Индикатор ошибки
 * @returns {Error | null} error - Объект ошибки
 * @returns {Function} invalidate - Функция для принудительного обновления кэша
 */
export const useCurrentUser = () => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.profile,
        queryFn: () => userService.getProfile().then((res) => res.data),
        staleTime: 10 * 60 * 1000, // Профиль кэшируем на 10 минут
        retry: 1,
    });

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.profile });

    return {
        ...query,
        user: query.data,
        invalidate,
    };
};
// src/hooks/useAllAnnotations.js
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { annotationService } from '../api/apiService';
import { queryKeys } from '../query/keys';

/**
 * Хук для получения ВСЕХ аннотаций (для модерации или общей ленты).
 * Используется на странице LyricsView или Admin.
 *
 * @param {Object} [options] - Опции запроса
 * @param {boolean} [options.unverified] - Если true, загружать только непроверенные аннотации
 * @returns {Object}
 * @returns {import('../types/models').Annotation[]} annotations - Массив всех аннотаций
 * @returns {boolean} isLoading - Индикатор загрузки
 * @returns {Function} invalidate - Функция для обновления кэша
 */
export const useAllAnnotations = (options = {}) => {
    const queryClient = useQueryClient();
    const { unverified = false } = options;

    const query = useQuery({
        queryKey: unverified ? queryKeys.annotations.unverified : queryKeys.annotations.all,
        queryFn: () => {
            if (unverified) {
                return annotationService.getUnverified().then((res) => res.data || []);
            }
            return annotationService.getUnverified().then((res) => res.data || []);
        },
        staleTime: 1 * 60 * 1000,
    });

    const invalidate = () =>
        queryClient.invalidateQueries({
            queryKey: unverified ? queryKeys.annotations.unverified : queryKeys.annotations.all
        });

    return {
        ...query,
        annotations: query.data,
        invalidate,
    };
};
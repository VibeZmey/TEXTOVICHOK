// src/hooks/useLyricsAnnotations.js
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { lyricsService } from '../api/apiService';
import { queryKeys } from '../query/keys';

/**
 * Хук для получения аннотаций конкретного текста песни.
 * Используется на странице просмотра текста (LyricsView).
 *
 * @param {string | null | undefined} lyricsId - ID текста песни
 * @returns {Object}
 * @returns {import('../types/models').Annotation[]} annotations - Массив аннотаций
 * @returns {boolean} isLoading - Индикатор загрузки
 * @returns {Function} invalidate - Функция для обновления кэша
 */
export const useLyricsAnnotations = (lyricsId) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.lyrics.annotations(lyricsId),
        queryFn: () => lyricsService.getAnnotations(lyricsId).then((res) => res.data || []),
        enabled: !!lyricsId,
    });

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.lyrics.annotations(lyricsId) });

    return {
        ...query,
        annotations: query.data,
        invalidate,
    };
};
// src/hooks/useLyrics.js
import { useQuery } from '@tanstack/react-query';
import { lyricsService } from '../api/apiService';
import { queryKeys } from '../query/keys';

/**
 * Хук для получения данных текста песни по ID.
 * Используется на странице LyricsView.
 *
 * @param {string | null | undefined} lyricsId - ID текста песни
 * @returns {Object}
 * @returns {import('../types/models').Lyrics | null} lyrics - Данные песни
 * @returns {boolean} isLoading - Индикатор загрузки
 * @returns {boolean} isError - Индикатор ошибки
 */

export const useLyrics = (lyricsId) => {
    const query = useQuery({
        queryKey: queryKeys.lyrics.detail(lyricsId),
        queryFn: () => lyricsService.getById(lyricsId).then((res) => res.data),
        enabled: !!lyricsId,
        staleTime: 5 * 60 * 1000,
    });

    return {
        ...query,
        lyrics: query.data,
    };
};
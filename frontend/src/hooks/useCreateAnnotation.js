// src/hooks/useCreateAnnotation.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { annotationService } from '../api/apiService';
import { queryKeys } from '../query/keys';

/**
 * Мутация для создания аннотации.
 * После успеха обновляет списки аннотаций песни и пользователя.
 *
 * @param {Object} options - Опции
 * @param {string} [options.lyricsId] - ID текста песни (для инвалидации кэша аннотаций песни)
 * @param {string} [options.userId] - ID текущего пользователя (для инвалидации кэша аннотаций пользователя)
 * @returns {Object} Mutation object from useMutation
 */
export const useCreateAnnotation = ({ lyricsId, userId } = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data) => {
            const response = await annotationService.create(data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['annotations'] });

            if (lyricsId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.lyrics.annotations(lyricsId) });
            }
        },
    });
};
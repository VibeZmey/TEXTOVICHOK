// src/hooks/useProfileMutations.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, albumService, annotationService, toFormData } from '../api/apiService';
import { queryKeys } from '../query/keys';

/**
 * Мутация для обновления профиля пользователя.
 * После успеха автоматически обновляет кэш профиля.
 *
 * @param {string} userId - ID пользователя
 * @returns {Object} Mutation object from useMutation
 */
export const useUpdateProfile = (userId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data) => {
            const payload = data.image instanceof File
                ? toFormData({ login: data.login, description: data.description, image: data.image })
                : { login: data.login, description: data.description };

            const response = await userService.updateUser(userId, payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.profile });
        },
    });
};

/**
 * Мутация для удаления альбома.
 * После успеха обновляет списки альбомов (и все, и пользователя).
 *
 * @returns {Object} Mutation object from useMutation
 */
export const useDeleteAlbum = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ albumId, userId }) => {
            await albumService.delete(albumId);
            return { albumId, userId };
        },
        onSuccess: (_, { userId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.albums.all });
            if (userId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.albums.list(userId) });
            }
            queryClient.invalidateQueries({ queryKey: ['albums'] });
        },
    });
};

/**
 * Мутация для удаления аннотации.
 * После успеха обновляет списки аннотаций.
 *
 * @returns {Object} Mutation object from useMutation
 */
export const useDeleteAnnotation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ annotationId, userId }) => {
            await annotationService.delete(annotationId);
            return { annotationId, userId };
        },
        onSuccess: (_, { userId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.annotations.all });
            if (userId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.annotations.user(userId) });
            }
        },
    });
};
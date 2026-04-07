// src/hooks/useAdminMutations.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, annotationService, albumService } from '../api/apiService';
import { queryKeys } from '../query/keys';

/**
 * Мутация для блокировки/разблокировки пользователя.
 */
export const useBlockUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, isBlocked }) => {
            // Бэкенд принимает PATCH с полем isBlocked
            await userService.blockUser(userId, { isBlocked });
            return { userId, isBlocked };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
};

/**
 * Мутация для аппрува аннотации.
 */
export const useApproveAnnotation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (annotationId) => {
            await annotationService.verify(annotationId);
            return annotationId;
        },
        onSuccess: (_, annotationId) => {
            queryClient.invalidateQueries({ queryKey: ['annotations'] });
        },
    });
};

/**
 * Мутация для реджекта аннотации.
 */
export const useRejectAnnotation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (annotationId) => {
            await annotationService.reject(annotationId);
            return annotationId;
        },
        onSuccess: (_, annotationId) => {
            queryClient.invalidateQueries({ queryKey: ['annotations'] });
        },
    });
};

/**
 * Мутация для аппрува альбома.
 */
export const useApproveAlbum = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (albumId) => {
            await albumService.update(albumId, { status: "approved" });
            return albumId;
        },
        onSuccess: (_, albumId) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.albums.all });
            queryClient.invalidateQueries({ queryKey: ['albums'] });
        },
    });
};

/**
 * Мутация для реджекта альбома.
 */
export const useRejectAlbum = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (albumId) => {
            await albumService.update(albumId, { status: "rejected" });
            return albumId;
        },
        onSuccess: (_, albumId) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.albums.all });
            queryClient.invalidateQueries({ queryKey: ['albums'] });
        },
    });
};
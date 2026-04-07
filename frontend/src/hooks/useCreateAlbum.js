// src/hooks/useCreateAlbum.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { albumService, lyricsService, toFormData } from '../api/apiService';
import { queryKeys } from '../query/keys';

/**
 * Мутация для создания альбома с песнями.
 * Сначала создаёт альбом, затем последовательно создаёт песни.
 * После успеха обновляет списки альбомов.
 *
 * @param {string} userId - ID текущего пользователя (для инвалидации кэша)
 * @returns {Object} Mutation object from useMutation
 */
export const useCreateAlbum = (userId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ albumData, songs }) => {
            const albumPayload = toFormData({
                name: albumData.name,
                description: albumData.description,
                year: albumData.year,
                image: albumData.coverFile,
            });

            const albumRes = await albumService.create(albumPayload);
            const album = albumRes.data;

            for (const [index, song] of songs.entries()) {
                await lyricsService.create({
                    name: song.name,
                    albumId: album.id,
                    orderIndex: index,
                    text: song.text,
                    duration: song.duration || 0,
                    description: song.description || '',
                });
            }

            return album;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.albums.all });
            if (userId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.albums.list(userId) });
            }
        },
    });
};
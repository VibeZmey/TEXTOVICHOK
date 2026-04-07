// src/hooks/index.js
// Queries
export { useCurrentUser } from './useCurrentUser';
export { useUserAlbums } from './useUserAlbums';
export { useAllAlbums } from './useAllAlbums';
export { useUserAnnotations } from './useUserAnnotations';
export { useAllAnnotations } from './useAllAnnotations';
export { useLyrics } from './useLyrics';
export { useLyricsAnnotations } from './useLyricsAnnotations';
export { useAlbum } from './useAlbum';
export { useAlbumLyrics } from './useAlbumLyrics';
export { useUser } from './useUser';
export { useAllUsers } from './useAllUsers';
export {useSearchAlbums} from './useSearchAlbums';


// Mutations
export { useUpdateProfile } from './useProfileMutations';
export { useDeleteAlbum } from './useProfileMutations';
export { useDeleteAnnotation } from './useProfileMutations';
export { useCreateAlbum } from './useCreateAlbum';
export { useCreateAnnotation } from './useCreateAnnotation';
export {
    useBlockUser,
    useApproveAnnotation,
    useRejectAnnotation,
    useApproveAlbum,
    useRejectAlbum
} from './useAdminMutations';
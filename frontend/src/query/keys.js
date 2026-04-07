// src/query/keys.js
export const queryKeys = {
    profile: ['profile'],

    albums: {
        all: ['albums', 'all'],
        list: (userId) => ['albums', 'user', userId],
        detail: (albumId) => ['albums', 'detail', albumId],
        lyrics: (albumId) => ['albums', 'lyrics', albumId],
        search: (query) => ['albums', 'search', query],
    },

    lyrics: {
        detail: (lyricsId) => ['lyrics', 'detail', lyricsId],
        annotations: (lyricsId) => ['lyrics', 'annotations', lyricsId],
    },

    annotations: {
        all: ['annotations', 'all'],
        unverified: ['annotations', 'unverified'],
        user: (userId) => ['annotations', 'user', userId],
        detail: (annotationId) => ['annotations', 'detail', annotationId],
    },

    users: {
        all: ['users', 'all'],
        detail: (userId) => ['users', 'detail', userId],
    },
};
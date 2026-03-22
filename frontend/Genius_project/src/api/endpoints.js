export const API_URL = "http://localhost:5000";

export const ENDPOINTS = {
    AUTH: {
        LOGIN: "/auth/login",
        REGISTER: "/auth/register",
        REFRESH: "/auth/refresh",
        LOGOUT: "/auth/logout",
    },

    USERS: {
        PROFILE: "/user",
        BY_ID: (id) => `/user/${id}`,
    },

    LYRICS: {
        GET_ALL: "/lyrics",
        BY_ID: (id) => `/lyrics/${id}`,
        ANNOTATIONS: (lyricsId) => `/lyrics/${lyricsId}/annotations`,
    },

    ANNOTATIONS: {
        CREATE: "/annotation",
        BY_ID: (id) => `/annotation/${id}`,
        UPDATE: (id) => `/annotation/${id}`,
        DELETE: (id) => `/annotation/${id}`,
    },
};
import axiosInstance from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";
import { tokenService } from "./tokenService";

export const toFormData = (data) => {
    if (data instanceof FormData) return data;

    const formData = new FormData();
    if (!data) return formData;

    Object.entries(data).forEach(([key, value]) => {
        // Пропускаем null/undefined, но разрешаем 0, false, пустую строку
        if (value !== null && value !== undefined) {
            // Если значение — файл или Blob, добавляем с именем файла
            if (value instanceof File || value instanceof Blob) {
                formData.append(key, value, value.name);
            } else {
                formData.append(key, value);
            }
        }
    });
    return formData;
};

// ============ AUTH ============
export const authService = {
    login: (credentials) => axiosInstance.post(ENDPOINTS.AUTH.LOGIN, credentials),
    register: (userData) => axiosInstance.post(ENDPOINTS.AUTH.REGISTER, userData),
    logout: () => axiosInstance.post(ENDPOINTS.AUTH.LOGOUT),
    refresh: () => axiosInstance.post(ENDPOINTS.AUTH.REFRESH, {
        token: tokenService.getRefreshToken(),
    }),
};

// ============ USERS ============
export const userService = {
    getProfile: () => axiosInstance.get(ENDPOINTS.USERS.PROFILE),
    getUserById: (id) => axiosInstance.get(ENDPOINTS.USERS.BY_ID(id)),
    getAllUsers: () => axiosInstance.get(ENDPOINTS.USERS.ALL),

    updateUser: (id, data) => {
        const formData = toFormData(data);
        return axiosInstance.patch(ENDPOINTS.USERS.UPDATE(id), formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },

    blockUser: (id, isBlocked) =>
        axiosInstance.patch(ENDPOINTS.USERS.BLOCK(id), { isBlocked }),
    getUserAlbums: (id) => axiosInstance.get(ENDPOINTS.USERS.ALBUMS(id)),
    getUserAnnotations: (id) => axiosInstance.get(ENDPOINTS.USERS.ANNOTATIONS(id)),
};

// ============ ALBUMS ============
export const albumService = {
    getAll: () => axiosInstance.get(ENDPOINTS.ALBUMS.GET_ALL),
    getById: (id) => axiosInstance.get(ENDPOINTS.ALBUMS.BY_ID(id)),
    create: (data) => {
        const formData = toFormData(data);
        return axiosInstance.post(ENDPOINTS.ALBUMS.CREATE, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },

    update: (id, data) => {
        const formData = toFormData(data);
        return axiosInstance.patch(ENDPOINTS.ALBUMS.UPDATE(id), formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },

    delete: (id) => axiosInstance.delete(ENDPOINTS.ALBUMS.DELETE(id)),
    getLyrics: (id) => axiosInstance.get(ENDPOINTS.ALBUMS.LYRICS(id)),
};

// ============ LYRICS ============
export const lyricsService = {
    getAll: () => axiosInstance.get(ENDPOINTS.LYRICS.GET_ALL),
    getById: (id) => axiosInstance.get(ENDPOINTS.LYRICS.BY_ID(id)),
    create: (data) => axiosInstance.post(ENDPOINTS.LYRICS.CREATE, data),
    update: (id, data) => axiosInstance.patch(ENDPOINTS.LYRICS.UPDATE(id), data),
    delete: (id) => axiosInstance.delete(ENDPOINTS.LYRICS.DELETE(id)),
    getAnnotations: (id) => axiosInstance.get(ENDPOINTS.LYRICS.ANNOTATIONS(id)),
};

// ============ ANNOTATIONS ============
export const annotationService = {
    create: (data) => axiosInstance.post(ENDPOINTS.ANNOTATIONS.CREATE, data),
    getById: (id) => axiosInstance.get(ENDPOINTS.ANNOTATIONS.BY_ID(id)),
    update: (id, data) => axiosInstance.patch(ENDPOINTS.ANNOTATIONS.UPDATE(id), data),
    delete: (id) => axiosInstance.delete(ENDPOINTS.ANNOTATIONS.DELETE(id)),
    getUnverified: () => axiosInstance.get(ENDPOINTS.ANNOTATIONS.UNVERIFIED),
    verify: (id) => axiosInstance.patch(ENDPOINTS.ANNOTATIONS.VERIFY(id)),
    reject: (id) => axiosInstance.patch(ENDPOINTS.ANNOTATIONS.REJECT(id)),
};

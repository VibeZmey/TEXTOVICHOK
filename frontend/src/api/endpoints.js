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
    ALL: "/user/all",
    ALBUMS: (id) => `/user/${id}/albums`,
    ANNOTATIONS: (id) => `/user/${id}/annotations`,
    BLOCK: (id) => `/user/${id}/block`,
    UPDATE: (id) => `/user/${id}`,
  },
  ALBUMS: {
    CREATE: "/albums",
    GET_ALL: "/albums",
    BY_ID: (id) => `/albums/${id}`,
    LYRICS: (id) => `/albums/${id}/lyrics`,
    UPDATE: (id) => `/albums/${id}`,
    DELETE: (id) => `/albums/${id}`,
  },
  LYRICS: {
    CREATE: "/lyrics",
    GET_ALL: "/lyrics",
    BY_ID: (id) => `/lyrics/${id}`,
    UPDATE: (id) => `/lyrics/${id}`,
    DELETE: (id) => `/lyrics/${id}`,
    ANNOTATIONS: (id) => `/lyrics/${id}/annotations`,
  },
  ANNOTATIONS: {
    CREATE: "/annotation",
    BY_ID: (id) => `/annotation/${id}`,
    UPDATE: (id) => `/annotation/${id}`,
    DELETE: (id) => `/annotation/${id}`,
    UNVERIFIED: "/annotation/unverified",
    VERIFY: (id) => `/annotation/${id}/verify`,
    REJECT: (id) => `/annotation/${id}/reject`,
  },
};
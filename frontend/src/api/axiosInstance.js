import axios from "axios";
import { API_URL, ENDPOINTS } from "./endpoints";
import { tokenService } from "./tokenService";

let isRefreshing = false;
let refreshSubscribers = [];

const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

function subscribeTokenRefresh(cb) {
    refreshSubscribers.push(cb);
}

function onRefreshed(token) {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
}

axiosInstance.interceptors.request.use((config) => {
    const token = tokenService.getAccessToken();
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (!originalRequest) return Promise.reject(error);

        const is401 = error.response?.status === 401;
        const isRefreshRequest = originalRequest.url?.includes(ENDPOINTS.AUTH.REFRESH);

        if (!is401 || originalRequest._retry || isRefreshRequest) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (isRefreshing) {
            return new Promise((resolve) => {
                subscribeTokenRefresh((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    resolve(axiosInstance(originalRequest));
                });
            });
        }

        isRefreshing = true;
        try {
            const refreshToken = tokenService.getRefreshToken();
            if (!refreshToken) throw new Error("No refresh token");

            const response = await axios.post(`${API_URL}${ENDPOINTS.AUTH.REFRESH}`, {
                token: refreshToken, // важно по swagger
            });

            const { accessToken, refreshToken: newRefreshToken } = response.data;
            tokenService.setTokens(accessToken, newRefreshToken);

            onRefreshed(accessToken);

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return axiosInstance(originalRequest);
        } catch (err) {
            tokenService.clearTokens();
            window.location.href = "/login";
            return Promise.reject(err);
        } finally {
            isRefreshing = false;
        }
    }
);

export default axiosInstance;
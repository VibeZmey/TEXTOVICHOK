import axios from "axios";
import { API_URL, ENDPOINTS } from "./endpoints";
import { tokenService } from "./tokenService";

let isRefreshing = false;
let refreshSubscribers = [];

const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: false,
    timeout: 10000,
});

// Добавляем запрос в очередь
function subscribeTokenRefresh(cb) {
    refreshSubscribers.push(cb);
}

// Уведомляем все ожидающие запросы, что токен обновлен
function onRefreshed(token) {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
}

// Отменяем все ожидающие запросы, если рефреш не удался
function onRefreshFailed(error) {
    refreshSubscribers.forEach((cb) => cb(null, error));
    refreshSubscribers = [];
}

axiosInstance.interceptors.request.use((config) => {
    const token = tokenService.getAccessToken();
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Защита от зацикливания, если config потерялся
        if (!originalRequest) return Promise.reject(error);

        const is401 = error.response?.status === 401;
        // Проверяем, что это не сам запрос на рефреш (используем axiosInstance!)
        const isRefreshRequest = originalRequest.url === ENDPOINTS.AUTH.REFRESH;

        // Если ошибка не 401, или запрос уже ретраился, или это запрос рефреша — отклоняем
        if (!is401 || originalRequest._retry || isRefreshRequest) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        // Если рефреш уже идет, ставим текущий запрос в очередь
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                subscribeTokenRefresh((newToken, err) => {
                    if (err) {
                        // Если рефреш упал, отклоняем и этот запрос тоже
                        reject(err);
                    } else {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        // Повторяем запрос с новым токеном
                        resolve(axiosInstance(originalRequest));
                    }
                });
            });
        }

        isRefreshing = true;

        try {
            const refreshToken = tokenService.getRefreshToken();
            if (!refreshToken) throw new Error("No refresh token");

            const response = await axiosInstance.post(ENDPOINTS.AUTH.REFRESH, {
                token: refreshToken,
            });

            const { accessToken, refreshToken: newRefreshToken } = response.data;

            // Сохраняем новые токены
            tokenService.setTokens(accessToken, newRefreshToken);

            // Уведомляем очередь об успехе
            onRefreshed(accessToken);

            // Повторяем оригинальный запрос
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return axiosInstance(originalRequest);

        } catch (err) {
            tokenService.clearTokens();

            onRefreshFailed(err);

            // Редирект на логин (только если мы еще не там)
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }

            return Promise.reject(err);
        } finally {
            isRefreshing = false;
        }
    }
);

export default axiosInstance;
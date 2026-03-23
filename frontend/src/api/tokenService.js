const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

export const tokenService = {
  getAccessToken() {
    return localStorage.getItem(ACCESS_KEY);
  },

  getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY);
  },

  setTokens(accessToken, refreshToken) {
    if (accessToken) {
      localStorage.setItem(ACCESS_KEY, accessToken);
    }
    if (refreshToken) {
      localStorage.setItem(REFRESH_KEY, refreshToken);
    }
  },

  clearTokens() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },

  isAuthenticated() {
    return !!this.getAccessToken();
  },
};
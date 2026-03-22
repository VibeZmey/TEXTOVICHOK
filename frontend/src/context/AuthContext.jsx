// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";
import { tokenService } from "../api/tokenService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await axiosInstance.get(ENDPOINTS.USERS.PROFILE);
      setUser(res.data);
    } catch {
      tokenService.clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (login, password) => {
    const res = await axiosInstance.post(ENDPOINTS.AUTH.LOGIN, { login, password });

    const { accessToken, refreshToken } = res.data;
    tokenService.setTokens(accessToken, refreshToken);

    await fetchProfile();
  };

  // 🔹 Новая функция регистрации
  const register = async (login, password) => {
    const res = await axiosInstance.post(ENDPOINTS.AUTH.REGISTER, { login, password });
  };

  const logout = async () => {
    try {
      await axiosInstance.post(ENDPOINTS.AUTH.LOGOUT);
    } catch {
    } finally {
      tokenService.clearTokens();
      setUser(null);
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    const token = tokenService.getAccessToken();

    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
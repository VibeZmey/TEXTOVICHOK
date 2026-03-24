import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";
import { tokenService } from "../api/tokenService";
import { decodeJwt, mapUserFromToken } from "../utilits/jwt";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const setUserFromToken = useCallback(() => {
        const token = tokenService.getAccessToken();
        const payload = decodeJwt(token);
        const tokenUser = mapUserFromToken(payload);
        if (tokenUser && tokenUser.id) {
            setUser(tokenUser);
            return true;
        }
        setUser(null);
        return false;
    }, []);

    const login = async (login, password) => {
        const res = await axiosInstance.post(ENDPOINTS.AUTH.LOGIN, { login, password });
        const { accessToken, refreshToken } = res.data;
        tokenService.setTokens(accessToken, refreshToken);
        setUserFromToken();
    };

    const register = async (login, password) => {
        await axiosInstance.post(ENDPOINTS.AUTH.REGISTER, { login, password });
    };

    const logout = async () => {
        try {
            await axiosInstance.post(ENDPOINTS.AUTH.LOGOUT);
        } finally {
            tokenService.clearTokens();
            setUser(null);
            window.location.href = "/login";
        }
    };

    useEffect(() => {
        const token = tokenService.getAccessToken();
        if (token) setUserFromToken();
        setLoading(false);
    }, [setUserFromToken]);

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

export const useAuth = () => useContext(AuthContext);
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// API configuration
const API_URL = 'http://localhost:3000/api'; // Change to your backend URL

interface User {
    id: string;
    email: string;
    role: 'CREATOR' | 'CONSUMER';
    firstName?: string;
    lastName?: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    emailVerified: boolean;
    status: string;
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, role: 'CREATOR' | 'CONSUMER', firstName?: string, lastName?: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: true,
    login: async () => { },
    register: async () => { },
    logout: async () => { },
    updateProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Configure axios interceptor for auth token
    useEffect(() => {
        const requestInterceptor = axios.interceptors.request.use(
            (config) => {
                if (accessToken) {
                    config.headers.Authorization = `Bearer ${accessToken}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // If 401 and we have a refresh token, try to refresh
                if (error.response?.status === 401 && refreshToken && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
                            refreshToken,
                        });

                        const newAccessToken = response.data.accessToken;
                        setAccessToken(newAccessToken);
                        await AsyncStorage.setItem('accessToken', newAccessToken);

                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        return axios(originalRequest);
                    } catch (refreshError) {
                        // Refresh failed, logout user
                        await logout();
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, [accessToken, refreshToken]);

    // Load stored auth data on mount
    useEffect(() => {
        const loadAuthData = async () => {
            try {
                const storedAccessToken = await AsyncStorage.getItem('accessToken');
                const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
                const storedUser = await AsyncStorage.getItem('user');

                if (storedAccessToken && storedUser) {
                    setAccessToken(storedAccessToken);
                    setRefreshToken(storedRefreshToken);
                    setUser(JSON.parse(storedUser));

                    // Verify token is still valid by fetching current user
                    try {
                        const response = await axios.get(`${API_URL}/auth/me`, {
                            headers: { Authorization: `Bearer ${storedAccessToken}` },
                        });
                        setUser(response.data.user);
                    } catch (error) {
                        // Token invalid, clear everything
                        await logout();
                    }
                }
            } catch (error) {
                console.error('Error loading auth data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadAuthData();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                email,
                password,
            });

            const { accessToken: newAccessToken, refreshToken: newRefreshToken, user: userData } = response.data;

            setAccessToken(newAccessToken);
            setRefreshToken(newRefreshToken);
            setUser(userData);

            // Store in AsyncStorage
            await AsyncStorage.setItem('accessToken', newAccessToken);
            await AsyncStorage.setItem('refreshToken', newRefreshToken);
            await AsyncStorage.setItem('user', JSON.stringify(userData));
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Login failed');
        }
    };

    const register = async (
        email: string,
        password: string,
        role: 'CREATOR' | 'CONSUMER',
        firstName?: string,
        lastName?: string
    ) => {
        try {
            await axios.post(`${API_URL}/auth/register`, {
                email,
                password,
                role,
                firstName,
                lastName,
            });

            // After registration, user needs to verify email before logging in
            // We don't auto-login
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Registration failed');
        }
    };

    const logout = async () => {
        try {
            if (refreshToken) {
                await axios.post(`${API_URL}/auth/logout`, { refreshToken });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            setAccessToken(null);
            setRefreshToken(null);
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('refreshToken');
            await AsyncStorage.removeItem('user');
        }
    };

    const updateProfile = async (data: Partial<User>) => {
        try {
            const response = await axios.put(`${API_URL}/profile`, data);
            const updatedUser = response.data.user;
            setUser(updatedUser);
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Profile update failed');
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                refreshToken,
                isLoading,
                login,
                register,
                logout,
                updateProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

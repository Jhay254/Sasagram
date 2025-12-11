import axios from 'axios';

// Create Axios instance with default config
export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
    (config) => {
        // Client-side: Get token from localStorage
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (typeof window !== 'undefined') {
                try {
                    const refreshToken = localStorage.getItem('refreshToken');

                    if (refreshToken) {
                        // Try to refresh token
                        const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
                            refreshToken
                        });

                        const { accessToken } = response.data;

                        // Update token in storage
                        localStorage.setItem('token', accessToken);

                        // Update authorization header
                        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

                        // Retry original request
                        return api(originalRequest);
                    } else {
                        // No refresh token available - redirect to login
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/login';
                        return Promise.reject(error);
                    }
                } catch (refreshError) {
                    // Refresh failed - clear tokens and redirect
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            }
        }

        return Promise.reject(error);
    }
);

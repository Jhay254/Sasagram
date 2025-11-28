export const lightTheme = {
    colors: {
        primary: '#667eea',
        secondary: '#764ba2',
        accent: '#f093fb',
        background: '#FFFFFF',
        surface: '#F5F5F5',
        card: '#FFFFFF',
        text: '#333333',
        textSecondary: '#666666',
        textTertiary: '#999999',
        border: '#E0E0E0',
        error: '#FF5858',
        success: '#4CAF50',
        warning: '#FFA726',
        info: '#29B6F6',
    },
    gradients: {
        creator: ['#f093fb', '#f5576c'],
        consumer: ['#4facfe', '#00f2fe'],
        biography: ['#667eea', '#764ba2'],
        earnings: ['#f857a6', '#ff5858'],
        discovery: ['#134E5E', '#71B280'],
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 40,
    },
    typography: {
        h1: {
            fontSize: 32,
            fontWeight: 'bold' as const,
            lineHeight: 40,
        },
        h2: {
            fontSize: 28,
            fontWeight: 'bold' as const,
            lineHeight: 36,
        },
        h3: {
            fontSize: 24,
            fontWeight: 'bold' as const,
            lineHeight: 32,
        },
        h4: {
            fontSize: 20,
            fontWeight: '600' as const,
            lineHeight: 28,
        },
        body: {
            fontSize: 16,
            fontWeight: 'normal' as const,
            lineHeight: 24,
        },
        bodySmall: {
            fontSize: 14,
            fontWeight: 'normal' as const,
            lineHeight: 20,
        },
        caption: {
            fontSize: 12,
            fontWeight: 'normal' as const,
            lineHeight: 16,
        },
    },
    borderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        round: 9999,
    },
    shadows: {
        small: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
        },
        medium: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
        },
        large: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 8,
        },
    },
};

export const darkTheme = {
    ...lightTheme,
    colors: {
        primary: '#8B9FEE',
        secondary: '#9B7BC2',
        accent: '#F5A9D0',
        background: '#121212',
        surface: '#1E1E1E',
        card: '#2C2C2C',
        text: '#FFFFFF',
        textSecondary: '#B0B0B0',
        textTertiary: '#808080',
        border: '#404040',
        error: '#FF6B6B',
        success: '#66BB6A',
        warning: '#FFB74D',
        info: '#4FC3F7',
    },
    gradients: {
        creator: ['#7B4397', '#DC2430'],
        consumer: ['#2C5364', '#203A43'],
        biography: ['#4A4E69', '#6B5B95'],
        earnings: ['#B06AB3', '#4568DC'],
        discovery: ['#1A3A40', '#4A7C59'],
    },
};

export type Theme = typeof lightTheme;

export default lightTheme;

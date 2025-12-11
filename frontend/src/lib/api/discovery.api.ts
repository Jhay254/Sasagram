import { Creator, FilterTab, Category, UserPreferences } from '../types/discovery.types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface FetchCreatorsParams {
    tab: FilterTab;
    category?: Category;
    preferences?: UserPreferences;
    page?: number;
    limit?: number;
    token?: string;
}

export interface FetchCreatorsResponse {
    creators: Creator[];
    hasMore: boolean;
    total: number;
}

/**
 * Fetch creators for discovery feed from backend API
 */
export async function fetchDiscoveryCreators(params: FetchCreatorsParams): Promise<FetchCreatorsResponse> {
    const { tab, category, preferences, page = 1, limit = 10, token } = params;

    const queryParams = new URLSearchParams({
        tab,
        page: page.toString(),
        limit: limit.toString(),
    });

    if (category) {
        queryParams.append('category', category);
    }

    if (preferences?.interests && preferences.interests.length > 0) {
        queryParams.append('interests', preferences.interests.join(','));
    }

    if (preferences?.lifeStage) {
        queryParams.append('lifeStage', preferences.lifeStage);
    }

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        console.log('[Discovery API] Fetching creators from:', `${API_BASE}/discover/creators?${queryParams}`);

        const response = await fetch(`${API_BASE}/discover/creators?${queryParams}`, {
            headers,
            credentials: 'include', // Include cookies for auth
        });

        console.log('[Discovery API] Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Discovery API] Error response:', errorText);
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[Discovery API] Received creators:', data.creators?.length || 0);
        return data;
    } catch (error) {
        console.error('[Discovery API] Fetch failed:', error);

        // Check if it's a network error
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            console.error('[Discovery API] Network error - is the backend server running at', API_BASE, '?');
        }

        throw error;
    }
}

/**
 * Search creators by query
 */
export async function searchDiscoveryCreators(
    query: string,
    page = 1,
    limit = 10,
    token?: string
): Promise<FetchCreatorsResponse> {
    const queryParams = new URLSearchParams({
        q: query,
        page: page.toString(),
        limit: limit.toString(),
    });

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE}/discover/search?${queryParams}`, {
            headers,
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error searching creators:', error);
        throw error;
    }
}

/**
 * Get detailed creator profile
 */
export async function getCreatorProfile(creatorId: string, token?: string): Promise<Creator> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE}/discover/creators/${creatorId}`, {
            headers,
            credentials: 'include',
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Creator not found');
            }
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching creator profile:', error);
        throw error;
    }
}

/**
 * Subscribe to a creator
 */
export async function subscribeToCreator(
    creatorId: string,
    tierId: string,
    token: string
): Promise<{ message: string; subscriptionId?: string }> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };

    try {
        const response = await fetch(`${API_BASE}/discover/creators/${creatorId}/subscribe`, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({ tierId }),
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Authentication required');
            }
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error subscribing to creator:', error);
        throw error;
    }
}

/**
 * Get auth token from localStorage (helper function)
 */
export function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
}

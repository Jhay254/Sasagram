import { api } from '../api';

export const rewindApi = {
    getFeed: (cursor?: string, limit: number = 10) =>
        api.get('/rewind/feed', { params: { cursor, limit } }),

    getOnThisDay: (offset: number = 0) =>
        api.get('/rewind/on-this-day', { params: { offset } }),

    getRandomMemory: () =>
        api.get('/rewind/random'),

    getTimeline: (year: number) =>
        api.get('/rewind/timeline', { params: { year } }),

    getMapLocations: () =>
        api.get('/rewind/map'),
};

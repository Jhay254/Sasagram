export enum EventSourceType {
    POST = 'POST',
    EMAIL = 'EMAIL',
    DIARY = 'DIARY',
    MEDIA = 'MEDIA',
}

export interface TimelineEvent {
    id: string;
    userId: string;
    sourceType: EventSourceType;
    sourceId: string;
    timestamp: Date;
    content: string;
    metadata: Record<string, any>;
    significance?: number;
    category?: string;
    tags?: string[];
}

export interface TimelineCluster {
    id: string;
    startDate: Date;
    endDate: Date;
    events: TimelineEvent[];
    significance: number;
    summary?: string;
}

export interface TimelineGap {
    startDate: Date;
    endDate: Date;
    durationDays: number;
}

export interface Timeline {
    userId: string;
    events: TimelineEvent[];
    clusters: TimelineCluster[];
    gaps: TimelineGap[];
    startDate: Date;
    endDate: Date;
}

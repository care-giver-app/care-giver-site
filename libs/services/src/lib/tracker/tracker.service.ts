import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import {
    Tracker,
    TrackerTemplate,
    CreateTrackerRequest,
    UpdateTrackerRequest,
    TrackerOperationResult,
} from '@care-giver-site/models';

const TRACKER_CACHE_TTL_MS = 5 * 1000;
const TEMPLATE_CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class TrackerService {
    readonly trackers$ = new BehaviorSubject<Tracker[]>([]);

    constructor(
        private http: HttpClient,
        private authService: AuthService,
    ) {}

    async getTrackers(receiverId: string): Promise<Tracker[] | undefined> {
        const cacheKey = `trackerCache_${receiverId}`;
        const cached = this.readCache<Tracker[]>(cacheKey, TRACKER_CACHE_TTL_MS);
        if (cached) {
            this.trackers$.next(cached);
            return cached;
        }

        try {
            const [headers, userId] = await Promise.all([this.headers(), this.authService.getCurrentUserId()]);
            const trackers = await firstValueFrom(
                this.http.get<Tracker[]>(
                    `/trackers/${encodeURIComponent(receiverId)}?userId=${encodeURIComponent(userId)}`,
                    { headers }
                )
            );
            this.writeCache(cacheKey, trackers);
            this.trackers$.next(trackers);
            return trackers;
        } catch (err) {
            console.error('TrackerService.getTrackers error', err);
            return undefined;
        }
    }

    async getTracker(trackerId: string, receiverId: string): Promise<Tracker | undefined> {
        try {
            const [headers, userId] = await Promise.all([this.headers(), this.authService.getCurrentUserId()]);
            return await firstValueFrom(
                this.http.get<Tracker>(
                    `/tracker/${encodeURIComponent(trackerId)}?receiverId=${encodeURIComponent(receiverId)}&userId=${encodeURIComponent(userId)}`,
                    { headers }
                )
            );
        } catch (err) {
            console.error('TrackerService.getTracker error', err);
            return undefined;
        }
    }

    async createTracker(request: CreateTrackerRequest): Promise<TrackerOperationResult> {
        try {
            const [headers, userId] = await Promise.all([this.headers(), this.authService.getCurrentUserId()]);
            const tracker = await firstValueFrom(
                this.http.post<Tracker>(`/tracker?userId=${encodeURIComponent(userId)}`, request, { headers })
            );
            this.clearCache(request.receiverId);
            await this.getTrackers(request.receiverId);
            return { success: true, conflict: false, tracker };
        } catch (err: any) {
            if (err?.status === 409) {
                return { success: false, conflict: true };
            }
            console.error('TrackerService.createTracker error', err);
            return { success: false, conflict: false };
        }
    }

    async updateTracker(
        trackerId: string,
        receiverId: string,
        request: UpdateTrackerRequest,
    ): Promise<TrackerOperationResult> {
        try {
            const [headers, userId] = await Promise.all([this.headers(), this.authService.getCurrentUserId()]);
            const tracker = await firstValueFrom(
                this.http.put<Tracker>(
                    `/tracker/${encodeURIComponent(trackerId)}?receiverId=${encodeURIComponent(receiverId)}&userId=${encodeURIComponent(userId)}`,
                    request,
                    { headers }
                )
            );
            this.clearCache(receiverId);
            await this.getTrackers(receiverId);
            return { success: true, conflict: false, tracker };
        } catch (err: any) {
            if (err?.status === 409) {
                return { success: false, conflict: true };
            }
            console.error('TrackerService.updateTracker error', err);
            return { success: false, conflict: false };
        }
    }

    async deleteTracker(trackerId: string, receiverId: string): Promise<boolean> {
        try {
            const [headers, userId] = await Promise.all([this.headers(), this.authService.getCurrentUserId()]);
            await firstValueFrom(
                this.http.delete(
                    `/tracker/${encodeURIComponent(trackerId)}?receiverId=${encodeURIComponent(receiverId)}&userId=${encodeURIComponent(userId)}`,
                    { headers }
                )
            );
            this.clearCache(receiverId);
            await this.getTrackers(receiverId);
            return true;
        } catch (err) {
            console.error('TrackerService.deleteTracker error', err);
            return false;
        }
    }

    async getTemplates(): Promise<TrackerTemplate[] | undefined> {
        const cacheKey = 'trackerTemplateCache';
        const cached = this.readCache<TrackerTemplate[]>(cacheKey, TEMPLATE_CACHE_TTL_MS);
        if (cached) return cached;

        try {
            const [headers, userId] = await Promise.all([this.headers(), this.authService.getCurrentUserId()]);
            const templates = await firstValueFrom(
                this.http.get<TrackerTemplate[]>(`/trackers/templates?userId=${encodeURIComponent(userId)}`, { headers })
            );
            this.writeCache(cacheKey, templates);
            return templates;
        } catch (err) {
            console.error('TrackerService.getTemplates error', err);
            return undefined;
        }
    }

    clearCache(receiverId: string): void {
        sessionStorage.removeItem(`trackerCache_${receiverId}`);
    }

    private async headers(): Promise<HttpHeaders> {
        const token = await this.authService.getBearerToken();
        return new HttpHeaders({ Authorization: token });
    }

    private readCache<T>(key: string, ttlMs: number): T | null {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        try {
            const entry: CacheEntry<T> = JSON.parse(raw);
            if (Date.now() - entry.timestamp < ttlMs) return entry.data;
        } catch {}
        return null;
    }

    private writeCache<T>(key: string, data: T): void {
        const entry: CacheEntry<T> = { data, timestamp: Date.now() };
        sessionStorage.setItem(key, JSON.stringify(entry));
    }
}

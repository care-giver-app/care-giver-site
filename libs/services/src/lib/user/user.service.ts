import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Observable, firstValueFrom } from 'rxjs';
import { User } from '@care-giver-site/models'

interface CreateUserResponse {
    userId: string;
    status: string;
}

interface AddCareReceiverResponse {
    receiverId: string;
    status: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {

    private userPath = "/user/";
    private primaryReceiverEndpoint = "primary-receiver/"
    private additionalCareGiverEndpoint = "additional-receiver/"

    constructor(
        private http: HttpClient,
        private authService: AuthService,
    ) { }

    async getUserData(userId: string, forceRefresh: boolean = false): Promise<User | undefined> {
        const cacheKey = `userCache_${userId}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached && !forceRefresh) {
            try {
                return JSON.parse(cached) as User;
            } catch {
                localStorage.removeItem(cacheKey);
            }
        }
        const token = await this.authService.getBearerToken();
        const headers: HttpHeaders = new HttpHeaders({
            'Authorization': token,
        });
        try {
            const user = await firstValueFrom(
                this.http.get<User>(`${this.userPath}${encodeURIComponent(userId)}`, { headers })
            );
            if (user) {
                localStorage.setItem(cacheKey, JSON.stringify(user));
            }
            return user;
        } catch (err) {
            console.error('Error fetching user data:', err);
            return undefined;
        }
    }

    createUser(firstName: string, lastName: string, email: string): Observable<CreateUserResponse> {
        const requestBody: any = {
            firstName: firstName,
            lastName: lastName,
            email: email,
        }

        return this.http.post<CreateUserResponse>(this.userPath, requestBody);
    }

    async addCareReceiver(userId: string, firstName: string, lastName: string): Promise<AddCareReceiverResponse | undefined> {
        const token = await this.authService.getBearerToken();
        const headers: HttpHeaders = new HttpHeaders({
            'Authorization': token,
        });
        const requestBody: any = {
            firstName: firstName,
            lastName: lastName,
            userId: userId,
        }
        try {
            return await firstValueFrom(
                this.http.post<AddCareReceiverResponse>(`${this.userPath}${this.primaryReceiverEndpoint}`, requestBody, { headers })
            );
        } catch (err) {
            console.error('Error adding care receiver:', err);
            return undefined;
        }
    }

    async addCareGiver(userId: string, receiverId: string, email: string): Promise<AddCareReceiverResponse | undefined> {
        const token = await this.authService.getBearerToken();
        const headers: HttpHeaders = new HttpHeaders({
            'Authorization': token,
        });
        const requestBody: any = {
            receiverId: receiverId,
            email: email,
            userId: userId,
        }
        try {
            return await firstValueFrom(
                this.http.post<AddCareReceiverResponse>(`${this.userPath}${this.additionalCareGiverEndpoint}`, requestBody, { headers })
            );
        } catch (err) {
            console.error('Error adding additional care giver:', err);
            return undefined;
        }
    }

    getLoggedUser(userId: string): Promise<string> {
        return this.getUserData(userId).then((user: User | undefined) =>
            user ? `${user.firstName} ${user.lastName}` : "Not Available"
        );
    }

}

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Observable, firstValueFrom } from 'rxjs';
import { User } from '@care-giver-site/models'

interface CreateUserResponse {
    userId: string;
    status: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {

    private userPath = "/user/";

    constructor(
        private http: HttpClient,
        private authService: AuthService,
    ) { }

    async getUserData(userId: string): Promise<User | undefined> {
        const token = await this.authService.getBearerToken();
        const headers: HttpHeaders = new HttpHeaders({
            'Authorization': token,
        });
        try {
            return await firstValueFrom(
                this.http.get<User>(`${this.userPath}${encodeURIComponent(userId)}`, { headers })
            );
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

}

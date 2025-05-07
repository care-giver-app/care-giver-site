import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Observable } from 'rxjs';

interface CreateUserResponse {
    userId: string;
    status: string;
}

interface GetUserResponse {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    primaryCareReceivers: string[];
    additionalCareReceivers: string[];
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

    getUserData(userId: string): Promise<Observable<GetUserResponse>> {
        return this.authService.getBearerToken().then((token) => {
            const headers: HttpHeaders = new HttpHeaders({
                'Authorization': token,
            });
            return this.http.get<GetUserResponse>(`${this.userPath}${encodeURIComponent(userId)}`, { headers: headers });
        })
    }

    createUser(firstName: string, lastName: string, email: string): Observable<CreateUserResponse> {
        const requestBody: any = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: "test123",
        }

        return this.http.post<CreateUserResponse>(this.userPath, requestBody);

    }

}

import { HttpClient } from '@angular/common/http';
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
    ) { }

    getUserData(userId: string): Observable<GetUserResponse> {
        return this.http.get<GetUserResponse>(`${this.userPath}${encodeURIComponent(userId)}`);
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

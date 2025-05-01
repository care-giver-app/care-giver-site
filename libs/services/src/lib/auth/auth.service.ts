import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';


const CLIENT_SECRET = "CLIENT_SECRET";
const CLIENT_ID = "CLIENT_ID";

const oauthEndpoint = "/oauth2/token";

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private bearerToken: string | null = null;

    constructor(private http: HttpClient) { }

    getClientSecret(): string {
        return process.env[CLIENT_SECRET] || '';
    }

    getClientId(): string {
        return process.env[CLIENT_ID] || '';
    }

    retrieveBearerToken(): Observable<string> {
        if (this.bearerToken) {
            return of(this.bearerToken);
        }

        const requestBody = `grant_type=client_credentials&client_id=${this.getClientId()}&client_secret=${this.getClientSecret()}&scope=API/full`;

        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
        };

        return this.http.post<{ access_token: string }>(oauthEndpoint, requestBody, { headers }).pipe(
            tap((response) => {
                this.bearerToken = response.access_token; // Cache the token
            }),
            switchMap((response) => of(response.access_token))
        );
    }

    getBearerToken(): Observable<string> {
        return this.retrieveBearerToken();
    }
}
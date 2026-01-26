import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AuthService } from "../auth/auth.service";
import { Observable } from "rxjs";

interface SubmitFeedbackRequest {
    message: string;
}

interface SubmitFeedbackResponse {
    status: string;
}

@Injectable({
    providedIn: 'root'
})
export class FeedbackService {
private feedbackPath = "/feedback/";

    constructor(
        private http: HttpClient,
        private authService: AuthService,
    ) { }

    async submitFeedback(message: string): Promise<Observable<SubmitFeedbackResponse>> {
        return this.authService.getBearerToken().then((token) => {
            const headers: HttpHeaders = new HttpHeaders({
                'Authorization': token,
            });

            const request : SubmitFeedbackRequest = { message: message };
            return this.http.post<SubmitFeedbackResponse>(this.feedbackPath, request, { headers: headers });
        })
    }
}
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ViewService {
    isMobile(): boolean {
        return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent);
    }
}

import { Injectable } from '@angular/core';
import {
    CanActivate,
    Router,
    UrlTree,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
} from '@angular/router';
import { getCurrentUser, GetCurrentUserOutput } from '@aws-amplify/auth';

@Injectable({
    providedIn: 'root',
})
export class AuthGuard implements CanActivate {
    constructor(private router: Router) { }

    async canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Promise<boolean | UrlTree> {
        try {
            await getCurrentUser();
            return true;
        } catch (err) {
            return this.router.createUrlTree(['/auth']);
        }
    }
}

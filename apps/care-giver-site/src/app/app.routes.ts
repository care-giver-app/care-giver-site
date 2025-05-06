import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';


export const appRoutes: Routes = [
    {
        path: '',
        canActivate: [AuthGuard],
        loadComponent: () =>
            import('@care-giver-site/care').then((m) => m.CareComponent),
    },
    {
        path: 'auth',
        loadComponent: () =>
            import('@care-giver-site/auth').then((m) => m.AuthComponent),
    }
];
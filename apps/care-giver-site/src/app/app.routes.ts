import { Routes } from '@angular/router';

export const appRoutes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('@care-giver-site/care').then((m) => m.CareComponent),
    },
    {
        path: 'auth',
        loadComponent: () =>
            import('@care-giver-site/auth').then((m) => m.AuthComponent),
    }
];
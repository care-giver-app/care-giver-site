import { Routes } from '@angular/router';

export const appRoutes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('@care-giver-site/care').then((m) => m.CareComponent),
    },
];
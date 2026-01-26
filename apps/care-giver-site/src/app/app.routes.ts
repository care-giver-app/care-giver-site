import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';


export const appRoutes: Routes = [
    {
        path: '',
        canActivate: [AuthGuard],
        loadComponent: () =>
            import('@care-giver-site/care').then((m) => m.DashboardComponent),
    },
    {
        path: 'stats',
        canActivate: [AuthGuard],
        loadComponent: () =>
            import('@care-giver-site/care').then((m) => m.StatsComponent),
    },
    {
        path: 'auth',
        loadComponent: () =>
            import('@care-giver-site/auth').then((m) => m.AuthComponent),
    },
    {
        path: 'submit-feedback',
        canActivate: [AuthGuard],
        loadComponent: () =>
            import('@care-giver-site/care').then((m) => m.FeedbackComponent),
    }
];
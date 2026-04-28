import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';


export const appRoutes: Routes = [
    {
        path: '',
        canActivate: [AuthGuard],
        loadComponent: () =>
            import('@care-giver-site/care').then((m) => m.ShellComponent),
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('@care-giver-site/care').then((m) => m.DashboardComponent),
            },
            {
                path: 'stats',
                loadComponent: () =>
                    import('@care-giver-site/care').then((m) => m.StatsComponent),
            },
            {
                path: 'submit-feedback',
                loadComponent: () =>
                    import('@care-giver-site/care').then((m) => m.FeedbackComponent),
            },
        ],
    },
    {
        path: 'auth',
        loadComponent: () =>
            import('@care-giver-site/auth').then((m) => m.AuthComponent),
    },
    {
        path: 'mobile-download',
        loadComponent: () =>
            import('@care-giver-site/care').then((m) => m.MobileDownloadComponent),
    }
];
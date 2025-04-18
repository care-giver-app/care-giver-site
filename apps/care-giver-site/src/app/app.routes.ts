import { Routes } from '@angular/router';
import { NxWelcomeComponent } from './nx-welcome.component';

export const appRoutes: Routes = [
    {
        path: '',
        component: NxWelcomeComponent,
        pathMatch: 'full',
    },
    {
        path: 'care',
        loadComponent: () =>
            import('@care-giver-site/care').then((m) => m.CareComponent),
    },
];
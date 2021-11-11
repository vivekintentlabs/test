import { Routes } from '@angular/router';
import { environment } from 'environments/environment';

import { AdminLayoutComponent } from './layouts/admin/admin-layout.component';
import { AuthLayoutComponent } from './layouts/auth/auth-layout.component';
import { AuthGuard } from './services/auth.guard';

export const AppRoutes: Routes = [
    {
        path: '',
        component: AdminLayoutComponent, canActivateChild: [AuthGuard],
        children: [
            {
                path: '',
                loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
                canActivateChild: [AuthGuard]
            },
            {
                path: 'admin',
                loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
                canActivateChild: [AuthGuard]
            },
            {
                path: 'admin',
                loadChildren: () => import('./signup-form/signup-form.module').then(m => m.SignupFormModule),
                canActivateChild: [AuthGuard]
            },
            {
                path: 'analytics',
                loadChildren: () => import('./analytics/analytics.module').then(m => m.AnalyticsModule),
                canActivateChild: [AuthGuard]
            },
            {
                path: environment.localization.enquiriesUrl,
                loadChildren: () => import('./enquiries/enquiries.module').then(m => m.EnquiriesModule),
                canActivateChild: [AuthGuard]
            },
            {
                path: 'communications',
                loadChildren: () => import('./communications/communications.module').then(m => m.CommunicationsModule),
                canActivateChild: [AuthGuard]
            },
            {
                path: 'applications',
                loadChildren: () => import('./applications/applications.module').then(m => m.ApplicationsModule),
                canActivateChild: [AuthGuard]
            },
            {
                path: 'events',
                loadChildren: () => import('./events/events.module').then(m => m.EventsModule),
                canActivateChild: [AuthGuard]
            },
            {
                path: 'components',
                loadChildren: () => import('./components/components.module').then(m => m.ComponentsModule),
                canActivateChild: [AuthGuard]
            },
            {
                path: 'user-page',
                loadChildren: () => import('./userpage/user.module').then(m => m.UserModule),
                canActivateChild: [AuthGuard]
            },
            {
                path: 'system-admin',
                loadChildren: () => import('./system-admin/system-admin.module').then(m => m.SystemAdminModule),
                canActivateChild: [AuthGuard]
            }
        ]
    },
    {
        path: '',
        component: AuthLayoutComponent,
        children: [
            {
                path: 'noAuth',
                loadChildren: () => import('./noAuth/noAuth.module').then(m => m.NoAuthModule)
            },
            {
                path: 'webforms',
                loadChildren: () => import('./webforms/webforms.module').then(m => m.WebformsModule)
            },
            {
                path: 'representative',
                loadChildren: () => import('./representative/representative.module').then(m => m.RepresentativeModule)
            },
            {
                path: '',
                loadChildren: () => import('./applications/applications.module').then(m => m.ApplicationsModule)
            }
        ]
    }
];

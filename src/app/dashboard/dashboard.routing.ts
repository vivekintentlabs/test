import { Routes } from '@angular/router';
import { Role } from '../common/enums';

import { DashboardComponent } from './dashboard.component';

export const DashboardRoutes: Routes = [
    {
        path: '',
        children: [{
            path: 'dashboard',
            component: DashboardComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor, Role.User]
            }
        }]
    },
    {
        path: '',
        children: [{
            path: 'dashboard/sendback',
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor, Role.User]
            }
        }]
    }
];

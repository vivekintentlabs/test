import { Routes } from '@angular/router';
import { CommsCreateMessageComponent } from 'app/communications/comms-create-message/comms-create-message.component';
import { CommsScheduleMessageComponent } from 'app/communications/comms-schedule-message/comms-schedule-message.component';
import { CommsPromopageComponent } from 'app/communications/comms-promopage/comms-promopage.component';
import { CommsDashboardComponent } from 'app/communications/comms-dashboard/comms-dashboard.component';
import { CommsMessageStatsComponent } from 'app/communications/comms-message-stats/comms-message-stats.component';
import { CanDeactivateGuard } from 'app/services/can-deactivate-guard.service';
import { Role } from '../common/enums';

export const CommunicationsRoutes: Routes = [
    {
        path: '',
        children: [ {
            path: 'email',
            component: CommsDashboardComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'promo',
            component: CommsPromopageComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'create',
            component: CommsCreateMessageComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'schedule-message/:id',
            component: CommsScheduleMessageComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'edit-scheduled-message/:id',
            component: CommsScheduleMessageComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'edit-message/:id',
            component: CommsCreateMessageComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'message-stats/:id',
            component: CommsMessageStatsComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    }
];

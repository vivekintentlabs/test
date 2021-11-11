import { Routes } from '@angular/router';
import { CanDeactivateGuard } from '../services/can-deactivate-guard.service';
import { Role } from '../common/enums';

import { SchoolsComponent } from './schools/schools.component';
import { OperationModeComponent } from './operation-mode/operation-mode.component';
import { EventPTComponent } from './event-pt/event-pt.component';
import { AppsMasterFormComponent } from '../applications/apps-dashboard/apps-masterform/apps-masterform.component';
import { AddStudentStatusComponent } from './add-student-status/add-student-status.component';
import { StudentStatusComponent } from './student-status/student-status.component';

export const SystemAdminRoutes: Routes = [
    {
        path: '',
        children: [ {
            path: 'schools',
            component: SchoolsComponent,
            data: {
                roles: [Role.SystemAdmin]
            }
        }]
    },
    {
        path: '',
        children: [{
            path: 'operation-mode',
            canDeactivate: [CanDeactivateGuard],
            component: OperationModeComponent,
            data: {
                roles: [Role.SystemAdmin]
            }
        }]
    },
    {
        path: '',
        children: [{
            path: 'event-pt',
            component: EventPTComponent,
            data: {
                roles: [Role.SystemAdmin]
            }
        }]
    },
    {
        path: '',
        children: [{
            path: 'app-masterform',
            component: AppsMasterFormComponent,
            data: {
                roles: [Role.SystemAdmin]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'student-status',
            component: StudentStatusComponent,
            data: {
                roles: [Role.SystemAdmin]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'add-student-status',
            component: AddStudentStatusComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'edit-student-status/:id',
            component: AddStudentStatusComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin]
            }
        }]
    },
];

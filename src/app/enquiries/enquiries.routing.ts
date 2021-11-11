import { Routes } from '@angular/router';
import { Role } from '../common/enums';

import { StudentsComponent } from './students/students.component';
import { StudentDetailsComponent } from './student-details/student-details.component';
import { ContactsComponent } from './contacts/contacts/contacts.component';
import { AddContactComponent } from './add-contact/add-contact.component';
import { DuplicateContactsComponent } from './contacts/duplicate-contacts/duplicate-contacts.component';

import { CanDeactivateGuard } from '../services/can-deactivate-guard.service';

export const EnquiriesRoutes: Routes = [
    {
        path: '',
        children: [{
            path: 'students',
            component: StudentsComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    },
    {
        path: '',
        children: [{
            path: 'add-student',
            component: StudentDetailsComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    },
    {
        path: '',
        children: [{
            path: 'edit-student',
            component: StudentDetailsComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    },
    {
        path: '',
        children: [{
            path: 'contacts',
            component: ContactsComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    },
    {
        path: '',
        children: [{
            path: 'duplicate-contacts',
            component: DuplicateContactsComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    },
    {
        path: '',
        children: [{
            path: 'add-contact',
            component: AddContactComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    },
    {
        path: '',
        children: [{
            path: 'edit-contact',
            component: AddContactComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin, Role.Editor]
            }
        }]
    },
];

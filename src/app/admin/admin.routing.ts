import { Routes } from '@angular/router';
import { CanDeactivateGuard } from '../services/can-deactivate-guard.service';
import { Role } from '../common/enums';

import { CurrentSchoolsComponent } from './current-school/current-schools.component';
import { AddCurrentSchoolComponent} from './add-current-school/add-current-school.component';
import { ListItemComponent } from './list-item/list-item.component';
import { AppIntegrationComponent } from './app-integration/app-integration.component';
import { RankingScoreComponent } from './ranking-score/ranking-score.component';
import { YearLevelComponent } from './year-level/year-level.component';
import { EmailTemplatesComponent } from './email/email.component';
import { EnrolmentTargetComponent } from './enrolment-target/enrolment-target.component';
import { CommsCreateEmailTemplateComponent } from '../communications/comms-email-templates/comms-create-email-template/comms-create-email-template.component';

import { AddSchoolComponent } from './add-school/add-school.component';
import { SchoolUsersComponent } from './school-users/school-users.component';
import { AddUserComponent } from './add-user/add-user.component';
import { ProductsComponent } from './products/products.component';
import { SynCodeMappingComponent } from './syn-code-mapping/syn-code-mapping.component';
import { DashboardConfigComponent } from './dashboard-config/dashboard-config.component';

export const AdminRoutes: Routes = [
    {
        path: '',
        children: [{
            path: 'school-lists',
            component: ListItemComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'current-schools',
            component: CurrentSchoolsComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'add-current-schools',
            component: AddCurrentSchoolComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'edit-current-schools/:id',
            component: AddCurrentSchoolComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'delete-current-schools/:id',
            component: CurrentSchoolsComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [{
            path: 'app-integration',
            component: AppIntegrationComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'ranking-score',
            component: RankingScoreComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'year-level',
            component: YearLevelComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'emails',
            component: EmailTemplatesComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'emails/create-comms-template',
            component: CommsCreateEmailTemplateComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'emails/edit-comms-template/:id',
            component: CommsCreateEmailTemplateComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'add-school',
            component: AddSchoolComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'edit-school/:id',
            component: AddSchoolComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'edit-school',
            component: AddSchoolComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'school-users',
            component: SchoolUsersComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'add-user',
            component: AddUserComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'edit-user/:id',
            component: AddUserComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [ {
            path: 'delete-user/:id',
            component: SchoolUsersComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [{
            path: 'enrolment-target',
            component: EnrolmentTargetComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [{
            path: 'products',
            component: ProductsComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [{
            path: 'add-product',
            component: ProductsComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [{
            path: 'edit-product/:id',
            component: ProductsComponent,
            canDeactivate: [CanDeactivateGuard],
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
    {
        path: '',
        children: [{
            path: 'standart-lists',
            component: SynCodeMappingComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    }, {
        path: '',
        children: [{
            path: 'dashboard-config',
            canDeactivate: [CanDeactivateGuard],
            component: DashboardConfigComponent,
            data: {
                roles: [Role.SystemAdmin, Role.SchoolAdmin]
            }
        }]
    },
];

import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule} from '../components/components.module';
import { EventsModule } from '../events/events.module';
import { MaterialModule } from '../app.module';
import { SharedModule } from '../shared.module'

import { AdminRoutes } from './admin.routing';
import { ListItemComponent } from './list-item/list-item.component';
import { CurrentSchoolsComponent } from './current-school/current-schools.component';
import { AddCurrentSchoolComponent} from './add-current-school/add-current-school.component';
import { AppIntegrationComponent } from './app-integration/app-integration.component';
import { RankingScoreComponent } from './ranking-score/ranking-score.component';
import { YearLevelComponent } from './year-level/year-level.component';
import { EmailTemplatesComponent } from './email/email.component';
import { CampusesComponent } from './campuses/campuses.component';
import { EnrolmentTargetComponent } from './enrolment-target/enrolment-target.component';
import { AddSchoolComponent } from './add-school/add-school.component';
import { SchoolUsersComponent } from './school-users/school-users.component';
import { AddUserComponent } from './add-user/add-user.component';
import { ProductsComponent } from './products/products.component';
import { SynCodeMappingComponent } from './syn-code-mapping/syn-code-mapping.component';
import { DashboardConfigComponent } from './dashboard-config/dashboard-config.component';
import { CommsEmailTemplatesComponent } from 'app/communications/comms-email-templates/comms-email-templates.component';
import {
    CommsCreateEmailTemplateComponent
} from 'app/communications/comms-email-templates/comms-create-email-template/comms-create-email-template.component';
import { SchoolModulesComponent } from 'app/admin/school-modules/school-modules.component';
import { EditCampusComponent } from './edit-campus/edit-campus.component';
@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(AdminRoutes),
        FormsModule,
        ReactiveFormsModule,
        ComponentsModule,
        EventsModule,
        MaterialModule,
        SharedModule,
        TranslateModule
    ],
    declarations: [
        ListItemComponent,
        CurrentSchoolsComponent,
        AddCurrentSchoolComponent,
        AppIntegrationComponent,
        RankingScoreComponent,
        YearLevelComponent,
        EmailTemplatesComponent,
        CampusesComponent,
        EnrolmentTargetComponent,
        AddSchoolComponent,
        SchoolUsersComponent,
        AddUserComponent,
        ProductsComponent,
        SynCodeMappingComponent,
        DashboardConfigComponent,
        CommsEmailTemplatesComponent,
        CommsCreateEmailTemplateComponent,
        SchoolModulesComponent,
        EditCampusComponent,
    ],
    exports: [
        ListItemComponent,
    ],
})

export class AdminModule {}

import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComponentsModule} from '../components/components.module';
import { EventsModule } from '../events/events.module';
import { MaterialModule } from '../app.module';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { SystemAdminRoutes } from './system-admin.routing';
import { SchoolsComponent } from './schools/schools.component';
import { OperationModeComponent } from './operation-mode/operation-mode.component';
import { EventPTComponent } from './event-pt/event-pt.component';
import { AppsMasterFormComponent } from '../applications/apps-dashboard/apps-masterform/apps-masterform.component';
import { SharedModule } from '../shared.module';
import { StudentStatusComponent } from './student-status/student-status.component';
import { AddStudentStatusComponent } from './add-student-status/add-student-status.component';


@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(SystemAdminRoutes),
        FormsModule,
        ReactiveFormsModule,
        ComponentsModule,
        EventsModule,
        MaterialModule,
        MatDialogModule,
        SharedModule,
        TranslateModule
    ],
    declarations: [
        SchoolsComponent,
        OperationModeComponent,
        EventPTComponent,
        AppsMasterFormComponent,
        StudentStatusComponent,
        AddStudentStatusComponent,
    ]
})

export class SystemAdminModule {}

import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateModule } from '@ngx-translate/core';

import { TagInputModule } from 'ngx-chips';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

import { MaterialModule } from '../app.module';
import { SharedModule } from '../shared.module';
import { ComponentsModule } from '../components/components.module';
import { EventsModule } from '../events/events.module';
import { TableSpinnerModule } from 'app/components/table-spinner/table-spinner.module';

import { PaginatorService } from '../services/paginator.service';

import { EnquiriesRoutes } from './enquiries.routing';

import { StudentsComponent } from './students/students.component';
import { StudentDetailsComponent } from './student-details/student-details.component';
import { ActivityLogsComponent } from './activity-logs/activity-logs.component';
import { StudentLogsComponent } from './student-logs/student-logs.component';
import { AddActivityLogComponent } from './add-activity-log/add-activity-log.component';
import { ContactsComponent } from './contacts/contacts/contacts.component';
import { AddContactComponent } from './add-contact/add-contact.component';
import { EnquiriesFilterContactComponent } from './enquiries-filter/enquiries-filter-contact.component';
import { EnquiriesFilterStudentComponent } from './enquiries-filter/enquiries-filter-student.component';
import { ContactFilterComponent } from './contact-filter/contact-filter.component';
import { StudentStateComponent } from './student-state/student-state.component';
import { DuplicateContactsComponent } from './contacts/duplicate-contacts/duplicate-contacts.component';

import { ExportStudent } from './export-student';


@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(EnquiriesRoutes),
        FormsModule,
        ReactiveFormsModule,
        EventsModule,
        ComponentsModule,
        TagInputModule,
        MaterialModule,
        SharedModule,
        ScrollingModule,
        InfiniteScrollModule,
        TableSpinnerModule,
        TranslateModule,
    ],
    declarations: [
        StudentsComponent,
        StudentDetailsComponent,
        ActivityLogsComponent,
        StudentLogsComponent,
        AddActivityLogComponent,
        ContactsComponent,
        AddContactComponent,
        EnquiriesFilterContactComponent,
        EnquiriesFilterStudentComponent,
        ContactFilterComponent,
        StudentStateComponent,
        DuplicateContactsComponent,
    ],
    exports: [
        ContactFilterComponent
    ],
    providers: [
        ExportStudent,
        {
            provide: MatPaginatorIntl, useClass: PaginatorService
        }
    ]
})

export class EnquiriesModule { }

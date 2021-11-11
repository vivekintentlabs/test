import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, NG_VALIDATORS } from '@angular/forms';
import { MaterialModule } from '../app.module';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { ComponentsModule } from '../components/components.module';
import { AmazingTimePickerModule } from 'amazing-time-picker';
import { SharedModule } from '../shared.module';

import { EventsRoutes } from './events.routing';
import { EventsComponent } from './events/events.component';
import { EditEventComponent } from './edit-event/edit-event.component';
import { EditBookingModalComponent } from './edit-booking-modal/edit-booking-modal.component';
import { EventsCountViewComponent } from './events-count-view/events-count-view.component';
import { EventStatusComponent} from './event-status/event-status.component';
import { EventsSummaryComponent } from './events-summary/events-summary.component';
import { EventsAttendeeStatisticsComponent } from './events-attendee-statistics/events-attendee-statistics.component';
import { PersonalToursComponent } from './personal-tours/personal-tours.component';
import { EditPersonalTourComponent } from './edit-personal-tour/edit-personal-tour.component';
import { EditPersonalTourBookingModalComponent } from './edit-personal-tour-booking-modal/edit-personal-tour-booking-modal.component';
import { EventFilterComponent } from './event-filter/event-filter.component';
import { PersonalTourSummaryComponent } from './personal-tour-summary/personal-tour-summary.component';
import { SubTourComponent } from './sub-tour/sub-tour.component';
import { EditSubTourComponent } from './edit-sub-tour/edit-sub-tour.component';
import { RsvpListComponent } from './rsvp-list/rsvp-list.component';
import { PersonalTourBokingsComponent } from './personal-tour-bookings/personal-tour-bookings.component';

import { emailChipsValidator } from 'app/validators/email-chips.validator';
import { EditStudentModalComponent } from 'app/components/edit-student-modal/edit-student-modal.component';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(EventsRoutes),
        FormsModule,
        ReactiveFormsModule,
        ComponentsModule,
        MaterialModule,
        AmazingTimePickerModule,
        SharedModule,
        NgbModalModule,
        TranslateModule,
    ],
    declarations: [
        EventsComponent,
        EditEventComponent,
        EditBookingModalComponent,
        EventsCountViewComponent,
        EventStatusComponent,
        EventsSummaryComponent,
        EventsAttendeeStatisticsComponent,
        PersonalToursComponent,
        EditPersonalTourComponent,
        EventFilterComponent,
        EditPersonalTourBookingModalComponent,
        PersonalTourSummaryComponent,
        SubTourComponent,
        EditSubTourComponent,
        RsvpListComponent,
        PersonalTourBokingsComponent,
    ],
    exports: [
        EditBookingModalComponent,
        EditEventComponent,
        EventsCountViewComponent,
        EventStatusComponent,
        EventsSummaryComponent,
        EventsAttendeeStatisticsComponent,
        EditPersonalTourComponent,
        EditPersonalTourBookingModalComponent,
        PersonalTourSummaryComponent,
    ],
    providers: [
        { provide: NG_VALIDATORS, useExisting: emailChipsValidator, multi: true }
    ]
})

export class EventsModule {}

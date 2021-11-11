import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MaterialModule } from 'app/app.module';
import { ComponentsModule } from 'app/components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'app/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { CommunicationsRoutes } from 'app/communications/communications.routing';
import { CommsDashboardComponent } from 'app/communications/comms-dashboard/comms-dashboard.component';
import { CommsPromopageComponent } from 'app/communications/comms-promopage/comms-promopage.component';
import { CommsStatsComponent } from 'app/communications/comms-dashboard/comms-stats/comms-stats.component';
import { CommsDraftMessagesComponent } from 'app/communications/comms-dashboard/comms-draft-messages/comms-draft-messages.component';
import { CommsScheduledMessagesComponent } from 'app/communications/comms-dashboard/comms-scheduled-messages/comms-scheduled-messages.component';
import { CommsSentMessagesComponent } from 'app/communications/comms-dashboard/comms-sent-messages/comms-sent-messages.component';
import { CommsCreateMessageComponent } from 'app/communications/comms-create-message/comms-create-message.component';
import { CommsScheduleMessageComponent } from 'app/communications/comms-schedule-message/comms-schedule-message.component';
import { CommsMessageStatsComponent } from 'app/communications/comms-message-stats/comms-message-stats.component';
import { CommsTestEmailDialogComponent } from 'app/communications/common/comms-test-email-dialog.component';
import { EnquiriesModule } from 'app/enquiries/enquiries.module';

@NgModule({
  declarations: [
    CommsDashboardComponent,
    CommsPromopageComponent,
    CommsStatsComponent,
    CommsDraftMessagesComponent,
    CommsScheduledMessagesComponent,
    CommsSentMessagesComponent,
    CommsCreateMessageComponent,
    CommsScheduleMessageComponent,
    CommsMessageStatsComponent,
    CommsTestEmailDialogComponent
  ],
  imports: [
    ComponentsModule,
    CommonModule,
    RouterModule.forChild(CommunicationsRoutes),
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MaterialModule,
    EnquiriesModule,
    SharedModule,
    TranslateModule
  ],
  exports: [
    CommsDashboardComponent,
    CommsPromopageComponent,
    CommsStatsComponent,
    CommsDraftMessagesComponent,
    CommsScheduledMessagesComponent,
    CommsSentMessagesComponent,
    CommsCreateMessageComponent,
    CommsScheduleMessageComponent,
    CommsMessageStatsComponent,
    CommsTestEmailDialogComponent
  ]
})

export class CommunicationsModule { }

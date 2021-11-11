import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComponentsModule } from '../components/components.module';
import { EventsModule } from '../events/events.module';
import { AnalyticsRoutes } from './analytics.routing';
import { MaterialModule } from '../app.module';
import { SharedModule } from '../shared.module';
import { TranslateModule } from '@ngx-translate/core';

import { DemographicComponent } from './demographic/demographic.component';
import { AnalyticsEventsComponent } from './events/events.component';
import { EnquiriesComponent } from './enquiries/enquiries.component';
import { ProspectusesComponent } from './enquiries/prospectuses/prospectuses.component';
import { GeographicComponent } from './geographic/geographic.component';
import { ResearchComponent } from './research/research.component';
import { AnalyticsSchoolComponent } from './school/school.component';
import { EnquiriesStudentsComponent } from './enquiries/students/students.component';
import { DashboardWidgetComponent } from './dashboard-widget/dashboard-widget.component';
import { DemographicPieChartComponent } from './demographic/demographic-pie-chart/demographic-pie-chart.component';
import { DemographicChartComponent } from './demographic/demographic-chart/demographic-chart.component';
import { DemographicColumnChartComponent } from './demographic/demographic-column-chart/demographic-column-chart.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(AnalyticsRoutes),
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule,
    EventsModule,
    MaterialModule,
    SharedModule,
    TranslateModule
  ],
  declarations: [
    DemographicComponent,
    AnalyticsEventsComponent,
    EnquiriesComponent,
    ProspectusesComponent,
    GeographicComponent,
    ResearchComponent,
    AnalyticsSchoolComponent,
    EnquiriesStudentsComponent,
    DashboardWidgetComponent,
    DemographicPieChartComponent,
    DemographicChartComponent,
    DemographicColumnChartComponent
  ],
  exports: [
    DemographicComponent,
    ProspectusesComponent,
    EnquiriesStudentsComponent,
    ResearchComponent,
    GeographicComponent,
    AnalyticsSchoolComponent
  ]
})

export class AnalyticsModule { }

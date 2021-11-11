import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RepresentativeRoutes } from './representative.routing';
import { MaterialModule } from '../app.module';
import { EventsModule } from '../events/events.module';

import { RepresentativeEditEventComponent } from './edit-event-representative/edit-event-representative.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(RepresentativeRoutes),
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    EventsModule
  ],
  declarations: [
    RepresentativeEditEventComponent
  ]
})

export class RepresentativeModule {}

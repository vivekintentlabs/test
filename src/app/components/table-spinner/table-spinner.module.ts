import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SpinnerModule } from '../spinner/spinner.module';

import { TableSpinnerComponent } from './table-spinner.component';

@NgModule({
  imports: [
    CommonModule,
    SpinnerModule,
  ],
  declarations: [
    TableSpinnerComponent,
  ],
  exports: [
    TableSpinnerComponent,
  ]
})
export class TableSpinnerModule { }

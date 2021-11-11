import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '../components/components.module';
import { SidebarComponent } from './sidebar.component';

@NgModule({
    imports: [RouterModule, CommonModule, ComponentsModule, TranslateModule],
    declarations: [SidebarComponent],
    exports: [SidebarComponent]
})

export class SidebarModule { }

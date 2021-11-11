import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from './navbar.component';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
    imports: [RouterModule, CommonModule, FormsModule, ReactiveFormsModule, ComponentsModule],
    declarations: [NavbarComponent],
    exports: [NavbarComponent]
})

export class NavbarModule { }

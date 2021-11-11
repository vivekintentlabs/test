import '@angular/compiler'; // Needs for bootstrap using '@angular/platform-browser-dynamic' or '@angular/platform-server'
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { MaintenancePageModule } from 'app/maintenance-page/maintenance-page.module';


enableProdMode();
platformBrowserDynamic().bootstrapModule(MaintenancePageModule);

import { Component, OnInit, } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { defaults } from 'environments/environment';

@Component({
    selector: 'app-maintenance-page',
    templateUrl: 'maintenance-page.component.html'
})
export class MaintenancePageComponent implements OnInit {

    public brand = defaults.brand;

    constructor(private titleService: Title) { }

    public ngOnInit() {
        this.titleService.setTitle(this.brand.title);
    }
}

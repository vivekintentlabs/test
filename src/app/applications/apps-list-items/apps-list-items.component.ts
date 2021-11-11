import { Component } from '@angular/core';
import { DisplayGroup } from 'app/entities/display-group';

@Component({
    selector: 'app-apps-list-items',
    templateUrl: 'apps-list-items.component.html'
})

export class AppsListItemsComponent {
    appModule = DisplayGroup.APP_MODULE;

    constructor() { }

}

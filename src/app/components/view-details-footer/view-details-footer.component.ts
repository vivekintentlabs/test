import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-view-details-footer',
    templateUrl: './view-details-footer.component.html'
})
export class ViewDetailsFooterComponent {
    @Input() url: string;
    @Input() filter = {};

    constructor() { }
}

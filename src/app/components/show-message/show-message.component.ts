import { Component,  OnChanges, Input, SimpleChanges, OnDestroy } from '@angular/core';
import { Utils } from '../../common/utils';

declare var $: any;

@Component({
    selector: 'app-show-message',
    templateUrl: './show-message.component.html'
})
export class ShowMessageComponent implements OnChanges, OnDestroy {
    @Input() message: string;
    @Input() triggershowMessage: false;

    constructor() { }

    ngOnChanges(changes: SimpleChanges) {
        if (this.message) {
            $('#show-message').modal('show');
        }
    }

    ngOnDestroy() {
        Utils.disposeModal('#show-message');
    }
}

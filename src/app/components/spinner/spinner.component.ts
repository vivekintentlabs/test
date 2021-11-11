import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-spinner',
    templateUrl: './spinner.component.html'
})
export class SpinnerComponent {
    public showSpinner = false;

    @Input('tableIsLoading')
    set tableIsLoading(value: Promise<any>) {
        if (value) {
            this.showSpinner = true;
            value.then(() => {
                this.showSpinner = false
            }).catch(err => {
                this.showSpinner = false
            });
        }
    }
    constructor() { }

}

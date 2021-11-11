import { Component, Input } from '@angular/core';
import { PageSpinnerService } from './page-spinner.service';
import { PageSpinner } from './page-spinner.model';

@Component({
    selector: 'app-page-spinner',
    templateUrl: './page-spinner.component.html',
    styleUrls: ['page-spinner.component.scss']
})
export class PageSpinnerComponent {
    show: boolean = false;
    text: string = null;
    @Input() size = 45;

    constructor(private pageSpinnerService: PageSpinnerService) {
        this.pageSpinnerService.spinnerObservable$.subscribe((pageSpinner: PageSpinner) => {
            this.display(pageSpinner.promise, pageSpinner.message);
        })
    }

    async display(promise: Promise<any>, text: string) {
        this.text = text;
        this.show = true;
        try {
            await promise;
        }
        catch(e) {}
        finally{
            this.show = false;
            this.text = null;
        }
    }
}

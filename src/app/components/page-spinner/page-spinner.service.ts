import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { PageSpinner } from './page-spinner.model';

@Injectable({
    providedIn: 'root'
})
export class PageSpinnerService {
    private spinnerObservable = new Subject<PageSpinner>();
    spinnerObservable$ = this.spinnerObservable.asObservable();

    constructor() {}

    display(promise: Promise<any>, message: string = '') {
        this.spinnerObservable.next(new PageSpinner({ message, promise }));
    }
}

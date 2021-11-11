import { Component, Input } from '@angular/core';

import { Constants } from 'app/common/constants';

@Component({
    selector: 'app-table-spinner',
    templateUrl: './table-spinner.component.html'
})
export class TableSpinnerComponent {
    public noDataInTable = Constants.noDataInTable;
    public totalLength: number;
    public showSpinner = false;
    public getTableRowsPromise: Promise<any>;

    // Promise getTableRows must return Promise<number> (total number of table rows)
    @Input('getTableRows') set getTableRows(loadData: Promise<number>) {
        if (loadData) {
            this.getTableRowsPromise = loadData;
            this.showSpinner = true;
            loadData.then((totalLength: number) => {
                this.totalLength = totalLength;
                this.showSpinner = false;
            }).catch(err => {
                this.showSpinner = false;
            });
        }
    }

    constructor() { }

}

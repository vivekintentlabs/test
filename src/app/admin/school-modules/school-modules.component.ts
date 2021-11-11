import { Component, Input, Output, EventEmitter } from '@angular/core';

import { ISchoolModule } from 'app/common/interfaces';
import { environment } from 'environments/environment';

import * as _ from 'lodash';

@Component({
    selector: 'app-school-modules',
    templateUrl: './school-modules.component.html'
})
export class SchoolModulesComponent {
    @Input() modules: ISchoolModule[];
    @Output() modulesChanged = new EventEmitter<ISchoolModule[]>();
    public brand = environment.brand;

    constructor() { }

    public widgetChanged(name: string, isChecked: boolean) {
        const changedModule = _.find(this.modules, m => m.name === name);

        if (changedModule) {
            changedModule.isEnabled = isChecked;
            this.modulesChanged.emit(this.modules);
        }
    }

}

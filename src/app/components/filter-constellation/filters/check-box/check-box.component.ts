import { Component, Input } from '@angular/core';
import { BaseFilterComponent } from '../base-filter/base-filter.component'
import { AppFilter } from '../../interfaces/app-filter';


@Component({
    selector: '[app-check-box]',
    templateUrl: './check-box.component.html',
    styleUrls: ['./check-box.component.scss']
})
export class CheckBoxComponent extends BaseFilterComponent {
    @Input() fieldConfig: AppFilter;

    onChange() {
        const outputValue = (this.fieldConfig.value) ? true : false;
        this.valueChanged.emit({ id: this.fieldConfig.id, value: outputValue, type: this.fieldConfig.type });
    }

}

import { Component, Input } from '@angular/core';
import { BaseFilterComponent } from '../base-filter/base-filter.component'
import { AppFilter } from '../../interfaces/app-filter';

@Component({
    selector: '[app-text-box]',
    templateUrl: './text-box.component.html',
    styleUrls: ['./text-box.component.scss']
})
export class TextBoxComponent extends BaseFilterComponent {
    @Input() fieldConfig: AppFilter;

    textChanged() {
        const outputValue = (this.fieldConfig.value === '') ? null : this.fieldConfig.value
        this.valueChanged.emit({ id: this.fieldConfig.id, value: outputValue, type: this.fieldConfig.type });
    }

}

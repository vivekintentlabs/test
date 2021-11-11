import { Component, Input } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { BaseFilterComponent } from '../base-filter/base-filter.component';
import { AppFilter } from '../../interfaces/app-filter';
import { Keys } from 'app/common/keys';

import * as _ from 'lodash';

@Component({
    selector: '[app-drop-down]',
    templateUrl: './drop-down.component.html',
    styleUrls: ['./drop-down.component.scss']
})
export class DropDownComponent extends BaseFilterComponent {
    @Input() fieldConfig: AppFilter;

    startingYear = Keys.startingYear;
    studentStartingYear = Keys.studentStartingYear;

    selectionChanged(matSelect: MatSelectChange) {
        let outputValue = null;

        if (_.includes(matSelect.value, 'all')) {
            outputValue = _.map(this.fieldConfig.options, option => option.id);
        } else if (_.includes(matSelect.value, 'clear')) {
            outputValue = [];
        } else {
            outputValue = (matSelect.value !== null)
                ? (_.isArray(matSelect.value) ? this.getIds(matSelect.value) : matSelect.value)
                : null;
        }

        this.fieldConfig.value = outputValue;
        this.emitData(this.fieldConfig);
    }

    private emitData(fieldConfig) {
        const textSelected = [];
        fieldConfig.options.forEach(option => {
            if (_.includes(fieldConfig.value, option.id)) {
                textSelected.push(option.value);
            }
        });

        this.valueChanged.emit({
            id: fieldConfig.id,
            value: fieldConfig.value,
            type: fieldConfig.type,
            multiple: fieldConfig.multiple,
            textValues: textSelected
        });
    }

    private getIds(value: number[]) {
        const outputValue = [];
        _.forEach(value, id => {
            (_.isArray(id)) ? outputValue.push(...id) : outputValue.push(id);
        });
        return outputValue;
    }

}

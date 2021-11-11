import { Component, OnInit, Optional } from '@angular/core';
import { StepperSelectionEvent, STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { ObjectLayoutWidget } from 'ngx-schema-form';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { StepperUIStateService } from './stepper-ui-state.service';

import * as _ from 'lodash';

@Component({
    selector: 'app-stepper-widget',
    templateUrl: './stepper-widget.html',
    styleUrls: ['./stepper-widget.scss'],
    providers: [
        { provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true } }
    ]
})
export class StepperWidget extends ObjectLayoutWidget implements OnInit {
    selectedIndex = 0;
    isPaymentStepDisabled = false;
    validationMapping = {};
    private unsubscribe = new Subject<void>();

    constructor(@Optional() protected uiState?: StepperUIStateService) {
        super();
    }

    ngOnInit() {
        const savedIndex = this.uiState?.selectedIndex;
        if (savedIndex >= 0 && savedIndex < this.schema.fieldsets?.length) {
            this.selectedIndex = savedIndex;
        }
        this.formProperty.valueChanges.pipe(takeUntil(this.unsubscribe)).subscribe(() => {
            _.forEach(this.formProperty.schema.fieldsets, fieldset => {
                const property = this.getProperty(fieldset.id);
                this.validationMapping[fieldset.id] = property.valid;
                if (fieldset.id === 'payment') {
                    this.isPaymentStepDisabled = this.checkIfPaymentStepShouldBeDisabled(this.validationMapping);
                }
            })
        });
    }

    getProperty(fieldId: string) {
        return this.formProperty.getProperty(fieldId);
    }

    /**
     * Disable payment step, if one of the other steps is not valid
     * @param { [key: string]: string } data
     * @returns {boolean}
     */
    checkIfPaymentStepShouldBeDisabled(data: { [key: string]: string }): boolean {
        let hasInvalidStep = false;
        _.forEach(data, (value, key) => {
            hasInvalidStep = hasInvalidStep || !(value || key === 'payment');
        });
        return hasInvalidStep;
    }

    onChange(selection: StepperSelectionEvent): void {
        selection.previouslySelectedStep.hasError = this.hasError(selection.previouslySelectedIndex);
        this.saveUIState(selection);
    }

    protected saveUIState(selection: StepperSelectionEvent) {
        if (this.uiState) {
            this.uiState.selectedIndex = selection.selectedIndex;
        }
    }

    private hasError(stepIndex: number): boolean {
        if (this.schema?.readOnly) return false;

        const fieldset = this.schema.fieldsets[stepIndex];
        for (const fieldId of fieldset.fields) {
            if (!this.getProperty(fieldId)?.valid) {
                return true;
            }
        }
        return false;
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

}

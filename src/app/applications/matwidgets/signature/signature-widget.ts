import { Component, OnDestroy } from '@angular/core';

import { ArrayWidget, PropertyGroup, IOneOf, FormProperty } from 'ngx-schema-form';
import { Subject } from 'rxjs';
import { pairwise, takeUntil } from 'rxjs/operators';
import { Constants } from 'app/common/constants';

import * as moment from 'moment';
import * as _ from 'lodash';

@Component({
    selector: 'signature-widget',
    templateUrl: './signature-widget.html'
})
export class MatSignatureWidget extends ArrayWidget implements OnDestroy {
    parentGuardians: PropertyGroup;
    relationshipTypes: IOneOf[];
    feeResponsibilities: IOneOf[];
    private unsubscribe = new Subject<void>();

    ngAfterViewInit() {
        super.ngAfterViewInit();
        const parent: PropertyGroup = this.formProperty.findRoot();
        const additionalInformation: FormProperty = parent.getProperty('signature/additionalInformation');
        const signature: FormProperty = parent.getProperty('signature');
        signature.schema.required = [];
        this.parentGuardians = parent.getProperty('parentGuardiansForm/parentGuardians');
        this.relationshipTypes = this.parentGuardians.schema.items.properties['li_relationshipToStudent']?.oneOf;
        this.feeResponsibilities = this.parentGuardians.schema.items.properties['li_feeResponsibility']?.oneOf;
        this.parentGuardians
            .valueChanges
            .pipe(pairwise(), takeUntil(this.unsubscribe))
            .subscribe(([prev, next]: [any[], any[]]) => {
                if (prev.length !== next.length && next.length > this.formProperty.value.length && this.formProperty.value.length > 0) {
                    if (prev.length < next.length) {
                        this.addItem();
                    }
                } else if (prev.length !== next.length && next.length < this.formProperty.value.length) {
                    const arr = _.difference(prev, next);
                    const diffIndex = _.findIndex(prev, item => _.isEqual(item, arr[0]));
                    super.removeItem(this.formProperty.properties[diffIndex]);
                }
            });

        this.formProperty
            .valueChanges
            .pipe(pairwise(), takeUntil(this.unsubscribe))
            .subscribe(([prev, next]: [any[], any[]]) => {
                let count = 0;
                _.forEach(next, (signature, index) => {
                    if (signature?.signatureCapture) count++;
                    if (!prev[index]?.['signatureCapture'] && signature?.signatureCapture && !signature?.signatureDate) {
                        const signatureDate: FormProperty = parent.getProperty(`signature/signatures/${index}/signatureDate`);
                        signatureDate.setValue(moment.utc().format(Constants.dateFormats.date), false);
                    }
                });
                const index = signature.schema.required.indexOf('additionalInformation', 0);
                if (count === 1 && index === -1) {
                    signature.schema.required.push('additionalInformation');
                } else if (count !== 1 && index > -1) {
                    signature.schema.required.splice(index, 1);
                }
            });
    }

    getDescription(val: any, items: IOneOf[]): string {
        return items.find(i => i.enum.includes(val))?.description;
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

}

import { Component, OnDestroy } from '@angular/core';
import { IAddressOption, IAddressOptions } from 'app/common/interfaces';

import { ObjectLayoutWidget } from 'ngx-schema-form';
import { distinctUntilChanged, pluck, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as _ from 'lodash';

@Component({
    selector: 'app-address-widget',
    templateUrl: '../object/object-widget.html'
})
export class AddressWidget extends ObjectLayoutWidget implements OnDestroy {
    private defaultHtmlClass = 'col-sm-4';
    private addressOptionsByCountry = new Map<string, IAddressOptions>();
    private unsubscribe = new Subject<void>();

    constructor() {
        super();
        this.addressOptionsByCountry.set('AUS', {
            sublocality: { label: '', isUsed: false },
            city: { label: 'Suburb', isUsed: true },
            state: { label: 'State', isUsed: true },
            otherState: { label: '', isUsed: false },
            postCode: { label: 'Postcode', isUsed: true }
        });
        this.addressOptionsByCountry.set('NZL', {
            sublocality: { label: 'Suburb', isUsed: true },
            city: { label: 'City/Town', isUsed: true },
            otherState: { label: '', isUsed: false },
            state: { label: 'Region', isUsed: false },
            postCode: { label: 'Postcode', isUsed: true }
        });
        this.addressOptionsByCountry.set('USA', {
            sublocality: { label: '', isUsed: false },
            city: { label: 'City', isUsed: true },
            state: { label: 'State', isUsed: true },
            otherState: { label: '', isUsed: false },
            postCode: { label: 'Zipcode', isUsed: true }
        });
        this.addressOptionsByCountry.set('GBR', {
            sublocality: { label: 'Locality', isUsed: true },
            city: { label: 'City/Town', isUsed: true },
            state: { label: 'County', isUsed: false },
            otherState: { label: '', isUsed: false },
            postCode: { label: 'Postal code', isUsed: true }
        });
        this.addressOptionsByCountry.set('CAN', {
            sublocality: { label: '', isUsed: false },
            city: { label: 'City/Town', isUsed: true },
            state: { label: 'Province/Territory', isUsed: true },
            otherState: { label: '', isUsed: false },
            postCode: { label: 'Postal code', isUsed: true }
        });
        this.addressOptionsByCountry.set('MYS', {
            sublocality: { label: 'Residential area', isUsed: true },
            city: { label: 'City', isUsed: true },
            state: { label: 'State', isUsed: true },
            otherState: { label: '', isUsed: false },
            postCode: { label: 'Postal code', isUsed: true }
        });
        this.addressOptionsByCountry.set('OTHER', {
            sublocality: { label: '', isUsed: false },
            city: { label: 'City/Town', isUsed: true },
            state: { label: '', isUsed: false },
            otherState: { label: 'State/Province', isUsed: true },
            postCode: { label: 'Postcode', isUsed: true }
        });
    }

    ngAfterViewInit() {
        super.ngAfterViewInit();
        this.setAddressOptions(this.formProperty.value.cou_country);
        this.formProperty
            .valueChanges
            .pipe(
                pluck('cou_country'),
                distinctUntilChanged(),
                takeUntil(this.unsubscribe)
            ).subscribe(this.setAddressOptions.bind(this));
    }

    getProperty(fieldId: string) {
        return this.formProperty.getProperty(fieldId);
    }

    getHtmlClass(fieldId: string) {
        const field = this.getProperty(fieldId);
        return field?.schema.widget.hasOwnProperty('htmlClass') ? field?.schema.widget.htmlClass : this.defaultHtmlClass;
    }

    inNewLine(fieldId: string): boolean {
        const field = this.getProperty(fieldId);
        return !!(field?.schema.widget.newLine);
    }

    isVisible(fieldId: string): boolean {
        return this.getProperty(fieldId)._visible;
    }

    setAddressOptions(countryId: string) {
        const addressOptions = this.addressOptionsByCountry.get(countryId) || this.addressOptionsByCountry.get('OTHER');
        _.forEach(this.formProperty.schema.properties, (property, key: string) => {
            const addressOption: IAddressOption = addressOptions[key];
            if (addressOption) {
                const field = this.getProperty(key);
                field.setVisible(addressOption.isUsed); // CAUTION: using private method
                if (addressOption.isUsed) {
                    property.title = addressOption.label;
                }
            } else if (key === `st_state_${countryId}`) {
                property.title = addressOptions.state.label;
            }
        });
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

}

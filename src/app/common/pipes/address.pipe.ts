import { Pipe, PipeTransform } from '@angular/core';

import { Address } from '../interfaces';

import { Country } from 'app/entities/country';
import { AdministrativeArea } from 'app/entities/administrative-area';

import * as _ from 'lodash';


@Pipe({
    name: 'address',
    pure: false
})
export class AddressPipe implements PipeTransform {
    transform(address: Address): string {
        const includeAddress = ['sublocality', 'city', 'administrativeArea'];
        const orderedAddress = [];
        if (address.administrativeArea) {
            const realState = new AdministrativeArea();
            realState.name = address.administrativeArea.name;
            address.administrativeArea = realState;
        }
        if (address.country) {
            const realCountry = new Country();
            realCountry.name = address.country.name;
            address.country = realCountry;
        }
        _.forEach(includeAddress, (field: string) => {
            const value = address[field];
            if (value) {
                orderedAddress.push(value);
            }
        });
        return orderedAddress.join(', ');
    }
}

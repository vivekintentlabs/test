import { Pipe, PipeTransform } from '@angular/core';
import { LocaleService } from 'app/services/locale.service';
import { Constants } from '../constants';

@Pipe({
  name: 'localeDate',
  pure: false
})
export class LocaleDatePipe implements PipeTransform {

    constructor(private localeService: LocaleService) { }

    transform(value: any, format: string = Constants.localeFormats.dateDelimiter, countryId?: string): any {
        return this.localeService.transformLocaleDate(value, format, countryId);
    }
}

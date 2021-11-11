import { Pipe, PipeTransform } from '@angular/core';
import { LocaleService } from 'app/services/locale.service';
import { Constants } from '../constants';

/**
 * Date pipe for gettig correct date calculated with school timezone
 * Usage: dateTime | localDate: 'Australia/Sydney' : 'dateTime'
 *
 * dateTime: string (DateTimeUTC)
 * timeZone: string ('Australia/Sydney')
 * format: string ('dateTime')
 */
@Pipe({ name: 'localDate' })
export class LocalDatePipe implements PipeTransform {

    constructor(private localeService: LocaleService) { }

    transform(dateTime: string, timeZone: string, format: string = Constants.localeFormats.dateTime): string {
        return this.localeService.getTransformToLocal(dateTime, timeZone, format);
    }
}

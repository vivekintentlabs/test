import { Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';
import { UserInfo } from 'app/entities/userInfo';
import { Utils } from 'app/common/utils';
import { IDateFormats } from 'app/common/interfaces';
import { Constants } from 'app/common/constants';
import * as _ from 'lodash';
import * as moment from 'moment';
import 'moment-timezone';

@Injectable({
    providedIn: 'root',
})
export class LocaleService {

    private datePatternsByLocale = new Map<string, IDateFormats>();
    private countryLocaleTags = {
        AUS: 'en-AU',
        NZL: 'en-NZ',
        USA: 'en-US',
        CAN: 'en-CA',
        MYS: 'ms',
    };
    constructor() {
        this.datePatternsByLocale.set('en-AU',
            {
                dateDelimiter: 'dd/MM/yyyy', // DD/MM/YYYY localePipe
                dateDelimiterTime: 'dd/MM/yyyy HH:mm', // DD/MM/YYYY HH:mm localePipe
                dateDelimiterTimeShort: 'DD/MM/YYYY hh:mm A', // DD/MM/YYYY hh:mm a localPipe
                dateTime: 'DD/MM/YYYY HH:mm:ss', // DD/MM/YYYY HH:mm:ss localPipe
                dateTimeShort: 'DD/MM/YYYY HH:mm', // DD/MM/YYYY HH:mm localPipe
                date: 'DD/MM/YYYY', // DD/MM/YYYY localPipe
                longDate: 'dd MMMM y', // DD Month YYYY localePipe
                longDateWithComma: 'dd MMMM, y', // DD Month, YYYY localePipe
                shortDate: 'dd MMM' // DD Month localePipe
            }
        );
        this.datePatternsByLocale.set('en-NZ',
            {
                dateDelimiter: 'dd/MM/yyyy', // DD/MM/YYYY
                dateDelimiterTime: 'dd/MM/yyyy HH:mm', // DD/MM/YYYY HH:mm
                dateDelimiterTimeShort: 'DD/MM/YYYY hh:mm A', // DD/MM/YYYY hh:mm
                dateTime: 'DD/MM/YYYY HH:mm:ss', // DD/MM/YYYY HH:mm:ss
                dateTimeShort: 'DD/MM/YYYY HH:mm', // DD/MM/YYYY HH:mm localPipe
                date: 'DD/MM/YYYY', // DD/MM/YYYY
                longDate: 'dd MMMM y', // DD Month YYYY
                longDateWithComma: 'dd MMMM, y', // DD Month, YYYY
                shortDate: 'dd MMM' // DD Month
            }
        );
        this.datePatternsByLocale.set('en-US',
            {
                dateDelimiter: 'MM/dd/yyyy', // MM/DD/YYYY
                dateDelimiterTime: 'MM/dd/yyyy HH:mm', // MM/DD/YYYY HH:mm
                dateDelimiterTimeShort: 'MM/DD/YYYY hh:mm A', // MM/DD/YYYY hh:mm
                dateTime: 'MM/DD/YYYY HH:mm:ss', // MM/DD/YYYY HH:mm:ss
                dateTimeShort: 'DD/MM/YYYY HH:mm', // DD/MM/YYYY HH:mm
                date: 'MM/DD/YYYY', // MM/DD/YYYY
                longDate: 'MMMM dd y', // Month DD YYYY
                longDateWithComma: 'MMMM dd, y', // Month DD, YYYY
                shortDate: 'MMM dd' // Month DD
            }
        );
        this.datePatternsByLocale.set('en-CA',
            {
                dateDelimiter: 'yyyy/MM/dd', // yyyy/MM/dd
                dateDelimiterTime: 'yyyy/MM/dd HH:mm', // yyyy/MM/dd HH:mm
                dateDelimiterTimeShort: 'YYYY/MM/DD hh:mm A', // YYYY/MM/DD hh:mm A
                dateTime: 'YYYY/MM/DD HH:mm:ss', // YYYY/MM/DD HH:mm:ss
                dateTimeShort: 'YYYY/DD/MM HH:mm', // YYYY/DD/MM HH:mm' localPipe
                date: 'YYYY/MM/DD', // YYYY/MM/DD
                longDate: 'MMMM dd y', // Month DD YYYY
                longDateWithComma: 'MMMM dd, y', // Month DD, YYYY
                shortDate: 'MMM dd' // Month DD
            }
        );
        this.datePatternsByLocale.set('ms',
            {
                dateDelimiter: 'dd/MM/yyyy', // DD/MM/YYYY
                dateDelimiterTime: 'dd/MM/yyyy HH:mm', // DD/MM/YYYY HH:mm
                dateDelimiterTimeShort: 'DD/MM/YYYY hh:mm A', // DD/MM/YYYY hh:mm A
                dateTime: 'DD/MM/YYYY HH:mm:ss', // DD/MM/YYYY HH:mm:ss
                dateTimeShort: 'DD/MM/YYYY HH:mm', // DD/MM/YYYY HH:mm
                date: 'DD/MM/YYYY', // DD/MM/YYYY
                longDate: 'dd MMMM y', // DD Month YYYY
                longDateWithComma: 'dd MMMM, y', // DD Month, YYYY
                shortDate: 'dd MMM' // DD Month
            }
        );
    }

    public getCurrentLocale(countryId?: string): string {
        const userInfo: UserInfo = Utils.getUserInfoFromToken();
        return userInfo ? userInfo.locale : this.getLocaleByCountryId(countryId);
    }

    public getFormat(format: string): string {
        return this.getFormatForLocale(format, this.getCurrentLocale());
    }

    public getTransformToLocal(dateTime: string | number, timeZone: string, format: string) {
        format = this.getFormat(format);
        const dateTimeMoment = moment(dateTime).tz(timeZone);
        return dateTimeMoment.isValid() ? dateTimeMoment.format(format) : '';
    }

    public getTransformToLocalDate(dateTime: string, timeZone: string, format: string) {
        const dateString = this.getTransformToLocal(dateTime, timeZone, format);
        format = this.getFormat(format);
        return moment(dateString, format).toDate();
    }

    public transformLocaleDate(value: any, format: string, countryId?: string) {
        const locale: string = this.getCurrentLocale(countryId);
        const datePipe: DatePipe = new DatePipe(locale);
        format = this.getFormatForLocale(format, locale);
        return datePipe.transform(value, format);
    }

    public getFormatForLocale(format: string, locale: string): string {
        const pattern: IDateFormats = this.datePatternsByLocale.get(locale);
        return _.get(pattern, format);
    }

    public getLocaleByCountryId(countryId: string): string {
        return _.get(this.countryLocaleTags, countryId || Constants.locale);
    }
}

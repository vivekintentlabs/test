import { Pipe, PipeTransform } from '@angular/core';
import { Constants } from '../constants';
import * as moment from 'moment';
import * as _ from 'lodash';

/**
 * Time pipe for formating
 * Usage: value | time: format
 * format: short|long
 */
@Pipe({ name: 'time', pure: false })
export class TimePipe implements PipeTransform {
    transform(time: string, format: string): string {
        const timeMoment = moment(time, Constants.dateFormats.timeShort);
        const timeStr = timeMoment.isValid() ? timeMoment.format(Constants.dateFormats.timeShort) : null;
        if (timeStr !== null) {
            let timeFormatted = '';
            switch (format) {
                case 'long':
                    timeFormatted = (!(_.includes(_.toLower(timeStr), 'am') || _.includes(_.toLower(timeStr), 'pm'))) ? timeStr : moment(timeStr, Constants.dateFormats.time, Constants.dateFormats.timeShort).format(Constants.dateFormats.time);
                    break;
                case 'short':
                    timeFormatted = (!(_.includes(_.toLower(timeStr), 'am') || _.includes(_.toLower(timeStr), 'pm'))) ? moment(timeStr, Constants.dateFormats.time).format(Constants.dateFormats.timeShort) : timeStr;
                    break;
                default:
                    timeFormatted = time;
                    break;
            }
            return timeFormatted;
        } else {
            return null;
        }
    }
}

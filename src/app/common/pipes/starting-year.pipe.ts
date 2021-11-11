import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';
@Pipe({
    name: 'startingYear',
    pure: true
})
export class StartingYearPipe implements PipeTransform {

    transform(startingYear: number | null, startingMonth: number, isListView = false): string {
        let startingYearFormatted = startingYear ? startingYear.toString() : (isListView ? '' : 'Unknown');
        // Intentional: for January and February use #### display pattern (2021), for the other months #### - #### (2021 - 2022)
        if (startingMonth > 1) {
            const currentMonth: number = moment().month();

            startingYearFormatted = startingYear ? `${startingYear} - ${startingYear + 1}` : startingYearFormatted;

        }
        return startingYearFormatted;
    }
}

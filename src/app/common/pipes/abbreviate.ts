import { Pipe, PipeTransform } from '@angular/core';
import { T } from '../t';

/**
 * Abbreviate pipe for abbreviating sinrings
 * Usage: value | abbrev
 */
@Pipe({ name: 'abbr', pure: false })
export class AbbreviatePipe implements PipeTransform {
    private readonly collection = [
        { value: 'Year 1', abbr: 'Yr1' },
        { value: 'Year 2', abbr: 'Yr2' },
        { value: 'Year 3', abbr: 'Yr3' },
        { value: 'Year 4', abbr: 'Yr4' },
        { value: 'Year 5', abbr: 'Yr5' },
        { value: 'Year 6', abbr: 'Yr6' },
        { value: 'Year 7', abbr: 'Yr7' },
        { value: 'Year 8', abbr: 'Yr8' },
        { value: 'Year 9', abbr: 'Yr9' },
        { value: 'Year 10', abbr: 'Yr10' },
        { value: 'Year 11', abbr: 'Yr11' },
        { value: 'Year 12', abbr: 'Yr12' },
        { value: 'Prep, Foundation, Reception', abbr: 'Pre...' },
        { value: '1st Grade', abbr: 'Gr1' },
        { value: '2nd Grade', abbr: 'Gr2' },
        { value: '3rd Grade', abbr: 'Gr3' },
        { value: '4th Grade', abbr: 'Gr4' },
        { value: '5th Grade', abbr: 'Gr5' },
        { value: '6th Grade', abbr: 'Gr6' },
        { value: '7th Grade', abbr: 'Gr7' },
        { value: '8th Grade', abbr: 'Gr8' },
        { value: '9th Grade', abbr: 'Gr9' },
        { value: '10th Grade', abbr: 'Gr10' },
        { value: '11th Grade', abbr: 'Gr11' },
        { value: '12th Grade', abbr: 'Gr12' },
        { value: 'Kindergarten', abbr: 'K' },
        { value: 'Not at School', abbr: 'NS' },
        { value: 'Early Years / Kinder', abbr: 'EY' },
        { value: 'Not Applicable', abbr: 'NA' },
        { value: T.unknown, abbr: 'Un.' },
        { value: 'Other', abbr: 'Ot.' },
    ];

    transform(value: string): string {
        if (!value) {
            return null;
        }
        const result = this.collection.find(i => i.value === value);
        return (result) ? result.abbr : value;
    }
}

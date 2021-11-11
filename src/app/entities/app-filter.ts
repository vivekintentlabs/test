import { FilterValue } from '../components/filter-constellation/interfaces/filter-value';

/**
 * @param id string
 * @param name
 * @param type
 * @param mandatory
 * @param display
 * @param multiple if it is select list
 * @param options array of options for select list
 * @param width field width, value range is 1-12
 */
export class AppFilter {

    constructor(
        public id: string,
        public name: string,
        public type: number,
        public mandatory: boolean,
        public display: boolean,
        public multiple: boolean,
        public options: FilterValue[],
        public section: string = 'Other',
        public width: number = 2) {
    }

}

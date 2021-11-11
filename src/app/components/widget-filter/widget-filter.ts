import { Student } from 'app/entities/student';
import { FilterValue } from 'app/components/filter-constellation/interfaces/filter-value';
import { Keys } from 'app/common/keys';

import * as _ from 'lodash';

type filterFP = (students: Student[], filterValue: FilterValue) => Student[];

export interface FilteredStudentsOutput {
    filteredStudents: Student[];
    allFilteredStudents: Student[];
};

export class WidgetFilter {
    private filterValues: Map<string, filterFP> = new Map<string, filterFP>();

    constructor() {
        this.filterValues.set(Keys.startingYear, this.filterByStartingYear.bind(this));
        this.filterValues.set(Keys.schoolIntakeYearId, this.filterBySchoolIntakeYearId.bind(this));
        this.filterValues.set(Keys.studentStatusStageId, this.filterByStage.bind(this));
        this.filterValues.set(Keys.studentStatusId, this.filterByStatusId.bind(this));
    }

    public filter(students: Student[], values: FilterValue[]): FilteredStudentsOutput {
        const allFilteredStudents: Student[] = _.cloneDeep(students);
        const filteredStudents: Student[] = _.clone(allFilteredStudents);

        _.forEach(values, (value) => {
            this.filterValues.get(value.id)(filteredStudents, value);
        });
        return { filteredStudents, allFilteredStudents};
    }

    private filterByStartingYear(students: Student[], filterValue: FilterValue) {
        this.stripStudents(students, filterValue);
    }

    private filterBySchoolIntakeYearId(students: Student[], filterValue: FilterValue) {
        this.stripStudents(students, filterValue);
    }

    private filterByStage(students: Student[], filterValue: FilterValue) {
        this.stripStudents(students, filterValue);
    }

    private filterByStatusId(students: Student[], filterValue: FilterValue) {
        this.stripStudents(students, filterValue);
    }


    private stripStudents(students: Student[], filter: FilterValue, isBoolean = false) {
        let ids = [];
        if (filter.multiple) {
            ids = _.map(filter.value, i => (i === 0) ? null : i);
        } else {
            ids.push((filter.value === 0) ? null : filter.value);
        }
        if (ids.length > 0) {
            _.remove(students, student => !_.includes(ids, (isBoolean ? Boolean(_.get(student, filter.id)) : _.get(student, filter.id)) ));
        }
    }

}

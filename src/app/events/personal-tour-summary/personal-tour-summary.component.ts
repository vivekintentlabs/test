import { Component, OnChanges, SimpleChanges, Input } from '@angular/core';

import { PersonalTour } from '../../entities/personal-tour';
import { PersonalTourAttendanceUtils } from '../../common/attendance-utils';

import * as moment from 'moment';
import * as _ from 'lodash';

interface IPersonalTourSummary {
    status: string;
    families: number;
    attending: number;
    students: number;
    interest: number;
    applicant: number;
    enroled: number;
    checkIns: number;
    percentageCheckIns: number;
}

@Component({
    selector: 'app-personal-tour-summary',
    templateUrl: 'personal-tour-summary.component.html'
})
export class PersonalTourSummaryComponent implements OnChanges {
    @Input() allPersonalTours: Array<PersonalTour> = [];
    public personalTours: Array<IPersonalTourSummary> = [];
    private personalTourAttendanceUtils: PersonalTourAttendanceUtils;

    ngOnChanges(changes: SimpleChanges) {
        this.personalTourAttendanceUtils = new PersonalTourAttendanceUtils();

        _.forEach(this.allPersonalTours, (pt: PersonalTour) => {
            const counters = this.personalTourAttendanceUtils.getEventAttendance(pt.personalTourBookings);
            pt.students = counters.studentsCount;
            pt.families = counters.familiesCount;
            pt.attending = counters.totalAttendees;
            pt.studentsApplicant = counters.studentsApplicant;
            pt.studentsInterest = counters.studentsInterest;
            pt.studentsEnroled = counters.studentsEnroled;
            pt.checkinsPercentage = counters.checkinsPercentage;
            pt.checkins = counters.checkedInCount;
        });
        this.personalTours = [];

        let completedPTs: Array<PersonalTour> = _.filter(this.allPersonalTours, (pt: PersonalTour) => moment().isAfter(pt.date));
        const sumAtt = _.sumBy(completedPTs, 'attending');
        const sumCheck = _.sumBy(completedPTs, 'checkins');
        this.personalTours.push({
            status: 'Completed', families: _.sumBy(completedPTs, 'families'), attending: sumAtt,
            students: _.sumBy(completedPTs, 'students'), interest: _.sumBy(completedPTs, 'studentsInterest'), applicant: _.sumBy(completedPTs, 'studentsApplicant'),
            enroled: _.sumBy(completedPTs, 'studentsEnroled'), checkIns: sumCheck, percentageCheckIns: Math.round((sumCheck/sumAtt)*100) || 0
        });

        let upcomingPTs: Array<PersonalTour> = _.filter(this.allPersonalTours, (pt: PersonalTour) => moment().isBefore(pt.date));
        const eventSumAtt = _.sumBy(upcomingPTs, 'attending');
        const eventSumCheck = _.sumBy(upcomingPTs, 'checkins');
        this.personalTours.push({
            status: 'Upcoming', families: _.sumBy(upcomingPTs, 'families'), attending: eventSumAtt,
            students: _.sumBy(upcomingPTs, 'students'), interest: _.sumBy(upcomingPTs, 'studentsInterest'), applicant: _.sumBy(upcomingPTs, 'studentsApplicant'),
            enroled: _.sumBy(upcomingPTs, 'studentsEnroled'), checkIns: eventSumCheck, percentageCheckIns: Math.round((eventSumCheck / eventSumAtt) * 100) || 0,
        });
    }

    public isFinite(number)
    {
        return isFinite(number);
    }

}

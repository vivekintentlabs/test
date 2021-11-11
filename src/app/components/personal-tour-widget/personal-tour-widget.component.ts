import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup} from '@angular/forms';
import { Router } from '@angular/router';

import { HttpService } from '../../services/http.service';
import { ListenerService } from '../../services/listener.service';

import { PersonalTour } from '../../entities/personal-tour';
import { Contact } from '../../entities/contact';
import { Student } from '../../entities/student';
import { UserInfo } from '../../entities/userInfo';
import { Campus } from '../../entities/campus';

import { IPersonalTour } from '../../common/interfaces';
import { Utils } from '../../common/utils';
import { Constants } from '../../common/constants';
import { PersonalTourAttendanceUtils } from '../../common/attendance-utils';

import { Subscription } from 'rxjs';

import * as moment from 'moment';
import * as _ from 'lodash';

declare var $: any;
@Component({
    selector: 'app-personal-tour-widget',
    templateUrl: 'personal-tour-widget.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['personal-tour-widget.component.scss']
})
export class PersonalTourWidgetComponent implements OnInit, OnDestroy {
    campusId: number | string;
    ptWidgetForm: FormGroup;
    loaded = false;
    years: Array<Object> = [];
    allPersonalTours: Array<IPersonalTour> = [];
    personalTours: Array<IPersonalTour> = [];
    lastFivePersonalTours: Array<IPersonalTour> = null;
    startYear: number;
    countPersonalTours = 0;
    countStudents = 0;
    countFamilies = 0;
    countAttending = 0;
    countRSVP = 0;
    userInfo: UserInfo = null;
    dash = '- -';
    subscrCampusList: Subscription;
    dateDelimiter = Constants.localeFormats.dateDelimiter;
    url = '/events/personal-tour';
    private campuses: Array<Campus>;
    private personalTourAttendanceUtils: PersonalTourAttendanceUtils;

    constructor (
        private fb: FormBuilder,
        private httpService: HttpService,
        private router: Router,
        private listenerService: ListenerService
    ) {
        this.subscrCampusList = this.listenerService.campusListStatus().subscribe(() => { this.campusChange(); });
    }

    public ngOnInit() {
        this.personalTourAttendanceUtils = new PersonalTourAttendanceUtils();
        this.userInfo = Utils.getUserInfoFromToken();
        this.campusId = (this.userInfo.campusId === null) ? 'all' : this.userInfo.campusId;
        return this.httpService.getAuth('personal-tour').then((res: any) => {
            this.campuses = res.campuses;
            _.forEach(res.personalTours, (pt: PersonalTour) => {
                const date: moment.Moment = moment(pt.date);
                const attendees = this.personalTourAttendanceUtils.getEventAttendance(pt.personalTourBookings);
                this.allPersonalTours.push({
                    year: date.year(),
                    date: pt.date,
                    time: moment(pt.time, Constants.dateFormats.time).format(Constants.dateFormats.hourMinutes),
                    contact: this.getContact(pt),
                    families: attendees.familiesCount,
                    personalTour: pt,
                    campusId: pt.campusId
                });
            });

            this.startYear = moment().year();
            this.createForm();
            this.campusChanged(this.campusId);
        });
    }

    ngOnDestroy() {
        this.subscrCampusList.unsubscribe();
    }

    campusChange() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.campusId = (this.userInfo.campusId === null) ? 'all' : this.userInfo.campusId;
        this.campusChanged(this.campusId);
    }

    private getContact(personalTour: PersonalTour) {
        let contact = '';
        if (personalTour.personalTourBookings.length > 1) {
            contact = 'Multiple Families'
        } else if (personalTour.personalTourBookings[0] && personalTour.personalTourBookings[0].contacts.length !== 0) {
            _.forEach(personalTour.personalTourBookings[0].students, (student: Student) => {
                // tslint:disable-next-line:max-line-length
                let temp: Contact = _.find(personalTour.personalTourBookings[0].contacts, (c: Contact) => student.contactRelationships[0].contact.id === c.id);
                if (temp !== undefined) {
                    return contact =  temp.firstName + ' ' + temp.lastName;
                } else {
                    temp = personalTour.personalTourBookings[0].contacts[0];
                    return contact = temp.firstName + ' ' + temp.lastName;
                }
            });
        }
        return contact
    }

    private createForm() {
        this.ptWidgetForm = this.fb.group({ year: [this.startYear] });
        this.loaded = true;
    }

    private calculate() {
        const personalTours = _.filter(this.personalTours, (p: IPersonalTour) => p.year === this.startYear);
        this.countPersonalTours = personalTours.length;
        this.countStudents = 0;
        this.countFamilies = 0;
        this.countAttending = 0;
        this.countRSVP = 0;
        _.forEach(personalTours, (item: IPersonalTour) => {
            const counters = this.personalTourAttendanceUtils.getEventAttendance(item.personalTour.personalTourBookings);
            this.countStudents += counters.studentsCount;
            this.countFamilies += counters.familiesCount;
            this.countRSVP += counters.totalAttendees;
            this.countAttending += counters.checkedInCount;
        })
    }

    editPersonalTour(personalTourId: number) {
        this.router.navigate(['/events/edit-personal-tour', { personalTourId: personalTourId }]);
    }

    campusChanged(campusId: number | string) {
        if (campusId === 'all') {
            this.personalTours = this.allPersonalTours;
        } else {
            this.personalTours = _.filter(this.allPersonalTours, (item: IPersonalTour) => item.personalTour.campusId === campusId)
        }
        this.calculate();
        const filteredPersonalTours = _.filter(this.personalTours, (p: IPersonalTour) => p.year === this.startYear);
        const allFutureTours = Utils.filterFutureEventPersonalTours(filteredPersonalTours, this.campuses) as Array<IPersonalTour>;
        const orderedFutureTours = _.orderBy(allFutureTours, ['date', 'time'], ['asc']);
        this.lastFivePersonalTours = _.take(orderedFutureTours, 5);
    }

}

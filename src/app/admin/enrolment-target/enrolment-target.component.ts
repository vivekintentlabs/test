import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { HttpService } from 'app/services/http.service';
import { SchoolQuery } from 'app/state/school';

import { Campus } from 'app/entities/campus';
import { IntakeClassYear } from 'app/entities/intakeClassYear';
import { EnrolmentTarget } from 'app/entities/enrolmentTarget';
import { YearLevel } from 'app/entities/year-level';
import { YearLevelList } from 'app/entities/year-level-list';
import { UserInfo } from 'app/entities/userInfo';

import { Utils } from 'app/common/utils';
import { Constants } from 'app/common/constants';
import { FormUtils } from 'app/common/form-utils';
import { list_id } from 'app/common/enums';

import * as _ from 'lodash';
import * as moment from 'moment';
import Swal from 'sweetalert2';

declare var $: any;

@Component({
    selector: 'app-enrolment-target',
    templateUrl: './enrolment-target.component.html',
    styleUrls: ['./enrolment-target.component.scss']
})
export class EnrolmentTargetComponent implements OnInit, OnDestroy {
    enTargetForm: FormGroup;
    specificCampusId: number;
    title = 'Add';
    private userInfo: UserInfo = null;
    ListId = list_id; // allow access to enum in html
    noItemSelected = Constants.noItemSelected; // show constant string in html\
    dateDelimiter = Constants.localeFormats.dateDelimiter;
    IntakeClasses: number[] = Utils.getStartingYears(moment.utc().subtract(5, 'years').year());
    private yearLevelList: YearLevelList;
    intakeYearLevels: YearLevel[] = [];
    intakeYearLevelsIds: number[] = [];
    enrolmentTargets: EnrolmentTarget[] = [];
    intakeClassYears: IntakeClassYear[] = [];
    allIntakeClassYears: IntakeClassYear[] = [];
    formStruct: Object[];
    campuses: Campus[] = [];
    minDate: Date;
    maxDate: Date;
    minYear: number;
    maxYear: number;
    startingMonth: number;

    promiseForBtn: Promise<any>;
    private unsubscribe = new Subject();

    constructor(
        private fb: FormBuilder,
        private httpService: HttpService,
        private schoolQuery: SchoolQuery,
    ) {
    }

    public ngOnInit() {
        this.minYear = _.min(this.IntakeClasses);
        this.maxYear = _.max(this.IntakeClasses);
        this.minDate = new Date(this.minYear, 0, 1);
        this.maxDate = new Date(this.maxYear, 11, 31);
        this.userInfo = Utils.getUserInfoFromToken();
        this.schoolQuery.startingMonth$.pipe(takeUntil(this.unsubscribe)).subscribe((i: number) => this.startingMonth = i);
        this.getEnrolmentTargets().then(() => {
            const userCampus = _.find(this.campuses, c => c.id === this.userInfo.specificCampusId);
            this.specificCampusId = (userCampus) ? userCampus.id : this.userInfo.mainCampusId;
            this.intakeYearLevels = this.yearLevelList.getIntakeYearLevels(this.specificCampusId);
            this.intakeClassYears = _.filter(this.allIntakeClassYears, (item: IntakeClassYear) => item.campusId === this.specificCampusId);
            this.initET();
        });
    }

    getEnrolmentTargets() {
        return this.httpService.getAuth('enrolment-targets').then((data: any) => {
            this.campuses = _.filter(data.campuses, (item: Campus) => item.campusType !== Campus.CAMPUS_TYPE_UNDECIDED);
            this.campuses = _.orderBy(this.campuses, ['sequence']);
            if (data.yearLevels) {
                this.intakeYearLevels = [];
                this.yearLevelList = new YearLevelList(data.yearLevels || []);
            }
            if (data.intakeClassYears) {
                this.intakeClassYears = [];
                this.allIntakeClassYears = data.intakeClassYears;
            }
        });
    }

    initET() {
        const existingIntakeClasses: number[] = [];
        _.forEach(this.intakeClassYears, (intakeClassYear: IntakeClassYear) => {
            existingIntakeClasses.push(intakeClassYear.intakeClass);
            const temp: EnrolmentTarget[] = [];

            _.forEach(this.intakeYearLevels, (intakeYearLevel: YearLevel) => {
                let item = _.find(intakeClassYear.enrolmentTargets, (enT) => (
                    enT.intakeYearId && enT.intakeYearId === intakeYearLevel.id
                ));
                if (!item) {
                    item = { intakeYearId: intakeYearLevel.id, intakeYear: intakeYearLevel } as EnrolmentTarget;
                }
                temp.push(item);
            });
            intakeClassYear.enrolmentTargets = temp;
        });
    }

    campusChanged(specificCampusId: number) {
        this.userInfo = Utils.getUserInfoFromToken();
        if (this.userInfo.specificCampusId !== specificCampusId) {
            this.httpService.postAuth('users/set-specific-campus', { specificCampusId }).then(() => {
                this.specificCampusId = specificCampusId;
                this.intakeYearLevels = this.yearLevelList.getIntakeYearLevels(this.specificCampusId);
                this.intakeClassYears = _.filter(this.allIntakeClassYears, i => i.campusId === this.specificCampusId);
                this.initET();
            }).catch((err) => {
                console.log(err);
            });
        } else {
            console.log('campus is already chosen');
        }
    }

    editIntakeClass(id: number) {
        let intakeYear: IntakeClassYear = null;
        if (id) {
            this.title = 'Edit';
            intakeYear = _.find(this.intakeClassYears, item => item.id === id);
            this.enrolmentTargets = intakeYear.enrolmentTargets;
            this.intakeClassChanged(intakeYear.intakeClass, id);
        } else {
            this.title = 'Add';
        }
        this.createEnTargetForm(intakeYear);
        $('#enrolmentTargetModal').modal('show');
    }

    private createEnTargetForm(intakeClassYear: IntakeClassYear) {
        const id = (intakeClassYear) ? intakeClassYear.id : null;
        const formJSON = {
            id: [(intakeClassYear) ? intakeClassYear.id : null],
            intakeClass: [(intakeClassYear) ? intakeClassYear.intakeClass : '', Validators.compose([
                Validators.required, Validators.pattern(/^([0-9]{4})+$/), this.uniqueValidator.bind(this, id)
            ])],
            campusId: [this.specificCampusId],
            startDate: [
                (intakeClassYear && intakeClassYear.startDate)
                    ? moment.utc(intakeClassYear.startDate, Constants.dateFormats.date) : null
            ]
        };

        this.formStruct = FormUtils.addEnrolmentTargetsToForm(intakeClassYear, formJSON, this.intakeYearLevels);
        this.enTargetForm = this.fb.group(formJSON);
    }

    // Custom validator for unique field
    private uniqueValidator(id: number, field: FormControl) {
        try {
            return !_.find(_.filter(this.intakeClassYears, i => i.id !== id), (item) => item.intakeClass === field.value) ? null : {
                intakeClass: {
                    valid: false
                }
            };
        } catch (e) {
            console.log(e);
        }
    }

    onSubmit() {
        this.submit();
    }

    private submit() {
        this.resetStartDate();
        const data = _.cloneDeep(this.enTargetForm.value);
        if (this.enTargetForm.value.startDate) {
            data['startDate'] = Utils.formatDate(this.enTargetForm.controls.startDate.value);
        }
        return this.promiseForBtn = this.httpService.postAuth('intake-class-years/update', data).then(() => {
            $('#enrolmentTargetModal').modal('hide');
            Utils.showSuccessNotification();
            return this.getEnrolmentTargets().then(() => {
                this.intakeYearLevels = this.yearLevelList.getIntakeYearLevels(this.specificCampusId)
                this.intakeClassYears = _.filter(this.allIntakeClassYears, i => i.campusId === this.specificCampusId);
                this.initET();
                return Promise.resolve();
            });
        }).catch((e) => {
            console.log(e);
            return Promise.reject();
        });
    }

    public cancel() {
        this.resetStartDate();
    }

    private resetStartDate() {
        this.minDate = new Date(this.minYear, 0, 1);
        this.maxDate = new Date(this.maxYear, 11, 31);
    }

    deleteIntakeClass(id: number) {
        Swal.fire({
            title: 'Are you sure?',
            text: 'You won\'t be able to revert this!',
            type: 'warning',
            showCancelButton: true,
            confirmButtonClass: 'btn btn-delete',
            cancelButtonClass: 'btn btn-cancel',
            confirmButtonText: 'Yes, delete it!',
            buttonsStyling: false
        }).then((result) => {
            if (result && result.value) {
                this.httpService.getAuth('intake-class-years/delete/' + id).then(() => {
                    this.getEnrolmentTargets().then(() => {
                        this.intakeYearLevels = this.yearLevelList.getIntakeYearLevels(this.specificCampusId);
                        this.intakeClassYears = _.filter(this.allIntakeClassYears, i => i.campusId === this.specificCampusId);
                        this.initET();
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Item has been deleted.',
                            type: 'success',
                            confirmButtonClass: 'btn btn-success',
                            buttonsStyling: false
                        });
                    });
                }).catch((e) => {
                    console.log(e);
                });
            }
        });
    }

    public intakeClassChanged(event: number, id: number) {
        this.minDate = new Date(event, 0, 1);
        this.maxDate = new Date(event, 11, 31);
        if (!id) {
            this.enTargetForm.controls.startDate.setValue(new Date(event, this.startingMonth , 1));
        } 
    }

    public dateChanged(date) {
        const year = date ? moment(date, Constants.dateFormats.date).year() : null;
        const intakeYear = _.find(this.IntakeClasses, item => item === year);
        this.enTargetForm.controls.intakeClass.setValue(intakeYear);
    }

    ngOnDestroy() {
        Utils.disposeModal('#enrolmentTargetModal');
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }
}

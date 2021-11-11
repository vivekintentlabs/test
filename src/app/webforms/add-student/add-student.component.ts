import { Component, OnInit, OnChanges, OnDestroy, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';

import { Constants } from 'app/common/constants';
import { Utils } from 'app/common/utils';
import { FormUtils } from 'app/common/form-utils';
import { IFieldSetting } from 'app/common/interfaces';
import { Keys } from 'app/common/keys';
import { SubmittedApplication, list_id } from 'app/common/enums';

import { YearLevel } from 'app/entities/year-level';
import { YearLevelList } from 'app/entities/year-level-list';
import { Campus } from 'app/entities/campus';
import { CurrentSchool } from 'app/entities/current-school';
import { School } from 'app/entities/school';
import { ListItem } from 'app/entities/list-item';
import { Country } from 'app/entities/country';
import { Translation } from 'app/entities/translation';

import { Subscription } from 'rxjs';
import { LocaleService } from 'app/services/locale.service';
import { TranslateService } from '@ngx-translate/core';

import * as _ from 'lodash';
declare var $: any;

@Component({
    selector: 'app-add-student-cmp',
    templateUrl: './add-student.component.html',
    styleUrls: ['./add-student.component.scss'],
})

export class AddStudentComponent implements OnInit, OnChanges, OnDestroy {
    @Input() data: any;
    @Input() yearLevelList: YearLevelList;
    @Input() studNumber: number;
    @Input() required?: boolean;
    @Input() reset: boolean;
    @Input() triggerOtherReligion: boolean;
    @Input() triggerOtherCurrentSchool: boolean;
    @Input() triggerOtherSpecialNeeds: boolean;
    @Input() submitted: boolean;
    @Output() isValid = new EventEmitter();
    @Output() newCurrentSchool = new EventEmitter();
    @Output() listItemChanged = new EventEmitter();
    @Output() currentSchoolChanged = new EventEmitter();

    studentForm: FormGroup;
    school: School;
    schoolId: number = null;
    mainCampusId: number = null;
    campuses: Campus[];
    startingYears: number[] = null;
    currentSchools: CurrentSchool[] = null;
    boardingTypes: ListItem[] = null;
    noItemSelected = Constants.noItemSelected;
    fieldRequired = Constants.fieldRequired;
    requiredTextFieldMinLength = Constants.requiredTextFieldMinLength;
    nameMaxLength = Constants.nameMaxLength;

    currentSchoolYears: YearLevel[]; // all schoolyears for selected campus
    intakeYearLevels: YearLevel[]; // all intake schoolyears for selected campus

    boardingTitle: string;
    genders: ListItem[] = null;
    religions: ListItem[] = null;
    countries: Country[] = null;
    specialNeeds: ListItem[];
    otherInterests: ListItem[];
    maxDate = new Date();
    translations: Translation[] = null;
    submittedApplicationOptions = Utils.getEnumValues(SubmittedApplication);
    listId = list_id;
    locale = '';

    isEmpty = false;
    resetted = false;
    loaded = false;

    private formSub: Subscription;

    constructor(
        private fb: FormBuilder,
        private dateAdapter: DateAdapter<Date>,
        private localeService: LocaleService,
        private translate: TranslateService,
    ) { }

    ngOnInit() {
        if (this.data) {
            this.school = this.data.school;
            this.boardingTitle = _.find(this.data.fieldSettings, item => item.id === 'boardingTypeId').title;
            this.schoolId = this.data.school.id;
            this.campuses = _.orderBy(this.data.campuses, ['sequence'], 'asc');
            this.campuses.push(...this.campuses.splice(this.campuses.findIndex(v => v.name === 'Undecided'), 1));
            this.startingYears = this.data.startingYears;
            this.currentSchools = this.data.currentSchools;
            this.boardingTypes = this.data.boardingTypes;
            this.mainCampusId = _.find(this.campuses, c => c.campusType === Campus.CAMPUS_TYPE_MAIN).id;

            this.currentSchoolYears = this.yearLevelList.getCurrentSchoolYearLevels(this.mainCampusId);
            this.intakeYearLevels = this.yearLevelList.getIntakeYearLevels(this.mainCampusId);

            this.genders = this.data.genders;
            this.religions = this.data.religions;
            this.countries = this.data.countries;
            this.translations = this.data.translations;
            this.specialNeeds = _.cloneDeep(this.data.specialNeeds);
            this.otherInterests = _.cloneDeep(this.data.otherInterests);

            this.locale = this.localeService.getCurrentLocale(this.school.countryId);
            this.translate.use(this.locale);
            this.dateAdapter.setLocale(this.locale);

            if (this.schoolId) {
                this.createStudentForm();
                this.onFormChange();
                this.emitData();
                this.loaded = true;
            }
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (_.has(changes, 'reset')) {
            if (this.studentForm) {
                this.ngOnInit();
            }
        }
        if (_.has(changes, 'triggerOtherSpecialNeeds')) {
            this.specialNeeds = _.cloneDeep(this.data.specialNeeds);
        }
    }

    ngOnDestroy() {
        this.formSub.unsubscribe();
    }


    public isRequired(settings: IFieldSetting[], fieldId: string): boolean {
        return FormUtils.isRequired(settings, fieldId);
    }

    private onFormChange(): void {
        this.formSub = this.studentForm.valueChanges.subscribe(val => {
            this.emitData();
        });
    }

    private emitData() {
        this.isValid.emit(this.getResponseData(this.formIsValid() ? this.studentForm.value : null));
    }

    private createStudentForm() {
        if (this.studentForm) {
            this.resetStudentForm();
        } else {
            this.studentForm = this.fb.group({
                firstName: [null, Validators.compose([
                    Validators.required,
                    Validators.minLength(this.requiredTextFieldMinLength),
                    Validators.maxLength(this.nameMaxLength)
                ])],
                lastName: [null, Validators.compose([
                    Validators.required,
                    Validators.minLength(this.requiredTextFieldMinLength),
                    Validators.maxLength(this.nameMaxLength)
                ])],
                schoolId: [this.schoolId],
                campusId: [(this.campuses.length > 2) ? null : this.mainCampusId, Validators.compose([Validators.required])],
            });
            FormUtils.addControlsIfIncluded(this.studentForm, this.data.fieldSettings, [
                { id: Keys.dateOfBirth, validators: [] },
                { id: Keys.startingYear, validators: [] },
                { id: Keys.schoolIntakeYearId, validators: [] },
                { id: Keys.submittedApplication, validators: [] },
                { id: Keys.currentSchoolId, validators: [] },
                { id: Keys.currentSchoolYearId, validators: [] },
                { id: Keys.isInternational, validators: [] },
                { id: Keys.boardingTypeId, validators: [] },
                { id: Keys.genderId, validators: [] },
                { id: Keys.religionId, validators: [] },
                { id: Keys.countryOfOriginId, validators: [] },
                { id: Keys.hasSpecialNeeds, validators: [] },
                { id: Keys.otherInterests, validators: [] },
            ]);
        }
    }

    onSpecialNeedsChange(value: string) {
        if (value === 'true') {
            FormUtils.addControlsIfIncluded(this.studentForm, this.data.fieldSettings, [{ id: Keys.specialNeedsReason, validators: [] }]);
        } else {
            this.studentForm.removeControl(Keys.specialNeedsReason);
        }
    }

    resetStudentForm() {
        this.onSpecialNeedsChange('false');
        this.studentForm.reset();
        this.setValues();
    }

    setValues() {
        FormUtils.setValues(this.studentForm, this.data.fieldSettings);
        this.studentForm.controls.schoolId.setValue(this.schoolId);
        this.studentForm.controls.campusId.setValue((this.campuses.length > 2) ? null : this.mainCampusId);
    }

    public formIsValid() {
        if ((this.studentForm.value.firstName === null || this.studentForm.value.firstName === '') &&
            (this.studentForm.value.lastName === null || this.studentForm.value.lastName === '')
        ) {
            if (this.studentForm.touched) {
                if (!this.required && !this.resetted) {
                    this.resetted = true;
                    this.onClean();
                }
            }
            this.isEmpty = true;
            return (this.required) ? this.studentForm.valid : true;
        } else {
            this.isEmpty = false;
            this.resetted = false;
            return this.studentForm.valid;
        }
    }

    onClean() {
        this.resetStudentForm();
        $('#student' + this.studNumber + ' input').blur();
        $('#student' + this.studNumber + ' div.has-error').removeClass('has-error');
        this.isValid.emit(this.getResponseData(null));
    }

    private getResponseData(formData: any) {
        return { isValid: this.formIsValid(), studNumber: this.studNumber, isEmpty: this.isEmpty, formData };
    }

    campusChanged(campusId: number) {
        const currentCampusId = Utils.getCurrentCampusId(campusId, this.campuses);

        this.currentSchoolYears = this.yearLevelList.getCurrentSchoolYearLevels(currentCampusId);
        this.intakeYearLevels = this.yearLevelList.getIntakeYearLevels(currentCampusId);

        if (FormUtils.ifIncluded(this.data.fieldSettings, Keys.schoolIntakeYearId) && this.studentForm.value.schoolIntakeYearId) {
            const newYL = _.find(this.intakeYearLevels, (s) => s.id === this.studentForm.value.schoolIntakeYearId);
            if (!newYL) {
                this.studentForm.controls.schoolIntakeYearId.reset();
            }
        }

        if (FormUtils.ifIncluded(this.data.fieldSettings, Keys.currentSchoolYearId) && this.studentForm.value.currentSchoolYearId) {
            const newCSY = _.find(this.currentSchoolYears, (s) => s.id === this.studentForm.value.currentSchoolYearId);
            if (!newCSY) {
                this.studentForm.controls.currentSchoolYearId.reset();
            }
        }
    }

    onCurrentSchoolChange(event, controlName: string) {
        if (event.value === 0) {
            this.newCurrentSchool.emit({
                id: event.value, controlName, studentNumber: this.studNumber, top: Utils.getElementOffsetTop(event)
            });
        }
    }

    getFieldLabel(id: string, subCategory) {
        return Utils.getTranslation(this.translations, Constants.translationPrefix.fl, id, subCategory, Translation.CATEGORY_WEBFORM);
    }

}

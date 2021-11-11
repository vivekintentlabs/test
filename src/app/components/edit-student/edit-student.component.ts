import { Component, Input, Output, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';

import { HttpService } from 'app/services/http.service';
import { DataService } from 'app/services/data.service';
import { SchoolQuery } from 'app/state/school';

import { Student } from 'app/entities/student';
import { ListItem } from 'app/entities/list-item';
import { CurrentSchool } from 'app/entities/current-school';
import { RankingScore } from 'app/entities/ranking-score';
import { UserInfo } from 'app/entities/userInfo';
import { School } from 'app/entities/school';
import { Campus } from 'app/entities/campus';
import { Contact } from 'app/entities/contact';
import { Country } from 'app/entities/country';
import { YearLevel } from 'app/entities/year-level';
import { YearLevelList } from 'app/entities/year-level-list';

import { Utils } from 'app/common/utils';
import { Constants } from 'app/common/constants';
import { FormUtils } from 'app/common/form-utils';
import { list_id, SubmittedApplication, LICode } from 'app/common/enums';
import { Calculation } from 'app/common/calculation';
import { Keys } from 'app/common/keys';

import * as _ from 'lodash';
import * as moment from 'moment';


@Component({
    selector: 'app-edit-student',
    styleUrls: ['edit-student.component.scss'],
    templateUrl: './edit-student.component.html',
})

export class EditStudentComponent implements OnDestroy, OnInit {
    @Input() isModal: boolean;
    @Input() isRelationComponent: boolean;  // if true, is called from contact page for a related student
    @Input() studentAdditionalJsonData: Student;
    @Input() contactId: number;
    @Input() currentContact: Contact;
    @Input() currentContactRelationship = [];
    @Output() childCmpData = new EventEmitter();
    @Output() studentChanged = new EventEmitter();
    public specialNeeds: ListItem[] = [];
    public allOtherInterests: ListItem[] = [];
    public genders: ListItem[] = [];
    public currentSchoolYears: YearLevel[] = [];
    public siblings: ListItem[] = [];
    public currentSchools: CurrentSchool[] = [];
    private allYearLevels: YearLevelList;
    public yearLevels: YearLevel[] = [];
    public religions: ListItem[] = [];
    public boardingTypes: ListItem[] = [];
    public student: Student;
    private applicationDate: ListItem[] = [];
    private studentList: ListItem[];
    private rankingScores: RankingScore[];
    public campuses: Campus[];
    public relationships: ListItem[] = [];
    public contactTypes: ListItem[] = [];
    public countries: Country[] = [];
    public relatedContacts: Contact[] = [];

    public listId = list_id; // allow access to enum in html
    public noItemSelected = Constants.noItemSelected; // show constant string in html
    public requiredTextFieldMinLength = Constants.requiredTextFieldMinLength;
    public nameMaxLength = Constants.nameMaxLength;

    public studentEditForm: FormGroup;
    public relationshipForm: FormGroup;
    public loaded = false;
    public title = 'Add Student';
    userInfo: UserInfo;
    public startingYear: number;
    public studentId: number;
    public status: string;
    public sub: any = null;
    public maxScore: number;
    public isGreen: boolean;

    public fromUrl: string = null;
    public fromStudentId: number = null;
    public startingYears: number[] = [];
    public temp: number;

    public addListItemSub: Subscription;
    public addCurrentSchoolSub: Subscription;
    private formChangeSubcription: Subscription = null;
    public currentRelationshipId: number;
    public currentContactTypeId: number;
    public hideRelationship = true;
    public maxDate = new Date();
    public isBoardingEnabled = false;
    public school: School;
    public submittedApplicationOptions: object[] = _.map(Utils.getEnumValues(SubmittedApplication), s => ({ id: s, name: s }));
    public booleanOptions: object[] = [{ id: true, name: 'Yes' }, { id: false, name: 'No' }];
    startingMonth$ = this.schoolQuery.startingMonth$;

    public promiseForBtn: Promise<any>;

    constructor(
        private fb: FormBuilder,
        private httpService: HttpService,
        private dataService: DataService,
        private schoolQuery: SchoolQuery,
    ) { }

    public ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();

        this.dataService.get('country', true, false).then((countries: Country[]) => {
            this.countries = countries;
        });

        if (this.studentAdditionalJsonData) {
            this.student = this.studentAdditionalJsonData[Keys.student];
            this.school = this.studentAdditionalJsonData[Keys.school];
            this.isBoardingEnabled = this.school.isBoardingEnabled;
            this.studentId = this.student.id;
            this.studentList = this.studentAdditionalJsonData['studentList'];

            this.allYearLevels = new YearLevelList(this.studentAdditionalJsonData['yearLevels']);

            this.religions = FormUtils.filterList(this.studentList, list_id.religion);
            this.boardingTypes = FormUtils.filterList(this.studentList, list_id.boarding_type);
            this.campuses = _.orderBy(this.studentAdditionalJsonData['campuses'], ['sequence'], 'asc');
            this.campuses.push(...this.campuses.splice(this.campuses.findIndex(v => v.name === 'Undecided'), 1));
            this.rankingScores = this.studentAdditionalJsonData['rankingScores'];

            if (!this.student.id) {
                const religionNS = this.religions.find(item => item.code === LICode.religion_not_specified);
                this.student.religionId = religionNS != null ? religionNS.id : null;
                this.student.boardingTypeId = this.student.boardingTypeId
                    ? this.student.boardingTypeId : this.boardingTypes.find(b => b.code === LICode.boarding_type_default).id;
                const campusId = this.userInfo.campusId ? this.userInfo.campusId : this.userInfo.mainCampusId;
                const campus: Campus = this.campuses.find(c => c.id === campusId) as Campus;
                this.student.countryOfOriginId = campus.countryId;

                const currentCampusId = (Campus.CAMPUS_TYPE_UNDECIDED === _.find(this.campuses, c => c.id === campusId).campusType)
                    ? this.userInfo.mainCampusId : campusId;
                const currentSchoolYearLevels = this.allYearLevels.getCurrentSchoolYearLevels(currentCampusId);
                const currentSchoolYearNA = currentSchoolYearLevels.find(yl => yl.name === 'NA');
                this.student.currentSchoolYearId = currentSchoolYearNA ? currentSchoolYearNA.id : null;
            }
            this.currentSchools = Utils.getIncludedInListCurrentSchools(
                this.studentAdditionalJsonData['currentSchools'], [this.student.currentSchoolId], this.school.currentSchoolDisplayOther
            );
            // put undecided at the end of the list
            const undecidedCampus = _.find(this.campuses, (item: Campus) => item.campusType === Campus.CAMPUS_TYPE_UNDECIDED);
            _.remove(this.campuses, (item: Campus) => item.campusType === Campus.CAMPUS_TYPE_UNDECIDED);
            this.campuses.push(undecidedCampus);

            const minSchoolStartingYear = Utils.getStartingYear(this.school.startingMonth) - 2;
            const minStudentStartingYear = this.studentAdditionalJsonData['minStartingYear'];
            this.startingYears = Utils.getStartingYears(Math.min(minSchoolStartingYear, minStudentStartingYear));
 
            this.siblings = FormUtils.filterList(this.studentList, list_id.siblings);
            this.specialNeeds = FormUtils.filterList(this.studentList, list_id.special_need);
            this.createForm(this.studentList);
            this.filterSchoolYears();
            if (!this.isModal && this.studentId) {
                this.getRelatedContacts().then(() => {
                    this.calculateScore();
                });
            }
        }
    }

    private filterSchoolYears() {
        const campusId = (this.student.campusId)
            ? this.student.campusId
            : (this.userInfo.campusId ? this.userInfo.campusId : this.userInfo.mainCampusId);

        const currentCampusId = Utils.getCurrentCampusId(campusId, this.campuses);

        this.currentSchoolYears = this.allYearLevels.getCurrentSchoolYearLevels(currentCampusId);
        this.yearLevels = this.allYearLevels.getIntakeYearLevels(currentCampusId);
        if (this.studentEditForm.value.schoolIntakeYearId) {
            const selectedYearLevel = _.find(this.yearLevels, yl => yl.id === this.studentEditForm.value.schoolIntakeYearId);
            if (!selectedYearLevel) {
                const yearLevel = _.find(this.allYearLevels, yl => yl.id === this.studentEditForm.value.schoolIntakeYearId);
                this.yearLevels.push(yearLevel);
                this.yearLevels = _.sortBy(this.yearLevels, ['sequence']);
            }
        }
    }

    private createForm(studentList: ListItem[]) {
        if (this.contactId) {
            this.hideRelationship = false;
        }
        if (!this.hideRelationship) {
            this.currentRelationshipId = this.currentContactRelationship ? this.currentContactRelationship['relationshipType'].id : null;
            this.currentContactTypeId = this.currentContactRelationship ? this.currentContactRelationship['contactType'].id : null;
        }
        this.relationshipForm = this.fb.group({
            relationshipTypeId: [
                (this.currentRelationshipId) ? this.currentRelationshipId : null, Validators.compose([Validators.required])
            ],
            contactTypeId: [this.currentContactTypeId, Validators.compose([Validators.required])],
        });
        const formJSON = {
            id: [this.student.id],
            lastName: [this.student.lastName, Validators.compose([
                Validators.required, Validators.minLength(this.requiredTextFieldMinLength), Validators.maxLength(this.nameMaxLength)
            ])],
            firstName: [this.student.firstName, Validators.compose([
                Validators.required, Validators.minLength(this.requiredTextFieldMinLength), Validators.maxLength(this.nameMaxLength)
            ])],
            preferredName: [this.student.preferredName, Validators.compose([
                Validators.minLength(Constants.notRequiredTextFieldMinLength), Validators.maxLength(this.nameMaxLength)
            ])],
            dateOfBirth: [(this.student.dateOfBirth) ? moment.utc(this.student.dateOfBirth) : null],
            countryOfOriginId: this.student.countryOfOriginId,
            genderId: [this.student.genderId],
            siblingsId: [this.student.siblingsId],
            startingYear: [this.student.startingYear],
            schoolId: [this.student.schoolId],
            currentSchoolYearId: [this.student.currentSchoolYearId],
            submittedApplication: [this.student.submittedApplication],
            currentSchoolId: [this.student.currentSchoolId],
            schoolIntakeYearId: [this.student.schoolIntakeYearId],
            religionId: [this.student.religionId],
            hasSpecialNeeds: [this.student.hasSpecialNeeds],
            specialNeedsIds: [{ value: _.map(this.student.specialNeeds, 'id'), disabled: !this.student.hasSpecialNeeds }],
            campusId: [
                this.student.campusId
                    ? this.student.campusId : (this.userInfo.campusId ? this.userInfo.campusId : this.userInfo.mainCampusId),
                Validators.compose([Validators.required])
            ],
            relationship: [],
            boardingTypeId: this.isBoardingEnabled ? this.student.boardingTypeId : null,
            isInternational: Boolean(this.student.isInternational)
        };

        this.genders = FormUtils.filterList(studentList, list_id.genders);
        this.applicationDate = FormUtils.filterList(studentList, list_id.application_date);
        this.relationships = FormUtils.filterList(studentList, list_id.contact_relationship);
        this.contactTypes = FormUtils.filterList(studentList, list_id.contact_type);

        this.allOtherInterests = FormUtils.addStudentlistToForm(studentList, list_id.other_interest, formJSON);
        this.studentEditForm = this.fb.group(formJSON);

        this.loaded = true;
        this.subscribeToFormChanges();
        this.emitData();
    }

    onSubmit() { // only in modal mode
        this.dataService.resetPageDependentData();
        this.currentRelationshipId = this.relationshipForm.value.relationshipTypeId;
        this.currentContactTypeId = this.relationshipForm.value.contactTypeId;
        let route = '';
        if (!this.hideRelationship && this.studentId == null) { // add student from related.students.component
            route = 'student/add-student-with-relationship';
            this.studentEditForm.addControl('contacts', new FormControl());
            this.studentEditForm.controls.contacts.setValue([{
                id: this.contactId,
                relationship: {
                    id: this.currentContactRelationship ? this.currentContactRelationship['id'] : null,
                    contactId: this.contactId,
                    studentId: null,
                    relationshipTypeId: this.currentRelationshipId,
                    contactTypeId: this.currentContactTypeId,
                }
            }]);
        } else if (!this.hideRelationship && this.studentId != null) { // edit student from related.students.component
            route = 'student/update-student-with-relationship';
            this.studentEditForm.controls.relationship.setValue({
                id: this.currentContactRelationship ? this.currentContactRelationship['id'] : null,
                contactId: this.contactId,
                studentId: this.studentId,
                relationshipTypeId: this.currentRelationshipId,
                contactTypeId: this.currentContactTypeId,
            });
        } else if (this.hideRelationship) { // edit student from eventBooking and pTBooking and Student>relatedStudents
            route = 'student/update-student';
        }
        const formData: Object = _.cloneDeep(this.studentEditForm.value);
        formData[Keys.dateOfBirth] = Utils.getDateOnly(formData[Keys.dateOfBirth]);

        formData[Keys.otherInterests] =
            FormUtils.booleanStudentListToFormData(this.allOtherInterests, list_id.other_interest, this.studentEditForm);

        return this.submit(formData, route);
    }

    private submit(data, route: string): Promise<void> {
        return this.promiseForBtn = this.httpService.postAuth(route, data).then((student: Student) => {
            data.schoolIntakeYear = _.find(this.yearLevels, s => s.id === data.schoolIntakeYearId);
            data.boardingType = _.find(this.boardingTypes, b => b.id === data.boardingTypeId);
            this.studentChanged.emit(data);
            Utils.showSuccessNotification();
            this.loaded = false;
            return Promise.resolve();
        }).catch(err => {
            console.log(err);
            return Promise.reject();
        });
    }

    onCancel() {
        if (this.isModal) {
            this.studentChanged.emit(null);
        }
    }

    private subscribeToFormChanges(): void {
        this.formChangeSubcription = this.studentEditForm.valueChanges.subscribe(val => {
            this.emitData();
            setTimeout(() => { if (!this.isModal) { this.calculateScore(); } }, 1); // recalculate scores on form change
        });
    }

    public getFormData() {
        const formData: object = _.cloneDeep(this.studentEditForm.value);
        formData[Keys.otherInterests] = FormUtils.booleanStudentListToFormData(
            this.allOtherInterests, list_id.other_interest, this.studentEditForm);
        FormUtils.cleanupForm(formData);
        return formData;
    }

    private emitData() {
        this.childCmpData.emit({
            valid: this.studentEditForm.valid ? true : false,
            pristine: this.studentEditForm.pristine ? true : false,
            campusId: this.studentEditForm.controls.campusId.value
        });
    }

    calculateScore() {
        const siblingsId = this.studentEditForm.controls[Keys.siblingsId].value;
        const religionId = this.studentEditForm.controls[Keys.religionId].value;
        const currentSchool = this.studentEditForm.controls[Keys.currentSchoolId].value != null
            ? _(this.currentSchools).find((item) => this.studentEditForm.controls[Keys.currentSchoolId].value === item.id)
            : null;
        const dateAppR: string = _(this.student.activityLogs)
            .filter((item) => (item.activity && item.activity.code === LICode.activity_application_submitted)).map('date').max();
        const actualApplicationDate: Date = dateAppR !== undefined ? moment(dateAppR).toDate() : null;
        const score = Calculation.calculateScore(actualApplicationDate, this.student.hasAlumni, siblingsId, religionId, currentSchool,
            this.rankingScores, this.applicationDate);
        this.maxScore = score;
        return this.isGreen = this.maxScore === 100 ? true : false;
    }

    getRelatedContacts(): Promise<void> {
        return this.dataService.getAuth(`student/${this.studentId}/related-contacts`)
            .then((data: { contacts: Contact[] }) => {
                this.relatedContacts = data.contacts;
            });
    }

    snChanged() {
        if (this.studentEditForm.controls.hasSpecialNeeds.value) {
            this.studentEditForm.controls['specialNeedsIds'].enable();
            this.studentEditForm.controls['specialNeedsIds'].setValue(_.map(this.student.specialNeeds, 'id'));
        } else {
            this.studentEditForm.controls['specialNeedsIds'].disable();
            this.studentEditForm.controls['specialNeedsIds'].setValue(null);
        }
    }

    campusChanged(campusId: number) {
        this.student.campusId = campusId;
        this.filterSchoolYears();

        const selectedYearLevel = _.find(this.yearLevels, yl => yl.id === this.studentEditForm.value.schoolIntakeYearId);
        const selectedCurrentSchoolYear = _.find(this.currentSchoolYears, yl => yl.id === this.studentEditForm.value.currentSchoolYearId);

        this.studentEditForm.controls.schoolIntakeYearId.setValue((selectedYearLevel ? selectedYearLevel.id : null));
        this.studentEditForm.controls.currentSchoolYearId.setValue((selectedCurrentSchoolYear ? selectedCurrentSchoolYear.id : null));
    }

    ngOnDestroy() {
        if (this.addListItemSub) {
            this.addListItemSub.unsubscribe();
        }
        if (this.formChangeSubcription) {
            this.formChangeSubcription.unsubscribe();
        }
    }

}

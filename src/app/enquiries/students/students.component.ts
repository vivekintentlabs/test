import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Sort } from '@angular/material/sort';
import { takeUntil, debounceTime } from 'rxjs/operators';

import { InfiniteScrollTable } from 'app/infinite-scroll-table';

import { ListenerService } from 'app/services/listener.service';
import { LocaleService } from 'app/services/locale.service';
import { StorageService } from 'app/services/storage.service';
import { StudentsService } from './students.service';
import { HttpService } from 'app/services/http.service';
import { PromiseQueueService } from 'app/services/promise-queue.service';
import { SchoolQuery } from 'app/state/school';
import { ErrorMessageService } from 'app/services/error-message.service';

import { Constants } from 'app/common/constants';
import { Utils, Colors } from 'app/common/utils';
import { FieldType, HasAlumni } from 'app/common/enums';
import { Keys } from 'app/common/keys';
import { MinifiedStudent, ResponseMessage } from 'app/common/interfaces';

import { School } from 'app/entities/school';
import { Student } from 'app/entities/student';
import { Campus } from 'app/entities/campus';
import { UserInfo } from 'app/entities/userInfo';
import { ManagementSystem } from 'app/entities/management-system';
import { CustomHttpParams } from 'app/entities/custom-http-params';
import { ExportMapping } from 'app/entities/export-mapping';

import { ExportStudent } from '../export-student';

import { FilterValue } from 'app/components/filter-constellation/interfaces/filter-value';

import * as moment from 'moment';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { environment } from 'environments/environment';

@Component({
    selector: 'app-students',
    templateUrl: 'students.component.html',
    styleUrls: ['./students.component.scss'],
    providers: [StudentsService, PromiseQueueService],
})
export class StudentsComponent extends InfiniteScrollTable<MinifiedStudent> implements OnInit {
    public school: School;
    public tableId = 'studentsBfTable';
    public students: MinifiedStudent[] = [];
    @ViewChild('fileInput') myFileInput: ElementRef;

    public allowedFormats: string[] = ['.csv'];
    public userInfo: UserInfo = null;

    exampleCsvUrl = Utils.getBaseUrl() + '/assets/files/student_example.csv';
    public campuses: Campus[];
    public managementSystem: ManagementSystem = null;
    public schoolManagementSystem = Constants.schoolManagementSystem;
    public date = Constants.localeFormats.date;
    public debounceTime = 500;
    public getTableRows: Promise<number> = null;
    exportMapping: ExportMapping;

    filterValues: FilterValue[];
    campusId: number | string = 'all';
    useLocalStorage = true;
    startingMonth$ = this.schoolQuery.startingMonth$;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private listenerService: ListenerService,
        private exportStudent: ExportStudent,
        private localeService: LocaleService,
        public studentsService: StudentsService,
        public httpService: HttpService,
        private promiseQueueService: PromiseQueueService,
        storageService: StorageService,
        private schoolQuery: SchoolQuery,
        private errorMessageService: ErrorMessageService,
    ) {
        super(storageService);
        this.displayedColumns = [
            'select', Keys.isExported, 'name', 'score', Keys.startingYear, 'year', 'stage',
            'status', 'contactName', 'contactMobile', 'actions'
        ];

        this.listenerService.campusListStatus().pipe(takeUntil(this.unsubscribe)).subscribe(() => this.onCampusChange());

        this.sortDebounce
            .pipe(debounceTime(this.debounceTime), takeUntil(this.unsubscribe)).subscribe(sortState => {
                super.onSortChange(sortState);
                this.onFilterChange(this.filterValues);
            });

        this.filterDebounce
            .pipe(debounceTime(this.debounceTime), takeUntil(this.unsubscribe)).subscribe(filterValues => {
                this.filterValues = filterValues;
                this.loadStudents();
            });

        this.searchDebounce
            .pipe(debounceTime(this.debounceTime), takeUntil(this.unsubscribe)).subscribe(searchText => {
                super.applySearch(searchText);
                this.loadStudents();
            });
    }

    ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.httpService.getAuth('schools/limitedData/' + this.userInfo.schoolId).then((school: School) => {
            this.school = school;
            this.managementSystem = this.school.managementSystem;
            this.getParamsFromUrl();
            this.getTableState();
            this.httpService.getAuth(`export/mappings/${this.managementSystem.format}/${ExportMapping.TYPE_PIPELINE}`, false).then((data: ExportMapping) => {
                this.exportMapping = data;
            }).catch(() => { this.exportMapping = null; });
        });
    }

    private loadStudents(): Promise<number> {
        this.selection.clear();
        this.updateTable([]);
        const studentParams: CustomHttpParams = new CustomHttpParams()
            .generateFilters(this.filterValues)
            .set('search', this.tableState.searchText)
            .generateSort(this.tableState);
        return this.getTableRows = this.studentsService.getStudents(studentParams).then((students: MinifiedStudent[]) => {
            this.students = students || [];
            this.buildTable(this.students);
            this.getMoreStudentsIfNeeded();
            return this.students.length;
        });
    }

    private getMoreStudentsIfNeeded() {
        if (this.students.length < this.studentsService.total && this.students.length < Constants.minInfiniteTableLength) {
            this.onScrollDown();
        }
    }

    onSortChange(sortState: Sort) {
        if (this.isTableBuilt) {
            this.sortDebounce.next(sortState);
        }
    }

    onFilterChange(filterValues: FilterValue[]) {
        this.filterDebounce.next(filterValues);
    }

    onSearchChange(searchText: string) {
        this.searchDebounce.next(searchText);
    }

    onScrollDown() {
        if (this.students.length < this.studentsService.total) {
            this.promiseQueueService.enqueuePromise(this.getMoreStudents.bind(this));
        }
    }

    private getMoreStudents(): Promise<number> {
        return this.getTableRows.then(() => {
            const skipIds = _.map(this.students, s => s.id);
            const studentParams: CustomHttpParams = new CustomHttpParams()
                .generateFilters(this.filterValues)
                .set('search', this.tableState.searchText)
                .generateSort(this.tableState)
                .generateIdsToSkip(skipIds);
            return this.getTableRows = this.studentsService.getStudents(studentParams).then((students: MinifiedStudent[]) => {
                if (students && students.length) {
                    this.students.push(...students);
                    this.updateTable(this.students);
                    if (this.selectAllHasBeenToggled) {
                        this.dataSource.filteredData.forEach(row => {
                            if (_.includes(_.map(students, 'id'), row.id)) {
                                this.selection.select(row);
                            }
                        });
                    }
                    this.getMoreStudentsIfNeeded();
                    return this.students.length;
                }
            });
        });
    }

    onCampusChange() {
        this.onFilterChange([]);
    }

    protected getTotalCount() {
        return this.studentsService.total;
    }

    private getParamsFromUrl(): void {
        this.route.params.pipe(takeUntil(this.unsubscribe)).subscribe(params => {
            let tmpValues = [];
            if (!_.isEmpty(params)) {
                this.useLocalStorage = false;

                if (params.enquiryYear) {
                    const format = Constants.dateFormats.dayMonthYear;
                    const enquiryDate = moment.utc(params.enquiryYear);
                    const startDate = enquiryDate.startOf('year').format(format);
                    const endDate = enquiryDate.endOf('year').format(format);
                    const options = { startDate, endDate };
                    tmpValues.push(this.setFilterValue('enquiryDateRange', false, FieldType.DateRange, options));
                }

                if (params.intakeYear && params.intakeYear !== 'all') {
                    tmpValues.push(this.getIdsFromUrlParams(Keys.startingYear, params.intakeYear));
                }

                if (params.intakeYearLevels) {
                    tmpValues.push(this.getIdsFromUrlParams(Keys.schoolIntakeYearId, params.intakeYearLevels));
                }

                if (params.stages) {
                    tmpValues.push(this.getIdsFromUrlParams(Keys.studentStatusStageId, params.stages));
                }

                if (params.selectedStages) {
                    tmpValues.push(this.getIdsFromUrlParams(Keys.stageId, params.selectedStages));
                }

                if (params.statuses) {
                    tmpValues.push(this.getIdsFromUrlParams(Keys.studentStatusId, params.statuses));
                }

                if (params.title && params.legendId) {
                    switch (params.title) {
                        case Keys.gender:
                            tmpValues.push(this.getIdsFromUrlParams(Keys.genderId, params.legendId));
                            break;
                        case Keys.alumni:
                            tmpValues.push(this.getIdsFromUrlParams(Keys.bfContactAlumniId, params.legendId));
                            break;
                        case Keys.siblings:
                            tmpValues.push(this.getIdsFromUrlParams(Keys.siblingsId, params.legendId));
                            break;
                        case Keys.religion:
                            tmpValues.push(this.getIdsFromUrlParams(Keys.religionId, params.legendId));
                            break;
                        case Keys.boardingType:
                            tmpValues.push(this.getIdsFromUrlParams(Keys.boardingTypeId, params.legendId));
                            break;
                        case Keys.isInternational:
                            tmpValues.push(this.setFilterValue(Keys.isInternational, false, FieldType.Dropdown, !!(+params.legendId)));
                            break;
                        case Keys.countryOfOrigin:
                            // isInternational is always true in this case because it should show
                            // Country of Origin for "International Students"
                            tmpValues.push(this.setFilterValue(Keys.isInternational, false, FieldType.Dropdown, true));
                            const ids: string[] = _.map(_.split(params.legendId, ','), i => i);
                            tmpValues.push(this.setFilterValue(Keys.countryOfOriginId, true, FieldType.Dropdown, ids));
                            break;
                        case Keys.leadSource:
                            tmpValues.push(this.getIdsFromUrlParams(Keys.leadSourceId, params.legendId));
                            break;
                        case Keys.hearAboutUs:
                            tmpValues.push(this.getIdsFromUrlParams(Keys.hearAboutUsId, params.legendId));
                            break;
                        case Keys.currentSchoolStatus:
                            tmpValues.push(this.getIdsFromUrlParams(Keys.bfCurrentSchoolStatusId, params.legendId));
                            break;
                        case Keys.currentSchoolClassification:
                            tmpValues.push(this.getIdsFromUrlParams(Keys.bfCurrentSchoolClassificationId, params.legendId));
                            break;
                        default: break;
                    }
                }

                this.tableState.searchText = params.searchText ?? '';
                this.searchDebounce.next(this.tableState.searchText);
            } else {
                this.useLocalStorage = true;
                tmpValues = [];
            }
            this.filterValues = tmpValues;
        });
    }

    private getIdsFromUrlParams(itemId: string, stringIds: string) {
        // 0 as a number is not being selected in mat-select, but works when kept as a string
        const ids: Array<number | string> = _.map(_.split(stringIds, ','), i => (i === '0') ||
            _.includes([HasAlumni.Yes, HasAlumni.No, HasAlumni.Unknown], i) ? i : +i);
        return this.setFilterValue(itemId, true, FieldType.Dropdown, ids);
    }

    addStudent() {
        this.router.navigate([`/${environment.localization.enquiriesUrl}/add-student`]);
    }

    editStudent(id: number) {
        this.router.navigate([`/${environment.localization.enquiriesUrl}/edit-student`, { studentId: id }]);
    }

    editContact(id: number) {
        if (id) {
            this.router.navigate([`/${environment.localization.enquiriesUrl}/edit-contact`, { contactId: id }]);
        }
    }

    deleteStudent(studentId: number) {
        this.studentsService.delete(studentId).then((deleted: boolean) => {
            if (deleted) {
                this.studentsService.total--;
                this.deselectItems([studentId]);
                this.removeStudentsFromLocalArrays([studentId]);
            }
        });
    }

    private removeStudentsFromLocalArrays(studentIds: number[]) {
        _.remove(this.students, s => _.includes(studentIds, s.id));
        _.remove(this.dataSource.data, s => _.includes(studentIds, s.id));
        this.dataSource.data = _.clone(this.dataSource.data);
    }

    import() {
        const fileList: FileList = this.myFileInput.nativeElement.files;
        this.studentsService.import(fileList, this.router).then(() => {
            Utils.showNotification('Successfully imported the students from file', Colors.success);
        }).catch(async (err: ResponseMessage) => {
            const errMsg: string = await this.errorMessageService.getMessage(err.errorCode, err.errorMessage, err?.params);
            Swal.fire('Error in csv file', errMsg, 'error');
        });
        this.myFileInput.nativeElement.value = '';
    }

    removeSelected() {
        const ids = this.getVisibleSelectedIds();
        return Utils.multipleDeletedQuestion(this.selectedCount).then((result) => {
            if (result && result.value) {
                const studentParams: CustomHttpParams = new CustomHttpParams()
                    .generateFilters(this.filterValues)
                    .set('search', this.tableState.searchText)
                    .generateIdsToExclude(this.excludedIds)
                    .generateIdsToInclude(this.includedIds);
                return this.studentsService.bulkDelete(studentParams)
                    .then(() => {
                        this.studentsService.total -= this.selectedCount;
                        this.deselectItems(ids);
                        this.removeStudentsFromLocalArrays(ids);
                        Utils.multipleDeletedSuccess();
                    });
            }
        });
    }

    export(export2xml: boolean, exportAll: boolean, isExport = false, isBackup = false) {
        const studentParams: CustomHttpParams = new CustomHttpParams()
            .generateFilters(this.filterValues)
            .set('search', this.tableState.searchText)
            .generateIdsToExclude(exportAll ? [] : this.excludedIds)
            .generateIdsToInclude(exportAll ? [] : this.includedIds);

        if (export2xml) {
            if (this.exportMapping) {
                this.exportStudent.exportByMapping(this.exportMapping, this.managementSystem, this.getVisibleSelectedIds())
                    .then((exportedStudents: Student[]) => {
                        this.afterExport(exportedStudents);
                    });
            } else {
                this.exportStudent.export2XML(this.managementSystem, studentParams)
                    .then((exportedStudents: Student[]) => {
                        this.afterExport(exportedStudents);
                    });
            }
        } else {
            this.exportStudent.export2CSV(isExport, this.managementSystem, studentParams, isBackup)
                .then((exportedStudents: Student[]) => {
                    this.afterExport(exportedStudents);
                });
        }
    }

    private afterExport(exportedStudents: Student[]) {
        if (_.isArray(exportedStudents)) {
            _.forEach(exportedStudents, student => {
                this.updateExportValues(this.students, student);
                this.updateExportValues(this.dataSource.data, student);
            });
            this.deselectItems(this.getVisibleSelectedIds());
        }
    }

    private updateExportValues(students: MinifiedStudent[], updatedStudent: Student) {
        const student = _.find(students, s => s.id === updatedStudent.id);
        if (student) {
            student.isExported = updatedStudent.isExported;
            student.exportDate = moment(updatedStudent.exportDate).format(this.localeService.getFormat(this.date));
        }
    }

    private setFilterValue(id: string, multiple: boolean, type: number, value: any) {
        return { id, multiple, type, value };
    }

}

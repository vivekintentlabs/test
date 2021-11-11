import { Injectable, OnDestroy } from '@angular/core';
import { HttpService } from 'app/services/http.service';
import { LocaleService } from 'app/services/locale.service';
import { SchoolInfo, SchoolQuery } from 'app/state/school';

import { IMerge, MergeType, FieldType, MergeField } from './merge';

import { Constants } from 'app/common/constants';
import { LocalDatePipe } from 'app/common/pipes/date.pipe';
import { StartingYearPipe } from 'app/common/pipes/starting-year.pipe';
import { Utils, Colors } from 'app/common/utils';

import { Contact } from 'app/entities/contact';
import { Student } from 'app/entities/student';

import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import * as _ from 'lodash';

type Enquiry = Contact | Student;

@Injectable()
export abstract class MergeService<T extends Enquiry> implements OnDestroy {

    date = Constants.localeFormats.date;
    private localDatePipe: LocalDatePipe;
    private startingYearPipe: StartingYearPipe;
    public mergeFields: IMerge[];
    public model: string;
    startingMonth: number;
    isEnabledAppModule: boolean;
    private unsubscribe = new Subject();

    constructor(protected httpService: HttpService, private localeService: LocaleService, private schoolQuery: SchoolQuery ) {
        this.localDatePipe = new LocalDatePipe(this.localeService);
        this.startingYearPipe = new StartingYearPipe();
        this.schoolQuery.startingMonth$.pipe(takeUntil(this.unsubscribe)).subscribe((i: number) => this.startingMonth = i);
        this.schoolQuery.school$.pipe(takeUntil(this.unsubscribe)).subscribe((school: SchoolInfo) => {
            this.isEnabledAppModule = Utils.isSchoolModuleEnabled(school.modules, Constants.schoolModules.appModule.name);
        });
    }

    public abstract getMergeData(ids: number[], contactId?: number): Promise<Object[]>;
    public abstract merge(mergeFields: MergeField[], enquiries: Partial<T[]>, contactId?: number): Promise<number>;
    protected abstract getValuesFromDerived(enquiry: T, row: IMerge, value: string[]);
    protected abstract getRelatedValues(enquiry: T, field: string): string;

    getFieldsAndIncludes(): { fields: string[], includes: string[] } {
        const fields: string[] = ['id'];
        const includes: string[] = [];
        this.mergeFields.forEach((row: IMerge) => {
            row.mappingParams.forEach(p => {
                if (!_.includes([
                    FieldType.NestedCollection,
                    FieldType.Related,
                    FieldType.ManyToMany,
                    FieldType.AppContact,
                ], p.type)) { fields.push(p.field); }

                if (p.model && (p.type !== FieldType.NestedCollection && p.type !== FieldType.Related)) { includes.push(p.model); }
            });
        });
        return { fields, includes };
    }

    mapFieldsByEnquiries(enquiries: T[], schoolTimeZone: string) {
        const mergeContactFields: MergeField[] = [];
        enquiries.forEach((c, index) => c['in'] = index);
        const contactsByUpdatedAt = _.cloneDeep(_.orderBy(enquiries, ['updatedAt'], ['desc']));
        const indicesByUpdatedAt = contactsByUpdatedAt.map(c => c['in']);
        this.mergeFields.forEach((row: IMerge) => {
            const values = this.getValues(enquiries, row, schoolTimeZone);
            const valuesAreTheSame = values.every((val, i, arr) => val === arr[0]);
            const condition = valuesAreTheSame && (row.mergeType !== MergeType.Readonly && row.mergeType !== MergeType.Hidden);
            const mergeContactField = new MergeField(
                row.title,
                values,
                condition || row.mergeType === MergeType.NotModifiable ? 0 : null,
                condition ? MergeType.NotModifiable : row.mergeType,
            );
            if (row.title === 'Application') {
                if (this.isEnabledAppModule) {
                    mergeContactFields.push(mergeContactField);
                }
            } else {
                mergeContactFields.push(mergeContactField);
            }
        });
        return mergeContactFields;
    }

    private getValues(enquiries: T[], row: IMerge, schoolTimeZone: string): string[] {
        const values: string[] = [];
        enquiries.forEach(enquiry => {
            const value: string[] = [];

            switch (row.mergeType) {
                case MergeType.Modifiable:
                case MergeType.Readonly:
                case MergeType.NotModifiable:
                    this.getSimpleValue(row, value, enquiry, schoolTimeZone);
                    break;
                default:
                    this.getValuesFromDerived(enquiry, row, value);
                    break;
            }

            values.push(value.join(', '));
        });
        return values;
    }

    private getSimpleValue(row: IMerge, value: string[], enquiry: T, schoolTimeZone: string) {
        row.mappingParams.forEach(p => {
            switch (p.type) {
                case FieldType.Date:
                    value.push(this.localDatePipe.transform(enquiry[p.field], schoolTimeZone, this.date));
                    break;
                case FieldType.String:
                    if (enquiry[p.field]) {
                        value.push(enquiry[p.field]);
                    }
                    break;
                case FieldType.NestedId:
                    if (enquiry[p.model]) {
                        value.push(enquiry[p.model][p.value]);
                    }
                    break;
                case FieldType.NestedCollection:
                    value.push(enquiry[p.model][0][p.nestedModel][p.value]);
                    break;
                case FieldType.Related:
                    value.push(this.getRelatedValues(enquiry, p.field));
                    break;
                case FieldType.Boolean:
                    value.push(enquiry[p.field] ? 'Yes' : (enquiry[p.field] === false ? 'No' : ''));
                    break;
                case FieldType.AppContact:
                    value.push(enquiry[p.field].length ? 'Yes' : 'No');
                    break;
                case FieldType.AppStudent:
                    value.push(_.get(enquiry, p.field) ? 'Yes' : 'No');
                    break;
                case FieldType.ManyToMany:
                    _.forEach(enquiry[p.model], item => {
                        value.push(item[p.value]);
                    });
                    break;
                case FieldType.StartingYear:
                    if (enquiry[p.field]) {
                        value.push(this.startingYearPipe.transform(enquiry[p.field], this.startingMonth));
                    }
                    break;
            }
        });
    }

    private selectIndex(enquiries: T[], row: IMerge, indicesByUpdatedAt: number[]): number {
        for (let i = 0; i < indicesByUpdatedAt.length; i++) {
            const index = indicesByUpdatedAt[i];

            for (let y = 0; y < row.mappingParams.length; y++) {
                const param = row.mappingParams[y];
                if (param.type === FieldType.NestedCollection) {
                    if (enquiries[index][param.model][0][param.nestedModel][param.value]) {
                        return index;
                    }
                }
                if (enquiries[index][param.field]) {
                    return index;
                }
            }
        }
        return indicesByUpdatedAt[0];
    }

    isValidMergeFields(mergeFields: MergeField[]): boolean {
        for (let i = 0; i < mergeFields.length; i++) {
            const row = mergeFields[i];
            if (row.mergeType !== MergeType.Readonly && row.mergeType !== MergeType.NotModifiable && !row.isUserSelected) {
                Utils.showNotification(Constants.mergeWarningText, Colors.warning);
                return false;
            }
        }
        return true;
    }

    getEnquiries(enquiries: T[]): T[] {
        const firstCreatedEnquiry = _.first(_.sortBy(enquiries, e => new Date(e.createdAt)));
        const enquiriesByUpdatedAt = _.orderBy(_.filter(enquiries, e => e.id !== firstCreatedEnquiry.id), ['updatedAt'], ['desc']);
        return [firstCreatedEnquiry].concat(enquiriesByUpdatedAt);
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

}

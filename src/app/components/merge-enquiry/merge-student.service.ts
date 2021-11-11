import { Injectable } from '@angular/core';
import { MergeField, Merge, IMerge, FieldType, MergeType } from './merge';

import { Student } from 'app/entities/student';
import { ContactRelationship } from 'app/entities/contact-relationship';
import { CustomHttpParams } from 'app/entities/custom-http-params';
import { MergeStudentDTO } from 'app/common/dto/merge';

import { MergeService } from './merge.service';
import { HttpService } from 'app/services/http.service';
import { LocaleService } from 'app/services/locale.service';
import { SchoolQuery } from 'app/state/school';

import * as _ from 'lodash';
@Injectable()
export class MergeStudentService extends MergeService<Student> {

    constructor(httpService: HttpService, localeService: LocaleService, schoolQuery: SchoolQuery) {
        super(httpService, localeService, schoolQuery);
        this.mergeFields = Merge.mergeStudentFields;
        this.model = 'student';
    }

    public getMergeData(ids: number[], contactId: number): Promise<Object[]> {
        const data = this.getFieldsAndIncludes();
        const promises: Array<Promise<Object>> = [];
        ids.forEach(id => {
            const path = `${this.model}/${id}/contacts/${contactId}`;
            const params: CustomHttpParams = new CustomHttpParams()
                .generateFields(data.fields)
                .generateIncludes(data.includes);
            promises.push(
                this.httpService.getAuth(`${path}?${params.toString()}`)
            );
        });
        return Promise.all(promises);
    }

    public merge(mergeFields: MergeField[], enquiries: Partial<Student[]>, contactId: number): Promise<number> {
        const targetStudent: Partial<Student> = {};
        targetStudent.id = _.first(enquiries).id;
        let relationshipTypeId = null;
        let contactTypeId = null;
        this.mergeFields.forEach((row: IMerge, i: number) => {
            if (row.mergeType !== MergeType.Readonly) {
                row.mappingParams.forEach(p => {
                    if (p.type === FieldType.NestedCollection) {
                        if (p.field === 'relationshipTypeId') {
                            relationshipTypeId = enquiries[mergeFields[i].selected][p.model][0][p.field];
                        }
                        if (p.field === 'contactTypeId') {
                            contactTypeId = enquiries[mergeFields[i].selected][p.model][0][p.field];
                        }
                    } else if (p.type === FieldType.ManyToMany) {
                        targetStudent[p.field] = _.map(enquiries[mergeFields[i].selected][p.model], s => s.id);
                    } else {
                        targetStudent[p.field] = enquiries[mergeFields[i].selected][p.field];
                    }
                });
            }
        });
        const sourceStudentIds: number[] = enquiries.filter(c => c.id !== targetStudent.id).map(c => c.id);
        const contactRelationship: Partial<ContactRelationship> = {
            studentId: targetStudent.id,
            contactId,
            relationshipTypeId,
            contactTypeId
        };
        const mergeData: MergeStudentDTO = { targetStudent, sourceStudentIds, contactRelationship };
        return this.httpService.postAuth('student/merge', mergeData).then(() => {
            return contactId;
        });
    }

    protected getValuesFromDerived(enquiry: Student, row: IMerge, value: string[]) {
        switch (row.mergeType) {
            default:
                break;
        }
    }

    protected getRelatedValues(enquiry: Student, field: string): string {
        return '';
    }

}

import { Injectable } from '@angular/core';
import { MergeField, Merge, IMerge, MergeType, Related } from './merge';

import { MergeContactDTO } from 'app/common/dto/merge';
import { Address } from 'app/common/interfaces';
import { Contact } from 'app/entities/contact';
import { Student } from 'app/entities/student';
import { CustomHttpParams } from 'app/entities/custom-http-params';

import { MergeService } from './merge.service';
import { HttpService } from 'app/services/http.service';
import { LocaleService } from 'app/services/locale.service';
import { SchoolQuery } from 'app/state/school';

import { AddressPipe } from 'app/common/pipes/address.pipe';

import * as _ from 'lodash';

@Injectable()
export class MergeContactService extends MergeService<Contact> {

    private addressPipe = new AddressPipe();
    private allRelatedContactsAndStudentsByContactd: Map<number, { contacts: Contact[], students: Student[] }>
     = new Map<number, {contacts: Contact[], students: Student[]}>();

    constructor(httpService: HttpService, localeService: LocaleService, schoolQuery: SchoolQuery) {
        super(httpService, localeService, schoolQuery);
        this.mergeFields = Merge.mergeContactFields;
        this.model = 'contact';
    }

    public getMergeData(ids: number[]): Promise<Object[]> {
        const data = this.getFieldsAndIncludes();
        const promises: Array<Promise<Object>> = [];
        ids.forEach(id => {
            const path = `${this.model}/${id}`;
            const params: CustomHttpParams = new CustomHttpParams()
                .generateFields(data.fields)
                .generateIncludes(data.includes);
            promises.push(
                this.httpService.getAuth(`${path}?${params.toString()}`)
            );
        });
        return Promise.all(promises);
    }

    public getRelatedData(ids: number[]): Promise<Object[]> {
        const promises: Array<Promise<Object>> = [];
        ids.forEach(id => {
            promises.push(
                this.httpService.getAuth(`${this.model}/${id}/related-contacts`)
            );
        });
        return Promise.all(promises).then((data: any) => {
            ids.forEach((id, index) => {
                this.allRelatedContactsAndStudentsByContactd.set(id, data[index]);
            });
            return data;
        });
    }

    public merge(mergeFields: MergeField[], enquiries: Partial<Contact[]>): Promise<number> {
        const targetContact: Partial<Contact> = {};
        targetContact.id = _.first(enquiries).id;
        this.mergeFields.forEach((row: IMerge, i: number) => {
            if (row.mergeType !== MergeType.Readonly) {
                row.mappingParams.forEach(p => {
                    targetContact[p.field] = enquiries[mergeFields[i].selected][p.field];
                });
            }
        });
        const sourceContactIds: number[] = enquiries.filter(c => c.id !== targetContact.id).map(c => c.id);
        const mergeData: MergeContactDTO = { targetContact, sourceContactIds };
        return this.httpService.postAuth('contact/merge', mergeData).then(() => {
            return targetContact.id;
        });
    }

    protected getValuesFromDerived(enquiry: Contact, row: IMerge, value: string[]) {
        switch (row.mergeType) {
            case MergeType.Address:
                value.push(this.addressPipe.transform(enquiry as unknown as Address));
                break;
        }
    }

    protected getRelatedValues(enquiry: Contact, field: string): string {
        let value = '';
        switch (field) {
            case Related.Contacts:
                this.allRelatedContactsAndStudentsByContactd.get(enquiry.id).contacts.forEach(c => {
                    if (enquiry.id !== c.id) {
                        value += `${c.lastName}, ${c.firstName}\n`;
                    }
                });
                return value;
            case Related.Students:
                this.allRelatedContactsAndStudentsByContactd.get(enquiry.id).students.forEach(s => {
                    value += `${s.lastName}, ${s.firstName}\n`;
                });
                return value;
            default:
                break;
        }
    }

}

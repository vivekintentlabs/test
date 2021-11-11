import { Injectable } from '@angular/core';

import { HttpService } from 'app/services/http.service';

import { Utils } from 'app/common/utils';
import { MinifiedContact, ITableState } from 'app/common/interfaces';

import { Contact } from 'app/entities/contact';
import { CustomHttpParams } from 'app/entities/custom-http-params';

import { FilterValue } from 'app/components/filter-constellation/interfaces/filter-value';

import * as _ from 'lodash';

@Injectable()
export class ContactsService {
    private _total = 0;

    constructor(private httpService: HttpService) { }

    get total() {
        return this._total;
    }

    set total(value: number) {
        this._total = value;
    }

    getContacts(contactParams: CustomHttpParams): Promise<MinifiedContact[]> {
        return this.httpService.getAuth(`contacts?${Utils.toStringEncoded(contactParams)}`)
            .then((result: { contacts: MinifiedContact[], total: number }) => {
                this._total = (result.total !== null) ? result.total : this._total;
                return result.contacts;
            });
    }

    delete(contactId: number): Promise<object> {
        return this.httpService.getAuth(`contact/delete-contact/${contactId}`);
    }

    bulkDelete(contactParams: CustomHttpParams): Promise<object> {
        return this.httpService.deleteAuth(`contacts?${Utils.toStringEncoded(contactParams)}`);
    }

    getMergeLinkMsgs(idsLength = 0, isDuplicateMode = true): object {
        const msgs = {
            merge: 'Click the checkbox to enable Merge',
            linking: 'Click the checkbox to enable the linking of contacts',
        };
        if (idsLength === 1) {
            msgs.merge = 'Select another record to MERGE with';
            msgs.linking = 'Select another contact to link';
        } else if (idsLength > 5 && !isDuplicateMode) {
            msgs.merge = 'You can merge maximum 5 contacts';
            msgs.linking = 'You can link maximum 5 contacts';
        } else if (idsLength > 1) {
            msgs.merge = 'Data from the other selected records will be merged into this record';
            msgs.linking = 'The selected records will be linked so that each appears as one another\'s related contacts';
        }
        return msgs;
    }

    linkingContacts(contactIds: number[]): Promise<object> {
        return this.httpService.postAuth('contact/link', { contactIds: contactIds });
    }

    getCustomHttpParams(filterValues: FilterValue[], tableState: ITableState, skipIds = []): CustomHttpParams {
        return new CustomHttpParams()
            .generateFilters(filterValues)
            .set('search', tableState.searchText)
            .generateSort(tableState)
            .generateIdsToSkip(skipIds);
    }

    getLinkingConfig(linkingContacts: (MinifiedContact | Contact)[]): object {
        const html = '<p>Linking these contacts means they will appear as related contacts on one another\'s details.</p>'
            + this.getContactInfoInHtmlTable(linkingContacts, '');
        return this.getSwalConfig(html);
    }

    private getContactInfoInHtmlTable(contacts: (MinifiedContact | Contact)[], caption) {
        const head = Utils.addTableHead(['Last Name', 'First Name', 'Mobile', 'Email']);
        let rows = '';
        _.forEach(contacts, contact => {
            rows += Utils.addTableRow([contact.lastName, contact.firstName, contact.mobile, contact.email]);
        });
        return Utils.createTable(head, rows, caption);
    }

    private getSwalConfig(html: string): object {
        return {
            title: 'Are you sure?',
            html: html,
            showCancelButton: true,
            confirmButtonClass: 'btn btn-success',
            cancelButtonClass: 'btn btn-cancel',
            confirmButtonText: 'Yes, I\'m sure',
            buttonsStyling: false
        };
    }

}

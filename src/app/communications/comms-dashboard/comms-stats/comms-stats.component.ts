import { Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { HttpService } from 'app/services/http.service';
import { Utils } from 'app/common/utils';
import { Contact } from 'app/entities/contact';

import * as _ from 'lodash';
declare var $: any;

interface ContactsByEmail {
    email: string;
    contacts: Partial<Contact>[];
}

@Component({
    selector: 'comms-stats',
    templateUrl: 'comms-stats.component.html',
    styleUrls: ['./comms-stats.component.scss']
})

export class CommsStatsComponent {
    uniqueEmailContacts: ContactsByEmail[];
    totalContacts: number = -1;
    uniqueEmails: number = -1;
    subscribedEmails: number = -1;
    unsubscribedEmails: number = -1;
    emails: string[] = []
    displayedColumns: string[] = ['email', 'contactInfo'];
    dataSource: MatTableDataSource<Partial<Contact>>;
    filterInput = '';
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild(MatPaginator) paginator: MatPaginator;

    constructor(private httpService: HttpService) {
        this.getStats()
    }

    /**
     * Gets number of contacts for subscribed and unsubscribed
     * @return {Promise<any>}
     */
    private getStats(): Promise<any> {
        return this.httpService.getAuth('contact/list').then((contacts: Contact[]) => {
            this.totalContacts = contacts.length;
            this.uniqueEmails = 0, this.subscribedEmails = 0, this.unsubscribedEmails = 0;
            const contactsUniqueEmails = _.groupBy(contacts, c => _.toLower(c.email));
            _.forEach(contactsUniqueEmails, (c: Contact[], key) => {
                this.emails.push(key)
                this.uniqueEmails++ // also can do this.totalUniqueEmails = Object.keys(contactsUniqueEmails).length
                if (_.find(c, (i: Contact) => i.receiveUpdateEmail === true)) {
                    this.subscribedEmails++
                } else {
                    this.unsubscribedEmails++
                }
            });

            const sortedContacts = _.orderBy(contacts, ['email'], ['asc', 'desc']);
            this.uniqueEmailContacts = _.map(_.groupBy(sortedContacts, c => _.toLower(c.email)), (value, key) => ({ email: key, contacts: value }));

            _.forEach(this.uniqueEmailContacts, contactObj => {
                contactObj.contacts = _.orderBy(contactObj.contacts, ['updatedAt'], ['desc', 'asc']);
            });

            this.dataSource = Utils.createSortCaseInsensitiveMatTable<Contact>([]);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.dataSource.data = this.uniqueEmailContacts;
            this.dataSource.filterPredicate = (data: any, filter) => {
                let contactStr = '';
                _.forEach(data.contacts, (contact) => {
                    contactStr += contact.firstName + contact.lastName + contact.email + (contact.mobile ? contact.mobile : '') + ((contact.receiveUpdateEmail) ? 'Yes' : 'No');
                });
                const dataStr = (data.email + contactStr).toLowerCase();
                return dataStr.toLowerCase().indexOf(filter) !== -1;
            }

            return contacts;
        })
    }

    /**
     * Filters contacts table list
     * @param {string} filterValue - string to filter
     * @return {void}
     */
    applyFilter(filterValue: string) {
        this.dataSource.filter = filterValue.trim().toLowerCase();
    }

    /**
     * Shows contacts modal
     * @param {boolean} status - subscription status
     * @return {void}
     */
    showContactsModal(status: boolean) {
        if (!this.uniqueEmailContacts.length) return;

        const filteredData: ContactsByEmail[] = [];
        _.each(this.uniqueEmailContacts, (contactsByEmail: ContactsByEmail) => {
            const filteredContacts: Partial<Contact>[] = _.filter(contactsByEmail.contacts, { 'receiveUpdateEmail': status });
            if (filteredContacts.length) filteredData.push({ email: contactsByEmail.email, contacts: filteredContacts });
        });
        this.paginator.pageIndex = 0;
        this.filterInput = '';
        this.dataSource.filter = '';
        this.dataSource.data = filteredData;

        $('#contactsModal').modal('show');
    }
}

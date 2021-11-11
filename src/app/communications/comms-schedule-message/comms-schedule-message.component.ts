import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { SubscriptionLike as ISubscription, Subscription } from 'rxjs';
import { AmazingTimePickerService } from 'amazing-time-picker';

import { HttpService } from 'app/services/http.service';
import { CommunicationService } from 'app/communications/communications.service';
import { CommsTemplateService } from './../comms-template.service';
import { ErrorMessageService } from 'app/services/error-message.service';
import { SchoolQuery } from 'app/state/school';

import { PageLeaveReason } from 'app/common/enums';
import { Constants } from 'app/common/constants';
import { Utils, Colors } from 'app/common/utils';
import { ResponseMessage } from 'app/common/interfaces';

import { CommsMessage } from 'app/entities/comms-message';
import { School } from 'app/entities/school';
import { Contact } from 'app/entities/contact';
import { Student } from 'app/entities/student';
import { ContactRelationship } from 'app/entities/contact-relationship';
import { Campus } from 'app/entities/campus';

import { FilterValue } from 'app/components/filter-constellation/interfaces/filter-value';
import { FilteredContactsOutput } from 'app/enquiries/contact-filter/contact-filter';

import 'tinymce/plugins/textcolor/plugin';
import 'tinymce/plugins/image/plugin';
import 'tinymce/plugins/code/plugin';

import * as _ from 'lodash';
import * as moment from 'moment';
import 'moment-timezone';
import Swal from 'sweetalert2';

declare var $: any;

@Component({
    selector: 'app-comms-schedule-message',
    templateUrl: './comms-schedule-message.component.html',
    styleUrls: ['./comms-schedule-message.component.scss']
})

export class CommsScheduleMessageComponent {
    public subscribedStudentsAmount: number = -1;
    public subscribedContactsAmount: number = -1;
    title: string = '';
    emailForm: FormGroup = null;
    private timePickerSubscription: ISubscription;
    saveBtnText: string = 'Save';
    scheduledTime: string = '';
    scheduledDate: string = '';
    filterValues: FilterValue[] = null;
    formFilterValues: FilterValue[] = null;
    public allContacts: Contact[] = [];
    private allStudents: Student[] = [];
    private subscribedContacts: Contact[] = [];
    private filteredContacts: Contact[] = [];
    private allFilteredContacts = [];
    private filteredStudents: Student[] = [];
    todayDate;
    isSubmitted: boolean;
    public campuses: Campus[];
    curCampus: Campus = null;
    private changed = 0;
    private sub: Subscription;
    school: School;
    readonly ACTIVITY_DESCRIPTION_MAX_LENGTH = 50;
    displayedColumns: string[] = ['email', 'contactInfo'];
    scheduledAudienceDataSource: MatTableDataSource<Contact>;
    startingMonth$ = this.schoolQuery.startingMonth$;

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    constructor(
        public commService: CommunicationService,
        private commsTemplateService: CommsTemplateService,
        private httpService: HttpService,
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private atp: AmazingTimePickerService,
        private schoolQuery: SchoolQuery,
        private errorMessageService: ErrorMessageService,
    ) { }

    /**
     * Inits component data, a native callback method
     * @return {void}
     */
    ngOnInit() {
        this.commService.checkModule().then((isLoaded: boolean) => {
            if (isLoaded) {
                this.commService.getCampuses().then((campuses: Campus[]) => {
                    this.campuses = _.orderBy(campuses, ['sequence'], 'asc');
                    this.school = _.head(this.campuses).school;
                    if (this.router.url.indexOf('edit') !== -1) {
                        this.title = 'Edit Scheduled Message';
                    } else {
                        this.title = 'Schedule Message';
                    }

                    const id = this.route.params['value'].id;
                    return this.commService.getMessage(id).then((res) => {
                        if (_.isEmpty(res)) {
                            Utils.showNotification('Message not found', Colors.danger);
                            this.onCancel();
                        } else {
                            this.buildForm(res);
                        }
                    });
                }).catch(err => console.log(err));
            }
        });
    }

    /**
     * Gets contacts and students
     * @return {Promise<object>}
     */
    private getContactsAndStudents(): Promise<object> {
        return this.httpService.getAuth('contact').then((result: any) => {
            this.allContacts = result.contacts;
            this.allStudents = result.students;
            this.subscribedContacts = _.filter(this.allContacts, contact => contact.receiveUpdateEmail === true);
            if (this.emailForm && this.emailForm.value.campusId !== 'all') {
                this.subscribedContacts = _.filter(this.subscribedContacts, (contact: Contact) =>
                    !_.isEmpty(_.find(contact.contactRelationships, (relationship: ContactRelationship) =>
                        relationship.student.campusId === this.emailForm.value.campusId))
                );
            }

            if (this.formFilterValues) {
                this.filterValues = this.formFilterValues;
            }

            // refresh current campus and timezone
            const curCampusId = (this.emailForm.controls.campusId.value === 'all') ? this.commService.mainCampus.id : this.emailForm.controls.campusId.value;
            this.curCampus = _.find(this.campuses, (item: Campus) => item.id === curCampusId);
            moment.tz.setDefault(this.curCampus.timeZoneId);
            this.todayDate = new Date(moment().format('MMMM D, gggg HH:mm:ss'));
            this.changed += 1;
            this.filterContacts();
            return result;
        });
    }

    /**
     * Filters contacts
     * @param {Contact[]} filtered - optional array of contacts
     * @return {void}
     */
    filterContacts(filteredContacts?: FilteredContactsOutput) {
        if (this.subscribedStudentsAmount) {
            this.emailForm.markAsDirty();
        }
        this.filteredStudents = [];
        this.filteredContacts = filteredContacts ? filteredContacts.filteredContacts : this.subscribedContacts;
        _.forEach(this.filteredContacts, (contact: Contact) => {
            _.forEach(contact.contactRelationships, (relationship: ContactRelationship) => {
                this.filteredStudents.push(_.find(this.allStudents, (student: Student) => {
                    if (this.emailForm && this.emailForm.controls.campusId.value === 'all') {
                        return student.id === relationship.studentId;
                    } else {
                        return student.id === relationship.studentId && student.campusId === this.curCampus.id
                    }
                }))
            });
        });
        let _allFilteredContacts = this.filteredContacts;

        this.filteredStudents = _.uniq(this.filteredStudents);
        this.filteredContacts = _.uniqBy(this.filteredContacts, (contact: Contact) => contact.email);

        this.allFilteredContacts = [];
        _allFilteredContacts = _.orderBy(_allFilteredContacts, ['email'], ['asc', 'desc']);

        _.forEach(_allFilteredContacts, (contact: Contact) => {
            const itemObj: any = {};
            itemObj.email = contact.email;

            const contactObj: any = {};
            contactObj.firstName = contact.firstName;
            contactObj.lastName = contact.lastName;
            contactObj.students = [];
            contactObj.updatedAt = contact.updatedAt;

            _.forEach(contact.contactRelationships, (contactRelationship: ContactRelationship) => {
                const studentObj: any = {};
                studentObj.firstName = contactRelationship.student.firstName;
                studentObj.lastName = contactRelationship.student.lastName;
                studentObj.contactTypeName = contactRelationship.contactType.name;
                studentObj.relationshipTypeName = contactRelationship.relationshipType.name;
                studentObj.schoolIntakeYearName =
                    (contactRelationship.student.schoolIntakeYear) ? contactRelationship.student.schoolIntakeYear.name : '';
                studentObj.startingYear = contactRelationship.student.startingYear;
                contactObj.students.push(studentObj);
            });

            itemObj.contacts = [];
            itemObj.contacts.push(contactObj);
            const foundItem = _.find(this.allFilteredContacts, (item) => item.email === contact.email);

            if (!foundItem) {
                this.allFilteredContacts.push(itemObj);
            } else {
                foundItem.contacts.push(contactObj);
            }
        });

        _.forEach(this.allFilteredContacts, contactObj => {
            contactObj.contacts = _.orderBy(contactObj.contacts, ['updatedAt'], ['desc', 'asc']);
        });

        setTimeout(() => {
            this.subscribedStudentsAmount = this.filteredStudents.length;
            this.subscribedContactsAmount = this.filteredContacts.length;
        });
    }

    /**
     * Emits filter values
     * @param {FilterValue[]} filterValues - controls values
     * @return {void}
     */
    filteredValues(filterValues: FilterValue[]) {
        this.formFilterValues = filterValues;
    }

    /**
     * Filters scheduled audience table list
     * @param {string} filterValue - string to filter
     * @return {void}
     */
    applyFilter(filterValue: string) {
        this.scheduledAudienceDataSource.filter = filterValue.trim().toLowerCase();
    }

    /**
     * Shows scheduled audience modal
     * @return {void}
     */
    showScheduledAudienceModal() {
        if (!this.subscribedContactsAmount) return;

        this.scheduledAudienceDataSource = Utils.createSortCaseInsensitiveMatTable<Contact>([]);
        this.scheduledAudienceDataSource.paginator = this.paginator;
        this.scheduledAudienceDataSource.sort = this.sort;
        this.scheduledAudienceDataSource.data = this.allFilteredContacts;
        this.scheduledAudienceDataSource.filterPredicate = (data: any, filter) => {
            let contactRelationshipStr = '';
            _.forEach(data.contacts, (contact) => {
                contactRelationshipStr += contact.firstName + contact.lastName;
                _.forEach(contact.students, (student) => {
                    contactRelationshipStr += student.firstName + student.lastName +
                    student.contactTypeName + student.relationshipTypeName +
                    student.schoolIntakeYearName + student.startingYear;
                });
            });
            const dataStr = (data.email + contactRelationshipStr).toLowerCase();
            return dataStr.indexOf(filter) != -1;
        };
        $('#scheduledContactsModal').modal('show');
    }

    /**
     * Builds form
     * @param {CommsMessage} commsMessage - comms message object
     * @return {void}
     */
    private buildForm(commsMessage: CommsMessage) {
        this.isSubmitted      = false;
        this.formFilterValues = commsMessage.filterValues;

        // set current campus and timezone
        this.curCampus = commsMessage.campus || this.commService.mainCampus;
        moment.tz.setDefault(this.curCampus.timeZoneId);

        this.emailForm = this.fb.group({
            id:       commsMessage.id,
            subject: [commsMessage.subject, Validators.compose([Validators.required, Validators.maxLength(Constants.requiredEmailSubjectMaxLength)])],
            body: [commsMessage.body, Validators.maxLength(Constants.textFieldMaxLength)],
            fromUserId: commsMessage.fromUserId,
            fromUser: commsMessage.fromUser,
            schoolId: commsMessage.schoolId,
            status:   commsMessage.status,
            date:     null,
            time:     null,
            log:      (commsMessage.log === undefined) ? 1 : commsMessage.log,
            whenSend: 0,
            campaignId: commsMessage.campaignId,
            campaignTime: commsMessage.campaignTime,
            activity:   [commsMessage.activity, Validators.compose([Validators.maxLength(this.ACTIVITY_DESCRIPTION_MAX_LENGTH)])],
            audience:   commsMessage.audience,
            campusId:   commsMessage.campusId || 'all',
            filterValues: commsMessage.filterValues
        });

        this.getContactsAndStudents();

        if (commsMessage.campaignTime) {  // preset date and time if edit screen
            const campaignDateTime = moment.tz(commsMessage.campaignTime, this.curCampus.timeZoneId);
            this.emailForm.controls.date.setValue(campaignDateTime.format(Constants.dateFormats.dateTime));
            this.emailForm.controls.time.setValue(campaignDateTime.format(Constants.dateFormats.hourMinutes));
            this.emailForm.controls.whenSend.setValue(2);
            this.setSchedule();
        }

        this.onChanges();
    }

    /**
     * Updates save button on send radio event
     * @param {number} value - value of send radio button
     * @return {void}
     */
    sendChanged(value: number) {
        this.emailForm.controls.whenSend.setValue(value);

        if (value == 0) {
            this.saveBtnText = 'Save';
        } else if (value == 1) {
            this.saveBtnText = 'Send Immediately';
        } else if (value == 2) {
            this.setSchedule();
        }
    }

    /**
     * Listens for date picker change
     * @param {string} date - date string
     * @return {void}
     */
    dateChanged(date) {
        this.emailForm.controls.date.setValue(date);
        this.setSchedule();
    }

    /**
     * Listens for time picker change
     * @param {string} timeControl - timeControl
     * @param {string} defaultTime - defaultTime
     * @return {void}
     */
    timeChanged(timeControl, defaultTime) {
        if (this.emailForm.controls.whenSend.value == 2) {
            const amazingTimePicker = this.atp.open({
                time: (timeControl.value !== undefined ? timeControl.value : defaultTime),
                theme: 'material-purple',
                onlyHour: true,
            });
            this.timePickerSubscription = amazingTimePicker.afterClose().subscribe(time => {
                timeControl.setValue(time);
                this.setSchedule();
                if (this.emailForm && this.emailForm.controls.time && this.emailForm.controls.time.value ) {
                    this.emailForm.markAsDirty();
                }
            });
        }
    }

    /**
     * Checks time range for future
     * @return {boolean}
     */
    private isValidTimeRange(): boolean {
        let res = true;
        if (this.emailForm.controls.date.value && this.emailForm.controls.time.value) {
            const curDateTime = moment().format();
            const dateValue = moment(this.emailForm.controls.date.value).format(Constants.dateFormats.date);
            const timeValue = this.emailForm.controls.time.value;
            const curSchedule = moment(dateValue + ' ' + timeValue, 'YYYY-MM-DD HH:mm:ss');
            res = curSchedule.isBefore(curDateTime);

            if (res) {
                Utils.showNotification("Schedule time must be future", Colors.danger);
                this.scheduledTime = '';
            }
        }
        return !res;
    }

    /**
     * Sets schedule button
     * @return {void}
     */
    setSchedule() {
        this.saveBtnText = 'Schedule';
        if (this.isValidTimeRange()) {
            this.scheduledDate = moment(this.emailForm.controls.date.value).format('dddd, D MMMM');
            this.scheduledTime = moment(this.emailForm.controls.time.value, 'HH:mm').format('h a');
            if (this.scheduledDate && this.scheduledTime) {
                this.saveBtnText = this.saveBtnText + ' on ' + this.scheduledDate + ' at ' + this.scheduledTime;
            }
        }
    }

    /**
     * Form do submit handler
     * @return {Promise<boolean>}
     */
    private doSubmit(): Promise<boolean> {
        if (this.changed > 0 && !this.isSubmitted) {
            return this.submit().then(() => {
                return Promise.resolve(true);
            }).catch(async (error: ResponseMessage) => {
                const errMsg: string = await this.errorMessageService.getMessage(error.errorCode, error.errorMessage, error?.params);
                console.log(error);
                this.isSubmitted = false;
                Utils.showNotification(errMsg, Colors.danger);
                return Promise.reject(error);
            });
        } else {
            return Promise.resolve(true);
        }
    }

    /**
     * Form on submit handler
     * @return {Promise<boolean>}
     */
    onSubmit(): Promise<boolean> {
        return this.submit().then((doRedirect) => {
            if (doRedirect) {
                this.onCancel();
            }
            return Promise.resolve(true);
        }).catch(async (error: ResponseMessage) => {
            const errMsg: string = await this.errorMessageService.getMessage(error.errorCode, error.errorMessage, error?.params);
            console.log(error);
            this.isSubmitted = false;
            Utils.showNotification(errMsg, Colors.danger);
            return Promise.reject(error);
        });
    }

    /**
     * Form submit handler
     * @return {Promise<boolean>}
     */
    private submit(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.emailForm.value && !this.isSubmitted) {
                this.isSubmitted = true;
                const data: CommsMessage = this.emailForm.value;
                data.audience = (this.subscribedContactsAmount > 0) ? this.subscribedContactsAmount : 0;
                data.filterValues = this.formFilterValues;
                data.studentIds = _.map(this.filteredStudents, 'id');

                if (this.emailForm.controls.log.value) {
                    data.activity = this.emailForm.controls.activity.value;
                }

                if (data.campusId === 'all') {
                    data.campusId = null;
                }

                if (this.emailForm.controls.whenSend.value == 0) {
                    data.status = 'draft';
                    data.campaignTime = null;

                    this.commService.updateMessage(data).then((res) => {
                        if (res && res.detail) {
                            reject(res.detail);
                        } else if(res) {
                            this.showMessage(data.status);
                            resolve(true);
                        }
                    }).catch(error => {
                        console.log(error);
                        reject(error);
                    });
                } else {
                    if (this.emailForm.controls.whenSend.value == 1) {
                        data.status = 'sent';
                        data.campaignTime = moment(moment(), 'YYYY-MM-DD HH:mm:ss', this.curCampus.timeZoneId).utc().format();
                    } else {
                        data.status = 'scheduled';
                        let dateValue = moment(this.emailForm.controls.date.value).format(Constants.dateFormats.date);
                        let timeValue = this.emailForm.controls.time.value;
                        data.campaignTime = moment.tz(dateValue + ' ' + timeValue, 'YYYY-MM-DD HH:mm:ss', this.curCampus.timeZoneId).utc().format();
                    }

                    // gets template
                    this.commsTemplateService.generateTemplate(data).then((template) => {
                        data.templateRawHtml = template;

                        // prepare segments
                        data.segmentConditions = [];
                        _.forEach(this.filteredContacts, (contact: Contact) => {
                            data.segmentConditions.push({condition_type: "EmailAddress", field: "EMAIL", op: "is", value: contact.email});
                        });

                        this.commService.updateMessage(data).then((res) => {
                            if (res && res.detail) {
                                reject(res.detail);
                            } else if(res) {
                                this.showMessage(data.status);
                                resolve(true);
                            }
                        }).catch(error => {
                            reject(error);
                        });
                    }).catch(error => {
                        reject(error);
                    });
                }
            } else {
                reject();
            }
        });
    }

    /**
     * Shows dialog message
     * @param {string} string - message status
     * @return {void}
     */
    showMessage(status: string) {
        Swal.fire({
            title: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() + '!',
            text: 'Message has been ' + ((status == 'draft') ? 'saved as ' + status : status) + '.',
            type: 'success',
            confirmButtonClass: 'btn btn-success',
            buttonsStyling: false
        });
    }

    /**
     * Unsubcribes subscribtion instance, a native callback invoked immediately after a directive, pipe, or service instance is destroyed.
     * @return {void}
     */
    ngOnDestroy() {
        if (this.sub) {
            this.sub.unsubscribe();
        }
    }

    /**
     * Redirects to messages listing
     * @return {void}
     */
    onCancel() {
        this.router.navigate([this.commService.HOME_LINK]);
    }

    /**
     * Fires when a form value(s) changes
     * @return {void}
     */
    private onChanges(): void {
        this.sub = this.emailForm.valueChanges.subscribe(val => {
            this.changed += 1;
        });
    }

    /**
     * Detects if a route can be deactivated
     * @return {void}
     */
    canDeactivate(): Promise<boolean> {
        return Utils.canDeactivate(this.changed, this.isSubmitted, this.emailForm == null || this.emailForm.valid).then((can) => {
            if (can === PageLeaveReason.save) {
                return this.doSubmit().catch(() => {
                    return false;
                });
            } else if(can === PageLeaveReason.goBack) {
                return false;
            } else if(can === PageLeaveReason.doNotSave) {
                return true;
            }
        });
    }
}

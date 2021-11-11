import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';

import { emailValidator } from 'app/validators/email.validator';

import { Constants } from 'app/common/constants';
import { Utils } from 'app/common/utils';
import { list_id, LICode } from 'app/common/enums';
import { IAddressOptions } from 'app/common/interfaces';
import { FormUtils } from 'app/common/form-utils';

import { HttpService } from 'app/services/http.service';
import { DataService } from 'app/services/data.service';

import { Contact } from 'app/entities/contact';
import { ListItem } from 'app/entities/list-item';
import { ContactRelationship } from 'app/entities/contact-relationship';
import { AdministrativeArea } from 'app/entities/administrative-area';
import { UserInfo } from 'app/entities/userInfo';
import { Country } from 'app/entities/country';
import { School } from 'app/entities/school';
import { Campus } from 'app/entities/campus';

import * as _ from 'lodash';
import { environment } from 'environments/environment';


@Component({
    selector: 'app-edit-contact',
    styleUrls: ['edit-contact.component.scss'],
    templateUrl: './edit-contact.component.html'
})
export class EditContactComponent implements OnInit, OnDestroy {
    @Input() studentId?: number;
    @Input() contactId: number;
    @Input() currentRelatedContactId?: number; // for contact relationship
    @Input() isModal: boolean;
    @Input() hideRelationship: boolean;
    @Input() isNewStudent: boolean;
    @Input() relatedContacts: Contact[] = [];
    @Output() contactChanged = new EventEmitter();
    @Output() newContact = new EventEmitter();
    @Output() infoForParent = new EventEmitter();
    @Output() contactDataForNewStudent = new EventEmitter();
    @Output() contactData = new EventEmitter();

    private contact: Contact;
    private newContactId: number;
    private currentRelatedContact: Contact;
    private fromUrl: string;

    public listId = list_id; // allow access to enum in html
    public noItemSelected = Constants.noItemSelected; // show constant string in html
    public noCountrySelected = Constants.noCountrySelected; // show constant string in html
    requiredTextFieldMinLength = Constants.requiredTextFieldMinLength;
    notRequiredTextFieldMinLength = Constants.notRequiredTextFieldMinLength;
    nameMaxLength = Constants.nameMaxLength;
    emailMaxLength = Constants.emailMaxLength;

    private userInfo: UserInfo;
    public contactEditForm: FormGroup;
    public relationshipForm: FormGroup;

    title = 'Edit Contact details';
    public administrativeAreas: AdministrativeArea[] = [];
    public addressOptions: IAddressOptions;
    public countries: Country[] = [];
    public salutations: ListItem[] = [];
    public alumni: ListItem[] = [];
    public yesAlumniId: number;
    public noAlumniId: number;
    public graduationYears: number[] = [];
    public loaded = false;
    public relationshipsLoaded = false;
    private changed = 0;
    private submitted = false;
    private sub: Subscription;
    public contactRelationship: ContactRelationship;
    public relationships: ListItem;
    public contactTypes: ListItem;
    public currentRelationshipId: number;
    public currentContactTypeId: number;
    public timeZone: string;
    public genders: ListItem[];
    public school: School;
    public unmarriedContactsOrdered: Array<{ id: number, name: string, alternativeName: string }> = [];
    unmarriedContacts: Contact[];
    filteredUnmarriedContacts: Observable<Contact[]>;

    addressFieldMinLength = Constants.notRequiredTextFieldMinLength;
    addressFieldMaxLength = Constants.addressFieldMaxLength;
    citySuburbFieldMaxLength = Constants.citySuburbFieldMaxLength;
    postCodeMinLength = Constants.postCodeMinLength;
    postCodeMaxLength = Constants.postCodeMaxLength;
    phoneErrorText = Constants.phoneErrorText;

    promiseForBtn: Promise<any>;

    constructor(
        private fb: FormBuilder,
        private httpService: HttpService,
        private router: Router,
        private dataService: DataService,
    ) { }

    public ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        if (this.contactId != null) {
            this.title = (this.contactId > 0) ? 'Edit Contact details' : 'Add Contact';
            this.getContact(this.contactId).then(() => {
                this.createForm();
            });
        }
        if (this.currentRelatedContactId) {
            return this.httpService.getAuth('contact/get-contact/' + this.currentRelatedContactId).then((result: any) => {
                this.currentRelatedContact = result.contact;
            });
        }
    }

    private getRelationships() {
        return this.httpService.getAuth('contact/' + this.contactId + '/related-students/' + this.studentId).then((result: any) => {
            this.contactRelationship = result.contactRelationship;
            this.relationships = result.relationships;
            this.contactTypes = result.contactTypes;
            this.currentRelationshipId = this.contactRelationship ? this.contactRelationship.relationshipType.id : null;
            this.currentContactTypeId = this.contactRelationship ? this.contactRelationship.contactType.id : null;
            this.relationshipsLoaded = true;
        });
    }

    private getUnmarriedContacts() {
        return this.httpService.getAuth(`contact/${this.contactId}/unmarried-contacts-including-spouse`)
            .then((contacts: Contact[]) => {
                this.unmarriedContacts = _.sortBy(contacts, c => _.lowerCase(`${c.lastName}, ${c.firstName}`));
                this.unmarriedContacts = this._filterUnmarriedContactsWithRelatedContacts();
                this.unmarriedContacts.forEach((contact: Contact) => {
                    this.unmarriedContactsOrdered.push({
                        id: contact.id,
                        name: `${contact.lastName}, ${contact.firstName} ${contact.mobile ? contact.mobile : ''} ${contact.email}`,
                        alternativeName: `${contact.lastName}, ${contact.firstName}`
                    });
                });
            });
    }

    private getContact(contactId: number): Promise<any> {
        return Promise.all([
            this.httpService.getAuth('contact/get-contact/' + contactId),
            this.getUnmarriedContacts(),
            this.getRelationships()
        ]).then((res) => {
            const result: any = res[0];
            this.contact = (result.contact) ? result.contact : new Contact();
            this.countries = result.countries;
            this.salutations = result.salutations;
            this.alumni = result.alumni;
            this.yesAlumniId = _.find(this.alumni, a => a.name === 'Yes').id;
            this.noAlumniId = _.find(this.alumni, a => a.name === 'No').id;
            this.graduationYears = Utils.getCurrentAndPastYears(Constants.durationGraduationYear);
            this.timeZone = result.timeZone;
            this.genders = result.genders;
            this.school = result.school;
            if (!this.contactId) {
                if (this.userInfo.campusId) {
                    return this.httpService.getAuth('campus/get/' + this.userInfo.campusId).then((campus: Campus) => {
                        this.contact.countryId = campus.countryId;
                    });
                } else {
                    this.contact.countryId = this.school.countryId;
                }
            }
        }).then(() => {
            return this.getCountryData(this.contact.countryId);
        }).then(() => {
            this.contactData.emit({ contact: this.contact, timeZone: this.timeZone });
            return Promise.resolve();
        });
    }

    private resetForm() {
        this.relationshipForm.reset();
        this.contactEditForm.reset();
        this.contactEditForm.controls.receiveMailUpdates.setValue(false);
        this.contactEditForm.controls.receiveUpdateEmail.setValue(true);
        this.contactEditForm.controls.receiveUpdatePhone.setValue(true);
        this.loaded = true;
    }

    private createForm() {
        this.relationshipForm = this.fb.group({
            relationshipTypeId: [(this.currentRelationshipId) ? this.currentRelationshipId : null, Validators.compose([
                Validators.required
            ])],
            contactTypeId: [(this.currentContactTypeId) ? this.currentContactTypeId : null, Validators.compose([Validators.required])],
        });
        this.contactEditForm = this.fb.group({
            id: [(this.contact) ? this.contact.id : null],
            salutationId: [(this.contact) ? this.contact.salutationId : null],
            lastName: [
                (this.contact) ? this.contact.lastName : null,
                Validators.compose([
                    Validators.required,
                    Validators.minLength(this.requiredTextFieldMinLength),
                    Validators.maxLength(this.nameMaxLength)
                ])
            ],
            firstName: [
                (this.contact) ? this.contact.firstName : null,
                Validators.compose([
                    Validators.required,
                    Validators.minLength(this.requiredTextFieldMinLength),
                    Validators.maxLength(this.nameMaxLength)
                ])
            ],
            genderId: [this.contact.genderId],
            address: [
                (this.contact) ? this.contact.address : null,
                Validators.compose([
                    Validators.minLength(this.addressFieldMinLength),
                    Validators.maxLength(this.addressFieldMaxLength)
                ])
            ],
            city: [
                (this.contact) ? this.contact.city : null,
                Validators.compose([
                    Validators.minLength(this.addressFieldMinLength),
                    Validators.maxLength(this.citySuburbFieldMaxLength)
                ])
            ],
            sublocality: [
                (this.contact) ? this.contact.sublocality : null,
                Validators.compose([
                    Validators.minLength(this.addressFieldMinLength),
                    Validators.maxLength(this.citySuburbFieldMaxLength)
                ])
            ],
            administrativeAreaId: [(this.contact) ? this.contact.administrativeAreaId : null],
            postCode: [
                (this.contact) ? this.contact.postCode : null,
                Validators.compose([
                    Validators.minLength(this.postCodeMinLength),
                    Validators.maxLength(this.postCodeMaxLength)
                ])
            ],
            countryId: [(this.contact) ? this.contact.countryId : null],
            email: [
                (this.contact) ? this.contact.email : null,
                Validators.compose([
                    Validators.required,
                    emailValidator,
                    Validators.minLength(Constants.emailMinLength),
                    Validators.maxLength(this.emailMaxLength)
                ])
            ],
            mobile: [
                (this.contact) ? this.contact.mobile : null,
                Validators.compose(FormUtils.phoneValidators)
            ],
            homePhone: [
                (this.contact) ? this.contact.homePhone : null,
                Validators.compose(FormUtils.phoneValidators)
            ],
            workPhone: [
                (this.contact) ? this.contact.workPhone : null,
                Validators.compose(FormUtils.phoneValidators)
            ],
            alumniId: this.contact.alumniId,
            graduationYear: [this.contact.graduationYear],
            nameAtSchool: [this.contact.nameAtSchool, Validators.compose([
                Validators.minLength(this.notRequiredTextFieldMinLength),
                Validators.maxLength(this.nameMaxLength)
            ])],
            receiveMailUpdates: (this.contact) ? this.contact.receiveMailUpdates : false,
            receiveUpdateEmail: (this.contact) ? this.contact.receiveUpdateEmail : false,
            receiveUpdatePhone: (this.contact) ? this.contact.receiveUpdatePhone : false,
            relationship: [],
            spouseId: [this.getSpouseId()],
        });
        this.alumniChanged();
        this.onChanges();
        this.loaded = true;
    }

    private getSpouseId() {
        return (this.contact && this.contact.marriage)
            ? (this.contact.marriage.contact1Id === this.contactId) ? this.contact.marriage.contact2Id : this.contact.marriage.contact1Id
            : null;
    }

    private onChanges(): void {
        this.sub = this.contactEditForm.valueChanges.subscribe(val => {
            this.changed += 1;
            this.emitData();
        });
    }

    private emitData() {
        if (this.contactEditForm) {
            this.infoForParent.emit({ changed: this.changed, submitted: this.submitted });
        }
    }

    onAddressChange() {
        const value = (this.contactEditForm.value.address !== '') ? true : false;
        this.contactEditForm.controls.receiveMailUpdates.setValue(value);
    }

    onSubmit() {
        this.submit();
    }

    submit(submitFromConfirmDialog = false): Promise<void> {
        return this.promiseForBtn = new Promise<void>((resolve, reject) => {
            this.dataService.resetPageDependentData();
            this.submitted = true;
            this.currentRelationshipId = this.relationshipForm.value.relationshipTypeId;
            this.currentContactTypeId = this.relationshipForm.value.contactTypeId;
            this.emitData();

            if (!this.hideRelationship) {
                this.contactEditForm.controls.relationship.setValue({
                    id: this.contactRelationship ? this.contactRelationship.id : null,
                    contactId: this.contactId ? this.contactId : null,
                    studentId: this.studentId,
                    relationshipTypeId: this.currentRelationshipId,
                    contactTypeId: this.currentContactTypeId,
                });
            } else {
                this.contactEditForm.controls.relationship.setValue({});
            }

            const formData: Contact = _.cloneDeep(this.contactEditForm.value);

            formData.administrativeArea = _.find(this.administrativeAreas, (state: AdministrativeArea) =>
                (state.id === this.contactEditForm.value.administrativeAreaId)
            );
            formData.alumniId = this.contactEditForm.controls.alumniId.value;
            formData.nameAtSchool = this.contactEditForm.controls.nameAtSchool.value;
            if (!this.isNewStudent) {
                if (!this.contactEditForm.value.id) {
                    this.httpService.postAuth('contact/add-contact', formData).then((contact: Contact) => {
                        this.newContactId = contact.id;
                        this.newContact.emit(contact);
                        this.lastAction(true, submitFromConfirmDialog);
                        resolve();
                    }).catch(err => {
                        console.log(err);
                        reject();
                    });
                } else {
                    this.httpService.postAuth('contact/update-contact', formData).then((contact: Contact) => {
                        this.contactChanged.emit(formData);
                        this.lastAction(true, submitFromConfirmDialog);
                        resolve();
                    }).catch(err => {
                        console.log(err);
                        reject();
                    });
                }
            } else {
                this.contactDataForNewStudent.emit({
                    contact: formData,
                    relationships: this.relationships,
                    contactTypes: this.contactTypes
                });
                this.lastAction(false);
                resolve();
            }
        });
    }

    private lastAction(showNotification = true, submitFromConfirmDialog = false) {
        if (showNotification) {
            Utils.showSuccessNotification();
        }
        this.submitted = true;
        this.emitData();
        if (!submitFromConfirmDialog) {
            this.endAction(false);
        }
    }

    onCancel() {
        this.changed = 0;
        this.emitData();
        this.contactDataForNewStudent.emit('');
        this.contactChanged.emit();
        this.endAction();
    }

    private endAction(toNavigate = true) {
        if (!this.isModal) {
            if (toNavigate) {
                const url = this.fromUrl ? this.fromUrl : `/${environment.localization.enquiriesUrl}/contacts`;
                this.router.navigate([url]);
            } else {
                const urlParams = { contactId: this.contactId ? this.contactId : this.newContactId };
                if (this.fromUrl) {
                    urlParams['fromUrl'] = this.fromUrl;
                }
                Utils.refreshPage(this.router, [`/${environment.localization.enquiriesUrl}/edit-contact`, urlParams]);
            }
        } else {
            this.resetForm();
            this.loaded = false;
        }
    }

    onCountryChange(id: string) {
        this.getCountryData(id).then(() => {
            this.contactEditForm.controls.administrativeAreaId.setValue(null);
            if (!this.addressOptions.sublocality.isUsed) {
                this.contactEditForm.controls.sublocality.setValue(null);
            }
        });
    }

    private getCountryData(id: string): Promise<void> {
        return this.httpService.get('country/' + id + '/administrative-areas').then((administrativeAreas: AdministrativeArea[]) => {
            this.administrativeAreas = administrativeAreas;
            return this.httpService.get('country/' + id + '/address-options').then((addressOptions: IAddressOptions) => {
                this.addressOptions = addressOptions;
                return Promise.resolve();
            });
        });
    }

    sameAddress(value: boolean) {
        if (value) {
            this.contactEditForm.controls.address.setValue(this.currentRelatedContact.address);
            this.contactEditForm.controls.city.setValue(this.currentRelatedContact.city);
            this.contactEditForm.controls.administrativeAreaId.setValue(this.currentRelatedContact.administrativeAreaId);
            this.contactEditForm.controls.postCode.setValue(this.currentRelatedContact.postCode);
            this.contactEditForm.markAsDirty();
        } else {
            this.contactEditForm.controls.address.reset();
            this.contactEditForm.controls.city.reset();
            this.contactEditForm.controls.administrativeAreaId.reset();
            this.contactEditForm.controls.postCode.reset();
        }
    }


    /**
     * Related contacts are prioritized in the sorting of this list.
     * They will be put on top.
     */
    private _filterUnmarriedContactsWithRelatedContacts(): Contact[] {
        if (!_.isEmpty(this.relatedContacts)) {
            _.remove(this.relatedContacts, c => c.id === this.contactId);
            const currentContactCouple = _.find(this.relatedContacts, (c: Contact) =>
                (c.marriage && (c.marriage.contact1Id === this.contactId || c.marriage.contact2Id === this.contactId))
            );
            const unmarriedRelatedContacts = _.filter(this.relatedContacts, c => c.marriage === null);
            _.remove(this.unmarriedContacts, c => _.includes(_.map(this.relatedContacts, 'id'), c.id));
            this.unmarriedContacts.unshift(...unmarriedRelatedContacts);
            if (currentContactCouple) {
                this.unmarriedContacts.unshift(currentContactCouple);
            }
            return this.unmarriedContacts;
        } else {
            return this.unmarriedContacts.slice();
        }
    }

    alumniChanged() {
        if (this.contactEditForm.controls.alumniId.value !== this.yesAlumniId) {
            this.contactEditForm.controls.nameAtSchool.disable();
            this.contactEditForm.controls.graduationYear.setValue(null);
            this.contactEditForm.controls.nameAtSchool.setValue(null);
        } else {
            this.contactEditForm.controls.nameAtSchool.enable();
        }
    }

    ngOnDestroy() {
        if (this.sub) {
            this.sub.unsubscribe();
        }
    }
}

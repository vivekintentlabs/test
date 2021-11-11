import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { HttpService } from 'app/services/http.service';

import { School } from 'app/entities/school';
import { Country } from 'app/entities/country';
import { ListItem } from 'app/entities/list-item';
import { TimeZone } from 'app/entities/time-zone';
import { AdministrativeArea } from 'app/entities/administrative-area';
import { Campus } from 'app/entities/campus';

import { IAddressOptions } from 'app/common/interfaces';
import { FormUtils } from 'app/common/form-utils';
import { Constants } from 'app/common/constants';
import { ModalAction, list_id } from 'app/common/enums';
import { Utils } from 'app/common/utils';

import * as _ from 'lodash';

@Component({
    selector: 'app-edit-campus',
    templateUrl: 'edit-campus.component.html'
})
export class EditCampusComponent implements OnInit {
    @Input() campusId: number | null;
    @Input() school: School;
    @Input() countries: Country[] = [];
    @Input() genders: ListItem[] = [];
    @Input() synCodeTitle: string;
    campusForm: FormGroup = null;
    timeZones: TimeZone[] = [];
    administrativeAreas: AdministrativeArea[] = [];
    addressOptions: IAddressOptions;
    title = 'Add';

    ListId = list_id;
    noCountrySelected = Constants.noCountrySelected;
    requiredTextFieldMinLength = Constants.requiredTextFieldMinLength;
    requiredSchoolNameMaxLength = Constants.requiredSchoolNameMaxLength;
    notRequiredTextFieldMinLength = Constants.notRequiredTextFieldMinLength;
    length50 = Constants.length50;
    synCodeMaxLength = Constants.synCodeMaxLength;
    addressFieldMaxLength = Constants.addressFieldMaxLength;
    citySuburbFieldMaxLength = Constants.citySuburbFieldMaxLength;
    postCodeMinLength = Constants.postCodeMinLength;
    postCodeMaxLength = Constants.postCodeMaxLength;

    constructor(
        private fb: FormBuilder,
        private httpService: HttpService,
        private activeModal: NgbActiveModal
    ) { }

    ngOnInit() {
        if (this.campusId) {
            this.title = 'Edit';
            return this.httpService.getAuth('campus/get-with-data/' + this.campusId).then((data: any) => {
                this.genders = data.genders;
                this.genders.forEach((element: ListItem & { checked: boolean }) => {
                    if (_.find(data['campus'].genders, (g: ListItem) => g.id === element.id)) {
                        element.checked = true;
                    }
                });
                const campus: Campus = data.campus ? data.campus : new Campus();
                this.getCountryData(campus.countryId).then(() => {
                    this.createForm(campus);
                });
            });
        } else {
            return this.httpService.get('country/OTHER/address-options').then((addressOptions: IAddressOptions) => {
                this.addressOptions = addressOptions;
                this.createForm(new Campus());
            });
        }
    }

    createForm(campus: Campus) {
        const formJSON = {
            id: [campus.id],
            name: [
                campus.name,
                Validators.compose([
                    Validators.required,
                    Validators.minLength(this.requiredTextFieldMinLength),
                    Validators.maxLength(this.requiredSchoolNameMaxLength)
                ])
            ],
            synCode: [campus.synCode, Validators.compose([Validators.maxLength(this.synCodeMaxLength)])],
            address: [
                campus.address,
                Validators.compose([
                    Validators.required,
                    Validators.minLength(this.requiredTextFieldMinLength),
                    Validators.maxLength(this.addressFieldMaxLength)
                ])
            ],
            sublocality: [
                campus.sublocality,
                Validators.compose([
                    Validators.minLength(this.notRequiredTextFieldMinLength),
                    Validators.maxLength(this.citySuburbFieldMaxLength)
                ])
            ],
            city: [
                campus.city,
                Validators.compose([
                    Validators.required,
                    Validators.minLength(this.requiredTextFieldMinLength),
                    Validators.maxLength(this.citySuburbFieldMaxLength)
                ])
            ],
            genders: [
                campus.genders,
                Validators.compose([])
            ],
            administrativeAreaId: [campus.administrativeAreaId],
            postCode: [
                campus.postCode,
                Validators.compose([
                    Validators.required,
                    Validators.minLength(this.postCodeMinLength),
                    Validators.maxLength(this.postCodeMaxLength)
                ])
            ],
            countryId: [campus.countryId, Validators.compose([Validators.required])],
            timeZoneId: [campus.timeZoneId, Validators.compose([Validators.required])],
        };

        this.campusForm = this.fb.group(formJSON);
    }

    onCountryChange(id: string) {
        this.getCountryData(id).then(() => {
            this.campusForm.controls.administrativeAreaId.setValue(null);
            this.campusForm.controls.timeZoneId.setValue(null);
            if (!this.addressOptions.sublocality.isUsed) {
                this.campusForm.controls.sublocality.setValue(null);
            }
        });
    }

    asBillingAddress(value: boolean) {
        if (value) {
            this.campusForm.controls.address.setValue(this.school.address);
            this.campusForm.controls.postCode.setValue(this.school.postCode);
            this.campusForm.controls.city.setValue(this.school.city);
            this.campusForm.controls.administrativeAreaId.setValue(this.school.administrativeAreaId);
            this.campusForm.controls.countryId.setValue(this.school.countryId);
            this.onCountryChange(this.school.countryId);
            this.campusForm.markAsDirty();
        } else {
            this.campusForm.controls.address.reset();
            this.campusForm.controls.city.reset();
            this.campusForm.controls.postCode.reset();
            this.campusForm.controls.administrativeAreaId.reset();
            this.campusForm.controls.countryId.reset();
        }
    }

    private getCountryData(id: string): Promise<void> {
        return this.httpService.get(`country/${id}/administrative-areas`).then((administrativeAreas: AdministrativeArea[]) => {
            this.administrativeAreas = administrativeAreas;
            return this.httpService.get('country/' + id + '/time-zones').then((timeZones: TimeZone[]) => {
                _.forEach(timeZones, tz => {
                    tz.offset = Utils.getStandardOffset(tz.id);
                });
                this.timeZones = _.orderBy(timeZones, ['offset'], 'asc');
                return this.httpService.get('country/' + id + '/address-options').then((addressOptions: IAddressOptions) => {
                    this.addressOptions = addressOptions;
                    return Promise.resolve();
                });
            });
        });
    }

    saveCampus() {
        const formData: Object = _.cloneDeep(this.campusForm.value);
        FormUtils.cleanupForm(formData);
        const url = this.campusId ? 'campus/update' : 'campus/add';
        this.httpService.postAuth(url, formData).then((campus: Campus) => {
            this.campusForm = null;
            campus.administrativeArea = (campus.administrativeAreaId) ?
                _.find(this.administrativeAreas, (item: AdministrativeArea) => item.id === campus.administrativeAreaId) : null;
            Utils.showSuccessNotification();
            this.activeModal.close({ action: ModalAction.Update, campus });
        });
    }

    onCancel() {
        this.activeModal.close({ action: ModalAction.Cancel });
    }
}

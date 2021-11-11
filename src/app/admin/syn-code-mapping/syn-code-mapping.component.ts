import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { HttpService } from '../../services/http.service';
import { DataService } from '../../services/data.service';
import { ApplicationsService } from 'app/applications/applications.service';

import { list_id, ManagementSystemCode } from '../../common/enums';
import { ISynCodeList } from '../../common/interfaces';
import { Constants } from '../../common/constants';
import { Utils } from '../../common/utils';

import { SynCodeMapping } from '../../entities/syn-code-mapping';
import { Country } from '../../entities/country';
import { UserInfo } from '../../entities/userInfo';
import { AdministrativeArea } from '../../entities/administrative-area';
import { Language } from 'app/entities/language';

import * as _ from 'lodash';
declare var $: any;

@Component({
    selector: 'app-syn-code-mapping',
    templateUrl: 'syn-code-mapping.component.html',
    styleUrls: ['./syn-code-mapping.component.css']
})
export class SynCodeMappingComponent implements OnInit {

    public typeForm: FormGroup;
    public synCodeMappingForm: FormGroup;
    public loaded = false;
    public stateListId = list_id.state;
    public currentListId: list_id;

    userInfo: UserInfo = null;

    public types = [
        { id: list_id.country, name: 'Countries' },
        { id: list_id.state, name: 'States' },
    ]

    public synCodes: SynCodeMapping[] = [];
    public synCodesList: ISynCodeList[] = [];
    public countriesWithAdministrativeAreas: Country[] = [];
    public countries: Country[] = [];
    public languages: Language[] = [];
    displayedColumns: string[] = ['name', 'synCode', 'action'];
    dataSource: MatTableDataSource<ISynCodeList>;

    minLength = Constants.requiredTextFieldMinLength;
    synCodeMaxLength = Constants.synCodeMaxLength;

    filterValue = '';
    synCodeTitle: string;
    promiseForBtn: Promise<any>;
    constructor(
        private httpService: HttpService,
        private fb: FormBuilder,
        private dataService: DataService,
        private appsService: ApplicationsService) { }

    ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.synCodeTitle = Utils.getNameCode(this.userInfo);
        this.appsService.getAppModuleStatus().then((isAppModuleActive: boolean) => {
            if (isAppModuleActive) {
                this.types.push({ id: list_id.language, name: 'Languages' });
            }
            Promise.all([
                this.httpService.getAuth(`syn-code-mapping?type=${list_id.state},${list_id.country},${isAppModuleActive ? list_id.language : ''}`)
                    .then((res: SynCodeMapping[]) => { this.synCodes = res }),
                this.httpService.get('country/countries-with-administrative-areas')
                    .then((res: Country[]) => { this.countriesWithAdministrativeAreas = res }),
                this.dataService.get('country', true, false).then((res: Country[]) => { this.countries = res }),
                this.dataService.get('language', true, false).then((res: Language[]) => { this.languages = res }),
            ]).then(() => {
                this.fillSynCodesList(list_id.country);
                this.createForm();
            });
        });
    }

    editSynCode(sCode: ISynCodeList) {
        let synCodeMapping;
        synCodeMapping = _.find(this.synCodes, (s: SynCodeMapping) => sCode.key === s.key && this.currentListId === s.type);
        if (synCodeMapping === undefined) {
            synCodeMapping = new SynCodeMapping();
            synCodeMapping.key = sCode.key;
        }
        this.createSynCodeMappingForm(synCodeMapping);
        $('#synCodeMappingModal').modal('show');
    }

    private createForm() {
        const formJSON = {
            type: [list_id.country],
            countryId: [this.countriesWithAdministrativeAreas[0].id]
        };

        this.typeForm = this.fb.group(formJSON);
        this.loaded = true;
    }

    private createSynCodeMappingForm(synCodeMapping: SynCodeMapping) {
        const formJSON = {
            id: synCodeMapping.id,
            type: this.typeForm.controls.type.value,
            key: synCodeMapping.key,
            synCode: [
                synCodeMapping.synCode,
                Validators.compose([
                    Validators.required,
                    Validators.minLength(this.minLength),
                    Validators.maxLength(this.synCodeMaxLength)
                ]),
            ]
        };

        this.synCodeMappingForm = this.fb.group(formJSON);
    }

    onCancel() {
        this.synCodeMappingForm = null;
        $('#synCodeMappingModal').modal('hide');
    }

    saveSynCodeMapping() {
        this.submit();
    }

    private submit() {
        const url = (this.synCodeMappingForm.value.id) ? 'syn-code-mapping/update' : 'syn-code-mapping/add';
        return this.promiseForBtn = this.httpService.postAuth(url, this.synCodeMappingForm.value).then((synCodeMapping: SynCodeMapping) => {
            this.updateSynCodeMapping(synCodeMapping);
            this.synCodeMappingForm = null;
            $('#synCodeMappingModal').modal('hide');
            Utils.showSuccessNotification();
            this.applyFilter(this.filterValue);
            return Promise.resolve();
        }).catch((err) => {
            console.log(err);
            return Promise.reject();
        });
    }


    typeChanged(id: list_id) {
        this.filterValue = '';
        this.fillSynCodesList(id);
    }

    countryChanged() {
        this.filterValue = '';
        this.fillSynCodesList(list_id.state);
    }

    fillSynCodesList(id: list_id) {
        this.synCodesList = [];
        this.currentListId = id;
        switch (id) {
            case list_id.country: {
                _.forEach(this.countries, (c: Country) => {
                    const synCode = _.find(this.synCodes, (s: SynCodeMapping) => c.id === s.key && this.currentListId === s.type);
                    this.synCodesList.push({ name: c.name, synCode: (synCode) ? synCode.synCode : null, key: c.id });
                });
                break;
            }
            case list_id.state: {
                const country = _.find(this.countriesWithAdministrativeAreas, (c: Country) =>
                    c.id === this.typeForm.controls.countryId.value);
                _.forEach(country.administrativeAreas, (administrativeArea: AdministrativeArea) => {
                    const synCode = _.find(this.synCodes, (s: SynCodeMapping) => administrativeArea.id === s.key && this.currentListId === s.type);
                    this.synCodesList.push({
                        name: administrativeArea.name, synCode: (synCode) ? synCode.synCode : null,
                        key: administrativeArea.id
                    });
                });
                break;
            }
            case list_id.language: {
                _.forEach(this.languages, (l: Language) => {
                    const synCode = _.find(this.synCodes, (s: SynCodeMapping) => l.id === s.key && this.currentListId === s.type);
                    this.synCodesList.push({ name: l.name, synCode: (synCode) ? synCode.synCode : null, key: l.id });
                });
                break;
            }
        }
        this.dataSource = Utils.createSortCaseInsensitiveMatTable<ISynCodeList>(this.synCodesList);
    }

    updateSynCodeMapping(sc: SynCodeMapping) {
        _.remove(this.synCodes, (item: SynCodeMapping) => item.id === sc.id);
        this.synCodes.push(sc);
        const index = _.findIndex(this.synCodesList, { key: sc.key });
        const synCode = _.find(this.synCodesList, (i: ISynCodeList) => i.key === sc.key);

        // Replace item at index using native splice
        this.synCodesList.splice(index, 1, { name: synCode.name, key: sc.key, synCode: sc.synCode });
        this.dataSource = Utils.createSortCaseInsensitiveMatTable<ISynCodeList>(this.synCodesList);
    }

    applyFilter(filterValue: string) {
        this.filterValue = filterValue;
        this.dataSource.filter = filterValue.trim().toLowerCase();
    }

}

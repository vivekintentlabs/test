import { Component, Input, forwardRef, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import { CurrentSchool } from 'app/entities/current-school';
import { HttpService } from 'app/services/http.service';
import { BaseOther } from 'app/components/other-mat-select/base-other';
import { IAddCurrentSchoolCmpData } from 'app/common/interfaces';
import { Utils } from 'app/common/utils';

import * as _ from 'lodash';
import { ReplaySubject } from 'rxjs';

@Component({
    selector: 'app-other-current-school',
    templateUrl: './other-mat-select.component.html',
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => OtherCurrentSchoolComponent),
        multi: true
    }]
})
export class OtherCurrentSchoolComponent extends BaseOther implements OnInit {

    @Input() list: CurrentSchool[];
    private addCurrentSchoolData: IAddCurrentSchoolCmpData;
    newList: CurrentSchool[];
    filteredList: ReplaySubject<CurrentSchool[]> = new ReplaySubject<CurrentSchool[]>(1);

    constructor(
        private httpService: HttpService,
        dialog: MatDialog,
        fb: FormBuilder,
    ) {
        super(dialog, fb);
    }

    onSelectListChange(event, value) {
        const addNew = _.isArray(value) ? _.includes(value, 0) : (value === 0);
        if (addNew) {
            this.addCurrentSchoolData = ({} as IAddCurrentSchoolCmpData);
            this.addCurrentSchoolData.htmlId = this.htmlId;
            this.addCurrentSchoolData.schoolId = this.schoolId;
            this.addCurrentSchoolData.isPublicPage = this.isPublicPage;
            this.addCurrentSchoolData.top = Utils.getElementOffsetTop(event);
            this.AddOtherDialog<IAddCurrentSchoolCmpData>(this.addCurrentSchoolData);
        } else {
            this.prevValue = value;
        }
        super.onSelectListChange(event, value);
    }

    filterList() {
        if (!this.newList) {
            return;
        }
        let search = this.listFilterCtrl.value;
        if (!search) {
            this.filteredList.next(this.newList.slice());
            return;
        } else {
            search = search.toLowerCase();
        }
        this.filteredList.next(
            this.newList.filter(item => item.schoolName.toLowerCase().indexOf(search) > -1 || item.id === 0)
        );
    }

    updateList(selectedIds: number[]) {
        const displayOther = this.school && this.school.currentSchoolDisplayOther;
        this.newList = Utils.getIncludedInListCurrentSchools(this.list, selectedIds, displayOther);
        this.populateFilteredList(this.filteredList, this.newList);
    }

    public submit(result) {
        result.schoolName = result.name;
        delete result.name;
        if (this.isPublicPage) { // for web forms
            const currentSchool = CurrentSchool.newCurrentSchool(result.schoolName);
            this.writeValue(this.getCurrentValue(currentSchool.id));
            this.selectionChanged.emit(currentSchool);
        } else {
            this.httpService.postAuth('current-school/add-current-school', result).then((currentSchool: CurrentSchool) => {
                this.newList.push(currentSchool, ..._.remove(this.newList, s => s.id === 0)); // moves Other to end of the array
                this.populateFilteredList(this.filteredList, this.newList);
                this.value = this.getCurrentValue(currentSchool.id);
                Utils.showSuccessNotification();
            }).catch(err => console.log(err));
        }
    }

}

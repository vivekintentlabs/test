import { Component, Input, forwardRef, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import { ListItem } from 'app/entities/list-item';
import { HttpService } from 'app/services/http.service';
import { BaseOther } from 'app/components/other-mat-select/base-other';
import { AddListItemCmpData } from 'app/common/interfaces';
import { Utils } from 'app/common/utils';

import * as _ from 'lodash';
import { ReplaySubject } from 'rxjs';

@Component({
    selector: 'app-other-list-item',
    templateUrl: './other-mat-select.component.html',
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => OtherListItemComponent),
        multi: true
    }]
})
export class OtherListItemComponent extends BaseOther implements OnInit {

    @Input() listId: number;
    @Input() list: ListItem[];
    private addListItemData: AddListItemCmpData;
    newList: ListItem[];
    filteredList: ReplaySubject<ListItem[]> = new ReplaySubject<ListItem[]>(1);

    constructor(
        private httpService: HttpService,
        dialog: MatDialog,
        fb: FormBuilder
    ) {
        super(dialog, fb);
    }

    onSelectListChange(event, value) {
        const addNew = _.isArray(value) ? _.includes(value, 0) : (value === 0);
        if (addNew) {
            this.addListItemData = ({} as AddListItemCmpData);
            this.addListItemData.htmlId = this.htmlId;
            this.addListItemData.schoolId = this.schoolId;
            this.addListItemData.listId = this.listId;
            this.addListItemData.isPublicPage = this.isPublicPage;
            this.addListItemData.top = Utils.getElementOffsetTop(event);
            this.AddOtherDialog<AddListItemCmpData>(this.addListItemData);
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
            this.newList.filter(item => item.name.toLowerCase().indexOf(search) > -1 || item.id === 0)
        );
    }

    updateList(selectedIds: number[]) {
        this.newList = Utils.getIncludedInList(this.list, selectedIds);
        this.populateFilteredList(this.filteredList, this.newList);
    }

    public submit(result) {
        if (this.isPublicPage) { // for web forms
            const listItem = ListItem.newListItem(result.name);
            this.writeValue(this.getCurrentValue(listItem.id));
            this.selectionChanged.emit({
                listItem,
                listId: this.listId,
            });
        } else {
            this.httpService.postAuth('list-items/add', result).then((listItem: ListItem) => {
                this.newList.push(listItem, ..._.remove(this.newList, s => s.id === 0)); // moves Other to end of the array
                this.populateFilteredList(this.filteredList, this.newList);
                this.value = this.getCurrentValue(listItem.id);
                Utils.showSuccessNotification();
            }).catch(err => console.log(err));
        }
    }

}

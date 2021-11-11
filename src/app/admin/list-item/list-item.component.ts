import { Component, Input, OnInit } from '@angular/core';

import { Utils } from '../../common/utils';
import { HttpService } from '../../services/http.service';

import { UserInfo } from '../../entities/userInfo';
import { List } from '../../entities/list';
import { ListSetting } from '../../entities/list-setting';

import * as _ from 'lodash';
import { DisplayGroup } from '../../entities/display-group';
import { list_id } from 'app/common/enums';
import { Constants } from 'app/common/constants';


@Component({
    selector: 'app-list-item',
    templateUrl: 'list-item.component.html'
})

export class ListItemComponent implements OnInit {
    @Input() categoryName: string;
    @Input() listTitle: string;
    userInfo: UserInfo = null;
    displayGroups: DisplayGroup[] = null;
    lists: List[] = null;
    selectedCat: List = null;
    public selected = 0;
    displayOtherLabel = Constants.displayOtherLabel;
    listDescrNote = 'listDescrNote';

    constructor(private httpService: HttpService) { }

    public ngOnInit() {
        this.listTitle = this.listTitle || 'School Lists';
        this.categoryName = this.categoryName ? this.categoryName : DisplayGroup.GENERAL_ET;
        this.userInfo = Utils.getUserInfoFromToken();
        return this.httpService.getAuth(`list?category=${this.categoryName}`)
            .then((data: { lists: List[], displayGroups: DisplayGroup[], school: object }) => {
                this.lists = !data.school['isBoardingEnabled']
                    ? _.pull(data.lists, _.find(data.lists, (list: List) => list.id === list_id.boarding_type))
                    : data.lists;
                this.displayGroups = data.displayGroups;
                this.selectedCat = this.lists[1];
                this.selected = this.lists[1].id;
            }).catch(err => {
                console.log(err);
            });
    }

    public listIsChanged(listId: string) {
        this.selectedCat = _.find(this.lists, (listCat: List) => listCat.id === _.parseInt(listId));
    }

    toggleChanged(checked: boolean, listSetting: ListSetting) {
        listSetting.displayOther = checked;
        return this.httpService.postAuth('list/update-setting', listSetting).then((updatedListSetting: ListSetting) => {
            _.forEach(this.lists, list => {
                if (list.id === listSetting.listId && list.listSetting.id === listSetting.id) {
                    list.listSetting.displayOther = checked;
                }
            });
            this.selectedCat.listSetting.displayOther = checked;
            Utils.showSuccessNotification();
        }).catch(err => {
            console.log(err);
        });
    }

    canAddRemoveItemsChanged(checked: boolean) {
        return this.httpService.putAuth(`list/${this.selectedCat.id}/can-add-remove-items`, { canAddRemoveItems: checked }).then((updatedList: List) => {
            this.lists[_.findIndex(this.lists, (l: List) => l.id === updatedList.id)].canAddRemoveItems = checked;
            this.selectedCat.canAddRemoveItems = checked;
            Utils.showSuccessNotification();
        }).catch(console.error);
    }

}

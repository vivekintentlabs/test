import { Component, Input } from '@angular/core';
import { ListItem } from 'app/entities/list-item';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MergeListItemService } from './merge-list-item.service';
import { ModalAction } from 'app/common/enums';
import { Utils, Colors } from 'app/common/utils';

@Component({
    selector: 'app-merge-list-item',
    templateUrl: 'merge-list-item.component.html'
})

export class MergeListItemComponent {

    @Input() listId: number;
    @Input() items: ListItem[];

    displayedColumns: string[] = ['Master', 'Name', 'Include in list', 'Code'];
    title = 'Merge Selected List Items';
    headerText = 'Please select which list item will be the master.  Note this cannot be undone.';
    warnText = 'Please select the master list item to merge the remaining duplicates';

    targetId: number = null;

    constructor(
        private mergeListItemService: MergeListItemService,
        public activeModal: NgbActiveModal
    ) { }

    merge() {
        if (this.targetId) {
            return this.mergeListItemService.merge(this.listId, this.targetId, this.items).then(() => {
                this.activeModal.close({ action: ModalAction.Done });
            });
        } else {
            Utils.showNotification(this.warnText, Colors.warning);
        }
    }

    onCancel() {
        this.activeModal.close({ action: ModalAction.Cancel });
    }

}

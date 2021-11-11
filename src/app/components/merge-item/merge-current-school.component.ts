import { ViewEncapsulation, Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalAction } from 'app/common/enums';
import { Utils, Colors } from 'app/common/utils';
import { CurrentSchool } from 'app/entities/current-school';
import { MergeCurrentSchoolService } from './merge-current-school.service';

@Component({
    selector: 'app-merge-current-school',
    templateUrl: 'merge-current-school.component.html',
    styleUrls: ['./merge.component.scss'],
    encapsulation: ViewEncapsulation.None,
})

export class MergeCurrentSchoolComponent {

    @Input() items: CurrentSchool[];

    displayedColumns: string[] = ['Master', 'School Name', 'Classification', 'Status', 'Include in list', 'Code'];
    title = 'Merge Selected Current Schools';
    headerText = 'Please select which current school will be the master.  Note this cannot be undone.';
    warnText = 'Please select the master current school to merge the remaining duplicates';

    targetId: number = null;

    constructor(
        private mergeCurrentSchoolService: MergeCurrentSchoolService,
        public activeModal: NgbActiveModal
    ) { }

    merge() {
        if (this.targetId) {
            return this.mergeCurrentSchoolService.merge(this.targetId, this.items).then(() => {
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

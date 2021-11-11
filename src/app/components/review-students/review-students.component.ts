import { Component, ViewEncapsulation, Input} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ModalAction } from 'app/common/enums';

import * as _ from 'lodash';

@Component({
    selector: 'app-review-students',
    templateUrl: 'review-students.component.html',
    styleUrls: ['review-students.component.scss'],
    encapsulation: ViewEncapsulation.None,
})

export class ReviewStudentsComponent {

    @Input() id: number;

    constructor(private activeModal: NgbActiveModal) { }

    mergeStudents(res: {action: ModalAction, selectedIds?: number[]}) {
        this.activeModal.close({ action: res.action, studentIds: res.selectedIds });
    }

    onDone() {
        this.activeModal.close({ action: ModalAction.Done });
    }

}

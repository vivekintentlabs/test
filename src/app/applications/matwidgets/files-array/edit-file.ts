import { Component, ViewEncapsulation, Input} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ModalAction } from 'app/common/enums';

import * as _ from 'lodash';
import { FormProperty } from 'ngx-schema-form';

@Component({
    selector: 'app-edit-file',
    templateUrl: 'edit-file.html'
})

export class EditFileComponent {

    @Input() notes: string;
    @Input() statusComplete: boolean;
    @Input() property: FormProperty;

    constructor(private activeModal: NgbActiveModal) { }

    updateFileInfo() {
        this.activeModal.close({ action: ModalAction.Update, notes: this.notes, statusComplete: this.statusComplete });
    }

    onCancel() {
        this.activeModal.close({ action: ModalAction.Cancel });
    }

}

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalAction } from 'app/common/enums';

@Component({
    selector: 'apps-form-submit-modal',
    templateUrl: 'apps-form-submit-modal.component.html'
})

export class AppsFormSubmitModalComponent {
    constructor(private activeModal: NgbActiveModal) { }

    onSubmit() {
        this.activeModal.close({ action: ModalAction.Done });
    }

}

import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import {  ModalAction } from 'app/common/enums';
import { Utils, Colors } from 'app/common/utils';

import * as copy from 'copy-to-clipboard';

@Component({
    selector: 'app-copy-password',
    templateUrl: 'copy-password.component.html'
})

export class CopyPassword {

    @Input() password: string;
    constructor(
        private activeModal: NgbActiveModal
    ) { }

    copyPassword(): void {
        copy(this.password);
        Utils.showNotification('Password is copied to clipboard.', Colors.success);
    }

    onCancel(): void {
        this.activeModal.close({ action: ModalAction.Cancel });
    }

}

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Constants } from 'app/common/constants';

import { ModalAction } from 'app/common/enums';

@Component({
    selector: 'app-download-dialog',
    templateUrl: 'download-dialog.component.html'
})
export class DownloadDialog {

    constants = Constants;
    filePassword = '';

    constructor(
        private activeModal: NgbActiveModal,
    ) { }

    download() {
        this.activeModal.close({ action: ModalAction.Done, password: this.filePassword });
    }

    onCancel() {
        this.activeModal.close({ action: ModalAction.Cancel });
    }

}

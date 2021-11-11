import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Constants } from 'app/common/constants';

import { ModalAction } from 'app/common/enums';

import { ExportMapping } from 'app/entities/export-mapping';
import { ManagementSystem } from 'app/entities/management-system';

@Component({
    selector: 'app-export-dialog',
    templateUrl: 'export-dialog.component.html'
})

export class ExportDialog {

    @Input() managementSystem: ManagementSystem;
    @Input() exportMapping: ExportMapping;
    @Input() selectedInProgressApplicationsCount: number;
    @Input() visibleSelectedCount: number;

    constants = Constants;
    filePassword = '';
    externalApi = ExportMapping.TRANSFER_METHOD_EXTERNAL_API;
    apply = ExportMapping.TYPE_APPLY;

    constructor(
        private activeModal: NgbActiveModal,
    ) { }

    export() {
        this.activeModal.close({ action: ModalAction.Done, password: this.filePassword });
    }

    onCancel() {
        this.activeModal.close({ action: ModalAction.Cancel });
    }

}

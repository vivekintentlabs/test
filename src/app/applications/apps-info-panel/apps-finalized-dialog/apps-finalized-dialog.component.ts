import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ApplicationsService } from 'app/applications/applications.service';
import { TimeStamp } from 'app/applications/interfaces/types';

import { ApplicationStatus, ModalAction } from 'app/common/enums';
import { Utils, Colors } from 'app/common/utils';
import { StudentStatus } from 'app/entities/student-status';
import { environment } from 'environments/environment';

import * as _ from 'lodash';

@Component({
    selector: 'app-finalized-dialog',
    templateUrl: 'apps-finalized-dialog.component.html'
})

export class ApplicationFinalizedDialog {

    @Input() docId: string;
    @Input() formId: string;
    @Input() appStateName: ApplicationStatus;
    @Input() studentStatusAppCompleted: StudentStatus;
    @Input() model: object;

    promiseForBtn: Promise<any>;

    constructor(
        private appsService: ApplicationsService,
        public activeModal: NgbActiveModal
    ) { }

    save() {
        this.promiseForBtn = this.appsService.updateFillableFormStatus(this.docId, this.formId, this.appStateName, this.model).then((res: { updatedAt: TimeStamp }) => {
            this.activeModal.close({ action: ModalAction.Done, updatedAt: res.updatedAt });
            Utils.showNotification(`Syncing data from the Application with Student, Parents & Guardians in ${environment.brand.name}.`, Colors.success);
        });
    }

    onCancel() {
        this.activeModal.close({ action: ModalAction.Cancel });
    }
}

import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { MergeStudentService } from 'app/components/merge-enquiry/merge-student.service';

import { ModalAction } from 'app/common/enums';
import { Utils } from 'app/common/utils';

import { Student } from 'app/entities/student';

import { MergeBase } from './merge-base';

import * as _ from 'lodash';
@Component({
    selector: 'app-merge-student',
    templateUrl: 'merge.component.html',
    styleUrls: ['./merge.component.scss'],
    providers: [MergeStudentService],
})

export class MergeStudentComponent extends MergeBase<Student> {

    @Input() contactId: number;

    constructor(protected activeModal: NgbActiveModal, private mergeStudentService: MergeStudentService) {
        super(activeModal);
        this.footerText = 'All related activities, student interests, any special needs, notes and existing event bookings will be merged as well';
    }

    ngOnInit() {
        super.ngOnInit();
        this.mergeStudentService.getMergeData(this.ids, this.contactId).then((students: Partial<Student[]>) => {
            this.enquiries = _.orderBy(students, ['appStudentMapping', 'createdAt'], ['asc', 'asc']);
            this.mergeFields = this.mergeStudentService.mapFieldsByEnquiries(this.enquiries, this.schoolTimeZone);
            if (this.mergeStudentService.isEnabledAppModule && _.filter(this.enquiries, e => e.appStudentMapping).length > 1) {
                Utils.mergeWarning(this.entityName);
            }
        });
    }

    protected get entityName(): string {
        return this.mergeStudentService.model;
    }

    merge() {
        if (this.mergeStudentService.isValidMergeFields(this.mergeFields)) {
            this.promiseForBtn = this.mergeStudentService.merge(this.mergeFields, this.enquiries, this.contactId).then((id: number) => {
                this.activeModal.close({ action: ModalAction.MergeStudents, id });
            });
        }
    }

}

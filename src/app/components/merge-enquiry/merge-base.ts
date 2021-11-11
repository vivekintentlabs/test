import { Input, OnInit, Directive } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ModalAction } from 'app/common/enums';

import { MergeField, MergeType } from './merge';

import * as _ from 'lodash';

@Directive()
export abstract class MergeBase<T> implements OnInit {

    @Input() ids: number[];
    @Input() schoolTimeZone: string;

    enquiries: Partial<T[]>;
    mergeFields: MergeField[] = [];
    MergeType = MergeType;

    title = '';
    headerText = '';
    footerText = '';

    public promiseForBtn: Promise<any>;

    constructor(protected activeModal: NgbActiveModal) { }

    ngOnInit(): void {
        this.title = `Merge ${_.capitalize(this.entityName)}s`;
        this.headerText = `Select each field you wish to have preserved in the merged ${_.toLower(this.entityName)} record`;
    };

    public abstract merge(): void;
    protected abstract get entityName(): string;

    onCancel() {
        this.activeModal.close({ action: ModalAction.Cancel });
    }

}

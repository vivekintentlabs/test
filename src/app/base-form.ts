import { OnDestroy, Directive } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Utils } from 'app/common/utils';
import { PageLeaveReason } from 'app/common/enums';

import * as _ from 'lodash';

@Directive()
export abstract class BaseForm implements OnDestroy {
    protected changed = 0;
    protected submitted = false;
    protected formSub: Subscription;

    public formGroup: FormGroup;
    public promiseForBtn: Promise<any>;

    constructor() { }

    protected listenToFormChanges(): void {
        this.formSub = this.formGroup.valueChanges.subscribe(val => {
            this.changed += 1;
            this.submitted = false;
        });
    }

    canDeactivate(): Promise<boolean> {
        return Utils.canDeactivate(this.changed, this.submitted, this.formGroup == null || this.formGroup.valid).then((can) => {
            if (can === PageLeaveReason.save) {
                return this.submit().catch(() => {
                    return false;
                });
            } else if (can === PageLeaveReason.goBack) {
                return false;
            } else if (can === PageLeaveReason.doNotSave) {
                return true;
            }
        });
    }

    protected submit(): Promise<boolean> {
        if (this.changed > 0 && !this.submitted) {
            this.promiseForBtn = this.doSubmit();
            return this.promiseForBtn.then(() => {
                this.submitted = true;
                return Promise.resolve(true);
            }).catch((err) => {
                console.log(err);
                return Promise.reject();
            });
        } else {
            return Promise.resolve(true);
        }
    }

    protected abstract doSubmit(): Promise<any>;

    /**
     * Always call super.onCancel() when overriding
     */
    onCancel() {
        this.changed = 0;
    }

    ngOnDestroy() {
        if (this.formSub) {
            this.formSub.unsubscribe();
        }
    }

}

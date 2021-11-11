import { Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { School } from 'app/entities/school';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApplicationsService } from 'app/applications/applications.service';
import { Constants } from 'app/common/constants';
import { TimeStamp } from '../interfaces/types';
import { FillableAppFormQuery } from '../apps-edit-fillableform/state/fillable-app-form.query';
import { DocUpload, FeeResponsibility, PaymentStatus, StudentData } from '../apps-edit-fillableform/state/fillable-app-form.model';
import { PaymentQuery } from '../matwidgets/payment/state/payment.query';
import { PaymentStoreInfo } from '../matwidgets/payment/state/payment.model';
import { PaymentType } from 'app/common/enums/paymentType';
import { LICode } from 'app/common/enums';

import * as _ from 'lodash';

@Component({
    selector: 'apps-info-panel',
    templateUrl: 'apps-info-panel.component.html',
    styleUrls: ['apps-info-panel.component.scss'],
    providers: [ PaymentQuery ]
})

export class AppsInfoPanelComponent {
    appForm: any = null;
    docId: string;
    formId: string;
    school: School;
    dateFormat = Constants.localeFormats.dateTime;
    dateDelimiter = Constants.localeFormats.dateDelimiter;
    feeData = [];
    appStudentData = { startingYear: '', intakeYearLevel: '', status: '' };
    appPreviewUrl = '';
    docUploads$: Observable<DocUpload[]>;
    formattedFeeResponsibilities$: Observable<string[]>;
    appUpdatedAt$: Observable<TimeStamp>;
    studentData$: Observable<StudentData>;
    paymentData$: Observable<PaymentStoreInfo>;
    paymentStatus$: Observable<PaymentStatus>;

    paymentType = PaymentType;
    liCode = LICode;

    @Input() studentStatus: string;
    @Input() applicationStatus: string;
    @Input() dateSubmitted: TimeStamp;
    @Input() exportDate: string;

    constructor(
        private route: ActivatedRoute,
        private appsService: ApplicationsService,
        private fillableAppFormQuery: FillableAppFormQuery,
        private paymentQuery: PaymentQuery,
    ) { }

    /**
     * Inits component data, a native callback method
     * @return {void}
     */
    ngOnInit() {
        this.docId = this.route.params['value'].id;
        this.formId = this.route.params['value'].formId;
        this.appPreviewUrl = `${this.formId}/fillable-forms/${this.docId}`;
        this.school = this.appsService.getSchool();
        this.docUploads$ = this.fillableAppFormQuery.docUploads$;
        this.formattedFeeResponsibilities$ = this.fillableAppFormQuery.feeResponsibilities$.pipe(
            map(responsibilities => responsibilities.map(this.formatFeeResponsibility))
        );
        this.appUpdatedAt$ = this.fillableAppFormQuery.appUpdatedAt$;
        this.studentData$ = this.fillableAppFormQuery.studentData$;
        this.paymentData$ = this.paymentQuery.paymentData$;
        this.paymentStatus$ = this.fillableAppFormQuery.paymentStatus$;
    }

    private formatFeeResponsibility(feeResponsibility: FeeResponsibility) {
        const name = [feeResponsibility.firstName, feeResponsibility.lastName]
            .filter(Boolean)
            .join(' ');
        return [name, feeResponsibility.description]
            .filter(Boolean)
            .join(': ');
    }
}

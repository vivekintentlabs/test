import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Utils } from 'app/common/utils';
import { FormHeaderFooterService } from '../form-header-footer.service';
import { SchoolDoc } from '../interfaces/documents/school-doc';

@Component({
    selector: 'app-display-form-header-footer',
    styleUrls: ['./display-form-header-footer.component.scss'],
    templateUrl: 'display-form-header-footer.component.html'
})

export class DisplayFormHeaderFooterComponent implements OnInit {
    @Input() schoolId?: number;

    appSchoolData: SchoolDoc = null;
    isNotIframe = false;

    constructor(public formHeaderFooterService: FormHeaderFooterService,
                private route: ActivatedRoute) {
    }

    async ngOnInit() {
        if (Utils.inIframe()) {
            return;
        }
        const schoolUniqId = this.schoolId || this.route.params['value'].schoolUniqId;
        if (!schoolUniqId) {
            return
        }
        this.isNotIframe = true;
        this.appSchoolData = await this.formHeaderFooterService.getSchoolHeaderAndFooter(schoolUniqId, true);
        return this.appSchoolData;
    }
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';


@Component({
    selector: 'app-submit-succeeded',
    templateUrl: 'submit-succeeded.component.html',
    styleUrls: ['submit-succeeded.component.scss']
})
export class SubmitSucceededComponent implements OnInit {

    appId: string;
    formId: string;
    studentName: string;

    constructor(private route: ActivatedRoute, private router: Router) { }

    ngOnInit(): void {
        this.appId = this.route.params['value'].appId;
        this.formId = this.route.params['value'].formId;
        this.studentName = this.route.params['value'].studentName;
    }

    viewApplication() {
        this.router.navigate([`${this.formId}/fillable-forms/${this.appId}`]);
    }

}

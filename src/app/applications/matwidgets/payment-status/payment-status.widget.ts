import { Component, Inject, Optional } from "@angular/core";
import { ObjectWidget } from "../object/object-widget";
@Component({
    selector: "app-payment-status-widget",
    templateUrl: "./payment-status.widget.html",
    styleUrls: ["./payment-status.widget.scss"]
})
export class MatPaymentStatusWidget extends ObjectWidget {
    constructor(
        @Optional() @Inject('showAdminUse') public showAdminUse = false) {
        super();
    }

    getProperty(fieldId) {
        return this.formProperty.getProperty(fieldId);
    }

}

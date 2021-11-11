import { Component, Inject, Optional } from "@angular/core";

import { ObjectWidget } from "../object/object-widget";

@Component({
    selector: "app-files-section-widget",
    templateUrl: "./files-section.widget.html"
})
export class MatFilesSectionWidget extends ObjectWidget {
    constructor(
        @Optional() @Inject('showDocSectionStatus') public showDocSectionStatus = false) {
        super();
    }

}

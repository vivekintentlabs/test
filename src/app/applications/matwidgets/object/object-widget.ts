import { Component } from '@angular/core';

import { ObjectLayoutWidget } from 'ngx-schema-form';


@Component({
    selector: 'app-object-widget',
    templateUrl: './object-widget.html',
    styleUrls: ['./object-widget.scss']
})
export class ObjectWidget extends ObjectLayoutWidget {
    private defaultHtmlClass = 'col-sm-4'; // TODO: this value should be taken from the schema

    getProperty(fieldId) {
        return this.formProperty.getProperty(fieldId);
    }

    getHtmlClass(fieldId) {
        const field = this.getProperty(fieldId);
        return field?.schema.widget.hasOwnProperty('htmlClass') ? field?.schema.widget.htmlClass : this.defaultHtmlClass;
    }

    inNewLine(fieldId): boolean {
        const field = this.getProperty(fieldId);
        return !!(field?.schema.widget.newLine);
    }

    isVisible(fieldId): boolean {
        return this.getProperty(fieldId)._visible;
    }

}

import { Component, Input, OnInit, OnDestroy, NgZone } from '@angular/core';
import { ISchema } from 'ngx-schema-form';
import { basicToolbar, initTinyMCE } from 'app/common/tinymce-helper';
import { Utils } from 'app/common/utils';

@Component({
    selector: 'sf-field-editor',
    templateUrl: 'field-editor.component.html',
    styleUrls: ['field-editor.component.scss']
})
export class FieldEditorComponent implements OnInit, OnDestroy {
    @Input() fieldSchema: ISchema;
    @Input() isDebug = false;
    isTinyMceLoaded = false;

    constructor(
        private zone: NgZone
    ) { }

    ngOnInit() {
        setTimeout(() => {
            this.initTinyMCE();
        }, 0);
    }

    onTextAreaChange(stringSchema: string) {
        Object.assign(this.fieldSchema, JSON.parse(stringSchema));
    }

    private initTinyMCE() {
        const config = {
            selector: '#fieldDescription',
            basicToolbar,
            height: '200',
            setup: (editor) => {
                editor.on('init', () => {
                    this.fieldSchema.description = editor.getContent();
                });
                editor.on('change keyup input', () => {
                    this.zone.run(() => {
                        this.fieldSchema.description = editor.getContent();
                    });
                });
            }
        };
        initTinyMCE(config);
        this.isTinyMceLoaded = true;
    }

    ngOnDestroy() {
        Utils.destroyTinyMCE('#fieldDescription');
    }
}

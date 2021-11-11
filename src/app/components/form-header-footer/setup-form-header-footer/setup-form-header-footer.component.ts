import { Component, OnInit, NgZone, ChangeDetectorRef, ViewChild } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { Utils, Colors } from 'app/common/utils';
import { UserInfo } from 'app/entities/userInfo';
import { InsertField } from 'app/common/interfaces';
import { PageLeaveReason } from 'app/common/enums';
import { adminToolbar, basicToolbar, initTinyMCE } from 'app/common/tinymce-helper';
import { FormHeaderFooterService } from '../form-header-footer.service';
import { SchoolDoc } from '../interfaces/documents/school-doc';

import * as tinymce from 'tinymce';

declare var $: any;

@Component({
    selector: 'app-setup-form-header-footer',
    styleUrls: ['./setup-form-header-footer.component.scss'],
    templateUrl: 'setup-form-header-footer.component.html'
})

export class SetupFormHeaderFooterComponent implements OnInit {
    userInfo: UserInfo = null;
    isTinyMceLoaded = false;
    insertMessageEmail: Array<InsertField> = [
        { text: 'School Name', value: '&nbsp;< SCHOOL NAME >' },
        { text: 'School Address', value: '&nbsp;< SCHOOL ADDRESS >' },
        { text: 'School City', value: '&nbsp;< SCHOOL CITY >' },
        { text: 'School State', value: '&nbsp;< SCHOOL STATE >' },
        { text: 'School Postcode', value: '&nbsp;< SCHOOL POSTCODE >' },
        { text: 'Current Calendar Year', value: '&nbsp;< CURRENT CALENDAR YEAR >' }
    ];
    tinymceEditors = [{
                        id: '#headerContent',
                        changed: 0,
                        submitted: false,
                        content: ''
                    },
                    {
                        id: '#footerContent',
                        changed: 0,
                        submitted: false,
                        content: ''
                    }];
    activeTabIndex = 0;
    @ViewChild('tabGroup') tabGroup;
    appSchoolData: SchoolDoc = null;

    constructor(public formHeaderFooterService: FormHeaderFooterService, private zone: NgZone, private cdRef: ChangeDetectorRef) { }

    ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        return this.formHeaderFooterService.getSchoolHeaderAndFooter(this.userInfo.schoolUniqId)
        .then((data: SchoolDoc) => {
            this.appSchoolData = data;
            setTimeout(() => {
                this.initTinyMCE(this.tinymceEditors[this.activeTabIndex].id);
            }, 2000); // workaround until tinymce upgraded
            return data;
        });
    }

    public handleTabChange(e: MatTabChangeEvent) {
        this.activeTabIndex = e.index;
        const id = this.tinymceEditors[this.activeTabIndex].id;
        tinymce.remove(id);
        this.initTinyMCE(id);
    }

    private initTinyMCE(id: string) {
        const toolbar = this.userInfo.isSchoolAdminOrHigher() ? adminToolbar : basicToolbar;
        const config = {
            selector: id,
            toolbar,
            setup: (editor) => {
                editor.on('init', () => {
                    this.tinymceEditors[this.activeTabIndex].content = editor.getContent();
                });
                const self = this;
                editor.addButton('insertFields', {
                    type: 'listbox',
                    text: '<Insert Fields>',
                    icon: false,
                    onselect: function (e) {
                        editor.insertContent(this.value());
                    },
                    values: self.insertMessageEmail
                });
                editor.on('change keyup input', () => {
                    this.tinymceEditors[this.activeTabIndex].content = editor.getContent();
                    if (this.hasValidContent()) {
                        this.zone.run(() => {
                            this.contentChanged();
                        });
                    } else {
                        this.tinymceEditors[this.activeTabIndex].changed = 0;
                    }
                });
            }
        }
        initTinyMCE(config);
        this.isTinyMceLoaded = true;
    }

    private getReversIndex() {
        return (this.activeTabIndex) ? 0 : 1;
    }

    private contentChanged() {
        this.tinymceEditors[this.activeTabIndex].changed += 1;
        this.tabGroup._tabs._results[this.getReversIndex()].disabled = true;
    }

    private hasValidContent() {
        const editor = tinymce.activeEditor;
        if ($.trim(editor.getContent({format: 'text'})).length || !!$('<div />').html(editor.getContent()).find('img').length) {
            return true;
        } else {
            return false;
        }
    }

    saveSchoolHeaderAndFooter() {
        this.tinymceEditors[this.activeTabIndex].submitted = true;
        return this.formHeaderFooterService.saveSchoolHeaderAndFooter({
            header: this.tinymceEditors[0].content,
            footer: this.tinymceEditors[1].content,
        })
        .then(() => {
            this.tinymceEditors[this.activeTabIndex].changed = 0;
            this.tinymceEditors[this.activeTabIndex].submitted = false;
            Utils.showNotification('Saved app school data', Colors.info);
            this.tabGroup._tabs._results[this.getReversIndex()].disabled = false;
            return true;
        });
    }

    canDeactivate() {
        return Utils.canDeactivate(this.tinymceEditors[this.activeTabIndex].changed,
                                   this.tinymceEditors[this.activeTabIndex].submitted, true,
                                   'Are you sure you want to leave without saving header and footer changes?')
        .then((can) => {
            if (can === PageLeaveReason.save) {
                return this.saveSchoolHeaderAndFooter().catch(() => {
                    return false;
                });
            } else if (can === PageLeaveReason.goBack) {
                return false;
            } else if (can === PageLeaveReason.doNotSave) {
                return true;
            }
        });
    }
}

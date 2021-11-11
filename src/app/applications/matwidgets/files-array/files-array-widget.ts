import { Component, Inject, Optional } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ActivatedRoute } from "@angular/router";
import { PlatformLocation } from "@angular/common";
import { Constants } from "app/common/constants";
import { AppConstants } from "../../constants";
import { Colors, Utils } from "app/common/utils";
import { InvalidFileType, ModalAction } from "app/common/enums";
import { User } from "app/entities/user";
import { UserInfo } from "app/entities/userInfo";
import { HttpService } from "app/services/http.service";
import { ApplicationsService } from 'app/applications/applications.service';
import { FileService } from "app/applications/file.service";
import { EditFileComponent } from "./edit-file";
import { PageSpinnerService } from "app/components/page-spinner/page-spinner.service";

import { ArrayWidget, FormProperty, PropertyGroup } from "ngx-schema-form";
import { Subject } from "rxjs";
import { takeUntil } from 'rxjs/operators';
import { saveAs } from 'file-saver';

import Swal, { SweetAlertResult } from "sweetalert2";
import * as _ from 'lodash';

@Component({
    selector: "app-files-array-widget",
    templateUrl: "./files-array-widget.html",
    styleUrls: ['./files-array-widget.scss'],
    providers: [
        { provide: FileService, useExisting: ApplicationsService },
    ]
})

export class MatFilesArrayWidget extends ArrayWidget {

    step = 0;
    sendableFormData: FormData = new FormData();
    files: File[] = [];
    uploading = false;
    appConstants = AppConstants;
    constants = Constants;
    user = '';
    property: FormProperty;
    userInfo: UserInfo;
    parentGuardians: PropertyGroup;
    private unsubscribe = new Subject<void>();
    isSchoolContact: boolean;
    sectionId = '';
    docId = '';
    formId = '';
    shortInfo = '';
    private supportedFileFormats = `Supported file formats: ${this.appConstants.allowedAppModuleFileExtentions.join(', ')}`;
    br = '\n\n';
    dateDelimiterTime = this.constants.localeFormats.dateDelimiterTime;
    baseDropValid: boolean;

    constructor(
        private httpService: HttpService,
        private route: ActivatedRoute,
        private fileService: FileService,
        private modalService: NgbModal,
        private platformLocation: PlatformLocation,
        private pageSpinnerService: PageSpinnerService,
        @Optional() @Inject('showDocInfo') public showDocInfo = false) {
        super();
    }

    ngAfterViewInit() {
        super.ngAfterViewInit();
        this.docId = this.route.params['value'].id;
        this.formId = this.route.params['value'].formId;
        this.sectionId = this.formProperty.parent.path.split('/').pop();
        this.userInfo = Utils.getUserInfoFromToken();
        this.isSchoolContact = this.userInfo.isSchoolContact();
        if (this.isSchoolContact) {
            const parent: PropertyGroup = this.formProperty.findRoot();
            this.parentGuardians = parent.getProperty('parentGuardiansForm/parentGuardians');
            this.parentGuardians.valueChanges.pipe(takeUntil(this.unsubscribe)).subscribe(() => {
                this.user = `${this.parentGuardians?.value[0]?.firstName || ''} ${this.parentGuardians?.value[0]?.lastName || ''}`
            });
            this.shortInfo = this.supportedFileFormats;
        } else {
            this.httpService.getAuth('users/get-current').then((user: User) => {
                this.user = `${user.lastName} ${user.firstName}`;
                this.shortInfo = this.supportedFileFormats + this.br + this.constants.virusWarning;
            }).catch(error => { throw error });
        }
    }

    fileChangeEvent(files) {
        const dateTimeUpload = new Date().toUTCString();
        this.files.forEach((file) => {
            if (!_.includes(this.appConstants.allowedAppMpduleFileTypes, file.type)) {
                Utils.showNotification(`File format for ${file.name} is not supported`, Colors.warning);
            } else {
                this.sendableFormData.append('file', file);
            }
        });
        this.files = _.filter(this.files, file => _.includes(this.appConstants.allowedAppMpduleFileTypes, file.type))
        if (!_.isEmpty(this.files)) {
            this.uploadAppFiles().then((namesMapping) => {
                this.files.forEach((file) => {
                    // When we upload a file from our phone camera, it does not have name, so we rename it to 'photo.jpeg' in backend
                    const newName = _.find(namesMapping, name => name.oldName === file.name ? file.name : this.appConstants.photoDefaultName)?.newName
                    this.addItem();
                    this.formProperty.properties[this.step].setValue({
                        name: newName,
                        sizeInBytes: file.size,
                        dateTimeUpload,
                        notes: '',
                        user: this.user,
                        status: ''
                    }, false);
                });
                this.endAction();
            });
        }
    }

    addItem() {
        this.step = +this.formProperty.properties.length;
        super.addItem();
    }

    lastInvalidsChange(invalidFiles) {
        if (invalidFiles) {
            invalidFiles.forEach(invalid => {
                switch (invalid.type) {
                    case InvalidFileType.accept:
                        Utils.showNotification(`File format for ${invalid.file.name} is not supported`, Colors.warning);
                        break;
                    case InvalidFileType.fileSize:
                        Utils.showNotification(`${invalid.file.name} exceeds the maximum file size for upload`, Colors.warning);
                        break;
                }
            });
        }
    }

    renameIfNeeded(nameToBeChanged: string, existingFileNames: string[], originalName: string, i: number): string {
        if (_.includes(existingFileNames, nameToBeChanged)) {
            const ext = originalName.split('.').pop() ? '.' + originalName.split('.').pop() : '';
            const nameWithoutExtention = originalName.slice(0, -(ext.length));
            nameToBeChanged = `${nameWithoutExtention}_${i}${ext}`;
            return this.renameIfNeeded(nameToBeChanged, existingFileNames, originalName, i + 1);
        }
        return nameToBeChanged;
    }

    uploadAppFiles() {
        this.uploading = true;
        const promise = this.fileService.uploadAppFiles(this.docId, this.formId, this.sectionId, this.sendableFormData, this.user).then((namesMapping) => {
            Utils.showSuccessNotification('File succesfully uploaded.');
            return namesMapping;
        }).catch((err) => {
            console.log(err);
            Utils.showNotification('File upload error.', Colors.danger);
            this.endAction();
        });
        this.pageSpinnerService.display(promise, 'File is uploading...');
        return promise;
    }

    endAction() {
        this.files = [];
        this.uploading = false;
        this.sendableFormData = new FormData();
    }

    removeAppFile(property): Promise<boolean> {
        if (this.isSchoolContact) {
            this.pageSpinnerService.display(this.deleteAppFile(property), 'File is being deleted...');
        } else {
            return Utils.deletedQuestion().then((result: SweetAlertResult) => {
                if (!result?.value) {
                    return Promise.resolve(false);
                }
                this.pageSpinnerService.display(this.deleteAppFile(property), 'File is being deleted...');
            });
        }
    }

    private deleteAppFile(property: FormProperty): Promise<void> {
        return this.fileService.removeAppFile(this.docId, this.formId, this.sectionId, property.value.name).then(() => {
            this.removeItem(property);
            Utils.showSuccessNotification('File succesfully deleted.');
        }).catch((err) => {
            console.log(err);
        });
    }

    removeItem(property) {
        this.step = this.step - 1;
        super.removeItem(property);
    }

    downloadAppFile(property) {
        return this.fileService.downloadAppFile(this.docId, this.formId, this.sectionId, property.value.name).then((result) => {
            const data = result['data'].data;
            const metaData = result['metaData'];
            this.saveByteArray(data, metaData);
            Utils.showSuccessNotification('File succesfully downloaded.');
        }).catch((err) => {
            console.log(err);
        });
    }

    saveByteArray(buffer, metaData) {
        const name = _.last(_.split(metaData.name, '/'));
        const type = metaData.contentType;
        const blob = new Blob([new Uint8Array(buffer, 0, buffer.length)], { type });
        return saveAs(blob, name);
    }

    editDocument(property) {
        this.property = property;
        const modalEditDocument = this.modalService.open(EditFileComponent, this.constants.ngbModalMd);
        modalEditDocument.componentInstance.notes = this.property.value.notes;
        modalEditDocument.componentInstance.statusComplete = this.property.value.status === 'Complete';
        modalEditDocument.componentInstance.property = this.property;
        modalEditDocument.result.then((res: { action: ModalAction, notes?: string, statusComplete?: boolean }) => {
            switch (res.action) {
                case ModalAction.Update:
                    this.updateFileInfo(res.notes, res.statusComplete);
                    return;
                default:
                    break;
            }
        });
        this.platformLocation.onPopState(() => {
            modalEditDocument.close({ action: ModalAction.LeavePage });
        });
    }

    updateFileInfo(notes: string, statusComplete: boolean) {
        const propValue = this.property.value;
        propValue.notes = notes;
        propValue.status = statusComplete ? 'Complete' : '';
        this.property.setValue(propValue, false);
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

}

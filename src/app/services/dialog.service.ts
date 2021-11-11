import { Injectable } from '@angular/core';
import { PageLeaveReason } from '../common/enums';
import Swal from 'sweetalert2';

declare var $: any;

@Injectable({
    providedIn: 'root',
})
export class DialogService {

    public doConfirm(msg: string, showSaveButton: boolean = true): Promise<number> {
        return new Promise((resolve) => {
            const buttons = $('<div><h4>' + msg + '</h4><br/>')
                .append(this.addButton('Go back', 'cancel pageLeaveGoBackBtn'))
                .append(this.addButton('Don\'t save', 'danger pageLeaveLeaveBtn'))
                .append(this.addButton('Save', 'success pageLeaveSaveBtn', !showSaveButton));

            Swal.fire({
                title: '',
                html: buttons,
                type: 'warning',
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false,
                onOpen: (swal1) => {
                    $(swal1).find('.pageLeaveSaveBtn').off().click((e) => {
                        Swal.close();
                        return resolve(PageLeaveReason.save);
                    });
                    $(swal1).find('.pageLeaveGoBackBtn').off().click((e) => {
                        Swal.close();
                        return resolve(PageLeaveReason.goBack);
                    });
                    $(swal1).find('.pageLeaveLeaveBtn').off().click((e) => {
                        Swal.close();
                        return resolve(PageLeaveReason.doNotSave);
                    });
                }
            });
        });
    }

    private addButton(name: string, color: string, disabled = false) {
        const dsbld = (disabled) ? 'disabled' : '';
        return $('<button class="btn btn-' + color + '" ' + dsbld + '>' + name + '</button>');
    }

}

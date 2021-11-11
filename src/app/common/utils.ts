import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { ChangeDetectorRef, NgZone } from '@angular/core';
import { DialogService } from '../services/dialog.service';

import { Constants } from './constants';
import { IPersonalTour, ISchoolModule, ContactClaim } from './interfaces';
import { PageLeaveReason, ManagementSystemCode } from './enums';
import { Keys } from './keys';
import { T as translation } from './t';

import { UserInfo } from '../entities/userInfo';
import { PersonalTour } from '../entities/personal-tour';
import { Event } from '../entities/event';
import { Campus } from '../entities/campus';
import { User } from '../entities/user';
import { School } from '../entities/school';
import { ListItem } from '../entities/list-item';
import { CurrentSchool } from '../entities/current-school';
import { ISelectedItem } from '../entities/slected-items';
import { ChartData } from '../entities/local/chart-data';
import { Series } from '../entities/local/series';
import { Translation } from 'app/entities/translation';
import { YearLevel } from 'app/entities/year-level';
import { Student } from 'app/entities/student';
import { EmailTemplate } from 'app/entities/email-template';
import { EventEmail } from 'app/entities/event-email';
import { CustomHttpParams } from 'app/entities/custom-http-params';

import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as tinymce from 'tinymce';
import 'moment-timezone';
import Swal from 'sweetalert2';
import { environment } from 'environments/environment';

declare var $: any;

export enum LogLevel {
    log,
    warning,
    error,
    hide
}

export class Utils {
    private static timeZoneRE: RegExp = /.*\+([0-9]{2}):([0-9]{2})/;

    public static getLocalDateTimeFromUtc(
        dateTime: moment.Moment, timeZoneMinuts: number, outputFormat: string = Constants.dateFormats.date): string {
        return dateTime.utcOffset(timeZoneMinuts).format(outputFormat); // TODO use moment for this and not some custom calculation
    }

    public static getUserInfoFromToken(): UserInfo {
        const token = Utils.getToken();
        let userInfo: UserInfo = null;
        if (token) {
            const userData: string[] = token.split('.');
            const userInfoJson = JSON.parse(atob(userData[1])).claims as UserInfo; // cast json data
            userInfo = new UserInfo(
                userInfoJson.id,
                userInfoJson.role,
                userInfoJson.schoolId,
                userInfoJson.schoolUniqId,
                userInfoJson.campusId,
                userInfoJson.mainCampusId,
                userInfoJson.undecidedCampusId,
                userInfoJson.specificCampusId,
                userInfoJson.managementSystemId,
                userInfoJson.eventId,
                userInfoJson.locale
            );
        }
        return userInfo;
    }

    public static getContactInfoFromToken(): ContactClaim {
        const token = Utils.getToken();
        let contactClaim: ContactClaim = null;
        if (token) {
            const userData: string[] = token.split('.');
            contactClaim = JSON.parse(atob(userData[1])).claims as ContactClaim; // cast json data
        }
        return contactClaim;
    }

    public static setPerPage(domId: string) {
        $(domId).on('length.dt', function (e, settings, len) {
            localStorage.setItem('pageSize', len.toString());
        });
    }

    public static getPageSize(): number {
        const pageSize = localStorage.getItem('pageSize') || Constants.defaultItemsShownInTable;
        return Number(pageSize);
    }

    public static setPageSize(size: number) {
        localStorage.setItem('pageSize', size.toString());
    }

    public static getToken(): string | null {
        try {
            return localStorage.getItem('token');
        } catch (e) {
            return null;
        }
    }

    public static setToken(token: string) {
        localStorage.setItem('token', token);
    }

    public static logout(router: Router) {
        if (localStorage.getItem('token') != null) {
            Utils.showNotification('Your session has expired and you have automatically been logged out.', Colors.danger);
            localStorage.removeItem('token');
            Utils.resetSession();
        }
        router.navigate(['noAuth/login']);
    }

    public static refreshPage(router: Router, pageRoute: any[]): Promise<any> {
        return router.navigate(['/dashboard/sendback'], { replaceUrl: true }).then(() => {
            return router.navigate(pageRoute, { replaceUrl: true });
        });
    }

    /**
     * Custom function for notifications
     * @param msg
     * @param color color can be (danger|sucess|info|warning|rose|primary)
     * @param y (top | bottom)
     * @param x (left | center | right)
     */
    public static showNotification(msg: string = 'Unknown Error', color: string, y = 'top', x = 'center') {
        $.notify(
            {
                icon: 'notifications',
                message: msg
            },
            {
                type: color,
                delay: Constants.showNotificationInMs,
                placement: {
                    from: y,
                    align: x
                },
                newest_on_top: true,
                z_index: 1055,
                template: `
                    <div data-notify="container" class="col-11 col-sm-3 alert alert-{0}" role="alert">
                        <button mat-raised-button type="button" aria-hidden="true" class="close" data-notify="dismiss">  <i class="material-icons">close</i></button>
                        <span data-notify="message">{2}</span>
                    </div>
                `
            }
        );
    }

    public static log(logValue: string, logLevel: LogLevel) {
        switch (logLevel) {
            case LogLevel.log: console.log(logValue); break;
            case LogLevel.warning: console.warn(logValue); break;
            case LogLevel.error: console.error(logValue); break;
            case LogLevel.hide: ; break;
        }

    }

    public static showSuccessNotification(msg?: string) {
        Utils.showNotification((msg) ? msg : 'Changes successfully saved', Colors.success);
    }

    /** get id from table row */
    public static getClickedRowInfo(event, jquery_self, table) {
        event.preventDefault();
        let $tr = null;
        if (jquery_self.closest('tr.child').prev().length) {
            $tr = jquery_self.closest('tr.child').prev();
        } else {
            $tr = jquery_self.closest('tr[role="row"]');
        }
        const tableRow = table.row($tr);
        const id = _.parseInt(tableRow.data()[1]);
        return { id: id, tableRow: tableRow };
    }

    /** delete item from table */
    public static deleteItem(event, jquery_self, table, url, httpService): Promise<any> {
        return Utils.deletedQuestion().then((result) => {
            if (result && result.value) {
                const rowInfo = Utils.getClickedRowInfo(event, jquery_self, table);
                return httpService.getAuth(url + rowInfo.id).then(() => {
                    rowInfo.tableRow.remove().draw();
                    return this.deletedSuccessfully().then(() => {
                        return Promise.resolve(true);
                    });
                });
            } else {
                return Promise.resolve(false);
            }
        });
    }

    public static delete(url, id, httpService): Promise<any> {
        return Utils.deletedQuestion().then((result) => {
            if (result && result.value) {
                return httpService.getAuth(url + id).then(() => {
                    return this.deletedSuccessfully().then(() => {
                        return Promise.resolve(true);
                    });
                });
            } else {
                return Promise.resolve(false);
            }
        });
    }

    public static TryParseNumbersFromArray(stringArray: string[], defaultValue = null): Array<number | null> {
        const returnArray: Array<number | null> = [];
        stringArray.forEach((str) => {
            returnArray.push(Utils.TryParseNumber(str));
        })
        return returnArray;
    }

    public static TryParseNumber(str: string, defaultValue = null): number | null {
        let retValue = defaultValue;
        if (str !== null) {
            if (str.length > 0) {
                retValue = parseInt(str, 10);
            }
        }
        return retValue;

    }

    public static deletedSuccessfully() {
        return Swal.fire({
            title: 'Deleted!',
            text: 'Your item(s) has been deleted.',
            type: 'success',
            confirmButtonClass: 'btn btn-success',
            buttonsStyling: false
        });
    }

    /**
     * @param html start with br tag
     */
    public static deletedQuestion(html = '') {
        return Swal.fire({
            title: 'Are you sure?',
            html: `You won\'t be able to revert this!${html}`,
            type: 'warning',
            showCancelButton: true,
            confirmButtonClass: 'btn btn-delete',
            cancelButtonClass: 'btn btn-cancel',
            confirmButtonText: 'Yes, delete it!',
            buttonsStyling: false
        });
    }

    public static multipleDeletedSuccess() {
        return Swal.fire({
            title: 'Deleted!',
            text: 'Your item(s) has been deleted.',
            type: 'success',
            confirmButtonClass: 'btn btn-success',
            buttonsStyling: false
        });
    }

    /**
     * @param html start with br tag
     */
    public static multipleDeletedQuestion(countItems: number, html = '') {
        return Swal.fire({
            title: 'Are you really sure?',
            html: `All ${countItems} item(s) you selected will be deleted.${html}`,
            type: 'warning',
            showCancelButton: true,
            confirmButtonClass: 'btn btn-delete',
            cancelButtonClass: 'btn btn-cancel',
            confirmButtonText: 'Yes, delete item(s)!',
            buttonsStyling: false
        });
    }

    public static unlinkQuestion() {
        return Swal.fire({
            title: 'Are you sure?',
            text: 'Are you sure you wish to unlink this related contact?',
            type: 'warning',
            showCancelButton: true,
            confirmButtonClass: 'btn btn-delete',
            cancelButtonClass: 'btn btn-cancel',
            confirmButtonText: 'Yes, unlink it!',
            buttonsStyling: false
        });
    }

    public static mergeWarning(entityName: string) {
        return Swal.fire({
            title: 'Unable to Merge',
            text: `There is more than one ${entityName} with an application. As a result, you are not able to merge unless the additional applications are removed.`,
            type: 'warning',
            confirmButtonClass: 'btn btn-success',
            confirmButtonText: 'ok',
            buttonsStyling: false
        });
    }

    public static unlinkedSuccess() {
        return Swal.fire({
            title: 'Unlinked!',
            text: 'Item has been unlinked.',
            type: 'success',
            confirmButtonClass: 'btn btn-success',
            buttonsStyling: false
        });
    }

    public static missingCodeDialog(isExport: boolean, missingFields: string[]) {
        const fieldNames: string[] = [];
        _.forEach(missingFields, i => {
            switch (i) {
                case Keys.schoolIntakeYear: fieldNames.push('SeekingEnrolmentInYearLevel'); break;
                case Keys.studentStatus: fieldNames.push('EnquiryStatus'); break;
                case Keys.leadSource: fieldNames.push('EnquirySource'); break;
                case Keys.hearAboutUs: fieldNames.push('HowDidYouHearAboutUs'); break;
                default: fieldNames.push(_.upperFirst(i)); break;
            }
        });

        const str1 = isExport ? 'export' : 'download';
        const str2 = isExport
            ? 'As a result, you may not have all the necessary data when importing to your Student Information System'
            : 'If you decide to import this exported file you will lose the information for these fields';
        return Swal.fire({
            title: 'Notification!',
            html: 'This ' + str1 + ' will not contain the corresponding codes for the following fields:<br><u><small>' +
                _.join(fieldNames, ',<br>') +
                '</small></u><br>' + str2 + '!',
            type: 'warning',
            showCancelButton: true,
            confirmButtonClass: 'btn btn-success',
            cancelButtonClass: 'btn btn-cancel',
            confirmButtonText: 'Continue',
            buttonsStyling: false
        });
    }

    public static clone(obj: Object) {
        return JSON.parse(JSON.stringify(obj));
    }

    public static getCurrentCampusTimeZoneId(campuses: Campus[], userCampusId: number = null) {
        const mainCampus: Campus = _.find(campuses, c => c.campusType === Campus.CAMPUS_TYPE_MAIN);
        const currentCampus: Campus = userCampusId === null ? mainCampus : _.find(campuses, c => c.id === userCampusId);
        return (currentCampus.campusType === Campus.CAMPUS_TYPE_MAIN || currentCampus.campusType === Campus.CAMPUS_TYPE_UNDECIDED)
            ? mainCampus.timeZoneId
            : currentCampus.timeZoneId;
    }

    public static canDeactivate(changed: number, submitted: boolean, contactFormValid: boolean, msg = 'Are you sure you want to leave without saving changes?'): Promise<number> {
        const dialogService: DialogService = new DialogService();
        if (changed < 1) {
            return Promise.resolve(PageLeaveReason.doNotSave);
        } else {
            if (submitted) {
                return Promise.resolve(PageLeaveReason.save);
            } else {
                return dialogService.doConfirm(msg, contactFormValid);
            }
        }
    }

    public static arrayZeroItemsToNull(array: number[]) {
        return _.map(array, i => (i === 0) ? null : i);
    }

    public static getStartingYears(earliestStartYear?: number): number[] {
        const startingYears: number[] = [];
        const currentYear = new Date().getFullYear();
        // always have range from earliest starting year in db to current year + 20
        const firstYear = earliestStartYear || currentYear;
        const lastYear = currentYear + Constants.durationStartingYear;
        for (let i = firstYear; i <= lastYear; i++) {
            startingYears.push(i);
        }
        return startingYears;
    }

    public static getStartingYear(startingMonth: number): number {
        return Utils.getNextStartingYear(startingMonth) - 1;
    }

    public static getNextStartingYear(startingMonth: number): number {
        const currentDate = new Date();
        return currentDate.getMonth() >= startingMonth ? currentDate.getFullYear() + 1 : currentDate.getFullYear();
    }

    public static getCurrentAndPastYears(durationYears: number, earliestStartYear?: number): number[] {
        const years: number[] = [];
        const currentYear = new Date().getFullYear();
        const lastYear = currentYear - durationYears;
        const firstYear = earliestStartYear != null && earliestStartYear < currentYear ? earliestStartYear : currentYear;
        for (let i = firstYear; i >= lastYear; i--) {
            years.push(i);
        }
        return years;
    }

    public static getBaseUrl() {
        return location.origin;
    }

    // tslint:disable-next-line:comment-format
    //https://stackoverflow.com/questions/326069/how-to-identify-if-a-webpage-is-being-loaded-inside-an-iframe-or-directly-into-t
    public static inIframe(): boolean {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    }

    public static getFormSubmissionMessage(): string {
        let formSubmissionMessage = 'Thank you, your information has been successfully submitted.';
        console.log(`submitted succesfully isIos: ${Utils.isIosMobile()} inIframe:${Utils.inIframe()}`);
        if (Utils.isIosMobile() && !Utils.inIframe()) {
            formSubmissionMessage = formSubmissionMessage + ' You can close this tab now.'
        }
        return formSubmissionMessage;
    }

    public static getIframe(widgetType: number, widgetId: number, uniqId: string, formId?: string) {
        const formIdParam = formId ? ` data-form-id="${formId}"` : '';
        const htmlCode =
            `<!-- ${environment.brand.name} Form Code. Paste the below div where you want the form (or button) to appear -->
<div class="et-widget" data-widget-type="${widgetType}" data-widget-id="${widgetId}"${formIdParam}></div>

<!-- ${environment.brand.name} Form Code. Paste the below code at the end of your page, typically as part of your footer -->
<script>
    (function (document) {
        var loader = function () {
            var script = document.createElement("script"), tag = document.getElementsByTagName("script")[0];
            script.src = '${Utils.getBaseUrl()}/api/noAuth/widget/getWidgetScriptForSchool/${uniqId}';
            tag.parentNode.insertBefore(script, tag);
            script.onerror= function() {
                etWidgetDivs = document.getElementsByClassName('et-widget');
                var testDivs = Array.prototype.filter.call(etWidgetDivs, function(etWidgetDiv) {
                    etWidgetDiv.innerHTML = '<p><span style="color:red">${translation.underMaintenanceMsgForForms}</span></p>';
                });
            }
        };
        document.addEventListener("DOMContentLoaded", loader);
    })(document);
</script>`;
        return htmlCode;
    }

    public static DetectChanges(ref: ChangeDetectorRef) {
        if (!ref['destroyed']) {
            Utils.log('detecting changes, in zone:' + NgZone.isInAngularZone(), LogLevel.hide);
            ref.detectChanges();
        }
    }

    public static focusOnSearch(htmlId) {
        $(document).on('shown.bs.modal', '#' + htmlId, () => {
            $('#full-width-filter input.search-field').focus();
        });
    }

    public static isInZone(marker: string = '') {
        console.log(marker + ': in zone:' + NgZone.isInAngularZone());
    }

    public static resetSession() {
        sessionStorage.clear();
    }

    public static destroyTinyMCE(id: string) {
        Utils.log('dispose of tinymce', LogLevel.hide);
        // https://stackoverflow.com/questions/17759111/tinymce-4-remove-or-destroy
        tinymce.remove();
        tinymce.execCommand('mceRemoveControl', true, id);
    }

    public static disposeModal(id: string) {
        Utils.log('disposing modal' + id, LogLevel.hide);
        $(id).modal('dispose');
    }

    public static reverseAddress(a) {
        if ($.trim(a) !== '') {
            const address = a.split(', ');
            const city = $.trim(address[0]);
            const state = $.trim(address[1]);
            return (state + ', ' + city);
        }
        return '';
    }


    public static replaceTag(str: string, tag: string, text: string) {
        return str.replace(new RegExp('\\' + tag, 'gm'), text);
    }

    public static replaceEmailSignatureTag(kit: string, user: User, school: School) {
        kit = Utils.replaceTag(kit, '&lt; EMAIL SIGNATURE &gt;', school.emailSignature.signature);
        kit = Utils.replaceTag(kit, '&lt; USER NAME &gt;', `${user?.firstName ?? ''} ${user?.lastName ?? ''}`);
        kit = Utils.replaceTag(kit, '&lt; USER TITLE &gt;', user?.title ?? '');
        kit = Utils.replaceTag(kit, '&lt; USER EMAIL &gt;', user?.email ?? '');
        if (school) {
            kit = Utils.replaceTag(kit, '&lt; SCHOOL NAME &gt;', school?.name ?? '');
            kit = Utils.replaceTag(kit, '&lt; SCHOOL ADDRESS &gt;', school?.address ?? '');
            kit = Utils.replaceTag(kit, '&lt; SCHOOL CITY &gt;', school?.city ?? '');
            kit = Utils.replaceTag(kit, '&lt; SCHOOL STATE &gt;', school?.administrativeArea?.name ?? '');
            kit = Utils.replaceTag(kit, '&lt; SCHOOL POSTCODE &gt;', school?.postCode ?? '');
        }
        return kit;
    }

    // Functions for Table
    public static createTable(head, rows, caption) {
        return '<div class="table-responsive"><table class="table table-sm">'
            + this.addElement(caption, 'caption')
            + this.addElement(head, 'thead')
            + this.addElement(rows, 'tbody')
            + '</table></div>';
    }

    public static addTableHead(headRow: string[]) {
        let cols = '';
        _.forEach(headRow, h => { cols += this.addElement(h, 'th'); });
        return this.addElement(cols, 'tr');
    }

    public static addTableRow(rowColumns: string[]) {
        let cols = '';
        _.forEach(rowColumns, c => { cols += this.addElement(c, 'td'); });
        return this.addElement(cols, 'tr');
    }

    private static addElement(value: string, tagName: string) {
        return '<' + tagName + '>' + value + '</' + tagName + '>';
    }

    public static logConditionally(doLog: boolean, log: string) {
        if (doLog) {
            console.log(log);
        }
    }

    /**
     * Note that for events (and personal tours) the events is considered a future event
     * only if it starts on the next day or later (in the time zone of the campus).
     * @param eventOrPersonalTour event or personalTour with local date and time in the campus time zone
     * @param timeZoneId time zone of the campus
     */
    public static isFutureEventOrPersonalTour(eventOrPersonalTour: Event | PersonalTour | IPersonalTour, timeZoneId: string): boolean {
        return !this.isPastEventOrPersonalTour(eventOrPersonalTour, timeZoneId);
    }

    /**
     * Note that for events (and personal tours) the events is considered a past event
     * only when the day has passed (where the day ends at 24:00 in the time zone of the campus).
     * @param eventPersonalTour event or personalTour with local date and time in the campus time zone
     * @param timeZoneId time zone of the campus
     */
    public static isPastEventOrPersonalTour(eventOrPersonalTour: Event | PersonalTour | IPersonalTour, timeZoneId: string): boolean {
        const endOfEventDay = moment.tz(eventOrPersonalTour.date, timeZoneId).endOf('day');
        return endOfEventDay.isBefore();
    }

    public static filterFutureEventPersonalTours(
        eventsPersonalTours: Array<Event | PersonalTour | IPersonalTour>, campuses: Campus[]
    ): Array<Event | PersonalTour | IPersonalTour> {
        return _.filter(eventsPersonalTours, (eventOrPersonalTour: Event | PersonalTour | IPersonalTour) => {
            const timeZoneId: string = _.find(campuses, (campus: Campus) => campus.id === eventOrPersonalTour.campusId).timeZoneId;
            const isFuture = this.isFutureEventOrPersonalTour(eventOrPersonalTour, timeZoneId);
            eventOrPersonalTour.isFuture = isFuture;
            return isFuture;
        });
    }

    public static getGoogleTagManagerHeader(googleTrackingId: string) {
        return `
            <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer', '` + googleTrackingId + `');</script>
        `;
    }

    public static getGoogleTagManagerBody(googleTrackingId: string) {
        return `
            <noscript>
            <iframe src="https://www.googletagmanager.com/ns.html?id=` + googleTrackingId + `" height="0" width="0" style="display:none;visibility:hidden"></iframe>
            </noscript>
        `;
    }

    public static getIncludedInList(listItems: ListItem[], selectedIds: number[]) {
        let filteredListItems: ListItem[] = [];
        if (_.isArray(listItems) && listItems.length > 0) {
            filteredListItems = _.filter(listItems, i => (i.includeInList || _.includes(selectedIds, i.id)));
            if (listItems[0].list && listItems[0].list.listSetting && listItems[0].list.listSetting.displayOther) {
                filteredListItems.push(ListItem.getListItemOther());
            }
        }
        return filteredListItems;
    }

    public static getIncludedInListCurrentSchools(currentSchools: CurrentSchool[], selectedIds: number[], displayOther: boolean) {
        let filteredCurrentSchools: CurrentSchool[] = [];
        if (_.isArray(currentSchools) && currentSchools.length > 0) {
            filteredCurrentSchools = _.filter(currentSchools, i => (i.includeInList || _.includes(selectedIds, i.id)));
        }
        if (displayOther) {
            const other: CurrentSchool = new CurrentSchool();
            other.id = 0;
            other.schoolName = Constants.otherLabel
            filteredCurrentSchools.push(other);
        }
        return filteredCurrentSchools;
    }

    /**
     * Removes items with id less the 0 (custom user items)
     * @param arrays Array<Array<ListItem | CurrentSchool>>
     */
    public static removeCustomItems(arrays: Array<Array<ListItem | CurrentSchool>>) {
        _.forEach(arrays, array => {
            _.remove(array, i => i.id < 0);
        });
    }


    public static selectItem(id: number, isChecked: boolean, selectedIds: number[]) {
        if (isChecked) {
            selectedIds.push(id);
        } else {
            _.pull(selectedIds, id);
        }
        return selectedIds;
    }

    public static selectAll<T extends ISelectedItem>(isChecked: boolean, items: T[], selectedIds: number[]) {
        _(items).forEach((item: T) => {
            item.selected = isChecked;
        });
        if (isChecked) {
            _.remove(selectedIds);
            _(items).forEach((item: T) => {
                selectedIds.push(item.id);
            });
        } else {
            _.remove(selectedIds);
        }
        return { items, selectedIds };
    }

    public static getElementOffsetTop(element) {
        return element.source._elementRef.nativeElement.getBoundingClientRect().top;
    }

    public static formatDate(formValues: any) {
        // strip the local timezone info, we just want raw
        return moment(formValues).format(Constants.dateFormats.date);
    }

    /* ios iphone/ipad cannot handle iframes without jumping, this solution should help a little bit
       https://stackoverflow.com/questions/34766636/ios-browser-iframe-jumps-to-top-when-changing-css-or-content-using-javascript
    */
    public static prepareIframeIos() {
        const isIosMobile = Utils.isIosMobile();
        const body: any = document.getElementsByTagName('BODY')[0];
        const html: any = document.getElementsByTagName('HTML')[0];
        if (isIosMobile) {
            const customCss = 'height: 100vh; overflow: auto; -webkit-overflow-scrolling:auto;';
            body.setAttribute('style', customCss);
            html.setAttribute('style', customCss);
        }
    }

    public static isIosMobile() {
        const userAgent = navigator.userAgent;
        const isIphone = userAgent.indexOf('iPhone') !== -1;
        const isIpod = userAgent.indexOf('iPod') !== -1;
        const isIpad = userAgent.indexOf('iPad') !== -1;

        // now set one variable for all iOS devices
        const isIosMobile = isIphone || isIpod || isIpad;
        return isIosMobile;
    }

    public static onElementHeightChange(element: any, idOnPage: string) {
        let lastHeight = 0, newHeight;
        (function run() {
            newHeight = element.clientHeight;
            if (lastHeight !== newHeight && newHeight !== 0) {
                const message = { name: 'resizeIframe', params: { height: newHeight, widgetId: idOnPage } };
                window.parent.postMessage(message, '*');
                // console.log('posted iframe message: ')
                // console.log(message)
            }
            lastHeight = newHeight;
            if (element.onElementHeightChangeTimer) {
                clearTimeout(element.onElementHeightChangeTimer);
            }
            if (Utils.isIosMobile()) {
                // since ios does not seem to handle
                if (newHeight === 0) {
                    element.onElementHeightChangeTimer = setTimeout(run, 200);
                }
            } else {
                element.onElementHeightChangeTimer = setTimeout(run, 200);
            }
        })();
    }

    public static getLocalTimeFromUtc(dateTimeUTC: string, inputFormat: string | null, timeZone: string, outputFormat: string): string {
        return Utils.convertTime(dateTimeUTC, inputFormat, Constants.UTCTimeCode, timeZone, outputFormat)
    }

    public static getUtcTimeFromLocal(dateTime: string, inputFormat: string | null, timeZone: string, outputFormat: string): string {
        return Utils.convertTime(dateTime, inputFormat, timeZone, Constants.UTCTimeCode, outputFormat);
    }


    public static convertTimeOutputMoment(
        dateTime: string, inputFormat: string | null, inputTimeZoneString: string, outputTimeZoneString: string): moment.Moment {
        // console.log('converting dateTime input:' + dateTime + " inputTimeZoneString: " + inputTimeZoneString +
        // " outputTimeZoneString: " + outputTimeZoneString);
        let myMoment: moment.Moment | null = null;

        if (inputFormat != null) {
            myMoment = moment.tz(dateTime, inputTimeZoneString);
        } else {
            myMoment = moment.tz(dateTime, inputFormat, inputTimeZoneString);
        }
        const convertedMoment: moment.Moment = myMoment.clone().tz(outputTimeZoneString);
        return convertedMoment;
    }

    public static convertTime(
        dateTime: string, inputFormat: string | null, inputTimeZoneString: string, outputTimeZoneString: string, outputFormat: string
    ): string {
        const myMoment: moment.Moment = Utils.convertTimeOutputMoment(dateTime, inputFormat, inputTimeZoneString, outputTimeZoneString)
        const output: string = myMoment.format(outputFormat);

        return output;
    }

    /**
     * Extracts the date out of a date time in the timezone of the browser
     * @param dateTime  Date object or parseable date string
     * @returns         String date with YYYY-MM-DD format or null when input is not a valid date
     */
    public static getDateOnly(dateTime: Date | string): string {
        const mDateTime = moment(dateTime);
        return (mDateTime.isValid()) ? mDateTime.format(Constants.dateFormats.date) : null;
    }

    public static export2Csv(data: string, fileName: string) {
        const blob = new Blob([data], { type: 'text/csv' });
        return saveAs(blob, _.replace(fileName, / /g, '_') + '.csv');
    }

    /**
    * @param startTime - a non-null start time
    * @param endTime - the end time or `null`
    * @returns True if start time is before end time or end time is null
    */
    public static startTimeIsBeforeEndTime(startTime: string, endTime: string) {
        if (!endTime) {
            return true;
        }
        return moment(startTime, 'h:mm').isBefore(moment(endTime, 'h:mm'));
    }

    public static isMobileSize() {
        return ($(window).width() > 991) ? false : true;
    }

    public static addClassName(chartData: ChartData) {
        const colors: string[] = Constants.colors.slice();
        _.forEach(chartData.series, (s: Series) => {
            switch (s.legend.name) {
                case 'Feeder': s.className = 'text-primary'; _.pull(colors, 'text-primary'); break;
                case 'Non-Feeder': s.className = 'text-success'; _.pull(colors, 'text-success'); break;
                case translation.unknown: s.className = 'text-warning'; _.pull(colors, 'text-warning'); break;
                case 'Other': s.className = 'text-warning'; _.pull(colors, 'text-warning'); break;
                case 'Year 1':
                case '1st Grade':
                    s.className = 'text-info'; _.pull(colors, 'text-info'); break;
                case 'Year 2':
                case '2nd Grade':
                    s.className = 'text-danger'; _.pull(colors, 'text-danger'); break;
                case 'Year 3':
                case '3rd Grade':
                    s.className = 'text-primary'; _.pull(colors, 'text-primary'); break;
                case 'Year 4':
                case '4th Grade':
                    s.className = 'text-success'; _.pull(colors, 'text-success'); break;
                case 'Year 5':
                case '5th Grade':
                    s.className = 'text-six'; _.pull(colors, 'text-six'); break;
                case 'Year 6':
                case '6th Grade':
                    s.className = 'text-seven'; _.pull(colors, 'text-seven'); break;
                case 'Year 7':
                case '7th Grade':
                    s.className = 'text-eight'; _.pull(colors, 'text-eight'); break;
                case 'Year 8':
                case '8th Grade':
                    s.className = 'text-nine'; _.pull(colors, 'text-nine'); break;
                case 'Year 9':
                case '9th Grade':
                    s.className = 'text-ten'; _.pull(colors, 'text-ten'); break;
                case 'Year 10':
                case '10th Grade':
                    s.className = 'text-eleven'; _.pull(colors, 'text-eleven'); break;
                case 'Year 11':
                case '11th Grade':
                    s.className = 'text-twelve'; _.pull(colors, 'text-twelve'); break;
                case 'Year 12':
                case '12th Grade':
                    s.className = 'text-thirteen'; _.pull(colors, 'text-thirteen'); break;
                case 'Interest': s.className = 'text-light-blue'; _.pull(colors, 'text-light-blue'); break;
                case 'Applicant': s.className = 'text-middle-blue'; _.pull(colors, 'text-middle-blue'); break;
                case 'Enroled':
                case 'Enrolled':
                    s.className = 'text-dark-blue'; _.pull(colors, 'text-dark-blue'); break;
                case 'Contacts': s.className = 'text-success'; _.pull(colors, 'text-success'); break;
                case 'Other attendees': s.className = 'text-warning'; _.pull(colors, 'text-warning'); break;
                case 'Male': s.className = 'text-info'; _.pull(colors, 'text-info'); break;
                case 'Female': s.className = 'text-danger'; _.pull(colors, 'text-danger'); break;
                case 'Yes': s.className = 'text-success'; _.pull(colors, 'text-success'); break;
                case 'No': s.className = 'text-danger'; _.pull(colors, 'text-danger'); break;
                default: s.className = ''; break;
            }
        });
        _.forEach(chartData.series, (s: Series) => {
            if (s.className === '') {
                s.className = colors.shift();
            }
        });
    }

    public static getClassNames(legends: string[]) {
        const colors: string[] = Constants.colors.slice();
        const classNames: string[] = [];
        _.forEach(legends, (legend: string) => {
            switch (legend) {
                case 'Male': classNames.push('text-info'); _.pull(colors, 'text-info'); break;
                case 'Female': classNames.push('text-danger'); _.pull(colors, 'text-danger'); break;
                case 'Yes': classNames.push('text-success'); _.pull(colors, 'text-success'); break;
                case 'No': classNames.push('text-danger'); _.pull(colors, 'text-danger'); break;
                case translation.unknown: classNames.push('text-warning'); _.pull(colors, 'text-warning'); break;
                default: classNames.push(''); break;
            }
        });
        _.forEach(classNames, (name: string, index) => {
            if (name === '') {
                classNames[index] = colors.shift();
            }
        });
        return classNames;
    }

    public static createSortCaseInsensitiveMatTable<T>(data: T[]): MatTableDataSource<T> {
        const dataSource = new MatTableDataSource<T>(data);
        dataSource.sortingDataAccessor = (item, sortHeaderId) => _.toLower(_.get(item, sortHeaderId));
        return dataSource;
    }

    public static getTranslation(translations: Translation[], prefix: string, id: string, subCategory: string, category: string): string {
        return _.find(translations, tr => tr.id === prefix + '_' + id && tr.subCategory === subCategory && tr.category === category).translation || '';
    }

    public static getUnixTimestamp(dateTime: string, inputFormat: string = Constants.dateFormats.dateTime): number {
        const momentDataTime = dateTime ? moment(dateTime, inputFormat) : null;
        return (momentDataTime && momentDataTime.isValid) ? momentDataTime.unix() : 0;
    }

    public static sanitize(input, replacement = '') {
        input = input.replace(/\s/g, '_');
        input = input.replace('.', '');
        const illegalRe = /[\/\?<>\\:\*\|":]/g;
        const controlRe = /[\x00-\x1f\x80-\x9f]/g;
        const reservedRe = /^\.+$/;
        const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
        const windowsTrailingRe = /[\. ]+$/;
        const sanitized = input
            .replace(illegalRe, replacement)
            .replace(controlRe, replacement)
            .replace(reservedRe, replacement)
            .replace(windowsReservedRe, replacement)
            .replace(windowsTrailingRe, replacement);
        return sanitized;
    }

    public static getEnumAsArray(givenEnum) {
        return _.keys(givenEnum).filter(key => !isNaN(+key)).map(key => ({ id: +key, name: givenEnum[+key] }));
    }

    public static getEnumValues(givenEnum) {
        return _.keys(givenEnum).filter(key => !isNaN(+key)).map(key => givenEnum[key]);
    }

    public static isMac(): boolean {
        return /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
    }

    public static getStandardOffset(zone: string) {
        // start with now
        const m = moment.tz(zone);
        // advance until it is not DST
        while (m.isDST()) {
            m.add(1, 'month');
        }
        // return the formatted offset
        return m.format('Z');
    }

    public static getEndTime(startTime, difference) {
        const startTimePlusOne = moment(startTime, Constants.dateFormats.hourMinutes).add(difference, 'seconds')
        const endTime = moment(startTimePlusOne, Constants.dateFormats.time).format(Constants.dateFormats.hourMinutes)
        return endTime
    }

    public static getTimeDifferenceInS(startTime: string, endTime: string) {
        let startTimeMoment = moment(startTime, Constants.dateFormats.hourMinutes);
        const endTimeMoment = moment(endTime, Constants.dateFormats.hourMinutes);
        if (!startTime) {
            startTimeMoment = endTimeMoment.clone()
            startTimeMoment.subtract('seconds', Constants.defaultTimeDifferenceInS)
        }
        return endTimeMoment.diff(startTimeMoment, 'seconds')
    }

    public static getStartingYearList(students: Student[]): number[] {
        return _(students).uniqBy(s => s.startingYear).map(s => s.startingYear).value();
    }

    public static getYearLevelList(students: Student[]): YearLevel[] {
        let yearLevels = _(students).uniqBy(s => s.schoolIntakeYearId).map(s => s.schoolIntakeYear).value();
        const yearLevelNull = _.remove(yearLevels, yl => !yl);
        yearLevels = _.sortBy(yearLevels, s => s.sequence);
        if (yearLevelNull.length) {
            yearLevels.push({ id: null, name: translation.unknown } as YearLevel);
        }
        return yearLevels;
    }

    public static isSchoolModuleEnabled(schoolModules: ISchoolModule[], moduleName: string) {
        const schoolModule = _.find(schoolModules, m => m.name === moduleName);
        return !!(schoolModule && schoolModule.isEnabled);
    }

    public static getCurrentCampusId(campusId: number, campuses: Campus[]): number {
        const mainCampus = _.find(campuses, c => c.campusType === Campus.CAMPUS_TYPE_MAIN);
        const currentCampus = _.find(campuses, c => c.id === campusId);
        return (currentCampus && currentCampus.campusType === Campus.CAMPUS_TYPE_UNDECIDED) ? mainCampus.id : campusId;
    }

    public static getLocationByCampus(campus: Campus): string {
        const location: string[] = [];
        const address = campus.address ? `${campus.address} \n` : '';
        if (campus.city) { location.push(campus.city) }
        if ((campus.administrativeArea && campus.administrativeArea.name) || campus.postCode) {
            const statePostCode: string[] = [];
            if (campus.administrativeArea && campus.administrativeArea.name) { statePostCode.push(campus.administrativeArea.name) }
            if (campus.postCode) { statePostCode.push(campus.postCode) }
            location.push(statePostCode.join(' '));
        }
        return address + location.join(', ');
    }

    public static getNameCode(userInfoOrSisId: UserInfo | number): string {
        let sisId: number;
        switch (typeof userInfoOrSisId) {
            case 'number':
                sisId = userInfoOrSisId;
                break;
            default:
                sisId = userInfoOrSisId.managementSystemId;
        }
        return sisId === ManagementSystemCode.synergetic ? 'Synergetic Code' : 'Code';
    }

    public static toStringEncoded(params: CustomHttpParams): string {
        return params.toString().replace('+', '%2B'); // https://github.com/angular/angular/issues/18261#issuecomment-338352188
    }

    public static sortEmailBySchedule<T extends EventEmail | EmailTemplate>(emails: T[]): T[] {
        return emails.sort((n1: T, n2: T) => {
            // anything that isImmediate will come first
            // therefore, negate the values so true is -1 and false is still 0
            const n1isImmediate = -n1.isImmediate;
            const n2isImmediate = -n2.isImmediate;
            const isImmediateCompare = n1isImmediate - n2isImmediate;

            if (isImmediateCompare !== 0 || (n1.isImmediate && n2.isImmediate)) {
                return isImmediateCompare;
            } else {
                return this.convertScheduleToNumber(n1) - this.convertScheduleToNumber(n2);
            }
        });
    }

    public static convertScheduleToNumber(schedule: { scheduleMoment: string, scheduleDays: number }): number {
        switch (schedule.scheduleMoment) {
            case EventEmail.SCHEDULE_MOMENT_PRIOR:
                return -schedule.scheduleDays;
            case EventEmail.SCHEDULE_MOMENT_AFTER:
                return schedule.scheduleDays;
            default:
                throw new Error(`Schedule moment '${schedule.scheduleMoment}' is not supported.`);
        }
    }

    public static exportAsExcelFile(json: any[], fileName: string): void {
        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
        const workbook: XLSX.WorkBook = {
            Sheets: { data: worksheet },
            SheetNames: ['data']
        };
        const excelBuffer: any = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array'
        });
        const data: Blob = new Blob([excelBuffer], {
            type: Constants.ChartContextMenuOptionConstant.csvType
        });
        saveAs(data, fileName);
    }

    public static async addToClipboard(url: string, mimeType = 'text/plain'): Promise<void> {
        try {
            // Safari treats user activation differently:
            // https://bugs.webkit.org/show_bug.cgi?id=222262.
            navigator.clipboard.write([
                new ClipboardItem({
                    [mimeType]: new Promise(async (resolve) => {
                        const data = await fetch(url);
                        const blob = await data.blob();
                        resolve(blob);
                    }) as unknown as Blob,
                }),
            ]);
        } catch {
            // Chromium
            const data = await fetch(url);
            const blob = await data.blob();
            navigator.clipboard.write([
                new ClipboardItem({
                    [blob.type]: blob,
                }),
            ]);
        }
    }

}



export class Colors {
    public static danger = 'danger';
    public static success = 'success';
    public static info = 'info';
    public static warning = 'warning';
    public static rose = 'rose';
    public static primary = 'primary';
}

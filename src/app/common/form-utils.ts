import { FormGroup, AbstractControl, FormControl, Validators } from '@angular/forms';

import { ListItem } from 'app/entities/list-item';
import { IntakeClassYear } from 'app/entities/intakeClassYear';
import { StudentStatus } from 'app/entities/student-status';
import { EnrolmentTarget } from 'app/entities/enrolmentTarget';
import { YearLevel } from 'app/entities/year-level';

import { HasAlumni, list_id } from './enums';
import { Constants } from './constants';
import { IFieldSetting, IControl } from './interfaces';

import * as _ from 'lodash';

export class FormUtils {

    public static phoneValidators = [
        Validators.pattern(Constants.phonePattern),
        Validators.minLength(5),
        Validators.maxLength(16)
    ];

    public static addStudentlistToForm(list: Array<ListItem>, listId: list_id, formJSON: Object): Array<ListItem> {
        return FormUtils.addlistToForm1(list, listId, formJSON, 'students');
    }

    public static addSchoollistToForm(list: Array<ListItem>, listId: list_id, formJSON: Object): Array<ListItem> {
        return FormUtils.addlistToForm(list, listId, formJSON, 'schools');
    }
    public static addCampuslistToForm(list: Array<ListItem>, listId: list_id, formJSON: Object): Array<ListItem> {
        return FormUtils.addlistToForm(list, listId, formJSON, 'campuses');
    }

    private static addlistToForm(list: Array<ListItem>, listId: list_id, formJSON: Object, owner: string): Array<ListItem> {
        list.forEach((item: ListItem, index: number) => {
            const specialNeedsIndex: string = listId + '_' + index;
            formJSON[specialNeedsIndex] = item[owner].length === 1;
        });
        return list;
    }

    private static addlistToForm1(list: Array<ListItem>, listId: list_id, formJSON: Object, myType: string): Array<ListItem> {
        const listCat = FormUtils.filterList(list, listId);
        listCat.forEach((item: ListItem, index: number) => {
            const specialNeedsIndex: string = listId + '_' + index;
            formJSON[specialNeedsIndex] = item[myType].length === 1;
        });
        return listCat;
    }

    public static addEnrolmentTargetsToForm(
        intakeClassYear: IntakeClassYear, formJSON: Object, yearLevels: YearLevel[]
    ): Array<Object> {
        return FormUtils.doAddEnrolmentTargetsToForm(intakeClassYear, formJSON, yearLevels)
    }
    private static doAddEnrolmentTargetsToForm(
        intakeClassYear: IntakeClassYear, formJSON: Object, yearLevels: YearLevel[]
    ): Array<Object> {
        const formStruct: Array<Object> = [];
        if (intakeClassYear) {
            intakeClassYear.enrolmentTargets.forEach((item: EnrolmentTarget) => {
                const id = '_' + (item.id || '');

                const enrolmentTargetYearLevelMaxIndex: string = 'target_yearLevelMax_' + item.intakeYear.id + id;
                const enrolmentTargetAvailablePlacesIndex: string = 'target_availablePlaces_' + item.intakeYear.id + id;
                formJSON[enrolmentTargetYearLevelMaxIndex] = item.yearLevelMax || 0;
                formJSON[enrolmentTargetAvailablePlacesIndex] = item.availablePlaces || 0;
                formStruct.push({
                    classYear: item.intakeYear.name,
                    yearLevelMax: enrolmentTargetYearLevelMaxIndex,
                    availablePlaces: enrolmentTargetAvailablePlacesIndex
                })
            });
        } else {
            _.forEach(yearLevels, (yearLevel: YearLevel) => {
                const id = '_';

                const enrolmentTargetYearLevelMaxIndex: string = 'target_yearLevelMax_' + yearLevel.id + id;
                const enrolmentTargetAvailablePlacesIndex: string = 'target_availablePlaces_' + yearLevel.id + id;
                formJSON[enrolmentTargetYearLevelMaxIndex] = null;
                formJSON[enrolmentTargetAvailablePlacesIndex] = null;
                formStruct.push({
                    classYear: yearLevel.name,
                    yearLevelMax: enrolmentTargetYearLevelMaxIndex,
                    availablePlaces: enrolmentTargetAvailablePlacesIndex
                })
            });
        }
        return formStruct;
    }

    public static filterList(listItems: Array<ListItem>, listId: list_id) {
        return _.filter(listItems, (listItem) => listItem.list.id === listId); // return only the items with the indicated list_id
    }

    public static filterListItemsByListId(listItems: Array<ListItem>, listId: list_id) {
        return _.filter(listItems, (listItem) => listItem.listId === listId); // return only the items with the indicated list_id
    }

    public static getEnumRules(name: string) {
        if (name === 'Alumni') {
            return [
                { id: HasAlumni.Yes, name: HasAlumni.Yes },
                { id: HasAlumni.No, name: HasAlumni.No },
                { id: HasAlumni.Unknown, name: HasAlumni.Unknown },
            ]
        }
    }

    public static findInList(list: Array<ListItem>, name: string): ListItem {
        return _.find(list, { 'name': name });
    }

    public static findInStudentStatusList(list: Array<StudentStatus>, status: string): StudentStatus {
        return _.find(list, { 'status': status });
    }

    public static booleanStudentListToFormData(list: Array<ListItem>, prefix: number, form: FormGroup): Array<number> {
        const arraySelectedIds: Array<number> = [];
        list.forEach((item: ListItem, index: number) => {
            const formIndex: string = prefix + '_' + index;
            if (form.value[formIndex]) {
                arraySelectedIds.push(item.id);
            }
            form.removeControl(formIndex);
        });
        return arraySelectedIds;
    }

    public static booleanSchoolListToFormData(list: Array<ListItem>, prefix: number, form: FormGroup): Array<number> {
        const arraySelectedIds: Array<number> = [];
        list.forEach((item: ListItem, index: number) => {
            const formIndex: string = prefix + '_' + index;
            if (form.value[formIndex]) {
                arraySelectedIds.push(item.id);
            }
            form.removeControl(formIndex);
        });
        return arraySelectedIds;
    }

    /**
     * Marks all controls in a form group as touched,
     * including nested groups and arrays
     * @param formGroup - The form group or array to mark
     */
    public static markFormGroupTouched(formGroup: any) {
        _.forEach(formGroup.controls, control => {
            control.markAsTouched();

            // touch nested controls
            if (control.controls) {
                this.markFormGroupTouched(control);
            }
        });
    }

    public static cleanupForm(object: Object): Object {
        // removes properties like 1_1, 1_2 etc
        for (const propt in object) {
            if (/^[0-9]+_[0-9]+$/.test(propt)) {
                _.unset(object, propt);
            } else if (typeof object[propt] === 'string' && object[propt].toUpperCase() === 'NULL') {
                // translates string 'null' -> null (because dropdown object return strings iso number)
                object[propt] = null;
            }
        }

        return object;
    }

    public static ifIncluded(fieldSettings: Array<IFieldSetting>, fieldId: string) {
        const settings = _.find(fieldSettings, s => s.id === fieldId);
        return Boolean(settings && settings.isIncluded);
    }

    public static isRequired(fieldSettings: Array<IFieldSetting>, fieldId: string) {
        const settings = _.find(fieldSettings, s => s.id === fieldId);
        return Boolean(settings && settings.isRequired);
    }

    public static setIfRequired(fieldSettings: Array<IFieldSetting>, fieldId: string) {
        const validators = [];
        const settings = _.find(fieldSettings, s => s.id === fieldId);
        if (settings && settings.isRequired) {
            validators.push(Validators.required);
        }
        return validators;
    }

    public static addControlsIfIncluded(form: FormGroup, fieldSettings: IFieldSetting[], controls: IControl[], makeOptional = false) {
        _.forEach(controls, control => {
            if (FormUtils.ifIncluded(fieldSettings, control.id)) {
                const validators = (makeOptional) ? [] : FormUtils.setIfRequired(fieldSettings, control.id);
                validators.push(...control.validators);
                form.addControl(control.id, new FormControl(FormUtils.defaultValue(fieldSettings, control.id),
                    Validators.compose(validators)));
            }
        })
    }

    public static addAddressControlsIfIncluded(form: FormGroup, fieldSettings: Array<IFieldSetting>, address, control: IControl) {
        if (FormUtils.ifIncluded(fieldSettings, control.id)) {
            form.addControl(control.id, new FormControl(null, Validators.compose(control.validators)))
            form.addControl('administrativeAreaId', new FormControl(address.defaultValue['defaultContactAdministrativeAreaId']))
            form.addControl('countryId', new FormControl(address.defaultValue['defaultContactCountryId']))
        }
    }

    public static setValues(form: FormGroup, fieldSettings: Array<IFieldSetting>) {
        _.forEach(form.controls, (control, key) => {
            if (key !== 'address') {
                const setting = _.find(fieldSettings, s => s.id === key)
                control.setValue(setting ? setting.defaultValue : null)
            }
        })
    }

    public static defaultValue(fieldSettings: Array<IFieldSetting>, fieldId: string) {
        const settings = _.find(fieldSettings, s => s.id === fieldId);
        return settings ? settings.defaultValue : null;
    }

    public static resetFormControlIfExist(control: AbstractControl) {
        if (control) {
            control.reset();
        }
    }

    public static updateDisplay(uniqId: string, formType: number, schoolId: number, httpService): Promise<any> {
        return httpService.post('signup-form/webform-update', { uniqId: uniqId, displayed: true, formType: formType, schoolId: schoolId });
    }

}

import { OnDestroy, Input, Output, EventEmitter, SimpleChanges, OnInit, OnChanges, Directive } from '@angular/core';
import { ControlValueAccessor, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Utils } from 'app/common/utils';
import { Constants } from 'app/common/constants';

import { School } from 'app/entities/school';

import { AddOtherDialogComponent } from './add-other-dialog';

import * as _ from 'lodash';


@Directive()
export abstract class BaseOther implements ControlValueAccessor, OnInit, OnChanges, OnDestroy {

    public otherForm: FormGroup;
    prevValue: number | number[];
    componentDestroyed = new Subject();
    noItemSelected = Constants.noItemSelected;
    schoolId: number;
    protected abstract newList; // can be both, listItem and currentSchool list
    protected abstract list; // can be both, listItem and currentSchool list
    protected abstract filteredList;
    listFilterCtrl: FormControl = new FormControl();
    _onDestroy = new Subject<void>();

    @Input() placeholder;
    @Input() isPublicPage = false;
    @Input() isRequired = false;
    @Input() htmlId: string; // should be unique for example formGroup+formControlName
    @Input() trigger: boolean;
    @Input() school: School;
    @Input() reset: boolean;
    @Input() allowSearchOption = false;
    @Input() multiple = false;
    @Output() selectionChanged = new EventEmitter();

    set value(val: number | number[]) {
        const newValue = this.correctEmptyValue(val);
        if (this.otherForm) {
            this.otherForm.controls.val.setValue(newValue);
        }
        this.onChange(newValue);
        this.onTouched();
    }

    onTouched: any = () => { };
    onChange: any = () => { };

    constructor(private dialog: MatDialog, private fb: FormBuilder) { }

    ngOnInit() {
        this.createOtherForm();
    }

    private createOtherForm() {
        this.otherForm = this.fb.group({ val: [''] });
    }

    writeValue(value: number | number[]) {
        this.schoolId = Utils.getUserInfoFromToken() ? Utils.getUserInfoFromToken().schoolId : this.school.id;
        const newValue = this.correctEmptyValue(value);
        this.value = newValue;
        this.prevValue = newValue;
        this.updateList(_.isArray(newValue) ? newValue : [newValue]);
    }

    registerOnChange(fn: (val: any) => any) {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => any) {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        if (isDisabled) {
            this.otherForm.disable();
        } else {
            this.otherForm.enable();
        }
    }

    protected onSelectListChange(event, value) {
        if (this.isPublicPage) {
            this.selectionChanged.emit();
        }
        this.onChange(value);
    }
    protected abstract updateList(value);
    protected abstract submit(result);
    protected abstract filterList();

    ngOnChanges(changes: SimpleChanges) {
        if (changes.trigger) {
            // refresh list move Other to end of the array
            const other = _.remove(this.newList, s => s['id'] === 0);
            _.remove(this.list, s => s['id'] === 0);
            this.newList = this.list;
            this.newList.push(...other);
            this.populateFilteredList(this.filteredList, this.newList);
        }
        if (changes.reset) {
            this.createOtherForm();
        }
    }

    public cancel() {
        this.value = this.prevValue;
    }

    ngOnDestroy() {
        this.componentDestroyed.next();
        this.componentDestroyed.complete();
        this._onDestroy.next();
        this._onDestroy.complete();
    }

    AddOtherDialog<T>(data: T) {
        const AddOtherDialogRef = this.dialog.open(AddOtherDialogComponent, AddOtherDialogComponent.getDialogConfig(data));
        AddOtherDialogRef.componentInstance.onAdd.pipe(takeUntil(this.componentDestroyed)).subscribe((res) => {
            this.submit(res);
            AddOtherDialogRef.close();
        });
        AddOtherDialogRef.afterClosed().pipe(takeUntil(this.componentDestroyed)).subscribe(() => {
            this.cancel();
        });
    }

    populateFilteredList(filteredList, list) {
        filteredList.next(list.slice());
        this.listFilterCtrl.valueChanges
            .pipe(takeUntil(this._onDestroy))
            .subscribe(() => {
                this.filterList();
            });
    }

    protected getCurrentValue(newItemId: number) {
        return (this.multiple && _.isArray(this.prevValue)) ? [...this.prevValue, newItemId] : newItemId;
    }

    private correctEmptyValue(value: number | number[]) {
        return value ? value : (this.multiple ? [] : null);
    }

}

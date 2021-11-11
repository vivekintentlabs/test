import { OnDestroy, Input, OnInit, Component, forwardRef, Output, EventEmitter } from '@angular/core';
import { ControlValueAccessor, FormBuilder, FormGroup, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject, ReplaySubject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Constants } from 'app/common/constants';

import * as _ from 'lodash';

@Component({
    selector: 'app-select-search',
    templateUrl: './select-search.component.html',
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => SelectSearchComponent),
        multi: true
    }]
})

export class SelectSearchComponent implements ControlValueAccessor, OnInit, OnDestroy {

    public searchSelectForm: FormGroup;
    noItemSelected = Constants.noItemSelected
    filteredList: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);
    listFilterCtrl: FormControl = new FormControl();
    _onDestroy = new Subject<void>();
    subFormChanges: Subscription;
    alternativeName: string;

    @Input() placeholder
    @Input() isRequired = false
    @Input() hasAlternativeName = false
    @Input() list: any[]
    @Output() outputData = new EventEmitter()

    set value(val) {
        if (this.searchSelectForm) {
            this.searchSelectForm.controls.val.setValue(val)
        }
        this.onChange(val);
        this.onTouched();
    }

    onTouched: any = () => { }
    onChange: any = () => { }

    constructor(private fb: FormBuilder) { }

    writeValue(value: any) {
        this.value = value;
        this.setAlternativeName(value)
        this.subscribeFormChanges() // subscribe when form is populated
    }

    subscribeFormChanges() {
        if (this.subFormChanges) {
            this.subFormChanges.unsubscribe();
        }
        this.subFormChanges = this.searchSelectForm.get('val').valueChanges.subscribe(val => {
            this.setAlternativeName(val)
            this.outputData.emit({ value: val })
        });
    }

    ngOnInit() {
        this.createSearchSelectForm();
        this.filteredList.next(this.list.slice());
        this.listFilterCtrl.valueChanges
            .pipe(takeUntil(this._onDestroy))
            .subscribe(() => {
                this.filterList();
            });
    }

    private createSearchSelectForm() {
        this.searchSelectForm = this.fb.group({ val: [''] });
    }

    setAlternativeName(value) {
        if (this.hasAlternativeName) {
            const selectedItem = _.find(this.list, item => item.id === value)
            this.alternativeName = selectedItem ? selectedItem.alternativeName : ''
        }
    }

    registerOnChange(fn: (val: any) => any) {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => any) {
        this.onTouched = fn;
    }

    ngOnDestroy() {
        this._onDestroy.next();
        this._onDestroy.complete();
        if (this.subFormChanges) {
            this.subFormChanges.unsubscribe();
        }
    }

    private filterList() {
        if (!this.list) {
            return;
        }
        let search = this.listFilterCtrl.value;
        if (!search) {
            this.filteredList.next(this.list.slice());
            return;
        } else {
            search = search.toLowerCase();
        }
        this.filteredList.next(
            this.list.filter(country => country.name.toLowerCase().indexOf(search) > -1)
        );
    }

}

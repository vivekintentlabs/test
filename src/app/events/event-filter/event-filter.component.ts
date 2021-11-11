import { Component, AfterViewInit, AfterViewChecked, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Constants } from '../../common/constants';
import { Utils } from '../../common/utils';
import { EventFilter } from '../../entities/local/eventFilter';
import { ListenerService } from '../../services/listener.service';
import { Subscription } from 'rxjs';


@Component({
    selector: 'app-event-filter',
    templateUrl: 'event-filter.component.html',
    styleUrls: ['./event-filter.component.scss']
})
export class EventFilterComponent implements AfterViewInit, AfterViewChecked {
    @Input() filterData: any;
    @Output() filterVals = new EventEmitter();
    @Output() resetSearchText = new EventEmitter();
    public filterForm: FormGroup;
    filterAll = Constants.filterAll;
    protected subscrCampusList: Subscription;

    public loaded = false;

    constructor(private fb: FormBuilder, private ref: ChangeDetectorRef, private listenerService: ListenerService) {
        this.subscrCampusList = this.listenerService.campusListStatus().subscribe(() => { this.campusChange(); });
    }

    ngAfterViewInit() {
        this.createForm((this.filterData.criterias) ? this.filterData.criterias : new EventFilter());
    }

    ngAfterViewChecked() {
        Utils.DetectChanges(this.ref);
    }

    ngOnDestry() {
        if (this.subscrCampusList) {
            this.subscrCampusList.unsubscribe();
        }
    }

    private campusChange() {
        this.resetFilterForm();
    }

    private createForm(filter: EventFilter) {
        this.filterForm = this.fb.group(filter);
        this.loaded = true;
    }

    onSubmit() {
        this.filterVals.emit(this.filterForm.value);
    }

    resetFilter() {
        this.resetFilterForm();
        this.onSubmit();
        this.resetSearchText.emit();
    }

    private resetFilterForm() {
        const defaults = new EventFilter();
        this.filterForm.controls.year.setValue(defaults.year);
        this.filterForm.controls.hidePastEvents.setValue(defaults.hidePastEvents);
        this.filterForm.controls.campusId.setValue(defaults.campusId);
    }

}

import { Component, OnInit, Input, SimpleChanges, OnChanges, OnDestroy, Output, EventEmitter } from '@angular/core';

import { DataService } from 'app/services/data.service';
import { UserInfo } from 'app/entities/userInfo';
import { SubTour } from 'app/entities/sub-tour';
import { Event } from 'app/entities/event';

import { BaseTable } from 'app/base-table';
import { StorageService } from 'app/services/storage.service';
import { HttpService } from 'app/services/http.service';

import { Utils } from 'app/common/utils';
import { Constants } from 'app/common/constants';

import * as _ from 'lodash';
import * as moment from 'moment';

declare var $: any;

@Component({
    selector: 'app-sub-tours',
    templateUrl: './sub-tour.component.html',
    styleUrls: ['./sub-tour.component.css'],
})

export class SubTourComponent extends BaseTable<SubTour> implements OnInit, OnChanges, OnDestroy {
    @Input() event: Event;
    @Output() updateSubTours = new EventEmitter<SubTour[]>();

    public userInfo: UserInfo = null;

    public tableId = 'subTourTable';
    public subTours: SubTour[];
    public subTourId: number;

    constructor(
        private dataService: DataService,
        storageService: StorageService,
        private httpService: HttpService,
    ) {
        super(storageService);
        this.displayedColumns = ['name', 'startTime', 'endTime', 'maxNumber', 'rsvp', 'registration', 'actions'];
    }

    public ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        if (this.event.id) {
            this.tableIsLoading = this.getData()
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.event != null && !changes.event.firstChange) {
            this.dataService.resetOne(`events/${this.event.id}/sub-tours`);
            this.ngOnInit();
        }
    }

    private getData(): Promise<any> {
        return this.httpService.getAuth(`events/${this.event.id}/sub-tours`).then((subTours: SubTour[]) => {
            this.subTours = subTours;
            this.buildTable(this.subTours);
            return Promise.resolve();
        });
    }

    protected buildTable(subTours: SubTour[]) {
        super.buildTable(subTours);
        this.updateTable(subTours);
        this.dataSource.sortingDataAccessor = (item, property) => {
            switch (property) {
                case 'startTime':
                case 'endTime': return this.getMinutes(moment(_.get(item, property), Constants.dateFormats.time));
                case 'maxNumber':
                case 'rsvp': return _.toNumber(_.get(item, property)) || 0;
                case 'registration': return item.isRegistrationDisabled ? 'Disabled' : 'Enabled';
                default: return _.toLower(_.get(item, property));
            }
        };
    }

    private getMinutes(time: moment.Moment): number {
        return time.minutes() + time.hours() * 60;
    }

    public addSubTour() {
        this.subTourId = 0;
        $('#editSubTourModal').modal('show');
    }

    public editSubTour(id: number) {
        this.subTourId = id;
        $('#editSubTourModal').modal('show');
    }

    public deleteSubTour(id: number) {
        Utils.deletedQuestion().then((result) => {
            if (result && result.value) {
                return this.httpService.postAuth(`events/${this.event.id}/sub-tours/${id}/delete`, null).then((res: number) => {
                    Utils.deletedSuccessfully();
                    this.updateSubTour();
                }).catch(err => console.log(err));
            }
        });
    }

    public updateSubTour() {
        this.subTourId = null;
        this.tableIsLoading = this.getData().then(() => {
            this.updateSubTours.emit(this.subTours);
        });
    }

}

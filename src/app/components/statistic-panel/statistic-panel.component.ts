import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { UserInfo } from '../../entities/userInfo';
import { Utils } from '../../common/utils';

@Component({
    selector: 'app-statistic-panel',
    templateUrl: './statistic-panel.component.html',
    styleUrls: ['./statistic-panel.component.scss']
})
export class StatisticPanelComponent implements OnInit {
    @Input() label: string;
    @Input() points: number;
    @Input() data: [];
    @Input() pieChartData;
    @Input() classNames;
    @Output() filteringData = new EventEmitter();
    public userInfo: UserInfo = null;
    public filters: Object = { 'Returning': true, 'First time': true, 'Unknown': true, };

    constructor() { }

    ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.label = this.label || 'Points';
        this.points = this.points || 0;
        this.filteringData.emit(this.filters);
    }

    public filterChanged(name: string, checked: boolean) {
        this.filters[name] = checked;
        this.filteringData.emit(this.filters);
    }

}

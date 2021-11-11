import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'point-view',
    templateUrl: './point-view.component.html',
    styleUrls: ['./point-view.component.scss']
})
export class PointViewComponent implements OnInit {
    @Input() label: string;
    @Input() points: number;
    @Input() isGreen: boolean;
    @Input() isYellow: boolean;
    @Input() isRed: boolean;
    @Input() isSpinner: boolean = false;

    constructor() { }

    ngOnInit() {
        this.label = this.label || 'Points';
        this.points = this.points || 0;
    }

}

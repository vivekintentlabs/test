import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CurrentSchool } from 'app/entities/current-school';
import { ListItem } from 'app/entities/list-item';

@Component({
    selector: 'app-merge-item',
    templateUrl: 'merge.component.html',
    styleUrls: ['./merge.component.scss'],
})

export class MergeItemComponent {

    @Input() items: ListItem[] | CurrentSchool[];
    @Input() displayedColumns: string[];
    @Input() title: string;
    @Input() headerText: string;
    @Output() merge = new EventEmitter();
    @Output() cancel = new EventEmitter();
}

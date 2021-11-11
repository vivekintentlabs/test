import { Component } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { StringWidget } from 'ngx-schema-form';

@Component({
    selector: 'chips-widget',
    templateUrl: './chips-widget.html'
})
export class MatChipsWidget extends StringWidget {
    visible = true;
    selectable = true;
    removable = true;
    addOnBlur = true;
    readonly separatorKeysCodes: number[] = [ENTER, COMMA];
    items: string[] = [];

    ngAfterViewInit() {
        super.ngAfterViewInit();

        const defaultValue = this.control.value || this.schema.default || '';
        if (defaultValue) {
            defaultValue.split(',').map(i => this.items.push(i.trim()));
        }
    }

    add(event: MatChipInputEvent): void {
        const input = event.input;
        const value = event.value;

        // Add our item
        if ((value || '').trim()) {
            this.items.push(value.trim());
        }

        // Reset the input value
        if (input) {
            input.value = '';
        }

        this.updateControl();
    }

    remove(item: string): void {
        const index = this.items.indexOf(item);

        if (index >= 0) {
            this.items.splice(index, 1);
        }
        this.updateControl();
    }

    private updateControl() {
        this.control.setValue(this.items.join(','));
    }

}

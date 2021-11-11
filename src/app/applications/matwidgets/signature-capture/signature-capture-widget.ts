import { Component, ViewChild, HostListener } from '@angular/core';
import { StringWidget } from 'ngx-schema-form';

import * as _ from 'lodash';

@Component({
    selector: 'signature-capture-widget',
    templateUrl: './signature-capture-widget.html',
    styleUrls: ['./signature-capture-widget.scss']
})
export class MatSignatureCaptureWidget extends StringWidget {
    @ViewChild('sigPad') sigPad;
    sigPadElement;
    context;
    isDrawing = false;

    ngAfterViewInit() {
        super.ngAfterViewInit();

        if (this.schema.isRequired && !this.schema.minLength) {
            this.control = _.clone(this.control);
        }

        this.sigPadElement = this.sigPad.nativeElement;
        this.context = this.sigPadElement.getContext('2d');
        this.context.strokeStyle = '#3742fa';
        if (this.formProperty.value) {
            const img = new Image();
            const self = this;
            img.onload = function () {
                self.context.drawImage(img, 0, 0);
                self.context.stroke();
            };
            img.src = this.formProperty.value;
        }
    }

    @HostListener('document:mouseup', ['$event'])
    onMouseUp(e) {
        this.isDrawing = false;
    }

    @HostListener('document:touchend', ['$event'])
    onTouchEnd(e) {
        this.isDrawing = false;
    }

    onTouchStart(e) {
        this.onMouseDown(e, true);
    }

    onTouchMove(e) {
        e.preventDefault();
        e.stopPropagation();
        this.onMouseMove(e, true);
    }

    onMouseDown(e, isTouch: boolean = false) {
        if (this.schema?.readOnly) return false;

        this.isDrawing = true;
        const coords = this.relativeCoords(e, isTouch);
        this.context.moveTo(coords.x, coords.y);
    }

    onMouseMove(e, isTouch: boolean = false) {
        if (this.isDrawing) {
            const coords = this.relativeCoords(e, isTouch);
            this.context.lineTo(coords.x, coords.y);
            this.context.stroke();
        }
    }

    private relativeCoords(event, isTouch: boolean) {
        const bounds = event.target.getBoundingClientRect();
        const clientX = isTouch ? event.touches[0].clientX : event.clientX;
        const clientY = isTouch ? event.touches[0].clientY : event.clientY;
        const x = clientX - bounds.left;
        const y = clientY - bounds.top;
        return { x, y };
    }

    clear() {
        this.context.clearRect(0, 0, this.sigPadElement.width, this.sigPadElement.height);
        this.context.beginPath();
        this.formProperty.setValue('', false);
    }

    save() {
        const dataImage = this.sigPadElement.toDataURL("image/png");
        if (dataImage) {
            this.formProperty.setValue(dataImage, false);
        }
    }

}

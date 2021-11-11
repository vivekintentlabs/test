import { NgModule } from '@angular/core';
import { LocalDatePipe } from './common/pipes/date.pipe';
import { LocaleDatePipe } from './common/pipes/locale-date.pipe';
import { TimePipe } from './common/pipes/time.pipe';
import { SafeHtmlPipe } from './common/pipes/safehtml.pipe';
import { StripHtmlPipe } from './common/pipes/striphtml.pipe';
import { TruncatePipe } from './common/pipes/truncate.pipe';
import { AbbreviatePipe } from './common/pipes/abbreviate';
import { SafeStylePipe } from './common/pipes/safe-style';
import { StartingYearPipe } from './common/pipes/starting-year.pipe';
import { FileSizePipe } from './common/pipes/file-size.pipe';

@NgModule({
    imports: [],
    declarations: [
        LocalDatePipe,
        TimePipe,
        SafeHtmlPipe,
        StripHtmlPipe,
        TruncatePipe,
        LocaleDatePipe,
        AbbreviatePipe,
        SafeStylePipe,
        StartingYearPipe,
        FileSizePipe,
    ],
    exports: [
        LocalDatePipe,
        TimePipe,
        SafeHtmlPipe,
        StripHtmlPipe,
        TruncatePipe,
        LocaleDatePipe,
        AbbreviatePipe,
        SafeStylePipe,
        StartingYearPipe,
        FileSizePipe,
    ]
})

export class SharedModule { }

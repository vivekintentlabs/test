import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filesize',
    pure: true
})

export class FileSizePipe implements PipeTransform {

    // found the solution here https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
    transform(sizeInBytes: number | null, dp = 1): string {
        const thresh = 1024;
        if (Math.abs(sizeInBytes) < thresh) {
            return sizeInBytes + ' B';
        }
        const units = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        let u = -1;
        const r = 10 ** dp;
        do {
            sizeInBytes /= thresh;
            ++u;
        } while (Math.round(Math.abs(sizeInBytes) * r) / r >= thresh && u < units.length - 1);
        return sizeInBytes.toFixed(dp) + ' ' + units[u];
    }
}

import { ApplicationStatus } from 'app/common/enums';
import { TimeStamp } from './types';

export interface AppStatusLog {
    appStatus: ApplicationStatus;
    dateTime: TimeStamp;
}

import { Document } from './document';
import { AppStatusLog } from '../app-status-log';

export interface AppStatusLogsDoc extends Document {
    logs: AppStatusLog[];
}

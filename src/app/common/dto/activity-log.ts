import { ListItem } from 'app/entities/list-item';
import { ActivityLog } from 'app/entities/activityLog';

export interface ActivityLogDTO {
    activityLog: ActivityLog | null;
    leadSources: ListItem[];
    activities: ListItem[];
}

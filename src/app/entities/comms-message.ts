import { Campus } from "./campus";
import { School } from "./school";
import { User } from "./user";
import { ICampaignSegmentData } from 'app/common/interfaces';
import { FilterValue } from 'app/components/filter-constellation/interfaces/filter-value';

export class CommsMessage {
    id: number;
    subject: string;
    body: string;
    fromUserId: number;
    status: string;
    log: boolean;
    campaignId: string;
    campaignTime: string;
    activity: string;
    audience: number;
    schoolId: number;
    campusId: number | string | null;
    filterValues: FilterValue[];
    studentIds: Array<number>;

    // for angular, not exist in the database
    fromUser: User;
    testEmails: Array<string>;
    sendType: string;
    date: string;
    time: string;
    createdAt: string;
    updatedAt: string;
    stats: string;
    templateRawHtml?: string;
    campus?: Campus;
    school?: School;
    segmentConditions?: Array<ICampaignSegmentData>
}

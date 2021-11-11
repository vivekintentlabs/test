import { CommsMessage } from 'app/entities/comms-message';
import * as _ from 'lodash';

export class CommsUtils {
    public static cloneMsg(msg: CommsMessage):CommsMessage {
        const copiedMsg         = _.cloneDeep(msg);
        copiedMsg.id            = null;
        copiedMsg.status        = 'draft';
        copiedMsg.campaignId    = null;
        copiedMsg.createdAt     = null;
        copiedMsg.updatedAt     = null;
        copiedMsg.campaignTime  = null;
        return copiedMsg;
    }
}
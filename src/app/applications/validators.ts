import { IOneOf } from 'ngx-schema-form';
import { LICode } from 'app/common/enums';
import { T } from 'app/common/t';

import * as _ from 'lodash';

export const getErrMsgContactType = (values, contactTypes: IOneOf[]) => {
    if (!_.isEmpty(values)) {
        const primaryContactTypeId = contactTypes.find((ct: IOneOf) => ct.description === 'Primary').enum[0];

        // wait until user fill out contact type(s)
        for (const contact of values) {
            if (!contact?.li_contactType) {
                return null;
            }
        }

        const primaryContact = values.find(c => c.li_contactType === primaryContactTypeId);
        if (!primaryContact) {
            return T.msgNoPrimaryContact;
        }
    }
    return '';
};

export const getErrMsgFeeResponsibility = (values, requiredFields: string[], fieldName) => {
    let errorMsg: string;
    const countByResponsibility = _.countBy(values, fieldName);
    const sharedCount = countByResponsibility[LICode.fee_responsibility_shared];
    const fullCount = countByResponsibility[LICode.fee_responsibility_full];
    const noneCount = countByResponsibility[LICode.fee_responsibility_none];
    const isRequired = _.includes(requiredFields, fieldName);

    if (!_.isEmpty(values)) {
        if (!(!isRequired && !sharedCount && !fullCount && !noneCount)) {
            if (values.length === 1) {
                if (sharedCount) {
                    errorMsg = T.msgFeeResponsibilityOnlyShared;
                } else if (noneCount) {
                    errorMsg = T.msgFeeResponsibilityNone;
                }
            } else {
                if (!fullCount && !sharedCount) {
                    errorMsg = T.msgFeeResponsibilityNone;
                } else if (fullCount > 1 || (fullCount && sharedCount)) {
                    errorMsg = T.msgFeeResponsibilityOver;
                } else if (!fullCount && sharedCount < 2) {
                    errorMsg = T.msgFeeResponsibilityOnlyShared;
                }
            }
        }
    }
    return errorMsg || '';
};

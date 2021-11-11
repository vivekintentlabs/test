import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";

import { ErrorCode } from "../common/enums";
import { environment } from "environments/environment";

import * as _ from 'lodash';

@Injectable({
    providedIn: 'root',
})
export class ErrorMessageService {

    constructor(
        private translate: TranslateService,
    ) { }

    public getMessage(id: ErrorCode, errMsg?: string, params?: string[]): Promise<string> {
        let code: string = '0';
        let objParams = { brandName: environment.brand.name, supportEmail: environment.brand.supportEmail };
        if (!_.isEmpty(params)) objParams = params.reduce((o, key, index) => ({ ...o, [`param${index}`]: key}), objParams);
        switch (id) {
            case ErrorCode.unexpected_error:
            case ErrorCode.database_item_is_not_found:
            case ErrorCode.document_not_found:
            case ErrorCode.url_not_found:
            case ErrorCode.database_error:
            case ErrorCode.shared_secret_mismatch:
            case ErrorCode.param_invalid:
            case ErrorCode.not_allowed_role:
            case ErrorCode.mailing_error:
            case ErrorCode.subscription_expired:
            case ErrorCode.access_code_expired:
            case ErrorCode.user_not_exist:
            case ErrorCode.duplicate_user_email:
            case ErrorCode.unsubscribe_link_not_valid:
            case ErrorCode.disabled_user:
            case ErrorCode.empty_response:
            case ErrorCode.google_tag_manager_id_not_exist:
            case ErrorCode.save_file_error:
            case ErrorCode.campus_not_exist:
            case ErrorCode.delete_file_error:
            case ErrorCode.read_file_error:
            case ErrorCode.getting_mailchimp_campaign_info_failed:
            case ErrorCode.captcha_check_failed:
            case ErrorCode.unsupported_export_format:
            case ErrorCode.user_is_not_active:
            case ErrorCode.export_partner_error:
            case ErrorCode.download_partner_error:
            case ErrorCode.unable_to_trigger_ua_event:
                code = `${id}`; break;
            default: code = errMsg;
        }
        return this.translate.get(`errorMessage.${code}`, objParams).toPromise().then((msg: string) => {
            return msg ? msg : 'Unexpected problem, no error msg specified for id: ' + id;
        });
    }
}

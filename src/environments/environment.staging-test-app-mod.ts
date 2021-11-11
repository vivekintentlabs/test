import { Environment } from 'app/common/interfaces';
import { Storage } from 'app/common/enums/storage';
import { defaults } from './defaults.environment';
import { localization } from './locale.en-aus';

export const environment: Environment = {
    production: true,
    isAllowedInvalidAppSubmission: false,
    logAppModuleErrors: true,
    domainServer: 'test-app-mod-dot-enquiry-tracker-staging.ts.r.appspot.com',
    apiUrl: 'https://test-app-mod-dot-enquiry-tracker-staging.ts.r.appspot.com/',
    googleMapApiKey: 'AIzaSyDpjn9dt5LWZ5zFso8fddt3nYY1jNjgj2Q',
    storageType: Storage.LocalStorage,
    reCaptchaSiteKey: '6LdaJKYZAAAAAMcwVptbIDgqk7y_H0yR4P4rBOp8',
    reCaptchaV2SiteKey: '6LeTAtIZAAAAAF1fv_k98sJhWJbCOzz6D5GQE4VR',
    ...defaults,
    localization
};

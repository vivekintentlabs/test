import { Storage } from 'app/common/enums/storage';
import { defaults } from './defaults.environment.sm';
import { localization } from './locale.en-us';

export const environment = {
    production: true,
    isAllowedInvalidAppSubmission: false,
    logAppModuleErrors: false,
    domainServer: 'api.connect.schoolmint.com',
    apiUrl: 'https://api.connect.schoolmint.com/',
    googleMapApiKey: 'AIzaSyDop2JsOENcaQexGkf-_qplbHXpNgcXcg4',
    storageType: Storage.LocalStorage,
    reCaptchaSiteKey: '6LeUfCUcAAAAANrd4hEJWkSUgAGG1lDKuXjn0hV4',
    reCaptchaV2SiteKey: '6LeeFyYcAAAAAGf5VaUBo4l8zsEjEfTp1Ei78del',
    ...defaults,
    localization
};

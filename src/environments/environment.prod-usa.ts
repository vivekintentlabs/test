import { Environment } from 'app/common/interfaces';
import { Storage } from 'app/common/enums/storage';
import { defaults } from './defaults.environment';
import { localization } from './locale.en-us';

export const environment: Environment = {
    production: true,
    isAllowedInvalidAppSubmission: false,
    logAppModuleErrors: false,
    domainServer: 'api-us.enquirytracker.net',
    apiUrl: 'https://api-us.enquirytracker.net/',
    googleMapApiKey: 'AIzaSyDpjn9dt5LWZ5zFso8fddt3nYY1jNjgj2Q',
    storageType: Storage.LocalStorage,
    reCaptchaSiteKey: '6Le9a6UZAAAAAIXPcDiMqS6nml9c_oyi9YOZSrkZ',
    reCaptchaV2SiteKey: '6LfKBdIZAAAAAKwc2vzn6JP3GsX_5FmOJpBxqK2t',
    ...defaults,
    localization
};

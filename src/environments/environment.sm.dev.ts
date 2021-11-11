import { Environment } from 'app/common/interfaces';
import { Storage } from 'app/common/enums/storage';
import { defaults } from './defaults.environment.sm';
import { localization } from './locale.en-us';

export const environment: Environment = {
    production: true,
    isAllowedInvalidAppSubmission: true,
    logAppModuleErrors: true,
    domainServer: 'schoolmint-backend-dot-enquirytracker-dev.appspot.com',
    apiUrl: 'https://schoolmint-backend-dot-enquirytracker-dev.appspot.com/',
    googleMapApiKey: 'AIzaSyDpjn9dt5LWZ5zFso8fddt3nYY1jNjgj2Q',
    storageType: Storage.LocalStorage,
    reCaptchaSiteKey: '6LdBp60UAAAAAFybBZaEiBshGVKRexxEWObKcWOU',
    reCaptchaV2SiteKey: '6LegAkQUAAAAAOoGejQnzUhyjUInJkra0yGmR8SW',
    ...defaults,
    localization
};

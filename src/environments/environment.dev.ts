import { Environment } from 'app/common/interfaces';
import { Storage } from 'app/common/enums/storage';
import { defaults } from './defaults.environment';
import { localization } from './locale.en-aus';

export const environment: Environment = {
    production: true,
    isAllowedInvalidAppSubmission: true,
    logAppModuleErrors: true,
    domainServer: 'dev-api.enquirytracker.net',
    apiUrl: 'https://dev-api.enquirytracker.net/',
    googleMapApiKey: 'AIzaSyDpjn9dt5LWZ5zFso8fddt3nYY1jNjgj2Q',
    storageType: Storage.LocalStorage,
    reCaptchaSiteKey: '6LdBp60UAAAAAFybBZaEiBshGVKRexxEWObKcWOU',
    reCaptchaV2SiteKey: '6LegAkQUAAAAAOoGejQnzUhyjUInJkra0yGmR8SW',
    ...defaults,
    localization
};

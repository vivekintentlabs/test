import { Storage } from 'app/common/enums/storage';
import { defaults } from './defaults.environment.sm';
import { localization } from './locale.en-us';

export const environment = {
    production: false,
    isAllowedInvalidAppSubmission: true,
    logAppModuleErrors: true,
    domainServer: 'et-gtm.intentlabs.com',
    apiUrl: 'https://et-gtm.intentlabs.com/',
    googleMapApiKey: 'AIzaSyCvLzQXngGNGBB60wY5d2DfeCznh8QZm2E',
    storageType: Storage.LocalStorage,
    reCaptchaSiteKey: '6LdBp60UAAAAAFybBZaEiBshGVKRexxEWObKcWOU',
    reCaptchaV2SiteKey: '6LegAkQUAAAAAOoGejQnzUhyjUInJkra0yGmR8SW',
    ...defaults,
    localization
};

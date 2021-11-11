import { Environment } from 'app/common/interfaces';
import { Storage } from 'app/common/enums/storage';
import { defaults } from './defaults.environment';
import { localization } from './locale.en-aus';

export const environment: Environment = {
    production: true,
    isAllowedInvalidAppSubmission: false,
    logAppModuleErrors: false,
    domainServer: 'api-au.enquirytracker.net',
    apiUrl: 'https://api-au.enquirytracker.net/',
    googleMapApiKey: 'AIzaSyDpjn9dt5LWZ5zFso8fddt3nYY1jNjgj2Q',
    storageType: Storage.LocalStorage,
    reCaptchaSiteKey: '6LeUmbQZAAAAADb6kqIGh7AcLjFKobHrYkKpEK9n',
    reCaptchaV2SiteKey: '6Ld8BdIZAAAAAMF07Z_T0OwXUu_2G-dLacklBA0u',
    ...defaults,
    localization
};

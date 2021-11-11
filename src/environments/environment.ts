import { Environment } from 'app/common/interfaces';
import { Storage } from 'app/common/enums/storage';
import { defaults } from './defaults.environment';
import { localization } from './locale.en-aus';

// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment: Environment = {
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

import { Environment } from 'app/common/interfaces';
import { Storage } from 'app/common/enums/storage';
import { defaults } from './defaults.environment.sm';
import { localization } from './locale.en-us';

export const environment: Environment = {
    production: true,
    isAllowedInvalidAppSubmission: false,
    logAppModuleErrors: false,
    domainServer: 'api.stg.connect.schoolmint.com',
    apiUrl: 'https://api.stg.connect.schoolmint.com/',
    googleMapApiKey: 'AIzaSyBiqUiatrV0L1_6E0Hb958XdavBtsgztp0',
    storageType: Storage.LocalStorage,
    reCaptchaSiteKey: '6LcD7XYbAAAAAO8o2F0W5_I2WLohaUVz5DkQvK_Q',
    reCaptchaV2SiteKey: '6LcE7XYbAAAAAMJV9hais4CxgSjgnZ-bdUtByxZS',
    ...defaults,
    localization
};

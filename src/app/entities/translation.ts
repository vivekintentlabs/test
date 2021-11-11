import { School } from './school';

export class Translation {
    public static CATEGORY_WEBFORM = 'webform';
    public static CATEGORY_OTHER = 'other';
    public static SUBCATEGORY_STUDENT = 'student';
    public static SUBCATEGORY_CONTACT = 'contact';
    public static SUBCATEGORY_GENERAL = 'general';
    public static SUBCATEGORY_HIDDEN = 'hidden';
    public static SUBCATEGORY_EVENTDETAILS = 'eventDetails';
    public static LOCALE_AU = 'en-AU';
    public static LOCALE_NZ = 'en-NZ';
    public static LOCALE_US = 'en-US';

    id: string;
    category: string;
    subCategory: string;
    locale: string;
    translation: string;
    schoolId: number;
    school?: School;
}

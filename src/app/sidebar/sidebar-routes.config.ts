import { environment } from 'environments/environment';
import { RouteInfo } from './sidebar.metadata';

export class AppRoutes {
    public static getAppRoutes(userInfo, debugMode, enrolment: string, year: string, isEnabledAppModule: boolean) {
        let appRoutes: RouteInfo[];
        const eventChildren = [{ path: 'list', title: 'Events List', ab: 'event_note' }];
        if (userInfo.isSysAdmin() || userInfo.isSchoolAdmin() || userInfo.isSchoolEditor()) {
            eventChildren.push({ path: 'personal-tour', title: 'Personal Tours', ab: 'developer_board' });
        }
        appRoutes = [
            {
                path: '/dashboard',
                title: 'Dashboard',
                type: 'link',
                icontype: 'dashboard',
                hidden: !(userInfo.isSysAdmin() || userInfo.isSchoolAdmin() || userInfo.isSchoolEditor() || userInfo.isSchoolUser()),
            },
            {
                path: `/${environment.localization.enquiriesUrl}`,
                title: environment.localization.enquiriesTitle,
                type: 'sub',
                icontype: 'account_box',
                collapse: 'enquiries',
                hidden: !(userInfo.isSysAdmin() || userInfo.isSchoolAdmin() || userInfo.isSchoolEditor()),
                children: [
                    { path: 'students', title: 'Students List', ab: 'people_outline' },
                    { path: 'contacts', title: 'Contacts List', ab: 'contacts' },
                    { path: 'duplicate-contacts', title: 'Duplicate Contacts List', ab: 'group', hidden: true }
                ]
            },
            {
                path: '/events',
                title: 'Events',
                type: 'sub',
                icontype: 'event_available',
                collapse: 'events',
                hidden: !(userInfo.isSysAdmin() || userInfo.isSchoolAdmin() || userInfo.isSchoolEditor()),
                children: eventChildren
            },
            {
                path: '/communications',
                title: 'Communications',
                type: 'sub',
                icontype: 'comment',
                collapse: 'communications',
                hidden: !(userInfo.isSysAdmin() || userInfo.isSchoolAdmin() || userInfo.isSchoolEditor()),
                children: [
                    { path: 'email', title: 'Email', ab: 'mail_outline' },
                ]
            },
            {
                path: '/applications/promo',
                title: 'Applications',
                type: 'link',
                icontype: 'settings_applications',
                hidden: !(userInfo.isSchoolEditorOrHigher() && !isEnabledAppModule)
            },
            {
                path: '/applications',
                title: 'Applications',
                type: 'sub',
                icontype: 'settings_applications',
                collapse: 'applications',
                hidden: !(userInfo.isSchoolEditorOrHigher() && isEnabledAppModule),
                children: [
                    { path: 'index', title: 'Applications', ab: 'list' },
                    { path: 'forms', title: 'App Forms', ab: 'assignment', hidden: !userInfo.isSchoolAdminOrHigher()},
                    { path: 'school-lists-application', title: 'App Lists', ab: 'list', hidden: !userInfo.isSchoolAdminOrHigher() },
                ]
            },
            {
                path: '/analytics',
                title: 'Analytics',
                type: 'sub',
                icontype: 'insert_chart',
                collapse: 'analytics',
                hidden: !(userInfo.isSysAdmin() || userInfo.isSchoolAdmin() || userInfo.isSchoolEditor() || userInfo.isSchoolUser()),
                children: [
                    { path: 'demographic', title: 'Demographic', ab: 'multiline_chart' },
                    { path:  environment.localization.enquiriesUrl, title: environment.localization.enquiriesTitle, ab: 'timeline' },
                    { path: 'events', title: 'Events', ab: 'event' },
                    { path: 'geographic', title: 'Geographic', ab: 'place' },
                    { path: 'research', title: 'Research', ab: 'analytics' },
                    { path: 'school', title: 'School', ab: 'import_contacts' }
                ]
            },
            {
                path: '/admin',
                title: 'Admin',
                type: 'sub',
                icontype: 'settings_applications',
                collapse: 'admin',
                hidden: !(userInfo.isSysAdmin() || userInfo.isSchoolAdmin()),
                children: [
                    { path: 'edit-school', title: 'Edit School', ab: 'mode_edit' },
                    { path: 'dashboard-config', title: 'Dashboard Configuration', ab: 'dashboard' },
                    // { path: 'products', title: 'Products List', ab: 'list', hidden: !(userInfo.isSysAdmin()) },
                    { path: 'year-level', title: `${year} Levels`, ab: 'list' },
                    { path: 'enrolment-target', title: enrolment + ' Target', ab: 'list' },
                    { path: 'school-users', title: 'School Users', ab: 'people_outline' },
                    { path: 'school-lists', title: 'School Lists', ab: 'list' },
                    { path: 'standart-lists', title: 'Standard Lists', ab: 'language' },
                    { path: 'ranking-score', title: 'Ranking Score', ab: 'accessibility' },
                    { path: 'current-schools', title: 'Current Schools', ab: 'account_balance' },
                    { path: 'emails', title: 'Emails', ab: 'mail_outline' },
                    { path: 'signup-forms', title: 'Signup Forms', ab: 'assignment' },
                    { path: 'app-integration', title: 'App Integration', ab: 'account_circle' }
                ]
            },
            {
                path: '/system-admin',
                title: 'System Admin',
                type: 'sub',
                icontype: 'settings_applications',
                collapse: 'system-admin',
                hidden: !userInfo.isSysAdmin(),
                children: [
                    { path: 'schools', title: 'Schools List', ab: 'school' },
                    { path: 'student-status', title: 'Student Status', ab: 'list' },
                    { path: 'operation-mode', title: 'Operation Mode', ab: 'settings_applications' },
                    { path: 'event-pt', title: 'Events/Personal Tours', ab: 'event_available' },
                    { path: 'app-masterform', title: 'Application Master form', ab: 'settings_applications' }
                ]
            },
        ];
        return appRoutes;
    }
}

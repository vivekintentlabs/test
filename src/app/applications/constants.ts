export class AppConstants {
    public static currentSchoolYearProperty = 'yl_currentSchoolYear';
    public static schoolIntakeYearProperty = 'yl_seekEnrolmentYearLevel';

    public static photoDefaultName = 'photo.jpeg';

    public static allowedAppModuleFileExtentions: string[] = ['.doc', '.docx', '.pdf',
    '.odt', '.png', '.gif', '.bmp', '.jpg', '.jpeg', '.heic', '.heif'];
    public static allowedAppMpduleFileTypes: string[] = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword', 'application/pdf', 'application/vnd.oasis.opendocument.text', 'image/png', 'image/gif',
    'image/bmp', 'image/jpeg', 'image/heic', 'image/heif'];

    public static maxAppFileSize = 1048576 * 10;
    public static maxAppFilesToUpload = 20;

    public static appFormAfterTypingSaveInMs = 10000;
    public static appFormWhileTypingSaveInMs = 5000;
    public static appFormAfterTypingUpdateViewsInMs = 100;
}

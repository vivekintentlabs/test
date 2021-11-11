import { School } from './school';

export class ExportMapping {
    public static TYPE_PIPELINE = 'pipeline';
    public static TYPE_APPLY = 'apply';
    public static TRANSFER_METHOD_EMAIL = 'email';
    public static TRANSFER_METHOD_EXTERNAL_API = 'external-api';
    public static TRANSFER_METHOD_DIRECT_DOWNLOAD = 'direct-download';
    public static EXPORTER_SYN_APP_NATIVE = 'syn-app-native';
    public static EXPORTER_PARTNER = 'partner';

    format: string;
    transferMethod: 'email' | 'external-api' | 'direct-download';
    type: 'apply' | 'pipeline';
    canAddPassword: boolean;
    exporter: 'syn-app-native' | 'partner';
}

export abstract class FileService {
    uploadAppFiles: (docId: string, formId: string, sectionId: string, sendableFormData: FormData, userName: string) => Promise<any>;
    removeAppFile: (docId: string, formId: string, sectionId: string, name: string) => Promise<any>;
    downloadAppFile: (docId: string, formId: string, sectionId: string, name: string) => Promise<any>;
}

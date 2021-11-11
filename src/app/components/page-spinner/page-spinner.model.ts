export class PageSpinner {
    message: string;
    promise: Promise<any>;

    constructor(init?: Partial<PageSpinner>) {
        Object.assign(this, init);
    }
}
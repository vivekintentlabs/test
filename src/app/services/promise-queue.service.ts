import { Injectable } from '@angular/core'


@Injectable()
export class PromiseQueueService {
    private promiseQueue: any[] = [];
    private workingOnPromise = false;

    public enqueuePromise(promise: Promise<any>): Promise<void> {
        return new Promise((resolve, reject) => {
            this.promiseQueue.push({ promise, resolve, reject });
            this.dequeuePromises();
        });
    }

    private dequeuePromises(): boolean {
        if (this.workingOnPromise) {
            return false;
        }
        const item = this.promiseQueue.shift();
        if (!item) {
            return false;
        }
        try {
            this.workingOnPromise = true;
            item.promise()
                .then((value) => {
                    this.workingOnPromise = false;
                    item.resolve(value);
                    this.dequeuePromises();
                })
                .catch(err => {
                    this.workingOnPromise = false;
                    item.reject(err);
                    this.dequeuePromises();
                })
        } catch (err) {
            this.workingOnPromise = false;
            item.reject(err);
            this.dequeuePromises();
        }
        return true;
    }

}

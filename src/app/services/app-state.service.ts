import { Injectable, OnDestroy } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { HttpService } from "./http.service";
import { ListenerService } from "./listener.service";
import { SchoolService } from "../state/school/school.service";

import { Utils } from "../common/utils";
import { School } from "../entities/school";
import { UserInfo } from "../entities/userInfo";

@Injectable({ providedIn: 'root' })
export class AppStateService implements OnDestroy {
    private unsubscribe = new Subject();

    constructor(
        private listenerService: ListenerService,
        private schoolService: SchoolService,
        private httpService: HttpService,
    ) {
        this.listenerService.schoolListStatus().pipe(takeUntil(this.unsubscribe)).subscribe(() => this.updateStateSchool());
    }

    public updateStateSchool() {
        const userInfo: UserInfo = Utils.getUserInfoFromToken();
        return this.httpService.getAuth('schools/get/' + userInfo.schoolId).then((school: School) => {
            this.schoolService.set(school);
        });
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

}

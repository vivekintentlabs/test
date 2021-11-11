import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { DataService } from './data.service';


@Injectable({
    providedIn: 'root',
})
export class ListenerService {
    private schoolListSwitch = false;
    private schoolList = new Subject<any>();

    private campusListSwitch = false;
    private campusList = new Subject<any>();

    private eventListSwitch = false;
    private eventList = new Subject<any>();

    private sidebarWasToggled = false;
    private sidebarToggle = new Subject<any>();

    private capacityListSwitch = false;
    private capacityList = new Subject<any>();

    constructor(private dataService: DataService) { }

    public schoolListChanged() {
        this.dataService.resetAll();
        this.schoolListSwitch = !this.schoolListSwitch;
        this.schoolList.next(!this.schoolListSwitch);
    }

    public schoolListStatus(): Observable<any> {
        return this.schoolList.asObservable();
    }

    public campusListChanged() {
        this.dataService.resetAll();
        this.campusListSwitch = !this.campusListSwitch;
        this.campusList.next(!this.campusListSwitch);
    }

    public campusListStatus(): Observable<any> {
        return this.campusList.asObservable();
    }


    public eventListChanged() {
        this.eventListSwitch = !this.eventListSwitch;
        this.eventList.next(!this.eventListSwitch);
    }

    public eventListStatus(): Observable<any> {
        return this.eventList.asObservable();
    }

    public sidebarToggled() {
        this.sidebarWasToggled = !this.sidebarWasToggled;
        this.sidebarToggle.next(!this.sidebarWasToggled);
    }

    public sidebarStatus(): Observable<any> {
        return this.sidebarToggle.asObservable();
    }

    public capacityListChanged() {
        this.capacityListSwitch = !this.capacityListSwitch;
        this.capacityList.next(!this.capacityListSwitch);
    }

    public capacityListStatus(): Observable<any> {
        return this.capacityList.asObservable();
    }

}

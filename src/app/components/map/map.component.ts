import { Component, OnInit, OnChanges, Input, SimpleChanges, NgZone } from '@angular/core';
import { Router } from '@angular/router';

import { Utils } from 'app/common/utils';

import { Campus } from 'app/entities/campus';
import { UserInfo } from 'app/entities/userInfo';
import { YearLevel } from 'app/entities/year-level';
import { Geographic } from 'app/entities/local/geographic';

import * as _ from 'lodash';
import { environment } from 'environments/environment';

declare const google: any;
declare var $: any;


@Component({
    selector: 'app-google-map',
    templateUrl: './map.component.html',
    styleUrls: ['map.component.scss']
})

export class GoogleMapComponent implements OnChanges, OnInit {

    @Input() locations: _.Dictionary<Geographic[]>;
    @Input() selectedYearLevels: YearLevel[];
    @Input() campuses: Campus[];
    @Input() startingYears: number[];

    public bounds = new google.maps.LatLngBounds();
    public map: any = null;
    public iw: any = null;
    public currentIW: any = null;
    public mapOptions: object = {};
    private markers = [];
    public color: string[] = [
        'text-info', 'text-danger', 'text-warning', 'text-primary', 'text-success', 'text-six',
        'text-seven', 'text-eight', 'text-nine', 'text-ten', 'text-eleven', 'text-twelve'
    ];
    public outputColors: string[] = [];
    public colorsIcon: string[] = [
        '#00bcd4', '#f44336', '#ff9800', '#9c27b0', '#4caf50', '#337ab7', '#add', '#ad3', '#2196F3', '#ffeb3b', '#55acee', '#cc2127'
    ];
    private userInfo: UserInfo = null;
    public isClickableLegend: boolean;

    constructor(private router: Router, private zone: NgZone) {
        this.userInfo = Utils.getUserInfoFromToken();
    }

    public ngOnInit() {
        let campus: Campus;
        if (this.campuses.length > 1) {
            campus = _(this.campuses).find((item: Campus) => item.campusType === Campus.CAMPUS_TYPE_MAIN);
        } else {
            campus = this.campuses[0];
        }
        if (campus.campusType === Campus.CAMPUS_TYPE_UNDECIDED) {
            const mainCampus = _.find(this.campuses, c => c.campusType === Campus.CAMPUS_TYPE_MAIN);
            campus.lat = mainCampus.lat;
            campus.lng = mainCampus.lng;
        }
        this.mapOptions = {
            zoom: 12,
            center: new google.maps.LatLng(campus.lat, campus.lng),
            scrollwheel: false, // we disable de scroll over the map, it is a really annoing when you scroll through page
            disableDefaultUI: true, // a way to quickly hide all controls
            zoomControl: true,
            styles: [
                { featureType: 'water', stylers: [{ saturation: 43 }, { lightness: -11 }, { hue: '#0088ff' }] },
                {
                    featureType: 'road', elementType: 'geometry.fill', stylers: [
                        { hue: '#ff0000' }, { saturation: -100 }, { lightness: 99 }
                    ]
                },
                { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#808080' }, { lightness: 54 }] },
                { featureType: 'landscape.man_made', elementType: 'geometry.fill', stylers: [{ color: '#ece2d9' }] },
                { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#ccdca1' }] },
                { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#767676' }] },
                { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
                { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                {
                    featureType: 'landscape.natural', elementType: 'geometry.fill', stylers: [
                        { visibility: 'on' }, { color: '#b8cb93' }
                    ]
                },
                { featureType: 'poi.park', stylers: [{ visibility: 'on' }] },
                { featureType: 'poi.sports_complex', stylers: [{ visibility: 'on' }] },
                { featureType: 'poi.medical', stylers: [{ visibility: 'on' }] },
                { featureType: 'poi.business', stylers: [{ visibility: 'simplified' }] }
            ]
        };
        this.map = new google.maps.Map(document.getElementById('customSkinMap'), this.mapOptions);
        this.initializeColors();
        this.initializeCampusMarkers();
        this.initializeMarkers();
    }

    ngOnChanges(changes: SimpleChanges) {
        this.isClickableLegend = this.userInfo.isSchoolEditorOrHigher();
        this.initializeColors();
        this.cleanUpMap();
        this.initializeCampusMarkers();

        if (!_.isEmpty(this.locations)) {
            this.initializeMarkers();
        }
    }

    public cleanUpMap() {
        _.forEach(this.markers, (marker) => {
            marker.setMap(null);
        });
        this.markers = [];
    }

    initializeMarkers() {
        _.forEach(this.selectedYearLevels, yl => {
            const locations = this.locations[yl.name];
            _.forEach(locations, location => {
                this.geocodeAddress(location);
            });
        });
    }

    initializeCampusMarkers() {
        _.forEach(this.campuses, (c: Campus) => {
            const marker = new google.maps.Marker({
                icon: 'https://www.google.com/maps/vt/icon/name=assets/icons/poi/tactile/pinlet_shadow-2-medium.png,assets/icons/poi/tactile/pinlet_outline_v2-2-medium.png,assets/icons/poi/tactile/pinlet-2-medium.png,assets/icons/poi/quantum/pinlet/school_pinlet-2-medium.png&highlight=ff000000,ffffff,db4437,ffffff&color=ff000000?scale=1.33',
                position: new google.maps.LatLng(c.lat, c.lng),
                title: c.name,
            });
            this.infoWindowCampus(marker, this.map, c);
            marker.setMap(this.map);
            this.markers.push(marker);
        });
    }

    geocodeAddress(location: Geographic) {
        if (location.contact.lat && location.contact.lng) {
            const marker = new google.maps.Marker({
                position: new google.maps.LatLng(location.contact.lat, location.contact.lng),
                title: location.contact.firstName + ' ' + location.contact.lastName,
                animation: google.maps.Animation.DROP,
                address: location.address,
                url: `${environment.localization.enquiriesUrl}/edit-contact;contactId=${location.contact.id}`,
                icon: this.setIconImage(location)
            });
            this.iw = new google.maps.InfoWindow({
                content: '',
                maxWidth: 350
            });
            this.infoWindowContact(
                marker,
                this.map,
                `${location.contact.firstName} ${location.contact.lastName}`,
                location.address,
                location.contact.id
            );
            marker.setMap(this.map);
            this.markers.push(marker);
        }
    }

    initializeColors() {
        const colors: string[] = this.color.slice();
        const tempColors: string[] = [''];
        this.selectedYearLevels.forEach((sy: any) => {
            switch (sy.name) {
                default: tempColors.push(''); break;
            }
        });
        _.forEach(tempColors, (name: string, index) => {
            if (name === '') {
                tempColors[index] = colors.shift();
            }
        });
        this.outputColors = tempColors;
    }

    infoWindowContact(marker, map, title, address, contactId) {
        google.maps.event.addListener(marker, 'click', () => {
            let html = `<div><h3>${title}</h3><p>${address}</p></div>`;
            const htmlWithLink = `<p><a id="link-to-contact${contactId}" class="text-primary" style="cursor:pointer">View contact</a></p>`;

            if (!this.userInfo.isSchoolUser()) {
                html = html + htmlWithLink;
            }
            this.iw.setContent(html);
            this.currentIW = this.iw;
            if (typeof (this.iw) !== 'undefined') {
                this.iw.close();
            }
            this.iw.open(map, marker);
            // wait until window has been added to dom
            google.maps.event.addListener(this.iw, 'domready', this.addClickHandler.bind(this, contactId));
            google.maps.event.addListener(map, 'click', () => {
                if (typeof (this.currentIW) !== 'undefined') {
                    this.currentIW.close();
                }
            });
        });
    }

    infoWindowCampus(marker, map, campus: Campus) {
        google.maps.event.addListener(marker, 'click', () => {
            const html = `
                <div>
                    <h4>${campus.school.name}</h4>
                    <h4>${campus.name}</h4>
                    <p>
                        ${((campus.address) ? campus.address + ', ' : '') + ((campus.city) ? campus.city + ', ' : '')
                            + ((campus.administrativeAreaId) ? campus.administrativeArea.name : '')}
                    </p>
                </div>
            `;
            if (this.iw === null) {
                this.iw = new google.maps.InfoWindow({
                    content: '',
                    maxWidth: 350
                });
            }
            this.iw.setContent(html);
            this.currentIW = this.iw;
            if (typeof (this.iw) !== 'undefined') {
                this.iw.close();
            }
            this.iw.open(map, marker);
            google.maps.event.addListener(map, 'click', () => {
                if (typeof (this.currentIW) !== 'undefined') {
                    this.currentIW.close();
                }
            });
        });
    }

    addClickHandler(contactId) {
        $('#link-to-contact' + contactId).click(() => {
            this.navigaveToUser(contactId);
        });
    }

    navigaveToUser(contactId) {
        return this.zone.run(() => this.router.navigate([`${environment.localization.enquiriesUrl}/edit-contact`, { contactId }]));
    }

    setIconImage(location: Geographic) {
        const hexcolor = this.colorsIcon[_.findIndex(this.selectedYearLevels, ['name', location.schoolIntakeYear])];
        const icon = {
            path: 'M27.648-41.399q0-3.816-2.7-6.516t-6.516-2.7-6.516 2.7-2.7 6.516 2.7 6.516 6.516 2.7 6.516-2.7 2.7-6.516zm9.216 0q0 3.924-1.188 6.444l-13.104 27.864q-.576 1.188-1.71 1.872t-2.43.684-2.43-.684-1.674-1.872l-13.14-27.864q-1.188-2.52-1.188-6.444 0-7.632 5.4-13.032t13.032-5.4 13.032 5.4 5.4 13.032z',
            fillColor: hexcolor,
            fillOpacity: 1,
            strokeWeight: 0,
            scale: 0.65
        };
        return icon;
    }

    onClickLegend(legend: number) {
        this.router.navigate([`/${environment.localization.enquiriesUrl}/students`, {
            intakeYear: this.startingYears,
            intakeYearLevels: legend || 0,
            campusId: this.campuses[0].id
        }]);
    }
}

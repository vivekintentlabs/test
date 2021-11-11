import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Utils } from '../../common/utils';
import { ApplicationsService } from 'app/applications/applications.service';
import { MergeAppFormTemplateInfoDTO } from 'app/common/dto/merge-app-form-template-info';

import * as _ from 'lodash';

@Component({
    selector: 'apps-list-forms',
    templateUrl: 'apps-list-forms.component.html'
})

export class AppsListFormsComponent implements OnInit {
    displayedColumns: string[] = ['name', 'status', 'actions'];
    dataSource: MatTableDataSource<MergeAppFormTemplateInfoDTO>;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    constructor(private router: Router, private appsService: ApplicationsService) {}

    public ngOnInit() {
        return this.appsService.getFormTemplates().then((data: MergeAppFormTemplateInfoDTO[]) => {
            this.dataSource = Utils.createSortCaseInsensitiveMatTable<MergeAppFormTemplateInfoDTO>([]);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.dataSource.data = data;
            this.dataSource.sortingDataAccessor = (item, property) => {
                switch (property) {
                    default: return _.toLower(_.get(item, property));
                }
            };
            return data;
        }).catch(err => console.log(err));
    }

    edit(id: string) {
        this.router.navigate([this.appsService.BASE_URL + '/edit-form', id]);
    }

    setup(id: string) {
        this.router.navigate([`${this.appsService.BASE_URL}/${id}/setup`]);
    }
}

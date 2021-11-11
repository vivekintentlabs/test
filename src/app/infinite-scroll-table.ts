import { OnDestroy, ViewChild, Directive } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { StorageService } from 'app/services/storage.service';

import { Constants } from 'app/common/constants';
import { KeyValueCategory } from 'app/common/enums';
import { StorageAccessor } from 'app/common/storage/storage-accessor';
import { ITableState } from 'app/common/interfaces';
import { Utils } from './common/utils';

import { FilterValue } from './components/filter-constellation/interfaces/filter-value';

import * as _ from 'lodash';


@Directive()
export abstract class InfiniteScrollTable<T> implements OnDestroy {
    public abstract tableId: string;
    public dataSource: MatTableDataSource<T>;
    public displayedColumns: string[] = [];

    public selection = new SelectionModel<T>(true, [], true);
    public visibleSelectedCount = 0;
    public selectedCount = 0;

    public debounceTime = 500;
    public noDataInTableMsg = Constants.noDataInTable;
    public getTableRows: Promise<number> = null;

    public tableState: ITableState = { id: null, searchText: '', sortState: null, pageSize: null };

    private storageAccessor: StorageAccessor;
    public excludedIds: number[] = [];
    public includedIds: number[] = [];
    public selectAllHasBeenToggled = false;

    protected isTableBuilt = false;
    protected unsubscribe = new Subject<void>();
    protected sortDebounce = new Subject<Sort>();
    protected filterDebounce = new Subject<FilterValue[]>();
    protected searchDebounce = new Subject<string>();

    @ViewChild(MatSort, { static: true }) protected sort: MatSort;

    protected constructor(private storageService: StorageService) {
        this.storageAccessor = this.storageService.getStorageAccessor(KeyValueCategory.CATEGORY_TABLE);
        this.selection.changed.pipe(takeUntil(this.unsubscribe)).subscribe(() => this.selectionChanged());
    }

    protected buildTable(items: T[], isSortable = true) {
        this.dataSource = Utils.createSortCaseInsensitiveMatTable<T>(items);

        this.getTableState().then(() => {
            if (this.sort && isSortable) {
                this.dataSource.sort = this.sort;
                this.updateTableSorting();
                setTimeout(() => {
                    this.sort = null;
                    this.dataSource.sort = null;
                }, 0);
            }
        });

        setTimeout(() => {
            this.isTableBuilt = true;
        }, 600);
    }

    protected getTableState(): Promise<void> {
        return this.storageAccessor.get(this.tableId).then((tableState: ITableState) => {
            this.tableState = tableState || this.tableState;
        });
    }

    private updateTableSorting(): void {
        if (this.sort && this.tableState) {
            const sortState: Sort = this.tableState.sortState;

            if (sortState && sortState.active && sortState.direction !== '') {
                this.sort.active = sortState.active;
                this.sort.direction = sortState.direction;
                this.sort.sortChange.emit(sortState);
            }
        }
    }

    /**
     * Adds table state into db or updates table state values if it already exists in the db
     * @param filterValues
     */
    private setTableState(tableState: ITableState): Promise<void> {
        return this.storageAccessor.get(this.tableId).then(filter => {
            if (filter) {
                return this.storageAccessor.update(this.tableId, tableState);
            } else {
                return this.storageAccessor.add(this.tableId, tableState);
            }
        });
    }

    onSortChange(sortState: Sort) {
        if (!sortState) {
            return;
        }
        this.tableState.sortState = (sortState.direction) ? sortState : null;
        this.setTableState(this.tableState);
    }

    applySearch(searchText: string) {
        this.tableState.searchText = searchText;
        this.setTableState(this.tableState);
    }

    resetSearchText() {
        this.tableState.searchText = '';
        this.setTableState(this.tableState);
    }

    protected updateTable(items: T[]): void {
        if (this.dataSource) {
            this.dataSource.data = items;
        }
    }

    isAllSelected() {
        return this.selectAllHasBeenToggled && !this.excludedIds.length && !this.includedIds.length;
    }

    isPartiallySelected() {
        return this.excludedIds.length || this.includedIds.length;
    }

    masterToggle() {
        if (!this.isAllSelected()) {
            this.dataSource.filteredData.forEach(row => {
                this.selection.select(row);
            })
            this.selectAllHasBeenToggled = true;
        } else {
            this.selection.clear();
            this.selectAllHasBeenToggled = false;
        }
        this.excludedIds = [];
        this.includedIds = [];
        this.selectedCount = this.countSelectedRows();
    }

    protected selectionChanged() {
        this.visibleSelectedCount = this.getVisibleSelectedIds().length;
        const selectedIds = _.map(this.selection.selected, 'id');
        const allVisibleIds = _.map(this.dataSource.data, 'id');
        const unselectedIds = _.difference(allVisibleIds, selectedIds);
        if (!selectedIds.length) {
            this.selectAllHasBeenToggled = false;
        }
        if (this.selectAllHasBeenToggled) {
            this.includedIds = [];
            this.excludedIds = unselectedIds;
        } else {
            this.excludedIds = [];
            this.includedIds = selectedIds;
        }
        this.selectedCount = this.countSelectedRows();
    }

    protected countSelectedRows(): number {
        let selectedCount = 0;
        if (this.selection.selected.length) {
            if (this.excludedIds.length) {
                selectedCount = this.getTotalCount() - this.excludedIds.length;
            } else if (this.includedIds.length) {
                selectedCount = this.includedIds.length;
            } else {
                selectedCount = this.getTotalCount();
            }
        }
        return selectedCount;
    }

    protected abstract getTotalCount();

    protected abstract onScrollDown();

    protected getVisibleSelectedIds(): number[] {
        const selectedIds: number[] = _.map(this.selection.selected, 'id');
        return _(this.dataSource.filteredData).filter(s => _.includes(selectedIds, _.get(s, 'id'))).map(s => _.get(s, 'id')).uniq().value();
    }

    protected deselectItems(removedItemsIds: number[]) {
        removedItemsIds.forEach(id => {
            const item = this.dataSource.data.find(s => _.get(s, 'id') === id);
            if (item && this.selection.isSelected(item)) {
                this.selection.deselect(item);
            }
        });
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }
}

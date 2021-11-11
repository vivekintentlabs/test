import { OnDestroy, ViewChild, Directive } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';

import { StorageService } from 'app/services/storage.service';

import { Constants } from 'app/common/constants';
import { Utils } from 'app/common/utils';
import { KeyValueCategory } from 'app/common/enums';
import { StorageAccessor } from 'app/common/storage/storage-accessor';
import { ITableState } from 'app/common/interfaces';

import * as _ from 'lodash';


@Directive()
export abstract class BaseTable<T> implements OnDestroy {
    public abstract tableId: string;
    public dataSource: MatTableDataSource<T>;
    displayedColumns: string[] = [];

    private storageAccessor: StorageAccessor;
    tableState: ITableState = { id: null, searchText: '', sortState: null, pageSize: null };

    selection = new SelectionModel<T>(true, [], true);
    visibleSelectedCount = 0;

    public noDataInTable = Constants.noDataInTable;
    public tableIsLoading: Promise<any> = null;

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    subscrSelection: Subscription;

    constructor(private storageService: StorageService) {
        this.storageAccessor = this.storageService.getStorageAccessor(KeyValueCategory.CATEGORY_TABLE);
        this.subscrSelection = this.selection.changed.subscribe(() => this.selectionChanged());
    }

    protected buildTable(items: T[], enablePaginator = true, pageSizeOptions = true) {
        this.dataSource = Utils.createSortCaseInsensitiveMatTable<T>(items);
        if (enablePaginator && this.paginator) {
            this.dataSource.paginator = this.paginator;
            this.dataSource.paginator.showFirstLastButtons = true;
            this.storageAccessor.get(this.tableId).then((tableState: ITableState) => {
                if (this.dataSource.paginator) {
                    this.dataSource.paginator.pageSize =
                        tableState && tableState.pageSize ? tableState.pageSize : Constants.defaultItemsShownInTable;
                }
                if (pageSizeOptions) {
                    this.dataSource.paginator.pageSizeOptions = Constants.pageSizeOptions;
                    this.dataSource.sort = this.sort;
                }
            });
        }
        if (!enablePaginator || !pageSizeOptions) {
            this.dataSource.sort = this.sort;
        }

        // customization for filter
        this.dataSource.filterPredicate = (data, filter: string) => {
            const values = [];
            this.displayedColumns.forEach(fieldName => {
                const value = _.get(data, fieldName);
                if (value) {
                    values.push(_.toLower(value));
                }
            });
            const transformedFilter = filter.trim().toLowerCase();
            return values.find(i => _.includes(i, transformedFilter));
        };
    }

    /**
     * Gets table state from the db and calls loadFilterValues() if filter has values
     */
    private getTableState(): Promise<void> {
        return this.storageAccessor.get(this.tableId).then((tableState: ITableState) => {
            if (tableState) {
                this.tableState = tableState;
                this.applyFilter(this.tableState.searchText);

                const sortState: Sort = this.tableState.sortState;
                if (sortState && sortState.active && sortState.direction !== '') {
                    this.sort.active = sortState.active;
                    this.sort.direction = sortState.direction;
                    this.sort.sortChange.emit(sortState);
                }
                if (this.dataSource.paginator) {
                    this.dataSource.paginator.pageSize =
                        this.tableState && tableState.pageSize ? tableState.pageSize : Constants.defaultItemsShownInTable;
                }
                return Promise.resolve();
            } else {
                return Promise.resolve();
            }
        });
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

    onPaginatorChange(paginator: PageEvent) {
        if (!paginator) {
            return;
        }
        this.tableState.pageSize = (paginator.pageSize);
        this.setTableState(this.tableState);
    }

    protected updateTable(items: T[]) {
        if (this.dataSource) {
            this.dataSource.data = items;
        }
        this.getTableState();
    }

    resetSearchText() {
        setTimeout(() => {
            this.applyFilter('');
        }, 0);
    }

    applyFilter(filterValue: string) {
        this.tableState.searchText = (filterValue) ? filterValue.trim() : '';
        this.setTableState(this.tableState);

        this.dataSource.filter = this.tableState.searchText.toLowerCase();
        this.selectionChanged();
    }

    /** Whether the number of selected elements matches the total number of rows. */
    isAllSelected() {
        const filteredIds = this.dataSource.filteredData.map(s => _.get(s, 'id'));
        const numSelected = this.selection.selected.filter(s => _.includes(filteredIds, _.get(s, 'id'))).length;
        const numRows = this.dataSource.filteredData.length;
        return numSelected === numRows;
    }

    isPartiallySelected() {
        const filteredIds = this.dataSource.filteredData.map(s => _.get(s, 'id'));
        const numSelected = this.selection.selected.filter(s => _.includes(filteredIds, _.get(s, 'id'))).length;
        const numRows = this.dataSource.filteredData.length;
        return (numSelected < numRows && numSelected > 0);
    }

    // Selects all rows if they are not all selected; otherwise clear selection.
    masterToggle() {
        if (!this.isAllSelected()) {
            this.dataSource.filteredData.forEach(row => {
                this.selection.select(row);
            });
        } else {
            this.dataSource.filteredData.forEach(row => {
                this.selection.deselect(row);
            });
        }
    }

    protected selectionChanged() {
        this.visibleSelectedCount = this.getVisibleSelectedIds().length;
    }

    protected updateSelection(allFilteredItems: T[], jumpToFirstPage = true) {
        const newSelection = allFilteredItems.filter(s => _.includes(this.selection.selected.map(i => _.get(s, 'id')), _.get(s, 'id')));
        this.subscrSelection.unsubscribe();
        this.selection = new SelectionModel<T>(true, newSelection, true);
        this.subscrSelection = this.selection.changed.subscribe(() => this.selectionChanged());
        if (jumpToFirstPage) {
            this.paginator.firstPage();
        }
    }


    protected getVisibleSelectedIds<U = number>(): U[] {
        const selectedIds: U[] = this.selection.selected.map(s => _.get(s, 'id'));
        return _(this.dataSource.filteredData).filter(s => _.includes(selectedIds, _.get(s, 'id'))).map(s => _.get(s, 'id')).value();
    }

    protected deselectItems<V = number>(removedItemsIds: V[]) {
        removedItemsIds.forEach(id => {
            const item = this.dataSource.data.find(s => _.get(s, 'id') === id);
            if (item && this.selection.isSelected(item)) {
                this.selection.deselect(item);
            }
        });
    }

    ngOnDestroy() {
        this.subscrSelection.unsubscribe();
    }
}

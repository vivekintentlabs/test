import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';

import { Product } from 'app/entities/product';
import { Constants } from 'app/common/constants';
import { Currency } from 'app/common/interfaces';
import { T } from 'app/common/t';

import * as _ from 'lodash';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-products',
    templateUrl: 'products.component.html',
    styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {

    public products: Array<Product> = [];
    public currencies: Array<Currency> = Constants.Currencies;

    constructor(private router: Router, private httpService: HttpService, private ref: ChangeDetectorRef) { }

    ngOnInit() {
        return this.httpService.getAuth('product').then((products: Array<Product>) => {
            _.forEach(products, (product: Product) => {
                const currency = _.find(this.currencies, (item: Currency) => item.countryName === product.country);
                this.products.push({
                    id: product.id,
                    country: product.country,
                    description: product.description,
                    tierRangeLowerValue: (product.tierRangeLowerValue === null) ? ' - ' : product.tierRangeLowerValue,
                    tierRangeUpperValue: (product.tierRangeUpperValue === null) ? ' - ' : product.tierRangeUpperValue,
                    monthlyRate: currency.currencySymbol + product.monthlyRate,
                    currency: (currency !== undefined) ? currency.currencyText : T.unknown,
                    establishmentFee: currency.currencySymbol + product.establishmentFee,
                    additionalCampusFee: currency.currencySymbol + product.additionalCampusFee
                });
            });
        });
    }

    addItem() {
        this.router.navigate(['/admin/add-product']);
    }

    editItem(id: number) {
        this.router.navigate(['/admin/edit-product', id]);
    }

    remove(productId: number) {
        Swal.fire({
            title: 'Are you sure?',
            text: 'You won\'t be able to revert this item.',
            type: 'warning',
            showCancelButton: true,
            confirmButtonClass: 'btn btn-delete',
            cancelButtonClass: 'btn btn-cancel',
            confirmButtonText: 'Yes, delete item(s)!',
            buttonsStyling: false
        }).then((result) => {
            if (result && result.value) {
                this.httpService.getAuth('product/delete/' + productId).then((res) => {
                    this.router.navigate(['admin/products']);
                    Swal.fire({
                        title: 'Deleted!',
                        text: 'Your item has been deleted.',
                        type: 'success',
                        confirmButtonClass: 'btn btn-success',
                        buttonsStyling: false
                    });
                }).catch(err => console.log(err));
            }
        });
    }

}

import '@angular/compiler'; // Needs for bootstrap using '@angular/platform-browser-dynamic' or '@angular/platform-server'
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { persistState, enableAkitaProdMode } from '@datorama/akita';

import { AppModule } from 'app/app.module';
import { environment } from 'environments/environment';

if (environment.production) {
    enableProdMode();
    enableAkitaProdMode();
}

export const persistStorage = persistState({
    include: [
        'school',
    ],
    key: 'ETStore'
});

export const chartPersistStorage = persistState({
    include: [
        'chart'
    ],
    key: 'ETChartStore'
});

const providers = [
    { provide: 'persistStorage', useValue: persistStorage },
    { provide: 'chartPersistStorage', useValue: chartPersistStorage }
];

platformBrowserDynamic(providers).bootstrapModule(AppModule);

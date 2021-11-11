import { Routes } from '@angular/router';

import { AuthGuard } from '../services/auth.guard';


export const ComponentsRoutes: Routes = [
    {
        path: '', canActivate: [AuthGuard],
        children: [
            // { // example
            //     path: 'buttons',
            //     component: ButtonsComponent
            // },
        ]
    },
];

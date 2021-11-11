import { ZingchartAngularComponent } from 'zingchart-angular';

// Zingchart doesn't provide a proper types of functions and properties. This interface will add those missing
// functions & properties. This gives us a flexibility to use typing.
interface MissingZingChartFunctions {
    print(): void;
    saveasimage(json: object);
    downloadCSV(json: object);
    downloadXLS(json: object);
    getimagedata(json: object);
    downloadRAW();
    resize(object: object);
}
declare type CustomZingChartAngularComponent = ZingchartAngularComponent & MissingZingChartFunctions;

import { School } from './school';
import { User } from './user';
import { ImgDisplayWidth } from './img-display-width';

export class EmailSignature {
    public static LOCATION_LEFT = 'Left';
    public static LOCATION_BELOW = 'Below';
    id: number;
    includeLogo: boolean;
    locationLogo: string;
    signature: string;
    imgDisplayWidthId: number;
    imgDisplayWidth: ImgDisplayWidth;
    userId: number;
    user: User;
    schoolId: number;
    school: School;
}

import { MinifiedContact } from './interfaces';


export type DuplicateContact = MinifiedContact & {
    duplicate: number,
    checked: boolean,
    name: string,
    color: string
}

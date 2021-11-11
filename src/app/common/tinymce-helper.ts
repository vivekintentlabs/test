import * as tinymce from 'tinymce';
import 'tinymce/themes/modern';
import 'tinymce/plugins/textcolor/plugin';
import 'tinymce/plugins/link/plugin';
import 'tinymce/plugins/image/plugin';
import 'tinymce/plugins/code/plugin';
import 'tinymce/plugins/lists/plugin';

// toolbars
const toolbarGroups = [
    'formatselect',
    'bold italic underline',
    'forecolor',
    'fontselect',
    'fontsizeselect',
    'alignleft aligncenter alignright alignjustify',
    'bullist numlist',
    'link',
    'image',
    'removeformat',
    'insertFields'
];

const adminToolbarGroups = [
    'code'
]

export const basicToolbar = toolbarGroups.join(' | ');
export const adminToolbar = toolbarGroups.concat(adminToolbarGroups).join(' | ');

// URLs for skins packaged with our distribution (not sure why, speed?)
export const skinUrl = {
    lightGray: '/assets/tinymce/skins/lightgray',
    inlineEditor: '/assets/tinymce/skins/inlineeditor'
}

// configurations
export interface TinyMceConfig {
    convert_urls: boolean;
    relative_urls: boolean;
    skin_url: string;
    selector: string;
    force_br_newlines: boolean;
    force_p_newlines: boolean;
    forced_root_block: string;
    height: string;
    statusbar: boolean;
    branding: boolean;
    inline: boolean;
    fixed_toolbar_container: string;
    menubar: boolean;
    plugins: string[];
    fontsize_formats: string;
    default_link_target: string;
    toolbar: string;
    setup: (editor) => void;
}

const defaultConfig: Partial<TinyMceConfig> = {
    convert_urls: false,
    relative_urls: false,
    skin_url: skinUrl.lightGray,
    force_br_newlines: true,
    force_p_newlines: false,
    forced_root_block: '', // Needed for 3.x
    height: '250',
    statusbar: true,
    branding: true,
    inline: false,
    fixed_toolbar_container: '',
    menubar: false,
    plugins: [
        'textcolor', 'link', 'image', 'code', 'lists'
    ],
    fontsize_formats: '8pt 10pt 12pt 14pt 18pt 24pt 36pt',
    default_link_target: '_blank',
    toolbar: basicToolbar,
}

// main helper
export function initTinyMCE(config: Partial<TinyMceConfig>) {
    tinymce.init({
        ...defaultConfig,
        ...config
    });
}

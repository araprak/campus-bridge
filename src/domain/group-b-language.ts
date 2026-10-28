export const GROUP_B_LANGUAGE_COOKIE='cb_group_b_language';
export const WEBSITE_LANGUAGES=[
 {code:'ar',name:'Arabic',native:'العربية',direction:'rtl'},
 {code:'yue-Hant',name:'Cantonese',native:'粵語',direction:'ltr'},
 {code:'en',name:'English',native:'English',direction:'ltr'},
 {code:'fr',name:'French',native:'Français',direction:'ltr'},
 {code:'de',name:'German',native:'Deutsch',direction:'ltr'},
 {code:'hi',name:'Hindi',native:'हिन्दी',direction:'ltr'},
 {code:'it',name:'Italian',native:'Italiano',direction:'ltr'},
 {code:'ja',name:'Japanese',native:'日本語',direction:'ltr'},
 {code:'kn',name:'Kannada',native:'ಕನ್ನಡ',direction:'ltr'},
 {code:'ko',name:'Korean',native:'한국어',direction:'ltr'},
 {code:'ml',name:'Malayalam',native:'മലയാളം',direction:'ltr'},
 {code:'zh-Hans',name:'Mandarin',native:'简体中文',direction:'ltr'},
 {code:'pt',name:'Portuguese',native:'Português',direction:'ltr'},
 {code:'es',name:'Spanish',native:'Español',direction:'ltr'},
 {code:'ta',name:'Tamil',native:'தமிழ்',direction:'ltr'},
 {code:'te',name:'Telugu',native:'తెలుగు',direction:'ltr'},
 {code:'ur',name:'Urdu',native:'اردو',direction:'rtl'},
] as const;
export type WebsiteLanguage=typeof WEBSITE_LANGUAGES[number]['code'];
export type LanguageDictionary=Readonly<Record<string,string>>;
export function readWebsiteLanguage(value:unknown):WebsiteLanguage{return WEBSITE_LANGUAGES.some(row=>row.code===value)?value as WebsiteLanguage:'en';}
export function websiteLanguageInfo(code:WebsiteLanguage){return WEBSITE_LANGUAGES.find(row=>row.code===code)!;}
const dictionaryIndexes=new WeakMap<LanguageDictionary,Map<string,string>>();

/** Preserve surrounding whitespace and never guess translations for unknown text. */
export function languageText(text:string,dictionary:LanguageDictionary):string{
 const core=text.trim().replace(/\s+/g,' ');if(!core)return text;
 let index=dictionaryIndexes.get(dictionary);if(!index){index=new Map(Object.entries(dictionary).map(([source,value])=>[source.toLocaleLowerCase('en'),value]));dictionaryIndexes.set(dictionary,index);}
 const exact=dictionary[core]??index.get(core.toLocaleLowerCase('en'));
 return exact?text.replace(text.trim(),exact):text;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {WEBSITE_LANGUAGES,readWebsiteLanguage,websiteLanguageInfo,languageText} from '../src/domain/group-b-language.ts';
test('the exact requested languages appear once in alphabetical order with Arabic and Urdu RTL',()=>{
 const expected=['Arabic','Cantonese','English','French','German','Hindi','Italian','Japanese','Kannada','Korean','Malayalam','Mandarin','Portuguese','Spanish','Tamil','Telugu','Urdu'];
 assert.deepEqual(WEBSITE_LANGUAGES.map(row=>row.name),expected);
 assert.equal(new Set(WEBSITE_LANGUAGES.map(row=>row.code)).size,17);
 assert.deepEqual(WEBSITE_LANGUAGES.filter(row=>row.direction==='rtl').map(row=>row.code),['ar','ur']);
 for(const value of [undefined,null,'','unknown','<script>','en-US','AR',{},42])assert.equal(readWebsiteLanguage(value),'en');
 for(const row of WEBSITE_LANGUAGES){assert.equal(readWebsiteLanguage(row.code),row.code);assert.deepEqual(websiteLanguageInfo(row.code),row);}
});
test('translations preserve whitespace, case-insensitive UI headings and unknown values without changing their content',()=>{
 const dict={'My plan':'मेरा प्लान','Save':'सहेजें'};
 assert.equal(languageText('  My plan\n',dict),'  मेरा प्लान\n');
 assert.equal(languageText('MY PLAN',dict),'मेरा प्लान');
 for(const input of ['alex@example.invalid','1234.56','My personal reminder','https://example.invalid/','  '])assert.equal(languageText(input,dict),input);
 assert.equal(languageText('My plan',{}),'My plan');
});
test('all sixteen translated catalogues cover every source phrase and preserve template tokens',async()=>{
 const source=JSON.parse(await readFile(new URL('../src/data/language-source.json',import.meta.url),'utf8')) as string[];
 assert.equal(source.length,new Set(source).size);
 for(const language of WEBSITE_LANGUAGES.filter(row=>row.code!=='en')){
  const dictionary=JSON.parse(await readFile(new URL(`../src/data/locales/${language.code}.json`,import.meta.url),'utf8')) as Record<string,string>;
  assert.deepEqual(Object.keys(dictionary).sort(),[...source].sort(),language.name);
  for(const phrase of source){assert.equal(typeof dictionary[phrase],'string',`${language.code}: ${phrase}`);assert.ok(dictionary[phrase].trim(),`${language.code}: ${phrase}`);assert.deepEqual(dictionary[phrase].match(/\{\w+\}/g)??[],phrase.match(/\{\w+\}/g)??[],`${language.code} tokens`);}
 }
});

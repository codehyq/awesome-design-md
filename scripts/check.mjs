import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseAmount,validDate,validState,seed,summary,breakdown} from '../design-md/ledger-clean/model.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let checks=0;
function check(name,run){run();checks++;console.log(`PASS ${name}`);}
check('Decimal strings convert to integer cents',()=>{
  for(const [text,cents] of [['0.01',1],['16.80',1680],['32.5',3250],['1000',100000],['9999999.99',999999999]])assert.equal(parseAmount(text),cents);
  for(const text of ['0','0.00','-1','1.234','1e3','NaN','Infinity','1,000.00','10000000',' 12 ','','１２'])assert.equal(parseAmount(text),null,text);
});
check('Calendar validation rejects overflow and unsupported dates',()=>{
  for(const date of ['2024-02-29','2026-10-28','1900-01-01','2100-12-31'])assert.equal(validDate(date),true,date);
  for(const date of ['2026-02-29','2026-04-31','2026-13-01','1899-12-31','2101-01-01','2026-1-1'])assert.equal(validDate(date),false,date);
});
check('Seed totals, chart breakdown and month boundaries agree',()=>{
  const data=seed(),oct=summary(data,'2026-10'),sep=summary(data,'2026-09');
  assert.equal(oct.income,1280000);assert.equal(oct.expense,333580);assert.equal(oct.balance,946420);
  assert.equal(sep.expense,286800);assert.equal(oct.entries.length,11);
  assert.equal(breakdown(oct.entries).reduce((a,c)=>a+c.amount,0),oct.expense);
  assert.equal(summary(data,'2027-01').entries.length,0);
});
check('Add/delete/over-budget changes preserve aggregates',()=>{
  const data=seed();data.entries.unshift({id:'000-test',type:'expense',category:'food',amount:1680,date:'2026-10-28',account:'现金',note:'测试'});
  assert.equal(summary(data,'2026-10').expense,335260);
  assert.equal(summary(data,'2026-10').entries[0].id,'000-test');
  data.budgets['2026-10']=10000;assert(summary(data,'2026-10').expense>summary(data,'2026-10').budget);
  data.entries=data.entries.filter(e=>e.id!=='000-test');assert.equal(summary(data,'2026-10').expense,333580);
});
check('Malformed stored ledgers are rejected',()=>{
  assert(validState(seed()));
  for(const mutate of [d=>d.entries[0].amount=0,d=>d.entries[0].amount=1.2,d=>d.entries[0].date='2026-02-30',d=>d.entries[0].category='salary',d=>d.entries[0].account='unknown',d=>d.entries[0].note='x'.repeat(81),d=>d.entries[0].id=d.entries[1].id,d=>d.budgets['2026-13']=100,d=>d.version=2]){const candidate=seed();mutate(candidate);assert.equal(validState(candidate),false);}
});
const catalog=JSON.parse(fs.readFileSync(path.join(root,'catalog/styles.json'),'utf8'));
check('Every DESIGN.md is indexed once with valid category and files',()=>{
  const folders=fs.readdirSync(path.join(root,'design-md')).filter(folder=>fs.existsSync(path.join(root,'design-md',folder,'DESIGN.md')));
  assert.equal(catalog.styles.length,folders.length);assert.equal(new Set(catalog.styles.map(s=>s.id)).size,folders.length);
  assert.equal(catalog.styles.filter(s=>s.kind==='reference').length,84);
  for(const s of catalog.styles){assert(catalog.categories.some(c=>c.id===s.category));assert(folders.includes(s.id));for(const field of ['design','demo','preview','cover'])if(s[field])assert(fs.existsSync(path.resolve(root,'catalog',s[field])),`${s.id}.${field}`);}
});
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.name.startsWith('.')||e.name==='output'?[]:e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
check('Static HTML local href/src paths resolve within repository',()=>{
  for(const file of walk(root).filter(f=>f.endsWith('.html'))){const html=fs.readFileSync(file,'utf8');for(const m of html.matchAll(/(?:href|src)="([^"\s]+)"/g)){const raw=m[1];if(/^(https?:|data:|#|mailto:)/.test(raw))continue;const relative=raw.split(/[?#]/)[0];if(!relative)continue;const absolute=path.resolve(path.dirname(file),relative);assert(absolute.startsWith(root+path.sep),`Escapes root: ${raw}`);assert(fs.existsSync(absolute),`Broken ${path.relative(root,file)} -> ${raw}`);}}
});
console.log(`\n${checks} check groups passed.`);

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
const categories=[
  ['AI & LLM Platforms','ai','AI 与大模型'],['Developer Tools & IDEs','developer','开发工具'],
  ['Backend, Database & DevOps','backend','后端与基础设施'],['Productivity & SaaS','productivity','效率与 SaaS'],
  ['Design & Creative Tools','creative','设计与创意'],['Fintech & Crypto','finance','金融与支付'],
  ['E-commerce & Retail','commerce','电商与零售'],['Media & Consumer Tech','consumer','媒体与消费科技'],
  ['Automotive','automotive','汽车'],['Retro Web · DESIGN.md Nostalgia','retro','复古网页'],
];
const sourceRows=[];
// Present on disk but omitted from the upstream README collection table.
const supplemental={slack:{name:'Slack',external:'https://getdesign.md/slack/design-md',description:'Workplace messaging. Deep aubergine, cream-lavender surfaces and pill-shaped actions.',category:'productivity',categoryLabel:'效率与 SaaS'}};
let current=null;
for(const line of readme.split(/\r?\n/)){
  if(line.startsWith('### '))current=categories.find(c=>line.slice(4)===c[0]);
  const match=line.match(/^- \[\*\*(.+?)\*\*\]\((https:\/\/getdesign\.md\/([^/]+)\/design-md)\) - (.+)$/);
  if(match&&current)sourceRows.push({name:match[1],external:match[2],slug:match[3],description:match[4],category:current[1],categoryLabel:current[2]});
}
const styles=[];
for(const folder of fs.readdirSync(path.join(root,'design-md')).sort()){
  if(folder==='ledger-clean')continue;
  const dir=path.join(root,'design-md',folder),doc=path.join(dir,'DESIGN.md');
  if(!fs.existsSync(doc))continue;
  const localReadme=fs.existsSync(path.join(dir,'README.md'))?fs.readFileSync(path.join(dir,'README.md'),'utf8'):'';
  const url=localReadme.match(/https:\/\/getdesign\.md\/[^\s)]+\/design-md/)?.[0];
  const row=sourceRows.find(r=>r.slug===folder||r.external===url)||supplemental[folder];
  if(!row)throw new Error(`Missing README category mapping for ${folder}`);
  const markdown=fs.readFileSync(doc,'utf8');
  const primary=markdown.match(/^  primary:\s*["']?(#[\da-fA-F]{6})/m)?.[1]||markdown.match(/^  [\w-]+:\s*["']?(#[\da-fA-F]{6})/m)?.[1]||'#54637d';
  styles.push({id:folder,name:row.name,subtitle:row.categoryLabel,category:row.category,categoryLabel:row.categoryLabel,kind:'reference',description:row.description,tags:[row.categoryLabel,'品牌参考'],accent:primary,design:`../design-md/${folder}/DESIGN.md`,external:row.external});
}
styles.unshift({id:'ledger-clean',name:'清爽工具型',subtitle:'Clear Ledger · 清账',category:'bookkeeping',categoryLabel:'记账应用',kind:'original',description:'清晰的数字层级，克制的蓝色，专注每一天的收支。适合快速记账、预算管理与月度复盘。',tags:['移动端','浅色','工具型','记账'],accent:'#315bdb',design:'../design-md/ledger-clean/DESIGN.md',demo:'../design-md/ledger-clean/demo.html',preview:'../design-md/ledger-clean/preview.html',cover:'../design-md/ledger-clean/cover.png',screens:4});
fs.mkdirSync(path.join(root,'catalog'),{recursive:true});
fs.writeFileSync(path.join(root,'catalog','styles.json'),JSON.stringify({version:1,categories:[{id:'bookkeeping',label:'记账应用'},...categories.map(c=>({id:c[1],label:c[2]}))],styles},null,2)+'\n');
console.log(`Catalog generated: ${styles.length} styles (${styles.filter(s=>s.kind==='reference').length} source references, 1 original).`);

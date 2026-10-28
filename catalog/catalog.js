import {icon,escapeHTML as esc} from '../design-md/ledger-clean/icons.js';
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
const results=document.querySelector('#style-results');
const searchInput=document.querySelector('#search');
const query=new URLSearchParams(location.search);
let selected=query.get('category')||'bookkeeping',kind='all',search=query.get('q')||'';
let catalog;
const categoryIcon=id=>({bookkeeping:'wallet',ai:'code',developer:'code',backend:'layers',productivity:'list',creative:'grid',finance:'wallet',commerce:'bag',consumer:'globe',automotive:'arrow',retro:'layers'}[id]||'grid');
function categoryButton(c){return `<button class="category-option" data-category="${c.id}"><span class="category-name">${icon(categoryIcon(c.id))}</span><span>${c.label}</span><span class="count">${catalog.styles.filter(s=>s.category===c.id).length}</span></button>`;}
function originalCard(s){return `<article class="featured-style"><div class="feature-copy"><div class="feature-meta"><span class="original-label">${icon('check')} 原创应用风格</span><span>NO. 001</span></div><h3>${s.name}</h3><p class="feature-subtitle">${s.subtitle}</p><p class="feature-description">${s.description}</p><div class="style-tags">${s.tags.map(t=>`<span>${t}</span>`).join('')}</div><div class="palette" aria-label="配色：蓝色、灰白、深灰、收入绿">${['#315bdb','#edf2ff','#f6f7f9','#192338','#087c62'].map(color=>`<i style="--swatch:${color}"></i>`).join('')}<span>+ 清晰的数字层级</span></div><div class="feature-actions"><a class="primary-btn" href="${s.demo}">体验 App ${icon('arrow')}</a><a class="secondary-btn" href="read.html?style=${s.id}">${icon('code')} 阅读规范</a></div><div class="feature-minor"><a href="${s.preview}">组件预览 ↗</a><a href="${s.design}" download>下载 DESIGN.md ↓</a></div></div><a class="feature-visual" href="${s.demo}" aria-label="打开清账 App 演示"><div class="mini-phone"><iframe src="${s.demo}?embed=1" title="清账总览界面缩略预览" loading="lazy" tabindex="-1" aria-hidden="true"></iframe></div><span class="visual-caption"><i></i> 4 个页面 · 可交互演示</span></a></article>`;}
function referenceCard(s){return `<article class="reference-card"><div class="reference-art" style="--accent:${s.accent}" aria-label="${esc(s.name)} 规范配色示意，非网站截图"><span class="reference-initial">${esc(s.name.slice(0,2))}<span style="color:var(--accent)">.</span></span><span></span></div><div class="reference-copy"><h3>${esc(s.name)}</h3><p class="reference-category">${esc(s.categoryLabel)} · 品牌参考</p><p class="reference-description" lang="en">${esc(s.description)}</p><div class="reference-actions"><a href="read.html?style=${encodeURIComponent(s.id)}">阅读规范 ↗</a><a href="${s.external}" target="_blank" rel="noreferrer" aria-label="${esc(s.name)} 外部预览，新窗口打开">外部预览 ↗</a></div></div></article>`;}
function render(){
  if(!catalog)return;
  const searching=search.trim().length>0;
  const words=search.trim().toLowerCase().split(/\s+/);
  const filtered=catalog.styles.filter(s=>(searching||selected==='all'||s.category===selected)&&(kind==='all'||s.kind===kind)&&(!searching||words.every(w=>`${s.name} ${s.subtitle} ${s.description} ${s.tags.join(' ')} ${s.id}`.toLowerCase().includes(w))));
  document.querySelector('#category-title').innerHTML=`${searching?'搜索结果':selected==='all'?'全部风格':catalog.categories.find(c=>c.id===selected)?.label||'全部风格'} <span>${filtered.length}</span>`;
  document.querySelectorAll('[data-category]').forEach(el=>{const active=el.dataset.category===selected;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});
  document.querySelectorAll('[data-kind]').forEach(el=>{const active=el.dataset.kind===kind;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});
  document.querySelector('#search-context').hidden=!searching;
  document.querySelector('#results-note').textContent=selected==='bookkeeping'&&!searching?'从完整应用开始，找到适合你的设计':'品牌卡片展示规范配色；实际页面请打开外部预览';
  const originals=filtered.filter(s=>s.kind==='original'),references=filtered.filter(s=>s.kind==='reference');
  results.innerHTML=filtered.length?`${originals.map(originalCard).join('')}${originals.length?`<p class="collection-footnote">${icon('info')} 原创条目包含应用演示；品牌参考保留原项目规范及外部预览。</p>`:''}${references.length?`${originals.length?'<h3 class="references-heading">品牌设计参考</h3>':''}<div class="reference-grid">${references.map(referenceCard).join('')}</div>`:''}`:`<div class="empty-results">${icon('search')}<h3>暂时没有匹配的风格</h3><p>换个关键词，或切换到“全部”来源试试。</p><button class="secondary-btn" id="reset-filters">查看全部风格</button></div>`;
  const next=new URL(location.href);next.search='';if(selected!=='bookkeeping')next.searchParams.set('category',selected);if(searching)next.searchParams.set('q',search);history.replaceState(null,'',next);
}
function selectCategory(id){selected=id;kind='all';search='';searchInput.value='';render();}
document.addEventListener('click',e=>{
  const category=e.target.closest('[data-category]');if(category){selectCategory(category.dataset.category);return;}
  const tab=e.target.closest('[data-kind]');if(tab){kind=tab.dataset.kind;render();return;}
  if(e.target.closest('#reset-filters'))selectCategory('all');
  if(e.target.closest('#clear-search')){search='';searchInput.value='';render();}
});
searchInput.addEventListener('input',e=>{search=e.target.value;render();});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();searchInput.focus();}});
try{
  const response=await fetch('./styles.json');if(!response.ok)throw new Error(`HTTP ${response.status}`);catalog=await response.json();
  if(!['all',...catalog.categories.map(c=>c.id)].includes(selected))selected='bookkeeping';
  document.querySelector('#app-categories').innerHTML=catalog.categories.filter(c=>c.id==='bookkeeping').map(categoryButton).join('');
  document.querySelector('#reference-categories').innerHTML=catalog.categories.filter(c=>c.id!=='bookkeeping').map(categoryButton).join('');
  document.querySelector('#all-count').textContent=catalog.styles.length;
  document.querySelector('#reference-count').textContent=catalog.styles.filter(s=>s.kind==='reference').length;
  searchInput.value=search;render();
}catch(error){results.innerHTML='<div class="load-error">风格目录未能载入。请通过本地 HTTP 服务打开页面（例如在仓库根目录运行 node scripts/serve.mjs），然后刷新重试。</div>';console.error('Catalog load failed',error);}

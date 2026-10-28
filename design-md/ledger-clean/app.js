import {icon,escapeHTML as esc} from './icons.js';
import {STORAGE_KEY,CATEGORIES,ACCOUNTS,category,money,seed,parseAmount,validDate,validState,summary,breakdown} from './model.js';

const params = new URLSearchParams(location.search);
if (params.has('embed')) document.body.classList.add('embed');
const app = document.querySelector('#app');
const dialog = document.querySelector('#detail-dialog');
const toast = document.querySelector('#toast');
const knownViews = ['home','bills','add','stats'];
let view = knownViews.includes(params.get('view')) ? params.get('view') : 'home';
let month = '2026-10';
let filter = 'all';
let search = '';
let storageWarning = '';
let data = seed();
let draft = freshDraft();
let toastTimer;

function freshDraft() {return {type:'expense',category:'food',amount:'',date:`${month}-28`,note:'',account:'日常账户'};}
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const candidate = JSON.parse(saved);
    if (validState(candidate)) data = candidate;
    else storageWarning = '本地示例数据格式异常，已载入初始账本。可通过“关于演示”重置。';
  }
} catch {storageWarning = '浏览器存储不可用或数据无法读取；当前操作仍可体验，刷新可能丢失。';}

function persist() {
  try {localStorage.setItem(STORAGE_KEY,JSON.stringify(data));return true;}
  catch {storageWarning = '当前改动仅保留在本页内存中，刷新可能丢失；浏览器存储不可用。';return false;}
}
function notify(text) {clearTimeout(toastTimer);toast.textContent=text;toast.hidden=false;toastTimer=setTimeout(()=>toast.hidden=true,3800);}
function catBadge(c) {return `<span class="cat-icon" style="--cat-bg:${c.bg};--cat-color:${c.color}">${icon(c.icon)}</span>`;}
function monthBar() {
  const [year,number] = month.split('-');
  return `<div class="month-bar"><span class="month-value">${year} 年 ${Number(number)} 月</span><div class="month-controls"><button class="icon-btn" data-action="previous" aria-label="上个月" ${month==='1900-01'?'disabled':''}>${icon('back')}</button><button class="icon-btn" data-action="next" aria-label="下个月" ${month==='2100-12'?'disabled':''}>${icon('back','rotate')}</button></div></div>`;
}
function entryRow(e) {
  const c = category(e.category);
  return `<button class="transaction" data-entry="${esc(e.id)}" aria-label="${esc(e.note || c.name)}，${e.type==='income'?'收入':'支出'} ${money(e.amount)} 元，查看详情">${catBadge(c)}<span class="txn-copy"><span class="txn-name">${esc(e.note || c.name)}</span><span class="txn-meta">${c.name} · ${esc(e.account)}</span></span><span class="txn-value num ${e.type==='income'?'income-color':''}">${e.type==='income'?'+':'−'}${money(e.amount)}</span></button>`;
}
function grouped(entries,fullDayTotals=false) {
  if (!entries.length) return `<div class="empty-state">${icon('list')}<strong>这里还没有账单</strong>试试换个筛选条件，或记下第一笔。</div>`;
  const dates = [...new Set(entries.map(e=>e.date))];
  return dates.map(date=>{
    const rows = entries.filter(e=>e.date===date);
    const summedRows=fullDayTotals?data.entries.filter(e=>e.date===date):rows;
    const sum = summedRows.filter(e=>e.type==='expense').reduce((a,e)=>a+e.amount,0);
    const d = new Date(`${date}T12:00:00`);
    return `<div class="day-label"><span>${Number(date.slice(5,7))} 月 ${Number(date.slice(8))} 日 · ${['周日','周一','周二','周三','周四','周五','周六'][d.getDay()]}</span><span>支出 ¥${money(sum)}</span></div>${rows.map(entryRow).join('')}`;
  }).join('');
}
function home() {
  const s = summary(data,month);
  const percent = Math.round(s.expense/s.budget*100);
  return `${monthBar()}<section class="balance-card" aria-label="本月收支概览"><div class="balance-top"><span>本月结余</span><span>个人账本</span></div><div class="big-amount num"><span class="currency">¥</span>${money(s.balance)}</div><div class="income-expense"><div><div class="amount-label">${icon('downLeft','income-color')} 本月收入</div><strong class="num income-color">${money(s.income)}</strong></div><div><div class="amount-label">${icon('upRight')} 本月支出</div><strong class="num">${money(s.expense)}</strong></div></div></section>
  <section class="budget-card ${s.expense>s.budget?'over-budget':''}" aria-label="月度预算"><div class="budget-title"><span>月度预算 <span class="muted num">¥${money(s.budget)}</span></span><button data-action="budget" aria-label="编辑月度预算">编辑</button></div><div class="progress" role="progressbar" aria-label="月度预算使用比例" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100,percent)}" aria-valuetext="已使用 ${percent}%"><span style="width:${Math.min(100,percent)}%"></span></div><div class="budget-meta"><span>${s.expense>s.budget?'已超预算':'还可支出'} <b class="num">¥${money(Math.abs(s.budget-s.expense))}</b></span><span>已使用 ${percent}%</span></div></section>
  <button class="primary-btn quick-add" data-view="add">${icon('plus')} 记一笔</button><div class="section-heading"><h2>最近账单</h2><button class="text-btn" data-view="bills">查看全部 ${icon('arrow')}</button></div>${grouped(s.entries.slice(0,4),true)}`;
}
function filteredEntries() {return summary(data,month).entries.filter(e=>(filter==='all'||e.type===filter)&&`${e.note} ${category(e.category).name} ${e.account} ${e.date}`.toLowerCase().includes(search.toLowerCase().trim()));}
function bills() {
  const s = summary(data,month);
  return `${monthBar()}<div class="small-summary"><span>共 ${s.entries.length} 笔账单<strong>收支一目了然</strong></span><span>收入<strong class="num income-color">+${money(s.income)}</strong></span><span>支出<strong class="num">−${money(s.expense)}</strong></span></div><div class="search-field">${icon('search')}<label class="sr-only" for="bill-search">搜索账单</label><input id="bill-search" type="search" placeholder="搜索备注、分类或账户" value="${esc(search)}" maxlength="80"></div><div class="filters" role="group" aria-label="收支类型筛选">${[['all','全部'],['expense','支出'],['income','收入']].map(([key,title])=>`<button class="filter-chip ${filter===key?'active':''}" data-filter="${key}" aria-pressed="${filter===key}">${title}</button>`).join('')}</div><div id="bill-results" aria-live="polite">${grouped(filteredEntries())}</div>`;
}
function add() {
  return `<form id="entry-form" class="entry-form" novalidate><div class="segmented" role="group" aria-label="记账类型">${[['expense','支出'],['income','收入']].map(([key,title])=>`<button type="button" data-type="${key}" class="${draft.type===key?'active':''}" aria-pressed="${draft.type===key}">${title}</button>`).join('')}</div><div class="amount-field"><label for="amount" class="field-caption">${draft.type==='expense'?'支出':'收入'}金额</label><div class="amount-input-wrap"><span>¥</span><input id="amount" name="amount" type="text" inputmode="decimal" autocomplete="off" placeholder="0.00" value="${esc(draft.amount)}" maxlength="10" aria-describedby="entry-error"></div></div><div><span class="field-caption">选择分类</span><div class="category-grid" role="group" aria-label="记账分类">${CATEGORIES.filter(c=>c.type===draft.type).map(c=>`<button type="button" class="category-btn ${draft.category===c.id?'active':''}" data-category="${c.id}" aria-pressed="${draft.category===c.id}">${catBadge(c)}<span>${c.name}</span></button>`).join('')}</div></div><div class="form-details"><div class="form-row"><label for="entry-account">账户</label><select id="entry-account" name="account">${ACCOUNTS.map(a=>`<option ${draft.account===a?'selected':''}>${a}</option>`).join('')}</select></div><div class="form-row"><label for="entry-date">日期</label><input id="entry-date" name="date" type="date" min="1900-01-01" max="2100-12-31" value="${draft.date}"></div><div class="form-row"><label for="entry-note">备注</label><input id="entry-note" name="note" type="text" maxlength="80" placeholder="写点什么，方便以后查找" value="${esc(draft.note)}"></div></div><p class="form-error" id="entry-error" role="alert" hidden></p><div class="form-actions"><button type="submit" class="primary-btn">保存这笔${draft.type==='expense'?'支出':'收入'} ${icon('check')}</button><p class="form-hint">演示账本 · 仅保存在当前浏览器</p></div></form>`;
}
function trend(entries) {
  const [year,m] = month.split('-').map(Number);
  const days = new Date(year,m,0).getDate();
  let cumulative=0;
  const totals=Array.from({length:days},(_,i)=>{cumulative+=entries.filter(e=>e.type==='expense'&&Number(e.date.slice(-2))===i+1).reduce((a,e)=>a+e.amount,0);return cumulative;});
  const max = Math.max(...totals,1);
  const points=totals.map((n,i)=>`${8+i/(days-1)*280},${96-n/max*80}`).join(' ');
  const last=totals.at(-1);
  return `<svg class="trend-chart" viewBox="0 0 300 110" role="img" aria-label="${Number(month.slice(5))} 月每日累计支出，月末总计 ${money(last)} 元"><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#315bdb" stop-opacity=".13"/><stop offset="100%" stop-color="#315bdb" stop-opacity="0"/></linearGradient></defs><path d="M8 16H288M8 56H288M8 96H288" stroke="#edf0f5" stroke-dasharray="3 4" fill="none"/><polygon points="8,102 ${points} 288,102" fill="url(#chart-fill)"/><polyline points="${points}" fill="none" stroke="#315bdb" stroke-width="2.5" stroke-linejoin="round"/><circle cx="288" cy="${96-last/max*80}" r="3.5" fill="#315bdb" stroke="#fff" stroke-width="2"/></svg><div class="chart-axis"><span>1 日</span><span>10 日</span><span>20 日</span><span>${days} 日</span></div>`;
}
function stats() {
  const s=summary(data,month), groups=breakdown(s.entries);
  let stop=0;
  const gradient=groups.map(c=>{const start=stop;stop+=c.amount/s.expense*100;return `${c.color} ${start}% ${stop}%`;}).join(',');
  return `${monthBar()}<section class="chart-card"><div class="chart-head"><h2>本月支出累计</h2><span>人民币 / CNY</span></div><div class="trend-total num">¥ ${money(s.expense)}</div>${trend(s.entries)}</section><section class="chart-card"><div class="chart-head"><h2>钱都花在哪里</h2><span>${groups.length} 个分类</span></div>${groups.length?`<div class="donut-layout"><div class="donut" style="background:conic-gradient(${gradient})" role="img" aria-label="支出分类占比，详情见下方分类列表"><div class="donut-center"><span>最大支出</span><strong>${groups[0].name}</strong><span>${Math.round(groups[0].amount/s.expense*100)}%</span></div></div><div class="chart-legend">${groups.slice(0,4).map(c=>`<div class="legend-line"><i class="color-dot" style="--dot:${c.color}"></i><span>${c.name}</span><span class="num">${(c.amount/s.expense*100).toFixed(1)}%</span></div>`).join('')}${groups.length>4?`<span class="muted">其余 ${groups.length-4} 类见下方</span>`:''}</div></div>`:`<div class="empty-state">${icon('chart')}<strong>还没有支出数据</strong>记下一笔支出，这里就会生成统计。</div>`}</section><div class="section-heading"><h2>分类支出</h2><span class="muted" style="font-size:10px">按金额排序</span></div>${groups.map(c=>`<div class="rank-item">${catBadge(c)}<div class="rank-copy" style="--cat-color:${c.color}"><div class="rank-label"><span>${c.name} <span class="muted">${(c.amount/s.expense*100).toFixed(1)}%</span></span><strong class="num">¥${money(c.amount)}</strong></div><div class="progress"><span style="width:${c.amount/groups[0].amount*100}%"></span></div></div></div>`).join('')}<p class="stats-note">统计来自当前示例账本；切换月份或新增账单后会重新计算。金额四舍五入显示，不用颜色作为唯一的分类依据。</p>`;
}
function render() {
  const titles={home:['把生活，记清楚。','我的账本'],bills:['每一笔都有迹可循','账单明细'],add:['好好记录，慢慢积累','记一笔'],stats:['看见数字背后的生活','收支统计']};
  app.innerHTML=`<header class="app-header"><div><p class="greeting">${titles[view][0]}</p><h1 class="app-title">${titles[view][1]}</h1></div><button class="avatar" data-action="about" aria-label="关于演示与重置数据">清</button></header>${storageWarning?`<div class="storage-warning" role="status">${esc(storageWarning)}</div>`:''}<div class="app-scroll" id="app-scroll">${({home,bills,add,stats})[view]()}</div><nav class="bottom-nav" aria-label="应用导航">${[['home','home','总览'],['bills','list','账单'],['add','plus','记一笔'],['stats','chart','统计']].map(([key,name,label])=>`<button class="nav-btn ${key===view?'active':''} ${key==='add'?'add-nav':''}" data-view="${key}" ${key===view?'aria-current="page"':''}><span class="nav-icon">${icon(name)}</span><span>${label}</span></button>`).join('')}</nav>`;
  app.querySelector('#entry-form')?.addEventListener('submit',saveEntry);
  app.querySelector('#bill-search')?.addEventListener('input',e=>{search=e.target.value;app.querySelector('#bill-results').innerHTML=grouped(filteredEntries());});
}
function captureDraft() {
  const form=app.querySelector('#entry-form');if (!form) return;
  const values=new FormData(form);for (const key of ['amount','date','note','account']) draft[key]=String(values.get(key)||'');
}
function go(next) {if(view==='add')captureDraft();view=next;render();}
function showError(message,field='amount') {
  const error=app.querySelector('#entry-error');error.textContent=message;error.hidden=false;
  const input=app.querySelector(`[name="${field}"]`);input?.setAttribute('aria-invalid','true');input?.focus();error.scrollIntoView({block:'nearest'});
}
function saveEntry(event) {
  event.preventDefault();captureDraft();
  app.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
  const amount=parseAmount(draft.amount.trim());
  if(amount===null)return showError('请输入大于 0 的金额，最多两位小数，上限 9,999,999.99 元。');
  if(!validDate(draft.date))return showError('请选择有效日期（1900–2100 年）。','date');
  if(!ACCOUNTS.includes(draft.account))return showError('请选择有效账户。','account');
  if(draft.note.length>80)return showError('备注最多 80 个字符。','note');
  if(data.entries.length>=10000)return showError('演示账本已达到 10,000 笔上限，请先删除部分数据。');
  const entry={...draft,amount,id:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`};
  data.entries.unshift(entry);month=draft.date.slice(0,7);const saved=persist();draft=freshDraft();view='home';render();notify(saved?'已保存，今天也记得很清楚。':'已添加至本页，刷新可能丢失。');
}
function showDialog(html) {dialog.innerHTML=html;dialog.showModal();}
const dialogTop=title=>`<div class="sheet-top"><h2>${title}</h2><button class="icon-btn" data-close aria-label="关闭弹窗">${icon('close')}</button></div>`;
function showEntry(id) {
  const e=data.entries.find(e=>e.id===id);if(!e)return;
  showDialog(`${dialogTop('账单详情')}<div class="detail-amount num ${e.type==='income'?'income-color':''}">${e.type==='income'?'+':'−'}¥${money(e.amount)}</div>${[['类型',e.type==='income'?'收入':'支出'],['分类',category(e.category).name],['账户',e.account],['日期',e.date],['备注',e.note||'未填写']].map(([label,value])=>`<div class="detail-row"><span>${label}</span><strong>${esc(value)}</strong></div>`).join('')}<button class="delete-btn" id="delete-entry">删除这笔账单</button>`);
  dialog.querySelector('#delete-entry').addEventListener('click',()=>{
    // The second, explicit confirmation keeps a mis-tap recoverable until this point.
    if(!confirm('确定删除这笔示例账单？此操作无法撤销。'))return;
    data.entries=data.entries.filter(row=>row.id!==id);const saved=persist();dialog.close();render();notify(saved?'账单已删除':'已在本页删除，浏览器存储未更新');
  });
}
function showBudget() {
  showDialog(`${dialogTop('设置月度预算')}<p>为 ${month.replace('-',' 年 ')} 月设置支出预算。预算不会改变已记录的账单。</p><form id="budget-form" novalidate><label class="field-caption" for="budget-amount">预算金额（元）</label><input class="budget-input num" id="budget-amount" inputmode="decimal" value="${(summary(data,month).budget/100).toFixed(2)}" maxlength="10" aria-describedby="budget-error"><p id="budget-error" role="alert" hidden class="form-error"></p><button class="primary-btn" type="submit">保存预算</button></form>`);
  dialog.querySelector('#budget-form').addEventListener('submit',event=>{
    event.preventDefault();const input=dialog.querySelector('#budget-amount');const amount=parseAmount(input.value.trim());
    if(amount===null){const error=dialog.querySelector('#budget-error');error.textContent='预算须大于 0，最多两位小数，上限 9,999,999.99 元。';error.hidden=false;input.setAttribute('aria-invalid','true');input.focus();return;}
    data.budgets[month]=amount;const saved=persist();dialog.close();render();notify(saved?'月度预算已更新':'预算已在本页更新，刷新可能丢失');
  });
}
function reset() {
  if(!confirm('将清除你在这个演示中新增的账单和预算，恢复初始示例。继续吗？'))return;
  data=seed();storageWarning='';month='2026-10';view='home';draft=freshDraft();filter='all';search='';const saved=persist();if(dialog.open)dialog.close();render();notify(saved?'示例账本已重置':'已重置本页；浏览器存储不可用');
}
function about() {
  showDialog(`${dialogTop('关于这个演示')}<p>清账 Clear Ledger 是“清爽工具型”记账设计演示，包含总览、账单、记一笔和统计。</p><p>所有初始记录均为虚构数据。改动仅保存到当前浏览器，无登录、云同步或后端服务。请勿在演示中填写真实敏感信息。</p><p><a href="../../catalog/index.html">返回风格库</a> · <a href="spec.html">阅读设计规范</a></p><button class="delete-btn" id="reset-in-dialog">重置示例账本</button>`);
  dialog.querySelector('#reset-in-dialog').addEventListener('click',reset);
}
app.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.view){go(button.dataset.view);return;}
  if(button.dataset.entry){showEntry(button.dataset.entry);return;}
  if(button.dataset.filter){filter=button.dataset.filter;render();return;}
  if(button.dataset.type){captureDraft();draft.type=button.dataset.type;draft.category=CATEGORIES.find(c=>c.type===draft.type).id;render();return;}
  if(button.dataset.category){captureDraft();draft.category=button.dataset.category;const scroll=app.querySelector('#app-scroll').scrollTop;render();app.querySelector('#app-scroll').scrollTop=scroll;return;}
  const action=button.dataset.action;
  if(action==='budget')showBudget();
  if(action==='about')about();
  if(action==='previous'||action==='next'){
    const [year,m]=month.split('-').map(Number);const d=new Date(year,m-1+(action==='next'?1:-1),1);month=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;render();
  }
});
dialog.addEventListener('click',e=>{if(e.target.closest('[data-close]'))dialog.close();});
document.querySelector('#reset-demo').addEventListener('click',reset);
render();

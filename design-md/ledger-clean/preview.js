import {icon,escapeHTML as esc} from './icons.js';
import {CATEGORIES,category,money,parseAmount,seed} from './model.js';
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
const css=getComputedStyle(document.documentElement);
const colors=[['primary','操作蓝'],['primary-soft','选中浅蓝'],['canvas','页面画布'],['surface','内容表面'],['ink','主要文字'],['body','正文'],['muted','辅助文字'],['income','收入'],['danger','错误／超预算'],['line','分隔线']];
document.querySelector('#swatches').innerHTML=colors.map(([token,title])=>{const hex=css.getPropertyValue(`--${token}`).trim();return `<div class="swatch"><div class="swatch-color" style="background:${hex}"></div><div class="swatch-copy"><span>${title}</span><code>--${token}<br>${hex}</code></div></div>`;}).join('');
document.querySelector('#preview-categories').innerHTML=CATEGORIES.filter(c=>c.type==='expense').map((c,i)=>`<button class="category-btn ${i===0?'active':''}" data-preview-category="${c.id}" aria-pressed="${i===0}"><span class="cat-icon" style="--cat-bg:${c.bg};--cat-color:${c.color}">${icon(c.icon)}</span><span>${c.name}</span></button>`).join('');
document.querySelector('#preview-transactions').innerHTML=[seed().entries[0],seed().entries[8]].map(e=>{const c=category(e.category);return `<a class="transaction" href="demo.html?view=bills"><span class="cat-icon" style="--cat-bg:${c.bg};--cat-color:${c.color}">${icon(c.icon)}</span><span class="txn-copy"><span class="txn-name">${esc(e.note)}</span><span class="txn-meta">${c.name} · ${e.account}</span></span><span class="txn-value num ${e.type==='income'?'income-color':''}">${e.type==='income'?'+':'−'}${money(e.amount)}</span></a>`;}).join('');
const feedback=document.querySelector('#preview-feedback');
document.querySelector('#preview-save').addEventListener('click',()=>{feedback.textContent='这是保存成功的反馈示例；没有添加任何账单。完整流程请打开 App 演示。';feedback.hidden=false;});
document.addEventListener('click',e=>{
  const type=e.target.closest('[data-preview-type]');
  if(type){document.querySelectorAll('[data-preview-type]').forEach(el=>{const active=el===type;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});document.querySelector('#preview-type-label').textContent=`当前选择：${type.dataset.previewType==='expense'?'支出':'收入'}`;}
  const category=e.target.closest('[data-preview-category]');
  if(category)document.querySelectorAll('[data-preview-category]').forEach(el=>{const active=el===category;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});
});
document.querySelector('#preview-form').addEventListener('submit',e=>{
  e.preventDefault();const input=document.querySelector('#preview-amount'),error=document.querySelector('#preview-form-error'),amount=parseAmount(input.value.trim());
  if(amount===null){input.setAttribute('aria-invalid','true');error.textContent='请输入大于 0 的金额，最多两位小数，上限 9,999,999.99 元。';error.hidden=false;input.focus();}
  else{input.removeAttribute('aria-invalid');error.hidden=true;feedback.textContent=`金额校验通过：¥${money(amount)}。此处只演示校验，不写入账本。`;feedback.hidden=false;feedback.scrollIntoView({block:'center',behavior:'smooth'});}
});

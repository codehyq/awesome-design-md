import {escapeHTML as esc} from '../design-md/ledger-clean/icons.js';
const catalogURL=new URL('./styles.json',import.meta.url);
let docURL;
function inline(text){
  return text.split(/(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*)/g).map(part=>{
    const link=part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if(link){try{const target=new URL(link[2],docURL);if(['http:','https:'].includes(target.protocol))return `<a href="${esc(target.href)}" ${target.origin!==location.origin?'target="_blank" rel="noreferrer"':''}>${esc(link[1])}</a>`;}catch{}return esc(link[1]);}
    if(part.startsWith('`')&&part.endsWith('`'))return `<code>${esc(part.slice(1,-1))}</code>`;
    if(part.startsWith('**')&&part.endsWith('**'))return `<strong>${esc(part.slice(2,-2))}</strong>`;
    return esc(part);
  }).join('');
}
function markdown(source){
  const lines=source.replace(/\r\n/g,'\n').split('\n');
  let out='',toc=[],section=0,i=0;
  if(lines[0]==='---'){
    const end=lines.indexOf('---',1);if(end>0){out+=`<details><summary>查看结构化设计 Token（YAML）</summary><pre><code>${esc(lines.slice(1,end).join('\n'))}</code></pre></details>`;i=end+1;}
  }
  for(;i<lines.length;i++){
    const line=lines[i];if(!line.trim())continue;
    if(line.startsWith('```')){const code=[];while(++i<lines.length&&!lines[i].startsWith('```'))code.push(lines[i]);out+=`<pre><code>${esc(code.join('\n'))}</code></pre>`;continue;}
    const heading=line.match(/^(#{1,4})\s+(.+)$/);
    if(heading){const level=heading[1].length,id=`section-${section++}`;if(level===2)toc.push({id,title:heading[2]});out+=`<h${level} id="${id}">${inline(heading[2])}</h${level}>`;continue;}
    if(line.startsWith('|')&&/^\|[\s:|\-]+\|\s*$/.test(lines[i+1]||'')){
      const cells=row=>row.trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim());
      out+=`<div class="table-scroll"><table><thead><tr>${cells(line).map(c=>`<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>`;i++;
      while(i+1<lines.length&&lines[i+1].startsWith('|')){i++;out+=`<tr>${cells(lines[i]).map(c=>`<td>${inline(c)}</td>`).join('')}</tr>`;}
      out+='</tbody></table></div>';continue;
    }
    if(/^\s*[-*]\s+/.test(line)){out+='<ul>';do{out+=`<li>${inline(lines[i].replace(/^\s*[-*]\s+/,''))}</li>`;i++;}while(i<lines.length&&/^\s*[-*]\s+/.test(lines[i]));i--;out+='</ul>';continue;}
    if(/^\d+\.\s/.test(line)){out+='<ol>';do{out+=`<li>${inline(lines[i].replace(/^\d+\.\s/,''))}</li>`;i++;}while(i<lines.length&&/^\d+\.\s/.test(lines[i]));i--;out+='</ol>';continue;}
    if(line.startsWith('>')){out+=`<blockquote>${inline(line.replace(/^>\s?/,''))}</blockquote>`;continue;}
    if(/^---+$/.test(line.trim())){out+='<hr>';continue;}
    out+=`<p>${inline(line)}</p>`;
  }
  return {html:out,toc};
}
try{
  const response=await fetch(catalogURL);if(!response.ok)throw new Error('目录载入失败');
  const catalog=await response.json();const id=document.body.dataset.style||new URLSearchParams(location.search).get('style');
  const style=catalog.styles.find(s=>s.id===id);if(!style)throw new Error('未找到这个风格，请返回风格库重新选择。');
  docURL=new URL(style.design,catalogURL);const raw=await fetch(docURL);if(!raw.ok)throw new Error('设计规范暂时无法读取。');
  const parsed=markdown(await raw.text());
  document.title=`${style.name} · DESIGN.md`;
  document.querySelector('#reader-title').textContent=style.name;
  document.querySelector('#reader-meta').textContent=`${style.kind==='original'?'原创应用风格':'品牌设计参考'} / ${style.categoryLabel}`;
  document.querySelector('#reader-lead').textContent=style.description;
  const download=document.querySelector('#download');download.href=docURL;download.hidden=false;
  const action=(path,title)=>`<a href="${esc(new URL(path,catalogURL).href)}">${title} ↗</a>`;
  document.querySelector('#reader-actions').innerHTML=style.kind==='original'?action(style.demo,'体验 App')+action(style.preview,'组件预览'):action(style.external,'打开外部预览');
  document.querySelector('#markdown').innerHTML=parsed.html;
  document.querySelector('#toc').innerHTML=parsed.toc.map(t=>`<a href="#${t.id}">${esc(t.title)}</a>`).join('');
}catch(error){document.querySelector('#reader-title').textContent='规范未能载入';document.querySelector('#markdown').innerHTML=`<div class="reader-error">${esc(error.message)} 请使用 HTTP 服务访问页面。<br><a href="${new URL('./index.html',import.meta.url).href}">返回风格库</a></div>`;}

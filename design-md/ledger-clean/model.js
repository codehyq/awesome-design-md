export const STORAGE_KEY = 'clear-ledger-demo-v1';
export const CATEGORIES = [
  {id:'food',name:'餐饮',icon:'food',color:'#a3652b',bg:'#fff3e3',type:'expense'},
  {id:'coffee',name:'咖啡',icon:'coffee',color:'#93674e',bg:'#f5eee9',type:'expense'},
  {id:'grocery',name:'日用',icon:'bag',color:'#4764d5',bg:'#edf1ff',type:'expense'},
  {id:'transport',name:'交通',icon:'train',color:'#23788b',bg:'#e8f5f7',type:'expense'},
  {id:'home',name:'居住',icon:'house',color:'#7660b6',bg:'#f1edfa',type:'expense'},
  {id:'fun',name:'娱乐',icon:'play',color:'#ad5475',bg:'#fceef3',type:'expense'},
  {id:'books',name:'学习',icon:'book',color:'#397e66',bg:'#eaf5ee',type:'expense'},
  {id:'sport',name:'运动',icon:'sport',color:'#65802b',bg:'#f1f5e5',type:'expense'},
  {id:'salary',name:'工资',icon:'salary',color:'#138469',bg:'#e8f6ef',type:'income'},
  {id:'gift',name:'红包',icon:'gift',color:'#ad5475',bg:'#fceef3',type:'income'},
  {id:'other',name:'其他收入',icon:'other',color:'#4764d5',bg:'#edf1ff',type:'income'},
];
export const ACCOUNTS = ['日常账户','银行卡','现金'];
export const category = id => CATEGORIES.find(c => c.id === id);
export const money = cents => (cents / 100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
export const seed = () => ({version:1,budgets:{'2026-10':500000,'2026-09':500000},entries:[
  {id:'e1',type:'expense',category:'food',amount:3250,date:'2026-10-28',note:'工作日午餐',account:'日常账户'},
  {id:'e2',type:'expense',category:'coffee',amount:1680,date:'2026-10-28',note:'一杯拿铁',account:'日常账户'},
  {id:'e3',type:'expense',category:'grocery',amount:26800,date:'2026-10-27',note:'周末超市补给',account:'银行卡'},
  {id:'e4',type:'expense',category:'transport',amount:450,date:'2026-10-27',note:'地铁出行',account:'日常账户'},
  {id:'e5',type:'expense',category:'home',amount:240000,date:'2026-10-26',note:'十月房租',account:'银行卡'},
  {id:'e6',type:'expense',category:'fun',amount:2500,date:'2026-10-26',note:'音乐会员',account:'日常账户'},
  {id:'e7',type:'expense',category:'grocery',amount:32000,date:'2026-10-25',note:'换季衣物',account:'银行卡'},
  {id:'e8',type:'expense',category:'sport',amount:12800,date:'2026-10-24',note:'羽毛球与场地',account:'日常账户'},
  {id:'e9',type:'income',category:'salary',amount:1280000,date:'2026-10-15',note:'十月工资',account:'银行卡'},
  {id:'e10',type:'expense',category:'books',amount:7600,date:'2026-10-10',note:'买了两本书',account:'日常账户'},
  {id:'e11',type:'expense',category:'food',amount:6500,date:'2026-10-05',note:'和朋友吃晚餐',account:'日常账户'},
  {id:'e12',type:'income',category:'salary',amount:1280000,date:'2026-09-15',note:'九月工资',account:'银行卡'},
  {id:'e13',type:'expense',category:'home',amount:240000,date:'2026-09-05',note:'九月房租',account:'银行卡'},
  {id:'e14',type:'expense',category:'grocery',amount:46800,date:'2026-09-20',note:'生活用品',account:'日常账户'},
]});
export function parseAmount(text) {
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction=''] = text.split('.');
  const cents = Number(whole)*100 + Number(fraction.padEnd(2,'0'));
  return cents > 0 && cents <= 999999999 ? cents : null;
}
export function validDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < '1900-01-01' || date > '2100-12-31') return false;
  const parsed = new Date(`${date}T12:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0,10) === date;
}
export function validState(data) {
  return data?.version === 1 && Array.isArray(data.entries) && data.entries.length <= 10000 &&
    data.entries.every(e => e && typeof e.id === 'string' && ['income','expense'].includes(e.type) && category(e.category)?.type === e.type && Number.isSafeInteger(e.amount) && e.amount > 0 && e.amount <= 999999999 && validDate(e.date) && typeof e.note === 'string' && e.note.length <= 80 && ACCOUNTS.includes(e.account)) &&
    new Set(data.entries.map(e=>e.id)).size === data.entries.length && data.budgets && typeof data.budgets === 'object' && !Array.isArray(data.budgets) &&
    Object.entries(data.budgets).every(([month,amount]) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month) && Number.isSafeInteger(amount) && amount>0 && amount<=999999999);
}
// Stable sorting keeps newly inserted entries first within the same date.
export const monthEntries = (data, month) => data.entries.filter(e=>e.date.startsWith(month)).sort((a,b)=>b.date.localeCompare(a.date));
export function summary(data, month) {
  const entries = monthEntries(data,month);
  const income = entries.filter(e=>e.type==='income').reduce((a,e)=>a+e.amount,0);
  const expense = entries.filter(e=>e.type==='expense').reduce((a,e)=>a+e.amount,0);
  return {entries,income,expense,balance:income-expense,budget:data.budgets[month] || 500000};
}
export function breakdown(entries) {
  return CATEGORIES.filter(c=>c.type==='expense').map(c=>({...c,amount:entries.filter(e=>e.type==='expense'&&e.category===c.id).reduce((a,e)=>a+e.amount,0)})).filter(c=>c.amount>0).sort((a,b)=>b.amount-a.amount);
}

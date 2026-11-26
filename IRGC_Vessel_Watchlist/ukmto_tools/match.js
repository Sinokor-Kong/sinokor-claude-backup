const fs=require('fs'),p=require('path');
const [, , PROBE, DB] = process.argv;
const r=JSON.parse(fs.readFileSync(PROBE,'utf8').replace(/^\uFEFF/,''));
// parse number from file name: WARNING/ADVISORY ... NNN[-_]26, update n
function parse(f){
  const s=f.replace(/\.pdf$/i,'');
  if(/daily_summary|jmic/i.test(s)) return null;
  const y=s.match(/^(\d{4})/); if(!y||y[1]!=='2026') return null;
  const m=s.match(/(?:WARNING|ADVISORY|ATTACK|ACTIVITY|INCIDENT|NOTICE)[^0-9]*?(\d{2,3})(?:[-_ ]+0?26)?/i);
  if(!m) return null;
  const n=String(+m[1]).padStart(3,'0');
  const u=s.match(/UPDATE[^0-9]*(\d+)/i); 
  const upd = u ? +u[1] : 0;
  return {num:n, upd};
}
const byNum={};
for(const x of r){const k=parse(x.file); if(!k) continue; const key=k.num+'|'+k.upd;
  (byNum[k.num]=byNum[k.num]||{}); if(!byNum[k.num][k.upd]) byNum[k.num][k.upd]=x;}
const docs=fs.readdirSync(DB).map(f=>JSON.parse(fs.readFileSync(p.join(DB,f))));
const need=new Set();for(const d of docs)for(const u of String(d.UKMTO||'').split('\n')){const m=u.match(/(\d{3})-26/); if(m) need.add(m[1]);}
let miss=[];for(const n of [...need].sort()){const h=byNum[n]; if(!h){miss.push(n);continue;} console.log(n, Object.keys(h).map(u=>u+':'+h[u].file).join(' || '));}
console.log('need',need.size,'missing',miss.length, miss.join(' '));
fs.writeFileSync(p.join(p.dirname(PROBE),'bynum.json'),JSON.stringify(byNum,null,1));

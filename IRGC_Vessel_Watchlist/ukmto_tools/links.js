// Adds "UKMTO REPORT" (one line per UKMTO line; space-separated GitHub URLs, original first then updates)
const fs=require('fs'),p=require('path');
const [, , DB, PDFDIR] = process.argv;
const BASE='https://sinokor-kong.github.io/sinokor-claude-backup/ukmto/';
const files=fs.readdirSync(PDFDIR).sort();
const byNum={};for(const f of files){const n=f.match(/_(\d{3})-26/)[1];(byNum[n]=byNum[n]||[]).push(f);}
for(const n in byNum) byNum[n].sort((a,b)=>(/UPDATE/.test(a)-/UPDATE/.test(b))||a.localeCompare(b));
const out={};
for(const f of fs.readdirSync(DB)){const d=JSON.parse(fs.readFileSync(p.join(DB,f)));const id=f.replace('.json','');
  const lines=String(d.UKMTO||'').split('\n');
  const val=lines.map(l=>{const m=l.match(/(\d{3})-26/);return m&&byNum[m[1]]?byNum[m[1]].map(x=>BASE+x).join(' '):'';});
  const v=val.some(Boolean)?val.join('\n'):'';
  if(v!==(d['UKMTO REPORT']||'')) out[id]=v;}
fs.writeFileSync(p.join(p.dirname(PDFDIR),'links.json'),JSON.stringify(out,null,1));
console.log(Object.keys(out).length,'docs to update');console.log(Object.keys(out).join(' '));

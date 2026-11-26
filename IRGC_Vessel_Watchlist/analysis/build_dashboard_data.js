// Builds the analysis files for the IRGC 위협 분석 dashboard from a live-DB dump.
// Usage: node build.js <dump dir with vessels/*.json> <out dir> <snapshot date YYYY-MM-DD>
const fs = require('fs'), path = require('path');
const [, , DUMP, OUT, SNAP] = process.argv;
const DIR = path.join(DUMP, 'vessels');
const rows = fs.readdirSync(DIR).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')));

const strip = s => String(s || '').replace(/[①-⑳]/g, '').trim();
const parts = s => String(s || '').split('\n').map(strip);

function region(loc) {
  const l = loc.toLowerCase();
  if (!l) return '위치 미상';
  if (/prior to entering|arabian gulf|\bag\b|in ag|al.?faw|qatar|jubail|jubayl|port rashid|kharg|uae ttw/.test(l)) return '아라비아만 (AG)';
  if (/gulf of oman|khor fakka|sohar|jask|dibba/.test(l)) return '오만만';
  if (/hormuz|khasab|lima|kumzar|musandam|dahit|shishah|cp-/.test(l)) return '호르무즈 해협';
  if (/oman/.test(l)) return '오만 연안 (지점 미상)';
  return '위치 미상';
}
function kindGroup(k) {
  k = String(k || '').toUpperCase();
  if (!k) return '미상';
  if (k === 'CRUDE OIL TANKER') return '원유선';
  if (/LPG|LNG/.test(k)) return '가스선 (LPG/LNG)';
  if (/CHEM|PRODUCT|OIL TANKER|ASPHALT|BUNKER|LR-/.test(k)) return '제품·케미컬선';
  if (/BULK/.test(k)) return '벌크선';
  if (/CONTAINER/.test(k)) return '컨테이너선';
  return '기타';
}

const vessels = [], incidents = [];
for (const r of rows) {
  const dates = parts(r['Iran Attack']).filter(Boolean);
  const types = parts(r['INCIDENT TYPE']), locs = parts(r.Location), uk = parts(r.UKMTO);
  const sinokor = /SINOKOR/i.test(r.Owner || '') ? 1 : 0;
  const base = {
    no: +r.NO, vessel: r['VESSEL NAME'] || '', imo: r.IMO || '', irgc_list: r.IRGC_LIST || '',
    kind: r.KINDS || '', kind_group: kindGroup(r.KINDS), size: r.SIZE || '',
    owner: r.Owner || '', owner_location: r['Owner Location'] || '', manager: r.Manager || '',
    flag: r.Flag || '', class: r.Class || '', sinokor,
  };
  const sorted = [...dates].sort();
  vessels.push({ ...base, attacked: dates.length ? 1 : 0, attack_count: dates.length, first_attack: sorted[0] || '', last_attack: sorted[sorted.length - 1] || '' });
  dates.forEach((d, i) => {
    const loc = locs[i] || locs[0] || '';
    incidents.push({
      no: base.no, vessel: base.vessel, date: d, month: d.slice(0, 7),
      type: types[i] || types[0] || '', region: region(loc), location: loc, ukmto: uk[i] || '',
      kind_group: base.kind_group, size: base.size, irgc_list: base.irgc_list, sinokor, manager: base.manager,
    });
  });
}
vessels.sort((a, b) => a.no - b.no);
incidents.sort((a, b) => a.date.localeCompare(b.date) || a.no - b.no);

const meta = [{ label: '원본', value: 'IRGC Vessel Watchlist 라이브 DB (vessels 컬렉션)' }, { label: '기준일', value: SNAP }];
const code = fs.readFileSync(__filename, 'utf8');
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'vessels.json'), JSON.stringify({ rows: vessels, meta: [...meta, { label: 'build.js', value: code, type: 'code', lang: 'javascript' }] }));
fs.writeFileSync(path.join(OUT, 'incidents.json'), JSON.stringify({ rows: incidents, meta: [...meta, { label: 'build.js', value: code, type: 'code', lang: 'javascript' }] }));

const c = (arr, k) => arr.reduce((m, x) => (m[x[k]] = (m[x[k]] || 0) + 1, m), {});
console.log('vessels', vessels.length, 'incidents', incidents.length);
console.log('region', c(incidents, 'region'));
console.log('kind_group', c(vessels, 'kind_group'));
console.log('type', c(incidents, 'type'));
for (const i of incidents.filter(i => i.region === '위치 미상' || i.region.startsWith('오만 연안'))) console.log('  ', i.no, i.vessel, JSON.stringify(i.location));
const sk = vessels.filter(v => v.sinokor), vl = vessels.filter(v => v.size === 'VLCC' && !v.sinokor);
console.log('sinokor', sk.length, sk.filter(v => v.attacked).length, 'other VLCC', vl.length, vl.filter(v => v.attacked).length);
